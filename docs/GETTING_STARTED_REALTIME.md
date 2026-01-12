# Getting Started with Real-Time Zone Forecasting

This guide will help you quickly set up and test the real-time zone forecasting system.

## Prerequisites

- ✅ PostgreSQL database running
- ✅ DrishtiX server configured
- ✅ Camera feeds available (or VideoFrame data in database)
- ✅ Node.js 18+ installed

## Quick Setup (5 minutes)

### Step 1: Configure Zone-Camera Mappings

Edit `server/services/zone-realtime-data.service.ts` around line 40:

```typescript
private zoneCameraMappings: ZoneCameraMapping[] = [
  // Replace these with your actual camera IDs and zones
  { zoneId: 'north-gate-1', cameraIds: ['cam-ng1-01', 'cam-ng1-02'], zoneType: 'GATE' },
  { zoneId: 'south-gate-1', cameraIds: ['cam-sg1-01'], zoneType: 'GATE' },
  // ... add more zones
];
```

**Tip**: Match `cameraIds` to the cameras in your VideoFrame table or camera service.

### Step 2: Set Environment Variables

Create or update `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/drishtix

# Real-time data collection (production)
ENABLE_SIMULATION_FALLBACK=false

# Port
PORT=3000
```

### Step 3: Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Apply migration
npx prisma migrate dev --name add_zone_forecasting_realtime
```

### Step 4: Start the Server

```bash
npm run dev
```

Look for these log messages:

```
✓ GCP Services Orchestrator ready
✓ Real-time workers started
🚀 Starting Event Lifecycle Manager...
✓ Event Lifecycle Manager initialized
```

## Testing the System

### Test 1: Check System Status

```bash
curl http://localhost:3000/api/events/YOUR_EVENT_ID/zones/realtime-status
```

Expected response:

```json
{
  "success": true,
  "data": {
    "zonesTracked": 16,
    "collectionInterval": "5 minutes",
    "dataSource": "CAMERA"
  }
}
```

### Test 2: Start Data Collection (Manual)

```bash
curl -X POST http://localhost:3000/api/events/YOUR_EVENT_ID/zones/start-collection
```

### Test 3: Get Zone Metadata

```bash
curl http://localhost:3000/api/events/YOUR_EVENT_ID/zones
```

You should see 16 zones initialized.

### Test 4: Wait 5 Minutes, Then Fetch Data

```bash
curl "http://localhost:3000/api/events/YOUR_EVENT_ID/zones/state?window=60"
```

Expected: Array of zone states with real camera data.

### Test 5: Get Latest Snapshot

```bash
curl http://localhost:3000/api/events/YOUR_EVENT_ID/zones/state/latest
```

### Test 6: Test WebSocket (Browser Console)

```javascript
const socket = io('http://localhost:3000');
socket.emit('subscribe:zones', 'YOUR_EVENT_ID');
socket.on('zone:state-update', (data) => {
  console.log('Real-time update:', data);
});
```

## Automatic Data Collection

The system automatically starts data collection when:

- Event status changes to ACTIVE
- Event startTime is reached
- 30 minutes before event start (pre-collection)

### To Enable Automatic Collection:

1. Ensure Event Lifecycle Manager is running (starts with server)
2. Set your event status to ACTIVE:

```bash
curl -X PATCH http://localhost:3000/api/events/YOUR_EVENT_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE"}'
```

3. Check logs:

```
[Event Lifecycle Manager] Starting data collection for active event: ...
```

## LSTM Integration Test

Save as `test_lstm_integration.py`:

```python
import requests
import numpy as np
import time

API_URL = "http://localhost:3000"
EVENT_ID = "YOUR_EVENT_ID"

def test_lstm_data_fetch():
    """Test fetching LSTM-ready data"""
    print("Fetching zone data...")

    response = requests.get(
        f"{API_URL}/api/events/{EVENT_ID}/zones/state",
        params={"window": 60}
    )

    if response.status_code != 200:
        print(f"Error: {response.json()}")
        return

    data = response.json()['data']
    zones = data['groupedByZone']

    print(f"✓ Fetched data for {len(zones)} zones")
    print(f"✓ Total timesteps: {data['timesteps']}")
    print(f"✓ Data source: {response.json().get('dataSource', 'UNKNOWN')}")

    # Check first zone
    first_zone = list(zones.keys())[0]
    states = zones[first_zone]

    print(f"\nZone: {first_zone}")
    print(f"States: {len(states)}")

    if len(states) >= 12:
        # Extract features for LSTM
        features = ['peopleCount', 'densityValue', 'flowRateIn',
                    'flowRateOut', 'avgMovementSpeed']

        X = np.array([[s[f] for f in features] for s in states[-12:]])
        print(f"\nLSTM Input Shape: {X.shape}")
        print("✓ Data format ready for LSTM!")

        # Show sample data
        print("\nSample data (last state):")
        for feature in features:
            print(f"  {feature}: {states[-1][feature]}")
    else:
        print(f"⚠ Need at least 12 timesteps, got {len(states)}")
        print("  Wait for more data collection cycles...")

if __name__ == "__main__":
    test_lstm_data_fetch()
```

Run:

```bash
python test_lstm_integration.py
```

## Troubleshooting

### Problem: "No real-time data available"

**Solution**:

1. Check if data collection is started:

   ```bash
   curl http://localhost:3000/api/events/YOUR_EVENT_ID/zones/realtime-status
   ```

2. Start manually if needed:

   ```bash
   curl -X POST http://localhost:3000/api/events/YOUR_EVENT_ID/zones/start-collection
   ```

3. Check camera data in database:
   ```sql
   SELECT COUNT(*) FROM "VideoFrame" WHERE "eventId" = 'YOUR_EVENT_ID';
   ```

### Problem: Low Camera Health

**Solution**:

1. Verify cameras are streaming
2. Check VideoFrame table for recent data
3. Review camera IDs in zone mappings

### Problem: Missing Timesteps

**Solution**:

1. Ensure server is running continuously
2. Check database connection
3. Review server logs for errors

## Monitoring

### Real-Time Dashboard (SQL Queries)

```sql
-- Check latest data collection
SELECT "zoneId", MAX("timestamp") as last_update, COUNT(*) as data_points
FROM "ZoneState"
WHERE "eventId" = 'YOUR_EVENT_ID'
GROUP BY "zoneId"
ORDER BY last_update DESC;

-- Check camera health
SELECT "zoneId", AVG("cameraHealth") as avg_health, AVG("confidence") as avg_confidence
FROM "ZoneState"
WHERE "eventId" = 'YOUR_EVENT_ID'
GROUP BY "zoneId";

-- Check density distribution
SELECT "densityLevel", COUNT(*) as count
FROM "ZoneState"
WHERE "eventId" = 'YOUR_EVENT_ID'
GROUP BY "densityLevel";
```

### Server Logs to Monitor

```bash
# Watch real-time data collection
tail -f server.log | grep "Zone Real-Time Data"

# Watch lifecycle events
tail -f server.log | grep "Event Lifecycle Manager"
```

## Configuration Options

### Adjust Collection Intervals

Edit `server/services/zone-realtime-data.service.ts`:

```typescript
// Line ~30
private readonly COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes
private readonly CAMERA_ANALYSIS_INTERVAL = 10000;    // 10 seconds
```

### Change Zone Capacity/Area

Edit `server/services/zone-realtime-data.service.ts`:

```typescript
// Line ~170
private getZoneCapacity(type: string): number {
  const capacities: Record<string, number> = {
    GATE: 200,
    STAND: 1000,
    CONCOURSE: 500,
    // ... customize
  };
  return capacities[type] || 500;
}
```

### Enable Simulation Fallback (Development Only)

```bash
# .env
ENABLE_SIMULATION_FALLBACK=true
```

## Production Checklist

Before deploying to production:

- [ ] Zone-camera mappings configured correctly
- [ ] Camera feeds verified and working
- [ ] Database migration applied
- [ ] `ENABLE_SIMULATION_FALLBACK=false`
- [ ] Server restart tested
- [ ] Data collection verified for sample event
- [ ] LSTM integration tested
- [ ] Monitoring dashboards set up
- [ ] Alert thresholds configured
- [ ] Backup/restore procedures documented

## Next Steps

1. **Day 1**: Configure and test with one event
2. **Week 1**: Validate data accuracy and LSTM integration
3. **Week 2**: Optimize zone mappings and collection intervals
4. **Month 1**: Scale to multiple events and add advanced features

## Getting Help

- **Documentation**: `docs/REALTIME_ZONE_DATA_INTEGRATION.md`
- **Quick Reference**: `docs/REALTIME_ZONE_DATA_QUICK_REFERENCE.md`
- **Summary**: `docs/REALTIME_INTEGRATION_SUMMARY.md`
- **Logs**: Check `[Zone Real-Time Data]` and `[Event Lifecycle Manager]` in server logs

---

**Ready to start? Run the Quick Setup above and test with your first event!** 🚀
