# Real-Time Zone Data Integration for LSTM Forecasting

## Overview

This document describes the **production-ready real-time data integration** for the DrishtiX Crowd Forecasting system. The system collects actual camera data from video analytics services and prepares it for LSTM model consumption.

## Architecture

### Data Flow

```
Camera Feeds (CCTV/Drone/IP Camera)
    ↓
Video Analytics Service (YOLO + Gemini Vision)
    ↓
Zone Real-Time Data Service (Aggregation)
    ↓
PostgreSQL Database (ZoneState Table)
    ↓
Zone Forecasting API (REST + WebSocket)
    ↓
LSTM Forecasting Model
```

### Key Components

1. **Zone Real-Time Data Service** (`zone-realtime-data.service.ts`)
   - Collects data from camera feeds every 10 seconds
   - Aggregates data by zone every 5 minutes
   - Stores time-series data in `ZoneState` table
   - Manages zone-camera mappings
   - Calculates crowd metrics (density, flow rates, risk levels)

2. **Event Lifecycle Manager** (`event-lifecycle-manager.service.ts`)
   - Automatically starts/stops data collection based on event status
   - Monitors event lifecycle (UPCOMING → ACTIVE → COMPLETED)
   - Manages multiple concurrent events
   - Pre-starts collection 30 minutes before event

3. **Zone Forecasting Routes** (`zone-forecasting.routes.ts`)
   - Provides REST APIs for LSTM model integration
   - Real-time data endpoints (no simulation fallback by default)
   - WebSocket support for live updates
   - Control endpoints for starting/stopping collection

## Real-Time Data Collection

### How It Works

1. **Initialization**: When an event becomes ACTIVE, the Event Lifecycle Manager automatically starts data collection.

2. **Camera Analysis**: Every 10 seconds, the system:
   - Fetches latest frames from all cameras
   - Runs YOLO people detection
   - Analyzes crowd density using Gemini Vision
   - Buffers results for aggregation

3. **5-Minute Aggregation**: Every 5 minutes, the system:
   - Aggregates camera data by zone
   - Calculates average crowd counts
   - Computes density levels (LOW/MEDIUM/HIGH/CRITICAL)
   - Estimates flow rates (people in/out per minute)
   - Assesses risk levels
   - Stores in `ZoneState` table
   - Emits WebSocket updates

4. **LSTM Preparation**: Data is stored in LSTM-ready format:
   - Sequential time indices (0, 1, 2, ...)
   - 5-minute intervals
   - Consistent schema with 19+ features
   - Grouped by zone for sliding window consumption

### Zone-Camera Mappings

The system maps physical cameras to logical zones:

```typescript
const zoneCameraMappings = [
  { zoneId: 'north-gate-1', cameraIds: ['cam-ng1-01', 'cam-ng1-02'], zoneType: 'GATE' },
  { zoneId: 'north-stand-lower', cameraIds: ['cam-nsl-01', 'cam-nsl-02', 'cam-nsl-03'], zoneType: 'STAND' },
  // ... more mappings
];
```

**Configuration**: Edit `zone-realtime-data.service.ts` to customize mappings for your venue.

## API Usage

### 1. Start Real-Time Collection

```bash
POST /api/events/{eventId}/zones/start-collection
```

**Response:**

```json
{
  "success": true,
  "message": "Real-time data collection started",
  "eventId": "evt-123",
  "collectionInterval": "5 minutes",
  "dataSource": "CAMERA"
}
```

### 2. Get Zone Metadata

```bash
GET /api/events/{eventId}/zones
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "zoneId": "north-gate-1",
      "zoneName": "North Gate 1",
      "zoneType": "GATE",
      "capacity": 200,
      "areaSquareMeters": 100,
      "location": { "type": "Point", "coordinates": [0, 0] },
      "cameraIds": ["cam-ng1-01", "cam-ng1-02"]
    }
  ],
  "realtime": true
}
```

### 3. Get Real-Time Zone States (LSTM Input)

```bash
GET /api/events/{eventId}/zones/state?window=60&limit=100
```

**Query Parameters:**

- `window`: Minutes to look back (default: 60)
- `zoneId`: Filter by specific zone (optional)
- `limit`: Max timesteps to return (optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "states": [
      {
        "zoneId": "north-gate-1",
        "timestamp": "2025-01-15T10:00:00Z",
        "timeIndex": 0,
        "peopleCount": 45,
        "densityLevel": "MEDIUM",
        "densityValue": 0.45,
        "occupancyPercent": 22.5,
        "flowRateIn": 5.2,
        "flowRateOut": 2.1,
        "netFlow": 3.1,
        "avgMovementSpeed": 1.2,
        "waitTime": 2,
        "riskLevel": "MEDIUM",
        "riskScore": 0.5,
        "temperatureCelsius": 28,
        "weatherConditions": "CLEAR",
        "eventPhase": "ENTRY",
        "cameraHealth": 0.95,
        "dataSource": "CAMERA",
        "confidence": 0.95
      }
    ],
    "groupedByZone": {
      "north-gate-1": [
        /* array of states */
      ]
    },
    "windowMinutes": 60,
    "timesteps": 12,
    "zones": 16
  },
  "realtime": true,
  "dataSource": "CAMERA"
}
```

### 4. Get Latest Zone States

```bash
GET /api/events/{eventId}/zones/state/latest
```

Returns the most recent state for all zones (useful for current snapshot).

### 5. Check Real-Time Status

```bash
GET /api/events/{eventId}/zones/realtime-status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "zonesTracked": 16,
    "latestUpdates": [
      {
        "zoneId": "north-gate-1",
        "lastUpdate": "2025-01-15T10:05:00Z",
        "dataPoints": 144
      }
    ],
    "cacheStatus": {
      "zonesInCache": 16,
      "lastCacheUpdate": "2025-01-15T10:05:00Z"
    },
    "collectionInterval": "5 minutes",
    "dataSource": "CAMERA"
  }
}
```

### 6. Stop Real-Time Collection

```bash
POST /api/events/{eventId}/zones/stop-collection
```

## WebSocket Integration

### Subscribe to Zone Updates

```javascript
socket.emit('subscribe:zones', eventId);

socket.on('zone:state-update', (data) => {
  console.log('Zone updated:', data.zoneId, data.data);
});
```

### Subscribe to Specific Zone

```javascript
socket.emit('subscribe:zone', { eventId, zoneId: 'north-gate-1' });

socket.on(`zone:${eventId}:north-gate-1:update`, (data) => {
  console.log('Specific zone update:', data);
});
```

## LSTM Model Integration

### Data Format

The API returns data in LSTM-ready format:

- **Sequential Time Indices**: Monotonically increasing integers (0, 1, 2, ...)
- **5-Minute Intervals**: Consistent temporal spacing
- **19+ Features**: All required fields for forecasting
- **Grouped by Zone**: Easy sliding window creation

### Example: Sliding Window Extraction

```python
import requests
import numpy as np

# Fetch data for LSTM
response = requests.get(f'{API_URL}/api/events/{event_id}/zones/state?window=60')
data = response.json()['data']

# Extract features for specific zone
zone_data = data['groupedByZone']['north-gate-1']

# Create sliding window (12 timesteps = 60 minutes)
window_size = 12
features = ['peopleCount', 'densityValue', 'flowRateIn', 'flowRateOut',
            'avgMovementSpeed', 'temperatureCelsius']

X = np.array([[state[f] for f in features] for state in zone_data[-window_size:]])

# X shape: (12, 6) - ready for LSTM input
```

### Real-Time Prediction Loop

```python
while event_active:
    # Get latest data
    response = requests.get(f'{API_URL}/api/events/{event_id}/zones/state?window=60')
    states = response.json()['data']['states']

    # Prepare input
    X = prepare_lstm_input(states)

    # Predict next timestep
    prediction = lstm_model.predict(X)

    # Post forecast back to API
    requests.post(
        f'{API_URL}/api/events/{event_id}/forecasts',
        json={'predictions': prediction.tolist()}
    )

    time.sleep(300)  # Wait 5 minutes for next collection
```

## Data Sources

### Primary: Camera Analytics

- **Video Analytics Service**: Real-time camera frame analysis
- **YOLO Detection**: Accurate people counting
- **Gemini Vision**: Advanced anomaly detection
- **Coverage**: All zones mapped to physical cameras

### Fallback: Simulation (Optional)

Set environment variable to enable simulation fallback for development:

```bash
ENABLE_SIMULATION_FALLBACK=true
```

**Production**: Keep this `false` to ensure only real data is used.

## Automatic Lifecycle Management

The Event Lifecycle Manager automatically handles data collection:

### Event Phases

1. **UPCOMING** (30 min before start)
   - Pre-starts data collection
   - Initializes zones
   - Validates camera health

2. **ACTIVE** (event start → end)
   - Full data collection
   - Real-time aggregation
   - WebSocket streaming

3. **COMPLETED/CANCELLED** (after event)
   - Stops data collection
   - Archives final data
   - Cleans up resources

### Manual Override

You can manually control collection using the API endpoints:

- `POST /api/events/{eventId}/zones/start-collection`
- `POST /api/events/{eventId}/zones/stop-collection`

## Database Schema

### ZoneState Table

```sql
CREATE TABLE "ZoneState" (
  "id" TEXT PRIMARY KEY,
  "zoneId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL,
  "timeIndex" INTEGER NOT NULL,
  "peopleCount" INTEGER NOT NULL,
  "densityLevel" "DensityLevel" NOT NULL,
  "densityValue" DOUBLE PRECISION NOT NULL,
  "occupancyPercent" DOUBLE PRECISION NOT NULL,
  "flowRateIn" DOUBLE PRECISION NOT NULL,
  "flowRateOut" DOUBLE PRECISION NOT NULL,
  "netFlow" DOUBLE PRECISION NOT NULL,
  "avgMovementSpeed" DOUBLE PRECISION,
  "waitTime" DOUBLE PRECISION,
  "riskLevel" "RiskLevel" NOT NULL,
  "riskScore" DOUBLE PRECISION NOT NULL,
  "temperatureCelsius" DOUBLE PRECISION,
  "weatherConditions" TEXT,
  "eventPhase" TEXT NOT NULL,
  "cameraHealth" DOUBLE PRECISION NOT NULL,
  "dataSource" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "anomalyFlags" TEXT[],
  "alerts" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "ZoneState_eventId_timestamp_idx" ON "ZoneState"("eventId", "timestamp");
CREATE INDEX "ZoneState_zoneId_timeIndex_idx" ON "ZoneState"("zoneId", "timeIndex");
```

## Performance Considerations

### Data Retention

- **Active Events**: All data retained
- **Completed Events**: Aggregate to hourly after 7 days
- **Historical Data**: Archive to cold storage after 30 days

### Optimization Tips

1. **Index Usage**: Query by `eventId + timestamp` or `zoneId + timeIndex`
2. **Batch Queries**: Use `window` parameter to limit data size
3. **WebSocket**: Subscribe only to zones of interest
4. **Caching**: System maintains in-memory cache of latest states

### Scalability

- **Concurrent Events**: System supports multiple events simultaneously
- **Camera Load**: Parallelized camera analysis
- **Database**: Optimized indexes for time-series queries
- **WebSocket**: Efficient room-based broadcasting

## Monitoring

### Health Checks

1. **Camera Health**: Percentage of cameras reporting (0-1)
2. **Data Freshness**: Time since last update
3. **Collection Status**: Active/Inactive per event

### Logs

```bash
# Check lifecycle manager status
[Event Lifecycle Manager] Starting data collection for active event: Football Match (evt-123)

# Check real-time service status
[Zone Real-Time Data] Collection started successfully
[Zone Real-Time Data] Collecting data for event: evt-123
[Zone Real-Time Data] Collection complete for 16 zones
```

### Metrics to Monitor

- Zone update frequency (should be every 5 minutes)
- Camera health score (should be > 0.8)
- Data confidence level (should be > 0.9)
- API response times
- Database query performance

## Troubleshooting

### No Data Available

**Symptom**: API returns 404 "No real-time data available"

**Solutions**:

1. Check if data collection is started: `GET /api/events/{eventId}/zones/realtime-status`
2. Manually start collection: `POST /api/events/{eventId}/zones/start-collection`
3. Verify event status is ACTIVE
4. Check camera connectivity

### Low Camera Health

**Symptom**: `cameraHealth < 0.8` in zone states

**Solutions**:

1. Check camera service logs
2. Verify camera IDs in zone mappings
3. Ensure cameras are online and streaming
4. Check VideoFrame table for recent data

### Gaps in Time-Series Data

**Symptom**: Missing timesteps in zone state history

**Solutions**:

1. Check server uptime (collection requires continuous operation)
2. Verify database connection
3. Review error logs for failed aggregations
4. Ensure sufficient disk space for video frames

## Configuration

### Environment Variables

```bash
# Enable simulation fallback (development only)
ENABLE_SIMULATION_FALLBACK=false

# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/drishtix

# Server port
PORT=3000
```

### Zone-Camera Mappings

Edit `server/services/zone-realtime-data.service.ts`:

```typescript
private zoneCameraMappings: ZoneCameraMapping[] = [
  { zoneId: 'your-zone-id', cameraIds: ['cam-01', 'cam-02'], zoneType: 'GATE' },
  // Add more mappings...
];
```

### Collection Intervals

Edit `server/services/zone-realtime-data.service.ts`:

```typescript
private readonly COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes
private readonly CAMERA_ANALYSIS_INTERVAL = 10000;    // 10 seconds
```

## Migration from Simulation

If you were using the simulation service previously:

1. **Disable Simulation**: Set `ENABLE_SIMULATION_FALLBACK=false`
2. **Configure Cameras**: Update zone-camera mappings
3. **Start Collection**: Call start-collection API
4. **Verify Data**: Check realtime-status endpoint
5. **Update LSTM**: No changes needed - same API format

## Next Steps

1. **Configure Zone Mappings**: Map your cameras to logical zones
2. **Start Collection**: Let the Event Lifecycle Manager handle it automatically
3. **Test APIs**: Verify real-time data flow
4. **Integrate LSTM**: Use the LSTM-ready data format
5. **Monitor**: Watch health metrics and logs
6. **Scale**: Add more zones and cameras as needed

## Support

For issues or questions:

- Check server logs: `[Zone Real-Time Data]` and `[Event Lifecycle Manager]`
- Review API documentation: `CROWD_FORECASTING_API_REFERENCE.md`
- Contact: technical-support@drishtix.com
