#!/usr/bin/env python3
"""
DrishtiX LSTM Crowd Forecasting Integration

This script integrates LSTM models with DrishtiX's real-time crowd forecasting system.

Features:
1. Fetch zone metadata and real-time zone state data
2. Format time-series data for LSTM models (sliding window approach)
3. Make crowd predictions with configurable horizons (10, 30, 60 minutes)
4. Send predictions back to DrishtiX CrowdForecast table
5. Generate risk alerts and recommendations
6. Support for organizer-specific thresholds

Requirements:
    pip install requests numpy tensorflow pandas scikit-learn
"""

import requests
import numpy as np
import pandas as pd
import tensorflow as tf
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import time
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DrishtiXLSTMClient:
    """Client for integrating LSTM models with DrishtiX crowd forecasting system"""
    
    def __init__(self, drishtix_url: str = "http://localhost:3000", model_version: str = "v1.0"):
        """
        Initialize the LSTM client
        
        Args:
            drishtix_url: Base URL of DrishtiX backend
            model_version: Version of the LSTM model being used
        """
        self.drishtix_url = drishtix_url
        self.model_version = model_version
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        logger.info(f"Initialized DrishtiX LSTM Client - {drishtix_url}")
    
    # =========================================================================
    # Data Retrieval Methods
    # =========================================================================
    
    def get_zone_metadata(self, event_id: str) -> List[Dict[str, Any]]:
        """
        Get zone metadata (static configuration) for an event
        
        Args:
            event_id: Event ID
            
        Returns:
            List of zone metadata objects
        """
        url = f"{self.drishtix_url}/api/events/{event_id}/zones"
        response = self.session.get(url)
        response.raise_for_status()
        
        data = response.json()
        if not data.get("success"):
            raise ValueError(f"Failed to fetch zone metadata: {data}")
        
        return data.get("data", [])
    
    def get_zone_state_history(self, event_id: str, zone_id: str, 
                               window_minutes: int = 60) -> List[Dict[str, Any]]:
        """
        Get historical zone state data for a specific zone
        
        Args:
            event_id: Event ID
            zone_id: Zone ID
            window_minutes: Minutes of historical data to fetch
            
        Returns:
            List of zone state snapshots (time-series data)
        """
        url = f"{self.drishtix_url}/api/events/{event_id}/zones/{zone_id}/state/history"
        params = {"window": window_minutes}
        
        response = self.session.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        if not data.get("success"):
            raise ValueError(f"Failed to fetch zone state history: {data}")
        
        return data.get("history", [])
    
    def get_all_zones_state(self, event_id: str, window_minutes: int = 60) -> List[Dict[str, Any]]:
        """
        Get zone state data for all zones in an event
        
        Args:
            event_id: Event ID
            window_minutes: Minutes of historical data to fetch
            
        Returns:
            List of zone state data with features
        """
        url = f"{self.drishtix_url}/api/events/{event_id}/zones/state"
        params = {"window": window_minutes}
        
        response = self.session.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        if not data.get("success"):
            raise ValueError(f"Failed to fetch zone states: {data}")
        
        return data.get("data", [])
    
    def get_schedule_context(self, event_id: str) -> Dict[str, Any]:
        """
        Get current event schedule context
        
        Args:
            event_id: Event ID
            
        Returns:
            Schedule context with current phase and predictions
        """
        url = f"{self.drishtix_url}/api/events/{event_id}/schedule/context"
        
        response = self.session.get(url)
        response.raise_for_status()
        
        data = response.json()
        if not data.get("success"):
            raise ValueError(f"Failed to fetch schedule context: {data}")
        
        return data.get("context", {})
    
    # =========================================================================
    # Data Preprocessing Methods
    # =========================================================================
    
    def prepare_lstm_features(self, zone_states: List[Dict[str, Any]]) -> Tuple[np.ndarray, List[str]]:
        """
        Convert zone state data to LSTM input tensor
        
        Args:
            zone_states: List of zone state snapshots
            
        Returns:
            Tuple of (feature array, feature names)
        """
        if not zone_states:
            raise ValueError("No zone state data provided")
        
        # Expected features from ZoneState model
        feature_columns = [
            'crowdCount',           # Number of people
            'crowdDensity',         # People per sq meter
            'inflowRate',           # People entering per minute
            'outflowRate',          # People exiting per minute
            'netFlowRate',          # Net flow (inflow - outflow)
            'avgSpeed',             # Average movement speed
            'directionEntropy',     # Direction disorder (0-1)
            'queueLength',          # Queue length (nullable)
            'avgWaitTime',          # Average wait time (nullable)
            'temperature',          # Temperature in Celsius (nullable)
            'humidity',             # Humidity percentage (nullable)
            'congestionScore',      # Congestion relative to capacity (0-1)
            'bottleneckScore',      # Bottleneck severity (nullable, 0-1)
            'riskScore'             # Risk score (computed from riskLevel)
        ]
        
        # Convert to DataFrame
        df = pd.DataFrame(zone_states)
        
        # Handle nullable fields with default values
        df['queueLength'] = df['queueLength'].fillna(0)
        df['avgWaitTime'] = df['avgWaitTime'].fillna(0)
        df['temperature'] = df['temperature'].fillna(20.0)  # Default 20°C
        df['humidity'] = df['humidity'].fillna(50.0)         # Default 50%
        df['bottleneckScore'] = df['bottleneckScore'].fillna(0.0)
        
        # Convert riskLevel enum to numeric score
        risk_mapping = {'LOW': 0.25, 'MEDIUM': 0.5, 'HIGH': 0.75, 'CRITICAL': 1.0}
        df['riskScore'] = df['riskLevel'].map(risk_mapping).fillna(0.5)
        
        # Extract feature matrix
        X = df[feature_columns].values
        
        # Normalize features (simple min-max scaling)
        # In production, use fitted scaler from training
        X_normalized = self._normalize_features(X)
        
        return X_normalized, feature_columns
    
    def _normalize_features(self, X: np.ndarray) -> np.ndarray:
        """
        Normalize features using min-max scaling
        
        Args:
            X: Feature matrix
            
        Returns:
            Normalized feature matrix
        """
        # Simple normalization for demo
        # In production, use sklearn.preprocessing.StandardScaler fitted during training
        X_min = X.min(axis=0)
        X_max = X.max(axis=0)
        
        # Avoid division by zero
        X_range = X_max - X_min
        X_range[X_range == 0] = 1.0
        
        X_normalized = (X - X_min) / X_range
        
        return X_normalized
    
    def create_lstm_input(self, event_id: str, zone_id: str, 
                         window_minutes: int = 60, 
                         timesteps: int = 12) -> np.ndarray:
        """
        Create LSTM input tensor with sliding window
        
        Args:
            event_id: Event ID
            zone_id: Zone ID
            window_minutes: Minutes of historical data
            timesteps: Number of timesteps for LSTM
            
        Returns:
            LSTM input array of shape (1, timesteps, features)
        """
        # Get zone state history
        zone_states = self.get_zone_state_history(event_id, zone_id, window_minutes)
        
        if len(zone_states) < timesteps:
            logger.warning(f"Insufficient data for zone {zone_id}: {len(zone_states)}/{timesteps} timesteps")
            # Pad with zeros or skip
            raise ValueError(f"Need at least {timesteps} timesteps, got {len(zone_states)}")
        
        # Use the most recent timesteps
        recent_states = zone_states[-timesteps:]
        
        # Prepare features
        X, feature_names = self.prepare_lstm_features(recent_states)
        
        # Reshape for LSTM: (batch_size, timesteps, features)
        X_lstm = X.reshape(1, timesteps, -1)
        
        logger.info(f"Created LSTM input: shape {X_lstm.shape}")
        
        return X_lstm
    
    # =========================================================================
    # Prediction Methods
    # =========================================================================
    
    def predict_zone(self, model, event_id: str, zone_id: str, 
                    zone_metadata: Dict[str, Any],
                    horizon_minutes: int = 10) -> Dict[str, Any]:
        """
        Make crowd prediction for a specific zone
        
        Args:
            model: Trained LSTM model
            event_id: Event ID
            zone_id: Zone ID
            zone_metadata: Zone metadata (capacity, area, etc.)
            horizon_minutes: Prediction horizon (10, 30, or 60 minutes)
            
        Returns:
            Prediction dictionary
        """
        try:
            # Create LSTM input
            X = self.create_lstm_input(event_id, zone_id, window_minutes=60, timesteps=12)
            
            # Make prediction
            y_pred = model.predict(X, verbose=0)
            
            predicted_count = float(y_pred[0][0])
            
            # Calculate derived metrics
            max_capacity = zone_metadata.get('maxCapacity', 500)
            area_sq_meters = zone_metadata.get('areaSqMeters', 100.0)
            
            predicted_density = predicted_count / area_sq_meters if area_sq_meters > 0 else 0.0
            predicted_occupancy = (predicted_count / max_capacity) * 100 if max_capacity > 0 else 0.0
            
            # Determine density and risk levels
            density_level = self._calculate_density_level(predicted_density)
            risk_level = self._calculate_risk_level(predicted_occupancy)
            
            # Generate alerts and recommendations
            alerts = self._generate_alerts(predicted_count, predicted_occupancy, zone_metadata)
            recommendations = self._generate_recommendations(predicted_occupancy, density_level, zone_metadata)
            
            # Get schedule context for additional insights
            schedule_context = self.get_schedule_context(event_id)
            
            prediction = {
                "eventId": event_id,
                "zoneId": zone_id,
                "zoneName": zone_metadata.get('zoneName', zone_id),
                "forecastTime": datetime.utcnow().isoformat() + 'Z',
                "targetTime": (datetime.utcnow() + timedelta(minutes=horizon_minutes)).isoformat() + 'Z',
                "horizonMinutes": horizon_minutes,
                "predictedCount": int(predicted_count),
                "predictedDensity": round(predicted_density, 3),
                "predictedDensityLevel": density_level,
                "predictedRiskLevel": risk_level,
                "predictedInflow": 0.0,  # Could be predicted by multi-output model
                "predictedOutflow": 0.0,  # Could be predicted by multi-output model
                "confidence": 0.85,  # Calculate from model uncertainty
                "modelVersion": self.model_version,
                "modelType": "LSTM",
                "inputFeatures": {
                    "windowMinutes": 60,
                    "timesteps": 12,
                    "schedulePhase": schedule_context.get('currentPhase', 'UNKNOWN')
                },
                "alerts": alerts,
                "recommendations": recommendations
            }
            
            logger.info(f"Prediction for {zone_id}: {predicted_count:.0f} people, {density_level}, {risk_level}")
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error predicting zone {zone_id}: {e}")
            raise
    
    def predict_all_zones(self, model, event_id: str, 
                         horizon_minutes: int = 10) -> List[Dict[str, Any]]:
        """
        Make predictions for all zones in an event
        
        Args:
            model: Trained LSTM model
            event_id: Event ID
            horizon_minutes: Prediction horizon
            
        Returns:
            List of predictions for each zone
        """
        # Get zone metadata
        zones_metadata = self.get_zone_metadata(event_id)
        
        predictions = []
        for zone_meta in zones_metadata:
            try:
                zone_id = zone_meta['zoneId']
                prediction = self.predict_zone(model, event_id, zone_id, zone_meta, horizon_minutes)
                predictions.append(prediction)
            except Exception as e:
                logger.error(f"Failed to predict zone {zone_meta.get('zoneId')}: {e}")
                continue
        
        logger.info(f"Generated {len(predictions)} predictions for event {event_id}")
        return predictions
    
    # =========================================================================
    # Alert and Risk Assessment Methods
    # =========================================================================
    
    def _calculate_density_level(self, density: float) -> str:
        """Calculate density level from density value"""
        if density >= 3.0:
            return 'CRITICAL'
        elif density >= 2.0:
            return 'HIGH'
        elif density >= 1.0:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _calculate_risk_level(self, occupancy_percent: float) -> str:
        """Calculate risk level from occupancy percentage"""
        if occupancy_percent >= 90:
            return 'CRITICAL'
        elif occupancy_percent >= 75:
            return 'HIGH'
        elif occupancy_percent >= 60:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _generate_alerts(self, predicted_count: float, predicted_occupancy: float, 
                        zone_metadata: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate alerts based on predictions"""
        alerts = []
        zone_name = zone_metadata.get('zoneName', 'Unknown')
        
        # Capacity alerts
        if predicted_occupancy >= 95:
            alerts.append({
                "type": "CAPACITY_CRITICAL",
                "severity": "CRITICAL",
                "message": f"{zone_name} predicted to reach {predicted_occupancy:.1f}% capacity - Immediate action required"
            })
        elif predicted_occupancy >= 85:
            alerts.append({
                "type": "CAPACITY_HIGH",
                "severity": "HIGH",
                "message": f"{zone_name} predicted to reach {predicted_occupancy:.1f}% capacity - Monitor closely"
            })
        elif predicted_occupancy >= 75:
            alerts.append({
                "type": "CAPACITY_WARNING",
                "severity": "MEDIUM",
                "message": f"{zone_name} predicted to reach {predicted_occupancy:.1f}% capacity"
            })
        
        # Bottleneck alerts
        if zone_metadata.get('bottleneckProne', False) and predicted_occupancy > 70:
            alerts.append({
                "type": "BOTTLENECK_RISK",
                "severity": "HIGH",
                "message": f"{zone_name} is bottleneck-prone with {predicted_occupancy:.1f}% occupancy"
            })
        
        # Queue alerts
        if zone_metadata.get('queueProne', False) and predicted_occupancy > 60:
            alerts.append({
                "type": "QUEUE_BUILDUP",
                "severity": "MEDIUM",
                "message": f"Queue buildup expected in {zone_name}"
            })
        
        return alerts
    
    def _generate_recommendations(self, predicted_occupancy: float, density_level: str,
                                 zone_metadata: Dict[str, Any]) -> List[str]:
        """Generate action recommendations"""
        recommendations = []
        zone_name = zone_metadata.get('zoneName', 'Unknown')
        
        if predicted_occupancy >= 85:
            recommendations.append(f"Redirect attendees away from {zone_name}")
            recommendations.append(f"Deploy additional staff to {zone_name}")
            
            if zone_metadata.get('connectedZones'):
                recommendations.append(f"Open alternate routes via {', '.join(zone_metadata['connectedZones'][:2])}")
        
        if predicted_occupancy >= 75:
            recommendations.append(f"Increase monitoring frequency for {zone_name}")
            
            if zone_metadata.get('queueProne'):
                recommendations.append(f"Expedite service at {zone_name}")
        
        if density_level in ['HIGH', 'CRITICAL']:
            recommendations.append(f"Implement crowd control measures in {zone_name}")
        
        return recommendations
    
    # =========================================================================
    # Data Storage Methods
    # =========================================================================
    
    def send_forecast(self, event_id: str, prediction: Dict[str, Any]) -> bool:
        """
        Send prediction to DrishtiX CrowdForecast table
        
        Args:
            event_id: Event ID
            prediction: Prediction dictionary
            
        Returns:
            Success status
        """
        url = f"{self.drishtix_url}/api/events/{event_id}/zones/forecast"
        
        try:
            response = self.session.post(url, json=prediction)
            response.raise_for_status()
            
            logger.info(f"✓ Forecast sent for zone {prediction['zoneId']}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Failed to send forecast: {e}")
            return False
    
    # =========================================================================
    # Continuous Prediction Loop
    # =========================================================================
    
    def run_prediction_loop(self, model, event_id: str, 
                           interval_minutes: int = 5,
                           horizons: List[int] = [10, 30, 60]) -> None:
        """
        Run continuous prediction loop for an event
        
        Args:
            model: Trained LSTM model
            event_id: Event ID
            interval_minutes: Time between prediction cycles
            horizons: List of prediction horizons in minutes
        """
        logger.info(f"Starting prediction loop for event {event_id}")
        logger.info(f"Prediction interval: {interval_minutes} minutes")
        logger.info(f"Horizons: {horizons} minutes")
        
        cycle_count = 0
        
        while True:
            try:
                cycle_start = time.time()
                cycle_count += 1
                
                logger.info(f"\n{'='*60}")
                logger.info(f"Prediction Cycle #{cycle_count} - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
                logger.info(f"{'='*60}")
                
                # Generate predictions for each horizon
                for horizon in horizons:
                    logger.info(f"\nGenerating {horizon}-minute forecasts...")
                    
                    try:
                        predictions = self.predict_all_zones(model, event_id, horizon)
                        
                        # Send forecasts to DrishtiX
                        success_count = 0
                        for prediction in predictions:
                            if self.send_forecast(event_id, prediction):
                                success_count += 1
                        
                        logger.info(f"  ✓ {success_count}/{len(predictions)} forecasts sent successfully")
                        
                        # Print summary
                        high_risk_zones = [p for p in predictions 
                                          if p['predictedRiskLevel'] in ['HIGH', 'CRITICAL']]
                        
                        if high_risk_zones:
                            logger.warning(f"  ⚠ {len(high_risk_zones)} zones at HIGH/CRITICAL risk:")
                            for zone in high_risk_zones[:5]:  # Show top 5
                                logger.warning(f"    - {zone['zoneName']}: {zone['predictedCount']} people "
                                             f"({zone['predictedRiskLevel']})")
                        
                    except Exception as e:
                        logger.error(f"Error generating {horizon}-min forecasts: {e}")
                
                cycle_duration = time.time() - cycle_start
                logger.info(f"\nCycle completed in {cycle_duration:.2f}s")
                
                # Wait for next interval
                sleep_time = max(0, interval_minutes * 60 - cycle_duration)
                if sleep_time > 0:
                    logger.info(f"Sleeping for {sleep_time:.0f}s until next cycle...\n")
                    time.sleep(sleep_time)
                
            except KeyboardInterrupt:
                logger.info("\n\nStopping prediction loop (KeyboardInterrupt)...")
                break
                
            except Exception as e:
                logger.error(f"Error in prediction loop: {e}")
                logger.info("Waiting 60s before retry...")
                time.sleep(60)
        
        logger.info(f"Prediction loop stopped after {cycle_count} cycles")
    
    # =========================================================================
    # Monitoring and Health Check
    # =========================================================================
    
    def check_data_availability(self, event_id: str) -> Dict[str, Any]:
        """
        Check if sufficient data is available for predictions
        
        Args:
            event_id: Event ID
            
        Returns:
            Data availability status
        """
        try:
            zones_metadata = self.get_zone_metadata(event_id)
            
            status = {
                "event_id": event_id,
                "zones_configured": len(zones_metadata),
                "zones_ready": [],
                "zones_insufficient_data": [],
                "overall_ready": True
            }
            
            for zone_meta in zones_metadata:
                zone_id = zone_meta['zoneId']
                try:
                    zone_states = self.get_zone_state_history(event_id, zone_id, 60)
                    
                    if len(zone_states) >= 12:  # Need at least 12 timesteps
                        status["zones_ready"].append({
                            "zone_id": zone_id,
                            "zone_name": zone_meta['zoneName'],
                            "data_points": len(zone_states)
                        })
                    else:
                        status["zones_insufficient_data"].append({
                            "zone_id": zone_id,
                            "zone_name": zone_meta['zoneName'],
                            "data_points": len(zone_states),
                            "required": 12
                        })
                        status["overall_ready"] = False
                        
                except Exception as e:
                    logger.error(f"Error checking zone {zone_id}: {e}")
                    status["zones_insufficient_data"].append({
                        "zone_id": zone_id,
                        "error": str(e)
                    })
                    status["overall_ready"] = False
            
            return status
            
        except Exception as e:
            logger.error(f"Error checking data availability: {e}")
            return {
                "event_id": event_id,
                "error": str(e),
                "overall_ready": False
            }


# =============================================================================
# Example Usage and Model Training
# =============================================================================

def create_example_model(timesteps: int = 12, features: int = 14) -> tf.keras.Model:
    """
    Create an example LSTM model for crowd forecasting
    
    Args:
        timesteps: Number of time steps in input sequence
        features: Number of features per timestep
        
    Returns:
        Compiled LSTM model
    """
    model = tf.keras.Sequential([
        # LSTM layers
        tf.keras.layers.LSTM(128, return_sequences=True, input_shape=(timesteps, features)),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.LSTM(64, return_sequences=False),
        tf.keras.layers.Dropout(0.2),
        
        # Dense layers
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dropout(0.1),
        tf.keras.layers.Dense(16, activation='relu'),
        
        # Output layer
        tf.keras.layers.Dense(1)  # Predict crowd count
    ])
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae', 'mape']
    )
    
    logger.info(f"Created LSTM model: {model.count_params()} parameters")
    return model


def main():
    """Main entry point for LSTM integration"""
    import argparse
    
    parser = argparse.ArgumentParser(description='DrishtiX LSTM Crowd Forecasting')
    parser.add_argument('--event-id', required=True, help='Event ID to forecast')
    parser.add_argument('--model-path', help='Path to trained LSTM model (.h5 or SavedModel)')
    parser.add_argument('--url', default='http://localhost:3000', help='DrishtiX backend URL')
    parser.add_argument('--interval', type=int, default=5, help='Prediction interval in minutes')
    parser.add_argument('--horizons', nargs='+', type=int, default=[10, 30, 60],
                       help='Prediction horizons in minutes')
    parser.add_argument('--check-data', action='store_true', help='Check data availability and exit')
    parser.add_argument('--single-run', action='store_true', help='Run once and exit (no loop)')
    
    args = parser.parse_args()
    
    # Initialize client
    client = DrishtiXLSTMClient(args.url, model_version="v1.0")
    
    # Check data availability
    if args.check_data:
        logger.info(f"Checking data availability for event {args.event_id}...")
        status = client.check_data_availability(args.event_id)
        
        print(f"\nData Availability Status:")
        print(f"  Event ID: {status['event_id']}")
        print(f"  Zones Configured: {status['zones_configured']}")
        print(f"  Zones Ready: {len(status.get('zones_ready', []))}")
        print(f"  Zones with Insufficient Data: {len(status.get('zones_insufficient_data', []))}")
        print(f"  Overall Ready: {'✓' if status['overall_ready'] else '✗'}")
        
        if status['zones_insufficient_data']:
            print(f"\nZones needing more data:")
            for zone in status['zones_insufficient_data'][:10]:
                print(f"  - {zone.get('zone_name', zone.get('zone_id'))}: "
                      f"{zone.get('data_points', 0)}/12 timesteps")
        
        return
    
    # Load or create model
    if args.model_path:
        logger.info(f"Loading model from {args.model_path}")
        model = tf.keras.models.load_model(args.model_path)
    else:
        logger.warning("No model path provided - using example model (NOT TRAINED)")
        model = create_example_model()
    
    # Run predictions
    if args.single_run:
        logger.info(f"Running single prediction cycle for event {args.event_id}")
        
        for horizon in args.horizons:
            logger.info(f"\nGenerating {horizon}-minute forecasts...")
            predictions = client.predict_all_zones(model, args.event_id, horizon)
            
            for prediction in predictions:
                success = client.send_forecast(args.event_id, prediction)
                status = '✓' if success else '✗'
                print(f"  {status} {prediction['zoneName']}: {prediction['predictedCount']} people "
                      f"({prediction['predictedDensityLevel']}, {prediction['predictedRiskLevel']})")
    else:
        # Run continuous loop
        client.run_prediction_loop(
            model=model,
            event_id=args.event_id,
            interval_minutes=args.interval,
            horizons=args.horizons
        )


if __name__ == "__main__":
    main()
