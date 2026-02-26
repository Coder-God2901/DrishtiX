# 🚀 Quick Setup Guide for Forked DrishtiX Project

**Date**: December 2, 2025  
**Status**: Forked Copy - Needs Service Account Key

---

## ⚡ TL;DR - Get Started in 5 Minutes

### Step 1: Get Service Account Key (CRITICAL - 2 minutes)

Choose **ONE** option:

#### Option A: Copy from Original Project (Fastest)
```powershell
# If you have the original project location
Copy-Item "PATH_TO_ORIGINAL\config\AWS-service-account-key.json" `
  "c:\Users\akjai\Desktop\open-source\DrishtiX\config\AWS-service-account-key.json"
```

#### Option B: Use Setup Script (Easiest)
```powershell
cd "c:\Users\akjai\Desktop\open-source\DrishtiX"
.\setup-service-account-key.ps1
```

#### Option C: Download New Key (Safest)
```powershell
# AWS CLI is globally available

aws iam create-access-key --user-name drishtix-deploy-user
  "c:\Users\akjai\Desktop\open-source\DrishtiX\config\AWS-service-account-key.json" `
  --user-name drishtix-deploy-user `
  --region ap-south-1
```

### Step 2: Copy Key to Server (30 seconds)
```powershell
cd "c:\Users\akjai\Desktop\open-source\DrishtiX"

Copy-Item "config\AWS-service-account-key.json" `
  "server\config\AWS-service-account-key.json"
```

### Step 3: Verify Setup (1 minute)
```powershell
# Check if key exists
Test-Path "config\AWS-service-account-key.json"
# Should return: True

Test-Path "server\config\AWS-service-account-key.json"
# Should return: True
```

### Step 4: Start Development (1 minute)
```powershell
cd "c:\Users\akjai\Desktop\open-source\DrishtiX"

# Install dependencies (if needed)
pnpm install

# Start dev server
pnpm dev
```

**✅ Done!** Server should start on `http://localhost:3000` and frontend on `http://localhost:5173`

---

## 🎯 What's Already Done

✅ Google Cloud SDK installed  
✅ Authenticated with `coderz2901@gmail.com`  
✅ Project `YOUR_AWS_ACCOUNT_ID` selected  
✅ 18+ AWS APIs enabled  
✅ Service accounts created  
✅ Amazon Cognito+S3 configured  
✅ Amazon Location Service configured  
✅ Node dependencies installed  
✅ Python 3.13.7 installed  
✅ Environment files exist with configs  
✅ Config directory created  

---

## ❌ What's Missing

🚨 **Service Account Key File** - This is the ONLY critical missing piece
- Location needed: `config/AWS-service-account-key.json`
- Also needed in: `server/config/AWS-service-account-key.json`

---

## 🔍 Verification Commands

### Check if everything is ready:
```powershell
cd "c:\Users\akjai\Desktop\open-source\DrishtiX"

# 1. Check service account key
Test-Path "config\AWS-service-account-key.json"
Test-Path "server\config\AWS-service-account-key.json"

# 2. Check AWS project
# AWS CLI is globally available
aws configure get region
# Should show: YOUR_AWS_ACCOUNT_ID

# 3. Check authentication
aws sts get-caller-identity --region ap-south-1
# Should show: coderz2901@gmail.com (active)

# 4. Test Amazon Cognito+S3 (after key is in place)
cd "c:\Users\akjai\Desktop\open-source\DrishtiX"
node -e "console.log(require('./config/AWS-service-account-key.json').project_id)"
# Should show: YOUR_AWS_ACCOUNT_ID
```

---

## 📁 File Structure Status

```
DrishtiX/
├── config/
│   └── AWS-service-account-key.json    ❌ MISSING (create this)
├── server/
│   ├── config/
│   │   └── AWS-service-account-key.json ❌ MISSING (copy from above)
│   └── .env                             ✅ EXISTS
├── .env                                 ✅ EXISTS
├── node_modules/                        ✅ EXISTS
├── package.json                         ✅ EXISTS
└── pnpm-lock.yaml                       ✅ EXISTS
```

---

## 🛠️ Optional: Database Setup

If you want to use PostgreSQL (optional - SQLite works for development):

### Install PostgreSQL
```powershell
# Using Chocolatey
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

### Create Database
```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE drishtix;
CREATE USER drishtix_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE drishtix TO drishtix_user;
\q
```

### Update server/.env
```env
DATABASE_URL=postgresql://drishtix_user:your_secure_password@localhost:5432/drishtix
```

### Run Migrations
```powershell
cd "c:\Users\akjai\Desktop\open-source\DrishtiX"
pnpm prisma generate
pnpm prisma migrate dev
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module './config/AWS-service-account-key.json'"
**Fix**: Download the service account key (see Step 1 above)

### Error: "Application Default Credentials not found"
**Fix**: Same as above - place the service account key file

### Error: "Permission denied when accessing Amazon Cognito+S3"
**Fix**: Ensure service account key is valid for project `YOUR_AWS_ACCOUNT_ID`

### Error: "Port 3000 already in use"
**Fix**: 
```powershell
# Find process using port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
# Kill the process
Stop-Process -Id <PROCESS_ID> -Force
```

### Error: "pnpm: command not found"
**Fix**: Install pnpm
```powershell
npm install -g pnpm
```

---

## 📚 More Help

- **Full Setup Guide**: `docs/AWS_SETUP_COMPLETE_GUIDE.md`
- **Configuration Status**: `CONFIG_STATUS_CHECKLIST.md`
- **Setup Script**: `setup-service-account-key.ps1`

---

## 🎓 Understanding the Setup

### Why do we need the service account key?
- It's the "password" for your app to access AWS services
- Without it, Amazon Cognito+S3, Amazon SQS + SNS, Amazon Athena, Storage won't work
- It's a JSON file with credentials

### Is it safe?
- ✅ Never commit to Git (already in `.gitignore`)
- ✅ Keep it secure on your local machine
- ⚠️ Don't share with anyone
- ⚠️ Don't email or upload it

### What if I lost the original key?
- No problem! You can create a new one
- Old keys remain valid until you delete them
- Use Option C (download new key) above

---

## ✅ Final Checklist

Before starting development, ensure:

- [ ] Service account key exists in `config/`
- [ ] Service account key copied to `server/config/`
- [ ] Both files have project_id: `YOUR_AWS_ACCOUNT_ID`
- [ ] `pnpm install` completed without errors
- [ ] `.env` file has Amazon Cognito+S3 configuration
- [ ] `server/.env` file has AWS project ID

Then run:
```powershell
pnpm dev
```

---

**Need help?** Check `CONFIG_STATUS_CHECKLIST.md` for detailed information.

**Last Updated**: December 2, 2025
