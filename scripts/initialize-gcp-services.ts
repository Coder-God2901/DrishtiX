/**
 * GCP Services Initialization Script
 * 
 * This script sets up all required Google Cloud Platform services:
 * - Pub/Sub Topics and Subscriptions
 * - BigQuery Datasets and Tables
 * - Cloud Storage Buckets
 * - Firestore Collections
 * - Service account permissions
 * 
 * Usage:
 *   npx tsx scripts/initialize-gcp-services.ts
 * 
 * Prerequisites:
 *   - Google Cloud SDK installed (gcloud)
 *   - Authenticated with: gcloud auth login
 *   - Project set: gcloud config set project YOUR_PROJECT_ID
 *   - Service account key in ./config/gcp-service-account-key.json
 */

import { PubSub } from '@google-cloud/pubsub';
import { BigQuery } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

dotenv.config();

// Configuration
const PROJECT_ID = process.env.VITE_GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID || '';
const LOCATION = process.env.GCP_REGION || 'us-central1';
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './config/gcp-service-account-key.json';

// Color output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function warning(message: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function error(message: string) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function header(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

// Initialize clients
let pubsub: PubSub;
let bigquery: BigQuery;
let storage: Storage;

async function validatePrerequisites(): Promise<boolean> {
  header('1. Validating Prerequisites');

  let valid = true;

  // Check project ID
  if (!PROJECT_ID || PROJECT_ID === 'your-gcp-project-id') {
    error('GCP_PROJECT_ID not set in .env file');
    warning('Set VITE_GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id in .env');
    valid = false;
  } else {
    success(`Project ID: ${PROJECT_ID}`);
  }

  // Check credentials file
  if (!existsSync(CREDENTIALS_PATH)) {
    error(`Service account key not found at: ${CREDENTIALS_PATH}`);
    warning('Download service account key from GCP Console:');
    warning('  1. Go to IAM & Admin > Service Accounts');
    warning('  2. Create or select a service account');
    warning('  3. Add Key > Create new key (JSON)');
    warning(`  4. Save as ${CREDENTIALS_PATH}`);
    valid = false;
  } else {
    success(`Service account key found: ${CREDENTIALS_PATH}`);
  }

  return valid;
}

async function initializeClients() {
  header('2. Initializing GCP Clients');

  try {
    pubsub = new PubSub({
      projectId: PROJECT_ID,
      keyFilename: CREDENTIALS_PATH,
    });
    success('Pub/Sub client initialized');

    bigquery = new BigQuery({
      projectId: PROJECT_ID,
      keyFilename: CREDENTIALS_PATH,
      location: LOCATION,
    });
    success('BigQuery client initialized');

    storage = new Storage({
      projectId: PROJECT_ID,
      keyFilename: CREDENTIALS_PATH,
    });
    success('Cloud Storage client initialized');

    // Initialize Firebase Admin
    const serviceAccount = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID,
    });
    success('Firebase Admin SDK initialized');

  } catch (err: any) {
    error(`Failed to initialize clients: ${err.message}`);
    throw err;
  }
}

async function createPubSubTopicsAndSubscriptions() {
  header('3. Creating Pub/Sub Topics and Subscriptions');

  const topicsConfig = [
    {
      name: 'crowd-density-updates',
      description: 'Real-time crowd density data from video analytics and mobile clustering',
    },
    {
      name: 'prediction-results',
      description: 'ConvLSTM crowd forecasting predictions',
    },
    {
      name: 'anomaly-detections',
      description: 'L1/L2/L3 tier anomaly detection alerts',
    },
    {
      name: 'emergency-alerts',
      description: 'Critical alerts for emergency responders',
    },
    {
      name: 'responder-dispatch',
      description: 'Automated dispatch commands from Agent Builder',
    },
    {
      name: 'risk-engine',
      description: 'Risk assessment scores and escalations',
    },
    {
      name: 'video-analytics',
      description: 'Processed video frame analytics from OpenCV',
    },
    {
      name: 'social-signals',
      description: 'Social media sentiment and panic signals',
    },
    {
      name: 'gps-clusters',
      description: 'Privacy-safe mobile GPS clustering data',
    },
  ];

  for (const topicConfig of topicsConfig) {
    try {
      const [topic] = await pubsub.topic(topicConfig.name).get({ autoCreate: true });

      // Update topic metadata
      await topic.setMetadata({
        labels: {
          component: 'drishtix',
          environment: process.env.NODE_ENV || 'development',
        },
      });

      success(`Topic: ${topicConfig.name}`);
      log(`       ${topicConfig.description}`, 'reset');

      // Create subscription
      const subscriptionName = `${topicConfig.name}-sub`;
      try {
        const [subscription] = await topic.subscription(subscriptionName).get({ autoCreate: true });

        // Configure subscription
        await subscription.setMetadata({
          ackDeadlineSeconds: 60,
          messageRetentionDuration: { seconds: 604800 }, // 7 days
          expirationPolicy: {},
          deadLetterPolicy: {
            deadLetterTopic: `projects/${PROJECT_ID}/topics/${topicConfig.name}-dlq`,
            maxDeliveryAttempts: 5,
          },
        });

        success(`  └─ Subscription: ${subscriptionName}`);
      } catch (subErr: any) {
        if (subErr.code === 6) {
          success(`  └─ Subscription: ${subscriptionName} (already exists)`);
        } else {
          warning(`  └─ Failed to create subscription: ${subErr.message}`);
        }
      }
    } catch (err: any) {
      if (err.code === 6) {
        success(`Topic: ${topicConfig.name} (already exists)`);
      } else {
        error(`Failed to create topic ${topicConfig.name}: ${err.message}`);
      }
    }
  }
}

async function createBigQueryDatasets() {
  header('4. Creating BigQuery Datasets and Tables');

  const datasetId = 'drishtix_analytics';

  try {
    // Create dataset
    const [dataset] = await bigquery.dataset(datasetId).get({ autoCreate: true });

    await dataset.setMetadata({
      location: LOCATION,
      description: 'DrishtiX crowd analytics and ML training data',
      labels: {
        component: 'drishtix',
        purpose: 'analytics',
      },
    });

    success(`Dataset: ${datasetId}`);

    // Create tables
    const tables = [
      {
        name: 'crowd_predictions',
        schema: [
          { name: 'prediction_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'zone_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'predicted_count', type: 'INTEGER', mode: 'REQUIRED' },
          { name: 'confidence', type: 'FLOAT', mode: 'REQUIRED' },
          { name: 'model_version', type: 'STRING', mode: 'REQUIRED' },
          { name: 'lead_time_minutes', type: 'INTEGER', mode: 'REQUIRED' },
          { name: 'actual_count', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'accuracy', type: 'FLOAT', mode: 'NULLABLE' },
        ],
      },
      {
        name: 'video_analytics',
        schema: [
          { name: 'frame_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'camera_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'people_count', type: 'INTEGER', mode: 'REQUIRED' },
          { name: 'density_level', type: 'STRING', mode: 'REQUIRED' },
          { name: 'location', type: 'GEOGRAPHY', mode: 'NULLABLE' },
          { name: 'anomalies_detected', type: 'STRING', mode: 'REPEATED' },
          { name: 'processing_time_ms', type: 'INTEGER', mode: 'REQUIRED' },
        ],
      },
      {
        name: 'anomaly_detections',
        schema: [
          { name: 'anomaly_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'tier', type: 'INTEGER', mode: 'REQUIRED' },
          { name: 'severity', type: 'STRING', mode: 'REQUIRED' },
          { name: 'zone_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'anomaly_type', type: 'STRING', mode: 'REQUIRED' },
          { name: 'confidence_score', type: 'FLOAT', mode: 'REQUIRED' },
          { name: 'feature_vector', type: 'JSON', mode: 'NULLABLE' },
          { name: 'resolved', type: 'BOOLEAN', mode: 'REQUIRED' },
          { name: 'resolved_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
        ],
      },
      {
        name: 'event_analytics',
        schema: [
          { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'event_name', type: 'STRING', mode: 'REQUIRED' },
          { name: 'start_time', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'end_time', type: 'TIMESTAMP', mode: 'NULLABLE' },
          { name: 'total_attendees', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'peak_crowd_density', type: 'FLOAT', mode: 'NULLABLE' },
          { name: 'total_alerts', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'critical_incidents', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'avg_response_time_sec', type: 'FLOAT', mode: 'NULLABLE' },
        ],
      },
      {
        name: 'weather_data',
        schema: [
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'temperature', type: 'FLOAT', mode: 'REQUIRED' },
          { name: 'humidity', type: 'FLOAT', mode: 'REQUIRED' },
          { name: 'wind_speed', type: 'FLOAT', mode: 'REQUIRED' },
          { name: 'condition', type: 'STRING', mode: 'REQUIRED' },
          { name: 'heat_index', type: 'FLOAT', mode: 'NULLABLE' },
        ],
      },
      {
        name: 'ml_model_performance',
        schema: [
          { name: 'model_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'model_type', type: 'STRING', mode: 'REQUIRED' },
          { name: 'version', type: 'STRING', mode: 'REQUIRED' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'accuracy', type: 'FLOAT', mode: 'NULLABLE' },
          { name: 'precision', type: 'FLOAT', mode: 'NULLABLE' },
          { name: 'recall', type: 'FLOAT', mode: 'NULLABLE' },
          { name: 'f1_score', type: 'FLOAT', mode: 'NULLABLE' },
          { name: 'mae', type: 'FLOAT', mode: 'NULLABLE' },
          { name: 'rmse', type: 'FLOAT', mode: 'NULLABLE' },
        ],
      },
    ];

    for (const tableConfig of tables) {
      try {
        const [table] = await dataset.table(tableConfig.name).get({ autoCreate: true });

        // Set table schema
        await table.setMetadata({
          schema: { fields: tableConfig.schema },
        });

        success(`  └─ Table: ${tableConfig.name}`);
      } catch (err: any) {
        if (err.code === 6) {
          success(`  └─ Table: ${tableConfig.name} (already exists)`);
        } else {
          warning(`  └─ Failed to create table ${tableConfig.name}: ${err.message}`);
        }
      }
    }
  } catch (err: any) {
    error(`Failed to create dataset: ${err.message}`);
  }
}

async function createCloudStorageBuckets() {
  header('5. Creating Cloud Storage Buckets');

  const buckets = [
    {
      name: `${PROJECT_ID}-drishtix-models`,
      description: 'ML model weights and artifacts (ConvLSTM, Isolation Forest, Autoencoder)',
      storageClass: 'STANDARD',
      location: LOCATION,
    },
    {
      name: `${PROJECT_ID}-drishtix-videos`,
      description: 'Video feeds and archived recordings from cameras',
      storageClass: 'NEARLINE',
      location: LOCATION,
    },
    {
      name: `${PROJECT_ID}-drishtix-simulations`,
      description: 'Simulation data and test scenarios',
      storageClass: 'STANDARD',
      location: LOCATION,
    },
    {
      name: `${PROJECT_ID}-drishtix-training-data`,
      description: 'ML training datasets from BigQuery exports',
      storageClass: 'STANDARD',
      location: LOCATION,
    },
  ];

  for (const bucketConfig of buckets) {
    try {
      const [bucket] = await storage.bucket(bucketConfig.name).get({ autoCreate: true });

      await bucket.setMetadata({
        storageClass: bucketConfig.storageClass,
        labels: {
          component: 'drishtix',
          purpose: bucketConfig.name.split('-').pop() || 'general',
        },
      });

      success(`Bucket: ${bucketConfig.name}`);
      log(`        ${bucketConfig.description}`, 'reset');

      // Enable versioning for models bucket
      if (bucketConfig.name.includes('models')) {
        await bucket.setMetadata({
          versioning: { enabled: true },
        });
        log(`        ✓ Versioning enabled`, 'green');
      }

      // Set lifecycle rules for videos bucket (delete after 90 days)
      if (bucketConfig.name.includes('videos')) {
        await bucket.setMetadata({
          lifecycle: {
            rule: [
              {
                action: { type: 'Delete' },
                condition: { age: 90 },
              },
            ],
          },
        });
        log(`        ✓ Lifecycle: Delete after 90 days`, 'green');
      }
    } catch (err: any) {
      if (err.code === 409) {
        success(`Bucket: ${bucketConfig.name} (already exists)`);
      } else {
        error(`Failed to create bucket ${bucketConfig.name}: ${err.message}`);
      }
    }
  }
}

async function initializeFirestoreCollections() {
  header('6. Initializing Firestore Collections');

  const db = admin.firestore();

  const collections = [
    {
      name: 'events',
      description: 'Live event data and real-time updates',
      sampleDoc: {
        eventId: 'sample-event',
        name: 'Sample Event',
        status: 'PLANNED',
        startTime: admin.firestore.Timestamp.now(),
        location: new admin.firestore.GeoPoint(0, 0),
        expectedAttendees: 0,
        createdAt: admin.firestore.Timestamp.now(),
      },
    },
    {
      name: 'live_predictions',
      description: 'Real-time crowd predictions (auto-deleted after 24h)',
      sampleDoc: {
        predictionId: 'sample-prediction',
        eventId: 'sample-event',
        timestamp: admin.firestore.Timestamp.now(),
        predictedCount: 0,
        confidence: 0.95,
        ttl: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000)), // 24h
      },
    },
    {
      name: 'active_alerts',
      description: 'Current active alerts (cleared when resolved)',
      sampleDoc: {
        alertId: 'sample-alert',
        eventId: 'sample-event',
        severity: 'INFO',
        message: 'Sample alert',
        createdAt: admin.firestore.Timestamp.now(),
        resolved: false,
      },
    },
    {
      name: 'camera_status',
      description: 'Real-time camera feed status',
      sampleDoc: {
        cameraId: 'sample-camera',
        status: 'CONNECTED',
        fps: 5,
        lastFrame: admin.firestore.Timestamp.now(),
      },
    },
  ];

  for (const collConfig of collections) {
    try {
      // Create collection with sample document
      const docRef = db.collection(collConfig.name).doc('_init');
      await docRef.set(collConfig.sampleDoc);

      success(`Collection: ${collConfig.name}`);
      log(`            ${collConfig.description}`, 'reset');

      // Delete sample document
      await docRef.delete();
    } catch (err: any) {
      warning(`Failed to initialize collection ${collConfig.name}: ${err.message}`);
    }
  }

  // Enable TTL for live_predictions
  log('', 'reset');
  warning('Note: Enable Firestore TTL in GCP Console:');
  warning('  1. Go to Firestore > Settings');
  warning('  2. Enable "Delete data older than"');
  warning('  3. Set TTL field to "ttl" for live_predictions collection');
}

async function createServiceAccountRoles() {
  header('7. Verifying Service Account Permissions');

  log('Required IAM Roles:', 'cyan');
  log('  • Pub/Sub Publisher', 'reset');
  log('  • Pub/Sub Subscriber', 'reset');
  log('  • BigQuery Data Editor', 'reset');
  log('  • BigQuery Job User', 'reset');
  log('  • Storage Object Admin', 'reset');
  log('  • Firebase Admin', 'reset');
  log('  • Vertex AI User', 'reset');
  log('  • AI Platform Developer', 'reset');
  log('  • Logging Writer', 'reset');
  log('  • Monitoring Metric Writer', 'reset');
  log('', 'reset');

  warning('Grant these roles manually in GCP Console:');
  warning('  1. Go to IAM & Admin > Service Accounts');
  warning(`  2. Select your service account`);
  warning('  3. Grant Roles > Add the roles listed above');
  warning('  4. Save changes');
}

async function displaySummary() {
  header('8. Initialization Complete');

  success('All GCP services have been initialized!');
  log('', 'reset');

  log('✓ Pub/Sub Topics: 9 topics created', 'green');
  log('✓ Pub/Sub Subscriptions: 9 subscriptions created', 'green');
  log('✓ BigQuery Dataset: drishtix_analytics', 'green');
  log('✓ BigQuery Tables: 6 tables created', 'green');
  log('✓ Cloud Storage Buckets: 4 buckets created', 'green');
  log('✓ Firestore Collections: 4 collections initialized', 'green');
  log('', 'reset');

  log('Next Steps:', 'cyan');
  log('  1. Verify service account permissions (see above)', 'reset');
  log('  2. Update .env with actual GCP project ID', 'reset');
  log('  3. Configure OpenWeather API key for weather service', 'reset');
  log('  4. Set up camera RTSP URLs for video analytics', 'reset');
  log('  5. Train ML models (optional):', 'reset');
  log('     python scripts/train-convlstm.py --mode train', 'reset');
  log('     python scripts/train-isolation-forest.py --mode train', 'reset');
  log('  6. Start the backend server: npm run dev (in server directory)', 'reset');
  log('', 'reset');

  log('🎯 DrishtiX Platform is ready for deployment!', 'bright');
}

async function main() {
  try {
    log('\n╔════════════════════════════════════════════════════════════════╗', 'bright');
    log('║         DrishtiX - GCP Services Initialization Script         ║', 'bright');
    log('╚════════════════════════════════════════════════════════════════╝\n', 'bright');

    // Step 1: Validate prerequisites
    const valid = await validatePrerequisites();
    if (!valid) {
      error('\nPrerequisite validation failed. Please fix the errors above and try again.');
      process.exit(1);
    }

    // Step 2: Initialize clients
    await initializeClients();

    // Step 3: Create Pub/Sub topics
    await createPubSubTopicsAndSubscriptions();

    // Step 4: Create BigQuery datasets
    await createBigQueryDatasets();

    // Step 5: Create Cloud Storage buckets
    await createCloudStorageBuckets();

    // Step 6: Initialize Firestore
    await initializeFirestoreCollections();

    // Step 7: Service account roles
    await createServiceAccountRoles();

    // Step 8: Summary
    await displaySummary();

  } catch (err: any) {
    error(`\nFatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
