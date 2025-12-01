# Google Maps, Earth Engine & Pub/Sub - Complete Setup Guide

## 📋 Overview

This guide provides end-to-end setup instructions for three critical GCP services in DrishtiX:

1. **Google Maps Platform** - Navigation, routing, and venue mapping
2. **Google Earth Engine** - Satellite imagery and synthetic crowd data
3. **Google Pub/Sub** - Real-time event streaming pipeline

---

## 🗺️ Part 1: Google Maps Platform Setup

### Purpose

- **Maps SDK**: Display venue maps with crowd density overlays
- **Routes API**: Calculate optimal safe routes avoiding congested areas
- **Places API**: Identify gates, amenities, and POIs within venues

### Step 1: Enable Google Maps APIs

```bash
# Enable required Google Maps APIs
gcloud services enable \
  maps-backend.googleapis.com \
  routes.googleapis.com \
  places-backend.googleapis.com \
  geocoding-backend.googleapis.com \
  directions-backend.googleapis.com
```

### Step 2: Create API Key for Maps

```bash
# Create API key for Google Maps
gcloud alpha services api-keys create \
  --display-name="DrishtiX Maps API Key" \
  --api-target=service=maps-backend.googleapis.com \
  --api-target=service=routes.googleapis.com \
  --api-target=service=places-backend.googleapis.com

# Get the API key (copy the value)
gcloud alpha services api-keys list --filter="displayName:DrishtiX Maps"
```

**Alternative: Create via Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
2. Click **Create Credentials** → **API Key**
3. Name it "DrishtiX Maps API Key"
4. **Restrict the API key**:
   - Application restrictions: HTTP referrers (websites)
   - Add: `http://localhost:5173/*`, `https://yourdomain.com/*`
   - API restrictions: Select these APIs:
     - Maps JavaScript API
     - Directions API
     - Routes API
     - Places API
     - Geocoding API

### Step 3: Configure Environment Variables

Add to `.env` and `.env.example`:

```env
# ================================
# GOOGLE MAPS PLATFORM
# ================================
# Get API keys from: https://console.cloud.google.com/google/maps-apis
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_MAPS_ROUTES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_MAPS_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional: If you want separate keys for different APIs
# Otherwise, use the same key for all (simpler)
```

### Step 4: Verify Integration

#### Backend Integration Check

```bash
# Test Google Maps service
cd server
node -e "
const { googleMapsService } = require('./services/google-maps.service.ts');
googleMapsService.calculateSafeRoute({
  origin: { lat: 18.5204, lng: 73.8567 },
  destination: { lat: 18.5210, lng: 73.8575 }
}).then(console.log).catch(console.error);
"
```

#### Frontend Integration Check

1. Navigate to `http://localhost:5173/organizer/events/new`
2. Look for the **Venue Mapping** section
3. Verify Google Maps loads correctly
4. Try drawing a venue boundary polygon
5. Check browser console for errors

### Step 5: Current Integration Status

✅ **Fully Integrated**:

- Backend: `server/services/google-maps.service.ts` (572 lines)
  - Safe route calculation with crowd avoidance
  - Gate recommendations based on wait times
  - Places API integration for POI discovery
  - Traffic-aware routing with ETA
- Frontend: `src/components/features/venue-mapping.tsx`
  - Google Maps with Drawing Manager
  - Real-time boundary validation
  - Multi-zone creation with metadata
- Emergency Dispatch: `src/services/emergency-dispatch.service.ts`
  - Traffic-aware routing for responders
  - Dynamic rerouting based on incidents

✅ **Active UI Components**:

- Venue boundary mapping with Google Maps
- Attendee navigation with safe routing
- Gate recommendation system

---

## 🌍 Part 2: Google Earth Engine Setup

### Purpose

- **Hardware-free mode**: Run system without drones/CCTV
- **Satellite imagery**: Venue map tiles and terrain data
- **Synthetic training data**: Generate crowd patterns for ML training

### Step 1: Enable Earth Engine API

```bash
# Enable Earth Engine API
gcloud services enable earthengine.googleapis.com
```

### Step 2: Register for Earth Engine Access

1. Go to [Google Earth Engine signup](https://signup.earthengine.google.com/)
2. Register with your GCP project email
3. Wait for approval (usually instant for cloud projects)
4. Verify access at [Earth Engine Code Editor](https://code.earthengine.google.com/)

### Step 3: Create Earth Engine Service Account

```bash
# Create service account specifically for Earth Engine
gcloud iam service-accounts create drishtix-ee-sa \
  --display-name="DrishtiX Earth Engine Service Account"

# Grant Earth Engine permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:drishtix-ee-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/earthengine.viewer"

# Download key
gcloud iam service-accounts keys create config/ee-service-account-key.json \
  --iam-account=drishtix-ee-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Step 4: Configure Environment Variables

Add to `.env` and `.env.example`:

```env
# ================================
# GOOGLE EARTH ENGINE
# ================================
VITE_EARTH_ENGINE_ENABLED=true
EARTH_ENGINE_SERVICE_ACCOUNT=drishtix-ee-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
EARTH_ENGINE_PRIVATE_KEY_PATH=./config/ee-service-account-key.json
EARTH_ENGINE_PROJECT=YOUR_PROJECT_ID
```

### Step 5: Current Integration Status

⚠️ **Partially Integrated - Using Fallback Mode**:

- Backend: `server/services/earth-engine.service.ts` (200 lines)
  - **Current state**: API compatibility issues detected
  - **Fallback mode active**: Synthetic data generation works
  - Functions available:
    - `generateSyntheticCrowdData()` - Creates realistic crowd patterns
    - `generateHeatmapOverlay()` - GeoJSON heatmap for visualization
    - `analyzeVenueSuitability()` - Terrain and slope analysis

🔧 **What Works**:

- Synthetic crowd data generation (4 scenarios: NORMAL, SURGE, BOTTLENECK, EVACUATION)
- Terrain simulation (slope, elevation, hazard zones)
- Land cover classification (URBAN, FLAT, STEEP)
- Heatmap overlay generation for frontend

🔧 **What Needs Implementation**:

1. Actual Earth Engine API integration (currently disabled)
2. Real satellite imagery fetching
3. Terrain data from SRTM/ASTER datasets
4. Land cover from Sentinel/Landsat

### Step 6: Testing Earth Engine Service

```bash
# Test synthetic data generation
cd server
node -e "
const { googleEarthEngineService } = require('./services/earth-engine.service.ts');
googleEarthEngineService.generateSyntheticCrowdData({
  north: 18.5210,
  south: 18.5200,
  east: 73.8575,
  west: 73.8565
}, 50, 'SURGE').then(console.log).catch(console.error);
"
```

---

## 📡 Part 3: Google Pub/Sub Setup

### Purpose

- **Real-time data pipeline**: Stream events from multiple sources
- **Event streaming**: Drones, CCTV, GPS, social media, weather
- **Decoupling**: Services communicate asynchronously

### Step 1: Enable Pub/Sub API

```bash
# Enable Pub/Sub API
gcloud services enable pubsub.googleapis.com
```

### Step 2: Create Pub/Sub Topics

```bash
# Create all required topics
gcloud pubsub topics create video-analytics
gcloud pubsub topics create social-signals
gcloud pubsub topics create gps-tracking
gcloud pubsub topics create incident-alerts
gcloud pubsub topics create crowd-predictions
gcloud pubsub topics create drone-heatmaps
gcloud pubsub topics create cctv-density-reports
gcloud pubsub topics create user-density
gcloud pubsub topics create weather-updates
gcloud pubsub topics create risk-engine
gcloud pubsub topics create anomaly-events
gcloud pubsub topics create heatgrid-stream

# Verify topics created
gcloud pubsub topics list
```

### Step 3: Create Subscriptions with DLQ

```bash
# Create Dead Letter Queue topics
gcloud pubsub topics create video-analytics-processor-dlq
gcloud pubsub topics create social-signals-processor-dlq
gcloud pubsub topics create incident-alerts-dispatcher-dlq

# Create subscriptions with retry policy
gcloud pubsub subscriptions create video-analytics-processor \
  --topic=video-analytics \
  --ack-deadline=60 \
  --dead-letter-topic=video-analytics-processor-dlq \
  --max-delivery-attempts=5

gcloud pubsub subscriptions create social-signals-processor \
  --topic=social-signals \
  --ack-deadline=60 \
  --dead-letter-topic=social-signals-processor-dlq \
  --max-delivery-attempts=5

gcloud pubsub subscriptions create incident-alerts-dispatcher \
  --topic=incident-alerts \
  --ack-deadline=60 \
  --dead-letter-topic=incident-alerts-dispatcher-dlq \
  --max-delivery-attempts=5

gcloud pubsub subscriptions create gps-tracking-processor \
  --topic=gps-tracking \
  --ack-deadline=60

gcloud pubsub subscriptions create crowd-predictions-analyzer \
  --topic=crowd-predictions \
  --ack-deadline=60

gcloud pubsub subscriptions create risk-engine-sub \
  --topic=risk-engine \
  --ack-deadline=60

# Verify subscriptions
gcloud pubsub subscriptions list
```

### Step 4: Grant Pub/Sub Permissions

```bash
# Grant publish/subscribe permissions to service account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:drishtix-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.editor"
```

### Step 5: Configure Environment Variables

Add to `.env` and `.env.example`:

```env
# ================================
# CLOUD PUB/SUB (REAL-TIME DATA PIPELINE)
# ================================
VITE_ENABLE_PUBSUB=true

# Topics (auto-created on first publish if they don't exist)
PUBSUB_TOPIC_VIDEO_ANALYTICS=video-analytics
PUBSUB_TOPIC_SOCIAL_SIGNALS=social-signals
PUBSUB_TOPIC_GPS_TRACKING=gps-tracking
PUBSUB_TOPIC_INCIDENT_ALERTS=incident-alerts
PUBSUB_TOPIC_CROWD_PREDICTIONS=crowd-predictions
PUBSUB_TOPIC_RISK_ENGINE=risk-engine
PUBSUB_TOPIC_ANOMALY_EVENTS=anomaly-events
PUBSUB_TOPIC_HEATGRID_STREAM=heatgrid-stream
PUBSUB_TOPIC_WEATHER_UPDATES=weather-updates

# Subscriptions
PUBSUB_SUBSCRIPTION_RISK_ENGINE=risk-engine-sub
PUBSUB_SUBSCRIPTION_VIDEO_ANALYTICS=video-analytics-processor
PUBSUB_SUBSCRIPTION_SOCIAL_SIGNALS=social-signals-processor
```

### Step 6: Current Integration Status

✅ **Fully Integrated**:

**Backend Services** (`server/services/pubsub.service.ts` - 617 lines):

- Topic management with auto-creation
- Subscription handling with DLQ support
- Circuit breaker pattern for fault tolerance
- Retry logic with exponential backoff
- Message publishing with timeout (10s)
- Metrics tracking (success/failure rates)

**Active Publishers**:

1. `video-analytics.service.ts` - Video frame analysis results
2. `social-media-monitoring.service.ts` - Social sentiment data
3. `weather.service.ts` - Weather updates and alerts
4. `traffic-mobility.service.ts` - Traffic incidents and congestion
5. `object-detection.service.ts` - Anomaly detection alerts
6. `recommendation-engine.service.ts` - AI-generated recommendations

**Frontend Services** (`src/services/pubsub.service.ts` - 542 lines):

- Real-time subscription management
- Message handlers for 5 topic types
- Type-safe message interfaces
- Auto-reconnection on failures

**Data Streams Currently Flowing**:

- ✅ Video analytics (frame analysis, people count, anomalies)
- ✅ Social signals (Twitter sentiment, panic detection)
- ✅ GPS tracking (attendee locations, density heatmaps)
- ✅ Incident alerts (critical events, severity levels)
- ✅ Crowd predictions (ML forecasts, risk scores)
- ✅ Weather updates (alerts, temperature, conditions)
- ✅ Traffic updates (congestion, incidents, route changes)

### Step 7: Testing Pub/Sub Integration

#### Test Message Publishing (Backend)

```bash
cd server
node -e "
const { pubSubService } = require('./services/pubsub.service.ts');
pubSubService.publishVideoAnalytics({
  eventId: 'evt_test',
  cameraId: 'cam_001',
  timestamp: new Date().toISOString(),
  peopleCount: 150,
  crowdDensity: 0.75,
  anomalies: []
}).then(() => console.log('Message published!')).catch(console.error);
"
```

#### Test Message Subscription (Frontend)

1. Open browser console at `http://localhost:5173`
2. Navigate to any event dashboard
3. Check console logs for Pub/Sub messages:
   ```
   [Pub/Sub] Received video-analytics message
   [Pub/Sub] Received social-signals message
   ```

#### Monitor Pub/Sub Metrics

```bash
# View topic metrics
gcloud pubsub topics describe video-analytics

# View subscription metrics
gcloud pubsub subscriptions describe video-analytics-processor

# Pull messages manually for testing
gcloud pubsub subscriptions pull video-analytics-processor --limit=5
```

---

## 🔄 Integration Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────┤
│  Drones  │  CCTV  │  GPS Wearables  │  Social Media  │ Weather │
└────┬──────┴───┬────┴────────┬────────┴───────┬────────┴────┬───┘
     │          │             │                │             │
     v          v             v                v             v
┌─────────────────────────────────────────────────────────────────┐
│                    PUB/SUB TOPICS                                │
├─────────────────────────────────────────────────────────────────┤
│ video-analytics │ gps-tracking │ social-signals │ weather-updates│
└────┬─────────────┴──────┬──────┴────────┬───────┴────────┬──────┘
     │                    │               │                │
     v                    v               v                v
┌─────────────────────────────────────────────────────────────────┐
│                    SUBSCRIBERS                                   │
├─────────────────────────────────────────────────────────────────┤
│  ETL Worker  │  Risk Engine  │  BigQuery  │  Frontend (WebSocket)│
└────┬──────────┴───────┬───────┴─────┬─────┴──────────┬──────────┘
     │                  │             │                │
     v                  v             v                v
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUTS                                       │
├─────────────────────────────────────────────────────────────────┤
│  ML Models  │  Dashboards  │  Analytics  │  Alerts & Notifications│
└─────────────────────────────────────────────────────────────────┘
```

### Google Maps Integration Flow

```
Attendee App (Frontend)
    │
    v
[Request Safe Route]
    │
    v
Google Maps Service (Backend)
    │
    ├──> Routes API (traffic-aware routing)
    ├──> Places API (gate/POI suggestions)
    └──> Directions API (turn-by-turn navigation)
    │
    v
[Overlay Crowd Density from Pub/Sub]
    │
    v
[Return Optimized Route avoiding crowded zones]
    │
    v
Display on Venue Map (Frontend)
```

### Earth Engine Integration Flow (When Fully Implemented)

```
Organizer Request
    │
    v
[Request Venue Imagery]
    │
    v
Earth Engine Service (Backend)
    │
    ├──> Fetch satellite tiles
    ├──> Extract terrain data (SRTM)
    ├──> Classify land cover (Sentinel-2)
    └──> Generate heatmap overlay
    │
    v
[Combine with Real-time Crowd Data]
    │
    v
Return Composite Map
    │
    v
Display in Venue Mapping Component
```

---

## ✅ Verification Checklist

### Google Maps Platform

- [ ] APIs enabled in GCP Console
- [ ] API key created and restricted
- [ ] Environment variables set in `.env`
- [ ] Backend service can make API calls
- [ ] Frontend venue mapping loads Google Maps
- [ ] Drawing Manager works (boundary creation)
- [ ] Safe routing calculates routes
- [ ] Gate recommendations display

### Google Earth Engine

- [ ] Earth Engine API enabled
- [ ] Service account created with EE permissions
- [ ] Environment variables configured
- [ ] Synthetic data generation works
- [ ] Fallback mode active (expected until full implementation)

### Google Pub/Sub

- [ ] Pub/Sub API enabled
- [ ] All topics created (12 topics)
- [ ] Subscriptions created with DLQ
- [ ] Service account has pub/sub permissions
- [ ] Environment variables set
- [ ] Backend can publish messages
- [ ] Frontend can subscribe to topics
- [ ] Messages flow end-to-end

---

## 🚨 Common Issues & Troubleshooting

### Google Maps

**Issue**: "This page can't load Google Maps correctly"

- **Cause**: API key not set or invalid
- **Fix**: Check `VITE_GOOGLE_MAPS_API_KEY` in `.env`, verify key restrictions

**Issue**: "REQUEST_DENIED" in console

- **Cause**: API not enabled or billing not active
- **Fix**: Enable Maps JavaScript API, check GCP billing

**Issue**: Routes not calculating

- **Cause**: Routes API not enabled
- **Fix**: `gcloud services enable routes.googleapis.com`

### Earth Engine

**Issue**: "Earth Engine not initialized"

- **Cause**: Service account lacks permissions
- **Fix**: Grant `roles/earthengine.viewer` role

**Issue**: Service in fallback mode

- **Cause**: Intentional - API compatibility issues being resolved
- **Fix**: No action needed - synthetic data works as designed

### Pub/Sub

**Issue**: Messages not publishing

- **Cause**: Topic doesn't exist or permissions issue
- **Fix**: Check topic exists, verify service account has `pubsub.publisher` role

**Issue**: Subscription not receiving messages

- **Cause**: Subscription not created or wrong topic
- **Fix**: Verify subscription exists: `gcloud pubsub subscriptions list`

**Issue**: Circuit breaker open

- **Cause**: Too many publish failures
- **Fix**: Check service account key is valid, wait 60s for auto-recovery

**Issue**: DLQ filling up

- **Cause**: Subscribers failing to process messages
- **Fix**: Check subscriber logs, fix processing logic, drain DLQ:
  ```bash
  gcloud pubsub subscriptions pull video-analytics-processor-dlq --limit=100
  ```

---

## 📊 Monitoring & Metrics

### Google Maps Usage

```bash
# View API usage
gcloud services quota --service=maps-backend.googleapis.com list

# Check rate limits
gcloud alpha services api-keys describe API_KEY_ID
```

### Pub/Sub Monitoring

```bash
# Topic metrics
gcloud pubsub topics describe video-analytics

# Subscription lag (unprocessed messages)
gcloud pubsub subscriptions describe video-analytics-processor \
  --format="value(messageRetentionDuration)"

# Dead letter queue size
gcloud pubsub subscriptions pull video-analytics-processor-dlq --limit=1
```

### Cloud Console Dashboards

1. **Pub/Sub Dashboard**: [https://console.cloud.google.com/cloudpubsub](https://console.cloud.google.com/cloudpubsub)
2. **Maps Usage**: [https://console.cloud.google.com/google/maps-apis/metrics](https://console.cloud.google.com/google/maps-apis/metrics)
3. **Earth Engine**: [https://code.earthengine.google.com/](https://code.earthengine.google.com/)

---

## 🎓 Best Practices

### Google Maps

1. **Restrict API keys** - Always use HTTP referrer or IP restrictions
2. **Cache responses** - Store route data to reduce API calls
3. **Batch requests** - Use matrix API for multiple destinations
4. **Monitor quotas** - Set up alerts for 80% quota usage

### Earth Engine

1. **Use service accounts** - Never use personal credentials
2. **Cache tiles** - Store satellite imagery in Cloud Storage
3. **Limit requests** - Earth Engine has rate limits (10 req/sec)

### Pub/Sub

1. **Use DLQ** - Always configure dead letter queues
2. **Idempotent subscribers** - Design for duplicate message handling
3. **Monitor lag** - Alert if subscription lag > 1 minute
4. **Set ack deadlines appropriately** - 60s for most workloads
5. **Use ordered keys** - For messages that must be processed in order

---

## 📚 Additional Resources

### Documentation

- [Google Maps Platform Docs](https://developers.google.com/maps/documentation)
- [Google Earth Engine Docs](https://developers.google.com/earth-engine)
- [Google Pub/Sub Docs](https://cloud.google.com/pubsub/docs)

### Code Examples

- Backend Maps Service: `server/services/google-maps.service.ts`
- Backend Earth Engine: `server/services/earth-engine.service.ts`
- Backend Pub/Sub: `server/services/pubsub.service.ts`
- Frontend Pub/Sub: `src/services/pubsub.service.ts`
- Venue Mapping UI: `src/components/features/venue-mapping.tsx`
- Attendee Routing UI: `src/components/features/attendee-routing.tsx`

---

## ✨ Next Steps

After completing this setup:

1. **Test the full pipeline**:
   - Create an event in the organizer dashboard
   - Draw venue boundary using Google Maps
   - Simulate crowd data via Earth Engine
   - Monitor Pub/Sub messages in Cloud Console

2. **Enable real data sources**:
   - Connect CCTV feeds (see `docs/ADVANCED_VIDEO_ANALYTICS_COMPLETE.md`)
   - Integrate GPS wearables (see `server/services/wearable-gps.service.ts`)
   - Set up social media monitoring (see `server/services/social-media-monitoring.service.ts`)

3. **Deploy to production**:
   - See `docs/DEPLOYMENT_CHECKLIST.md`
   - Configure production API keys with domain restrictions
   - Set up Cloud Monitoring alerts for all services

---

**Last Updated**: December 1, 2025  
**Version**: 1.0.0  
**Maintainer**: DrishtiX Team
