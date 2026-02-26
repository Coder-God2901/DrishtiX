# AWS App Runner ETL Worker Integration Guide

## 🎯 Overview

This guide explains how the **AWS App Runner ETL Worker** integrates with the DrishtiX platform to replace Google Cloud Dataflow with a cost-effective Python-based solution.

### Cost Comparison

- **Dataflow**: ~$2,500/month for 10M requests
- **AWS App Runner ETL**: ~$50/month for 10M requests
- **Savings**: 50x reduction (98% cost savings)

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Sources (7 Streams)                     │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│  Drones  │   CCTV   │ User GPS │ Weather  │  Social  │ Traffic  │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘
     │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend Services (Node.js/TypeScript)              │
│  • video-analytics.service.ts  → CCTV data                      │
│  • drone-heatmap.service.ts    → Drone data                     │
│  • user-tracking.service.ts    → GPS data                       │
│  • cloudrun-etl.service.ts     → ETL integration layer          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               AWS App Runner ETL Worker (Python)                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ GridConverter│  │  DataMerger  │  │FeatureEngineer│        │
│  │ GPS→50m grid │  │ Multi-source │  │ Temporal deltas│        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘        │
│         │                 │                  │                  │
│         └─────────────────┼──────────────────┘                  │
│                           ▼                                      │
│                   ┌──────────────┐                              │
│                   │DataProcessor │                              │
│                   │ Main ETL     │                              │
│                   └──────┬───────┘                              │
│                          │                                       │
│                          ▼                                       │
│                   ┌──────────────┐                              │
│                   │OutputPublisher│                             │
│                   └──────┬───────┘                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌─────────────────┐      ┌─────────────────┐
    │   Amazon SQS + SNS       │      │   Amazon Athena      │
    │ ML predictions  │      │   Analytics     │
    └────────┬────────┘      └─────────────────┘
             │
             ▼
    ┌─────────────────┐
    │   Frontend      │
    │  Real-time UI   │
    └─────────────────┘
```

---

## 🔧 Backend Integration

### 1. ETL Service Client (`cloudrun-etl.service.ts`)

The service provides batching, retry logic, and fallback mechanisms:

```typescript
import { cloudRunETLService } from './cloudrun-etl.service';

// Send CCTV data
await cloudRunETLService.sendCCTVData(eventId, {
  cameraId: 'cam-001',
  location: { lat: 28.6139, lon: 77.2090 },
  zoneId: 'zone-A',
  peopleCount: 150,
  densityValue: 0.75,
  cameraType: 'CCTV',
  anomalies: ['SURGE', 'HIGH_DENSITY']
});

// Send Drone data
await cloudRunETLService.sendDroneData(eventId, {
  droneId: 'drone-001',
  location: { lat: 28.6140, lon: 77.2091 },
  altitude: 50,
  peopleCount: 200,
  heatmapData: [...]
});

// Send User GPS data
await cloudRunETLService.sendUserGPSData(eventId, {
  userId: 'user-123',
  location: { lat: 28.6141, lon: 77.2092 },
  accuracy: 5,
  speed: 1.2
});

// Update weather context
await cloudRunETLService.updateWeatherContext(eventId, {
  temperature: 35,
  condition: 'sunny',
  heatIndex: 40,
  windSpeed: 10,
  humidity: 60
});

// Update social signals context
await cloudRunETLService.updateSocialContext(eventId, {
  sentimentScore: 0.6,
  panicLevel: 0.2,
  volumeSpike: false,
  keywords: ['crowded', 'hot']
});
```

### 2. Video Analytics Integration

Updated `video-analytics.service.ts`:

```typescript
import { cloudRunETLService } from './cloudrun-etl.service';

// In analyzeFrame() method:
await cloudRunETLService.sendCCTVData(input.eventId, {
  cameraId: input.cameraId,
  location: input.location,
  zoneId: input.zoneId,
  peopleCount,
  densityValue,
  cameraType: input.cameraType || 'CCTV',
  anomalies: anomalies.map((a) => a.type),
});
```

### 3. Batching Configuration

**Automatic batching** reduces API calls:

- **Batch Size**: 100 data points
- **Timeout**: 5 seconds
- **Auto-flush**: When batch full or timeout reached

```typescript
// Manual flush (optional)
await cloudRunETLService.flushBatch(eventId);

// Flush all on shutdown
await cloudRunETLService.flushAll();

// Get batch stats
const stats = cloudRunETLService.getBatchStats();
// { 'event-123': { size: 45, pending: true, maxSize: 100 } }
```

---

## 🚀 Deployment

### Prerequisites

```bash
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Authenticate
aws configure --profile drishtix

# Set project
aws configure set region ap-south-1
```

### Deploy ETL Worker

**Windows PowerShell:**

```powershell
cd Events
.\scripts\deploy-etl-worker.ps1 -ProjectId "your-AWS-project"
```

**Linux/macOS:**

```bash
cd Events
chmod +x scripts/deploy-etl-worker.sh
./scripts/deploy-etl-worker.sh
```

### Manual Deployment

```bash
# 1. Build Docker image
cd workers/etl-worker
docker build -t ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/YOUR_PROJECT/etl-worker:latest .

# 2. Push to GCR
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/YOUR_PROJECT/etl-worker:latest

# 3. Deploy to AWS App Runner
gAWS App Runner deploy etl-worker \
  --image ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/YOUR_PROJECT/etl-worker:latest \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 100 \
  --concurrency 80 \
  --timeout 300 \
  --allow-unauthenticated \
  --set-env-vars "AWS_ACCOUNT_ID=YOUR_PROJECT,Amazon Athena_DATASET=drishtix_analytics"

# 4. Get service URL
gAWS App Runner services describe etl-worker --region us-central1 --format "value(status.url)"
```

### Configure Amazon SQS + SNS Push Subscription

```bash
# Create topic
aws sns create-topic --name drishtix-raw-data-stream --region ap-south-1

# Create push subscription
SERVICE_URL=$(gAWS App Runner services describe etl-worker --region us-central1 --format "value(status.url)")

aws sqs create-queue --queue-name drishtix-etl-worker-sub --region ap-south-1 \
  --topic raw-data-stream \
  --push-endpoint "${SERVICE_URL}/process" \
  --ack-deadline 60 \
  --message-retention-duration 7d
```

---

## 🔐 Environment Configuration

### Backend `.env`

```bash
# AWS App Runner ETL Worker
ETL_WORKER_URL=https://etl-worker-xxxxx-uc.a.run.app

# AWS Configuration
AWS_ACCOUNT_ID=your-project-id
Amazon Athena_DATASET=drishtix_analytics
```

### AWS App Runner Environment Variables

Set during deployment or update later:

```bash
gAWS App Runner services update etl-worker \
  --region us-central1 \
  --set-env-vars "AWS_ACCOUNT_ID=your-project,Amazon Athena_DATASET=drishtix_analytics"
```

---

## 📡 API Endpoints

### POST `/process`

Process raw data batch

**Request:**

```json
{
  "event_id": "event-123",
  "data": [
    {
      "type": "CCTV",
      "timestamp": "2024-01-15T10:30:00Z",
      "cameraId": "cam-001",
      "location": { "lat": 28.6139, "lon": 77.209 },
      "peopleCount": 150,
      "densityValue": 0.75
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "processed": 45,
  "event_id": "event-123",
  "timestamp": "2024-01-15T10:30:05Z"
}
```

### POST `/update-weather`

Update weather context

**Request:**

```json
{
  "event_id": "event-123",
  "weather": {
    "temperature": 35,
    "condition": "sunny",
    "heatIndex": 40,
    "windSpeed": 10,
    "humidity": 60
  }
}
```

### POST `/update-social`

Update social signals context

**Request:**

```json
{
  "event_id": "event-123",
  "social": {
    "sentimentScore": 0.6,
    "panicLevel": 0.2,
    "volumeSpike": false,
    "keywords": ["crowded", "hot"]
  }
}
```

### GET `/health`

Health check endpoint

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

---

## 📊 Data Flow

### 1. Grid Conversion (GPS → 50m cells)

```python
grid_converter = GridConverter(cell_size=50)
grid_id, bounds = grid_converter.gps_to_grid(28.6139, 77.2090)
# grid_id: "28.6125_77.2075"
# bounds: { "north": 28.6150, "south": 28.6100, ... }
```

### 2. Multi-Source Merging

```python
# CCTV data
cctv_grids = {"28.6125_77.2075": [{"peopleCount": 150, "source": "CCTV"}]}

# Drone data
drone_grids = {"28.6125_77.2075": [{"peopleCount": 200, "source": "DRONE"}]}

# GPS data
gps_grids = {"28.6125_77.2075": [{"userId": "user-123", "source": "GPS"}]}

# Merged
merged = data_merger.merge(cctv_grids, drone_grids, gps_grids)
# {
#   "28.6125_77.2075": {
#     "peopleCount": 175,  # Weighted average
#     "confidence": 0.85,  # Multi-source confidence
#     "sources": ["CCTV", "DRONE", "GPS"]
#   }
# }
```

### 3. Feature Engineering

```python
# Temporal features (1-minute, 5-minute, 15-minute deltas)
features = feature_engineer.add_temporal_features(merged_grids, historical_data)
# {
#   "peopleCount": 175,
#   "delta_1m": +15,    # +15 people in last 1 minute
#   "delta_5m": +50,    # +50 people in last 5 minutes
#   "delta_15m": +120,  # +120 people in last 15 minutes
#   ...
# }

# Weather context
features = feature_engineer.add_weather_context(features, weather_data)
# { ..., "temperature": 35, "heatIndex": 40, "humidity": 60 }

# Social signals context
features = feature_engineer.add_social_context(features, social_data)
# { ..., "sentimentScore": 0.6, "panicLevel": 0.2 }

# Event schedule context
features = feature_engineer.add_schedule_context(features, schedule_data)
# { ..., "currentActivity": "Concert", "expectedCrowd": 5000 }
```

### 4. Output Publishing

```python
# Publish to Amazon SQS + SNS (ML predictions)
output_publisher.publish_to_pubsub(features, "processed-features")

# Save to Amazon Athena (Analytics)
output_publisher.save_to_Amazon Athena(features, "crowd_analytics")
```

---

## 🔍 Monitoring

### AWS App Runner Logs

```bash
# Tail logs
gAWS App Runner logs tail etl-worker --region us-central1

# Last 50 logs
gAWS App Runner logs read etl-worker --region us-central1 --limit 50

# Filter by severity
gAWS App Runner logs read etl-worker --region us-central1 --log-filter="severity>=ERROR"
```

### Metrics

```bash
# CPU utilization
gAmazon CloudWatch time-series list \
  --filter='metric.type="run.amazonaws.com/container/cpu/utilizations"' \
  --filter='resource.labels.service_name="etl-worker"'

# Request count
gAmazon CloudWatch time-series list \
  --filter='metric.type="run.amazonaws.com/request_count"' \
  --filter='resource.labels.service_name="etl-worker"'

# Request latency
gAmazon CloudWatch time-series list \
  --filter='metric.type="run.amazonaws.com/request_latencies"' \
  --filter='resource.labels.service_name="etl-worker"'
```

### Performance Metrics

Expected performance (per instance):

- **Throughput**: 5,000 data points/second
- **Latency**: <200ms per batch (100-1000 points)
- **Auto-scaling**: 1-100 instances based on load
- **Memory**: 2GB per instance
- **CPU**: 2 vCPUs per instance

---

## 🧪 Testing

### Health Check

```bash
curl https://etl-worker-xxxxx-uc.a.run.app/health
```

### Process Endpoint

```bash
curl -X POST https://etl-worker-xxxxx-uc.a.run.app/process \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-event",
    "data": [
      {
        "type": "CCTV",
        "timestamp": "2024-01-15T10:30:00Z",
        "cameraId": "cam-001",
        "location": {"lat": 28.6139, "lon": 77.2090},
        "peopleCount": 150,
        "densityValue": 0.75
      }
    ]
  }'
```

### Backend Integration Test

```typescript
// server/test/etl-integration.test.ts
import { cloudRunETLService } from '../services/cloudrun-etl.service';

describe('AWS App Runner ETL Integration', () => {
  it('should send CCTV data successfully', async () => {
    await cloudRunETLService.sendCCTVData('test-event', {
      cameraId: 'cam-001',
      location: { lat: 28.6139, lon: 77.209 },
      peopleCount: 150,
      densityValue: 0.75,
    });

    // Flush batch
    await cloudRunETLService.flushBatch('test-event');
  });

  it('should perform health check', async () => {
    const healthy = await cloudRunETLService.healthCheck();
    expect(healthy).toBe(true);
  });
});
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. ETL Worker not receiving data

```bash
# Check Amazon SQS + SNS subscription
aws sqs get-queue-attributes --queue-url $(aws sqs get-queue-url --queue-name drishtix-etl-worker-sub --query QueueUrl --output text --region ap-south-1) --attribute-names All

# Check push endpoint
# Should match: https://etl-worker-xxxxx-uc.a.run.app/process
```

#### 2. High latency

```bash
# Increase instances
gAWS App Runner services update etl-worker \
  --region us-central1 \
  --min-instances 5 \
  --max-instances 200

# Increase CPU/memory
gAWS App Runner services update etl-worker \
  --region us-central1 \
  --cpu 4 \
  --memory 4Gi
```

#### 3. Memory errors

```bash
# Check memory usage
gAmazon CloudWatch time-series list \
  --filter='metric.type="run.amazonaws.com/container/memory/utilizations"' \
  --filter='resource.labels.service_name="etl-worker"'

# Increase memory limit
gAWS App Runner services update etl-worker \
  --region us-central1 \
  --memory 4Gi
```

#### 4. Connection timeout

```bash
# Increase timeout
gAWS App Runner services update etl-worker \
  --region us-central1 \
  --timeout 600  # 10 minutes
```

---

## 💰 Cost Optimization

### Pricing Breakdown

**AWS App Runner ETL Worker** (10M requests/month):

- Request charges: $0.40
- CPU time: ~$15
- Memory: ~$10
- Network egress: ~$5
- **Total**: ~$30-50/month

**Dataflow** (10M requests/month):

- Compute: ~$1,500
- Storage: ~$500
- Network: ~$500
- **Total**: ~$2,500/month

**Savings**: 98% ($2,450/month)

### Optimization Tips

1. **Use batching** (already implemented): Reduces API calls by 100x
2. **Set min-instances**: Avoid cold starts during peak hours
3. **Auto-scaling**: Only pay for what you use
4. **Regional deployment**: Choose nearest region to reduce latency
5. **Compression**: Gzip responses to reduce network costs

---

## 📚 Additional Resources

- [AWS App Runner Documentation](https://cloud.google.com/run/docs)
- [Amazon SQS + SNS Push Subscriptions](https://cloud.google.com/pubsub/docs/push)
- [Amazon Athena Streaming](https://cloud.google.com/Amazon Athena/docs/streaming-data-into-Amazon Athena)
- [ETL Worker Source Code](../workers/etl-worker/)

---

## ✅ Verification Checklist

- [ ] ETL worker deployed to AWS App Runner
- [ ] Service URL added to backend `.env`
- [ ] Amazon SQS + SNS push subscription created
- [ ] Health check passing
- [ ] Backend services updated to use `cloudRunETLService`
- [ ] Test data flowing through ETL pipeline
- [ ] Amazon Athena tables receiving data
- [ ] Frontend receiving processed features via Amazon SQS + SNS
- [ ] Monitoring dashboards configured
- [ ] Cost alerts set up

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0
