# Quick Reference: Real-Time Zone Data for LSTM

## Starting Real-Time Collection

```bash
# Automatic (recommended)
# Collection starts automatically when event becomes ACTIVE

# Manual
curl -X POST http://localhost:3000/api/events/{eventId}/zones/start-collection
```

## Key Endpoints

| Endpoint                                       | Method | Purpose                           |
| ---------------------------------------------- | ------ | --------------------------------- |
| `/api/events/{eventId}/zones`                  | GET    | Get all zone metadata             |
| `/api/events/{eventId}/zones/state`            | GET    | Get time-series data (LSTM input) |
| `/api/events/{eventId}/zones/state/latest`     | GET    | Get current zone states           |
| `/api/events/{eventId}/zones/realtime-status`  | GET    | Check collection status           |
| `/api/events/{eventId}/zones/start-collection` | POST   | Start data collection             |
| `/api/events/{eventId}/zones/stop-collection`  | POST   | Stop data collection              |

## LSTM Data Format

```json
{
  "zoneId": "north-gate-1",
  "timestamp": "2025-01-15T10:00:00Z",
  "timeIndex": 0,
  "peopleCount": 45,
  "densityValue": 0.45,
  "flowRateIn": 5.2,
  "flowRateOut": 2.1,
  "avgMovementSpeed": 1.2,
  "temperatureCelsius": 28,
  "dataSource": "CAMERA",
  "confidence": 0.95
}
```

## Data Collection Flow

```
1. Event becomes ACTIVE → Auto-start collection
2. Every 10 seconds → Analyze camera frames
3. Every 5 minutes → Aggregate & store in database
4. LSTM Model → Fetch via API
5. Event ends → Auto-stop collection
```

## WebSocket Usage

```javascript
// Subscribe to all zones
socket.emit('subscribe:zones', eventId);
socket.on('zone:state-update', (data) => {
  console.log(data.zoneId, data.data);
});

// Subscribe to specific zone
socket.emit('subscribe:zone', { eventId, zoneId });
```

## Environment Variables

```bash
# Production (real data only)
ENABLE_SIMULATION_FALLBACK=false

# Development (allow simulation)
ENABLE_SIMULATION_FALLBACK=true
```

## Configuration

Edit `server/services/zone-realtime-data.service.ts`:

```typescript
// Zone-Camera mappings
private zoneCameraMappings: ZoneCameraMapping[] = [
  { zoneId: 'gate-1', cameraIds: ['cam-01', 'cam-02'], zoneType: 'GATE' }
];

// Intervals
private readonly COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 min
private readonly CAMERA_ANALYSIS_INTERVAL = 10000;    // 10 sec
```

## Python LSTM Integration

```python
import requests
import numpy as np

# Fetch real-time data
response = requests.get(
    f'{API_URL}/api/events/{event_id}/zones/state?window=60'
)
zones_data = response.json()['data']['groupedByZone']

# Prepare LSTM input (12 timesteps, 6 features)
zone_states = zones_data['north-gate-1'][-12:]
X = np.array([
    [s['peopleCount'], s['densityValue'], s['flowRateIn'],
     s['flowRateOut'], s['avgMovementSpeed'], s['temperatureCelsius']]
    for s in zone_states
])

# Predict
prediction = lstm_model.predict(X.reshape(1, 12, 6))
```

## Monitoring Commands

```bash
# Check status
curl http://localhost:3000/api/events/{eventId}/zones/realtime-status

# View latest data
curl http://localhost:3000/api/events/{eventId}/zones/state/latest

# Check logs
grep "Zone Real-Time Data" server.log
grep "Event Lifecycle Manager" server.log
```

## Health Indicators

| Metric           | Good  | Warning  | Critical |
| ---------------- | ----- | -------- | -------- |
| Camera Health    | > 0.9 | 0.7-0.9  | < 0.7    |
| Data Confidence  | > 0.9 | 0.8-0.9  | < 0.8    |
| Update Frequency | 5 min | 5-10 min | > 10 min |
| Active Zones     | 16    | 10-15    | < 10     |

## Troubleshooting

**No data available**

```bash
# Check collection status
curl http://localhost:3000/api/events/{eventId}/zones/realtime-status

# Start manually
curl -X POST http://localhost:3000/api/events/{eventId}/zones/start-collection
```

**Low camera health**

- Check camera service: `server/services/video-analytics.service.ts`
- Verify camera IDs in zone mappings
- Check VideoFrame table: `SELECT * FROM "VideoFrame" ORDER BY timestamp DESC LIMIT 10`

**Missing timesteps**

- Verify server uptime (collection needs continuous operation)
- Check database connection
- Review error logs

## Database Queries

```sql
-- Check latest zone states
SELECT "zoneId", "timestamp", "peopleCount", "densityLevel", "cameraHealth"
FROM "ZoneState"
WHERE "eventId" = 'evt-123'
ORDER BY "timestamp" DESC
LIMIT 20;

-- Count data points per zone
SELECT "zoneId", COUNT(*) as data_points
FROM "ZoneState"
WHERE "eventId" = 'evt-123'
GROUP BY "zoneId";

-- Check data freshness
SELECT "zoneId", MAX("timestamp") as last_update
FROM "ZoneState"
WHERE "eventId" = 'evt-123'
GROUP BY "zoneId";
```

## Key Files

| File                                                 | Purpose                                   |
| ---------------------------------------------------- | ----------------------------------------- |
| `server/services/zone-realtime-data.service.ts`      | Real-time data collection                 |
| `server/services/event-lifecycle-manager.service.ts` | Automatic lifecycle management            |
| `server/routes/zone-forecasting.routes.ts`           | REST API endpoints                        |
| `prisma/schema.prisma`                               | Database schema (ZoneState, ZoneMetadata) |

## Migration Checklist

- [ ] Set `ENABLE_SIMULATION_FALLBACK=false`
- [ ] Configure zone-camera mappings
- [ ] Start data collection
- [ ] Verify data in database
- [ ] Test LSTM integration
- [ ] Monitor health metrics

---

For detailed information, see [REALTIME_ZONE_DATA_INTEGRATION.md](./REALTIME_ZONE_DATA_INTEGRATION.md)
