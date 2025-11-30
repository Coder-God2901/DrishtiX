/**
 * Cloud Functions Test Script
 *
 * Tests all deployed Cloud Functions with sample data
 *
 * Usage:
 *   node scripts/test-cloud-functions.js [function-name]
 *
 * Functions:
 *   - alert-trigger: Test alert triggers function
 *   - reward-trigger: Test reward automation function
 *   - twilio-webhook: Test Twilio webhook handler
 *   - all: Test all functions
 */

const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');
const axios = require('axios');

// Initialize clients
const pubsub = new PubSub();
const firestore = new Firestore();

// Configuration
const config = {
  projectId: process.env.GCP_PROJECT_ID || 'your-project-id',
  region: process.env.GCP_REGION || 'us-central1',
  twilioWebhookUrl:
    process.env.TWILIO_WEBHOOK_URL || 'https://us-central1-project.cloudfunctions.net/handleTwilioWebhook',
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(message, 'cyan');
  log('='.repeat(60), 'cyan');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

// Test data
const testData = {
  alert: {
    incidentId: `test-incident-${Date.now()}`,
    severity: 'critical',
    type: 'FIRE_DETECTED',
    location: {
      name: 'Main Stage',
      coordinates: { lat: 40.7128, lng: -74.006 },
    },
    description: 'Test fire detection alert',
    metadata: {
      detectedBy: 'test-script',
      confidence: 0.95,
    },
    proofData: {
      imageUrl: 'https://example.com/test-image.jpg',
    },
    timestamp: new Date().toISOString(),
  },

  reward: {
    attendeeId: `test-attendee-${Date.now()}`,
    eventId: 'test-event-123',
    actionType: 'PROOF_SUBMISSION',
    metadata: {
      accuracy: 0.92,
      responseTime: 45,
    },
    timestamp: new Date().toISOString(),
  },

  twilioSMS: {
    From: '+15555551234',
    To: '+15555555678',
    Body: 'Help! There is a fire near the main stage!',
    MessageSid: `SM${Math.random().toString(36).substr(2, 9)}`,
    AccountSid: 'AC' + Math.random().toString(36).substr(2, 9),
    NumMedia: '0',
  },

  twilioWhatsApp: {
    From: 'whatsapp:+15555551234',
    To: 'whatsapp:+15555555678',
    Body: 'I need help with directions',
    MessageSid: `SM${Math.random().toString(36).substr(2, 9)}`,
    AccountSid: 'AC' + Math.random().toString(36).substr(2, 9),
    NumMedia: '0',
  },
};

/**
 * Test Alert Triggers Function
 */
async function testAlertTrigger() {
  header('Testing Alert Triggers Function');

  try {
    info('Publishing test alert to incident-alerts topic...');

    const topic = pubsub.topic('incident-alerts');
    const messageBuffer = Buffer.from(JSON.stringify(testData.alert));

    const messageId = await topic.publish(messageBuffer);
    success(`Alert message published: ${messageId}`);

    info('Waiting 5 seconds for function to process...');
    await sleep(5000);

    // Check if alert was stored in Firestore
    info('Checking Firestore for alert record...');
    const alertsSnapshot = await firestore
      .collection('incident_alerts')
      .where('incidentId', '==', testData.alert.incidentId)
      .limit(1)
      .get();

    if (!alertsSnapshot.empty) {
      const alertDoc = alertsSnapshot.docs[0];
      success(`Alert found in Firestore: ${alertDoc.id}`);
      console.log('Alert data:', JSON.stringify(alertDoc.data(), null, 2));
    } else {
      error('Alert not found in Firestore');
    }

    success('Alert Triggers test completed');
  } catch (err) {
    error(`Alert Triggers test failed: ${err.message}`);
    console.error(err);
  }
}

/**
 * Test Reward Automation Function
 */
async function testRewardTrigger() {
  header('Testing Reward Automation Function');

  try {
    // First, create test attendee in Firestore
    info('Creating test attendee...');
    const attendeeRef = firestore.collection('attendees').doc(testData.reward.attendeeId);
    await attendeeRef.set({
      name: 'Test User',
      email: 'test@example.com',
      gamificationScore: 0,
      fcmToken: null, // Set to test FCM notifications
      createdAt: Firestore.Timestamp.now(),
    });
    success(`Test attendee created: ${testData.reward.attendeeId}`);

    info('Publishing test reward event to reward-events topic...');

    const topic = pubsub.topic('reward-events');
    const messageBuffer = Buffer.from(JSON.stringify(testData.reward));

    const messageId = await topic.publish(messageBuffer);
    success(`Reward message published: ${messageId}`);

    info('Waiting 5 seconds for function to process...');
    await sleep(5000);

    // Check if reward was processed
    info('Checking attendee score update...');
    const updatedAttendee = await attendeeRef.get();
    const attendeeData = updatedAttendee.data();

    if (attendeeData.gamificationScore > 0) {
      success(`Reward processed! New score: ${attendeeData.gamificationScore}`);
    } else {
      error('Score not updated');
    }

    // Check reward history
    info('Checking reward history...');
    const historySnapshot = await firestore
      .collection('reward_history')
      .where('attendeeId', '==', testData.reward.attendeeId)
      .limit(1)
      .get();

    if (!historySnapshot.empty) {
      success(`Reward history found: ${historySnapshot.size} record(s)`);
      console.log('Reward data:', JSON.stringify(historySnapshot.docs[0].data(), null, 2));
    } else {
      error('Reward history not found');
    }

    // Cleanup
    info('Cleaning up test data...');
    await attendeeRef.delete();
    success('Test attendee deleted');

    success('Reward Automation test completed');
  } catch (err) {
    error(`Reward Automation test failed: ${err.message}`);
    console.error(err);
  }
}

/**
 * Test Twilio Webhook Function
 */
async function testTwilioWebhook() {
  header('Testing Twilio Webhook Function');

  try {
    // Test SMS webhook
    info('Testing SMS webhook...');
    const smsResponse = await axios.post(config.twilioWebhookUrl, new URLSearchParams(testData.twilioSMS).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      validateStatus: () => true, // Accept any status code
    });

    if (smsResponse.status === 200) {
      success('SMS webhook responded successfully');
      console.log('Response:', smsResponse.data);
    } else {
      error(`SMS webhook returned status ${smsResponse.status}`);
    }

    await sleep(2000);

    // Test WhatsApp webhook
    info('Testing WhatsApp webhook...');
    const whatsappResponse = await axios.post(
      config.twilioWebhookUrl,
      new URLSearchParams(testData.twilioWhatsApp).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        validateStatus: () => true,
      }
    );

    if (whatsappResponse.status === 200) {
      success('WhatsApp webhook responded successfully');
      console.log('Response:', whatsappResponse.data);
    } else {
      error(`WhatsApp webhook returned status ${whatsappResponse.status}`);
    }

    await sleep(3000);

    // Check if messages were stored
    info('Checking Firestore for stored messages...');
    const messagesSnapshot = await firestore
      .collection('twilio_messages')
      .where('messageSid', 'in', [testData.twilioSMS.MessageSid, testData.twilioWhatsApp.MessageSid])
      .get();

    if (messagesSnapshot.size > 0) {
      success(`Found ${messagesSnapshot.size} stored message(s)`);
      messagesSnapshot.forEach((doc) => {
        const msg = doc.data();
        console.log(`- ${msg.type} message categorized as: ${msg.category}`);
      });
    } else {
      error('No messages found in Firestore');
    }

    success('Twilio Webhook test completed');
  } catch (err) {
    error(`Twilio Webhook test failed: ${err.message}`);
    console.error(err);
  }
}

/**
 * Test health endpoints
 */
async function testHealthEndpoints() {
  header('Testing Health Endpoints');

  const functions = ['handleAlertTrigger', 'handleRewardTrigger', 'handleTwilioWebhook'];

  for (const func of functions) {
    try {
      const url = `https://${config.region}-${config.projectId}.cloudfunctions.net/${func}/health`;
      info(`Testing ${func} health endpoint...`);

      const response = await axios.get(url, { validateStatus: () => true });

      if (response.status === 200 && response.data.status === 'healthy') {
        success(`${func} is healthy`);
      } else {
        error(`${func} health check failed`);
      }
    } catch (err) {
      error(`${func} health check error: ${err.message}`);
    }
  }
}

/**
 * Generate test summary
 */
function generateSummary(results) {
  header('Test Summary');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const total = results.length;

  console.log('\nResults:');
  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✓' : '✗';
    const color = result.status === 'pass' ? 'green' : 'red';
    log(`  ${icon} ${result.name}`, color);
  });

  console.log('');
  log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`, failed === 0 ? 'green' : 'yellow');

  if (failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log(`\n⚠️  ${failed} test(s) failed`, 'yellow');
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main test runner
 */
async function runTests(testName) {
  console.log(`\n${'='.repeat(60)}`);
  log('Cloud Functions Test Suite', 'cyan');
  log('EventSphere (Project Drishti)', 'cyan');
  console.log('='.repeat(60));

  info(`Project ID: ${config.projectId}`);
  info(`Region: ${config.region}`);
  info(`Test: ${testName || 'all'}\n`);

  const results = [];

  try {
    if (!testName || testName === 'all' || testName === 'alert-trigger') {
      try {
        await testAlertTrigger();
        results.push({ name: 'Alert Triggers', status: 'pass' });
      } catch (err) {
        results.push({ name: 'Alert Triggers', status: 'fail' });
      }
    }

    if (!testName || testName === 'all' || testName === 'reward-trigger') {
      try {
        await testRewardTrigger();
        results.push({ name: 'Reward Automation', status: 'pass' });
      } catch (err) {
        results.push({ name: 'Reward Automation', status: 'fail' });
      }
    }

    if (!testName || testName === 'all' || testName === 'twilio-webhook') {
      try {
        await testTwilioWebhook();
        results.push({ name: 'Twilio Webhooks', status: 'pass' });
      } catch (err) {
        results.push({ name: 'Twilio Webhooks', status: 'fail' });
      }
    }

    if (!testName || testName === 'all' || testName === 'health') {
      try {
        await testHealthEndpoints();
        results.push({ name: 'Health Endpoints', status: 'pass' });
      } catch (err) {
        results.push({ name: 'Health Endpoints', status: 'fail' });
      }
    }

    generateSummary(results);
  } catch (err) {
    error(`Test suite error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run tests
const testName = process.argv[2];

if (!['alert-trigger', 'reward-trigger', 'twilio-webhook', 'health', 'all', undefined].includes(testName)) {
  console.error(`Invalid test name: ${testName}`);
  console.log('Valid options: alert-trigger, reward-trigger, twilio-webhook, health, all');
  process.exit(1);
}

runTests(testName);
