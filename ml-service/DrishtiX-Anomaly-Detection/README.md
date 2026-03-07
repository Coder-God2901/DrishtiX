# 👁️ DrishtiX: Dual-Engine Anomaly Detection & AI Command Center

This repository houses the core "nervous system" of DrishtiX. It processes live, high-velocity crowd sensor data, visually verifies threats using computer vision, and generates real-time tactical action plans for security teams.

## ⚡ Quick Start

### Automated Setup (Recommended)
```powershell
# Run the setup script
.\setup.ps1
```

### Manual Setup
```powershell
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
pip install git+https://github.com/openai/CLIP.git
```

📖 **For detailed setup instructions, see [SETUP.md](SETUP.md)**

## 🏗️ The 3-Tier Enterprise Architecture

Most hackathon projects fail because they try to run heavy Vision AI on every single frame of a 60-FPS camera feed. DrishtiX uses a highly optimized, decoupled microservice architecture:

### Tier 1: The Lightning Stream Engine (Watchdog & Forecaster)
* **What it does:** Consumes thousands of IoT sensor pings (mobile location data, gate counts) per second via Redis.
* **The AI:** Runs an **Isolation Forest** (to catch sudden statistical density spikes) and a **Random Forest** (to calculate physical crush risks) simultaneously.
* **Cost Efficiency:** Extremely lightweight. It only triggers the heavy models when a mathematical anomaly is detected.

### Tier 2: The Vision Detective (OpenAI CLIP)
* **What it does:** When Tier 1 flags a threat, it pings the Vision API.
* **The AI:** A zero-shot **OpenAI CLIP model** instantly grabs the live camera feed of the affected zone and classifies the scene (e.g., "Fighting/Violence", "Fire", "Normal"). 
* **Zero-Shot Advantage:** No custom model retraining required to add new threat categories.

### Tier 3: The Command Center (LLM Triage)
* **What it does:** Synthesizes the raw math from Tier 1 and the visual context from Tier 2.
* **The AI:** Uses a local **Llama 3.2** instance to generate a 2-sentence, highly actionable response plan for the security guards on the ground.

## 🚀 How to Run the Full Simulation

The system is decoupled, requiring three separate terminal processes to simulate a live event:

### Prerequisites
1. **Redis Server** must be running:
   ```powershell
   # Check if Redis is running
   redis-cli ping
   ```
   
2. **Ollama** (optional, for LLM integration):
   ```powershell
   ollama run llama3.2
   ```

### Terminal 1: Start the Vision API (Tier 2)
```powershell
python .\vision_api\app.py
```
The Flask API will start on `http://localhost:5000`. This handles violence/threat detection using CLIP.

### Terminal 2: Start the Producer (Data Simulator)
```powershell
python .\stream_engine\producer.py
```
This simulates IoT sensors sending crowd data to Redis streams.

### Terminal 3: Start the Stream Engine (Tier 1)
```powershell
python .\stream_engine\main.py
```
This consumes the stream, runs anomaly detection, and coordinates with the Vision API when threats are detected.

## � Frontend/Backend Integration

The stream engine automatically sends AI-generated alerts to your frontend/backend application:

### Integration Methods

**Method 1: Redis Pub/Sub (Real-time Broadcast)**
```python
# Broadcasts to all subscribers listening on 'drishtix_alerts' channel
r.publish("drishtix_alerts", json.dumps(final_alert_payload))
```
✅ Best for real-time dashboards with multiple listeners  
✅ WebSocket-ready for live updates

**Method 2: Direct HTTP POST (Default)**
```python
# Sends directly to your Node.js/Express backend
requests.post("http://localhost:3000/api/receive-alert", json=final_alert_payload)
```
✅ Direct backend integration  
✅ Easy REST API consumption

### Alert Payload Example
```json
{
  "timestamp": "2026-03-07T10:30:45",
  "zone_id": "Zone_A",
  "trigger_reason": "Statistical Density Spike (IF) + Physics Crush Risk [HIGH DANGER] (RF)",
  "vision_verification": "Visual Verification: Fighting/Violence detected",
  "ai_action_plan": "Immediate dispatch of security team to Zone A. Establish crowd control barriers.",
  "raw_sensor_data": {
    "crowd_density": 8.5,
    "crowd_count": 850,
    "zone_id": "Zone_A"
  }
}
```

**To switch methods:** Edit lines 133-138 in `stream_engine/main.py`

## �📁 Project Structure

```
DrishtiX-Anomaly-Detection/
├── vision_api/              # Tier 2: Vision Detection Service
│   ├── app.py              # Flask API server
│   ├── model.py            # CLIP-based detection model
│   ├── utils.py            # Utility functions
│   ├── settings.yaml       # Model configuration & threat labels
│   └── requirements.txt    # Vision-specific dependencies
│
├── stream_engine/          # Tier 1: Real-time Stream Processing
│   ├── main.py            # Main consumer & anomaly detector
│   ├── producer.py        # Simulates IoT sensor data
│   └── predict.py         # ML prediction logic (Random Forest)
│
├── requirements.txt        # All project dependencies
├── SETUP.md               # Detailed setup guide
├── setup.ps1              # Automated setup script (PowerShell)
└── setup.bat              # Automated setup script (Batch)
```

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Stream Processing** | Redis Streams | High-velocity data ingestion |
| **Anomaly Detection** | Scikit-learn (Isolation Forest) | Statistical anomaly detection |
| **Crowd Risk** | Random Forest Classifier | Predict crush risk based on density |
| **Vision AI** | OpenAI CLIP | Zero-shot threat classification |
| **Web Framework** | Flask | REST API for vision service |
| **LLM Integration** | Llama 3.2 (Ollama) | Tactical response generation |
| **Deep Learning** | PyTorch | CLIP model backend |
| **Alert Distribution** | Redis Pub/Sub or HTTP POST | Real-time alert delivery to frontend/backend |

## 🎯 Key Features

✅ **Real-time Processing**: Handles thousands of sensor pings per second  
✅ **Dual Detection**: Combines statistical and visual anomaly detection  
✅ **Zero-shot Learning**: Add new threat categories without retraining  
✅ **Cost Efficient**: Only triggers heavy models when anomalies detected  
✅ **Microservice Architecture**: Decoupled, scalable components  
✅ **Local LLM**: No API costs for tactical plan generation  
✅ **Flexible Integration**: Redis Pub/Sub or REST API for frontend/backend  

## 🔧 Configuration

### Vision API Settings
Edit `vision_api/settings.yaml` to customize:
- Threat labels and categories
- Model parameters (device: CPU/GPU)
- Detection threshold
- Default labels

### Stream Engine
Modify Redis connection settings in:
- `stream_engine/producer.py` (line 10)
- `stream_engine/main.py` (line 12)

## 📊 Detection Categories

The Vision API can detect:
- **Fighting/Violence**: Street fights, office violence
- **Fire**: Indoor/outdoor fires
- **Car Crash**: Traffic accidents
- **Crowd Crush**: Overcrowding detection
- **Normal**: Safe scenarios

Add custom categories in `vision_api/settings.yaml` without retraining!

## 🐛 Troubleshooting

### Common Issues

1. **"No module named 'clip'"**
   ```powershell
   pip install git+https://github.com/openai/CLIP.git
   ```

2. **Redis Connection Error**
   - Ensure Redis is running: `redis-cli ping`
   - Check connection settings in code

3. **Path Length Issues (Windows)**
   - Enable long paths or move project to shorter path (see [SETUP.md](SETUP.md))

4. **CUDA/GPU Errors**
   - Edit `vision_api/settings.yaml` and set `device: 'cpu'`

## 📝 License

This project is part of the DrishtiX crowd safety platform.

## 🤝 Contributing

Contributions are welcome! Please ensure all tests pass and follow the existing code structure.

---

**Built with ❤️ for safer crowd management**