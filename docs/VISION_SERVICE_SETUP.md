# YOLO Vision Service - Quick Setup Guide

## 🚀 5-Minute Setup

### Prerequisites

- Docker installed
- Python 3.10+ (for local development)
- 4GB RAM minimum
- 10GB disk space (for YOLOv8 models)

---

## Setup Options

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (ML + Vision + Backend)
docker-compose up -d --build

# Check vision service health
curl http://localhost:8001/health

# View logs
docker logs vision-service -f
```

### Option 2: Standalone Docker Container

```bash
# Build vision service
cd vision-service
docker build -t vision-service .

# Run container
docker run -d \
  -p 8001:8001 \
  --name vision-service \
  vision-service

# Test endpoint
curl http://localhost:8001/health
```

### Option 3: Local Development (Python)

```bash
cd vision-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
python app.py
```

---

## ✅ Verification

### 1. Health Check

```bash
curl http://localhost:8001/health
```

**Expected Output**:

```json
{
  "status": "healthy",
  "service": "YOLO Vision Service",
  "models_loaded": {
    "yolo": true,
    "opencv": true
  },
  "replaces": "Gemini Vision API (FREE vs $50-200/month)"
}
```

### 2. Test Fire Detection

```bash
# Encode test image to base64
base64_image=$(base64 -w 0 test_fire.jpg)

# Send detection request
curl -X POST http://localhost:8001/api/detect-anomalies \
  -H "Content-Type: application/json" \
  -d "{
    \"event_id\": \"test_fire\",
    \"image_data\": \"$base64_image\"
  }"
```

### 3. Backend Integration Test

```bash
# Test anomaly detection route (requires authentication)
curl -X POST http://localhost:3001/api/anomalies/detect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "evt_123",
    "imageData": "BASE64_IMAGE_DATA"
  }'
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```bash
# Vision Service URL (Docker)
VISION_SERVICE_URL=http://vision-service:8001

# Vision Service URL (Local development)
# VISION_SERVICE_URL=http://localhost:8001

# Model path (optional)
MODEL_PATH=/app/models
```

### Backend Configuration

Update `server/.env`:

```bash
# Add vision service endpoint
VISION_SERVICE_URL=http://vision-service:8001
```

---

## 🧪 Test Scenarios

### Fire Detection

```typescript
const response = await yoloVisionService.detectAnomalies({
  eventId: 'test-fire',
  imageData: fireImageBase64,
});

console.log(response.anomalies); // [{ type: 'FIRE', confidence: 0.85, ... }]
```

### Panic Detection (Multi-frame)

```typescript
const response = await yoloVisionService.detectAnomalies({
  eventId: 'test-panic',
  imageData: currentFrameBase64,
  videoFrames: [frame1, frame2, frame3], // Previous frames for temporal analysis
});

console.log(response.detectionMetrics.panicLevel); // 0.7 (70% panic)
```

### Violence Detection

```typescript
const response = await yoloVisionService.detectAnomalies({
  eventId: 'test-violence',
  imageData: sceneImageBase64,
  videoFrames: previousFrames,
});

console.log(response.anomalies.filter((a) => a.type === 'VIOLENCE'));
```

---

## 🐛 Troubleshooting

### Service Not Starting

```bash
# Check Docker logs
docker logs vision-service

# Check Python errors
docker exec -it vision-service python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### Model Download Issues

```bash
# Manually download YOLOv8 models
docker exec -it vision-service sh
cd /app/models
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n-pose.pt
```

### OpenCV Import Errors

```bash
# Install OpenCV system dependencies (if running locally)
# Ubuntu/Debian
sudo apt-get install -y libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 libgl1-mesa-glx

# macOS
brew install opencv

# Windows (use Docker instead)
```

### High CPU Usage

```bash
# Check if YOLO is using CPU instead of GPU
docker exec -it vision-service python -c "import torch; print(torch.cuda.is_available())"

# Enable GPU support (requires NVIDIA GPU + nvidia-docker)
# Uncomment in docker-compose.yml:
# deploy:
#   resources:
#     reservations:
#       devices:
#         - driver: nvidia
#           count: 1
#           capabilities: [gpu]
```

---

## 📊 Performance Tips

### 1. Use GPU Acceleration

```yaml
# docker-compose.yml
vision-service:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

### 2. Optimize YOLOv8 Model Size

```python
# app.py - Change from nano to small for better accuracy (slower)
yolo_model = YOLO('yolov8s.pt')  # Small (22MB)
# yolo_model = YOLO('yolov8n.pt')  # Nano (6MB) - Current

# Or larger for highest accuracy (slowest)
# yolo_model = YOLO('yolov8m.pt')  # Medium (50MB)
```

### 3. Batch Processing

```typescript
// Process multiple frames in parallel
const results = await Promise.all(
  frames.map((frame) =>
    yoloVisionService.detectAnomalies({
      eventId,
      imageData: frame,
    })
  )
);
```

---

## 🔄 Migration from Gemini Vision

### Before (Gemini Vision)

```typescript
import { geminiVisionService } from './gemini-vision.service';

const result = await geminiVisionService.detectAnomalies({
  eventId,
  timestamp: new Date(),
  imageData,
});
```

### After (YOLO Vision)

```typescript
import { yoloVisionService } from './yolo-vision.service';

const result = await yoloVisionService.detectAnomalies({
  eventId,
  imageData,
});
```

**Changes**:

- Import changed: `geminiVisionService` → `yoloVisionService`
- Removed `timestamp` parameter (auto-generated)
- Same response structure (drop-in replacement)

---

## 📈 Cost Comparison

| Metric         | Gemini Vision     | YOLO Vision   | Savings           |
| -------------- | ----------------- | ------------- | ----------------- |
| API Costs      | $50-200/month     | $0            | $50-200/month     |
| Infrastructure | $0                | $10/month     | -$10/month        |
| **Total**      | **$50-200/month** | **$10/month** | **$40-190/month** |
| **Savings**    | -                 | -             | **80-95%**        |

---

## ✅ Quick Checklist

- [ ] Docker installed and running
- [ ] `docker-compose up -d --build` executed
- [ ] Health check passed: `curl http://localhost:8001/health`
- [ ] Backend .env updated with `VISION_SERVICE_URL`
- [ ] Test fire detection working
- [ ] Test panic detection working
- [ ] Integration test passed

---

## 📞 Next Steps

1. **Test with real footage**: Upload CCTV/drone videos
2. **Fine-tune detection thresholds**: Adjust confidence levels in `app.py`
3. **Train custom models**: Use event-specific datasets
4. **Enable GPU acceleration**: For production workloads
5. **Monitor performance**: Track latency and accuracy metrics

---

**Setup Time**: ~5 minutes  
**Cost Savings**: $50-200/month → $0  
**Status**: ✅ Ready for production
