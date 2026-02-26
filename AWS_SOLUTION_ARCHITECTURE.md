# DrishtiX — AWS Solution Architecture

> **Cloud Provider:** Amazon Web Services (AWS)  
> **Strategy:** Serverless-first, pay-per-use, cost-optimised with AWS Credits

---

## Architecture Overview

DrishtiX is a real-time crowd intelligence and event management platform deployed entirely on AWS. The architecture follows a serverless-first approach to maximise cost efficiency while leveraging managed services for scalability and reliability.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                   │
│   React (Vite) SPA  │  Mobile PWA  │  Organizer Dashboard              │
└────────────┬────────────────────────────────────────────────────────────┘
             │ HTTPS
┌────────────▼────────────────────────────────────────────────────────────┐
│                       CDN & EDGE LAYER                                  │
│              Amazon CloudFront  +  AWS WAF                              │
│              Static assets served from S3 Origin                        │
└────────────┬────────────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                                 │
│         Amazon API Gateway (REST + WebSocket APIs)                      │
│         Custom domain via AWS Route 53                                  │
└────────────┬────────────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────────────┐
│                       COMPUTE LAYER                                     │
│  AWS Lambda (functions)  │  AWS App Runner (Node.js API server)         │
│  ECS Fargate (ML service)│  AWS Fargate (ETL worker)                    │
└────────────┬────────────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                        │
│  Amazon DynamoDB (primary NoSQL)  │  Amazon RDS Aurora Serverless v2    │
│  Amazon S3 (object/blob storage)  │  Amazon ElastiCache Redis (cache)   │
│  Amazon Athena + AWS Glue (analytics / data warehouse queries)          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Service Mapping — GCP/Azure → AWS

| Previous (GCP/Azure) | AWS Replacement | Reason |
|---|---|---|
| Firebase Auth | **Amazon Cognito** | Managed auth, 50k MAU free tier |
| Firestore | **Amazon DynamoDB** | Serverless NoSQL, on-demand pricing |
| BigQuery | **Amazon Athena + AWS Glue** | Pay-per-query, no cluster cost |
| Cloud Pub/Sub | **Amazon SQS + SNS** | Decoupled messaging, very low cost |
| Google Earth Engine | **Amazon SageMaker Geospatial** | Geospatial ML on AWS |
| Google Maps API | **Amazon Location Service** | AWS-native maps & geocoding |
| Vertex AI | **Amazon SageMaker** | Serverless inference endpoints |
| Cloud Run | **AWS App Runner / ECS Fargate** | Serverless containers |
| Cloud Functions | **AWS Lambda** | Event-driven, generous free tier |
| Cloud Storage | **Amazon S3** | Industry-standard object storage |
| Secret Manager | **AWS Secrets Manager** | Managed secrets with rotation |
| Cloud SQL (Postgres) | **Amazon RDS Aurora Serverless v2** | Auto-scale, pause when idle |
| Firebase FCM | **Amazon SNS + Amazon Pinpoint** | Push notifications at scale |
| Google OAuth / Firebase Auth | **Amazon Cognito + Hosted UI** | Social login, OIDC |
| Azure OpenAI / Vertex AI LLM | **Amazon Bedrock** | Claude, Llama, Titan on AWS |
| Application Insights | **Amazon CloudWatch** | Metrics, logs, dashboards |
| Azure Container Registry | **Amazon ECR** | Private container registry |
| Azure Kubernetes Service | **Amazon EKS** | Managed Kubernetes |
| Cosmos DB | **Amazon DynamoDB** | Consistent NoSQL replacement |
| Azure Blob Storage | **Amazon S3** | Object storage |

---

## Component Architecture

### 1. Authentication & Identity
**Service:** Amazon Cognito User Pools + Identity Pools

- User sign-up/sign-in (email, Google OAuth, phone OTP)
- JWT tokens (ID, Access, Refresh)
- Role-based groups: `organizers`, `attendees`, `admins`
- MFA via SMS or TOTP
- **Cost:** Free for 50,000 MAUs / month

### 2. Real-Time Database
**Service:** Amazon DynamoDB

- Collections: events, venues, zones, alerts, incidents, attendees
- DynamoDB Streams for change-data-capture (replaces Firestore listeners)
- DynamoDB Accelerator (DAX) for sub-millisecond reads on hot paths
- On-demand capacity — no idle cluster cost
- **Cost:** ~$1.25 per million write requests, $0.25 per million reads

### 3. Messaging & Event Streaming
**Service:** Amazon SQS + Amazon SNS + Amazon EventBridge

- **SQS Standard queues** for crowd data ingestion pipeline
- **SNS Topics** for fan-out to ML service, ETL worker, alert system
- **EventBridge** for scheduled tasks (CRON-based forecasting jobs)
- Dead-letter queues (DLQ) for failed message handling
- **Cost:** First 1M SQS requests/month free; SNS first 1M free

### 4. Analytics & Data Warehouse
**Service:** Amazon Athena + AWS Glue + Amazon S3

- Raw event data stored as Parquet in S3
- AWS Glue Data Catalog for schema registry
- Athena for SQL queries on S3 data — pay per query ($5 per TB scanned)
- Glue ETL jobs replace BigQuery scheduled queries
- **Cost:** Far cheaper than BigQuery for moderate query volumes

### 5. Machine Learning
**Service:** Amazon SageMaker

- **SageMaker Serverless Inference** for LSTM crowd forecasting model
- **SageMaker Pipelines** for model training/retraining
- **SageMaker Studio** for experimentation
- Anomaly detection via SageMaker built-in algorithms
- **Cost:** Serverless inference — pay only during inference, scales to zero

### 6. Geospatial Services
**Service:** Amazon Location Service + SageMaker Geospatial

- Maps rendering (Vector tiles)
- Geocoding / reverse geocoding
- Route calculation for evacuation planning
- Geospatial ML (satellite imagery analysis) via SageMaker Geospatial
- **Cost:** $0.50 per 1,000 map tile requests

### 7. Push Notifications
**Service:** Amazon SNS + Amazon Pinpoint

- **SNS** for real-time alert pushes (crowd alerts, safety warnings)
- **Pinpoint** for targeted campaign notifications, attendee engagement
- iOS APNs + Android FCM bridge via SNS
- **Cost:** $0.50 per million SNS mobile push notifications

### 8. Compute — API Server
**Service:** AWS App Runner

- Node.js/Express API server containerised and deployed on App Runner
- Auto-scales from 0 to N instances based on traffic
- No infrastructure management
- **Cost:** $0.064 per vCPU-hour, $0.007 per GB-hour

### 9. Compute — Serverless Functions
**Service:** AWS Lambda

- Crowd data processors
- Alert trigger evaluation
- ETL transformations
- Webhook handlers
- **Cost:** 1M requests + 400,000 GB-seconds free per month

### 10. Compute — ETL Worker
**Service:** AWS Fargate (ECS)

- Containerised ETL worker consumes SQS messages
- Transforms raw sensor/camera data
- Loads into DynamoDB + S3 (Athena)
- Scales dynamically with queue depth
- **Cost:** $0.04048 per vCPU-hour, $0.004445 per GB-hour

### 11. Object Storage
**Service:** Amazon S3

- Video frames / processed images
- ML model artifacts
- Athena data lake (Parquet files)
- Static frontend assets
- **Cost:** $0.023 per GB/month (Standard), lifecycle rules to Glacier for old data

### 12. Secrets & Configuration
**Service:** AWS Secrets Manager + AWS Parameter Store

- API keys, database credentials, ML model endpoints
- Automatic rotation for RDS credentials
- SSM Parameter Store for non-sensitive config (free)
- **Cost:** $0.40 per secret/month (Secrets Manager)

### 13. Monitoring & Observability
**Service:** Amazon CloudWatch + AWS X-Ray

- Application logs, metrics, dashboards
- Distributed tracing with X-Ray
- CloudWatch Alarms → SNS → Lambda for auto-remediation
- **Cost:** 5GB log ingestion free/month; $0.50 per GB after

---

## Network & Security Architecture

```
Internet → Route 53 (DNS) → CloudFront (CDN/WAF) → API Gateway → App Runner/Lambda
                                                              ↓
                                                    VPC (Private Subnet)
                                                    ├── RDS Aurora Serverless
                                                    ├── ElastiCache Redis
                                                    └── ECS Fargate tasks
```

- All services within **AWS VPC** with private subnets
- **AWS WAF** on CloudFront for DDoS protection
- **AWS Shield Standard** included at no extra cost
- **AWS KMS** for encryption at rest
- **VPC Security Groups** restrict inter-service traffic
- **AWS IAM Roles** (least privilege) for all Lambda/Fargate tasks

---

## Infrastructure as Code

All infrastructure is defined using **AWS CDK (TypeScript)** or **Terraform** (see `terraform/` directory).

```bash
# Deploy full stack
cd terraform/
terraform init
terraform plan -var-file="prod.tfvars"
terraform apply
```

---

## Cost Estimate (Monthly — Production)

| Service | Tier | Est. Monthly Cost |
|---|---|---|
| Amazon Cognito | 50k MAU | Free |
| Amazon DynamoDB | On-demand, ~10M R/W ops | ~$15 |
| Amazon SQS + SNS | ~5M messages | ~$2 |
| Amazon S3 | 50GB storage + requests | ~$5 |
| Amazon Athena | 100GB scanned/month | ~$0.50 |
| AWS Glue | 10 DPU-hours/month | ~$4.40 |
| Amazon SageMaker Serverless | ~1M inference calls | ~$20 |
| Amazon Location Service | ~500k map requests | ~$0.25 |
| AWS App Runner | 0.5 vCPU, 1GB, ~50% uptime | ~$15 |
| AWS Lambda | ~5M invocations | Free / ~$0 |
| AWS Fargate (ETL) | ~10 task-hours/month | ~$1 |
| Amazon CloudWatch | Logs + metrics | ~$5 |
| Amazon RDS Aurora Serverless v2 | Dev/staging | ~$0 (pause when idle) |
| Amazon ECR | Container images | ~$0.50 |
| Amazon SNS Push | ~100k notifications | ~$0.05 |
| **Total** | | **~$68/month** |

> With AWS Credits applied, effective cost is $0 until credits are exhausted.

---

## Deployment Regions

**Primary:** `ap-south-1` (Mumbai) — closest to target users in India  
**DR/CDN:** `us-east-1` (N. Virginia) — CloudFront edge nodes globally

---

## Resource Groups

| Group Name | Services Included |
|---|---|
| `drishtix-core` | Cognito, DynamoDB, SQS, SNS |
| `drishtix-compute` | Lambda, App Runner, ECS Fargate |
| `drishtix-data` | S3, Athena, Glue, RDS Aurora |
| `drishtix-ml` | SageMaker, ECR |
| `drishtix-observability` | CloudWatch, X-Ray |

---

## Related Documentation

- [AWS Setup Guide](docs/AWS_SETUP_COMPLETE_GUIDE.md)
- [AWS Infrastructure Verification](docs/AWS_INFRASTRUCTURE_VERIFICATION.md)
- [System Architecture](technical-design/01-SYSTEM_ARCHITECTURE.md)
- [Cost Analysis](technical-design/19-COST_ANALYSIS.md)
- [Cognito Auth Setup](@guides/AWS_COGNITO_AUTH_SETUP_GUIDE.md)
- [DynamoDB Setup](@guides/AWS_DYNAMODB_SETUP_GUIDE.md)
- [SQS/SNS Setup](@guides/AWS_SQS_SNS_SETUP_GUIDE.md)
