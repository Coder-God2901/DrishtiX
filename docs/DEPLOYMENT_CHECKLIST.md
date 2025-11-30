# DrishtiX - Production Deployment Checklist

**Date:** January 15, 2024  
**Status:** ✅ All Critical Tasks Complete - Ready for Production Setup

---

## ✅ Completed Implementation (100%)

### Task 1: Weather API Integration ✅

- [x] OpenWeatherMap service (`server/services/weather.service.ts`)
- [x] REST API routes (`server/routes/weather.routes.ts`)
- [x] Weather dashboard panel (`src/components/dashboard/WeatherPanel.tsx`)
- [x] Data pipeline integration
- [x] Heat stress calculations
- [x] Pub/Sub publishing

### Task 2: OpenCV Camera Stream Service ✅

- [x] FFmpeg camera service (`server/services/opencv-camera.service.ts`)
- [x] Camera REST API (`server/routes/camera.routes.ts`)
- [x] Video feed grid component (enhanced)
- [x] Socket.IO frame streaming
- [x] Frame extraction at 5 fps

### Task 3: BigQuery Analytics Frontend ✅

- [x] Analytics page with Recharts (`src/pages/Analytics.tsx`)
- [x] Time range filtering (24h/7d/30d/90d)
- [x] CSV export functionality
- [x] Multiple chart types (Area, Bar, Line)

### Task 4: Navigation Crowd Overlay ✅

- [x] Crowd density heatmap overlay
- [x] Color-coded zones (green/yellow/orange/red)
- [x] Real-time Pub/Sub updates
- [x] Toggle visibility controls

### Task 5: L2/L3 Anomaly Detection Frontend ✅

- [x] L2 anomaly badges (Isolation Forest)
- [x] L3 anomaly badges (Autoencoder)
- [x] Socket.IO real-time updates
- [x] Visual severity indicators

### Task 6: ML Model Training Pipeline ✅

- [x] Data collection script (`scripts/collect-training-data.py`)
- [x] ConvLSTM training (`scripts/train-convlstm.py`)
- [x] Isolation Forest training (`scripts/train-isolation-forest.py`)
- [x] Autoencoder training (`scripts/train-autoencoder.py`)
- [x] Deployment automation (`scripts/deploy-models.py`)
- [x] Python dependencies (`scripts/requirements.txt`)
- [x] ML training documentation (`docs/ML_TRAINING_GUIDE.md`)

---

## 🔧 Pre-Deployment Setup

### 1. Environment Variables

Create `.env` file in project root:

```env
# OpenWeather API
OPENWEATHER_API_KEY=your_openweathermap_api_key

# Camera Streams (comma-separated RTSP URLs)
OPENCV_CAMERA_URLS=rtsp://camera1.local/stream,rtsp://camera2.local/stream

# Google Cloud Platform
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GCP_REGION=us-central1
GCS_BUCKET_NAME=drishtix-data-storage
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/drishtix

# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://drishtix.example.com
```

### 2. Install Dependencies

**Backend:**

```bash
cd server
npm install
```

**Frontend:**

```bash
npm install
```

**ML Training (Python):**

```bash
cd scripts
pip install -r requirements.txt
```

**Optional - OpenCV Camera Service:**

```bash
# Install OpenCV for Node.js (if using camera streams)
npm install @u4/opencv4nodejs

# Install FFmpeg
# Windows: choco install ffmpeg
# Linux: sudo apt-get install ffmpeg
# MacOS: brew install ffmpeg
```

### 3. GCP Setup

#### Enable APIs

```bash
gcloud services enable bigquery.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
```

#### Create BigQuery Dataset

```bash
bq mk --dataset \
  --location=us-central1 \
  --description="DrishtiX Analytics Data" \
  drishtix_analytics
```

#### Create Pub/Sub Topics

```bash
gcloud pubsub topics create crowd-data
gcloud pubsub topics create predictions
gcloud pubsub topics create anomalies
gcloud pubsub topics create alerts
gcloud pubsub topics create dispatch
gcloud pubsub topics create risk-engine
gcloud pubsub topics create weather-updates
```

#### Create Cloud Storage Bucket

```bash
gsutil mb -l us-central1 gs://drishtix-data-storage
```

### 4. Database Setup

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

---

## 🚀 Deployment Steps

### Phase 1: Backend Deployment

```bash
# Build backend
cd server
npm run build

# Start backend server (or deploy to Cloud Run/App Engine)
npm run start
```

### Phase 2: Frontend Deployment

```bash
# Build frontend
npm run build

# Deploy to hosting (Vercel/Netlify/Cloud Storage + CDN)
# Example: Deploy to Cloud Storage
gsutil -m rsync -r -d dist/ gs://drishtix-frontend-bucket
```

### Phase 3: ML Models Deployment

```bash
# Collect training data (requires 30+ days of historical data)
cd scripts
python collect-training-data.py --model all --days 30

# Train models
python train-convlstm.py --mode fetch-data --days 30
python train-convlstm.py --mode train --epochs 50

python train-isolation-forest.py --mode fetch-data --days 60
python train-isolation-forest.py --mode train

python train-autoencoder.py --mode fetch-data --days 14
python train-autoencoder.py --mode train --epochs 50

# Deploy to Vertex AI
python deploy-models.py --all
```

**Note:** For initial deployment without historical data, use synthetic data:

```bash
python collect-training-data.py --model all --synthetic --samples 10000
```

---

## ✅ Post-Deployment Verification

### 1. Backend Health Checks

```bash
# Test weather API
curl http://your-backend-url/api/weather/current

# Test camera API (if configured)
curl http://your-backend-url/api/camera/status

# Check Socket.IO connection
# Open browser console and check for Socket.IO connection logs
```

### 2. Frontend Verification

- [ ] Dashboard loads correctly
- [ ] Weather panel displays real-time data
- [ ] Video feeds show camera streams (if configured)
- [ ] Analytics page shows BigQuery data
- [ ] Navigation map displays crowd overlay
- [ ] Anomaly detection indicators appear

### 3. GCP Services Verification

```bash
# Check Pub/Sub messages
gcloud pubsub subscriptions pull crowd-data-sub --limit=5

# Check BigQuery data
bq query --use_legacy_sql=false \
'SELECT COUNT(*) as total_records FROM drishtix_analytics.crowd_density_features'

# Check Cloud Storage
gsutil ls gs://drishtix-data-storage
```

### 4. ML Models Verification

```bash
# List Vertex AI models
gcloud ai models list --region=us-central1

# List endpoints
gcloud ai endpoints list --region=us-central1

# Test prediction (ConvLSTM example)
gcloud ai endpoints predict ENDPOINT_ID \
  --region=us-central1 \
  --json-request=test-prediction.json
```

---

## 📊 Monitoring & Alerting

### Set Up GCP Monitoring

```bash
# Create uptime check for backend
gcloud monitoring uptime-checks create http backend-health \
  --resource-type=uptime-url \
  --host=your-backend-url \
  --path=/health

# Create alert policy for high error rates
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition="Error rate > 5%"
```

### Log Analysis

```bash
# View backend logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# View Vertex AI prediction logs
gcloud ai endpoints predict-logs list --region=us-central1 --limit=20

# View Pub/Sub errors
gcloud logging read "resource.type=pubsub_topic AND severity>=ERROR" --limit=20
```

---

## 🐛 Known Issues & Workarounds

### Issue 1: OpenCV Camera Service

**Problem:** opencv4nodejs requires compilation, may fail on some systems  
**Workaround:** Use FFmpeg-only approach (already implemented in `extractFrame` method)  
**Fix:** Install pre-compiled binaries or use Docker container

### Issue 2: ML Models - Insufficient Training Data

**Problem:** Need 30+ days of historical data for optimal training  
**Workaround:** Use synthetic data generation for initial deployment  
**Fix:** Retrain models after 30-60 days of production data collection

### Issue 3: Weather API Rate Limits

**Problem:** OpenWeatherMap free tier: 1,000 calls/day  
**Workaround:** Implement 10-minute caching (already implemented)  
**Fix:** Upgrade to paid tier or use multiple API keys with load balancing

---

## 📈 Performance Optimization

### Backend

- [ ] Enable Redis caching for weather data
- [ ] Use connection pooling for database
- [ ] Implement rate limiting on APIs
- [ ] Enable gzip compression

### Frontend

- [ ] Lazy load analytics charts
- [ ] Implement virtual scrolling for large lists
- [ ] Use code splitting for route-based chunks
- [ ] Optimize images with WebP format

### ML Models

- [ ] Use Vertex AI batch predictions for bulk inference
- [ ] Implement prediction caching
- [ ] Use Spot/Preemptible instances (-70% cost)
- [ ] Enable model versioning for A/B testing

---

## 💰 Cost Estimates

### Monthly Costs (Production)

| Service              | Usage                        | Cost            |
| -------------------- | ---------------------------- | --------------- |
| BigQuery             | 100 GB storage, 1 TB queries | $25             |
| Pub/Sub              | 100M messages/month          | $40             |
| Cloud Storage        | 500 GB                       | $10             |
| Vertex AI (3 models) | n1-standard-2/4              | $350            |
| Cloud Functions      | 10M invocations              | $20             |
| OpenWeather API      | 1M calls/month               | $40             |
| **Total**            |                              | **~$485/month** |

**Cost Optimization:**

- Use Preemptible VMs for Vertex AI: **Save $245/month**
- Implement caching to reduce API calls: **Save $20/month**
- Use BigQuery partitioning: **Save $10/month**
- **Optimized Total: ~$210/month**

---

## 🔐 Security Checklist

- [ ] All API keys stored in environment variables
- [ ] GCP service account follows principle of least privilege
- [ ] HTTPS enabled for all endpoints
- [ ] CORS properly configured
- [ ] Database connection encrypted (SSL)
- [ ] Secrets stored in GCP Secret Manager
- [ ] Rate limiting enabled on all APIs
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection headers configured

---

## 📚 Documentation

| Document               | Location                             | Description                    |
| ---------------------- | ------------------------------------ | ------------------------------ |
| Implementation Summary | `CRITICAL_IMPLEMENTATION_SUMMARY.md` | Complete feature documentation |
| ML Training Guide      | `docs/ML_TRAINING_GUIDE.md`          | ML model training & deployment |
| Architecture Docs      | `docs/ARCHITECTURE.md`               | System architecture            |
| GCP Integration        | `docs/GCP_INTEGRATION.md`            | GCP services setup             |
| API Documentation      | `docs/API_REFERENCE.md`              | REST API endpoints             |

---

## 🎯 Next Steps (Post-Launch)

### Week 1

- [ ] Monitor error rates and fix critical bugs
- [ ] Collect user feedback
- [ ] Optimize slow queries
- [ ] Set up automated backups

### Month 1

- [ ] Collect 30 days of production data
- [ ] Retrain ML models on real data
- [ ] Implement A/B testing for model versions
- [ ] Add more camera feeds

### Quarter 1

- [ ] Scale to multiple events simultaneously
- [ ] Implement automated model retraining
- [ ] Add predictive maintenance for cameras
- [ ] Enhance weather impact calculations
- [ ] Implement mobile app (React Native)

---

## 🆘 Support & Troubleshooting

### Common Issues

**Backend not starting:**

```bash
# Check logs
npm run dev  # Shows detailed error logs

# Verify environment variables
echo $GOOGLE_CLOUD_PROJECT_ID
```

**Frontend build fails:**

```bash
# Clear cache
rm -rf node_modules .vite
npm install
npm run build
```

**ML deployment fails:**

```bash
# Check GCP credentials
gcloud auth application-default login

# Verify APIs enabled
gcloud services list --enabled
```

### Contact Information

- **Technical Support:** tech-support@drishtix.com
- **Documentation:** https://docs.drishtix.com
- **GitHub Issues:** https://github.com/drishtix/events/issues

---

## ✅ Final Checklist

Before going live, ensure all items are checked:

### Infrastructure

- [ ] GCP project created and billing enabled
- [ ] All APIs enabled
- [ ] BigQuery dataset created
- [ ] Pub/Sub topics created
- [ ] Cloud Storage bucket created
- [ ] Service account created with proper permissions

### Environment Configuration

- [ ] `.env` file configured with all variables
- [ ] GCP credentials JSON file downloaded
- [ ] Weather API key obtained
- [ ] Database connection string configured

### Code Deployment

- [ ] Backend deployed and running
- [ ] Frontend built and deployed
- [ ] Environment variables set in production
- [ ] HTTPS certificates configured

### Data & ML

- [ ] Prisma migrations applied
- [ ] Database seeded (if applicable)
- [ ] ML models trained (or using synthetic data)
- [ ] Vertex AI endpoints deployed and tested

### Monitoring

- [ ] GCP monitoring enabled
- [ ] Error tracking configured
- [ ] Uptime checks created
- [ ] Alert policies configured

### Testing

- [ ] All API endpoints tested
- [ ] Frontend loads correctly
- [ ] Real-time updates working (Socket.IO)
- [ ] Charts rendering with data
- [ ] ML predictions returning results

### Documentation

- [ ] README.md updated
- [ ] API documentation published
- [ ] Deployment guide shared with team
- [ ] Runbook created for on-call

---

**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT  
**Last Updated:** January 15, 2024  
**Version:** 1.0.0
