# DrishtiX Platform - API Reference

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All protected routes require JWT token in header:

```
Authorization: Bearer <token>
```

---

## 📍 Events API

### `GET /api/events`

List all events

```json
Response: [{
  "id": "string",
  "name": "string",
  "status": "PLANNED | ACTIVE | COMPLETED",
  "startTime": "ISO8601",
  "location": { "lat": number, "lon": number },
  "expectedAttendees": number
}]
```

### `POST /api/events`

Create new event

```json
Request: {
  "name": "Music Festival 2025",
  "startTime": "2025-12-01T18:00:00Z",
  "endTime": "2025-12-01T23:00:00Z",
  "location": { "lat": 28.7041, "lon": 77.1025 },
  "expectedAttendees": 50000,
  "category": "CONCERT"
}
```

### `GET /api/events/:id`

Get event details

### `PUT /api/events/:id`

Update event

### `DELETE /api/events/:id`

Delete event

---

## 🎯 Predictions API

### `GET /api/predictions?eventId={id}`

Get crowd predictions for event

```json
Response: [{
  "id": "string",
  "timestamp": "ISO8601",
  "predictedCount": number,
  "confidence": number,
  "leadTimeMinutes": 15,
  "densityLevel": "LOW | MEDIUM | HIGH | CRITICAL",
  "zone": "string"
}]
```

### `POST /api/predictions/mode`

Switch ML mode (SPORTS, CONCERT, GENERAL, ENTRY_EXIT)

```json
Request: {
  "mode": "CONCERT",
  "eventId": "event-123"
}
```

### `POST /api/predictions/ingest-frame`

Ingest density frame for prediction

```json
Request: {
  "eventId": "event-123",
  "frame": {
    "width": 32,
    "height": 32,
    "data": [[0.1, 0.2, ...], ...],
    "timestamp": "ISO8601"
  }
}
```

### `GET /api/predictions/next-frame?eventId={id}`

Get next predicted density frame

---

## 🚨 Anomalies API

### `GET /api/anomalies?eventId={id}`

Get detected anomalies

```json
Response: [{
  "id": "string",
  "tier": 1 | 2 | 3,
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "type": "SURGE | BOTTLENECK | PANIC | STAMPEDE",
  "confidence": number,
  "zone": "string",
  "timestamp": "ISO8601"
}]
```

### `POST /api/anomalies/ingest`

Ingest feature vector for anomaly detection

```json
Request: {
  "eventId": "event-123",
  "zoneId": "zone-A",
  "feature": {
    "density_norm": 0.85,
    "delta_t1": 0.15,
    "delta_t5": 0.45,
    "zone_type_enc": [1, 0, 0, 0],
    "time_enc": { "sin": 0.5, "cos": 0.866 }
  }
}
```

### `GET /api/anomalies/status?eventId={id}&zoneId={zoneId}`

Get anomaly detection system status

---

## 🔔 Alerts API

### `GET /api/alerts?eventId={id}&status=ACTIVE`

Get alerts

```json
Response: [{
  "id": "string",
  "type": "INCIDENT | RISK | PREDICTION | SYSTEM",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "title": "string",
  "message": "string",
  "status": "ACTIVE | RESOLVED | DISMISSED",
  "actionRequired": boolean,
  "timestamp": "ISO8601"
}]
```

### `POST /api/alerts`

Create manual alert

```json
Request: {
  "eventId": "event-123",
  "type": "INCIDENT",
  "severity": "HIGH",
  "title": "Crowd surge detected",
  "message": "High density in Zone A",
  "actionRequired": true
}
```

### `PUT /api/alerts/:id/resolve`

Resolve alert

### `PUT /api/alerts/:id/dismiss`

Dismiss alert

---

## 🚑 Dispatch API

### `POST /api/dispatch/create`

Create dispatch request

```json
Request: {
  "eventId": "event-123",
  "alertId": "alert-456",
  "incidentType": "MEDICAL",
  "location": { "lat": 28.7041, "lon": 77.1025 },
  "severity": "CRITICAL",
  "description": "Medical emergency",
  "estimatedCrowd": 5000
}

Response: {
  "dispatchId": "string",
  "status": "PENDING | DISPATCHED",
  "assignedResponders": [{
    "id": "string",
    "type": "AMBULANCE",
    "eta": 8,
    "distance": 2500
  }],
  "estimatedResponseTime": 8,
  "requiresHumanApproval": false
}
```

### `GET /api/dispatch/:id`

Get dispatch details

### `PUT /api/dispatch/:id/approve`

Approve dispatch (if requires human approval)

---

## 👥 Responders API

### `GET /api/responders?eventId={id}&status=AVAILABLE`

List responders

```json
Response: [{
  "id": "string",
  "type": "POLICE | FIRE | AMBULANCE | SECURITY | MEDICAL",
  "name": "string",
  "status": "AVAILABLE | BUSY | EN_ROUTE | ON_SCENE",
  "currentLocation": { "lat": number, "lon": number },
  "contactNumber": "string"
}]
```

### `POST /api/responders`

Register responder

### `PUT /api/responders/:id/location`

Update responder location

```json
Request: {
  "lat": 28.7041,
  "lon": 77.1025
}
```

### `PUT /api/responders/:id/status`

Update responder status

```json
Request: {
  "status": "EN_ROUTE"
}
```

---

## 📹 Camera API

### `POST /api/cameras/start`

Start camera stream

```json
Request: {
  "cameraId": "cam-001",
  "streamUrl": "rtsp://user:pass@192.168.1.100:554/stream",
  "type": "CCTV",
  "location": { "lat": 28.7041, "lon": 77.1025 },
  "eventId": "event-123",
  "fps": 5
}
```

### `POST /api/cameras/:id/stop`

Stop camera stream

### `GET /api/cameras`

List all cameras

### `GET /api/cameras/:id/status`

Get camera status

```json
Response: {
  "cameraId": "cam-001",
  "status": "CONNECTED | DISCONNECTED | ERROR",
  "fps": 5,
  "framesProcessed": 1234,
  "lastFrame": "ISO8601"
}
```

### `GET /api/cameras/:id/latest-frame`

Get latest frame from camera

---

## 🌤️ Weather API

### `POST /api/weather/start-monitoring`

Start weather monitoring for event

```json
Request: {
  "eventId": "event-123",
  "location": { "lat": 28.7041, "lon": 77.1025, "name": "Delhi" }
}
```

### `GET /api/weather/current?lat={lat}&lon={lon}`

Get current weather

```json
Response: {
  "temperature": 28.5,
  "humidity": 65,
  "condition": "Clear",
  "windSpeed": 5.2,
  "heatIndex": 32.1,
  "timestamp": "ISO8601"
}
```

### `GET /api/weather/forecast?lat={lat}&lon={lon}`

Get weather forecast (next 24h)

### `POST /api/weather/:eventId/stop`

Stop weather monitoring

---

## 📊 AWS Analytics API

### `GET /api/AWS/crowd-trends`

Get historical crowd trends

```json
Query: {
  eventId: "event-123",
  startTime: "ISO8601",
  endTime: "ISO8601",
  interval: "5min | 15min | 1hour",
  zoneId: "zone-A" (optional)
}

Response: [{
  "timestamp": "ISO8601",
  "averageDensity": number,
  "peakDensity": number,
  "totalPeople": number
}]
```

### `GET /api/AWS/event-metrics/:eventId`

Get event performance metrics

```json
Response: {
  "totalAttendees": number,
  "peakCrowdDensity": number,
  "totalAnomalies": number,
  "criticalAnomalies": number,
  "totalAlerts": number,
  "responseTimeAvg": number,
  "zonesAnalyzed": number
}
```

### `GET /api/AWS/anomaly-patterns`

Get anomaly patterns

```json
Query: {
  eventId: "event-123",
  startTime: "ISO8601",
  endTime: "ISO8601"
}

Response: [{
  "anomalyType": "SURGE",
  "occurrences": 5,
  "averageConfidence": 0.87,
  "zones": ["zone-A", "zone-B"],
  "timePattern": [{ "hour": 18, "count": 3 }, ...]
}]
```

---

## 🎭 Simulation API

### `POST /api/simulation/run`

Run crowd simulation

```json
Request: {
  "eventId": "event-123",
  "scenario": "EVACUATION | NORMAL | SURGE",
  "duration": 3600,
  "initialDensity": 0.5
}

Response: {
  "simulationId": "string",
  "status": "RUNNING",
  "estimatedTime": 120
}
```

### `GET /api/simulation/:id`

Get simulation results

### `POST /api/simulation/:id/stop`

Stop running simulation

---

## 🎙️ Voice API

### `POST /api/voice/process`

Process voice command

```json
Request: {
  "audioUrl": "https://...",
  "eventId": "event-123",
  "language": "en-US"
}

Response: {
  "transcript": "Report crowd surge in zone A",
  "intent": "REPORT_INCIDENT",
  "entities": {
    "incident_type": "SURGE",
    "zone": "zone-A"
  },
  "action": "CREATE_ALERT"
}
```

---

## 🎯 Recommendations API

### `GET /api/recommendations?eventId={id}`

Get AI recommendations

```json
Response: [{
  "id": "string",
  "action": {
    "title": "Deploy additional staff to Zone A",
    "description": "Predicted surge in 15 minutes",
    "type": "STAFF_DEPLOYMENT"
  },
  "rank": 1,
  "confidence": 0.92,
  "urgency": "HIGH",
  "reason": "ConvLSTM predicting 85% density increase"
}]
```

---

## 👤 Attendee API

### `POST /api/attendees/sos`

Submit SOS request

```json
Request: {
  "eventId": "event-123",
  "location": { "lat": 28.7041, "lon": 77.1025 },
  "type": "MEDICAL | SAFETY | LOST",
  "description": "Need medical assistance"
}
```

### `POST /api/attendees/report`

Submit crowd report

```json
Request: {
  "eventId": "event-123",
  "location": { "lat": 28.7041, "lon": 77.1025 },
  "densityLevel": "HIGH",
  "panicLevel": 3,
  "comments": "Very crowded near stage"
}
```

---

## 🔌 WebSocket Events (Socket.IO)

### Client → Server (Subscriptions)

```javascript
// Join event room
socket.emit('join:event', 'event-123');

// Subscribe to predictions
socket.emit('subscribe:predictions', 'event-123');

// Subscribe to anomalies
socket.emit('subscribe:anomalies', 'event-123');

// Subscribe to alerts
socket.emit('subscribe:alerts', 'event-123');

// Subscribe to camera feed
socket.emit('subscribe:camera', 'cam-001');

// Subscribe to recommendations
socket.emit('subscribe:recommendations', 'event-123');
```

### Server → Client (Real-time Updates)

```javascript
// New prediction
socket.on('prediction:new', (data) => {
  // { predictedCount, confidence, timestamp, ... }
});

// Anomaly detected
socket.on('anomaly:detected', (data) => {
  // { tier, severity, type, zone, ... }
});

// New alert
socket.on('alert:new', (data) => {
  // { type, severity, title, message, ... }
});

// Crowd density update
socket.on('crowd:update', (data) => {
  // { zoneId, density, count, timestamp, ... }
});

// Camera frame
socket.on('camera:frame', (data) => {
  // { cameraId, imageData, peopleCount, ... }
});

// Weather update
socket.on('weather:update', (data) => {
  // { temperature, condition, heatIndex, ... }
});

// Recommendation
socket.on('recommendation:new', (data) => {
  // { action, rank, confidence, urgency, ... }
});

// Forecast mode changed
socket.on('forecast:mode-changed', (data) => {
  // { newMode, previousMode, timestamp, ... }
});
```

---

## 🔐 Authentication API

### `POST /api/auth/login`

Login

```json
Request: {
  "email": "admin@drishtix.com",
  "password": "secure-password"
}

Response: {
  "token": "JWT_TOKEN",
  "user": {
    "id": "string",
    "email": "string",
    "role": "ADMIN | ORGANIZER | RESPONDER"
  }
}
```

### `POST /api/auth/register`

Register new user

### `POST /api/auth/refresh`

Refresh JWT token

### `POST /api/auth/logout`

Logout

---

## ⚡ Rate Limits

- **Standard endpoints**: 100 requests/minute
- **Real-time endpoints**: 1000 requests/minute
- **Video ingestion**: 10 requests/second
- **Prediction requests**: 60 requests/minute

---

## 🐛 Error Codes

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

Common codes:

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## 📝 Example: Complete Event Monitoring Flow

```javascript
// 1. Create event
const event = await fetch('/api/events', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Music Festival 2025',
    startTime: '2025-12-01T18:00:00Z',
    location: { lat: 28.7041, lon: 77.1025 },
  }),
});

// 2. Start camera monitoring
await fetch('/api/cameras/start', {
  method: 'POST',
  body: JSON.stringify({
    cameraId: 'cam-001',
    streamUrl: 'rtsp://...',
    eventId: event.id,
  }),
});

// 3. Start weather monitoring
await fetch('/api/weather/start-monitoring', {
  method: 'POST',
  body: JSON.stringify({
    eventId: event.id,
    location: { lat: 28.7041, lon: 77.1025, name: 'Delhi' },
  }),
});

// 4. Subscribe to real-time updates
const socket = io('http://localhost:3000');
socket.emit('join:event', event.id);
socket.emit('subscribe:predictions', event.id);
socket.emit('subscribe:anomalies', event.id);
socket.emit('subscribe:alerts', event.id);

// 5. Listen for updates
socket.on('prediction:new', (prediction) => {
  console.log('New prediction:', prediction);
});

socket.on('anomaly:detected', (anomaly) => {
  console.log('Anomaly detected:', anomaly);
  // Auto-create alert if critical
  if (anomaly.severity === 'CRITICAL') {
    fetch('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({
        eventId: event.id,
        type: 'INCIDENT',
        severity: 'CRITICAL',
        title: `${anomaly.type} detected in ${anomaly.zone}`,
        message: `Confidence: ${anomaly.confidence}`,
      }),
    });
  }
});

socket.on('alert:new', (alert) => {
  console.log('New alert:', alert);
  // Trigger dispatch if action required
  if (alert.actionRequired) {
    fetch('/api/dispatch/create', {
      method: 'POST',
      body: JSON.stringify({
        eventId: event.id,
        alertId: alert.id,
        incidentType: 'SURGE',
        location: event.location,
        severity: alert.severity,
      }),
    });
  }
});
```

---

## 🔗 Postman Collection

Import this collection to test all endpoints:

```
[Download Postman Collection](./drishtix-api-collection.json)
```

---

**Last Updated:** November 29, 2025
**API Version:** 1.0.0
