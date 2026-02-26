# AWS DynamoDB Setup Guide

> **Replaces:** Google Firestore  
> **Service:** Amazon DynamoDB (On-Demand mode)  
> **Cost:** Pay per request — no provisioned throughput cost when idle

---

## Prerequisites

- AWS Account with credits
- AWS CLI v2 configured (`aws configure`)
- IAM permissions: `dynamodb:*`
- Region: `ap-south-1` (Mumbai)

---

## DynamoDB vs Firestore — Key Differences

| Concept | Firestore | DynamoDB |
|---|---|---|
| Collections | Collections | Tables |
| Documents | Documents | Items |
| Auto-ID | Auto-generated | Must specify partition key |
| Real-time listeners | `onSnapshot` | DynamoDB Streams + Lambda |
| Queries | Flexible queries | Query by PK + SK or GSI |
| Pricing | Per read/write op | Per read/write request |

---

## Step 1 — Create DynamoDB Tables

### Events Table

```bash
aws dynamodb create-table \
  --table-name drishtix-events \
  --attribute-definitions \
    AttributeName=eventId,AttributeType=S \
    AttributeName=organizerId,AttributeType=S \
    AttributeName=startTime,AttributeType=S \
  --key-schema \
    AttributeName=eventId,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "organizerId-startTime-index",
      "KeySchema": [
        {"AttributeName":"organizerId","KeyType":"HASH"},
        {"AttributeName":"startTime","KeyType":"RANGE"}
      ],
      "Projection": {"ProjectionType":"ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### Venues Table

```bash
aws dynamodb create-table \
  --table-name drishtix-venues \
  --attribute-definitions \
    AttributeName=venueId,AttributeType=S \
  --key-schema AttributeName=venueId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### Zones Table

```bash
aws dynamodb create-table \
  --table-name drishtix-zones \
  --attribute-definitions \
    AttributeName=zoneId,AttributeType=S \
    AttributeName=eventId,AttributeType=S \
  --key-schema \
    AttributeName=zoneId,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "eventId-index",
      "KeySchema": [{"AttributeName":"eventId","KeyType":"HASH"}],
      "Projection": {"ProjectionType":"ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### Alerts Table

```bash
aws dynamodb create-table \
  --table-name drishtix-alerts \
  --attribute-definitions \
    AttributeName=alertId,AttributeType=S \
    AttributeName=eventId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=alertId,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "eventId-createdAt-index",
      "KeySchema": [
        {"AttributeName":"eventId","KeyType":"HASH"},
        {"AttributeName":"createdAt","KeyType":"RANGE"}
      ],
      "Projection": {"ProjectionType":"ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### Incidents Table

```bash
aws dynamodb create-table \
  --table-name drishtix-incidents \
  --attribute-definitions \
    AttributeName=incidentId,AttributeType=S \
    AttributeName=eventId,AttributeType=S \
  --key-schema AttributeName=incidentId,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "eventId-index",
      "KeySchema": [{"AttributeName":"eventId","KeyType":"HASH"}],
      "Projection": {"ProjectionType":"ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### Crowd Metrics Table (time-series)

```bash
aws dynamodb create-table \
  --table-name drishtix-crowd-metrics \
  --attribute-definitions \
    AttributeName=zoneId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=zoneId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

Enable TTL on crowd metrics (auto-expire old data):
```bash
aws dynamodb update-time-to-live \
  --table-name drishtix-crowd-metrics \
  --time-to-live-specification Enabled=true,AttributeName=ttl \
  --region ap-south-1
```

### Users / Attendees Table

```bash
aws dynamodb create-table \
  --table-name drishtix-users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "email-index",
      "KeySchema": [{"AttributeName":"email","KeyType":"HASH"}],
      "Projection": {"ProjectionType":"ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

---

## Step 2 — Enable DynamoDB Streams (Real-Time Change Detection)

DynamoDB Streams replace Firestore `onSnapshot` real-time listeners by triggering Lambda functions on data changes.

```bash
# Enable streams on the alerts table
aws dynamodb update-table \
  --table-name drishtix-alerts \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region ap-south-1
```

Lambda trigger example (alert broadcast):
```typescript
import { DynamoDBStreamEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({ region: 'ap-south-1' });

export async function handler(event: DynamoDBStreamEvent) {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const alert = record.dynamodb?.NewImage;
      await sns.send(new PublishCommand({
        TopicArn: process.env.ALERT_TOPIC_ARN,
        Message: JSON.stringify(alert),
        Subject: 'New Alert'
      }));
    }
  }
}
```

---

## Step 3 — Node.js SDK Integration

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### DynamoDB Client Setup (`server/lib/dynamodb.ts`)

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});
```

### CRUD Operations

```typescript
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from './dynamodb';

// Create / Upsert
await ddb.send(new PutCommand({
  TableName: 'drishtix-events',
  Item: { eventId: 'evt-001', name: 'Concert 2026', organizerId: 'org-123', startTime: '2026-03-01T18:00:00Z' }
}));

// Read by primary key
const { Item } = await ddb.send(new GetCommand({
  TableName: 'drishtix-events',
  Key: { eventId: 'evt-001' }
}));

// Query by GSI (organizer's events)
const { Items } = await ddb.send(new QueryCommand({
  TableName: 'drishtix-events',
  IndexName: 'organizerId-startTime-index',
  KeyConditionExpression: 'organizerId = :oid AND startTime > :now',
  ExpressionAttributeValues: { ':oid': 'org-123', ':now': new Date().toISOString() }
}));

// Update
await ddb.send(new UpdateCommand({
  TableName: 'drishtix-events',
  Key: { eventId: 'evt-001' },
  UpdateExpression: 'SET #status = :s, updatedAt = :t',
  ExpressionAttributeNames: { '#status': 'status' },
  ExpressionAttributeValues: { ':s': 'active', ':t': new Date().toISOString() }
}));

// Delete
await ddb.send(new DeleteCommand({
  TableName: 'drishtix-events',
  Key: { eventId: 'evt-001' }
}));
```

---

## Step 4 — Security Rules (IAM Policies)

Replace Firestore Security Rules with **IAM resource-based policies** on DynamoDB.

**Organizer access policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:Query"],
      "Resource": [
        "arn:aws:dynamodb:ap-south-1:*:table/drishtix-events",
        "arn:aws:dynamodb:ap-south-1:*:table/drishtix-events/index/*"
      ],
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"]
        }
      }
    }
  ]
}
```

---

## Step 5 — Enable Point-in-Time Recovery (PITR)

```bash
for table in drishtix-events drishtix-venues drishtix-zones drishtix-alerts drishtix-incidents drishtix-users; do
  aws dynamodb update-continuous-backups \
    --table-name $table \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region ap-south-1
done
```

---

## Verification

```bash
# List all DrishtiX tables
aws dynamodb list-tables --region ap-south-1 | grep drishtix

# Check table status
aws dynamodb describe-table --table-name drishtix-events --region ap-south-1 | jq '.Table.TableStatus'
```

Expected output:
```
ACTIVE
```

---

## Related Documentation

- [Cognito Auth Setup](@guides/AWS_COGNITO_AUTH_SETUP_GUIDE.md)
- [SQS/SNS Messaging](@guides/AWS_SQS_SNS_SETUP_GUIDE.md)
- [AWS Solution Architecture](../AWS_SOLUTION_ARCHITECTURE.md)
