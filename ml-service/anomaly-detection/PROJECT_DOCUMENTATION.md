# Violence Detection System - Project Documentation

## Project Overview

The Violence Detection System is an AI-powered web application that automatically detects incidents and anomalies in video footage and real-time camera feeds. The system can identify various scenarios including fights, fires, car crashes, and other violent or dangerous situations, making it useful for security monitoring, public safety applications, and automated surveillance systems.

## Key Features

### 1. Real-time Camera Detection
- Live camera feed processing with instant incident detection
- Frame-by-frame analysis with minimal latency
- Visual feedback with color-coded labels (red for incidents, green for normal scenes)
- Start/Stop controls for easy operation

### 2. Video Upload & Processing
- Support for multiple video formats (MP4, AVI, MOV)
- Drag-and-drop file upload interface
- Real-time progress tracking with Server-Sent Events (SSE)
- Frame-by-frame detection analysis
- Downloadable processed videos with detection overlays

### 3. Incident Detection Categories

**Critical Incidents (Flagged as Alerts):**
- Fight on street
- Street violence
- Violence in office
- Fire on street
- Fire in office
- Car crash

**Normal Scenarios (Non-alerts):**
- People walking on street
- Buildings
- Roads and cars
- Office environments
- People talking
- Normal office activities

## Technologies Used

### Backend Technologies

#### 1. **Flask (v3.1.2)**
- Lightweight Python web framework
- Handles HTTP requests and routing
- Manages video uploads and processing
- Provides RESTful API endpoints

#### 2. **OpenAI CLIP Model**
- Vision-Language model (ViT-B/32 architecture)
- Zero-shot image classification capabilities
- Matches visual content with text descriptions
- Enables flexible detection without retraining

#### 3. **OpenCV (cv2)**
- Video capture and frame extraction
- Real-time camera feed processing
- Video encoding/decoding
- Frame manipulation and annotation

#### 4. **PyTorch**
- Deep learning framework
- Runs CLIP model inference
- GPU acceleration support (CPU fallback available)

#### 5. **Python Threading**
- Background video processing
- Non-blocking operations
- Concurrent request handling

### Frontend Technologies

#### 1. **HTML5**
- Modern semantic markup
- Video element for playback
- File input with drag-and-drop API

#### 2. **CSS3**
- Gradient backgrounds and animations
- Responsive grid layouts
- Smooth transitions and hover effects
- Mobile-friendly design

#### 3. **JavaScript (Vanilla)**
- Asynchronous API calls with Fetch API
- EventSource for Server-Sent Events
- DOM manipulation for dynamic updates
- File handling and validation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Camera Feed  │  │ Video Upload │  │   Results    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────┬────────────────┬──────────────┬───────────────┘
             │                │              │
             │ HTTP/SSE       │              │
             ▼                ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Flask Server                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes: /, /upload_video, /start_camera,            │  │
│  │          /stop_camera, /progress, /video_feed        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬────────────────┬──────────────┬───────────────┘
             │                │              │
             ▼                ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Processing Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Model      │  │   OpenCV     │  │  Threading   │     │
│  │   Loader     │  │   Video I/O  │  │  Manager     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────┬────────────────┬──────────────────────────────┘
             │                │
             ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                     AI Model Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           OpenAI CLIP (ViT-B/32)                     │  │
│  │  - Image Encoder: Vision Transformer                 │  │
│  │  - Text Encoder: Transformer                         │  │
│  │  - Cosine Similarity Matching                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

### Detection Pipeline

#### 1. **Model Initialization**
```python
- Load CLIP model (ViT-B/32) into memory
- Prepare text embeddings for all detection labels
- Text format: "a photo of [scenario]" (enhances accuracy)
- Labels stored in settings.yaml for easy customization
```

#### 2. **Camera Detection Flow**
```
User clicks "Start Camera"
    ↓
Flask opens webcam (cv2.VideoCapture)
    ↓
For each frame:
    - Convert BGR → RGB
    - Preprocess image (resize, normalize)
    - Encode image with CLIP Vision Transformer
    - Calculate cosine similarity with text embeddings
    - Get highest confidence label
    - Draw label overlay on frame
    - Stream frame to browser
```

#### 3. **Video Upload Flow**
```
User uploads video file
    ↓
Flask saves to uploads/ folder
    ↓
Background thread starts:
    - Extract video metadata (fps, resolution, frame count)
    - Create VideoWriter for output
    - For each frame:
        * Run CLIP detection
        * Draw detection label
        * Write to output video
        * Update progress status
    - Save processed video to outputs/
    ↓
Server-Sent Events stream progress to browser
    ↓
Display results with statistics and timeline
```

#### 4. **CLIP Detection Algorithm**

**Step 1: Image Processing**
- Input: Raw frame (BGR format)
- Convert to RGB color space
- Resize to 224x224 pixels
- Normalize pixel values
- Convert to tensor format

**Step 2: Feature Extraction**
- Image Encoding: Vision Transformer extracts visual features (512-dim vector)
- Text Encoding: Pre-computed embeddings for all labels (512-dim vectors)

**Step 3: Similarity Matching**
```
similarity = (image_features @ text_features.T)
confidence = max(similarity)
predicted_label = labels[argmax(similarity)]
```

**Step 4: Threshold Filtering**
- If confidence ≥ 0.23: Return matched label
- If confidence < 0.23: Return "Unknown"

### Configuration

The system uses `settings.yaml` for flexible configuration:

```yaml
model-settings:
  prediction-threshold: 0.23
  model-name: 'ViT-B/32'
  device: 'cpu'  # or 'cuda' for GPU

label-settings:
  labels:
    - 'people walking on a street'
    - 'fight on a street'
    - 'fire on a street'
    # ... more labels
  default-label: 'Unknown'
```

## File Structure

```
violence-detection/
├── flask_app.py                 # Main Flask application
├── model.py                     # CLIP model wrapper
├── settings.yaml                # Configuration file
├── requirements.txt             # Python dependencies
├── templates/
│   └── violence_index.html      # Web interface
├── uploads/                     # Temporary video uploads
├── outputs/                     # Processed videos
├── data/                        # Test images
└── results/                     # Sample outputs
```

## Key Components Explained

### 1. Flask Application (flask_app.py)

**Main Functions:**
- `load_model()`: Pre-loads CLIP model before server starts
- `upload_video()`: Handles file uploads, starts processing thread
- `process_video_background()`: Frame-by-frame video analysis
- `generate_camera_frames()`: Real-time camera stream generator
- `progress()`: SSE endpoint for progress updates

### 2. Model Class (model.py)

**Core Methods:**
- `__init__()`: Load CLIP, prepare text embeddings
- `predict()`: Main detection function
- `transform_image()`: Image preprocessing pipeline
- `vectorize_text()`: Text embedding generation

### 3. Web Interface (violence_index.html)

**Features:**
- Mode selection screen
- Camera controls with live feed
- Drag-and-drop video upload
- Real-time progress bar with SSE
- Results display with statistics
- Detection timeline viewer

## Performance Characteristics

### Processing Speed
- **Camera Mode**: ~8-10 FPS on CPU
- **Video Processing**: ~1-2 seconds per frame (CPU)
- **Model Loading**: ~5-10 seconds (downloads ~338MB on first run)

### Resource Usage
- **Memory**: ~2-3 GB with model loaded
- **CPU**: Single-threaded inference
- **Storage**: ~338MB for CLIP model + uploaded videos

### Accuracy
- **Zero-shot Learning**: No training required for new scenarios
- **Threshold**: 0.23 (cosine similarity)
- **Flexibility**: Add new labels without retraining

## Advantages of CLIP-based Approach

1. **Zero-shot Detection**: Detect new scenarios by adding text labels
2. **No Training Required**: Pre-trained on 400M image-text pairs
3. **Flexible Categories**: Easy to modify detection scenarios
4. **Natural Language**: Uses descriptive text instead of class IDs
5. **Robust**: Generalizes well to diverse visual content

## Use Cases

1. **Security Surveillance**: Automatic incident detection in CCTV feeds
2. **Public Safety**: Monitor crowded areas for fights or accidents
3. **Fire Detection**: Early warning system for fire incidents
4. **Traffic Monitoring**: Detect car crashes and traffic violations
5. **Workplace Safety**: Monitor for violence or hazards in offices

## Deployment Considerations

### Development Server
```bash
python flask_app.py
# Runs on http://127.0.0.1:5001
```

### Production Deployment
For production use, deploy with:
- **Gunicorn** or **uWSGI** (WSGI server)
- **Nginx** (reverse proxy)
- **GPU support** for faster inference
- **Redis** for progress tracking across multiple workers

## Future Enhancements

1. **GPU Acceleration**: Add CUDA support for faster processing
2. **Batch Processing**: Process multiple videos simultaneously
3. **Alert System**: Email/SMS notifications for detected incidents
4. **Database Integration**: Store detection history and analytics
5. **Advanced Filtering**: Confidence threshold adjustment per label
6. **Multi-camera Support**: Monitor multiple camera feeds
7. **Amazon S3**: Save processed videos to AWS S3 or Amazon S3
8. **API Mode**: RESTful API for integration with other systems

## Conclusion

The Violence Detection System demonstrates the power of modern AI vision-language models for practical security applications. By leveraging CLIP's zero-shot learning capabilities, the system provides flexible, accurate incident detection without requiring extensive training data or model fine-tuning. The web-based interface makes it accessible for both technical and non-technical users, while the modular architecture allows for easy customization and deployment in various environments.

---

**Project Status**: Production-ready for development environments  
**License**: [Specify license]  
**Last Updated**: December 10, 2025
