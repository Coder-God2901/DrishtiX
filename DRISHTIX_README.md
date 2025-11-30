# DrishtiX - Predictive Crowd Safety Platform

## 🎯 Overview

**DrishtiX** is a fully AI-powered, hardware-free, predictive crowd safety and situational awareness platform that transforms traditional event management into proactive, automated, and privacy-first incident prevention.

### Key Features

- ✅ **Predictive Forecasting**: 15-20 minute advance warning of crowd bottlenecks
- ✅ **Anomaly Detection**: Real-time panic, fire, violence, and surge detection using Gemini Vision
- ✅ **Automated Dispatch**: AI-powered emergency responder routing with Google Maps
- ✅ **Voice-First Interface**: Hands-free command center operations
- ✅ **Hardware-Free**: Simulation engine eliminates need for physical CCTV
- ✅ **Privacy-First**: PII scrubbing with Cloud DLP
- ✅ **Real-Time**: WebSocket + Pub/Sub streaming architecture

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │  React + TypeScript + shadcn/ui
└──────┬──────┘
       │ WebSocket/HTTP
┌──────▼──────┐
│   Backend   │  Express + Socket.IO + Prisma
└──────┬──────┘
       │
┌──────▼───────────────────────────────────────┐
│         Google Cloud Platform Services       │
├───────────────────────────────────────────────┤
│ • Vertex AI (Forecasting)                    │
│ • Gemini Vision (Anomaly Detection)          │
│ • Pub/Sub (Real-time Streaming)              │
│ • Cloud DLP (Privacy)                        │
│ • Cloud Storage (Simulations)                │
│ • BigQuery (Analytics)                       │
│ • Google Maps (Routing)                      │
└───────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14
- Google Cloud Project with billing enabled
- Google Cloud service account with permissions

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd Events
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` - PostgreSQL connection string
- `GCP_PROJECT_ID` - Your Google Cloud project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON
- `GEMINI_API_KEY` - Gemini API key from AI Studio
- `GOOGLE_MAPS_API_KEY` - Google Maps API key

4. **Run DrishtiX setup**

```bash
pnpm drishtix:setup
```

This will:
- Validate your GCP configuration
- Create Pub/Sub topics
- Create Cloud Storage buckets
- Create BigQuery datasets and tables
- Test Gemini API connection

5. **Run database migrations**

```bash
pnpm db:migrate
```

6. **Start the development servers**

```bash
pnpm dev:all
```

This starts:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📚 API Endpoints

### Predictions
- `POST /api/predictions/forecast` - Generate crowd density forecast
- `GET /api/predictions/:eventId` - Get predictions for event
- `GET /api/predictions/:eventId/latest` - Get latest prediction
- `GET /api/predictions/:eventId/hotspots` - Get current hotspots

### Anomaly Detection
- `POST /api/anomalies/detect` - Detect anomalies in visual feed
- `GET /api/anomalies/:eventId` - Get anomaly history
- `GET /api/anomalies/:eventId/current` - Get active anomalies
- `GET /api/anomalies/:eventId/metrics` - Get detection metrics

### Emergency Dispatch
- `POST /api/dispatch/create` - Create dispatch plan
- `PUT /api/dispatch/:id/approve` - Approve pending dispatch
- `PUT /api/dispatch/:id/status` - Update dispatch status
- `GET /api/dispatch/:eventId` - Get all dispatches
- `GET /api/dispatch/:eventId/active` - Get active dispatches

### Voice AI
- `POST /api/voice/command` - Process voice command
- `POST /api/voice/translate` - Translate command
- `DELETE /api/voice/history/:sessionId` - Clear conversation history

### Simulation
- `POST /api/simulation/generate` - Generate simulation
- `GET /api/simulation/list` - List simulations
- `GET /api/simulation/:id` - Get simulation by ID

## 🔧 Configuration

### Google Cloud Setup

1. **Enable APIs**
   - Vertex AI API
   - Cloud Pub/Sub API
   - Cloud Storage API
   - BigQuery API
   - Cloud DLP API
   - Maps JavaScript API
   - Routes API

2. **Create Service Account**
   - Go to IAM & Admin > Service Accounts
   - Create new service account
   - Grant roles:
     - Vertex AI User
     - Pub/Sub Admin
     - Storage Admin
     - BigQuery Admin
     - DLP User
   - Download JSON key

3. **Get API Keys**
   - Gemini API: https://ai.google.dev/
   - Google Maps: https://console.cloud.google.com/apis/credentials

### Environment Variables

See `.env.example` for all available configuration options.

Critical variables:
```env
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-credentials.json
GEMINI_API_KEY=your-gemini-key
GOOGLE_MAPS_API_KEY=your-maps-key
DATABASE_URL=postgresql://user:pass@localhost:5432/drishtix
```

## 🎨 Frontend Integration

### Real-time Updates

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Subscribe to predictions
socket.emit('subscribe:predictions', eventId);
socket.on('prediction:new', (prediction) => {
  console.log('New prediction:', prediction);
});

// Subscribe to anomalies
socket.emit('subscribe:anomalies', eventId);
socket.on('anomaly:detected', (anomaly) => {
  console.log('Anomaly detected:', anomaly);
});
```

### Voice Commands

```typescript
const response = await fetch('/api/voice/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Show risk zones near Gate 3',
    language: 'en',
    eventId: 'event-123',
  }),
});

const { data } = await response.json();
console.log('AI Response:', data.text);
console.log('Action:', data.action);
console.log('Visual Data:', data.visualData);
```

## 📊 Database Schema

Key models:
- `Event` - Event information
- `Prediction` - Crowd density forecasts
- `Incident` - Recorded incidents
- `Alert` - Generated alerts
- `Dispatch` - Emergency response dispatches
- `CrowdDensity` - Real-time density data

See `prisma/schema.prisma` for complete schema.

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 🚢 Deployment

### Backend

```bash
# Build server
pnpm build:server

# Run migrations
pnpm db:migrate:prod

# Start production server
NODE_ENV=production node dist/server/index.js
```

### Frontend

```bash
# Build frontend
pnpm build

# Preview build
pnpm preview
```

## 📈 Performance Targets

- **Prediction Lead Time**: 15-20 minutes
- **Anomaly Detection Latency**: < 5 seconds
- **Response Time Reduction**: 50-70%
- **Prediction Accuracy**: ≥ 75%
- **Cost Efficiency**: 60% reduction vs CCTV systems

## 🔒 Privacy & Compliance

- PII automatically scrubbed using Cloud DLP
- Data aggregated to grid-level (no individual tracking)
- Audit logs for all operations
- Configurable data retention (default: 90 days)
- GDPR/CCPA compliant

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check documentation in `/docs`
- Review example scripts in `/scripts`

## 🙏 Acknowledgments

Built with:
- Google Cloud AI Platform
- Gemini Pro & Gemini Vision
- React & TypeScript
- Prisma ORM
- shadcn/ui

---

**DrishtiX** - Predict. Prevent. Protect. 🎯
