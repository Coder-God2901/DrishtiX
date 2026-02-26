# DrishtiX — Predictive Crowd Safety Platform

## 🎯 Overview

**DrishtiX** is a fully AI-powered, hardware-free, predictive crowd safety and situational awareness platform that transforms traditional event management into proactive, automated, and privacy-first incident prevention — built entirely on **Amazon Web Services (AWS)**.

### Key Features

- ✅ **Predictive Forecasting**: 15-20 minute advance warning of crowd bottlenecks (Amazon SageMaker LSTM)
- ✅ **Anomaly Detection**: Real-time panic, fire, violence, and surge detection using Amazon Rekognition
- ✅ **Automated Dispatch**: AI-powered emergency responder routing with Amazon Location Service
- ✅ **Voice-First Interface**: Hands-free command center via Amazon Transcribe + Amazon Lex
- ✅ **Hardware-Free**: Simulation engine eliminates need for physical CCTV
- ✅ **Privacy-First**: PII scrubbing with Amazon Comprehend + Amazon Macie
- ✅ **Real-Time**: WebSocket + Amazon SQS/SNS streaming architecture
- ✅ **Cost-Effective**: ~$68/month production cost on AWS; $0 with AWS Credits

---

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │  React + TypeScript + shadcn/ui (S3 + CloudFront)
└──────┬──────┘
       │ WebSocket/HTTP
┌──────▼──────┐
│   Backend   │  Express + Socket.IO + Prisma (AWS App Runner)
└──────┬──────┘
       │
┌──────▼───────────────────────────────────────┐
│           Amazon Web Services (AWS)          │
├───────────────────────────────────────────────┤
│ • Amazon SageMaker (Crowd Forecasting ML)    │
│ • Amazon Rekognition (Anomaly Detection)     │
│ • Amazon SQS + SNS (Real-time Streaming)     │
│ • Amazon Comprehend + Macie (Privacy/PII)    │
│ • Amazon S3 (Storage & Data Lake)           │
│ • Amazon Athena + Glue (Analytics)          │
│ • Amazon Location Service (Routing & Maps)  │
│ • Amazon DynamoDB (Primary Database)        │
│ • Amazon Cognito (Authentication)           │
│ • AWS Lambda (Event-driven Functions)       │
│ • Amazon Bedrock (LLM / Voice AI)           │
└───────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14 (or Amazon RDS Aurora Serverless)
- AWS Account with credits configured
- AWS CLI v2 installed and configured (`aws configure`)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd DrishtiX
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` — PostgreSQL / Aurora Serverless connection string
- `AWS_REGION` — e.g. `ap-south-1`
- `AWS_ACCESS_KEY_ID` — from IAM user or instance role
- `AWS_SECRET_ACCESS_KEY` — from IAM user
- `COGNITO_USER_POOL_ID` — from Cognito setup
- `SAGEMAKER_ENDPOINT_NAME` — crowd forecasting endpoint

4. **Deploy AWS infrastructure**

```bash
# Deploy all AWS CDK stacks
npx cdk deploy --all
```

This will create:
- Amazon Cognito User Pool
- DynamoDB tables with streams
- SQS queues and SNS topics
- S3 buckets with lifecycle rules
- Athena databases and Glue catalog
- SageMaker serverless inference endpoint

5. **Run database migrations**

```bash
pnpm db:migrate
```

6. **Start the development servers**

```bash
pnpm dev:all
```

This starts:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## 📚 API Endpoints

### Predictions
- `POST /api/predictions/forecast` — Generate crowd density forecast (SageMaker)
- `GET /api/predictions/:eventId` — Get predictions for event
- `GET /api/predictions/:eventId/latest` — Get latest prediction
- `GET /api/predictions/:eventId/hotspots` — Get current hotspots

### Anomaly Detection
- `POST /api/anomalies/detect` — Detect anomalies (Amazon Rekognition)
- `GET /api/anomalies/:eventId` — Get anomaly history (DynamoDB)
- `GET /api/anomalies/:eventId/current` — Get active anomalies
- `GET /api/anomalies/:eventId/metrics` — Get detection metrics

### Emergency Dispatch
- `POST /api/dispatch/create` — Create dispatch plan (Location Service routes)
- `PUT /api/dispatch/:id/approve` — Approve pending dispatch
- `PUT /api/dispatch/:id/status` — Update dispatch status
- `GET /api/dispatch/:eventId` — Get all dispatches
- `GET /api/dispatch/:eventId/active` — Get active dispatches

### Voice AI
- `POST /api/voice/command` — Process voice command (Amazon Lex + Bedrock)
- `POST /api/voice/translate` — Translate command (Amazon Translate)
- `DELETE /api/voice/history/:sessionId` — Clear conversation history

### Simulation
- `POST /api/simulation/generate` — Generate simulation (stored in S3)
- `GET /api/simulation/list` — List simulations
- `GET /api/simulation/:id` — Get simulation by ID

---

## 🔧 AWS Service Configuration

### Step 1 — Enable AWS Services

All services are managed via AWS CDK. For manual setup, ensure the following are configured:

- Amazon Cognito (User Pools + Identity Pools)
- Amazon DynamoDB (On-Demand tables)
- Amazon SQS + SNS (queues + topics)
- Amazon S3 (buckets: data lake, media, model artifacts)
- Amazon Athena + AWS Glue (analytics queries)
- Amazon SageMaker (model training + serverless inference)
- Amazon Rekognition (image/video analysis)
- Amazon Location Service (maps, geocoding, geofencing, routing)
- Amazon Comprehend + Macie (NLP, PII detection)
- Amazon Bedrock (foundation models for Voice AI)
- AWS Lambda (event processors)
- AWS Secrets Manager (credential storage)

### Step 2 — IAM Role Setup

Create an IAM role `drishtix-app-role` with these policies:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["dynamodb:*"], "Resource": "arn:aws:dynamodb:ap-south-1:*:table/drishtix-*" },
    { "Effect": "Allow", "Action": ["sqs:*", "sns:*"], "Resource": "arn:aws:sqs:ap-south-1:*:drishtix-*" },
    { "Effect": "Allow", "Action": ["s3:*"], "Resource": "arn:aws:s3:::drishtix-*" },
    { "Effect": "Allow", "Action": ["sagemaker:InvokeEndpoint"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["rekognition:*"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["location:*"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["comprehend:*"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["bedrock:InvokeModel"], "Resource": "*" }
  ]
}
```

### Step 3 — Environment Variables

```env
# AWS Core
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Amazon Cognito (Auth)
COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Amazon DynamoDB
DYNAMODB_TABLE_PREFIX=drishtix

# Amazon SQS / SNS
CROWD_DATA_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT/drishtix-crowd-data.fifo
ALERTS_TOPIC_ARN=arn:aws:sns:ap-south-1:ACCOUNT:drishtix-alerts

# Amazon SageMaker
SAGEMAKER_ENDPOINT_NAME=drishtix-crowd-forecaster
SAGEMAKER_REGION=ap-south-1

# Amazon S3
S3_BUCKET_NAME=drishtix-prod-data
S3_REGION=ap-south-1

# Amazon Location Service
AWS_LOCATION_MAP_NAME=drishtix-map
VITE_AWS_MAP_API_KEY=your-location-api-key

# Amazon Athena
ATHENA_DATABASE=drishtix_analytics
ATHENA_WORKGROUP=drishtix-workgroup
ATHENA_OUTPUT_BUCKET=s3://drishtix-athena-results/

# Amazon Bedrock (Voice AI)
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

---

## 🎨 Frontend Integration

### Real-time Updates (via SQS → Lambda → WebSocket)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Subscribe to predictions
socket.emit('subscribe:predictions', eventId);
socket.on('prediction:new', (prediction) => {
  console.log('New prediction:', prediction);
});

// Subscribe to anomalies
socket.emit('subscribe:anomalies', eventId);
socket.on('anomaly:detected', (anomaly) => {
  console.log('Anomaly detected:', anomaly);
});
```

### Map Integration (Amazon Location Service)

```typescript
import maplibregl from 'maplibre-gl';
import { withAPIKey } from '@aws/amazon-location-utilities-auth-helper';

const authHelper = await withAPIKey(process.env.VITE_AWS_MAP_API_KEY);

const map = new maplibregl.Map({
  container: 'map',
  style: `https://maps.geo.ap-south-1.amazonaws.com/maps/v0/maps/drishtix-map/style-descriptor`,
  center: [72.8777, 19.0760],
  zoom: 14,
  ...authHelper.getMapAuthenticationOptions()
});
```

### Voice Commands (Amazon Lex + Bedrock)

```typescript
const response = await fetch('/api/voice/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Show risk zones near Gate 3',
    language: 'en',
    eventId: 'event-123',
  }),
});

const { data } = await response.json();
console.log('AI Response:', data.text);     // Bedrock Claude response
console.log('Action:', data.action);         // Lex intent action
console.log('Visual Data:', data.visualData);
```

---

## 📊 Database Schema

Key models (DynamoDB tables + Prisma PostgreSQL):
- `Event` — Event information
- `Prediction` — Crowd density forecasts (SageMaker output)
- `Incident` — Recorded incidents
- `Alert` — Generated alerts (SNS fan-out)
- `Dispatch` — Emergency response dispatches (Location Service routes)
- `CrowdDensity` — Real-time density data (DynamoDB time-series)

See `prisma/schema.prisma` for complete relational schema.

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run AWS service integration tests
pnpm test:cognito        # Cognito auth
pnpm test:dynamodb       # DynamoDB CRUD
pnpm test:sqs-sns        # Messaging
pnpm test:sagemaker      # ML inference
pnpm test:rekognition    # Computer vision
pnpm test:location       # Maps & routing

# Type checking
pnpm type-check

# Linting
pnpm lint
```

---

## 🚢 Deployment

### Backend (AWS App Runner)

```bash
# Build and push to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
docker build -t drishtix-api .
docker tag drishtix-api:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/drishtix-api:latest
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/drishtix-api:latest
```

### Frontend (S3 + CloudFront)

```bash
# Build frontend
pnpm build

# Deploy to S3
aws s3 sync dist/ s3://drishtix-prod-frontend/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## 📈 Performance Targets

- **Prediction Lead Time**: 15-20 minutes
- **Anomaly Detection Latency**: < 5 seconds (Rekognition)
- **Response Time Reduction**: 50-70%
- **Prediction Accuracy**: ≥ 75%
- **Cost Efficiency**: ~$68/month production on AWS (~$0 with credits)

---

## 🔒 Privacy & Compliance

- PII automatically detected and scrubbed using **Amazon Comprehend + Amazon Macie**
- Data aggregated to grid-level (no individual tracking)
- Audit logs via **AWS CloudTrail**
- Configurable data retention via **S3 Lifecycle Rules** (default: 90 days)
- GDPR/CCPA compliant
- Encryption at rest: **AWS KMS** (AES-256)
- Encryption in transit: **TLS 1.3**

---

## 📖 Related Documentation

- [AWS Solution Architecture](AWS_SOLUTION_ARCHITECTURE.md)
- [AWS Setup Complete Guide](docs/AWS_SETUP_COMPLETE_GUIDE.md)
- [Cognito Auth Setup](@guides/AWS_COGNITO_AUTH_SETUP_GUIDE.md)
- [DynamoDB Setup](@guides/AWS_DYNAMODB_SETUP_GUIDE.md)
- [SQS/SNS/Location Setup](@guides/AWS_SQS_SNS_SETUP_GUIDE.md)
- [SNS Push Notifications](@guides/AWS_SNS_PUSH_SETUP_GUIDE.md)
- [System Architecture](technical-design/01-SYSTEM_ARCHITECTURE.md)

---

## 🙏 Acknowledgments

Built with:
- Amazon Web Services (AWS) — entire cloud stack
- Amazon SageMaker — ML training and inference
- Amazon Rekognition — Computer vision
- Amazon Bedrock — AI foundation models
- React & TypeScript — Frontend
- Prisma ORM — Database ORM
- shadcn/ui — Component library

---

**DrishtiX** — Predict. Prevent. Protect. 🎯
