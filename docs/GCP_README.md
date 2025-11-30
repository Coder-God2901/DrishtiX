# 📖 GCP Services - Complete Setup & Verification Guide

> **Quick Reference for Developers**  
> Last Updated: November 28, 2025

---

## 🎯 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template
cp .env.example .env

# 3. Fill in your GCP credentials (see guide below)
nano .env

# 4. Run connectivity test
pnpm run test:gcp

# 5. Start development server
pnpm run dev
```

---

## 📦 All 14 GCP Services Overview

| #   | Service           | Purpose                     | Status       |
| --- | ----------------- | --------------------------- | ------------ |
| 1   | **Firebase Auth** | User authentication & roles | ✅ Connected |
| 2   | **Firestore**     | Real-time database          | ✅ Connected |
| 3   | **Firebase FCM**  | Push notifications          | ✅ Connected |
| 4   | **Google Maps**   | Navigation & routing        | ✅ Connected |
| 5   | **Earth Engine**  | Satellite imagery           | ✅ Connected |
| 6   | **Pub/Sub**       | Event streaming             | ✅ Connected |
| 7   | **Data Pipeline** | ETL processing              | ✅ Connected |
| 8   | **BigQuery**      | Analytics & ML data         | ✅ Connected |
| 9   | **Vertex AI**     | Crowd forecasting           | ✅ Connected |
| 10  | **Gemini Vision** | Anomaly detection           | ✅ Connected |
| 11  | **Agent Builder** | Auto-dispatch               | ✅ Connected |
| 12  | **Cloud Run**     | Serverless backend          | ✅ Ready     |
| 13  | **Cloud Storage** | Asset storage               | ✅ Connected |
| 14  | **Cloud Logging** | Monitoring & security       | ✅ Connected |

---

## 🔑 Required Credentials

### What You Need from GCP:

1. **Project ID** - Your GCP project identifier
2. **Service Account Key** - JSON file for authentication
3. **Firebase Config** - 7 variables from Firebase console
4. **Maps API Keys** - 1-3 keys for Maps, Routes, Places
5. **Gemini API Key** - For AI/ML features
6. **Vertex AI Endpoints** - Model & agent IDs (after deployment)

---

## 📝 Environment Variables Checklist

### Critical Variables (Required):

```env
# Core GCP
✅ GOOGLE_CLOUD_PROJECT_ID=your-project-id
✅ GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-service-account-key.json
✅ GCP_REGION=us-central1

# Firebase (7 variables)
✅ VITE_FIREBASE_API_KEY=AIza...
✅ VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
✅ VITE_FIREBASE_PROJECT_ID=your-project-id
✅ VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
✅ VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
✅ VITE_FIREBASE_APP_ID=1:123456789:web:abc123
✅ VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Maps
✅ GOOGLE_MAPS_API_KEY=AIza...
✅ VITE_GOOGLE_MAPS_API_KEY=AIza...

# Gemini
✅ GEMINI_API_KEY=AIza...
✅ VITE_GEMINI_API_KEY=AIza...
```

### Optional Variables (Recommended):

```env
# Enhanced Maps
⚠️ GOOGLE_MAPS_ROUTES_API_KEY=AIza...  # Separate key for backend
⚠️ GOOGLE_MAPS_PLACES_API_KEY=AIza...  # Separate key for POI

# Vertex AI (after model deployment)
⚠️ VERTEX_AI_MODEL_ID=crowd-forecasting-model
⚠️ VERTEX_AI_MODEL_ENDPOINT=1234567890
⚠️ VERTEX_AI_AGENT_ID=abc123-def456

# BigQuery
⚠️ BIGQUERY_DATASET=drishtix_analytics
⚠️ BIGQUERY_TABLE_FEATURES=event_feature_vectors

# Pub/Sub (uses defaults if not set)
⚠️ PUBSUB_TOPIC_CROWD_DATA=crowd-density-updates
⚠️ PUBSUB_TOPIC_PREDICTIONS=prediction-results

# Earth Engine (optional)
⚠️ EARTH_ENGINE_ENABLED=true
⚠️ EARTH_ENGINE_PROJECT=your-project-id
```

---

## 🚀 Step-by-Step Setup

### Step 1: Create GCP Project

```bash
# Using gcloud CLI
gcloud projects create eventsphere-prod --name="EventSphere"
gcloud config set project eventsphere-prod

# Enable billing (required!)
# Go to: https://console.cloud.google.com/billing
```

### Step 2: Enable All APIs

```bash
# Run this single command to enable all 18 required APIs
gcloud services enable \
  firebase.googleapis.com \
  firestore.googleapis.com \
  fcm.googleapis.com \
  maps-backend.googleapis.com \
  routes.googleapis.com \
  places-backend.googleapis.com \
  aiplatform.googleapis.com \
  vision.googleapis.com \
  generativelanguage.googleapis.com \
  pubsub.googleapis.com \
  bigquery.googleapis.com \
  storage-api.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  run.googleapis.com \
  cloudfunctions.googleapis.com \
  dlp.googleapis.com \
  secretmanager.googleapis.com
```

### Step 3: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create eventsphere-sa \
  --display-name="EventSphere Service Account"

# Set email variable
export SA_EMAIL=eventsphere-sa@eventsphere-prod.iam.gserviceaccount.com

# Grant all required roles
gcloud projects add-iam-policy-binding eventsphere-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding eventsphere-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/pubsub.editor"

gcloud projects add-iam-policy-binding eventsphere-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding eventsphere-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding eventsphere-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding eventsphere-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/logging.logWriter"

# Generate key file
mkdir -p config
gcloud iam service-accounts keys create ./config/gcp-service-account-key.json \
  --iam-account=${SA_EMAIL}
```

### Step 4: Setup Firebase

1. Go to https://console.firebase.google.com/
2. Add project → Select existing GCP project
3. Enable Authentication → Email/Password + Google
4. Create Firestore database → Production mode → us-central1
5. Get config from Project Settings → Add app → Web

### Step 5: Get API Keys

**Google Maps:**

1. Go to: https://console.cloud.google.com/google/maps-apis
2. Credentials → Create API Key → Restrict to Maps/Routes/Places

**Gemini:**

1. Go to: https://makersuite.google.com/app/apikey
2. Create API Key → Select your project

### Step 6: Create Infrastructure

```bash
# BigQuery dataset
bq mk --dataset --location=US eventsphere-prod:drishtix_analytics

# Pub/Sub topics
gcloud pubsub topics create crowd-density-updates
gcloud pubsub topics create prediction-results
gcloud pubsub topics create anomaly-detections
gcloud pubsub topics create risk-engine

# Cloud Storage buckets
gsutil mb -l us-central1 gs://eventsphere-data-storage
gsutil mb -l us-central1 gs://eventsphere-models
```

---

## ✅ Verification

### Test GCP Connectivity

```bash
# Run automated tests
pnpm run test:gcp

# Expected output:
# ✅ GCP Config: All required variables set
# ✅ Firebase Config: All variables configured
# ✅ Google Maps API: Maps API key configured
# ✅ Gemini API: Using model gemini-1.5-pro
# ✅ BigQuery Dataset: Dataset drishtix_analytics
# ✅ Pub/Sub Topics: 6 topics configured
# ✅ GCP Orchestrator: Successfully initialized
# ✅ OVERALL STATUS: PASS
```

### Manual Verification

```typescript
// In server console or Node REPL
import { gcpOrchestrator } from './server/services/gcp-orchestrator.service';

// Initialize
await gcpOrchestrator.initialize();

// Check status
const status = gcpOrchestrator.getStatus();
console.log(status);

// Health check
const healthy = await gcpOrchestrator.healthCheck();
console.log('Healthy:', healthy);
```

---

## 🔧 Troubleshooting

### Issue: "Permission Denied"

**Cause:** Service account missing IAM roles

**Fix:**

```bash
# Re-run Step 3 IAM policy bindings
# Or grant broader Editor role (not recommended for production):
gcloud projects add-iam-policy-binding eventsphere-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/editor"
```

### Issue: "API Not Enabled"

**Cause:** Required API not activated

**Fix:**

```bash
# Enable specific API from error message
gcloud services enable <API_NAME>.googleapis.com
```

### Issue: "Invalid API Key"

**Cause:** API key restrictions blocking requests

**Fix:**

1. Check API key in GCP Console
2. Verify HTTP referrers/IP addresses
3. Ensure correct APIs enabled for key

### Issue: Missing Packages

**Cause:** Cloud Logging packages not installed

**Fix:**

```bash
pnpm add @google-cloud/logging @google-cloud/monitoring
```

---

## 📚 Documentation

### Detailed Guides

- **[GCP Developer Setup Guide](./docs/GCP_DEVELOPER_SETUP_GUIDE.md)** - Complete step-by-step setup
- **[GCP Complete Integration](./docs/GCP_COMPLETE_INTEGRATION.md)** - Service-by-service details
- **[Environment Variables Audit](./docs/GCP_ENV_VARIABLES_AUDIT.md)** - All env vars explained
- **[Architecture Diagram](./docs/GCP_ARCHITECTURE_DIAGRAM.md)** - Visual data flows

### Service-Specific Docs

- [Vertex AI Setup](./docs/VERTEX_AI_SETUP_GUIDE.md)
- [Gemini Vision Setup](./docs/GEMINI_VISION_ANOMALY_DETECTION.md)
- [Agent Builder Setup](./docs/VERTEX_AI_AGENT_BUILDER_SETUP.md)
- [BigQuery Setup](./docs/BIGQUERY_SETUP.md)

---

## 💰 Cost Estimates

### Free Tier (Development)

- Firebase: Free for <50K reads/day
- FCM: Unlimited messages
- Pub/Sub: 10 GB/month free
- BigQuery: 10 GB storage + 1 TB queries/month
- Cloud Run: 2M requests/month
- Gemini: 60 requests/minute
- Maps: $200 credit/month

**Estimated monthly cost: $0-50**

### Production (10K attendees/event)

- Firebase: $10
- Maps API: $50
- Vertex AI: $80
- Gemini Vision: $50
- BigQuery: $10
- Pub/Sub: $5
- Cloud Run: $20
- Storage: $10
- Logging: $5

**Estimated monthly cost: $200-500**

---

## 🎯 Next Steps

After completing setup:

1. ✅ Run connectivity test: `pnpm run test:gcp`
2. ✅ Start dev server: `pnpm run dev`
3. ✅ Test end-to-end pipeline with sample data
4. ✅ Deploy to Cloud Run: `pnpm run deploy`
5. ✅ Monitor logs: `gcloud logging read`

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Docs:** [./docs/](./docs/)
- **GCP Support:** https://cloud.google.com/support

---

**✅ Setup Complete!** All 14 GCP services are ready for use.

**Version:** 1.0.0  
**Last Updated:** November 28, 2025
