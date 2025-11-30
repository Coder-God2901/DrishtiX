# 🚀 Quick Start Guide - Python ML Training

## One-Time Setup (5 minutes)

```powershell
# 1. Setup virtual environment
.\scripts\setup-python-env.ps1

# 2. Verify installation
.\scripts\venv\Scripts\Activate.ps1
python --version  # Should be 3.9+
pip list | Select-String "tensorflow|scikit-learn"
deactivate
```

## Run Training Scripts

### Option 1: Using the Quick Launcher (Recommended)

```powershell
# Isolation Forest (L2 Anomaly Detection)
.\scripts\run-training.ps1 -Script isolation-forest -Mode full -UseSynthetic

# Autoencoder (L3 Visual Anomaly)
.\scripts\run-training.ps1 -Script autoencoder -Mode full -UseSynthetic

# ConvLSTM (Crowd Prediction)
.\scripts\run-training.ps1 -Script convlstm -Mode full -UseSynthetic
```

### Option 2: Manual Activation

```powershell
# Activate environment
.\scripts\venv\Scripts\Activate.ps1

# Run any script
python .\scripts\train-isolation-forest.py --mode full --use-synthetic
python .\scripts\train-autoencoder.py --mode full --use-synthetic
python .\scripts\train-convlstm.py --mode full --use-synthetic

# Deactivate when done
deactivate
```

## Common Commands

```powershell
# Just prepare data
.\scripts\run-training.ps1 -Script isolation-forest -Mode fetch-data -UseSynthetic

# Just train (data already prepared)
.\scripts\run-training.ps1 -Script autoencoder -Mode train

# Deploy to Vertex AI (production)
.\scripts\run-training.ps1 -Script convlstm -Mode deploy

# Fetch 60 days of real GCP data
.\scripts\run-training.ps1 -Script isolation-forest -Mode full -DaysBack 60
```

## Check Results

```powershell
# View trained models
ls .\models\isolation-forest\
ls .\models\autoencoder\
ls .\models\convlstm\

# View training logs
cat .\scripts\train-isolation-forest.log
cat .\scripts\train-autoencoder.log
cat .\scripts\train-convlstm.log

# Launch TensorBoard
.\scripts\venv\Scripts\Activate.ps1
tensorboard --logdir=models/autoencoder/logs
# Open http://localhost:6006
```

## Troubleshooting

| Problem                                     | Solution                                             |
| ------------------------------------------- | ---------------------------------------------------- |
| `Import "tensorflow" could not be resolved` | Activate venv: `.\scripts\venv\Scripts\Activate.ps1` |
| `Virtual environment not found`             | Run setup: `.\scripts\setup-python-env.ps1`          |
| `GCP authentication error`                  | Run: `gcloud auth application-default login`         |
| Out of memory during training               | Edit script: reduce `BATCH_SIZE` to 8 or 4           |
| Script fails on first run                   | Normal! Re-run after dependencies install            |

## File Locations

```
scripts/
├── venv/                          # Virtual environment (git-ignored)
├── setup-python-env.ps1           # Setup automation
├── run-training.ps1               # Quick launcher
├── train-isolation-forest.py      # L2 anomaly detection
├── train-autoencoder.py           # L3 visual anomaly
├── train-convlstm.py              # Crowd prediction
├── requirements.txt               # Python dependencies
├── PYTHON_ML_README.md            # Full documentation
└── FIXES_SUMMARY.md               # What was fixed

models/                            # Output models (git-ignored)
├── isolation-forest/
│   ├── isolation_forest.joblib
│   ├── scaler.joblib
│   └── metadata.json
├── autoencoder/
│   ├── autoencoder_final.h5
│   ├── autoencoder_best.h5
│   └── threshold.txt
└── convlstm/
    ├── convlstm_final.h5
    └── convlstm_best.h5

data/                              # Training data (git-ignored)
├── isolation-forest/
├── autoencoder/
└── convlstm/
```

## Integration with Main Project

After training, update `.env` in project root:

```env
# For Isolation Forest (local file)
GCS_ISOLATION_FOREST_MODEL_PATH=models/isolation-forest/isolation_forest.joblib

# For Autoencoder & ConvLSTM (Vertex AI endpoints)
VERTEX_AI_AUTOENCODER_ENDPOINT=projects/.../endpoints/...
VERTEX_AI_CONVLSTM_ENDPOINT=projects/.../endpoints/...

# GCP Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCP_REGION=us-central1
```

Then restart your Node.js backend:

```powershell
pnpm run dev
```

## Need Help?

- 📖 Read full docs: `.\scripts\PYTHON_ML_README.md`
- 🔍 Check fixes: `.\scripts\FIXES_SUMMARY.md`
- 🐛 View logs: `.\scripts\train-*.log`
- 💬 Create issue: https://github.com/Coder-God2901/Eventsphere/issues

---

**Last Updated:** November 29, 2025
