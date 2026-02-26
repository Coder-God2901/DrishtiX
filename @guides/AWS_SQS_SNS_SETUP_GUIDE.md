# AWS SQS + SNS + Location Service Setup Guide

> **Replaces:** Google Cloud Pub/Sub + Google Maps API + Google Earth Engine  
> **Services:** Amazon SQS, Amazon SNS, Amazon EventBridge, Amazon Location Service, Amazon SageMaker Geospatial  
> **Cost:** SQS first 1M req/month free; SNS first 1M free; Location Service $0.50/1k map tiles

---

## Prerequisites

- AWS CLI v2 configured
- IAM permissions: `sqs:*`, `sns:*`, `events:*`, `geo:*`, `sagemaker:*`
- Region: `ap-south-1` (Mumbai)

---

## Part A — Amazon SQS (Message Queues)

### Replaces: Cloud Pub/Sub subscriptions

SQS provides decoupled, durable message queues for the DrishtiX data pipeline.

### Create Core Queues

```bash
# Crowd data ingestion queue (standard)
aws sqs create-queue \
  --queue-name drishtix-crowd-data.fifo \
  --attributes '{
    "FifoQueue": "true",
    "ContentBasedDeduplication": "true",
    "VisibilityTimeout": "60",
    "MessageRetentionPeriod": "86400"
  }' \
  --region ap-south-1

# Alert processing queue (standard, with DLQ)
aws sqs create-queue \
  --queue-name drishtix-alerts-dlq \
  --attributes '{"MessageRetentionPeriod": "1209600"}' \
  --region ap-south-1

aws sqs create-queue \
  --queue-name drishtix-alerts \
  --attributes '{
    "VisibilityTimeout": "30",
    "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:ap-south-1:ACCOUNT_ID:drishtix-alerts-dlq\",\"maxReceiveCount\":\"3\"}"
  }' \
  --region ap-south-1

# ETL processing queue
aws sqs create-queue \
  --queue-name drishtix-etl-jobs \
  --attributes '{"VisibilityTimeout": "300", "MessageRetentionPeriod": "86400"}' \
  --region ap-south-1

# ML inference queue
aws sqs create-queue \
  --queue-name drishtix-ml-inference \
  --attributes '{"VisibilityTimeout": "120"}' \
  --region ap-south-1
```

### Node.js SDK — SQS Usage

```bash
npm install @aws-sdk/client-sqs
```

```typescript
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'ap-south-1' });

// Send message (replaces Pub/Sub publish)
await sqs.send(new SendMessageCommand({
  QueueUrl: process.env.CROWD_DATA_QUEUE_URL,
  MessageBody: JSON.stringify({ zoneId: 'z-001', count: 450, timestamp: Date.now() }),
  MessageGroupId: 'zone-z-001',        // FIFO only
  MessageDeduplicationId: `z-001-${Date.now()}` // FIFO only
}));

// Receive messages (replaces Pub/Sub pull subscription)
const { Messages } = await sqs.send(new ReceiveMessageCommand({
  QueueUrl: process.env.CROWD_DATA_QUEUE_URL,
  MaxNumberOfMessages: 10,
  WaitTimeSeconds: 20,  // Long polling — reduces cost
}));

// Process and delete
for (const msg of Messages ?? []) {
  const data = JSON.parse(msg.Body!);
  // ... process data
  await sqs.send(new DeleteMessageCommand({
    QueueUrl: process.env.CROWD_DATA_QUEUE_URL,
    ReceiptHandle: msg.ReceiptHandle!
  }));
}
```

---

## Part B — Amazon SNS (Topics & Fan-Out)

### Replaces: Cloud Pub/Sub topics

SNS provides fan-out messaging to multiple subscribers (Lambda, SQS, HTTP endpoints).

### Create Core Topics

```bash
# Real-time alerts topic (fan-out to push notifications + WebSocket)
aws sns create-topic \
  --name drishtix-alerts \
  --region ap-south-1

# Crowd data topic (fan-out to ML + ETL + analytics)
aws sns create-topic \
  --name drishtix-crowd-data \
  --region ap-south-1

# System events topic
aws sns create-topic \
  --name drishtix-system-events \
  --region ap-south-1
```

### Subscribe SQS to SNS (Fan-Out Pattern)

```bash
# ML inference queue subscribes to crowd data topic
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-south-1:ACCOUNT_ID:drishtix-crowd-data \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:ap-south-1:ACCOUNT_ID:drishtix-ml-inference \
  --region ap-south-1

# ETL queue also subscribes to crowd data topic
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-south-1:ACCOUNT_ID:drishtix-crowd-data \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:ap-south-1:ACCOUNT_ID:drishtix-etl-jobs \
  --region ap-south-1
```

### Node.js SDK — SNS Publish

```typescript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({ region: 'ap-south-1' });

// Publish crowd update (replaces Pub/Sub topic publish)
await sns.send(new PublishCommand({
  TopicArn: process.env.CROWD_DATA_TOPIC_ARN,
  Message: JSON.stringify({
    eventType: 'CROWD_UPDATE',
    zoneId: 'z-001',
    currentCount: 480,
    maxCapacity: 500,
    timestamp: new Date().toISOString()
  }),
  MessageAttributes: {
    eventType: { DataType: 'String', StringValue: 'CROWD_UPDATE' }
  }
}));
```

---

## Part C — Amazon EventBridge (Scheduled Jobs)

### Replaces: Cloud Scheduler / Pub/Sub cron topics

```bash
# Schedule crowd forecasting every 15 minutes
aws events put-rule \
  --name drishtix-crowd-forecast-schedule \
  --schedule-expression "rate(15 minutes)" \
  --state ENABLED \
  --region ap-south-1

# Attach Lambda target
aws events put-targets \
  --rule drishtix-crowd-forecast-schedule \
  --targets '[{
    "Id": "CrowdForecastLambda",
    "Arn": "arn:aws:lambda:ap-south-1:ACCOUNT_ID:function:drishtix-crowd-forecaster"
  }]' \
  --region ap-south-1
```

---

## Part D — Amazon Location Service (Maps)

### Replaces: Google Maps API + Google Maps JavaScript SDK

### Create Map Resources

```bash
# Create map (vector tiles)
aws location create-map \
  --map-name drishtix-map \
  --configuration '{"Style": "VectorEsriNavigation"}' \
  --region ap-south-1

# Create place index (geocoding / search)
aws location create-place-index \
  --index-name drishtix-places \
  --data-source Esri \
  --region ap-south-1

# Create route calculator (evacuation routing)
aws location create-route-calculator \
  --calculator-name drishtix-routes \
  --data-source Esri \
  --region ap-south-1

# Create geofence collection (venue boundary monitoring)
aws location create-geofence-collection \
  --collection-name drishtix-venue-geofences \
  --region ap-south-1
```

### Frontend Integration (MapLibre GL JS)

Amazon Location Service uses **MapLibre GL JS** as the open-source map renderer.

```bash
npm install maplibre-gl @aws/amazon-location-utilities-auth-helper
```

```typescript
import maplibregl from 'maplibre-gl';
import { withAPIKey } from '@aws/amazon-location-utilities-auth-helper';

const authHelper = await withAPIKey(import.meta.env.VITE_AWS_MAP_API_KEY);

const map = new maplibregl.Map({
  container: 'map',
  style: `https://maps.geo.ap-south-1.amazonaws.com/maps/v0/maps/drishtix-map/style-descriptor`,
  center: [72.8777, 19.0760], // Mumbai default
  zoom: 14,
  ...authHelper.getMapAuthenticationOptions()
});
```

### Geocoding

```typescript
import { LocationClient, SearchPlaceIndexForTextCommand } from '@aws-sdk/client-location';

const location = new LocationClient({ region: 'ap-south-1' });

const { Results } = await location.send(new SearchPlaceIndexForTextCommand({
  IndexName: 'drishtix-places',
  Text: 'Mumbai Central Station',
  MaxResults: 5,
  FilterCountries: ['IND']
}));

const coords = Results?.[0]?.Place?.Geometry?.Point; // [lng, lat]
```

### Geofencing (Venue Boundary Alerts)

```typescript
await location.send(new PutGeofenceCommand({
  CollectionName: 'drishtix-venue-geofences',
  GeofenceId: 'venue-001',
  Geometry: {
    Polygon: [[
      [72.8750, 19.0740],
      [72.8800, 19.0740],
      [72.8800, 19.0780],
      [72.8750, 19.0780],
      [72.8750, 19.0740]
    ]]
  }
}));
```

---

## Part E — SageMaker Geospatial (Satellite Imagery Analysis)

### Replaces: Google Earth Engine

Used for satellite-based crowd density analysis, venue capacity estimation from aerial imagery.

```bash
# List available Earth Observation collections
aws sagemaker-geospatial list-earth-observation-jobs \
  --region us-west-2  # Geospatial is available in us-west-2
```

```python
# Python — SageMaker Geospatial
import boto3

client = boto3.client('sagemaker-geospatial', region_name='us-west-2')

response = client.start_earth_observation_job(
    Name='drishtix-venue-analysis',
    InputConfig={
        'RasterDataCollectionQuery': {
            'RasterDataCollectionArn': 'arn:aws:sagemaker-geospatial:us-west-2:aws:raster-data-collection/public/sentinel-2-l2a',
            'AreaOfInterest': {
                'AreaOfInterestGeometry': {
                    'PolygonGeometry': {
                        'Coordinates': [[
                            [72.875, 19.074],
                            [72.880, 19.074],
                            [72.880, 19.078],
                            [72.875, 19.078],
                            [72.875, 19.074]
                        ]]
                    }
                }
            },
            'TimeRangeFilter': {
                'StartTime': '2026-01-01T00:00:00Z',
                'EndTime': '2026-03-01T00:00:00Z'
            }
        }
    },
    JobConfig={
        'LandCoverSegmentationConfig': {}
    },
    ExecutionRoleArn='arn:aws:iam::ACCOUNT_ID:role/SageMakerGeospatialRole'
)
```

---

## Environment Variables (`.env.server`)

```env
# SQS
CROWD_DATA_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT_ID/drishtix-crowd-data.fifo
ALERTS_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT_ID/drishtix-alerts
ETL_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT_ID/drishtix-etl-jobs
ML_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT_ID/drishtix-ml-inference

# SNS
CROWD_DATA_TOPIC_ARN=arn:aws:sns:ap-south-1:ACCOUNT_ID:drishtix-crowd-data
ALERTS_TOPIC_ARN=arn:aws:sns:ap-south-1:ACCOUNT_ID:drishtix-alerts

# Location Service
AWS_LOCATION_MAP_NAME=drishtix-map
AWS_LOCATION_PLACE_INDEX=drishtix-places
AWS_LOCATION_ROUTE_CALCULATOR=drishtix-routes
AWS_LOCATION_GEOFENCE_COLLECTION=drishtix-venue-geofences
VITE_AWS_MAP_API_KEY=your-location-service-api-key
```

---

## Verification

```bash
# List SQS queues
aws sqs list-queues --queue-name-prefix drishtix --region ap-south-1

# List SNS topics
aws sns list-topics --region ap-south-1 | grep drishtix

# List Location resources
aws location list-maps --region ap-south-1
aws location list-place-indexes --region ap-south-1
```

---

## Related Documentation

- [Cognito Auth Setup](@guides/AWS_COGNITO_AUTH_SETUP_GUIDE.md)
- [DynamoDB Setup](@guides/AWS_DYNAMODB_SETUP_GUIDE.md)
- [SNS Push Notifications](@guides/AWS_SNS_PUSH_SETUP_GUIDE.md)
- [AWS Solution Architecture](../AWS_SOLUTION_ARCHITECTURE.md)
