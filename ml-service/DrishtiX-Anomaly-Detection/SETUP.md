# Setup Instructions for DrishtiX-Anomaly-Detection

## Prerequisites
- Python 3.9 or higher
- Redis server (for stream processing)
- Git (for installing CLIP)

## Installation Steps

### 1. Create Virtual Environment
```powershell
python -m venv .venv
```

### 2. Activate Virtual Environment
```powershell
.venv\Scripts\Activate.ps1
```

### 3. Upgrade pip
```powershell
python -m pip install --upgrade pip
```

### 4. Install Core Dependencies
```powershell
pip install -r requirements.txt
```

### 5. Install OpenAI CLIP
```powershell
pip install git+https://github.com/openai/CLIP.git
```

**Note:** If you encounter git issues, first install git dependencies:
```powershell
pip install ftfy regex tqdm
pip install git+https://github.com/openai/CLIP.git
```

## Troubleshooting

### Windows Path Length Issues
If you encounter path length errors during installation:
1. Enable long paths in Windows (run PowerShell as Administrator):
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```
2. Restart your terminal
3. Or move project to shorter path like `C:\DrishtiX\`

### Redis Connection Issues
Make sure Redis is running before starting the application:
```powershell
# Check if Redis is running
redis-cli ping
```

## Running the Applications

### Vision API (Flask)
```powershell
python .\vision_api\app.py
```

### Stream Engine
```powershell
# Producer (generates sample data)
python .\stream_engine\producer.py

# Main processor (anomaly detection)
python .\stream_engine\main.py
```

## Integration with Frontend/Backend

The stream engine (`stream_engine/main.py`) sends AI recommendations and alert data to your frontend/backend using one of two methods:

### Method 1: Redis Pub/Sub (Broadcast to Multiple Listeners)
```python
# Broadcast this JSON to anyone listening (like your Node.js server)
r.publish("drishtix_alerts", json.dumps(final_alert_payload))
```
Use this for real-time dashboards or multiple subscribers.

### Method 2: Direct HTTP POST (Node.js/Express Backend)
```python
# Send the alert directly to your Node.js Express server
requests.post("http://localhost:3000/api/receive-alert", json=final_alert_payload)
```
Use this for direct backend integration.

### Alert Payload Structure
```json
{
  "timestamp": "2026-03-07T10:30:45",
  "zone_id": "Zone_A",
  "trigger_reason": "Statistical Density Spike (IF) + Physics Crush Risk [HIGH DANGER] (RF)",
  "vision_verification": "Visual Verification: Fighting/Violence detected",
  "ai_action_plan": "Immediate dispatch of security team to Zone A. Establish crowd control barriers and redirect foot traffic to alternate exits.",
  "raw_sensor_data": {
    "crowd_density": 8.5,
    "crowd_count": 850,
    "zone_id": "Zone_A"
  }
}
```

**Note:** By default, Method 2 (HTTP POST) is enabled. To switch to Redis Pub/Sub, uncomment line 133 and comment line 138 in `stream_engine/main.py`.

## Project Structure
```
DrishtiX-Anomaly-Detection/
├── vision_api/          # Flask-based violence detection API
│   ├── app.py          # Main Flask application
│   ├── model.py        # CLIP-based detection model
│   └── settings.yaml   # Model configuration
├── stream_engine/       # Real-time stream processing
│   ├── main.py         # Anomaly detection consumer
│   ├── producer.py     # Data generator
│   └── predict.py      # ML prediction logic
└── requirements.txt     # Python dependencies
```
