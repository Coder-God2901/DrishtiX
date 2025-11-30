"""
Cloud Run ETL Worker
Real-time data processing pipeline for EventSphere

Purpose:
- Clean, merge, and process all raw data streams
- Convert GPS to grid cells
- Merge CCTV + drone + attendee data
- Add weather, schedule, social signals
- Send final clean features to ML models

Replaces: Google Cloud Dataflow (cost-effective alternative)
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict
import asyncio
import time
from functools import wraps

from google.cloud import pubsub_v1, bigquery 
from google.cloud import firestore 
import numpy as np
from flask import Flask, request, jsonify  

# Configure logging with structured format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# GCP clients with error handling
project_id = os.getenv('GCP_PROJECT_ID')
if not project_id:
    logger.error("GCP_PROJECT_ID environment variable not set")
    raise ValueError("GCP_PROJECT_ID is required")

try:
    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()
    bq_client = bigquery.Client(project=project_id)
    db = firestore.Client(project=project_id)
    logger.info("GCP clients initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize GCP clients: {e}")
    raise

# Configuration with validation
# 50m x 50m grid cells
GRID_SIZE_METERS = int(os.getenv('GRID_SIZE_METERS', '50'))
# 60 seconds aggregation window
AGGREGATION_WINDOW = int(os.getenv('AGGREGATION_WINDOW', '60'))
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.7'))
MAX_CACHE_SIZE = int(os.getenv('MAX_CACHE_SIZE', '10000')
                     )  # Maximum items in cache per event
BATCH_SIZE = int(os.getenv('BATCH_SIZE', '100'))  # BigQuery batch insert size

# Topics
TOPIC_CROWD_DATA = f"projects/{project_id}/topics/crowd-density-updates"
TOPIC_PREDICTIONS = f"projects/{project_id}/topics/prediction-results"
TOPIC_RISK_ENGINE = f"projects/{project_id}/topics/risk-engine"

# In-memory cache for real-time aggregation with size limits
grid_cache: Dict[str, Dict[str, List[Dict[str, Any]]]
                 ] = defaultdict(lambda: defaultdict(list))
weather_cache: Dict[str, Dict[str, Any]] = {}
social_cache: Dict[str, Dict[str, Any]] = {}
schedule_cache: Dict[str, Dict[str, Any]] = {}

# Metrics tracking


class Metrics:
    """Track processing metrics for monitoring"""

    def __init__(self):
        self.processed_count = 0
        self.error_count = 0
        self.last_process_time = 0.0
        self.total_process_time = 0.0

    def record_success(self, duration: float):
        self.processed_count += 1
        self.last_process_time = duration
        self.total_process_time += duration

    def record_error(self):
        self.error_count += 1

    def get_stats(self) -> Dict[str, Any]:
        avg_time = self.total_process_time / \
            self.processed_count if self.processed_count > 0 else 0
        return {
            'processed_count': self.processed_count,
            'error_count': self.error_count,
            'avg_process_time_ms': avg_time * 1000,
            'last_process_time_ms': self.last_process_time * 1000
        }


metrics = Metrics()


def validate_input(func):
    """Decorator for input validation"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (KeyError, ValueError, TypeError) as e:
            logger.error(f"Input validation failed in {func.__name__}: {e}")
            raise
    return wrapper


def track_performance(func):
    """Decorator for performance tracking"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            metrics.record_success(duration)
            logger.info(f"{func.__name__} completed in {duration:.3f}s")
            return result
        except Exception as e:
            metrics.record_error()
            logger.error(f"{func.__name__} failed: {e}")
            raise
    return wrapper


@dataclass
class Location:
    lat: float
    lon: float


@dataclass
class GridCell:
    grid_id: str
    lat: float
    lon: float
    bounds: Dict[str, float]


@dataclass
class ProcessedFeatures:
    event_id: str
    grid_id: str
    timestamp: datetime
    location: Location

    # Crowd metrics
    density: float
    count: int
    density_level: str

    # Temporal features
    delta_t1: float  # 1-minute change
    delta_t5: float  # 5-minute change
    delta_t15: float  # 15-minute change

    # Contextual signals
    temperature: Optional[float] = None
    weather_condition: Optional[str] = None
    social_sentiment: Optional[float] = None
    panic_level: Optional[float] = None

    # Source attribution
    confidence: float = 1.0
    sources: List[str] = None  # type: ignore

    def __post_init__(self):
        if not self.sources:
            self.sources = []


class GridConverter:
    """Convert GPS coordinates to grid cells"""

    @staticmethod
    @validate_input
    def lat_lon_to_grid_id(lat: float, lon: float, grid_size: int = GRID_SIZE_METERS) -> str:
        """
        Convert GPS coordinates to grid cell ID
        Grid format: grid_{lat_index}_{lon_index}

        Args:
            lat: Latitude in degrees (-90 to 90)
            lon: Longitude in degrees (-180 to 180)
            grid_size: Size of grid cell in meters

        Returns:
            Grid cell ID string

        Raises:
            ValueError: If coordinates are invalid
        """
        # Validate coordinates
        if not (-90 <= lat <= 90):
            raise ValueError(f"Invalid latitude: {lat}")
        if not (-180 <= lon <= 180):
            raise ValueError(f"Invalid longitude: {lon}")

        # Convert meters to degrees (approximate)
        lat_step = grid_size / 111000  # 1 degree lat ≈ 111km
        lon_step = grid_size / (111000 * np.cos(np.radians(lat)))

        # Calculate grid indices
        lat_index = int(lat / lat_step)
        lon_index = int(lon / lon_step)

        return f"grid_{lat_index}_{lon_index}"

    @staticmethod
    def grid_id_to_bounds(grid_id: str, grid_size: int = GRID_SIZE_METERS) -> Dict[str, float]:
        """Get geographic bounds of a grid cell"""
        try:
            parts = grid_id.split('_')
            lat_index = int(parts[1])
            lon_index = int(parts[2])

            lat_step = grid_size / 111000
            lon_step = grid_size / \
                (111000 * np.cos(np.radians(lat_index * lat_step)))

            south = lat_index * lat_step
            north = (lat_index + 1) * lat_step
            west = lon_index * lon_step
            east = (lon_index + 1) * lon_step

            return {
                'north': north,
                'south': south,
                'east': east,
                'west': west
            }
        except Exception as e:
            logger.error(f"Error converting grid ID to bounds: {e}")
            return {'north': 0, 'south': 0, 'east': 0, 'west': 0}

    @staticmethod
    def grid_id_to_center(grid_id: str) -> Location:
        """Get center coordinates of a grid cell"""
        bounds = GridConverter.grid_id_to_bounds(grid_id)
        return Location(
            lat=(bounds['north'] + bounds['south']) / 2,
            lon=(bounds['east'] + bounds['west']) / 2
        )


class DataMerger:
    """Merge data from multiple sources into unified grid"""

    @staticmethod
    def merge_drone_data(drone_data: Dict[str, Any], event_id: str) -> List[Dict[str, Any]]:
        """Process drone heatmap into grid cells"""
        grid_cells = []

        try:
            heatmap = drone_data.get('heatmap', [])
            base_lat = drone_data['location']['lat']
            base_lon = drone_data['location']['lon']

            for i, row in enumerate(heatmap):
                for j, density in enumerate(row):
                    if density > 0:
                        # Calculate cell location
                        lat = base_lat + (i - len(heatmap) / 2) * \
                            (GRID_SIZE_METERS / 111000)
                        lon = base_lon + \
                            (j - len(row) / 2) * (GRID_SIZE_METERS /
                                                  (111000 * np.cos(np.radians(lat))))

                        grid_id = GridConverter.lat_lon_to_grid_id(lat, lon)

                        grid_cells.append({
                            'event_id': event_id,
                            'grid_id': grid_id,
                            'lat': lat,
                            'lon': lon,
                            'density': density,
                            # 4 sq m per person
                            'count': int(density * GRID_SIZE_METERS * GRID_SIZE_METERS / 4),
                            'source': 'DRONE',
                            'drone_id': drone_data.get('droneId'),
                            'timestamp': datetime.now()
                        })

            logger.info(
                f"Processed drone heatmap: {len(grid_cells)} grid cells")
        except Exception as e:
            logger.error(f"Error processing drone data: {e}")

        return grid_cells

    @staticmethod
    def merge_cctv_data(cctv_data: Dict[str, Any], event_id: str) -> Optional[Dict[str, Any]]:
        """Process CCTV camera data into grid cell"""
        try:
            lat = cctv_data['location']['lat']
            lon = cctv_data['location']['lon']
            grid_id = GridConverter.lat_lon_to_grid_id(lat, lon)

            return {
                'event_id': event_id,
                'grid_id': grid_id,
                'lat': lat,
                'lon': lon,
                'density': DataMerger._density_level_to_value(cctv_data.get('densityLevel', 'LOW')),
                'count': cctv_data.get('peopleCount', 0),
                'source': 'CCTV',
                'camera_id': cctv_data.get('cameraId'),
                'anomalies': cctv_data.get('anomalies', []),
                'timestamp': datetime.now()
            }
        except Exception as e:
            logger.error(f"Error processing CCTV data: {e}")
            return None

    @staticmethod
    def merge_user_gps_data(gps_data_list: List[Dict[str, Any]], event_id: str) -> List[Dict[str, Any]]:
        """Aggregate user GPS data into grid cells"""
        grid_counts: Dict[str, Dict[str, Any]] = defaultdict(
            lambda: {'users': set(), 'locations': []})
        grid_cells = []

        try:
            for gps in gps_data_list:
                lat = gps['location']['lat']
                lon = gps['location']['lon']
                grid_id = GridConverter.lat_lon_to_grid_id(lat, lon)

                grid_counts[grid_id]['users'].add(gps['userId'])
                grid_counts[grid_id]['locations'].append((lat, lon))

            # Convert to grid cells
            grid_cells = []
            for grid_id, data in grid_counts.items():
                count = len(data['users'])
                avg_lat = sum(loc[0] for loc in data['locations']
                              ) / len(data['locations'])
                avg_lon = sum(loc[1] for loc in data['locations']
                              ) / len(data['locations'])

                # 4 sq m per person
                density = count / (GRID_SIZE_METERS * GRID_SIZE_METERS / 4)

                grid_cells.append({
                    'event_id': event_id,
                    'grid_id': grid_id,
                    'lat': avg_lat,
                    'lon': avg_lon,
                    'density': density,
                    'count': count,
                    'source': 'USER_GPS',
                    'timestamp': datetime.now()
                })

            logger.info(
                f"Aggregated {len(gps_data_list)} GPS points into {len(grid_cells)} grid cells")
        except Exception as e:
            logger.error(f"Error aggregating GPS data: {e}")

        return grid_cells

    @staticmethod
    def _density_level_to_value(level: str) -> float:
        """Convert density level to numeric value"""
        mapping = {
            'LOW': 0.2,
            'MEDIUM': 0.5,
            'HIGH': 0.75,
            'CRITICAL': 0.95
        }
        return mapping.get(level, 0.2)


class FeatureEngineer:
    """Add contextual signals and temporal features"""

    @staticmethod
    def add_temporal_features(grid_data: Dict[str, Any], event_id: str) -> Dict[str, Any]:
        """Calculate temporal change features"""
        grid_id = grid_data['grid_id']
        current_count = grid_data['count']

        # Get historical data from cache
        history = grid_cache[event_id][grid_id]

        # Calculate deltas
        delta_t1 = FeatureEngineer._calculate_delta(
            history, current_count, 60)    # 1 min
        delta_t5 = FeatureEngineer._calculate_delta(
            history, current_count, 300)   # 5 min
        delta_t15 = FeatureEngineer._calculate_delta(
            history, current_count, 900)  # 15 min

        # Update cache
        history.append({
            'count': current_count,
            'timestamp': datetime.now()
        })

        # Keep only last 15 minutes
        cutoff = datetime.now() - timedelta(minutes=15)
        grid_cache[event_id][grid_id] = [
            h for h in history if h['timestamp'] > cutoff
        ]

        grid_data.update({
            'delta_t1': delta_t1,
            'delta_t5': delta_t5,
            'delta_t15': delta_t15
        })

        return grid_data

    @staticmethod
    def _calculate_delta(history: List[Dict], current_count: int, seconds_ago: int) -> float:
        """Calculate percentage change from N seconds ago"""
        if not history:
            return 0.0

        cutoff = datetime.now() - timedelta(seconds=seconds_ago)
        past_data = [h for h in history if h['timestamp'] <= cutoff]

        if not past_data:
            return 0.0

        past_count = past_data[-1]['count']

        if past_count == 0:
            return 1.0 if current_count > 0 else 0.0

        return (current_count - past_count) / past_count

    @staticmethod
    def add_weather_context(grid_data: Dict[str, Any], event_id: str) -> Dict[str, Any]:
        """Add weather data to features"""
        weather = weather_cache.get(event_id, {})

        grid_data.update({
            'temperature': weather.get('temperature'),
            'weather_condition': weather.get('condition'),
            'heat_index': weather.get('heatIndex'),
            'wind_speed': weather.get('windSpeed')
        })

        return grid_data

    @staticmethod
    def add_social_context(grid_data: Dict[str, Any], event_id: str) -> Dict[str, Any]:
        """Add social media signals"""
        social = social_cache.get(event_id, {})

        grid_data.update({
            'social_sentiment': social.get('sentimentScore', 0.0),
            'panic_level': social.get('panicLevel', 0.0),
            'social_volume_spike': social.get('volumeSpike', False)
        })

        return grid_data

    @staticmethod
    def calculate_confidence(grid_data: Dict[str, Any]) -> float:
        """Calculate confidence score based on data sources"""
        sources = grid_data.get('sources', [])

        # More sources = higher confidence
        base_confidence = min(len(sources) * 0.3, 1.0)

        # Adjust for data freshness
        timestamp = grid_data.get('timestamp', datetime.now())
        age_seconds = (datetime.now() - timestamp).total_seconds()
        # Decay over 5 minutes
        freshness_factor = max(0.5, 1.0 - (age_seconds / 300))

        return base_confidence * freshness_factor


class DataProcessor:
    """Main ETL processor"""

    @staticmethod
    @track_performance
    async def process_raw_data(event_id: str, data_batch: List[Dict[str, Any]]) -> List[ProcessedFeatures]:
        """
        Main ETL pipeline:
        1. Merge multi-source data into grids
        2. Add temporal features
        3. Add contextual signals
        4. Calculate confidence scores

        Args:
            event_id: Event identifier
            data_batch: List of raw data points from various sources

        Returns:
            List of processed features ready for ML consumption
        """
        if not data_batch:
            logger.warning(f"Empty data batch for event {event_id}")
            return []

        try:
            # Step 1: Merge data from all sources
            merged_grids = DataProcessor._merge_all_sources(
                event_id, data_batch)

            # Step 2: Add features
            enriched_grids = []
            for grid_data in merged_grids.values():
                try:
                    # Temporal features
                    grid_data = FeatureEngineer.add_temporal_features(
                        grid_data, event_id)

                    # Weather context
                    grid_data = FeatureEngineer.add_weather_context(
                        grid_data, event_id)

                    # Social context
                    grid_data = FeatureEngineer.add_social_context(
                        grid_data, event_id)

                    # Confidence score
                    grid_data['confidence'] = FeatureEngineer.calculate_confidence(
                        grid_data)

                    # Convert to ProcessedFeatures
                    if grid_data['confidence'] >= CONFIDENCE_THRESHOLD:
                        features = ProcessedFeatures(
                            event_id=grid_data['event_id'],
                            grid_id=grid_data['grid_id'],
                            timestamp=grid_data['timestamp'],
                            location=Location(
                                lat=grid_data['lat'], lon=grid_data['lon']),
                            density=grid_data['density'],
                            count=grid_data['count'],
                            density_level=DataProcessor._get_density_level(
                                grid_data['density']),
                            delta_t1=grid_data.get('delta_t1', 0.0),
                            delta_t5=grid_data.get('delta_t5', 0.0),
                            delta_t15=grid_data.get('delta_t15', 0.0),
                            temperature=grid_data.get('temperature'),
                            weather_condition=grid_data.get(
                                'weather_condition'),
                            social_sentiment=grid_data.get('social_sentiment'),
                            panic_level=grid_data.get('panic_level'),
                            sources=grid_data.get('sources', []),
                            confidence=grid_data['confidence']
                        )
                        enriched_grids.append(features)
                except Exception as e:
                    logger.error(
                        f"Error enriching grid {grid_data.get('grid_id')}: {e}")
                    continue

            logger.info(
                f"Processed {len(enriched_grids)} high-confidence grid cells for event {event_id}")
            return enriched_grids

        except Exception as e:
            logger.error(
                f"Error in data processing pipeline: {e}", exc_info=True)
            return []

    @staticmethod
    def _merge_all_sources(event_id: str, data_batch: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Merge data from all sources into unified grid structure"""
        merged: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            'count': 0,
            'density': 0.0,
            'sources': [],
            'timestamp': datetime.now()
        })

        drone_data = []
        cctv_data = []
        gps_data = []

        # Separate by source type
        for item in data_batch:
            source_type = item.get('type') or item.get('source')

            if source_type == 'DRONE':
                drone_data.append(item)
            elif source_type == 'CCTV':
                cctv_data.append(item)
            elif source_type == 'USER_GPS':
                gps_data.append(item)

        # Process each source
        if drone_data:
            for drone in drone_data:
                cells = DataMerger.merge_drone_data(drone, event_id)
                for cell in cells:
                    grid_id = cell['grid_id']
                    if 'event_id' not in merged[grid_id]:
                        merged[grid_id]['event_id'] = event_id
                    if 'grid_id' not in merged[grid_id]:
                        merged[grid_id]['grid_id'] = grid_id
                    if 'lat' not in merged[grid_id]:
                        merged[grid_id]['lat'] = cell['lat']
                    if 'lon' not in merged[grid_id]:
                        merged[grid_id]['lon'] = cell['lon']
                    merged[grid_id]['count'] += cell['count']
                    merged[grid_id]['density'] = max(
                        merged[grid_id]['density'], cell['density'])
                    if 'DRONE' not in merged[grid_id]['sources']:
                        merged[grid_id]['sources'].append('DRONE')

        if cctv_data:
            for cctv in cctv_data:
                cell = DataMerger.merge_cctv_data(cctv, event_id)
                if cell:
                    grid_id = cell['grid_id']
                    if 'event_id' not in merged[grid_id]:
                        merged[grid_id]['event_id'] = event_id
                    if 'grid_id' not in merged[grid_id]:
                        merged[grid_id]['grid_id'] = grid_id
                    if 'lat' not in merged[grid_id]:
                        merged[grid_id]['lat'] = cell['lat']
                    if 'lon' not in merged[grid_id]:
                        merged[grid_id]['lon'] = cell['lon']
                    merged[grid_id]['count'] += cell['count']
                    merged[grid_id]['density'] = max(
                        merged[grid_id]['density'], cell['density'])
                    if 'CCTV' not in merged[grid_id]['sources']:
                        merged[grid_id]['sources'].append('CCTV')

        if gps_data:
            cells = DataMerger.merge_user_gps_data(gps_data, event_id)
            for cell in cells:
                grid_id = cell['grid_id']
                if 'event_id' not in merged[grid_id]:
                    merged[grid_id]['event_id'] = event_id
                if 'grid_id' not in merged[grid_id]:
                    merged[grid_id]['grid_id'] = grid_id
                if 'lat' not in merged[grid_id]:
                    merged[grid_id]['lat'] = cell['lat']
                if 'lon' not in merged[grid_id]:
                    merged[grid_id]['lon'] = cell['lon']
                merged[grid_id]['count'] += cell['count']
                merged[grid_id]['density'] = max(
                    merged[grid_id]['density'], cell['density'])
                if 'USER_GPS' not in merged[grid_id]['sources']:
                    merged[grid_id]['sources'].append('USER_GPS')

        return merged

    @staticmethod
    def _get_density_level(density: float) -> str:
        """Convert numeric density to level"""
        if density >= 0.9:
            return 'CRITICAL'
        elif density >= 0.7:
            return 'HIGH'
        elif density >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'


class OutputPublisher:
    """Publish processed features to BigQuery and Pub/Sub"""

    @staticmethod
    async def publish_features(features: List[ProcessedFeatures]):
        """Send features to ML models and storage"""
        if not features:
            return

        try:
            # Publish to Pub/Sub for real-time ML
            await OutputPublisher._publish_to_pubsub(features)

            # Store in BigQuery for batch ML and analytics
            await OutputPublisher._store_in_bigquery(features)

            logger.info(
                f"Published {len(features)} features to Pub/Sub and BigQuery")

        except Exception as e:
            logger.error(f"Error publishing features: {e}", exc_info=True)

    @staticmethod
    async def _publish_to_pubsub(features: List[ProcessedFeatures]):
        """Publish to Pub/Sub topics with batching and error handling"""
        if not features:
            return

        futures = []
        for feature in features:
            try:
                message_data = json.dumps(
                    asdict(feature), default=str).encode('utf-8')

                future = publisher.publish(
                    TOPIC_RISK_ENGINE,
                    message_data,
                    event_id=feature.event_id,
                    grid_id=feature.grid_id,
                    density_level=feature.density_level
                )
                futures.append(future)

            except Exception as e:
                logger.error(f"Error publishing feature to Pub/Sub: {e}")

        # Wait for all publishes with timeout
        if futures:
            try:
                # Wait up to 5 seconds for all messages to publish
                for future in futures:
                    future.result(timeout=5.0)
                logger.info(
                    f"Successfully published {len(futures)} messages to Pub/Sub")
            except Exception as e:
                logger.error(f"Error waiting for Pub/Sub publish: {e}")

    @staticmethod
    async def _store_in_bigquery(features: List[ProcessedFeatures]):
        """Batch insert into BigQuery with retry logic"""
        if not features:
            return

        try:
            table_id = f"{project_id}.event_analytics.processed_features"

            # Process in batches to avoid overwhelming BigQuery
            for i in range(0, len(features), BATCH_SIZE):
                batch = features[i:i + BATCH_SIZE]
                rows = []

                for feature in batch:
                    row = {
                        'event_id': feature.event_id,
                        'grid_id': feature.grid_id,
                        'timestamp': feature.timestamp.isoformat(),
                        'lat': feature.location.lat,
                        'lon': feature.location.lon,
                        'density': feature.density,
                        'count': feature.count,
                        'density_level': feature.density_level,
                        'delta_t1': feature.delta_t1,
                        'delta_t5': feature.delta_t5,
                        'delta_t15': feature.delta_t15,
                        'temperature': feature.temperature,
                        'weather_condition': feature.weather_condition,
                        'social_sentiment': feature.social_sentiment,
                        'panic_level': feature.panic_level,
                        'sources': feature.sources,
                        'confidence': feature.confidence
                    }
                    rows.append(row)

                errors = bq_client.insert_rows_json(table_id, rows)

                if errors:
                    logger.error(
                        f"BigQuery insert errors for batch {i//BATCH_SIZE}: {errors}")
                else:
                    logger.info(
                        f"Successfully inserted batch {i//BATCH_SIZE} ({len(rows)} rows) to BigQuery")

        except Exception as e:
            logger.error(f"Error storing in BigQuery: {e}", exc_info=True)


# ==============================================
# Flask Routes (Cloud Run HTTP endpoints)
# ==============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with detailed status"""
    try:
        # Check GCP connections
        gcp_healthy = True
        gcp_status = {}

        try:
            # Test Pub/Sub
            publisher.list_topics(
                request={"project": f"projects/{project_id}"}, timeout=2.0)
            gcp_status['pubsub'] = 'healthy'
        except Exception as e:
            gcp_healthy = False
            gcp_status['pubsub'] = f'unhealthy: {str(e)}'

        try:
            # Test BigQuery
            bq_client.query("SELECT 1", timeout=2.0)
            gcp_status['bigquery'] = 'healthy'
        except Exception as e:
            gcp_healthy = False
            gcp_status['bigquery'] = f'unhealthy: {str(e)}'

        return jsonify({
            'status': 'healthy' if gcp_healthy else 'degraded',
            'service': 'etl-worker',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0',
            'gcp': gcp_status,
            'metrics': metrics.get_stats(),
            'cache_sizes': {
                'grid_cache': len(grid_cache),
                'weather_cache': len(weather_cache),
                'social_cache': len(social_cache)
            }
        }), 200 if gcp_healthy else 503
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 503


@app.route('/process', methods=['POST'])
async def process_data():
    """
    Main ETL endpoint
    Receives batch of raw data and processes it

    Expected payload:
    {
        "event_id": "string",
        "data": [{"type": "DRONE|CCTV|USER_GPS", ...}]
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        event_id = data.get('event_id')
        data_batch = data.get('data', [])

        if not event_id:
            return jsonify({'error': 'event_id is required'}), 400

        if not isinstance(data_batch, list):
            return jsonify({'error': 'data must be an array'}), 400

        logger.info(
            f"Processing {len(data_batch)} data points for event {event_id}")

        # Process data
        features = await DataProcessor.process_raw_data(event_id, data_batch)

        # Publish results
        await OutputPublisher.publish_features(features)

        # Clean up old cache entries
        _cleanup_cache(event_id)

        return jsonify({
            'success': True,
            'processed': len(features),
            'event_id': event_id,
            'timestamp': datetime.now().isoformat()
        }), 200

    except ValueError as e:
        logger.error(f"Validation error in /process endpoint: {e}")
        return jsonify({'error': f'Validation error: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Error in /process endpoint: {e}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


def _cleanup_cache(event_id: str):
    """Clean up old cache entries to prevent memory issues"""
    try:
        # Clean up grid cache - keep only last 15 minutes
        if event_id in grid_cache:
            cutoff = datetime.now() - timedelta(minutes=15)
            for grid_id in list(grid_cache[event_id].keys()):
                grid_cache[event_id][grid_id] = [
                    h for h in grid_cache[event_id][grid_id]
                    if h.get('timestamp', datetime.min) > cutoff
                ]
                # Remove empty grid cells
                if not grid_cache[event_id][grid_id]:
                    del grid_cache[event_id][grid_id]

            # Enforce max cache size
            if len(grid_cache[event_id]) > MAX_CACHE_SIZE:
                logger.warning(
                    f"Cache size {len(grid_cache[event_id])} exceeds limit, clearing oldest entries")
                # Keep only most recent entries
                sorted_items = sorted(
                    grid_cache[event_id].items(),
                    key=lambda x: max((h.get('timestamp', datetime.min)
                                      for h in x[1]), default=datetime.min),
                    reverse=True
                )
                grid_cache[event_id] = dict(sorted_items[:MAX_CACHE_SIZE])
    except Exception as e:
        logger.error(f"Error cleaning up cache: {e}")


@app.route('/update-weather', methods=['POST'])
def update_weather():
    """Update weather cache"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        event_id = data.get('event_id')
        weather_data = data.get('weather')

        if not event_id:
            return jsonify({'error': 'event_id is required'}), 400
        if not weather_data:
            return jsonify({'error': 'weather data is required'}), 400

        weather_cache[event_id] = weather_data
        logger.info(f"Updated weather cache for event {event_id}")

        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Error updating weather: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/update-social', methods=['POST'])
def update_social():
    """Update social signals cache"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        event_id = data.get('event_id')
        social_data = data.get('social')

        if not event_id:
            return jsonify({'error': 'event_id is required'}), 400
        if not social_data:
            return jsonify({'error': 'social data is required'}), 400

        social_cache[event_id] = social_data
        logger.info(f"Updated social cache for event {event_id}")

        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Error updating social: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear caches for an event"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        event_id = data.get('event_id')

        if not event_id:
            return jsonify({'error': 'event_id is required'}), 400

        cleared = []
        if event_id in grid_cache:
            del grid_cache[event_id]
            cleared.append('grid_cache')
        if event_id in weather_cache:
            del weather_cache[event_id]
            cleared.append('weather_cache')
        if event_id in social_cache:
            del social_cache[event_id]
            cleared.append('social_cache')

        logger.info(f"Cleared caches for event {event_id}: {cleared}")
        return jsonify({'success': True, 'cleared': cleared}), 200
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Get processing metrics"""
    try:
        return jsonify({
            'success': True,
            'metrics': metrics.get_stats(),
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {e}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
