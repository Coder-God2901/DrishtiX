# AWS Infrastructure Verification — DrishtiX

> **Purpose:** Verify all AWS services are correctly configured and healthy  
> **Run after:** Initial setup or infrastructure changes  
> **Region:** `ap-south-1` (Mumbai)

---

## Quick Verification Script

```bash
#!/bin/bash
# Usage: bash verify-aws-services.sh

REGION="ap-south-1"
TABLE_PREFIX="drishtix"
QUEUE_PREFIX="drishtix"
BUCKET="drishtix-prod-data"
ENDPOINT="drishtix-crowd-forecaster"
MAP_NAME="drishtix-map"

echo "=== DrishtiX AWS Infrastructure Verification ==="
echo ""

# 1. Cognito
echo "[1] Amazon Cognito..."
POOLS=$(aws cognito-idp list-user-pools --max-results 20 --region $REGION --query "UserPools[?contains(Name,'drishtix')].Name" --output text)
[ -n "$POOLS" ] && echo "  ✅ User Pools: $POOLS" || echo "  ❌ No drishtix User Pools found"

# 2. DynamoDB Tables
echo "[2] Amazon DynamoDB..."
TABLES=$(aws dynamodb list-tables --region $REGION --query "TableNames[?starts_with(@,'drishtix')]" --output text)
for t in events venues zones alerts incidents users; do
  echo "$TABLES" | grep -q "drishtix-${t}" && echo "  ✅ drishtix-${t}" || echo "  ❌ MISSING: drishtix-${t}"
done

# 3. SQS Queues
echo "[3] Amazon SQS..."
for q in "drishtix-crowd-data.fifo" "drishtix-alerts" "drishtix-etl-jobs" "drishtix-ml-inference"; do
  URL=$(aws sqs get-queue-url --queue-name "$q" --region $REGION --query QueueUrl --output text 2>/dev/null)
  [ -n "$URL" ] && echo "  ✅ $q" || echo "  ❌ MISSING: $q"
done

# 4. SNS Topics
echo "[4] Amazon SNS..."
TOPICS=$(aws sns list-topics --region $REGION --query "Topics[*].TopicArn" --output text)
for t in "drishtix-alerts" "drishtix-crowd-data"; do
  echo "$TOPICS" | grep -q "$t" && echo "  ✅ $t" || echo "  ❌ MISSING: $t"
done

# 5. S3 Buckets
echo "[5] Amazon S3..."
for b in "drishtix-prod-data" "drishtix-prod-frontend" "drishtix-athena-results"; do
  aws s3 ls "s3://$b" > /dev/null 2>&1 && echo "  ✅ $b" || echo "  ❌ MISSING: $b"
done

# 6. SageMaker Endpoint
echo "[6] Amazon SageMaker..."
STATUS=$(aws sagemaker describe-endpoint --endpoint-name $ENDPOINT --region $REGION --query "EndpointStatus" --output text 2>/dev/null)
[ "$STATUS" = "InService" ] && echo "  ✅ $ENDPOINT (InService)" || echo "  ⚠️  $ENDPOINT status: ${STATUS:-NOT FOUND}"

# 7. Location Service
echo "[7] Amazon Location Service..."
MAP=$(aws location describe-map --map-name $MAP_NAME --region $REGION --query "MapName" --output text 2>/dev/null)
[ "$MAP" = "$MAP_NAME" ] && echo "  ✅ Map: $MAP_NAME" || echo "  ❌ MISSING: $MAP_NAME"
PLACE=$(aws location describe-place-index --index-name drishtix-places --region $REGION --query "IndexName" --output text 2>/dev/null)
[ "$PLACE" = "drishtix-places" ] && echo "  ✅ Place Index: drishtix-places" || echo "  ❌ MISSING: drishtix-places"

# 8. Athena
echo "[8] Amazon Athena..."
DB=$(aws athena list-databases --catalog-name AwsDataCatalog --region $REGION --query "DatabaseList[?Name=='drishtix_analytics'].Name" --output text 2>/dev/null)
[ "$DB" = "drishtix_analytics" ] && echo "  ✅ Database: drishtix_analytics" || echo "  ❌ MISSING: drishtix_analytics"

echo ""
echo "=== Verification Complete ==="
```

---

## Service-by-Service Health Checks

### 1. Amazon Cognito

```bash
# Check User Pool exists
aws cognito-idp list-user-pools --max-results 20 --region ap-south-1 \
  --query "UserPools[?contains(Name,'drishtix')]"

# Check App Client
aws cognito-idp list-user-pool-clients \
  --user-pool-id YOUR_USER_POOL_ID \
  --region ap-south-1

# Test creating a user (will send verification email)
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username verify-test@drishtix.com \
  --temporary-password Test@1234! \
  --region ap-south-1

# Verify JWT token generation
aws cognito-idp initiate-auth \
  --client-id YOUR_CLIENT_ID \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=verify-test@drishtix.com,PASSWORD=Test@1234! \
  --region ap-south-1
```

**Expected:** HTTP 200 with `AuthenticationResult.IdToken`  
✅ **Pass criteria:** IdToken returned, decoded JWT contains `cognito:username`

---

### 2. Amazon DynamoDB

```bash
# Check all tables exist and are ACTIVE
aws dynamodb list-tables --region ap-south-1 --query "TableNames[?starts_with(@,'drishtix')]"

# Verify table status
aws dynamodb describe-table --table-name drishtix-events --region ap-south-1 \
  --query "Table.{Status:TableStatus, Items:ItemCount, StreamEnabled:StreamSpecification.StreamEnabled}"

# Test write/read
aws dynamodb put-item \
  --table-name drishtix-events \
  --item '{"eventId":{"S":"test-verify-001"},"name":{"S":"Verification Test"},"status":{"S":"test"}}' \
  --region ap-south-1

aws dynamodb get-item \
  --table-name drishtix-events \
  --key '{"eventId":{"S":"test-verify-001"}}' \
  --region ap-south-1

# Cleanup
aws dynamodb delete-item \
  --table-name drishtix-events \
  --key '{"eventId":{"S":"test-verify-001"}}' \
  --region ap-south-1
```

**Expected:** GetItem returns the item  
✅ **Pass criteria:** `Item.name.S == "Verification Test"`

---

### 3. Amazon SQS

```bash
# Check queues exist
aws sqs list-queues --queue-name-prefix drishtix --region ap-south-1

# Test send/receive message
QUEUE_URL=$(aws sqs get-queue-url --queue-name drishtix-alerts --query QueueUrl --output text --region ap-south-1)

aws sqs send-message \
  --queue-url "$QUEUE_URL" \
  --message-body '{"type":"VERIFICATION_TEST","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
  --region ap-south-1

aws sqs receive-message \
  --queue-url "$QUEUE_URL" \
  --max-number-of-messages 1 \
  --region ap-south-1
```

✅ **Pass criteria:** Message received with correct `Body` JSON

---

### 4. Amazon SNS

```bash
# Check topics
aws sns list-topics --region ap-south-1 --query "Topics[*].TopicArn"

# Test publish
TOPIC_ARN=$(aws sns list-topics --region ap-south-1 --query "Topics[?contains(TopicArn,'drishtix-alerts')].TopicArn" --output text)

aws sns publish \
  --topic-arn "$TOPIC_ARN" \
  --message '{"type":"VERIFICATION","message":"SNS test from verify script"}' \
  --subject "DrishtiX Verification" \
  --region ap-south-1
```

✅ **Pass criteria:** `MessageId` returned in publish response

---

### 5. Amazon S3

```bash
# Check buckets
aws s3 ls | grep drishtix

# Test upload/download
echo '{"test":"verification"}' > /tmp/drishtix-test.json
aws s3 cp /tmp/drishtix-test.json s3://drishtix-prod-data/verify/test.json
aws s3 cp s3://drishtix-prod-data/verify/test.json /tmp/drishtix-test-dl.json
cat /tmp/drishtix-test-dl.json
aws s3 rm s3://drishtix-prod-data/verify/test.json
```

✅ **Pass criteria:** Downloaded file matches uploaded content

---

### 6. Amazon SageMaker

```bash
# Check endpoint status
aws sagemaker describe-endpoint --endpoint-name drishtix-crowd-forecaster --region ap-south-1 \
  --query "{Status:EndpointStatus,Updated:LastModifiedTime}"

# Test inference (serverless endpoint)
aws sagemaker-runtime invoke-endpoint \
  --endpoint-name drishtix-crowd-forecaster \
  --content-type application/json \
  --body '{"zone_id":"z-001","historical_density":[0.4,0.5,0.6,0.65,0.7,0.72,0.75,0.78,0.80,0.82],"horizon_minutes":15}' \
  --region ap-south-1 \
  /tmp/sagemaker-response.json 
cat /tmp/sagemaker-response.json
```

✅ **Pass criteria:** Response contains `predicted_density` field

---

### 7. Amazon Location Service

```bash
# Check map resource
aws location describe-map --map-name drishtix-map --region ap-south-1

# Test geocoding
aws location search-place-index-for-text \
  --index-name drishtix-places \
  --text "Mumbai Central Station, India" \
  --max-results 1 \
  --region ap-south-1

# Test route calculation
aws location calculate-route \
  --calculator-name drishtix-routes \
  --departure-position "[72.8356,19.0176]" \
  --destination-position "[72.8777,19.0760]" \
  --region ap-south-1
```

✅ **Pass criteria:** Geocoding returns a result; route calculation returns distance in km

---

### 8. Amazon Athena

```bash
# Check database
aws athena list-databases --catalog-name AwsDataCatalog --region ap-south-1

# Run test query
QUERY_ID=$(aws athena start-query-execution \
  --query-string "SELECT COUNT(*) FROM drishtix_analytics.crowd_predictions LIMIT 1" \
  --work-group drishtix-workgroup \
  --region ap-south-1 \
  --query QueryExecutionId --output text)

sleep 5

aws athena get-query-results --query-execution-id "$QUERY_ID" --region ap-south-1
```

✅ **Pass criteria:** Query execution succeeds (SUCCEEDED status)

---

## Integration Connectivity Test

Test end-to-end data flow:

```bash
# 1. Publish crowd data to SNS
TOPIC_ARN="arn:aws:sns:ap-south-1:ACCOUNT_ID:drishtix-crowd-data"
aws sns publish \
  --topic-arn "$TOPIC_ARN" \
  --message '{"zoneId":"z-001","eventId":"evt-001","currentCount":450,"maxCapacity":500,"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
  --region ap-south-1

# 2. Check SQS ML inference queue received the message
aws sqs receive-message \
  --queue-url "$(aws sqs get-queue-url --queue-name drishtix-ml-inference --query QueueUrl --output text --region ap-south-1)" \
  --region ap-south-1

# 3. Verify DynamoDB received the processed data
aws dynamodb scan \
  --table-name drishtix-crowd-metrics \
  --filter-expression "zoneId = :z" \
  --expression-attribute-values '{":z":{"S":"z-001"}}' \
  --limit 1 \
  --region ap-south-1
```

---

## Cost Validation

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --region us-east-1  # Cost Explorer only in us-east-1
```

Expected monthly cost: **~$68/month** (production) or **$0** (with AWS Credits)

---

## Verification Summary Checklist

| Service | Status | Notes |
|---|---|---|
| Amazon Cognito | ☐ | User Pool + App Client |
| Amazon DynamoDB | ☐ | 6 tables, streams enabled |
| Amazon SQS | ☐ | 4 queues (1 FIFO) |
| Amazon SNS | ☐ | 2 topics |
| Amazon S3 | ☐ | 3 buckets |
| Amazon SageMaker | ☐ | Serverless endpoint InService |
| Amazon Location Service | ☐ | Map + Place Index + Routes |
| Amazon Athena | ☐ | Database + 3 tables |
| AWS Glue | ☐ | Data Catalog entries |
| Amazon CloudWatch | ☐ | Log groups + alarms |

---

## Related Documentation

- [AWS Setup Complete Guide](AWS_SETUP_COMPLETE_GUIDE.md)
- [AWS Solution Architecture](../AWS_SOLUTION_ARCHITECTURE.md)
- [Cognito Auth Setup](../@guides/AWS_COGNITO_AUTH_SETUP_GUIDE.md)
- [DynamoDB Setup](../@guides/AWS_DYNAMODB_SETUP_GUIDE.md)
