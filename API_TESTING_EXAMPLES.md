# API Testing Examples - Crowd Forecasting

## Prerequisites

- Server running: `npm run dev`
- PostgreSQL database running
- Replace `{eventId}` with actual event ID from your database

## 1. Initialize Zones (Auto-Creates 16 Stadium Zones)

```bash
curl -X GET http://localhost:3000/api/events/{eventId}/zones
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "eventId": "{eventId}",
      "zoneId": "gate_north",
      "zoneName": "North Entrance Gate",
      "areaCategory": 1,
      "areaCategoryName": "Entry Gate",
      "maxCapacity": 500,
      "areaSqMeters": 200,
      "fixedSeating": false,
      "bottleneckProne": true,
      "queueProne": true,
      "zonePriority": 5,
      "connectedZones": ["concourse_north", "security_north"]
    }
    // ... 15 more zones
  ],
  "simulated": true,
  "message": "Zones initialized with simulation data"
}
```

---

## 2. Get Single Zone Metadata

```bash
curl -X GET http://localhost:3000/api/events/{eventId}/zones/gate_north
```

---

## 3. Generate Simulation Data (2 hours, 5-min intervals)

```bash
curl -X POST http://localhost:3000/api/events/{eventId}/zones/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 120,
    "interval": 5
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Simulation data generated successfully",
  "data": {
    "zonesCount": 16,
    "timesteps": 24,
    "statesCreated": 384,
    "duration": "120 minutes",
    "interval": "5 minutes"
  }
}
```

---

## 4. Get Latest Zone States (All Zones)

```bash
curl -X GET http://localhost:3000/api/events/{eventId}/zones/state/latest
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "eventId": "{eventId}",
      "zoneId": "gate_north",
      "timestamp": "2026-01-12T16:00:00.000Z",
      "timestepIndex": 0,
      "crowdCount": 350,
      "crowdDensity": 1.75,
      "densityLevel": "HIGH",
      "inflowRate": 45.5,
      "outflowRate": 12.3,
      "netFlowRate": 33.2,
      "avgSpeed": 0.8,
      "directionEntropy": 0.7,
      "schedulePhase": "MAIN_ENTRY",
      "isPeakWindow": true,
      "riskLevel": "MEDIUM",
      "congestionScore": 0.7,
      "dataSource": "simulation",
      "confidence": 0.85
    }
    // ... 15 more zones
  ],
  "simulated": false,
  "timestamp": "2026-01-12T16:00:00.000Z"
}
```

---

## 5. Get Time-Series Window (Last 60 Minutes)

```bash
curl -X GET "http://localhost:3000/api/events/{eventId}/zones/state?window=60"
```

**Response includes:**

- `states`: Array of all zone states (192 records = 16 zones × 12 timesteps)
- `groupedByZone`: Object with states grouped by zone ID
- `windowMinutes`: 60
- `timesteps`: 12
- `zones`: 16

---

## 6. Get Time-Series for Specific Zone

```bash
curl -X GET "http://localhost:3000/api/events/{eventId}/zones/state?window=60&zoneId=gate_north"
```

---

## 7. Get Zone History (Time Range)

```bash
curl -X GET "http://localhost:3000/api/events/{eventId}/zones/gate_north/state/history?startTime=2026-01-12T16:00:00Z&endTime=2026-01-12T17:00:00Z&limit=100"
```

---

## 8. Create/Update Event Schedule

```bash
curl -X POST http://localhost:3000/api/events/{eventId}/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "gatesOpenTime": "2026-01-12T16:00:00Z",
    "eventStartTime": "2026-01-12T17:30:00Z",
    "eventEndTime": "2026-01-12T19:30:00Z",
    "halftimeStart": "2026-01-12T18:15:00Z",
    "halftimeEnd": "2026-01-12T18:30:00Z",
    "exitStartTime": "2026-01-12T19:15:00Z",
    "venueCloseTime": "2026-01-12T20:30:00Z",
    "peakWindows": [
      {
        "start": "2026-01-12T16:00:00Z",
        "end": "2026-01-12T17:00:00Z",
        "phase": "MAIN_ENTRY",
        "reason": "Initial entry rush"
      },
      {
        "start": "2026-01-12T18:15:00Z",
        "end": "2026-01-12T18:30:00Z",
        "phase": "HALFTIME",
        "reason": "Halftime break"
      }
    ],
    "miniEvents": []
  }'
```

---

## 9. Get Schedule Context (Current Phase)

```bash
curl -X GET http://localhost:3000/api/events/{eventId}/schedule/context
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "schedule": {
      "id": "uuid",
      "eventId": "{eventId}",
      "gatesOpenTime": "2026-01-12T16:00:00.000Z",
      "eventStartTime": "2026-01-12T17:30:00.000Z",
      "eventEndTime": "2026-01-12T19:30:00.000Z",
      "currentPhase": "MAIN_ENTRY",
      "peakWindows": [...]
    },
    "currentPhase": "MAIN_ENTRY",
    "isPeakWindow": true,
    "currentMiniEvent": null,
    "timestamp": "2026-01-12T16:30:00.000Z"
  }
}
```

---

## 10. Push ML Forecast (ML Service → Backend)

```bash
curl -X POST http://localhost:3000/api/events/{eventId}/zones/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "zoneId": "gate_north",
    "targetTime": "2026-01-12T17:00:00Z",
    "horizonMinutes": 30,
    "predictedCount": 450,
    "predictedDensity": 2.25,
    "predictedDensityLevel": "CRITICAL",
    "predictedRiskLevel": "HIGH",
    "predictedInflow": 55.0,
    "predictedOutflow": 15.0,
    "confidence": 0.87,
    "modelVersion": "lstm-v1.0",
    "modelType": "LSTM",
    "inputFeatures": {
      "historical_window": 12,
      "features_used": ["count", "density", "inflow", "outflow", "phase"]
    },
    "alerts": [
      {
        "type": "FORECAST_CRITICAL",
        "severity": "HIGH",
        "message": "Zone predicted to reach critical density in 30 minutes"
      }
    ],
    "recommendations": [
      "Deploy additional staff to gate_north",
      "Consider flow restrictions",
      "Monitor connected zones"
    ]
  }'
```

---

## 11. Get Forecasts (View Predictions)

```bash
curl -X GET "http://localhost:3000/api/events/{eventId}/zones/forecast?horizon=30&zoneId=gate_north"
```

---

## 12. Manually Push Zone State (Sensor Integration)

```bash
curl -X POST http://localhost:3000/api/events/{eventId}/zones/gate_north/state \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-12T16:05:00Z",
    "timestepIndex": 1,
    "crowdCount": 380,
    "crowdDensity": 1.9,
    "densityLevel": "HIGH",
    "inflowRate": 50.0,
    "outflowRate": 15.0,
    "avgSpeed": 0.7,
    "directionEntropy": 0.75,
    "schedulePhase": "MAIN_ENTRY",
    "isPeakWindow": true,
    "riskLevel": "HIGH",
    "congestionScore": 0.76,
    "dataSource": "camera",
    "confidence": 0.92
  }'
```

---

## 13. WebSocket Testing (JavaScript)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Subscribe to all zones for an event
socket.emit('subscribe:zones', 'EVENT_ID');

// Subscribe to specific zone
socket.emit('subscribe:zone', {
  eventId: 'EVENT_ID',
  zoneId: 'gate_north',
});

// Listen for zone updates
socket.on('zone:update', (data) => {
  console.log('Zone state updated:', data);
});

// Listen for forecasts
socket.on('zone:forecast', (data) => {
  console.log('New forecast:', data);
});

// Listen for alerts
socket.on('zone:alert', (data) => {
  console.log('Zone alert:', data);
  // data = { type, eventId, zoneId, alert: { severity, message } }
});
```

---

## Quick Test Sequence

```bash
# 1. Initialize zones
curl http://localhost:3000/api/events/EVENT_ID/zones

# 2. Generate 2 hours of data
curl -X POST http://localhost:3000/api/events/EVENT_ID/zones/simulate \
  -H "Content-Type: application/json" \
  -d '{"duration": 120, "interval": 5}'

# 3. Get latest states
curl http://localhost:3000/api/events/EVENT_ID/zones/state/latest

# 4. Get 60-minute window
curl "http://localhost:3000/api/events/EVENT_ID/zones/state?window=60"

# 5. Get schedule context
curl http://localhost:3000/api/events/EVENT_ID/schedule/context
```

---

## Expected Data Patterns

### Entry Phase (MAIN_ENTRY)

- Gates: 60-80% capacity, high inflow
- Concourses: 40-60% capacity, high flow
- Stands: Gradually filling (20-80%)
- Food/Washrooms: Low usage

### Main Event (MAIN_EVENT)

- Gates: Low activity
- Concourses: 10-20% capacity
- Stands: 95-100% capacity
- Food/Washrooms: Minimal usage

### Halftime (HALFTIME)

- Gates: Minimal activity
- Concourses: 70-80% capacity
- Stands: 20-40% capacity (people leave seats)
- Food/Washrooms: 80-90% capacity, high wait times

### Exit Phase (EXIT_PHASE)

- Gates: 70-80% capacity, high outflow
- Concourses: 60-70% capacity
- Stands: Gradually emptying
- Food/Washrooms: Low usage

---

## Troubleshooting

### "Event not found"

→ Use valid event ID from database: `SELECT id FROM "Event" LIMIT 1;`

### "No zones found" but simulated=false

→ Run: `POST /api/events/EVENT_ID/zones/simulate`

### Empty states array

→ Generate data first with simulate endpoint

### WebSocket not connecting

→ Check server is running and CORS settings

---

## Postman Collection

Import this collection to Postman:

**Base URL**: `http://localhost:3000`

**Variables**:

- `eventId`: Your event ID
- `zoneId`: Zone ID (e.g., gate_north)

**Endpoints**: All 13 endpoints above

---

## Python Testing Script

```python
import requests

BASE_URL = "http://localhost:3000/api/events"
EVENT_ID = "your-event-id"

# 1. Initialize zones
response = requests.get(f"{BASE_URL}/{EVENT_ID}/zones")
print(f"Zones: {response.json()}")

# 2. Generate simulation
response = requests.post(
    f"{BASE_URL}/{EVENT_ID}/zones/simulate",
    json={"duration": 120, "interval": 5}
)
print(f"Simulation: {response.json()}")

# 3. Get latest states
response = requests.get(f"{BASE_URL}/{EVENT_ID}/zones/state/latest")
states = response.json()
print(f"Latest states: {len(states['data'])} zones")

# 4. Get time window
response = requests.get(
    f"{BASE_URL}/{EVENT_ID}/zones/state",
    params={"window": 60}
)
data = response.json()['data']
print(f"Time window: {data['timesteps']} timesteps across {data['zones']} zones")
```

---

**Happy Testing! 🚀**
