# Crowd Forecasting Backend - Quick Reference

## 🚀 Quick Start

```bash
# 1. Apply database migration
npx prisma migrate dev --name add_crowd_forecasting_schema

# 2. Generate Prisma client
npx prisma generate

# 3. Start server
npm run dev
```

## 📍 API Endpoints

### Zone Metadata

```bash
GET  /api/events/:eventId/zones
GET  /api/events/:eventId/zones/:zoneId
```

### Zone State (Time-Series)

```bash
GET  /api/events/:eventId/zones/state?window=60&zoneId=gate_north
GET  /api/events/:eventId/zones/state/latest
GET  /api/events/:eventId/zones/:zoneId/state/history
POST /api/events/:eventId/zones/:zoneId/state
```

### Schedule Context

```bash
GET  /api/events/:eventId/schedule/context
POST /api/events/:eventId/schedule
```

### Forecasting

```bash
GET  /api/events/:eventId/zones/forecast?horizon=30
POST /api/events/:eventId/zones/forecast
```

### Simulation

```bash
POST /api/events/:eventId/zones/simulate
```

## 🔌 WebSocket Events

```javascript
// Subscribe
socket.emit('subscribe:zones', eventId);
socket.emit('subscribe:zone', { eventId, zoneId });

// Listen
socket.on('zone:update', (data) => { ... });
socket.on('zone:forecast', (data) => { ... });
socket.on('zone:alert', (data) => { ... });
```

## 📊 Key Data Fields

### ZoneState (Every 5 minutes)

```typescript
{
  timestamp: DateTime,
  timestepIndex: number,
  crowdCount: number,
  densityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  inflowRate: number,
  outflowRate: number,
  schedulePhase: "PRE_EVENT" | "MAIN_ENTRY" | "MAIN_EVENT" | ...,
  isPeakWindow: boolean,
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}
```

## 🎯 ML Integration Pattern

```javascript
// 1. Pull last 60 minutes (12 timesteps)
const data = await fetch(`/api/events/${eventId}/zones/state?window=60`);

// 2. Run LSTM model
const predictions = await lstmModel.predict(data);

// 3. Push predictions back
await fetch(`/api/events/${eventId}/zones/forecast`, {
  method: 'POST',
  body: JSON.stringify({
    zoneId: 'gate_north',
    targetTime: futureTime,
    horizonMinutes: 30,
    predictedCount: 450,
    predictedDensity: 2.25,
    ...predictions,
  }),
});
```

## 🎭 Default Stadium Zones (16)

- **Gates**: north, south, east, west (VIP)
- **Stands**: A, B, C, D (5000-4000 capacity)
- **Food Courts**: north, south
- **Washrooms**: north, south
- **Concourses**: north, south, east, west
- **VIP Lounge**

## ⏰ Schedule Phases

```
PRE_EVENT → EARLY_ENTRY → MAIN_ENTRY → PRE_SHOW →
MAIN_EVENT → HALFTIME → POST_HALFTIME → EVENT_ENDING →
EXIT_PHASE → POST_EVENT
```

## 🧪 Test Commands

```bash
# Initialize zones & generate 2 hours of data
curl -X POST http://localhost:3000/api/events/EVENT_ID/zones/simulate \
  -H "Content-Type: application/json" \
  -d '{"duration": 120, "interval": 5}'

# Get latest state
curl http://localhost:3000/api/events/EVENT_ID/zones/state/latest

# Get time window
curl "http://localhost:3000/api/events/EVENT_ID/zones/state?window=60"
```

## 📦 Files Modified/Created

```
prisma/schema.prisma                                    # Schema updates
server/routes/zone-forecasting.routes.ts                # API routes
server/services/zone-simulation.service.ts              # Simulation logic
server/services/zone-forecasting.service.ts             # Helper functions
server/types/zone-forecasting.types.ts                  # TypeScript types
server/index.ts                                         # Routes registered
docs/CROWD_FORECASTING_BACKEND_IMPLEMENTATION.md        # Full docs
```

## ⚡ Pro Tips

1. **Auto-initialization**: First call to `/zones` creates 16 default zones
2. **Auto-simulation**: First call to `/zones/state` generates sample data
3. **5-minute buckets**: All timestamps aligned to 5-min intervals
4. **Phase-aware**: Crowd patterns match schedule phases
5. **Smooth transitions**: Max 15% change between timesteps

## 🎓 Key Concepts

- **Zone**: Physical area (gate, stand, food court, etc.)
- **Timestep**: 5-minute interval snapshot
- **Window**: Historical time range for ML input (e.g., 60 min = 12 timesteps)
- **Horizon**: Future prediction time (10, 30, 60 minutes ahead)
- **Phase**: Event lifecycle stage (entry, main event, exit, etc.)
- **Peak Window**: High-traffic predicted period

## 🔧 Database Schema

```prisma
ZoneMetadata {
  id, eventId, zoneId, zoneName
  areaCategory, maxCapacity, areaSqMeters
  fixedSeating, bottleneckProne, queueProne
  zonePriority, connectedZones
}

ZoneState {
  eventId, zoneId, timestamp, timestepIndex
  crowdCount, densityLevel, inflowRate, outflowRate
  schedulePhase, isPeakWindow, riskLevel
}

EventSchedule {
  eventId, gatesOpenTime, eventStartTime, eventEndTime
  halftimeStart, halftimeEnd, peakWindows, currentPhase
}

CrowdForecast {
  eventId, zoneId, forecastTime, targetTime
  predictedCount, predictedDensity, confidence
  alerts, recommendations
}
```

## ✅ Checklist

- [ ] Run `npx prisma migrate dev`
- [ ] Run `npx prisma generate`
- [ ] Start server
- [ ] Test: GET `/api/events/EVENT_ID/zones`
- [ ] Test: POST `/api/events/EVENT_ID/zones/simulate`
- [ ] Test: GET `/api/events/EVENT_ID/zones/state?window=60`
- [ ] Test: WebSocket subscription
- [ ] Integrate with ML service

---

**Need Help?** See full docs: `docs/CROWD_FORECASTING_BACKEND_IMPLEMENTATION.md`
