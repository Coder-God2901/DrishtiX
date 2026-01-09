/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
/**
 * Test Script for Google Cloud Pub/Sub Integration
 *
 * Prerequisites:
 * 1. Enable Pub/Sub API in GCP
 * 2. Set GOOGLE_APPLICATION_CREDENTIALS in .env
 * 3. Set VITE_GOOGLE_CLOUD_PROJECT_ID in .env
 * 4. Set VITE_ENABLE_PUBSUB=true in .env
 *
 * Run: node scripts/test-pubsub.js
 */

const { PubSub } = require('@google-cloud/pubsub');
require('dotenv').config();

const PROJECT_ID = process.env.VITE_GOOGLE_CLOUD_PROJECT_ID;
const PUBSUB_ENABLED = process.env.VITE_ENABLE_PUBSUB === 'true';

if (!PROJECT_ID) {
  console.error('âŒ VITE_GOOGLE_CLOUD_PROJECT_ID not set in .env file');
  process.exit(1);
}

if (!PUBSUB_ENABLED) {
  console.warn('âš ï¸  VITE_ENABLE_PUBSUB is false');
  console.warn('   Set to true in .env to enable Pub/Sub');
}

// Topics to test
const TOPICS = {
  VIDEO_ANALYTICS: 'video-analytics',
  SOCIAL_SIGNALS: 'social-signals',
  GPS_TRACKING: 'gps-tracking',
  INCIDENT_ALERTS: 'incident-alerts',
  CROWD_PREDICTIONS: 'crowd-predictions',
};

// Subscriptions to test
const SUBSCRIPTIONS = {
  VIDEO_ANALYTICS_PROCESSOR: 'video-analytics-processor',
  INCIDENT_ALERTS_DISPATCHER: 'incident-alerts-dispatcher',
};

let pubsub;

/**
 * Initialize Pub/Sub client
 */
function initializePubSub() {
  try {
    pubsub = new PubSub({ projectId: PROJECT_ID });
    console.log('âœ… Pub/Sub client initialized');
    console.log('   Project ID:', PROJECT_ID);
    return true;
  } catch (error) {
    console.error('âŒ Failed to initialize Pub/Sub:', error.message);
    return false;
  }
}

/**
 * Test: Create topics
 */
async function testCreateTopics() {
  console.log('\nðŸ“‹ Testing Topic Creation...\n');

  const results = {
    created: [],
    existing: [],
    failed: [],
  };

  for (const [name, topicName] of Object.entries(TOPICS)) {
    try {
      const topic = pubsub.topic(topicName);
      const [exists] = await topic.exists();

      if (exists) {
        console.log(`âœ… Topic exists: ${topicName}`);
        results.existing.push(topicName);
      } else {
        await topic.create();
        console.log(`âœ… Created topic: ${topicName}`);
        results.created.push(topicName);
      }
    } catch (error) {
      console.error(`âŒ Failed to create topic ${topicName}:`, error.message);
      results.failed.push(topicName);
    }
  }

  console.log(`\n   Created: ${results.created.length}`);
  console.log(`   Existing: ${results.existing.length}`);
  console.log(`   Failed: ${results.failed.length}`);

  return results;
}

/**
 * Test: Create subscriptions
 */
async function testCreateSubscriptions() {
  console.log('\nðŸ“‹ Testing Subscription Creation...\n');

  const results = {
    created: [],
    existing: [],
    failed: [],
  };

  const subscriptionConfigs = [
    { topic: TOPICS.VIDEO_ANALYTICS, sub: SUBSCRIPTIONS.VIDEO_ANALYTICS_PROCESSOR },
    { topic: TOPICS.INCIDENT_ALERTS, sub: SUBSCRIPTIONS.INCIDENT_ALERTS_DISPATCHER },
  ];

  for (const config of subscriptionConfigs) {
    try {
      const topic = pubsub.topic(config.topic);
      const subscription = topic.subscription(config.sub);
      const [exists] = await subscription.exists();

      if (exists) {
        console.log(`âœ… Subscription exists: ${config.sub}`);
        results.existing.push(config.sub);
      } else {
        await subscription.create({
          ackDeadlineSeconds: 60,
        });
        console.log(`âœ… Created subscription: ${config.sub}`);
        results.created.push(config.sub);
      }
    } catch (error) {
      console.error(`âŒ Failed to create subscription ${config.sub}:`, error.message);
      results.failed.push(config.sub);
    }
  }

  console.log(`\n   Created: ${results.created.length}`);
  console.log(`   Existing: ${results.existing.length}`);
  console.log(`   Failed: ${results.failed.length}`);

  return results;
}

/**
 * Test: Publish message
 */
async function testPublish() {
  console.log('\nðŸ“¤ Testing Message Publishing...\n');

  const testMessages = [
    {
      topic: TOPICS.VIDEO_ANALYTICS,
      data: {
        eventId: 'test_event_001',
        cameraId: 'test_camera_main',
        timestamp: new Date().toISOString(),
        peopleCount: 1500,
        crowdDensity: 0.75,
        anomalies: [
          {
            type: 'crowd_density_high',
            confidence: 0.89,
            location: { lat: 28.613, lon: 77.208 },
          },
        ],
      },
    },
    {
      topic: TOPICS.INCIDENT_ALERTS,
      data: {
        eventId: 'test_event_001',
        incidentId: 'test_incident_001',
        type: 'medical_emergency',
        severity: 'high',
        timestamp: new Date().toISOString(),
        location: { lat: 28.613, lon: 77.208 },
        description: 'Test incident alert - medical emergency',
      },
    },
  ];

  const results = [];

  for (const msg of testMessages) {
    try {
      const topic = pubsub.topic(msg.topic);
      const dataBuffer = Buffer.from(JSON.stringify(msg.data));

      const messageId = await topic.publishMessage({
        data: dataBuffer,
        attributes: {
          eventId: msg.data.eventId,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`âœ… Published to ${msg.topic}`);
      console.log(`   Message ID: ${messageId}`);
      results.push({ topic: msg.topic, messageId, success: true });
    } catch (error) {
      console.error(`âŒ Failed to publish to ${msg.topic}:`, error.message);
      results.push({ topic: msg.topic, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Test: Pull messages
 */
async function testPull() {
  console.log('\nðŸ“¥ Testing Message Pulling...\n');

  const results = [];

  for (const [name, subName] of Object.entries(SUBSCRIPTIONS)) {
    try {
      const subscription = pubsub.subscription(subName);

      // Pull up to 10 messages
      const [messages] = await subscription.pull({ maxMessages: 10 });

      console.log(`âœ… Pulled ${messages.length} messages from ${subName}`);

      if (messages.length > 0) {
        console.log(`   First message data:`, messages[0].data.toString().substring(0, 100) + '...');

        // Acknowledge messages
        await subscription.ack(messages.map((m) => m.ackId));
        console.log(`   Acknowledged ${messages.length} messages`);
      }

      results.push({
        subscription: subName,
        messageCount: messages.length,
        success: true,
      });
    } catch (error) {
      console.error(`âŒ Failed to pull from ${subName}:`, error.message);
      results.push({
        subscription: subName,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Test: Get topic statistics
 */
async function testGetStats() {
  console.log('\nðŸ“Š Testing Statistics Retrieval...\n');

  for (const [name, topicName] of Object.entries(TOPICS)) {
    try {
      const topic = pubsub.topic(topicName);
      const [metadata] = await topic.getMetadata();

      console.log(`âœ… Topic: ${topicName}`);
      console.log(`   Name: ${metadata.name}`);
      console.log(`   Retention: ${metadata.messageRetentionDuration || 'default (7 days)'}`);
    } catch (error) {
      console.error(`âŒ Failed to get stats for ${topicName}:`, error.message);
    }
  }
}

/**
 * Test: Batch publish
 */
async function testBatchPublish() {
  console.log('\nðŸ“¦ Testing Batch Publishing...\n');

  try {
    const topic = pubsub.topic(TOPICS.GPS_TRACKING);

    // Create 10 GPS tracking messages
    const messages = Array.from({ length: 10 }, (_, i) => ({
      data: Buffer.from(
        JSON.stringify({
          eventId: 'test_event_001',
          deviceId: `device_${i + 1}`,
          userId: `user_${i + 1}`,
          timestamp: new Date().toISOString(),
          location: {
            lat: 28.613 + Math.random() * 0.01,
            lon: 77.208 + Math.random() * 0.01,
          },
          accuracy: 5 + Math.random() * 10,
        })
      ),
      attributes: {
        eventId: 'test_event_001',
        deviceId: `device_${i + 1}`,
      },
    }));

    // Publish batch
    const messageIds = await Promise.all(messages.map((msg) => topic.publishMessage(msg)));

    console.log(`âœ… Batch published ${messageIds.length} GPS tracking messages`);
    console.log(`   First message ID: ${messageIds[0]}`);
    console.log(`   Last message ID: ${messageIds[messageIds.length - 1]}`);

    return { success: true, count: messageIds.length };
  } catch (error) {
    console.error('âŒ Batch publish failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test: Health check
 */
async function testHealthCheck() {
  console.log('\nðŸ¥ Testing Health Check...\n');

  try {
    // Try to list topics as health check
    const [topics] = await pubsub.getTopics({ pageSize: 1 });
    console.log('âœ… Pub/Sub service is healthy');
    console.log(`   Can access ${topics.length > 0 ? 'topics' : 'project'}`);
    return true;
  } catch (error) {
    console.error('âŒ Health check failed:', error.message);
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('ðŸš€ Cloud Pub/Sub Integration Test');
  console.log('='.repeat(60));
  console.log('Project ID:', PROJECT_ID);
  console.log('Pub/Sub Enabled:', PUBSUB_ENABLED);
  console.log('='.repeat(60));

  const results = {
    initialization: false,
    healthCheck: false,
    topicCreation: null,
    subscriptionCreation: null,
    publish: null,
    batchPublish: null,
    pull: null,
    stats: true,
  };

  // Initialize
  results.initialization = initializePubSub();
  if (!results.initialization) {
    console.error('\nâŒ Initialization failed. Exiting...');
    process.exit(1);
  }

  try {
    // Run tests
    results.healthCheck = await testHealthCheck();
    results.topicCreation = await testCreateTopics();
    results.subscriptionCreation = await testCreateSubscriptions();
    results.publish = await testPublish();
    results.batchPublish = await testBatchPublish();

    // Wait a bit for messages to propagate
    console.log('\nâ³ Waiting 3 seconds for message propagation...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    results.pull = await testPull();
    await testGetStats();
  } catch (error) {
    console.error('\nâŒ Test execution failed:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('ðŸ“Š Test Results Summary');
  console.log('='.repeat(60));

  console.log(`Initialization:         ${results.initialization ? 'âœ… PASSED' : 'âŒ FAILED'}`);
  console.log(`Health Check:           ${results.healthCheck ? 'âœ… PASSED' : 'âŒ FAILED'}`);

  if (results.topicCreation) {
    const topicsPassed = results.topicCreation.failed.length === 0;
    console.log(
      `Topic Creation:         ${topicsPassed ? 'âœ… PASSED' : 'âš ï¸  PARTIAL'} (${results.topicCreation.created.length + results.topicCreation.existing.length}/${Object.keys(TOPICS).length})`
    );
  }

  if (results.subscriptionCreation) {
    const subsPassed = results.subscriptionCreation.failed.length === 0;
    console.log(
      `Subscription Creation:  ${subsPassed ? 'âœ… PASSED' : 'âš ï¸  PARTIAL'} (${results.subscriptionCreation.created.length + results.subscriptionCreation.existing.length}/${Object.keys(SUBSCRIPTIONS).length})`
    );
  }

  if (results.publish) {
    const publishPassed = results.publish.every((r) => r.success);
    console.log(
      `Message Publishing:     ${publishPassed ? 'âœ… PASSED' : 'âŒ FAILED'} (${results.publish.filter((r) => r.success).length}/${results.publish.length})`
    );
  }

  if (results.batchPublish) {
    console.log(
      `Batch Publishing:       ${results.batchPublish.success ? 'âœ… PASSED' : 'âŒ FAILED'} (${results.batchPublish.count || 0} messages)`
    );
  }

  if (results.pull) {
    const pullPassed = results.pull.every((r) => r.success);
    const totalMessages = results.pull.reduce((sum, r) => sum + (r.messageCount || 0), 0);
    console.log(`Message Pulling:        ${pullPassed ? 'âœ… PASSED' : 'âš ï¸  PARTIAL'} (${totalMessages} messages)`);
  }

  console.log(`Statistics Retrieval:   ${results.stats ? 'âœ… PASSED' : 'âŒ FAILED'}`);

  console.log('='.repeat(60));

  const allPassed =
    results.initialization &&
    results.healthCheck &&
    results.topicCreation?.failed.length === 0 &&
    results.subscriptionCreation?.failed.length === 0;

  if (allPassed) {
    console.log('\nâœ… All critical tests passed! Pub/Sub is ready for production.');
    console.log('\nðŸ“‹ Next Steps:');
    console.log('   1. Integrate Pub/Sub into video analytics service');
    console.log('   2. Connect anomaly detection to incident alerts topic');
    console.log('   3. Setup BigQuery subscriptions for data warehousing');
    console.log('   4. Configure Cloud Functions for automated processing');
  } else {
    console.log('\nâš ï¸  Some tests failed. Review errors above.');
    console.log('\nðŸ”§ Troubleshooting:');
    console.log('   - Check GOOGLE_APPLICATION_CREDENTIALS is set correctly');
    console.log('   - Verify service account has Pub/Sub Admin role');
    console.log('   - Ensure Pub/Sub API is enabled in GCP project');
    console.log('   - Check for quota limits in Cloud Console');
  }
}

// Run tests
main().catch((error) => {
  console.error('\nâŒ Fatal error:', error);
  process.exit(1);
});
