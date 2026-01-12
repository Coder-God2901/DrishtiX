# Crowd Forecasting Model - Backend Implementation

## 🎯 Overview

This document describes the complete backend implementation for the **Crowd Forecasting Model** in DrishtiX. The implementation provides zone-level time-series data, APIs for LSTM model integration, and realistic data simulation capabilities.

## 📋 Implementation Summary

### ✅ Completed Components

1. **Prisma Database Schema** - Complete zone time-series data models
2. **REST API Endpoints** - All required APIs for ML integration
3. **WebSocket Support** - Real-time zone state updates
4. **Simulation Service** - Realistic data generation for testing
5. **TypeScript Types** - Full type definitions for API contracts

---

## 🗄️ Database Schema

### New Models Added

#### 1. `ZoneMetadata` (Static Configuration)

Stores permanent zone properties:

- Zone identification (ID, name, category)
- Capacity constraints (max capacity, area)
- Zone characteristics (fixed seating, bottleneck-prone, queue-prone)
- Priority and connectivity information
- Geographic data

#### 2. `ZoneState` (Time-Series Data)

Stores 5-minute interval snapshots:

- Temporal indexing (timestamp, timestep index)
- Crowd metrics (count, density, density level)
- Flow dynamics (inflow/outflow rates)
- Movement characteristics (speed, direction entropy)
- Queue metrics (length, wait time)
- Schedule context (phase, peak window)
- Risk indicators (risk level, congestion score)

#### 3. `EventSchedule` (Timeline Context)

Stores event phase information:

- Pre-event, entry, main event, halftime, exit timings
- Peak traffic windows
- Mini-events within main event
- Current phase tracking

#### 4. `CrowdForecast` (Model Predictions)

Stores ML model outputs:

- Prediction metadata (forecast time, target time, horizon)
- Predicted metrics (count, density, risk)
- Predicted flows (inflow, outflow)
- Confidence and model version
- Auto-generated alerts and recommendations

---

## 🔌 API Endpoints

### Base URL: `/api/events`

### 1. **Zone Metadata API**

#### GET `/:eventId/zones`

Returns all zones with static metadata for an event.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "eventId": "event123",
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
      "connectedZones": ["concourse_north", "security_north"],
      "coordinates": {...},
      "floor": 1
    }
  ],
  "simulated": false
}
```

**Auto-Initialization:** If no zones exist, automatically creates 16 simulated stadium zones.

#### GET `/:eventId/zones/:zoneId`

Get single zone metadata with latest state.

---

### 2. **Live Zone State API**

#### GET `/:eventId/zones/state?window=60&zoneId=gate_north`

Returns time-series zone data for sliding window.

**Query Parameters:**

- `window` (optional): Minutes to look back (default: 60)
- `zoneId` (optional): Filter by specific zone
- `limit` (optional): Max timesteps to return

**Response:**

```json
{
  "success": true,
  "data": {
    "states": [...],
    "groupedByZone": {
      "gate_north": [
        {
          "id": "uuid",
          "eventId": "event123",
          "zoneId": "gate_north",
          "timestamp": "2026-01-12T14:00:00Z",
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
      ]
    },
    "windowMinutes": 60,
    "timesteps": 12,
    "zones": 16
  }
}
```

#### GET `/:eventId/zones/state/latest`

Returns the latest zone state snapshot for all zones (most recent 5-minute bucket).

#### GET `/:eventId/zones/:zoneId/state/history?startTime=...&endTime=...&limit=100`

Get historical state data for a specific zone.

---

### 3. **Schedule Context API**

#### GET `/:eventId/schedule/context`

Returns current schedule phase and context.

**Response:**

```json
{
  "success": true,
  "data": {
    "schedule": {
      "eventId": "event123",
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
        }
      ],
      "currentPhase": "MAIN_ENTRY"
    },
    "currentPhase": "MAIN_ENTRY",
    "isPeakWindow": true,
    "currentMiniEvent": null,
    "timestamp": "2026-01-12T16:30:00Z"
  }
}
```

#### POST `/:eventId/schedule`

Create or update event schedule.

**Request Body:**

```json
{
  "gatesOpenTime": "2026-01-12T16:00:00Z",
  "eventStartTime": "2026-01-12T17:30:00Z",
  "eventEndTime": "2026-01-12T19:30:00Z",
  "exitStartTime": "2026-01-12T19:15:00Z",
  "venueCloseTime": "2026-01-12T20:30:00Z",
  "halftimeStart": "2026-01-12T18:15:00Z",
  "halftimeEnd": "2026-01-12T18:30:00Z",
  "peakWindows": [...],
  "miniEvents": [...]
}
```

---

### 4. **Forecasting & Predictions**

#### GET `/:eventId/zones/forecast?horizon=30&zoneId=gate_north`

Get crowd forecasts for zones.

**Query Parameters:**

- `horizon` (optional): Minutes ahead (10, 30, 60)
- `zoneId` (optional): Filter by zone

#### POST `/:eventId/zones/forecast`

Create new forecast (typically called by ML service).

**Request Body:**

```json
{
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
  "inputFeatures": {...},
  "alerts": [...],
  "recommendations": [...]
}
```

---

### 5. **Data Simulation & Testing**

#### POST `/:eventId/zones/simulate`

Generate simulated zone data for testing/demo.

**Request Body:**

```json
{
  "duration": 120, // minutes
  "interval": 5, // minutes between snapshots
  "zones": ["gate_north", "stand_a"] // optional
}
```

**Response:**

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

#### POST `/:eventId/zones/:zoneId/state`

Manually push a zone state update (for sensor integration).

---

## 🔄 WebSocket Support

### Real-Time Zone Updates

Clients can subscribe to real-time zone state updates:

```javascript
// Subscribe to all zones for an event
socket.emit('subscribe:zones', eventId);

// Subscribe to a specific zone
socket.emit('subscribe:zone', { eventId, zoneId });

// Listen for updates
socket.on('zone:update', (data) => {
  console.log('Zone state updated:', data);
});

socket.on('zone:forecast', (data) => {
  console.log('New forecast available:', data);
});

socket.on('zone:alert', (data) => {
  console.log('Zone alert:', data);
});
```

---

## 🎭 Simulation Service

### Features

The `ZoneSimulationService` provides:

1. **Automatic Zone Initialization**
   - 16 realistic stadium zones (gates, stands, food courts, washrooms, concourses, VIP)
   - Proper capacity, characteristics, and connectivity

2. **Realistic Data Generation**
   - Phase-aware crowd patterns (entry rush, halftime surge, exit wave)
   - Smooth temporal transitions (no sudden jumps)
   - Zone-appropriate behavior (queues at food courts, bottlenecks at gates)
   - Environmental factors (temperature, humidity)

3. **Time-Series Continuity**
   - Fixed 5-minute intervals
   - Sequential timestep indexing
   - Consistent flow calculations
   - Proper inflow/outflow relationships

### Simulation Logic

**Phase-Based Occupancy:**

- `PRE_EVENT`: 0% occupancy
- `MAIN_ENTRY`: 50-80% with waves
- `MAIN_EVENT`: 100% in stands, 10-20% in concourses
- `HALFTIME`: 90% in food/washrooms, 30% in stands
- `EXIT_PHASE`: 70-80% congestion at gates

**Zone-Specific Behavior:**

- Gates: High traffic during entry/exit
- Stands: Fill gradually, stay full during event
- Food Courts: Peak during halftime
- Washrooms: Queue-prone, high wait times
- Concourses: Transit zones, variable flow

---

## 📊 Data Update Rules

### Guaranteed Consistency

1. **Temporal Continuity**
   - `timestamp` increments in fixed 5-minute steps
   - `timestepIndex` increases monotonically
   - No gaps in time series

2. **Flow Coherence**
   - `crowdCount` changes align with flow rates
   - `netFlowRate = inflowRate - outflowRate`
   - Smooth transitions (max 15% change per step)

3. **Capacity Constraints**
   - `crowdCount ≤ maxCapacity × 1.2` (soft overflow)
   - `congestionScore = crowdCount / maxCapacity`
   - Density levels calculated from congestion

4. **Realistic Patterns**
   - Entry spikes during `MAIN_ENTRY` phase
   - Halftime surge in food/washrooms
   - Exit waves during `EXIT_PHASE`
   - Phase-appropriate behavior

---

## 🏗️ Zone Templates

### Default Stadium Zones (16 Zones)

| Zone ID           | Name                     | Category      | Capacity | Characteristics                     |
| ----------------- | ------------------------ | ------------- | -------- | ----------------------------------- |
| `gate_north`      | North Entrance Gate      | Entry Gate    | 500      | Bottleneck, Queue-Prone, Priority 5 |
| `gate_south`      | South Entrance Gate      | Entry Gate    | 500      | Bottleneck, Queue-Prone, Priority 5 |
| `gate_east`       | East Entrance Gate       | Entry Gate    | 400      | Bottleneck, Queue-Prone, Priority 5 |
| `gate_west`       | West Entrance Gate (VIP) | Entry Gate    | 200      | Bottleneck, Queue-Prone, Priority 4 |
| `stand_a`         | Stand A - North          | Seating Stand | 5000     | Fixed Seating, Priority 3           |
| `stand_b`         | Stand B - East           | Seating Stand | 5000     | Fixed Seating, Priority 3           |
| `stand_c`         | Stand C - South          | Seating Stand | 5000     | Fixed Seating, Priority 3           |
| `stand_d`         | Stand D - West           | Seating Stand | 4000     | Fixed Seating, Priority 3           |
| `food_north`      | North Food Court         | Food Court    | 300      | Queue-Prone, Priority 2             |
| `food_south`      | South Food Court         | Food Court    | 300      | Queue-Prone, Priority 2             |
| `washroom_north`  | North Washrooms          | Washroom      | 50       | Bottleneck, Queue-Prone, Priority 4 |
| `washroom_south`  | South Washrooms          | Washroom      | 50       | Bottleneck, Queue-Prone, Priority 4 |
| `concourse_north` | North Concourse          | Concourse     | 800      | Bottleneck-Prone, Priority 4        |
| `concourse_south` | South Concourse          | Concourse     | 800      | Bottleneck-Prone, Priority 4        |
| `concourse_east`  | East Concourse           | Concourse     | 700      | Bottleneck-Prone, Priority 4        |
| `concourse_west`  | West Concourse           | Concourse     | 600      | Bottleneck-Prone, Priority 4        |
| `vip_lounge`      | VIP Lounge               | VIP Area      | 150      | Priority 2                          |

---

## 🔐 Schedule Phases

### Event Lifecycle Phases

```typescript
enum SchedulePhase {
  PRE_EVENT        // Before gates open
  EARLY_ENTRY      // VIP / early access
  MAIN_ENTRY       // Primary entry phase
  PRE_SHOW         // After entry, before event start
  MAIN_EVENT       // Event in progress
  HALFTIME         // Break period
  POST_HALFTIME    // After break
  EVENT_ENDING     // Final moments
  EXIT_PHASE       // Controlled exit
  POST_EVENT       // After event, cleanup
}
```

Each phase has specific:

- Expected crowd density levels
- Critical zones to monitor
- Recommended actions

---

## 🚀 Getting Started

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add_crowd_forecasting_schema
npx prisma generate
```

### 2. Start Server

```bash
npm run dev
# or
pnpm dev
```

### 3. Initialize Zones for an Event

**Option A: Automatic (on first API call)**

```bash
GET /api/events/{eventId}/zones
# Auto-creates zones if none exist
```

**Option B: Generate Simulation Data**

```bash
POST /api/events/{eventId}/zones/simulate
{
  "duration": 120,
  "interval": 5
}
```

### 4. Query Zone State

```bash
GET /api/events/{eventId}/zones/state?window=60
```

### 5. Get Schedule Context

```bash
GET /api/events/{eventId}/schedule/context
```

---

## 🧪 Testing the APIs

### Using cURL

```bash
# Get zone metadata
curl http://localhost:3000/api/events/{eventId}/zones

# Get latest zone states
curl http://localhost:3000/api/events/{eventId}/zones/state/latest

# Get time-series window (last 60 minutes)
curl "http://localhost:3000/api/events/{eventId}/zones/state?window=60"

# Get schedule context
curl http://localhost:3000/api/events/{eventId}/schedule/context

# Generate simulation data
curl -X POST http://localhost:3000/api/events/{eventId}/zones/simulate \
  -H "Content-Type: application/json" \
  -d '{"duration": 120, "interval": 5}'

# Create forecast
curl -X POST http://localhost:3000/api/events/{eventId}/zones/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "zoneId": "gate_north",
    "targetTime": "2026-01-12T17:00:00Z",
    "horizonMinutes": 30,
    "predictedCount": 450,
    "predictedDensity": 2.25,
    "predictedDensityLevel": "CRITICAL",
    "confidence": 0.87
  }'
```

---

## 🤖 ML Service Integration

### Expected Workflow

1. **ML Service pulls historical data:**

   ```
   GET /api/events/{eventId}/zones/state?window=60&zoneId=gate_north
   ```

   Returns last 12 timesteps (60 min ÷ 5 min intervals)

2. **ML Service runs LSTM prediction**
   - Input: Last 12 timesteps per zone
   - Output: Predictions for +10 min, +30 min

3. **ML Service pushes predictions:**

   ```
   POST /api/events/{eventId}/zones/forecast
   ```

4. **Backend broadcasts via WebSocket:**
   ```
   io.to(`zones:${eventId}`).emit('zone:forecast', forecast);
   ```

---

## 📈 Data Schema Summary

### Field Definitions

**Crowd Metrics:**

- `crowdCount`: Estimated people in zone
- `crowdDensity`: People per square meter
- `densityLevel`: LOW | MEDIUM | HIGH | CRITICAL

**Flow Dynamics:**

- `inflowRate`: People entering per minute
- `outflowRate`: People exiting per minute
- `netFlowRate`: Net change (inflow - outflow)

**Movement:**

- `avgSpeed`: Average movement speed (m/s)
- `directionEntropy`: Direction disorder (0-1)
- `avgDwellTime`: Average time in zone (minutes)

**Queue Metrics:**

- `queueLength`: Estimated queue size
- `avgWaitTime`: Average wait time (minutes)

**Risk Indicators:**

- `riskLevel`: LOW | MEDIUM | HIGH | CRITICAL
- `congestionScore`: Occupancy ratio (0-1.2)
- `bottleneckScore`: Bottleneck severity (0-1)

---

## ✅ Acceptance Criteria Status

- ✅ Zone metadata API available
- ✅ Time-series zone state API implemented
- ✅ Consistent timestep indexing
- ✅ Simulated data follows realistic patterns
- ✅ Ready for LSTM sliding-window ingestion
- ✅ Schedule context API implemented
- ✅ WebSocket real-time updates supported
- ✅ TypeScript types defined
- ✅ Comprehensive documentation

---

## 🎓 Architecture Decisions

### Why This Design?

1. **Separation of Concerns**
   - Static metadata (`ZoneMetadata`) vs time-series data (`ZoneState`)
   - Clear API boundaries for ML service integration

2. **Time-Series Optimization**
   - Fixed 5-minute intervals for predictable indexing
   - Sequential `timestepIndex` for sliding windows
   - Grouped by zone for efficient queries

3. **Simulation First**
   - MVP/demo ready without real sensors
   - Realistic patterns for model training
   - Easy transition to real data later

4. **Future-Proof Schema**
   - Fields for real sensor data (`dataSource`, `confidence`)
   - Support for predictions (`isPredicted`, `predictionHorizon`)
   - Extensible metadata (JSON fields)

---

## 📚 Related Files

- **Schema**: `prisma/schema.prisma` (lines ~1538+)
- **Routes**: `server/routes/zone-forecasting.routes.ts`
- **Services**:
  - `server/services/zone-simulation.service.ts`
  - `server/services/zone-forecasting.service.ts`
- **Types**: `server/types/zone-forecasting.types.ts`
- **Server**: `server/index.ts` (routes registered, WebSocket handlers)

---

## 🐛 Troubleshooting

### No zones found?

Run: `POST /api/events/{eventId}/zones/simulate` to initialize

### No state data?

Zones auto-generate simulation data on first query

### WebSocket not receiving updates?

Check subscription: `socket.emit('subscribe:zones', eventId)`

### Migration errors?

Run: `npx prisma migrate reset` (⚠️ WARNING: Deletes all data)

---

## 🎯 Next Steps

1. **Run Migration**: Apply schema changes to database
2. **Test APIs**: Use cURL or Postman to verify endpoints
3. **Integrate ML Service**: Connect LSTM model to pull data
4. **Monitor Performance**: Track query times and optimize indexes
5. **Add Real Sensors**: Replace simulation with real camera/WiFi data

---

## 📞 Support

For questions or issues:

- Check logs: `console.log` statements in services
- Validate schema: `npx prisma validate`
- Database GUI: `npx prisma studio`

---

**Implementation Date**: January 12, 2026  
**Status**: ✅ Complete and Ready for ML Integration  
**Version**: 1.0.0
