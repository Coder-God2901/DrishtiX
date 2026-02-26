# AWS Complete Setup Guide — DrishtiX

> **Cloud:** Amazon Web Services (AWS)  
> **Region:** `ap-south-1` (Mumbai) — primary; `us-east-1` for DR  
> **Strategy:** Serverless-first, pay-per-use with AWS Credits

---

## Overview

This guide walks through setting up the complete DrishtiX platform on AWS from scratch. All infrastructure is managed via AWS CDK (TypeScript) with manual CLI steps included as fallback.

**Time to complete:** ~45 minutes (first time), ~10 minutes (CDK)

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | >= 20 LTS | Application runtime |
| AWS CLI | v2 | CLI access to all services |
| AWS CDK | >= 2.x | Infrastructure as Code |
| Docker | >= 24 | Container builds |
| Python | >= 3.11 | ML service |
| pnpm | >= 8 | Package manager |

### AWS Account Setup

```bash
# Configure AWS CLI with your credentials
aws configure
# AWS Access Key ID: [from IAM]
# AWS Secret Access Key: [from IAM]
# Default region name: ap-south-1
# Default output format: json

# Verify
aws sts get-caller-identity
```

---

## Step 1 — Bootstrap AWS CDK

```bash
# Install CDK globally
npm install -g aws-cdk

# Bootstrap CDK in your account/region
cdk bootstrap aws://YOUR_ACCOUNT_ID/ap-south-1

# Clone repo and install dependencies
git clone https://github.com/techySPHINX/DrishtiX.git
cd DrishtiX
pnpm install
```

---

## Step 2 — Amazon Cognito (Authentication)

Follow [Cognito Auth Setup Guide](@guides/../@guides/AWS_COGNITO_AUTH_SETUP_GUIDE.md) for detailed steps.

Quick setup:
```bash
# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name drishtix-users \
  --auto-verified-attributes email \
  --username-attributes email \
  --region ap-south-1

# Note User Pool ID, then create App Client
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name drishtix-web-client \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region ap-south-1
```

---

## Step 3 — Amazon DynamoDB (Primary Database)

Follow [DynamoDB Setup Guide](@guides/../@guides/AWS_DYNAMODB_SETUP_GUIDE.md) for full table creation.

Quick setup (all 6 tables):
```bash
for table in events venues zones alerts incidents users; do
  aws dynamodb create-table \
    --table-name "drishtix-${table}" \
    --attribute-definitions AttributeName=${table%s}Id,AttributeType=S \
    --key-schema AttributeName=${table%s}Id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-south-1
  echo "Created drishtix-${table}"
done
```

Enable DynamoDB Streams on critical tables:
```bash
for table in alerts incidents; do
  aws dynamodb update-table \
    --table-name "drishtix-${table}" \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
    --region ap-south-1
done
```

---

## Step 4 — Amazon SQS + SNS (Messaging)

Follow [SQS/SNS Setup Guide](@guides/../@guides/AWS_SQS_SNS_SETUP_GUIDE.md) for full configuration.

Quick setup:
```bash
# Create queues
aws sqs create-queue --queue-name drishtix-crowd-data.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true \
  --region ap-south-1

aws sqs create-queue --queue-name drishtix-alerts --region ap-south-1
aws sqs create-queue --queue-name drishtix-etl-jobs --region ap-south-1
aws sqs create-queue --queue-name drishtix-ml-inference --region ap-south-1

# Create SNS topics
aws sns create-topic --name drishtix-alerts --region ap-south-1
aws sns create-topic --name drishtix-crowd-data --region ap-south-1
```

---

## Step 5 — Amazon S3 (Object Storage)

```bash
# Create main data bucket
aws s3 mb s3://drishtix-prod-data --region ap-south-1

# Create frontend bucket
aws s3 mb s3://drishtix-prod-frontend --region ap-south-1

# Create Athena results bucket
aws s3 mb s3://drishtix-athena-results --region ap-south-1

# Enable versioning on data bucket
aws s3api put-bucket-versioning \
  --bucket drishtix-prod-data \
  --versioning-configuration Status=Enabled

# Set lifecycle rule (archive after 90 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket drishtix-prod-data \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "archive-old-data",
      "Status": "Enabled",
      "Filter": {"Prefix": "analytics/"},
      "Transitions": [{"Days": 90, "StorageClass": "GLACIER_IR"}]
    }]
  }'
```

---

## Step 6 — Amazon Athena + AWS Glue (Analytics)

```bash
# Create Glue database
aws glue create-database \
  --database-input Name=drishtix_analytics,Description="DrishtiX Analytics Data Lake" \
  --region ap-south-1

# Create Athena workgroup
aws athena create-work-group \
  --name drishtix-workgroup \
  --configuration '{
    "ResultConfiguration": {
      "OutputLocation": "s3://drishtix-athena-results/"
    },
    "EnforceWorkGroupConfiguration": true
  }' \
  --region ap-south-1

# Create Glue tables from schema files
aws glue create-table \
  --database-name drishtix_analytics \
  --table-input file://athena_schemas/crowd_predictions_schema.json \
  --region ap-south-1

aws glue create-table \
  --database-name drishtix_analytics \
  --table-input file://athena_schemas/event_analytics_schema.json \
  --region ap-south-1

aws glue create-table \
  --database-name drishtix_analytics \
  --table-input file://athena_schemas/incident_logs_schema.json \
  --region ap-south-1
```

---

## Step 7 — Amazon SageMaker (ML Model Deployment)

```bash
# Create SageMaker execution role (if not exists)
aws iam create-role \
  --role-name drishtix-sagemaker-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "sagemaker.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name drishtix-sagemaker-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSageMakerFullAccess

# Upload model artifacts to S3
aws s3 cp ml-service/models/ s3://drishtix-prod-data/ml-models/ --recursive

# Create serverless inference endpoint config
aws sagemaker create-endpoint-config \
  --endpoint-config-name drishtix-crowd-forecaster-config \
  --production-variants '[{
    "VariantName": "AllTraffic",
    "ModelName": "drishtix-lstm-model",
    "ServerlessConfig": {
      "MemorySizeInMB": 2048,
      "MaxConcurrency": 10
    }
  }]' \
  --region ap-south-1

# Deploy endpoint
aws sagemaker create-endpoint \
  --endpoint-name drishtix-crowd-forecaster \
  --endpoint-config-name drishtix-crowd-forecaster-config \
  --region ap-south-1
```

---

## Step 8 — Amazon Location Service (Maps)

```bash
# Create map
aws location create-map \
  --map-name drishtix-map \
  --configuration Style=VectorEsriNavigation \
  --region ap-south-1

# Create place index (geocoding)
aws location create-place-index \
  --index-name drishtix-places \
  --data-source Esri \
  --region ap-south-1

# Create route calculator
aws location create-route-calculator \
  --calculator-name drishtix-routes \
  --data-source Esri \
  --region ap-south-1

# Create geofence collection
aws location create-geofence-collection \
  --collection-name drishtix-venue-geofences \
  --region ap-south-1

# Create API key for frontend map access
aws location create-key \
  --key-name drishtix-map-key \
  --restrictions '{
    "AllowActions": ["geo:GetMap*", "geo:SearchPlaceIndex*"],
    "AllowResources": ["arn:aws:geo:ap-south-1:*:map/drishtix-map", "arn:aws:geo:ap-south-1:*:place-index/drishtix-places"]
  }' \
  --region ap-south-1
```

---

## Step 9 — AWS Secrets Manager

```bash
# Store database credentials
aws secretsmanager create-secret \
  --name drishtix/prod/database \
  --description "DrishtiX PostgreSQL database credentials" \
  --secret-string '{"username":"drishtix_admin","password":"CHANGE_ME","host":"your-rds-endpoint","port":5432,"database":"drishtix"}' \
  --region ap-south-1

# Store API keys
aws secretsmanager create-secret \
  --name drishtix/prod/api-keys \
  --description "DrishtiX external API keys" \
  --secret-string '{"twilio_sid":"","twilio_token":"","sentry_dsn":""}' \
  --region ap-south-1
```

---

## Step 10 — Amazon SNS Push Notifications

Follow [SNS Push Setup Guide](@guides/../@guides/AWS_SNS_PUSH_SETUP_GUIDE.md).

```bash
# Create platform applications
aws sns create-platform-application \
  --name drishtix-android \
  --platform GCM \
  --attributes PlatformCredential=YOUR_FCM_SERVER_KEY \
  --region ap-south-1

aws sns create-platform-application \
  --name drishtix-ios \
  --platform APNS \
  --attributes PlatformCredential=YOUR_APNS_KEY \
  --region ap-south-1
```

---

## Step 11 — Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/drishtix

# AWS Core
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY

# Amazon Cognito
COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_IDENTITY_POOL_ID=ap-south-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_COGNITO_DOMAIN=drishtix.auth.ap-south-1.amazoncognito.com

# Amazon DynamoDB
DYNAMODB_TABLE_PREFIX=drishtix

# Amazon SQS
CROWD_DATA_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT_ID/drishtix-crowd-data.fifo
ALERTS_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT_ID/drishtix-alerts
ETL_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT_ID/drishtix-etl-jobs
ML_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT_ID/drishtix-ml-inference

# Amazon SNS
CROWD_DATA_TOPIC_ARN=arn:aws:sns:ap-south-1:ACCOUNT_ID:drishtix-crowd-data
ALERTS_TOPIC_ARN=arn:aws:sns:ap-south-1:ACCOUNT_ID:drishtix-alerts

# Amazon SageMaker
SAGEMAKER_ENDPOINT_NAME=drishtix-crowd-forecaster
SAGEMAKER_REGION=ap-south-1

# Amazon S3
S3_BUCKET_NAME=drishtix-prod-data
S3_REGION=ap-south-1

# Amazon Location Service
AWS_LOCATION_MAP_NAME=drishtix-map
AWS_LOCATION_PLACE_INDEX=drishtix-places
AWS_LOCATION_ROUTE_CALCULATOR=drishtix-routes
VITE_AWS_MAP_API_KEY=your-api-key

# Amazon Athena
ATHENA_DATABASE=drishtix_analytics
ATHENA_WORKGROUP=drishtix-workgroup
ATHENA_OUTPUT_BUCKET=s3://drishtix-athena-results/
```

---

## Step 12 — Deploy Frontend

```bash
# Build React app
pnpm build

# Deploy to S3
aws s3 sync dist/ s3://drishtix-prod-frontend/ --delete

# Create CloudFront distribution (first time)
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json

# Invalidate cache (after updates)
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Step 13 — Deploy Backend

```bash
# Build Docker image
docker build -t drishtix-api .

# Push to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
docker tag drishtix-api:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/drishtix-api:latest
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/drishtix-api:latest

# Deploy to App Runner
aws apprunner create-service \
  --service-name drishtix-api \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/drishtix-api:latest",
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  }' \
  --region ap-south-1
```

---

## Step 14 — ML Service

```bash
# Setup Python environment
cd ml-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Start local ML server
uvicorn app:app --host 0.0.0.0 --port 8000

# For production, deploy to ECS Fargate
./setup-ml-service.sh  # or setup-ml-service.ps1 on Windows
```

---

## Verification Checklist

Run this script to verify all services:

```bash
./verify-setup.ps1   # Windows
./verify-setup.sh    # Linux/Mac
```

Or manually verify:

| Service | Check Command |
|---|---|
| Cognito | `aws cognito-idp list-user-pools --max-results 10 --region ap-south-1` |
| DynamoDB | `aws dynamodb list-tables --region ap-south-1` |
| SQS | `aws sqs list-queues --queue-name-prefix drishtix --region ap-south-1` |
| SNS | `aws sns list-topics --region ap-south-1` |
| S3 | `aws s3 ls s3://drishtix-prod-data/` |
| SageMaker | `aws sagemaker describe-endpoint --endpoint-name drishtix-crowd-forecaster --region ap-south-1` |
| Location | `aws location list-maps --region ap-south-1` |
| Athena | `aws athena list-databases --catalog-name AwsDataCatalog --region ap-south-1` |

---

## Related Documentation

- [AWS Solution Architecture](../AWS_SOLUTION_ARCHITECTURE.md)
- [AWS Infrastructure Verification](AWS_INFRASTRUCTURE_VERIFICATION.md)
- [Cognito Auth Setup](../@guides/AWS_COGNITO_AUTH_SETUP_GUIDE.md)
- [DynamoDB Setup](../@guides/AWS_DYNAMODB_SETUP_GUIDE.md)
- [SQS/SNS/Location Setup](../@guides/AWS_SQS_SNS_SETUP_GUIDE.md)
