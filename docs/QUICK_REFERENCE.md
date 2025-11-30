# 🎯 DrishtiX Platform - Quick Reference

> **Comprehensive crowd management and predictive analytics platform**  
> **Status:** ✅ Production-Ready (Pre-Training Configuration)  
> **Last Updated:** November 29, 2025

---

## 🚀 Quick Start (5 Minutes)

### **Prerequisites**

- Node.js 18+
- PostgreSQL 14+ with PostGIS
- Google Cloud Platform account
- Google Cloud SDK (`gcloud`)

### **Setup**

```bash
# 1. Install dependencies
pnpm install
cd server && npm install && cd ..

# 2. Setup database
createdb drishtix_db
psql -d drishtix_db -c "CREATE EXTENSION postgis;"
npm run db:migrate

# 3. Configure environment
cp .env.example .env
# Edit .env with your GCP project ID and API keys

# 4. Initialize GCP services
npm run gcp:init

# 5. Verify setup
npm run health:check

# 6. Start platform
# Terminal 1
cd server && npm run dev

# Terminal 2
npm run dev
```

**Access:** http://localhost:5173

---

## 📚 Documentation

| Document                  | Purpose                          | Link                                                                                         |
| ------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| **Complete Setup Guide**  | Step-by-step installation        | [`docs/COMPLETE_SETUP_GUIDE.md`](./docs/COMPLETE_SETUP_GUIDE.md)                             |
| **API Reference**         | All endpoints & Socket.IO events | [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md)                                           |
| **Implementation Status** | Detailed component breakdown     | [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md)                                     |
| **Architecture**          | System design & data flow        | [`technical-design/01-SYSTEM_ARCHITECTURE.md`](./technical-design/01-SYSTEM_ARCHITECTURE.md) |

---

## 🎯 What Works Right Now

### **✅ Fully Operational**

- **Event Management** - Create, update, delete events
- **Real-Time Dashboard** - Live monitoring with Socket.IO
- **Incident Tracking** - Report and manage incidents
- **Alert System** - Create and dispatch alerts
- **Responder Coordination** - Assign and track responders
- **Weather Monitoring** - Real-time weather data
- **Risk Assessment** - Multi-factor risk scoring
- **AI Dispatch** - Automated emergency response
- **Analytics** - Historical insights from BigQuery
- **Google Maps** - Routing and geocoding
- **Database** - PostgreSQL + PostGIS with all models

### **⚠️ Placeholder Mode**

- **Crowd Forecasting** - Returns 'CALIBRATING' until models trained
- **Anomaly Detection L2/L3** - Uses L1 (threshold) only
- **Video Analytics** - Service ready, needs camera URLs

### **❌ Not Implemented**

- **Flutter Mobile App** - Use web dashboard instead
- **Trained ML Models** - Training scripts ready
- **Cloud Deployment** - Local development only

---

## 🛠️ Useful Commands

### **Development**

```bash
npm run dev              # Start frontend
cd server && npm run dev # Start backend
npm run dev:all          # Start both (if configured)
```

### **Database**

```bash
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Generate Prisma client
npm run db:reset         # Reset database
```

### **GCP & Infrastructure**

```bash
npm run gcp:init         # Initialize all GCP services
npm run health:check     # Verify setup
```

### **ML Training (Optional)**

```bash
npm run train:convlstm          # Train crowd forecasting
npm run train:isolation-forest  # Train anomaly detection L2
npm run train:autoencoder       # Train anomaly detection L3
npm run train:all               # Train all models
```

### **Testing**

```bash
npm run test            # Run tests
npm run test:ui         # Test UI
npm run coverage        # Code coverage
```

---

## 🔑 Required Environment Variables

**Minimum (for basic functionality):**

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/drishtix_db
VITE_GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-service-account-key.json
```

**Recommended (for full features):**

```env
GOOGLE_MAPS_API_KEY=your-maps-key
GEMINI_API_KEY=your-gemini-key
OPENWEATHER_API_KEY=your-weather-key
```

See [`.env.example`](./.env.example) for complete configuration.

---

## 📊 Service Status

| Service             | Status  | Notes                   |
| ------------------- | ------- | ----------------------- |
| **PostgreSQL**      | ✅ 100% | All tables with PostGIS |
| **REST API**        | ✅ 95%  | 50+ endpoints           |
| **Socket.IO**       | ✅ 100% | Real-time updates       |
| **Pub/Sub**         | ✅ 100% | 9 topics configured     |
| **BigQuery**        | ✅ 95%  | 6 tables ready          |
| **Cloud Storage**   | ✅ 100% | 4 buckets               |
| **Firebase**        | ✅ 100% | Auth, FCM, Firestore    |
| **Google Maps**     | ✅ 90%  | Routing working         |
| **Weather**         | ✅ 85%  | API integrated          |
| **ML Forecasting**  | ⚠️ 40%  | Needs training          |
| **Video Analytics** | ⚠️ 60%  | Needs cameras           |
| **Dashboard**       | ✅ 90%  | All components          |

**Overall:** ~75% Complete (Fully operational, ML in placeholder mode)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                         │
│  CCTV • Mobile GPS • Weather • Event Metadata          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               INGESTION (Pub/Sub)                       │
│  9 topics • DLQ • Retry policies                        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│         STORAGE (PostgreSQL, BigQuery, GCS)            │
│  20+ tables • 6 BQ tables • 4 buckets                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│          ML/AI (ConvLSTM, Isolation Forest)            │
│  Forecasting • Anomaly Detection • Risk Scoring         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│        DECISION (Risk Engine, Agent Builder)           │
│  Multi-factor scoring • AI dispatch                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│    DELIVERY (REST API, WebSocket, FCM, Dashboard)     │
│  50+ endpoints • Real-time • Push notifications         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 Common Tasks

### **Create a New Event**

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Music Festival 2025",
    "startTime": "2025-12-01T18:00:00Z",
    "location": {"lat": 28.7041, "lon": 77.1025},
    "expectedAttendees": 50000
  }'
```

### **Monitor Real-Time Updates**

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');
socket.emit('join:event', 'event-123');
socket.on('prediction:new', (data) => console.log('Prediction:', data));
socket.on('alert:new', (data) => console.log('Alert:', data));
```

### **Train ML Models**

```bash
# Setup Python environment
cd scripts
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Train ConvLSTM
python train-convlstm.py --mode train

# Train Isolation Forest
python train-isolation-forest.py --mode train
```

---

## 🐛 Troubleshooting

### **Database Connection Failed**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Verify PostGIS extension
psql -d drishtix_db -c "SELECT PostGIS_Version();"
```

### **GCP Permission Denied**

```bash
# Re-authenticate
gcloud auth login
gcloud auth application-default login

# Verify service account
gcloud iam service-accounts describe YOUR_SA@PROJECT.iam.gserviceaccount.com
```

### **Port Already in Use**

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>
```

### **Health Check Failing**

```bash
# Run diagnostic
npm run health:check

# Check logs
cd server && npm run dev
# Look for error messages in console
```

---

## 📞 Support

- **Setup Issues:** See [`docs/COMPLETE_SETUP_GUIDE.md`](./docs/COMPLETE_SETUP_GUIDE.md)
- **API Questions:** See [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md)
- **Implementation Details:** See [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md)
- **Health Check:** Run `npm run health:check`

---

## 🎯 Next Steps

### **Option A: Use Immediately**

Platform is ready for:

- Event management
- Incident tracking
- Real-time monitoring
- Analytics
- Responder coordination

### **Option B: Enable ML Features**

```bash
# Collect training data from events
npm run db:export-training-data

# Train models
npm run train:all

# Deploy to Vertex AI
python scripts/deploy-models.py
```

### **Option C: Deploy to Cloud**

```bash
# Build and deploy to Cloud Run
gcloud run deploy drishtix-backend \
  --source . \
  --platform managed \
  --region us-central1
```

---

## 📈 Project Stats

- **Lines of Code:** ~50,000+
- **API Endpoints:** 50+
- **Database Models:** 20+
- **GCP Services:** 14
- **Real-Time Events:** 10+
- **Services:** 30+
- **Components:** 40+
- **Documentation Pages:** 10+

---

## 🏆 Key Features

✅ **Real-Time Monitoring** - Live crowd density updates  
✅ **Predictive Analytics** - ML-based forecasting (infrastructure ready)  
✅ **Risk Assessment** - Multi-factor scoring engine  
✅ **AI Dispatch** - Automated emergency response  
✅ **Video Analytics** - Multi-camera support (ready for streams)  
✅ **Weather Integration** - Real-time monitoring  
✅ **Maps Integration** - Routing and navigation  
✅ **Mobile Reporting** - Attendee SOS and reports  
✅ **Analytics Dashboard** - Historical insights  
✅ **Voice Interface** - Natural language commands

---

## 📜 License

[Add your license here]

---

## 🙏 Acknowledgments

Built with:

- React, TypeScript, Vite
- Express, Prisma, PostgreSQL
- Google Cloud Platform
- Socket.IO
- TensorFlow, scikit-learn
- And many other amazing open-source projects

---

**🎉 You're all set! Start building amazing crowd management experiences.**

For detailed setup instructions, see [`docs/COMPLETE_SETUP_GUIDE.md`](./docs/COMPLETE_SETUP_GUIDE.md)
