# 🧪 DrishtiX GCP Integration Testing Suite

This directory contains comprehensive integration tests to verify all GCP services are properly configured and working.

## 📋 Test Categories

### 1. **Core GCP Services** (`test-gcp-core.ts`)

- ✅ Service account authentication
- ✅ GCP project access
- ✅ IAM permissions verification

### 2. **Pub/Sub Integration** (`test-pubsub.ts`)

- ✅ Topic creation and listing
- ✅ Message publishing
- ✅ Subscription creation
- ✅ Message receiving
- ✅ Dead letter queues

### 3. **BigQuery Integration** (`test-bigquery.ts`)

- ✅ Dataset creation
- ✅ Table schema validation
- ✅ Data insertion
- ✅ Query execution
- ✅ Streaming inserts

### 4. **Firestore Integration** (`test-firestore.ts`)

- ✅ Database connection
- ✅ Document CRUD operations
- ✅ Security rules validation
- ✅ Composite index verification
- ✅ Real-time listeners

### 5. **Earth Engine Integration** (`test-earth-engine.ts`)

- ✅ Earth Engine authentication
- ✅ Sentinel-2 imagery retrieval
- ✅ SRTM terrain analysis
- ✅ Land cover classification
- ✅ Hazard zone detection

### 6. **Maps Platform Integration** (`test-maps-platform.ts`)

- ✅ Maps JavaScript API
- ✅ Routes API (directions)
- ✅ Places API (POI discovery)
- ✅ Street View API
- ✅ Traffic layer
- ✅ Geocoding

### 7. **Local ML Services** (`test-local-ml.ts`)

- ✅ YOLO vision service (port 8001)
- ✅ ConvLSTM ML service (port 8000)
- ✅ Frame sampling optimization
- ✅ Anomaly detection
- ✅ Crowd forecasting

### 8. **Firebase Integration** (`test-firebase.ts`)

- ✅ Firebase Authentication
- ✅ FCM push notifications
- ✅ Firestore real-time sync
- ✅ MFA/2FA functionality

### 9. **End-to-End Workflow** (`test-e2e-workflow.ts`)

- ✅ Complete event lifecycle
- ✅ Real-time data pipeline
- ✅ ML prediction workflow
- ✅ Alert dispatch system

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
cd setup_testing
npm install

# Set up environment variables
cp ../.env.example .env
# Fill in your actual GCP credentials in .env
```

### Run All Tests

```bash
# Run complete test suite
npm test

# Run specific test category
npm run test:pubsub
npm run test:bigquery
npm run test:firestore
npm run test:earth-engine
npm run test:maps
npm run test:ml
npm run test:firebase
npm run test:e2e
```

### Run Individual Tests

```bash
# Test Pub/Sub only
npx ts-node test-pubsub.ts

# Test BigQuery only
npx ts-node test-bigquery.ts

# Test Earth Engine only
npx ts-node test-earth-engine.ts
```

## 📊 Test Results

Tests will output:

- ✅ **PASS**: Service is properly configured
- ❌ **FAIL**: Configuration issue detected
- ⚠️ **WARN**: Service works but has warnings
- ℹ️ **INFO**: Additional information

### Sample Output

```
🧪 DrishtiX GCP Integration Tests
==================================

Testing Pub/Sub Integration...
✅ PASS: Topics created successfully
✅ PASS: Message published successfully
✅ PASS: Message received successfully
✅ PASS: Dead letter queue configured

Testing BigQuery Integration...
✅ PASS: Dataset created successfully
✅ PASS: Table schema validated
✅ PASS: Data inserted successfully
✅ PASS: Query executed successfully

Testing Earth Engine Integration...
✅ PASS: Earth Engine authenticated
✅ PASS: Sentinel-2 imagery retrieved
✅ PASS: Terrain analysis completed
✅ PASS: Land cover classified

...

==================================
Overall Results:
Total Tests: 47
Passed: 45
Failed: 2
Warnings: 3
Success Rate: 95.7%
```

## 🔧 Troubleshooting

### Common Issues

**1. Authentication Errors**

```bash
Error: Could not load the default credentials
```

**Solution**: Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to valid service account key

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-service-account-key.json
```

**2. Permission Denied**

```bash
Error: Permission 'pubsub.topics.create' denied
```

**Solution**: Grant required IAM roles to service account:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/pubsub.editor"
```

**3. Earth Engine Not Registered**

```bash
Error: Earth Engine access denied
```

**Solution**: Register at https://signup.earthengine.google.com/ and wait for approval (24-48 hours)

**4. Local ML Services Not Running**

```bash
Error: ECONNREFUSED 127.0.0.1:8000
```

**Solution**: Start Docker containers:

```bash
docker-compose up -d ml-service vision-service
```

## 📝 Test Configuration

Edit `test-config.ts` to customize test parameters:

```typescript
export const testConfig = {
  // Timeouts
  defaultTimeout: 30000,
  earthEngineTimeout: 60000,

  // Test data
  testEventId: 'test-event-' + Date.now(),
  testVenueBounds: {
    north: 18.5304,
    south: 18.5104,
    east: 73.8667,
    west: 73.8467,
  },

  // Retry logic
  maxRetries: 3,
  retryDelay: 1000,

  // Cleanup
  cleanupAfterTests: true,
};
```

## 🎯 CI/CD Integration

### GitHub Actions

```yaml
name: GCP Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - run: npm install
      - run: npm test
```

### GitLab CI

```yaml
test:gcp:
  stage: test
  script:
    - npm install
    - npm test
  only:
    - main
    - develop
```

## 📚 Additional Resources

- [GCP Setup Guide](../docs/COMPLETE_SETUP_GUIDE.md)
- [Production Checklist](../docs/PRODUCTION_READY_SUMMARY.md)
- [GCP Integration Verification](../docs/GCP_INTEGRATION_VERIFICATION.md)
- [Firestore Rules](../firestore.rules)
- [Firestore Indexes](../firestore.indexes.json)

## 🆘 Support

If tests fail:

1. Check `test-results.log` for detailed error messages
2. Verify all environment variables in `.env`
3. Ensure GCP services are enabled
4. Check IAM permissions for service account
5. Review [docs/GCP_INTEGRATION_VERIFICATION.md](../docs/GCP_INTEGRATION_VERIFICATION.md)

## 🔐 Security Notes

- **Never commit** `.env` or service account keys
- Use separate GCP projects for testing and production
- Rotate service account keys regularly
- Clean up test resources after testing
- Use least-privilege IAM roles

## 📄 License

MIT License - See [../LICENSE](../LICENSE) for details
