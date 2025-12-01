# 🚀 DrishtiX - Complete GCP Setup Guide

**Project**: DrishtiX Event Management Platform  
**Date Created**: December 1, 2025  
**Last Updated**: December 2, 2025  
**Project ID**: `drishtix-479606`

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create GCP Project](#step-1-create-gcp-project)
3. [Step 2: Install Google Cloud SDK](#step-2-install-google-cloud-sdk)
4. [Step 3: Enable Required APIs](#step-3-enable-required-apis)
5. [Step 4: Create Service Account](#step-4-create-service-account)
6. [Step 5: Setup Firebase](#step-5-setup-firebase)
7. [Step 6: Get Google Maps API Keys](#step-6-get-google-maps-api-keys)
8. [Step 7: Get Gemini API Key](#step-7-get-gemini-api-key)
9. [Step 8: Create Infrastructure](#step-8-create-infrastructure)
10. [Step 9: Configure Environment Files](#step-9-configure-environment-files)
11. [Verification & Testing](#verification--testing)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Google Account (Gmail)
- Windows PC with PowerShell
- Internet connection
- Code editor (VS Code recommended)

---

## Step 1: Create GCP Project

### Via Web Console

1. **Go to**: https://console.cloud.google.com/
2. **Sign in** with your Google account
3. **Click** the project dropdown at the top
4. **Click** "NEW PROJECT"
5. **Enter project name**: `DrishtiX-Production` (or your preferred name)
6. **Organization**: Leave as "No organization"
7. **Click** "CREATE"
8. **Wait** 30 seconds for project creation
9. **Copy your Project ID**: (e.g., `drishtix-479606`)

**✅ Result**: You now have a GCP project with a unique ID

---

## Step 2: Install Google Cloud SDK

### Download and Install

1. **Download installer**: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe
2. **Run the installer** (double-click downloaded file)
3. **Follow prompts**:
   - Leave default installation path
   - Check "Run gcloud init after installation"
   - Click Install

### Initialize and Authenticate

4. **When terminal opens**, run:
```bash
gcloud init
```

5. **Login when prompted**:
   - Browser will open automatically
   - Select your Google account
   - Click "Allow"

6. **Select your project**:
   - Choose the project you created (e.g., `drishtix-479606`)
   - Press Enter

7. **Region/Zone**:
   - Skip (press Enter) or select `us-central1` if asked

**✅ Result**: gcloud CLI is installed and authenticated

---

## Step 3: Enable Required APIs

### Using gcloud Command (Recommended)

**Open PowerShell** and run:

```powershell
cd "C:\Users\YOUR_USERNAME\AppData\Local\Google\Cloud SDK"

.\google-cloud-sdk\bin\gcloud.cmd services enable `
  firebase.googleapis.com `
  firestore.googleapis.com `
  fcm.googleapis.com `
  maps-backend.googleapis.com `
  routes.googleapis.com `
  places-backend.googleapis.com `
  aiplatform.googleapis.com `
  vision.googleapis.com `
  generativelanguage.googleapis.com `
  pubsub.googleapis.com `
  bigquery.googleapis.com `
  storage-api.googleapis.com `
  logging.googleapis.com `
  monitoring.googleapis.com `
  run.googleapis.com `
  cloudfunctions.googleapis.com `
  secretmanager.googleapis.com `
  --project=YOUR_PROJECT_ID
```

**Replace** `YOUR_PROJECT_ID` with your actual project ID (e.g., `drishtix-479606`)

**Example for drishtix-479606**:
```powershell
cd "C:\Users\akjai\AppData\Local\Google\Cloud SDK"

.\google-cloud-sdk\bin\gcloud.cmd services enable firebase.googleapis.com firestore.googleapis.com fcm.googleapis.com maps-backend.googleapis.com routes.googleapis.com places-backend.googleapis.com aiplatform.googleapis.com vision.googleapis.com generativelanguage.googleapis.com pubsub.googleapis.com bigquery.googleapis.com storage-api.googleapis.com logging.googleapis.com monitoring.googleapis.com run.googleapis.com cloudfunctions.googleapis.com secretmanager.googleapis.com --project=drishtix-479606
```

**⏱️ Wait**: 1-2 minutes for all APIs to enable

### Verify APIs are Enabled

```powershell
.\google-cloud-sdk\bin\gcloud.cmd services list --enabled --project=YOUR_PROJECT_ID --filter="name:firebase OR name:firestore OR name:maps OR name:aiplatform OR name:pubsub OR name:bigquery"
```

**✅ Result**: You should see 16+ enabled APIs

---

## Step 4: Create Service Account

### Create the Service Account

```powershell
cd "C:\Users\YOUR_USERNAME\AppData\Local\Google\Cloud SDK"

.\google-cloud-sdk\bin\gcloud.cmd iam service-accounts create drishtix-sa `
  --display-name="DrishtiX Service Account" `
  --project=YOUR_PROJECT_ID
```

**Example**:
```powershell
cd "C:\Users\akjai\AppData\Local\Google\Cloud SDK"

.\google-cloud-sdk\bin\gcloud.cmd iam service-accounts create drishtix-sa --display-name="DrishtiX Service Account" --project=drishtix-479606
```

### Grant IAM Roles (6 roles required)

**1. Firebase Admin**:
```powershell
.\google-cloud-sdk\bin\gcloud.cmd projects add-iam-policy-binding YOUR_PROJECT_ID `
  --member="serviceAccount:drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/firebase.admin"
```

**2. Pub/Sub Editor**:
```powershell
.\google-cloud-sdk\bin\gcloud.cmd projects add-iam-policy-binding YOUR_PROJECT_ID `
  --member="serviceAccount:drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/pubsub.editor"
```

**3. BigQuery Data Editor**:
```powershell
.\google-cloud-sdk\bin\gcloud.cmd projects add-iam-policy-binding YOUR_PROJECT_ID `
  --member="serviceAccount:drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/bigquery.dataEditor"
```

**4. Storage Object Admin**:
```powershell
.\google-cloud-sdk\bin\gcloud.cmd projects add-iam-policy-binding YOUR_PROJECT_ID `
  --member="serviceAccount:drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/storage.objectAdmin"
```

**5. Vertex AI User**:
```powershell
.\google-cloud-sdk\bin\gcloud.cmd projects add-iam-policy-binding YOUR_PROJECT_ID `
  --member="serviceAccount:drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/aiplatform.user"
```

**6. Logging Writer**:
```powershell
.\google-cloud-sdk\bin\gcloud.cmd projects add-iam-policy-binding YOUR_PROJECT_ID `
  --member="serviceAccount:drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/logging.logWriter"
```

### Download Service Account Key

**Navigate to your project directory**:
```powershell
cd "C:\Users\YOUR_USERNAME\OneDrive\Desktop\Projects\DrishtiX"
```

**Create config directory**:
```powershell
mkdir config
```

**Download the key**:
```powershell
cd "C:\Users\YOUR_USERNAME\AppData\Local\Google\Cloud SDK"

.\google-cloud-sdk\bin\gcloud.cmd iam service-accounts keys create `
  "C:\Users\YOUR_USERNAME\OneDrive\Desktop\Projects\DrishtiX\config\gcp-service-account-key.json" `
  --iam-account=drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

**Example for drishtix-479606**:
```powershell
cd "C:\Users\akjai\AppData\Local\Google\Cloud SDK"

.\google-cloud-sdk\bin\gcloud.cmd iam service-accounts keys create "C:\Users\akjai\OneDrive\Desktop\Projects\DrishtiX\config\gcp-service-account-key.json" --iam-account=drishtix-sa@drishtix-479606.iam.gserviceaccount.com
```

**✅ Result**: JSON key file downloaded to `config/gcp-service-account-key.json`

**⚠️ IMPORTANT**: Never commit this file to Git! It's already in `.gitignore`.

---

## Step 5: Setup Firebase

### Add Firebase to Your Project

1. **Go to**: https://console.firebase.google.com/
2. **Click** "Add project"
3. **Select** "Use an existing Google Cloud project"
4. **Choose** your project (e.g., `drishtix-479606`)
5. **Continue** through the prompts
6. **Enable Google Analytics**: Yes (recommended)
7. **Wait** 30-60 seconds for Firebase setup

### Register Web App

1. **In Firebase Console**, click the **⚙️ gear icon** (Project settings)
2. **Scroll down** to "Your apps" section
3. **Click** the Web icon `</>`
4. **App nickname**: `DrishtiX-Web`
5. **Firebase Hosting**: Skip (don't check)
6. **Click** "Register app"
7. **Copy the configuration** (you'll see 7 values):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123...",
  measurementId: "G-XXXXXXXXXX"
};
```

**📝 Save these values** - you'll need them in Step 9

### Enable Authentication

1. **Click** "Authentication" in left sidebar
2. **Click** "Get started"
3. **Enable Email/Password**:
   - Click "Email/Password"
   - Toggle **Enable**
   - Click **Save**
4. **Enable Google**:
   - Click "Google"
   - Toggle **Enable**
   - Select project support email
   - Click **Save**

### Enable Firestore Database

1. **Click** "Firestore Database" in left sidebar
2. **Click** "Create database"
3. **Location**: `us-central` (or closest to you)
4. **Start in**: **Production mode**
5. **Click** "Enable"
6. **Wait** 1-2 minutes

**✅ Result**: Firebase Auth and Firestore are ready

---

## Step 6: Get Google Maps API Keys

### Create API Key

1. **Go to**: https://console.cloud.google.com/google/maps-apis/credentials?project=YOUR_PROJECT_ID
2. **Click** "+ CREATE CREDENTIALS"
3. **Select** "API key"
4. **Copy the API key** (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### Restrict the API Key (Important for Security)

1. **Click** "EDIT API KEY" (or click the key name)
2. **Application restrictions**: 
   - For development: Select "None"
   - For production: Select "HTTP referrers" and add your domain
3. **API restrictions**:
   - Select "Restrict key"
   - Check these APIs:
     - ✅ Maps JavaScript API
     - ✅ Routes API
     - ✅ Places API (New)
     - ✅ Geocoding API
     - ✅ Directions API
4. **Click** "Save"

**📝 Save this API key** - you'll need it in Step 9

**✅ Result**: Google Maps API key created and restricted

---

## Step 7: Get Gemini API Key

### Create Gemini API Key

1. **Go to**: https://aistudio.google.com/app/apikey
2. **Click** "Create API key"
3. **Select project**: Choose your project (e.g., `drishtix-479606`)
4. **Click** "Create API key in existing project"
5. **Copy the API key** (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

**📝 Save this API key** - you'll need it in Step 9

**✅ Result**: Gemini AI API key created

---

## Step 8: Create Infrastructure

### Create Pub/Sub Topics

```powershell
cd "C:\Users\YOUR_USERNAME\AppData\Local\Google\Cloud SDK"

.\google-cloud-sdk\bin\gcloud.cmd pubsub topics create `
  crowd-density-updates `
  prediction-results `
  anomaly-detections `
  emergency-alerts `
  responder-dispatch `
  risk-engine `
  --project=YOUR_PROJECT_ID
```

**Example**:
```powershell
cd "C:\Users\akjai\AppData\Local\Google\Cloud SDK"

.\google-cloud-sdk\bin\gcloud.cmd pubsub topics create crowd-density-updates prediction-results anomaly-detections emergency-alerts responder-dispatch risk-engine --project=drishtix-479606
```

### Create Cloud Storage Bucket

```powershell
.\google-cloud-sdk\bin\gcloud.cmd storage buckets create `
  gs://YOUR_PROJECT_ID-data-storage `
  --location=us-central1 `
  --project=YOUR_PROJECT_ID
```

**Example**:
```powershell
.\google-cloud-sdk\bin\gcloud.cmd storage buckets create gs://drishtix-479606-data-storage --location=us-central1 --project=drishtix-479606
```

### Create BigQuery Dataset

**Via Web Console** (easier):

1. **Go to**: https://console.cloud.google.com/bigquery?project=YOUR_PROJECT_ID
2. **Click** your project name in the left Explorer panel
3. **Click** the 3 dots (⋮) next to it
4. **Click** "Create dataset"
5. **Dataset ID**: `drishtix_analytics`
6. **Location**: `US (multi-region)`
7. **Click** "CREATE DATASET"

**✅ Result**: Infrastructure created (Pub/Sub, Storage, BigQuery)

---

## Step 9: Configure Environment Files

### Update .env.example Files

**Navigate to project directory**:
```powershell
cd "C:\Users\YOUR_USERNAME\OneDrive\Desktop\Projects\DrishtiX"
```

### Root .env.example

**Open**: `.env.example`

**Update these values** with your actual credentials:

```env
# Core GCP Configuration
VITE_GOOGLE_CLOUD_PROJECT_ID=YOUR_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-service-account-key.json

# Firebase (7 values from Step 5)
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID

# Google Maps (from Step 6)
GOOGLE_MAPS_API_KEY=YOUR_MAPS_API_KEY
GOOGLE_MAPS_ROUTES_API_KEY=YOUR_MAPS_API_KEY
GOOGLE_MAPS_PLACES_API_KEY=YOUR_MAPS_API_KEY
VITE_GOOGLE_MAPS_API_KEY=YOUR_MAPS_API_KEY

# Cloud Storage
GCS_BUCKET_NAME=YOUR_PROJECT_ID-data-storage
```

### Server .env.example

**Open**: `server/.env.example`

**Update these values**:

```env
# GCP Configuration
GCP_PROJECT_ID=YOUR_PROJECT_ID
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-service-account-key.json

# Firebase Admin SDK
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_CLIENT_EMAIL=drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Gemini API (from Step 7)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-1.5-pro
GEMINI_VISION_MODEL=gemini-1.5-flash

# Google Maps
GOOGLE_MAPS_API_KEY=YOUR_MAPS_API_KEY
GOOGLE_MAPS_ROUTES_API_KEY=YOUR_MAPS_API_KEY
GOOGLE_MAPS_PLACES_API_KEY=YOUR_MAPS_API_KEY
```

### Create Actual .env Files

```powershell
# Copy example files to create actual .env files
Copy-Item .env.example .env
Copy-Item server\.env.example server\.env
```

**✅ Result**: Both `.env` files configured with your credentials

---

## Verification & Testing

### Verify Service Account Key

```powershell
cd "C:\Users\YOUR_USERNAME\OneDrive\Desktop\Projects\DrishtiX"

# Check if file exists
Test-Path config\gcp-service-account-key.json
```

**Expected output**: `True`

### Verify APIs are Enabled

```powershell
cd "C:\Users\YOUR_USERNAME\AppData\Local\Google\Cloud SDK"

.\google-cloud-sdk\bin\gcloud.cmd services list --enabled --project=YOUR_PROJECT_ID | Select-String -Pattern "firebase|firestore|maps|gemini|pubsub|bigquery"
```

**Expected output**: List of enabled services

### Verify Pub/Sub Topics

```powershell
.\google-cloud-sdk\bin\gcloud.cmd pubsub topics list --project=YOUR_PROJECT_ID
```

**Expected output**: 6 topics listed

### Test Firebase Connection

1. **Go to**: https://console.firebase.google.com/project/YOUR_PROJECT_ID
2. **Check**: Authentication has providers enabled
3. **Check**: Firestore database exists

### Start Development Server

```powershell
cd "C:\Users\YOUR_USERNAME\OneDrive\Desktop\Projects\DrishtiX"

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

**Expected**: Server starts without GCP authentication errors

**✅ Result**: All services verified and working!

---

## Troubleshooting

### Issue: "gcloud: command not found"

**Solution**:
```powershell
# Use full path to gcloud
cd "C:\Users\YOUR_USERNAME\AppData\Local\Google\Cloud SDK"
.\google-cloud-sdk\bin\gcloud.cmd --version
```

### Issue: "Permission Denied" when creating service account

**Solution**:
1. Verify you're logged in: `.\google-cloud-sdk\bin\gcloud.cmd auth list`
2. Verify you're the project owner
3. Re-authenticate: `.\google-cloud-sdk\bin\gcloud.cmd auth login`

### Issue: "API not enabled"

**Solution**:
```powershell
# Enable specific API
.\google-cloud-sdk\bin\gcloud.cmd services enable API_NAME.googleapis.com --project=YOUR_PROJECT_ID

# Example for Maps:
.\google-cloud-sdk\bin\gcloud.cmd services enable maps-backend.googleapis.com --project=YOUR_PROJECT_ID
```

### Issue: Firebase config values not working

**Solution**:
1. Re-check Firebase Console → Project Settings
2. Ensure you copied all 7 values correctly
3. Remove quotes from `.env` file values
4. Restart development server

### Issue: Service account key not found

**Solution**:
```powershell
# Verify path exists
cd "C:\Users\YOUR_USERNAME\OneDrive\Desktop\Projects\DrishtiX"
Test-Path config\gcp-service-account-key.json

# If false, re-download key (see Step 4)
```

### Issue: BigQuery dataset creation fails

**Solution**:
- Use web console instead of CLI
- Go to: https://console.cloud.google.com/bigquery
- Manually create dataset

---

## Summary - What You've Configured

### ✅ GCP Project
- **Project ID**: `drishtix-479606` (your actual ID)
- **Project Name**: DrishtiX-Production
- **Location**: us-central1

### ✅ Service Account
- **Name**: `drishtix-sa`
- **Email**: `drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com`
- **Roles**: 6 IAM roles granted
- **Key**: Downloaded to `config/gcp-service-account-key.json`

### ✅ Enabled APIs (17 services)
- Firebase Management API
- Cloud Firestore API
- Firebase Cloud Messaging (FCM)
- Maps JavaScript API
- Routes API
- Places API
- Vertex AI API
- Vision AI API
- Generative Language API (Gemini)
- Cloud Pub/Sub API
- BigQuery API
- Cloud Storage API
- Cloud Logging API
- Cloud Monitoring API
- Cloud Run API
- Cloud Functions API
- Secret Manager API

### ✅ Firebase Services
- **Authentication**: Email/Password + Google OAuth
- **Firestore**: Database created
- **Configuration**: 7 values copied to `.env`

### ✅ API Keys
- **Google Maps**: Created and restricted
- **Gemini AI**: Created for your project

### ✅ Infrastructure
- **Pub/Sub Topics**: 6 topics created
- **Cloud Storage**: Bucket created
- **BigQuery**: Dataset `drishtix_analytics` created

### ✅ Environment Files
- `.env`: Configured with all credentials
- `server/.env`: Configured with all credentials

---

## Next Steps

### Required for Production
1. **Set up PostgreSQL database** (replace SQLite)
2. **Get FCM Server Key** (Firebase Console → Cloud Messaging)
3. **Restrict API keys** to production domain
4. **Set up Cloud Armor** for security
5. **Configure alerting** in Cloud Monitoring

### Optional Services
1. **OpenWeatherMap API** - Weather data
2. **Twitter/X API** - Social monitoring
3. **Twilio API** - SMS notifications
4. **Redis** - Caching layer

### Start Development
```powershell
cd "C:\Users\YOUR_USERNAME\OneDrive\Desktop\Projects\DrishtiX"
pnpm install
pnpm dev
```

---

## Cost Estimates

### Free Tier (Development)
- **Firebase**: Free for <50K reads/day
- **FCM**: Unlimited messages
- **Pub/Sub**: 10 GB/month free
- **BigQuery**: 10 GB storage + 1 TB queries/month
- **Cloud Run**: 2M requests/month
- **Gemini**: 60 requests/minute
- **Maps**: $200 credit/month

**Estimated monthly cost**: **$0-50**

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

**Estimated monthly cost**: **$200-500**

---

## Important Notes

### Security Best Practices
1. ✅ Never commit `gcp-service-account-key.json` to Git
2. ✅ Never commit `.env` files to Git
3. ✅ Restrict API keys to specific domains in production
4. ✅ Rotate service account keys every 90 days
5. ✅ Enable 2FA on your Google account
6. ✅ Use IAM roles with least privilege

### Billing Alerts
1. **Set up billing alerts**:
   - Go to: https://console.cloud.google.com/billing
   - Set budget alert at $50/month
   - Get email notifications at 50%, 90%, 100%

### Backup Your Configuration
1. **Export current config**:
```powershell
.\google-cloud-sdk\bin\gcloud.cmd config list --project=YOUR_PROJECT_ID > gcp-config-backup.txt
```

2. **Save these critical files** (encrypted backup):
   - `config/gcp-service-account-key.json`
   - `.env`
   - `server/.env`

---

## Quick Reference Commands

### Check gcloud version
```powershell
cd "C:\Users\YOUR_USERNAME\AppData\Local\Google\Cloud SDK"
.\google-cloud-sdk\bin\gcloud.cmd --version
```

### Set active project
```powershell
.\google-cloud-sdk\bin\gcloud.cmd config set project YOUR_PROJECT_ID
```

### List enabled services
```powershell
.\google-cloud-sdk\bin\gcloud.cmd services list --enabled --project=YOUR_PROJECT_ID
```

### List service accounts
```powershell
.\google-cloud-sdk\bin\gcloud.cmd iam service-accounts list --project=YOUR_PROJECT_ID
```

### List Pub/Sub topics
```powershell
.\google-cloud-sdk\bin\gcloud.cmd pubsub topics list --project=YOUR_PROJECT_ID
```

### List storage buckets
```powershell
.\google-cloud-sdk\bin\gcloud.cmd storage buckets list --project=YOUR_PROJECT_ID
```

---

## Support & Resources

### Documentation
- **GCP Documentation**: https://cloud.google.com/docs
- **Firebase Documentation**: https://firebase.google.com/docs
- **Gemini AI Documentation**: https://ai.google.dev/docs
- **Google Maps Platform**: https://developers.google.com/maps

### Support
- **GCP Support**: https://cloud.google.com/support
- **Firebase Support**: https://firebase.google.com/support
- **Community Forums**: https://stackoverflow.com/questions/tagged/google-cloud-platform

### Project Documentation
- `docs/GCP_README.md` - Quick reference guide
- `docs/COMPREHENSIVE_GCP_INTEGRATION_AUDIT.md` - Full audit report
- `[audits]/` folder - All audit reports

---

**✅ Setup Complete!**

You now have a fully configured GCP environment for DrishtiX. You can start development immediately or complete the optional services as needed.

**Last Updated**: December 2, 2025  
**Version**: 1.0.0
