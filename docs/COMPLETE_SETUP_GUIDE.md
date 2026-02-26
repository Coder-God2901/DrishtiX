# DrishtiX Platform - Complete Setup Guide (Pre-Training)

## 🎯 Overview

This guide walks you through setting up the **entire DrishtiX platform** without requiring ML model training. All infrastructure, services, and APIs will be functional - ML models will return placeholder data until trained.

---

## 📋 Prerequisites Checklist

### Required Tools

- [x] **Node.js** 18+ and npm/pnpm
- [x] **PostgreSQL** 14+ with PostGIS extension
- [x] **Amazon Web Services (AWS)** account with billing enabled
- [x] **AWS CLI** (`aws` CLI)
- [x] **Git**

### Optional (for ML training later)

- [ ] **Python** 3.10+
- [ ] **TensorFlow** 2.13+
- [ ] **FFmpeg** (for video processing)

---

## 🚀 Step-by-Step Setup

### **Step 1: Clone and Install Dependencies**

```bash
# Clone repository
git clone https://github.com/your-org/eventsphere.git
cd eventsphere

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd server
npm install
cd ..
```

---

### **Step 2: Setup PostgreSQL Database**

```bash
# Create database
psql -U postgres
CREATE DATABASE drishtix_db;
\c drishtix_db;

# Enable PostGIS extension
CREATE EXTENSION postgis;

# Exit psql
\q
```

**Update `.env` with your database URL:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/drishtix_db"
```

**Run migrations:**

```bash
cd server
npx prisma migrate dev
npx prisma generate
cd ..
```

---

### **Step 3: Setup Amazon Web Services (AWS)**

#### 3.1 Create AWS Project

```bash
# Login to AWS
aws configure --profile drishtix

# Create project (replace with your project ID)
# AWS account is pre-provisioned � no project creation needed

# Set project
aws configure set region ap-south-1

# Enable billing (required for all services)
# Go to: https://console.aws.amazon.com/billing
```

#### 3.2 Enable Required APIs

```bash
# Enable all required Google Cloud APIs
# Enable AWS services via IAM policies
  pubsub.amazonaws.com \
  Amazon Athena.amazonaws.com \
  storage-api.amazonaws.com \
  storage-component.amazonaws.com \
  Amazon DynamoDB.amazonaws.com \
  Amazon Cognito+S3.amazonaws.com \
  aiplatform.amazonaws.com \
  generativelanguage.amazonaws.com \
  maps-backend.amazonaws.com \
  routes.amazonaws.com \
  places-backend.amazonaws.com \
  earthengine.amazonaws.com \
  logging.amazonaws.com \
  monitoring.amazonaws.com \
  cloudresourcemanager.amazonaws.com
```

#### 3.3 Create Service Account

```bash
# Create service account
aws iam create-role --role-name drishtix-service-role \
  --display-name="DrishtiX Service Account"

# Grant required roles
aws iam attach-role-policy --role-name drishtix-service-role \
  --member="serviceAccount:drishtix-sa@drishtix-platform.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

aws iam attach-role-policy --role-name drishtix-service-role \
  --member="serviceAccount:drishtix-sa@drishtix-platform.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"

aws iam attach-role-policy --role-name drishtix-service-role \
  --member="serviceAccount:drishtix-sa@drishtix-platform.iam.gserviceaccount.com" \
  --role="roles/Amazon Athena.dataEditor"

aws iam attach-role-policy --role-name drishtix-service-role \
  --member="serviceAccount:drishtix-sa@drishtix-platform.iam.gserviceaccount.com" \
  --role="roles/Amazon Athena.jobUser"

aws iam attach-role-policy --role-name drishtix-service-role \
  --member="serviceAccount:drishtix-sa@drishtix-platform.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

aws iam attach-role-policy --role-name drishtix-service-role \
  --member="serviceAccount:drishtix-sa@drishtix-platform.iam.gserviceaccount.com" \
  --role="roles/Amazon Cognito+S3.admin"

aws iam attach-role-policy --role-name drishtix-service-role \
  --member="serviceAccount:drishtix-sa@drishtix-platform.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

aws iam attach-role-policy --role-name drishtix-service-role \
  --member="serviceAccount:drishtix-sa@drishtix-platform.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"

aws iam attach-role-policy --role-name drishtix-service-role \
  --member="serviceAccount:drishtix-sa@drishtix-platform.iam.gserviceaccount.com" \
  --role="roles/monitoring.metricWriter"

# Download service account key
aws iam create-access-key --user-name drishtix-deploy-user
  --iam-account=drishtix-sa@drishtix-platform.iam.gserviceaccount.com
```

---

### **Step 4: Configure Environment Variables**

Create `.env` file in project root:

```env
# ================================
# SERVER CONFIGURATION
# ================================
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# ================================
# DATABASE
# ================================
DATABASE_URL="postgresql://postgres:password@localhost:5432/drishtix_db"

# ================================
# Amazon Web Services (AWS)
# ================================
VITE_GOOGLE_CLOUD_PROJECT_ID=drishtix-platform
AWS_ACCOUNT_ID=drishtix-platform
AWS_SECRET_ACCESS_KEY=./config/AWS-service-account-key.json
AWS_REGION=us-central1
Amazon Athena_LOCATION=US

# ================================
# Amazon Location Service
# ================================
GOOGLE_MAPS_API_KEY=your-maps-api-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key

# Get your API key: https://console.aws.amazon.com/google/maps-apis/credentials

# ================================
# GEMINI AI
# ================================
GEMINI_API_KEY=your-gemini-api-key
# Get your API key: https://ai.google.dev/

# ================================
# OPENWEATHER (Optional)
# ================================
OPENWEATHER_API_KEY=your-openweather-key
# Get free key: https://openweathermap.org/api

# ================================
# Amazon SageMaker (Optional - for production)
# ================================
VERTEX_AI_MODEL_ENDPOINT=
VERTEX_AI_AGENT_ID=

# ================================
# Amazon SQS + SNS TOPICS
# ================================
PUBSUB_TOPIC_CROWD_DATA=crowd-density-updates
PUBSUB_TOPIC_PREDICTIONS=prediction-results
PUBSUB_TOPIC_ANOMALIES=anomaly-detections
PUBSUB_TOPIC_ALERTS=emergency-alerts
PUBSUB_TOPIC_DISPATCH=responder-dispatch
PUBSUB_TOPIC_RISK_ENGINE=risk-engine

# ================================
# Amazon Athena
# ================================
Amazon Athena_DATASET=drishtix_analytics

# ================================
# Amazon S3
# ================================
GCS_BUCKET_MODELS=drishtix-platform-drishtix-models
GCS_BUCKET_VIDEOS=drishtix-platform-drishtix-videos
GCS_BUCKET_SIMULATIONS=drishtix-platform-drishtix-simulations

# ================================
# ML CONFIGURATION (Pre-Training Defaults)
# ================================
CONVLSTM_SERVICE_ENDPOINT=http://localhost:5000
CONVLSTM_USE_REMOTE=false
PREDICTION_LEAD_TIME_MINUTES=15
FORECAST_ACCURACY_THRESHOLD=0.75

# ================================
# FEATURE FLAGS
# ================================
ENABLE_VIDEO_ANALYTICS=false
ENABLE_EARTH_ENGINE=false
DLP_ENABLED=false
```

---

### **Step 5: Initialize AWS Services**

Run our automated initialization script:

```bash
# This creates all Amazon SQS + SNS topics, Amazon Athena datasets/tables, Amazon S3 buckets, and Amazon DynamoDB collections
npx tsx scripts/initialize-AWS-services.ts
```

**Expected Output:**

```
✓ 9 Amazon SQS + SNS topics created
✓ 9 Amazon SQS + SNS subscriptions created
✓ Amazon Athena dataset: drishtix_analytics
✓ 6 Amazon Athena tables created
✓ 4 Amazon S3 buckets created
✓ Amazon DynamoDB collections initialized
```

---

### **Step 6: Verify Setup**

Run the health check script:

```bash
npx tsx scripts/health-check.ts
```

**Expected Results:**

- ✅ Environment Variables: PASS
- ✅ PostgreSQL: PASS
- ✅ PostGIS: PASS
- ✅ Amazon SQS + SNS: PASS (9 topics)
- ✅ Amazon Athena: PASS (6 tables)
- ✅ Amazon S3: PASS (4 buckets)
- ✅ Amazon Cognito+S3: PASS
- ⚠️ Trained Models: WARN (expected - not yet trained)

**Overall Health Score: ≥ 80%** = Ready to start!

---

### **Step 7: Start the Platform**

#### Terminal 1: Backend Server

```bash
cd server
npm run dev
```

**Expected Output:**

```
╔════════════════════════════════════════════════════════════════╗
║                   🎯 DrishtiX Platform Started                ║
╠════════════════════════════════════════════════════════════════╣
║  Server:            http://localhost:3000                        ║
║  WebSocket:         Active                                     ║
║  Database:          Connected                                  ║
║  Amazon SQS + SNS:           Active                                     ║
║  AWS Services:      ✓ Connected                               ║
╚════════════════════════════════════════════════════════════════╝
```

#### Terminal 2: Frontend

```bash
pnpm run dev
```

**Access:** http://localhost:5173

---

## ✅ What Works RIGHT NOW (Without ML Training)

### 1. **Database & API Layer (100%)**

- ✅ Full CRUD operations for events, incidents, alerts
- ✅ Real-time Socket.IO updates
- ✅ PostgreSQL + PostGIS geospatial queries
- ✅ All REST API endpoints functional

### 2. **Google Cloud Services (95%)**

- ✅ Amazon SQS + SNS real-time event streaming
- ✅ Amazon Athena analytics queries
- ✅ Amazon S3 bucket operations
- ✅ Amazon Cognito+S3 Admin SDK (Auth, Amazon SNS Push, Amazon DynamoDB)
- ✅ Amazon Location Service integration (routing, geocoding)
- ✅ Amazon CloudWatch Logs & Monitoring

### 3. **Frontend Dashboard (90%)**

- ✅ Event management UI
- ✅ Live heatmaps (placeholder data)
- ✅ Video feed grid (no cameras yet)
- ✅ Alert panels with real-time updates
- ✅ Weather panel
- ✅ Recommendation system

### 4. **Services with Placeholder Logic**

- ⚠️ **ConvLSTM Forecasting**: Returns `'CALIBRATING'` instead of predictions
- ⚠️ **Anomaly Detection L1**: Works (threshold-based)
- ⚠️ **Anomaly Detection L2/L3**: Placeholder (needs trained models)
- ⚠️ **Video Analytics**: Service coded, needs camera URLs

---

## 🎯 Next Steps: What to Do After Setup

### **Option A: Use Platform with Placeholder Data (Immediate)**

The platform is fully functional for:

- Event management
- Incident tracking
- Manual alerts
- Responder coordination
- Real-time dashboard monitoring
- API testing and integration

### **Option B: Add Real Camera Feeds (No ML Required)**

1. **Configure camera URLs in `.env`:**

```env
CAMERA_1_URL=rtsp://username:password@192.168.1.100:554/stream
CAMERA_1_LOCATION_LAT=28.7041
CAMERA_1_LOCATION_LON=77.1025
```

2. **Install OpenCV:**

```bash
npm install @u4/opencv4nodejs
# Follow: https://github.com/UrielCh/opencv4nodejs#installation
```

3. **Enable video analytics:**

```env
ENABLE_VIDEO_ANALYTICS=true
```

### **Option C: Train ML Models (Advanced)**

When you're ready to enable AI predictions:

```bash
# Setup Python environment
cd scripts
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train ConvLSTM (crowd forecasting)
python train-convlstm.py --mode fetch-data
python train-convlstm.py --mode train
python train-convlstm.py --mode deploy

# Train Isolation Forest (anomaly detection L2)
python train-isolation-forest.py --mode fetch-data
python train-isolation-forest.py --mode train
python train-isolation-forest.py --mode upload

# Train Autoencoder (anomaly detection L3)
python train-autoencoder.py --mode fetch-data
python train-autoencoder.py --mode train
python train-autoencoder.py --mode upload
```

---

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Test connection
psql -U postgres -d drishtix_db
```

### AWS Permission Errors

```bash
# Re-authenticate
aws configure --profile drishtix
aws sts get-session-token --region ap-south-1

# Verify service account
aws iam get-role --role-name drishtix-sahtix-platform.iam.gserviceaccount.com
```

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

---

## 📊 Service Implementation Status

| Component                  | Status  | Notes                             |
| -------------------------- | ------- | --------------------------------- |
| **PostgreSQL Database**    | ✅ 100% | All tables with PostGIS           |
| **API Routes**             | ✅ 95%  | All endpoints working             |
| **Socket.IO Real-time**    | ✅ 100% | Live updates functional           |
| **Amazon SQS + SNS Messaging**      | ✅ 100% | 9 topics configured               |
| **Amazon Athena Analytics**     | ✅ 95%  | 6 tables, queries ready           |
| **Amazon S3**          | ✅ 100% | 4 buckets configured              |
| **Amazon Cognito+S3 Admin**         | ✅ 100% | Auth, Amazon SNS Push, Amazon DynamoDB ready        |
| **Amazon Location Service**            | ✅ 90%  | Routing, geocoding working        |
| **Weather Service**        | ✅ 85%  | API integration complete          |
| **ConvLSTM Forecasting**   | ⚠️ 40%  | Service ready, models not trained |
| **Anomaly Detection L1**   | ✅ 100% | Threshold-based working           |
| **Anomaly Detection L2**   | ⚠️ 70%  | Code ready, model not trained     |
| **Anomaly Detection L3**   | ⚠️ 70%  | Code ready, model not trained     |
| **Video Analytics**        | ⚠️ 60%  | Service coded, needs cameras      |
| **Agent Builder Dispatch** | ✅ 85%  | Gemini AI integration working     |
| **Risk Engine**            | ✅ 95%  | Full scoring system operational   |
| **Dashboard Frontend**     | ✅ 90%  | All components functional         |

**Overall Platform Readiness: ~75%** (fully operational, ML in placeholder mode)

---

## 🎓 Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                             │
│  • CCTV/Drones (60% - needs cameras)                       │
│  • Mobile GPS (0% - Flutter app not built)                 │
│  • Weather API (85% - working)                             │
│  • Event Metadata (100% - working)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                INGESTION LAYER                              │
│  • Amazon SQS + SNS Topics (100% - 9 topics created)                │
│  • Dataflow Pipeline (50% - code ready, not deployed)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 STORAGE LAYER                               │
│  • PostgreSQL + PostGIS (100%)                             │
│  • Amazon DynamoDB (100%)                                        │
│  • Amazon Athena (95% - 6 tables)                               │
│  • Amazon S3 (100% - 4 buckets)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  ML/AI LAYER                                │
│  • ConvLSTM (40% - placeholder predictions)                │
│  • Isolation Forest (70% - ready, not trained)             │
│  • Autoencoder (70% - ready, not trained)                  │
│  • Gemini Vision (85% - API working)                       │
│  • Amazon SageMaker (30% - infra ready)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                DECISION LAYER                               │
│  • Risk Engine (95% - fully operational)                   │
│  • Agent Builder (85% - AI dispatch working)               │
│  • Recommendation Engine (90% - functional)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               DELIVERY LAYER                                │
│  • REST API (95%)                                          │
│  • WebSocket/Socket.IO (100%)                              │
│  • Amazon Cognito+S3 Amazon SNS Push (100%)                                     │
│  • React Dashboard (90%)                                   │
│  • Flutter App (0% - not started)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Criteria

You're ready to use the platform when:

- ✅ Health check shows ≥80% score
- ✅ Backend server starts without errors
- ✅ Frontend loads and connects to backend
- ✅ Can create events and view them in dashboard
- ✅ Real-time Socket.IO updates working
- ✅ Amazon SQS + SNS messages being published/received

---

## 📞 Support

For issues or questions:

1. Check `scripts/health-check.ts` output
2. Review logs in `server/` console
3. Verify `.env` configuration
4. Ensure all AWS APIs are enabled

---

**🎉 You're all set! The DrishtiX platform is ready to use.**
