/**
 * DrishtiX Setup Script
 * Validates and initializes Google Cloud services
 */

import { gcpConfig, validateGCPConfig } from '../server/config/gcp.config';
import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
import { BigQuery } from '@google-cloud/bigquery';

async function setupDrishtiX() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║              🎯 DrishtiX Platform Setup                       ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Step 1: Validate configuration
  console.log('Step 1: Validating configuration...');
  const validation = validateGCPConfig();

  if (!validation.valid) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach(err => console.error(`   - ${err}`));
    console.log('\nPlease update your .env file with the required values.');
    console.log('See .env.example for reference.');
    return;
  }
  console.log('✓ Configuration valid');

  // Step 2: Test GCP credentials
  console.log('\nStep 2: Testing GCP credentials...');
  try {
    const pubsub = new PubSub({
      projectId: gcpConfig.projectId,
      keyFilename: gcpConfig.credentials,
    });

    // Try to list topics (requires basic permissions)
    await pubsub.getTopics();
    console.log('✓ GCP credentials valid');
  } catch (error) {
    console.error('❌ GCP credentials invalid:', error);
    console.log('\nPlease check:');
    console.log('  1. GOOGLE_APPLICATION_CREDENTIALS path is correct');
    console.log('  2. Service account has necessary permissions');
    console.log('  3. APIs are enabled in GCP console');
    return;
  }

  // Step 3: Create Pub/Sub topics
  console.log('\nStep 3: Creating Pub/Sub topics...');
  try {
    const pubsub = new PubSub({
      projectId: gcpConfig.projectId,
      keyFilename: gcpConfig.credentials,
    });

    const topics = [
      gcpConfig.pubsub.topics.crowdData,
      gcpConfig.pubsub.topics.predictions,
      gcpConfig.pubsub.topics.anomalies,
      gcpConfig.pubsub.topics.alerts,
      gcpConfig.pubsub.topics.dispatch,
    ];

    for (const topicName of topics) {
      const topic = pubsub.topic(topicName);
      const [exists] = await topic.exists();

      if (!exists) {
        await topic.create();
        console.log(`  ✓ Created topic: ${topicName}`);
      } else {
        console.log(`  ✓ Topic exists: ${topicName}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating Pub/Sub topics:', error);
  }

  // Step 4: Create Cloud Storage buckets
  console.log('\nStep 4: Creating Cloud Storage buckets...');
  try {
    const storage = new Storage({
      projectId: gcpConfig.projectId,
      keyFilename: gcpConfig.credentials,
    });

    const buckets = [
      gcpConfig.storage.buckets.simulations,
      gcpConfig.storage.buckets.models,
      gcpConfig.storage.buckets.videos,
    ];

    for (const bucketName of buckets) {
      const bucket = storage.bucket(bucketName);
      const [exists] = await bucket.exists();

      if (!exists) {
        await storage.createBucket(bucketName, {
          location: gcpConfig.location,
          storageClass: 'STANDARD',
        });
        console.log(`  ✓ Created bucket: ${bucketName}`);
      } else {
        console.log(`  ✓ Bucket exists: ${bucketName}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating storage buckets:', error);
  }

  // Step 5: Create BigQuery dataset
  console.log('\nStep 5: Creating BigQuery dataset...');
  try {
    const bigquery = new BigQuery({
      projectId: gcpConfig.projectId,
      keyFilename: gcpConfig.credentials,
    });

    const dataset = bigquery.dataset(gcpConfig.bigquery.dataset);
    const [exists] = await dataset.exists();

    if (!exists) {
      await bigquery.createDataset(gcpConfig.bigquery.dataset, {
        location: gcpConfig.location,
      });
      console.log(`  ✓ Created dataset: ${gcpConfig.bigquery.dataset}`);
    } else {
      console.log(`  ✓ Dataset exists: ${gcpConfig.bigquery.dataset}`);
    }

    // Create tables
    const tables = [
      {
        name: gcpConfig.bigquery.tables.predictions,
        schema: [
          { name: 'timestamp', type: 'TIMESTAMP' },
          { name: 'event_id', type: 'STRING' },
          { name: 'forecast_time', type: 'TIMESTAMP' },
          { name: 'risk_level', type: 'STRING' },
          { name: 'predicted_density', type: 'FLOAT' },
          { name: 'confidence', type: 'FLOAT' },
          { name: 'hotspots', type: 'JSON' },
        ],
      },
      {
        name: gcpConfig.bigquery.tables.incidents,
        schema: [
          { name: 'timestamp', type: 'TIMESTAMP' },
          { name: 'event_id', type: 'STRING' },
          { name: 'incident_type', type: 'STRING' },
          { name: 'severity', type: 'STRING' },
          { name: 'location', type: 'GEOGRAPHY' },
        ],
      },
    ];

    for (const tableConfig of tables) {
      const table = dataset.table(tableConfig.name);
      const [tableExists] = await table.exists();

      if (!tableExists) {
        await dataset.createTable(tableConfig.name, {
          schema: tableConfig.schema,
        });
        console.log(`  ✓ Created table: ${tableConfig.name}`);
      } else {
        console.log(`  ✓ Table exists: ${tableConfig.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating BigQuery dataset:', error);
  }

  // Step 6: Test Gemini API
  console.log('\nStep 6: Testing Gemini API...');
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(gcpConfig.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent('Test');
    const response = await result.response;

    if (response.text()) {
      console.log('✓ Gemini API working');
    }
  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    console.log('   Please check your GEMINI_API_KEY in .env');
  }

  // Step 7: Summary
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  ✅ DrishtiX Setup Complete                   ║
╠════════════════════════════════════════════════════════════════╣
║  Next steps:                                                   ║
║                                                                ║
║  1. Run migrations:                                            ║
║     pnpm db:migrate                                            ║
║                                                                ║
║  2. Start the development server:                             ║
║     pnpm dev:all                                               ║
║                                                                ║
║  3. Visit the dashboard:                                       ║
║     http://localhost:5173                                      ║
║                                                                ║
║  4. Test the API:                                              ║
║     http://localhost:3001/health                               ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

// Run setup
setupDrishtiX().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});
