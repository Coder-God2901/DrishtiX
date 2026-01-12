# Real-Time Zone Forecasting - Quick Start Guide

This guide shows how to configure, test, and use the real-time zone forecasting system with LSTM integration.

## Prerequisites

- Node.js running DrishtiX backend
- PostgreSQL database configured
- Camera system with YOLO detection running
- (Optional) LSTM prediction service running on port 5000

## Step 1: Configure Zone-Camera Mappings

### Option A: Use Default Configuration

The system includes a default stadium configuration with 16 zones. No changes needed!

### Option B: Create Custom Venue Configuration

Edit `server/config/zone-camera-mappings.config.ts`:

```typescript
export const VENUE_CONFIGURATIONS: Record<string, ZoneCameraMapping[]> = {
  // Your custom venue
  'my-venue-2025': [
    {
      zoneId: 'ENTRANCE_MAIN',
      zoneName: 'Main Entrance',
      zoneType: 'entry_exit',
      cameraIds: ['CAM_001', 'CAM_002'],
      maxCapacity: 500,
      coordinates: { lat: 40.7128, lng: -74.006 },
      priority: 'high',
      enabled: true,
    },
    // Add more zones...
  ],
};
```

### Option C: Load from Database (Production)

Modify `loadZoneMappings()` in `zone-realtime-data.service.ts` to fetch from database instead of config file.

## Step 2: Create an Event

```bash
# Create event via API
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stadium Concert 2025",
    "eventType": "CONCERT",
    "venue": "my-venue-2025",
    "startTime": "2025-06-15T18:00:00Z",
    "endTime": "2025-06-15T23:00:00Z",
    "maxCapacity": 50000,
    "status": "UPCOMING"
  }'
```

Save the returned `eventId` - you'll need it!

## Step 3: Validate Configuration

```bash
# Test zone configuration
curl -X POST http://localhost:3000/api/monitoring/zones/validate \
  -H "Content-Type: application/json" \
  -d '{"eventId": "your-event-id"}'
```

**Expected Response:**

```json
{
  "success": true,
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "info": ["Found 16 zones configured", "Found 32 cameras total"]
  }
}
```

## Step 4: Start Data Collection

### Automatic (Recommended)

Data collection starts automatically when:

- Event status changes to `ACTIVE`
- Event is within 30 minutes of start time

### Manual Start

```bash
# Manually start collection
curl -X POST http://localhost:3000/api/events/your-event-id/zones/start
```

## Step 5: Test Data Flow

```bash
# Test data collection for 10 minutes
curl -X POST http://localhost:3000/api/monitoring/zones/test-flow \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "your-event-id",
    "durationMinutes": 10
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "test": {
    "passed": true,
    "zonesWithData": 16,
    "totalDataPoints": 192,
    "avgDataPointsPerZone": 12,
    "continuityScore": 0.95,
    "freshnessScore": 1.0
  }
}
```

## Step 6: Monitor Real-Time Data

### Check Zone Status

```bash
# Get current status of all zones
curl http://localhost:3000/api/monitoring/events/your-event-id/zones/status
```

**Response:**

```json
{
  "success": true,
  "eventId": "your-event-id",
  "zonesCount": 16,
  "zones": [
    {
      "zoneId": "ENTRANCE_NORTH",
      "zoneName": "North Entrance",
      "currentCount": 245,
      "occupancyPercent": 49.0,
      "densityValue": 0.49,
      "riskScore": 0.35,
      "lastUpdated": "2025-06-15T18:30:00Z",
      "dataAge": 15000
    }
  ]
}
```

### Check Collection Metrics

```bash
# Get collection performance metrics
curl http://localhost:3000/api/monitoring/events/your-event-id/metrics
```

**Response:**

```json
{
  "success": true,
  "eventId": "your-event-id",
  "metrics": {
    "collectionsCount": 120,
    "lastCollectionTime": "2025-06-15T18:30:00Z",
    "errors": 2,
    "successRate": 0.983
  }
}
```

## Step 7: Integrate LSTM Model

### Check LSTM Service

```bash
# Verify LSTM service is running
curl http://localhost:3000/api/monitoring/lstm/health
```

**Expected Response:**

```json
{
  "connected": true,
  "version": "1.0.0",
  "timestamp": "2025-06-15T18:30:00Z"
}
```

### Get LSTM Input Data

```bash
# Fetch LSTM-ready data for a zone
curl -X POST http://localhost:3000/api/events/your-event-id/zones/lstm-input \
  -H "Content-Type: application/json" \
  -d '{
    "zoneId": "ENTRANCE_NORTH",
    "windowMinutes": 60
  }'
```

**Response:**

```json
{
  "success": true,
  "input": {
    "zoneId": "ENTRANCE_NORTH",
    "zoneName": "North Entrance",
    "features": [
      {
        "peopleCount": 200,
        "densityValue": 0.40,
        "flowRateIn": 15.5,
        "flowRateOut": 8.2,
        "avgMovementSpeed": 1.2,
        "temperatureCelsius": 25,
        "occupancyPercent": 40.0,
        "riskScore": 0.25
      }
      // ... 11 more timesteps (12 total = 60 minutes / 5-min intervals)
    ],
    "timeIndices": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    "timestamps": ["2025-06-15T17:30:00Z", ...],
    "windowSize": 12
  }
}
```

### Run Predictions

```bash
# Generate predictions for all zones
curl -X POST http://localhost:3000/api/monitoring/lstm/predict \
  -H "Content-Type: application/json" \
  -d '{"eventId": "your-event-id"}'
```

**Response:**

```json
{
  "success": true,
  "predictionsCount": 16,
  "errors": [],
  "timestamp": "2025-06-15T18:30:00Z"
}
```

### Get Predictions

```bash
# Retrieve stored predictions
curl http://localhost:3000/api/events/your-event-id/predictions/latest
```

## Step 8: Generate Test Report

```bash
# Generate comprehensive report
curl http://localhost:3000/api/monitoring/events/your-event-id/report
```

**Response:** Full validation report with:

- Zone configuration validation
- Data flow test results
- LSTM data format validation
- System health check
- Recommendations

## Step 9: Monitor System Health

```bash
# Check overall system health
curl http://localhost:3000/api/monitoring/health?eventId=your-event-id
```

**Response:**

```json
{
  "status": "healthy",
  "health": {
    "overallStatus": "healthy",
    "databaseConnected": true,
    "activeCollections": 1,
    "staleData": 0,
    "issues": []
  }
}
```

## Step 10: Export Training Data (Optional)

```bash
# Export data for model training
curl -X POST http://localhost:3000/api/monitoring/lstm/export-training-data \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "your-event-id",
    "startTime": "2025-06-15T17:00:00Z",
    "endTime": "2025-06-15T23:00:00Z"
  }'
```

## Multi-Event Scaling

The system supports multiple concurrent events:

```bash
# Start multiple events
curl -X POST http://localhost:3000/api/events/event-1/zones/start
curl -X POST http://localhost:3000/api/events/event-2/zones/start
curl -X POST http://localhost:3000/api/events/event-3/zones/start

# Check active events
curl http://localhost:3000/api/monitoring/active-events
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "eventIds": ["event-1", "event-2", "event-3"]
}
```

## Troubleshooting

### No Data Collected

1. Check camera service is running: `curl http://localhost:8080/health`
2. Verify zone-camera mappings are correct
3. Check logs: `grep "Zone Real-Time Data" server.log`
4. Run validation: `POST /api/monitoring/zones/validate`

### LSTM Service Not Connected

1. Start LSTM service: `python lstm_service.py`
2. Check health: `GET /api/monitoring/lstm/health`
3. Verify environment variable: `LSTM_SERVICE_URL=http://localhost:5000`

### Low Success Rate

1. Check metrics: `GET /api/monitoring/events/:eventId/metrics`
2. If success rate < 90%, investigate camera connectivity
3. Check system health: `GET /api/monitoring/health`

### Stale Data

1. Data is considered stale if > 10 minutes old
2. Check collection is running: `GET /api/monitoring/active-events`
3. Restart collection if needed: `POST /api/events/:eventId/zones/start`

## Environment Variables

```bash
# .env file
LSTM_SERVICE_URL=http://localhost:5000  # LSTM prediction service
DATABASE_URL=postgresql://...            # PostgreSQL connection
CAMERA_API_URL=http://localhost:8080    # Camera/YOLO service
```

## Next Steps

1. **Customize zones**: Edit zone-camera mappings for your venue
2. **Train LSTM model**: Use exported data for training
3. **Set up alerts**: Configure thresholds for crowd alerts
4. **Production deployment**: Use environment-specific configs
5. **Scaling**: Add more cameras and zones as needed

## Support

For issues or questions:

- Check logs: `tail -f server.log`
- Run health check: `GET /api/monitoring/health`
- Generate report: `GET /api/monitoring/events/:eventId/report`
- Contact: support@drishtix.com
