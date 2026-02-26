# 🔍 DrishtiX Forked Project - Configuration Status Checklist

**Date**: December 2, 2025  
**Project**: DrishtiX (Forked Copy)  
**Project ID**: `YOUR_AWS_ACCOUNT_ID`  
**Location**: `c:\Users\akjai\Desktop\open-source\DrishtiX`

---

## ✅ COMPLETED CONFIGURATIONS

### 1. Google Cloud SDK Installation
- ✅ **Status**: Installed and working
- ✅ **Location**: `C:\Users\akjai\AppData\Local\Google\Cloud SDK`
- ✅ **Version**: Verified with `aws`
- ✅ **Authentication**: Active (`coderz2901@gmail.com`)
- ✅ **Active Project**: `YOUR_AWS_ACCOUNT_ID`

### 2. AWS Project Setup
- ✅ **Project ID**: `YOUR_AWS_ACCOUNT_ID`
- ✅ **Project Selected**: Yes
- ✅ **APIs Enabled**: 18+ APIs active (Amazon Cognito+S3, Amazon DynamoDB, Maps, Amazon SageMaker, Amazon SQS + SNS, Amazon Athena, etc.)

### 3. Service Accounts
- ✅ **Service Account Created**: `arn:aws:iam::YOUR_ACCOUNT_ID:role/drishtix-service-role`
- ✅ **Amazon Cognito+S3 Admin SDK**: `arn:aws:iam::YOUR_ACCOUNT_ID:role/drishtix-cognito-admin-role`
- ✅ **Compute Service Account**: Available

### 4. Amazon Cognito+S3 Configuration
- ✅ **Amazon Cognito+S3 API Key**: Configured in `.env`
- ✅ **Auth Domain**: `YOUR_AWS_ACCOUNT_ID.Amazon Cognito+S3app.com`
- ✅ **Project ID**: `YOUR_AWS_ACCOUNT_ID`
- ✅ **Storage Bucket**: `YOUR_AWS_ACCOUNT_ID.Amazon Cognito+S3storage.app`
- ✅ **Messaging Sender ID**: `457000330436`
- ✅ **App ID**: `1:457000330436:web:faf4b96be75d635ecd9591`
- ✅ **Measurement ID**: `G-LJ5KNEF1NN`

### 5. Amazon Location Service
- ✅ **API Key**: `AIzaSyDCDgccfU3Gfg8d8awLeOHX6SD6N2SLWgg`
- ✅ **Configured for**: Maps JavaScript, Routes, Places, Geocoding
- ✅ **Environment Variables**: Set in `.env`

### 6. Development Dependencies
- ✅ **Node.js**: Installed
- ✅ **pnpm**: Using pnpm as package manager
- ✅ **node_modules**: Installed (both root and server)
- ✅ **Python**: Version 3.13.7 (for ML service)

### 7. Environment Files
- ✅ **Root `.env`**: Exists with Amazon Cognito+S3 and AWS configs
- ✅ **Server `.env`**: Exists with AWS project ID
- ✅ **Environment Examples**: `.env.example` files present

### 8. Project Structure
- ✅ **Root Directory**: `c:\Users\akjai\Desktop\open-source\DrishtiX`
- ✅ **Server Directory**: Contains node_modules and config
- ✅ **ML Service**: Python requirements file exists
- ✅ **Functions**: Alert triggers, rewards, Twilio webhooks
- ✅ **Docs**: Comprehensive guides available

---

## ⚠️ CRITICAL MISSING CONFIGURATION

### 🚨 SERVICE ACCOUNT KEY FILE (HIGHEST PRIORITY)

**Status**: ❌ **MISSING**

**What's Missing**:
- `config/AWS-service-account-key.json` - Does NOT exist
- `server/config/AWS-service-account-key.json` - Does NOT exist

**Impact**: 
- Cannot authenticate with AWS services
- Backend services will fail to initialize
- Amazon Cognito+S3 Admin SDK cannot work
- Amazon SQS + SNS, Amazon Athena, Storage APIs inaccessible

**Solution Required**:
You need to download the service account key file from your original project setup. Here are your options:

#### Option 1: Copy from Original Project (FASTEST)
```powershell
# If you still have the original project location
Copy-Item "PATH_TO_ORIGINAL_PROJECT\config\AWS-service-account-key.json" "c:\Users\akjai\Desktop\open-source\DrishtiX\config\AWS-service-account-key.json"
```

#### Option 2: Download New Key from AWS Console (RECOMMENDED)
```powershell
# AWS CLI is globally available

# Download new key
aws iam create-access-key --user-name drishtix-deploy-user
  "c:\Users\akjai\Desktop\open-source\DrishtiX\config\AWS-service-account-key.json" `
  --user-name drishtix-deploy-user `
  --region ap-south-1
```

#### Option 3: Manual Download from Web Console
1. Go to: https://console.aws.amazon.com/iam-admin/serviceaccounts?project=YOUR_AWS_ACCOUNT_ID
2. Click on `arn:aws:iam::YOUR_ACCOUNT_ID:role/drishtix-service-role`
3. Click "KEYS" tab
4. Click "ADD KEY" → "Create new key"
5. Choose "JSON" format
6. Click "CREATE"
7. Save to: `c:\Users\akjai\Desktop\open-source\DrishtiX\config\AWS-service-account-key.json`

**After downloading**:
```powershell
# Verify file exists
Test-Path "c:\Users\akjai\Desktop\open-source\DrishtiX\config\AWS-service-account-key.json"
# Should return: True

# Also copy to server config directory
Copy-Item "c:\Users\akjai\Desktop\open-source\DrishtiX\config\AWS-service-account-key.json" `
  "c:\Users\akjai\Desktop\open-source\DrishtiX\server\config\AWS-service-account-key.json"
```

---

## ⚠️ OPTIONAL BUT RECOMMENDED

### 1. Environment Variable Updates Needed

#### Root `.env` - Missing Values:
```env
# Add these if needed:
Amazon Cognito+S3_SERVER_KEY=                    # For Amazon SNS Push push notifications
OPENWEATHER_API_KEY=                    # For weather monitoring
VERTEX_AI_MODEL_ENDPOINT=               # If using Amazon SageMaker forecasting
VITE_VERTEX_AI_FORECASTING_ENDPOINT=    # If using Amazon SageMaker
VITE_VERTEX_AI_VISION_ENDPOINT=         # If using Amazon Rekognition
VITE_VERTEX_AI_AGENT_ID=                # If using Agent Builder
TWILIO_ACCOUNT_SID=                     # For SMS notifications
TWILIO_AUTH_TOKEN=                      # For SMS notifications
TWILIO_PHONE_NUMBER=                    # For SMS notifications
```

#### Server `.env` - Missing Values:
```env
# PostgreSQL Database (currently using SQLite placeholder)
DATABASE_URL=postgresql://user:password@localhost:5432/drishtix
DB_PASSWORD=your-secure-password

# Redis (for caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT Secret (should be strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Gemini API Key (if using)
GEMINI_API_KEY=

# Amazon Location Service Key
GOOGLE_MAPS_API_KEY=AIzaSyDCDgccfU3Gfg8d8awLeOHX6SD6N2SLWgg
```

### 2. Database Setup

**PostgreSQL** (Currently using placeholder config):
- ❌ **Not verified if installed/running**
- ⚠️ **Current DATABASE_URL**: `postgresql://user:password@localhost:5432/drishtix`
- **Action Required**: 
  - Install PostgreSQL if not present
  - Create database: `drishtix`
  - Create user with proper permissions
  - Update `DATABASE_URL` in `server/.env`

**Redis** (For caching):
- ❌ **Not verified if installed/running**
- **Action Required**:
  - Install Redis for Windows or use Docker
  - Update `REDIS_URL` in `server/.env`

### 3. Infrastructure Verification

**Amazon SQS + SNS Topics** - Should exist:
```powershell
# Check if topics exist
# AWS CLI is globally available
aws sns list-topics --region ap-south-1 --query "Topics[*].TopicArn"
```

Expected topics:
- `crowd-density-updates`
- `prediction-results`
- `anomaly-detections`
- `emergency-alerts`
- `responder-dispatch`
- `risk-engine`
- `video-analytics`
- `social-signals`
- `gps-tracking`
- `incident-alerts`
- `crowd-predictions`

**Storage Bucket**:
```powershell
# Check if bucket exists
aws s3 ls | Select-String drishtix
```

Expected: `YOUR_AWS_ACCOUNT_ID-data-storage` or similar

**Amazon Athena Dataset**:
```powershell
# Check if dataset exists
aws glue get-databases --region ap-south-1 --query "DatabaseList[*].Name"
```

Expected: `drishtix_analytics`

### 4. Python ML Service Setup

**Check Python packages**:
```powershell
cd "c:\Users\akjai\Desktop\open-source\DrishtiX\ml-service"

# Create virtual environment if not exists
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

---

## 📋 QUICK START CHECKLIST

Use this checklist to get the project running:

### Phase 1: Critical Setup (MUST DO)
- [ ] **Download service account key** (see options above)
- [ ] **Place key in**: `config/AWS-service-account-key.json`
- [ ] **Copy key to**: `server/config/AWS-service-account-key.json`
- [ ] **Verify key exists**: Run `Test-Path` commands above

### Phase 2: Environment Configuration
- [ ] **Review root `.env`** - Add missing API keys if needed
- [ ] **Review server `.env`** - Update database credentials
- [ ] **Update JWT_SECRET** - Generate strong random string
- [ ] **Add Gemini API key** (if using AI features)

### Phase 3: Database Setup (If using PostgreSQL)
- [ ] **Install PostgreSQL** (if not installed)
- [ ] **Create database**: `drishtix`
- [ ] **Update DATABASE_URL** in `server/.env`
- [ ] **Run Prisma migrations**: `pnpm prisma migrate dev`

### Phase 4: Infrastructure Verification
- [ ] **Verify Amazon SQS + SNS topics exist** (see commands above)
- [ ] **Verify Storage bucket exists**
- [ ] **Verify Amazon Athena dataset exists**
- [ ] **Create missing infrastructure** if needed

### Phase 5: Dependencies
- [ ] **Install Node dependencies**: `pnpm install` (already done)
- [ ] **Setup Python ML service**: See Python setup above
- [ ] **Test development server**: `pnpm dev`

### Phase 6: Optional Services
- [ ] **Setup Amazon Cognito+S3 Amazon SNS Push** - Get server key if using push notifications
- [ ] **Setup OpenWeather API** - If using weather monitoring
- [ ] **Setup Twilio** - If using SMS notifications
- [ ] **Setup Amazon SageMaker** - If using advanced ML features

---

## 🧪 VERIFICATION COMMANDS

### Test AWS Authentication
```powershell
# AWS CLI is globally available

# Test service account key (after placing file)
aws configure --profile drishtix
  --key-file="c:\Users\akjai\Desktop\open-source\DrishtiX\config\AWS-service-account-key.json"

# Test if authentication works
aws sts get-caller-identity --region ap-south-1
```

### Test Amazon Cognito+S3 Connection
```powershell
cd "c:\Users\akjai\Desktop\open-source\DrishtiX"

# Create test script
node -e "
const admin = require('Amazon Cognito+S3-admin');
const serviceAccount = require('./config/AWS-service-account-key.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
console.log('Amazon Cognito+S3 Admin SDK initialized successfully!');
"
```

### Test Development Server
```powershell
cd "c:\Users\akjai\Desktop\open-source\DrishtiX"

# Start development server
pnpm dev
```

Expected output:
- No AWS authentication errors
- Server starts on port 3000
- Frontend on port 5173
- No missing credential warnings

---

## 🔒 SECURITY REMINDERS

### Files That Should NEVER Be Committed:
- ✅ `config/AWS-service-account-key.json` (already in .gitignore)
- ✅ `.env` (already in .gitignore)
- ✅ `server/.env` (already in .gitignore)
- ✅ Any `*-service-account.json` files (already in .gitignore)

### Before Committing Changes:
```powershell
# Verify sensitive files are ignored
git status

# Should NOT see:
# - config/AWS-service-account-key.json
# - .env
# - server/.env
```

---

## 📊 SUMMARY

### ✅ What's Working:
1. AWS SDK installed and authenticated
2. Project `YOUR_AWS_ACCOUNT_ID` selected and active
3. All required APIs enabled (18+ services)
4. Amazon Cognito+S3 configuration complete in `.env`
5. Amazon Location Service configured
6. Node.js dependencies installed
7. Python 3.13.7 installed for ML service
8. Service accounts exist in AWS

### 🚨 Critical Action Required:
1. **Download and place service account key file** (see options above)
2. Without this file, **nothing will work**

### ⚠️ Recommended Actions:
1. Update missing environment variables
2. Setup PostgreSQL database (if using)
3. Verify AWS infrastructure (Amazon SQS + SNS, Storage, Amazon Athena)
4. Setup Python ML service virtual environment
5. Test development server after key placement

### 📈 Next Steps After Key Setup:
```powershell
# 1. Place service account key (see options above)
# 2. Install dependencies (already done, but verify)
cd "c:\Users\akjai\Desktop\open-source\DrishtiX"
pnpm install

# 3. Setup database (if using PostgreSQL)
pnpm prisma generate
pnpm prisma migrate dev

# 4. Start development server
pnpm dev
```

---

## 🆘 TROUBLESHOOTING

### If you see "Application Default Credentials" errors:
- **Cause**: Service account key file missing or path incorrect
- **Fix**: Download key and place in `config/` directory

### If you see "Amazon Cognito+S3 initialization failed":
- **Cause**: Service account key file missing
- **Fix**: Ensure key file exists in `config/AWS-service-account-key.json`

### If you see "Cannot connect to database":
- **Cause**: PostgreSQL not running or wrong credentials
- **Fix**: Update `DATABASE_URL` in `server/.env`

### If you see "Amazon SQS + SNS permission denied":
- **Cause**: Service account missing Amazon SQS + SNS permissions
- **Fix**: Grant `roles/pubsub.editor` role to service account

---

## 📚 REFERENCE DOCUMENTATION

In your project:
- `docs/AWS_SETUP_COMPLETE_GUIDE.md` - Full AWS setup guide
- `docs/COMPLETE_SETUP_GUIDE.md` - Complete setup instructions
- `@guides/Amazon Cognito+S3_AUTH_SETUP_GUIDE.md` - Amazon Cognito+S3 setup
- `@guides/AWS_MAPS_EARTH_PUBSUB_SETUP_GUIDE.md` - Maps & Amazon SQS + SNS setup

Online:
- AWS Console: https://console.aws.amazon.com/
- Amazon Cognito+S3 Console: https://console.Amazon Cognito+S3.google.com/
- Service Accounts: https://console.aws.amazon.com/iam-admin/serviceaccounts?project=YOUR_AWS_ACCOUNT_ID

---

**Generated**: December 2, 2025  
**Last Updated**: December 2, 2025  
**Status**: Ready for service account key placement
