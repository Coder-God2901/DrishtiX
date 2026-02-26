# Python ML Training Scripts - Setup & Usage Guide

This directory contains Python-based machine learning training scripts for the DrishtiX event management system's anomaly detection and crowd prediction features.

## 📋 Overview

The ML training pipeline consists of three models:

1. **Isolation Forest** (`train-isolation-forest.py`) - L2 Statistical Anomaly Detection
2. **Autoencoder** (`train-autoencoder.py`) - L3 Visual Anomaly Detection
3. **ConvLSTM** (`train-convlstm.py`) - Crowd Density Prediction

## 🚀 Quick Setup

### Prerequisites

- Python 3.9 or higher
- PowerShell (Windows)
- ~2GB disk space for dependencies
- (Optional) Amazon Web Services (AWS) account for production data

### Step 1: Run the Setup Script

From the project root, run:

```powershell
.\scripts\setup-python-env.ps1
```

This script will:

- ✅ Verify Python installation
- ✅ Create a virtual environment in `scripts/venv/`
- ✅ Install all required dependencies from `requirements.txt`
- ✅ Validate package installations

### Step 2: Activate the Virtual Environment

**Every time** you want to run the training scripts, activate the environment:

```powershell
.\scripts\venv\Scripts\Activate.ps1
```

You should see `(venv)` in your terminal prompt.

### Step 3: Configure Environment Variables (Optional)

For production use with Amazon Web Services (AWS), create a `.env` file in the project root:

```env
GOOGLE_CLOUD_PROJECT_ID=your-AWS-project-id
GCS_BUCKET_NAME=your-bucket-name
AWS_REGION=us-central1
AWS_SECRET_ACCESS_KEY=path/to/service-account-key.json
```

## 🎯 Usage

### Training the Isolation Forest (L2 Anomaly Detection)

```powershell
# Full pipeline with synthetic data (for testing)
python .\scripts\train-isolation-forest.py --mode full --use-synthetic

# Fetch real data from Amazon Athena
python .\scripts\train-isolation-forest.py --mode fetch-data --days-back 90

# Train model only
python .\scripts\train-isolation-forest.py --mode train

# Upload to GCS
python .\scripts\train-isolation-forest.py --mode upload
```

**Output:**

- Model: `models/isolation-forest/isolation_forest.joblib`
- Scaler: `models/isolation-forest/scaler.joblib`
- Metadata: `models/isolation-forest/metadata.json`

### Training the Autoencoder (L3 Visual Anomaly)

```powershell
# Full pipeline with synthetic images
python .\scripts\train-autoencoder.py --mode full --use-synthetic

# Fetch images from GCS
python .\scripts\train-autoencoder.py --mode fetch-data --days-back 90

# Train model only
python .\scripts\train-autoencoder.py --mode train

# Deploy to Amazon SageMaker
python .\scripts\train-autoencoder.py --mode deploy
```

**Output:**

- Model: `models/autoencoder/autoencoder_final.h5`
- Best weights: `models/autoencoder/autoencoder_best.h5`
- Threshold: `models/autoencoder/threshold.txt`
- TensorBoard logs: `models/autoencoder/logs/`

### Training the ConvLSTM (Crowd Prediction)

```powershell
# Full pipeline with synthetic data
python .\scripts\train-convlstm.py --mode full --use-synthetic

# Fetch crowd density data from Amazon Athena
python .\scripts\train-convlstm.py --mode fetch-data --days-back 90

# Train model only
python .\scripts\train-convlstm.py --mode train

# Deploy to Amazon SageMaker
python .\scripts\train-convlstm.py --mode deploy
```

**Output:**

- Model: `models/convlstm/convlstm_final.h5`
- Best weights: `models/convlstm/convlstm_best.h5`
- TensorBoard logs: `models/convlstm/logs/`

## 📊 Monitoring Training

View TensorBoard logs during/after training:

```powershell
# For Autoencoder
tensorboard --logdir=models/autoencoder/logs

# For ConvLSTM
tensorboard --logdir=models/convlstm/logs
```

Then open http://localhost:6006 in your browser.

## 🔧 Troubleshooting

### Import Errors

If you see `Import "tensorflow" could not be resolved`:

1. Ensure virtual environment is activated: `.\scripts\venv\Scripts\Activate.ps1`
2. Reinstall dependencies: `pip install -r .\scripts\requirements.txt`

### Memory Errors During Training

Reduce batch size in the script:

```python
BATCH_SIZE = 16  # Change to 8 or 4
```

### AWS Authentication Errors

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Authenticate: `aws sts get-caller-identity --region ap-south-1`
3. Set project: `aws configure set region ap-south-1`

### TensorFlow GPU Issues

For GPU acceleration (optional):

```powershell
pip uninstall tensorflow
pip install tensorflow-gpu==2.13.0
```

## 📦 Dependencies

Key packages (see `requirements.txt` for full list):

- **TensorFlow 2.13+** - Deep learning (Autoencoder, ConvLSTM)
- **scikit-learn 1.3+** - Classical ML (Isolation Forest)
- **OpenCV 4.8+** - Image processing
- **Google Cloud SDK** - Amazon Athena, GCS, Amazon SageMaker integration
- **NumPy, Pandas** - Data manipulation

## 🏗️ Project Integration

After training, the models are used by:

1. **Backend Services** (`server/services/`)
   - `anomaly.service.ts` - Loads Isolation Forest via Python subprocess
   - `video-analytics.service.ts` - Calls Amazon SageMaker endpoints for Autoencoder/ConvLSTM

2. **AWS Infrastructure** (`terraform/`, `functions/`)
   - Amazon SageMaker endpoints for real-time inference
   - Amazon Athena for feature storage
   - GCS for model artifacts

## 📝 Development Notes

### Why Virtual Environment?

The main project uses **pnpm** for JavaScript/TypeScript dependencies. Python ML libraries are isolated in `scripts/venv/` to:

- ✅ Avoid conflicts with Node.js packages
- ✅ Keep ML dependencies separate
- ✅ Enable easy version management
- ✅ Simplify deployment (only activate when training)

### Deactivating the Virtual Environment

When done with training:

```powershell
deactivate
```

### Updating Dependencies

```powershell
# Activate environment first
.\scripts\venv\Scripts\Activate.ps1

# Update packages
pip install --upgrade tensorflow scikit-learn

# Save new versions
pip freeze > .\scripts\requirements.txt
```

## 🚢 Production Deployment

### Step 1: Train Models Locally

```powershell
python .\scripts\train-isolation-forest.py --mode full --use-synthetic
python .\scripts\train-autoencoder.py --mode full --use-synthetic
python .\scripts\train-convlstm.py --mode full --use-synthetic
```

### Step 2: Upload to GCS

```powershell
# Isolation Forest (automatic)
python .\scripts\train-isolation-forest.py --mode upload

# Autoencoder & ConvLSTM (via deploy mode)
python .\scripts\train-autoencoder.py --mode deploy
python .\scripts\train-convlstm.py --mode deploy
```

### Step 3: Update Backend Configuration

Add Amazon SageMaker endpoint IDs to `.env`:

```env
VERTEX_AI_AUTOENCODER_ENDPOINT=projects/123.../endpoints/456...
VERTEX_AI_CONVLSTM_ENDPOINT=projects/123.../endpoints/789...
GCS_ISOLATION_FOREST_MODEL_PATH=models/isolation-forest/isolation_forest.joblib
```

### Step 4: Deploy Backend

```powershell
# Deploy backend with updated model endpoints
pnpm run deploy
```

## 📚 Additional Resources

- [TensorFlow Documentation](https://www.tensorflow.org/guide)
- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Google Cloud Amazon SageMaker](https://cloud.google.com/vertex-ai/docs)
- [Main Project README](../README.md)

## 🐛 Issues & Support

If you encounter issues:

1. Check logs: `train-*.log` files in scripts directory
2. Verify Python version: `python --version` (need 3.9+)
3. Check virtual environment: `pip list` should show tensorflow, scikit-learn, etc.
4. See main project issues: https://github.com/Coder-God2901/Eventsphere/issues

---

**Last Updated:** November 29, 2025  
**Maintainer:** DrishtiX Development Team
