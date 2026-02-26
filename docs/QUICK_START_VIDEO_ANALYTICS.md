# Quick Start Guide - Video Analytics & ML Training

## 🚀 Accessing the New Features

### Video Surveillance Dashboard

**URL:** `/video-surveillance`

**Required Roles:** ADMIN, SECURITY, or ORGANIZER

**What You'll See:**

- 6 live camera feeds in a grid layout
- Real-time people counting and crowd density
- VIP and security personnel tracking
- Weapon detection alerts
- Anomaly detection display
- Feature toggles for YOLO, Face Recognition, Object Detection

### ML Training Dashboard

**URL:** `/ml-training`

**Required Roles:** ADMIN or ORGANIZER

**What You'll See:**

- Training configuration panel
- Live training progress tracking
- Training jobs queue
- Deployed models metrics
- Dataset statistics (127K frames, 24 events)

## 🎯 Navigation

Both features are now in the sidebar under **"Advanced Features"**:

```
📂 Advanced Features
  ├── 📦 Digital Twin
  ├── ⏰ Scheduling
  ├── 🛣️ Routing
  ├── 📹 Video Surveillance  ← NEW
  └── 🧠 ML Training         ← NEW
```

## ⚙️ Current Status

### ✅ Working Right Now (No Additional Setup)

- Video Surveillance Dashboard UI
- ML Training Dashboard UI
- Object Detection (OpenCV-based)
- Amazon Athena Analytics
- Camera grid layout
- Feature toggles
- Real-time status indicators

### ⏳ Requires TensorFlow.js Installation

- YOLO people detection
- Facial recognition (VIP/Security)
- Custom ML model training

## 🔧 Optional: Enable Full ML Features

### 1. Install TensorFlow.js

```powershell
pnpm add @tensorflow/tfjs-node
```

### 2. Download Models

```powershell
# Create models directory
New-Item -ItemType Directory -Force -Path server/models

# Download YOLO v8 and FaceNet models
# (Refer to ADVANCED_VIDEO_ANALYTICS_COMPLETE.md for details)
```

### 3. Restart the server

```powershell
pnpm run dev
```

## 📝 Testing Checklist

- [ ] Navigate to `/video-surveillance` in browser
- [ ] Verify 6 camera feeds are displayed
- [ ] Check analytics summary bar shows metrics
- [ ] Toggle YOLO Detection ON/OFF
- [ ] Toggle Facial Recognition ON/OFF
- [ ] Toggle Object Detection ON/OFF
- [ ] Navigate to `/ml-training`
- [ ] Verify training configuration panel loads
- [ ] Check deployed models section displays
- [ ] Verify dataset statistics show 127,843 frames
- [ ] Test model type selection dropdown
- [ ] Verify navigation sidebar shows both new items

## 🎨 Key Features to Explore

### Video Surveillance

1. **Camera Grid:** Click on any camera to select it
2. **Analytics Overlay:** Hover over cameras to see detailed stats
3. **Feature Toggles:** Use left sidebar to enable/disable detection
4. **Crowd Density:** Color-coded bars (GREEN → YELLOW → ORANGE → RED)
5. **Alerts:** Red badges show active alerts per camera
6. **Recording:** Start/stop recording with controls

### ML Training

1. **Model Selection:** Choose Crowd Density, Anomaly Detection, or Transfer Learning
2. **Hyperparameters:** Adjust learning rate, batch size, epochs
3. **Training Jobs:** View queue of active and completed training jobs
4. **Model Metrics:** See accuracy, precision, recall, F1 scores
5. **Export Models:** Download trained models for deployment

## 🔒 Authentication

Make sure you're logged in with appropriate role:

- **Video Surveillance:** Requires ADMIN, SECURITY, or ORGANIZER
- **ML Training:** Requires ADMIN or ORGANIZER

If you see "Access Denied", check your user role in the profile settings.

## 💡 Tips

1. **Performance:** Object detection works immediately (OpenCV-based, no TensorFlow needed)
2. **Graceful Degradation:** YOLO and Face Recognition show empty results until TensorFlow is installed
3. **Real-time Updates:** Analytics update in real-time via Socket.IO
4. **Mobile Friendly:** Dashboards are responsive and work on tablets/phones
5. **Dark Mode:** UI respects system dark/light mode preference

## 🆘 Troubleshooting

**Q: I see "No cameras available"**

- A: This is expected - configure RTSP streams in `server/services/video-analytics.service.ts`

**Q: YOLO/Face Recognition show no results**

- A: Install TensorFlow.js and download models (see Optional Setup above)

**Q: Access Denied error**

- A: Check your user role - must be ADMIN, SECURITY, or ORGANIZER for Video Surveillance

**Q: ML Training shows mock data**

- A: Install TensorFlow.js for real training capabilities

**Q: Navigation items don't appear**

- A: Clear browser cache and reload

## 📚 Documentation

- **Full Documentation:** `ADVANCED_VIDEO_ANALYTICS_COMPLETE.md`
- **Architecture Diagram:** See ADVANCED_VIDEO_ANALYTICS_COMPLETE.md
- **API Reference:** Check service files in `server/services/`
- **Component Details:** See `src/components/features/`

---

**Ready to explore? Navigate to `/video-surveillance` or `/ml-training` now! 🎉**
