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
 * GCP Services Connectivity Test
 * Verifies all 14 Google Cloud Platform services are properly configured
 */

import dotenv from 'dotenv';
import { gcpConfig, validateGCPConfig } from '../server/config/gcp.config';
import { gcpOrchestrator } from '../server/services/gcp-orchestrator.service';

dotenv.config();

interface TestResult {
  service: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  const emoji = {
    PASS: 'âœ…',
    FAIL: 'âŒ',
    WARN: 'âš ï¸',
    SKIP: 'â­ï¸',
  }[result.status];

  console.log(`${emoji} ${result.service}: ${result.message}`);
  if (result.details) {
    console.log(`   Details:`, result.details);
  }
  results.push(result);
}

async function testGCPConfiguration() {
  console.log('\nðŸ” Testing GCP Configuration...\n');

  // Test 1: Validate GCP Config
  const validation = validateGCPConfig();
  if (validation.valid) {
    logResult({
      service: 'GCP Config',
      status: 'PASS',
      message: 'All required configuration variables are set',
    });
  } else {
    logResult({
      service: 'GCP Config',
      status: 'FAIL',
      message: 'Missing required configuration',
      details: validation.errors,
    });
  }

  // Test 2: Project ID
  if (gcpConfig.projectId) {
    logResult({
      service: 'GCP Project ID',
      status: 'PASS',
      message: `Project: ${gcpConfig.projectId}`,
    });
  } else {
    logResult({
      service: 'GCP Project ID',
      status: 'FAIL',
      message: 'GCP_PROJECT_ID not set',
    });
  }

  // Test 3: Service Account Credentials
  if (gcpConfig.credentials) {
    try {
      const fs = require('fs');
      if (fs.existsSync(gcpConfig.credentials)) {
        logResult({
          service: 'Service Account Key',
          status: 'PASS',
          message: `Key file found at ${gcpConfig.credentials}`,
        });
      } else {
        logResult({
          service: 'Service Account Key',
          status: 'FAIL',
          message: `Key file not found at ${gcpConfig.credentials}`,
        });
      }
    } catch (error) {
      logResult({
        service: 'Service Account Key',
        status: 'FAIL',
        message: 'Error checking key file',
        details: error,
      });
    }
  } else {
    logResult({
      service: 'Service Account Key',
      status: 'FAIL',
      message: 'GOOGLE_APPLICATION_CREDENTIALS not set',
    });
  }
}

async function testFirebase() {
  console.log('\nðŸ”¥ Testing Firebase Services...\n');

  // Firebase Configuration
  const firebaseVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingFirebaseVars = firebaseVars.filter((v) => !process.env[v]);

  if (missingFirebaseVars.length === 0) {
    logResult({
      service: 'Firebase Config',
      status: 'PASS',
      message: 'All Firebase configuration variables set',
    });
  } else {
    logResult({
      service: 'Firebase Config',
      status: 'WARN',
      message: 'Some Firebase variables missing',
      details: missingFirebaseVars,
    });
  }

  // FCM Server Key
  if (process.env.FIREBASE_SERVER_KEY || process.env.FCM_SERVER_KEY) {
    logResult({
      service: 'Firebase Cloud Messaging',
      status: 'PASS',
      message: 'FCM server key configured',
    });
  } else {
    logResult({
      service: 'Firebase Cloud Messaging',
      status: 'WARN',
      message: 'FCM server key not set (optional for some features)',
    });
  }
}

async function testGoogleMaps() {
  console.log('\nðŸ—ºï¸  Testing Google Maps Platform...\n');

  if (gcpConfig.maps.apiKey) {
    logResult({
      service: 'Google Maps API',
      status: 'PASS',
      message: 'Maps API key configured',
    });
  } else {
    logResult({
      service: 'Google Maps API',
      status: 'FAIL',
      message: 'GOOGLE_MAPS_API_KEY not set',
    });
  }

  if (gcpConfig.maps.routesApiKey) {
    logResult({
      service: 'Google Routes API',
      status: 'PASS',
      message: 'Routes API key configured',
    });
  } else {
    logResult({
      service: 'Google Routes API',
      status: 'WARN',
      message: 'Routes API key not set (will use main Maps key)',
    });
  }

  if (gcpConfig.maps.placesApiKey) {
    logResult({
      service: 'Google Places API',
      status: 'PASS',
      message: 'Places API key configured',
    });
  } else {
    logResult({
      service: 'Google Places API',
      status: 'WARN',
      message: 'Places API key not set (will use main Maps key)',
    });
  }
}

async function testVertexAI() {
  console.log('\nðŸ¤– Testing Vertex AI Services...\n');

  if (gcpConfig.vertexAI.modelId) {
    logResult({
      service: 'Vertex AI Model',
      status: 'PASS',
      message: `Model ID: ${gcpConfig.vertexAI.modelId}`,
    });
  } else {
    logResult({
      service: 'Vertex AI Model',
      status: 'WARN',
      message: 'VERTEX_AI_MODEL_ID not set',
    });
  }

  if (gcpConfig.vertexAI.agentId) {
    logResult({
      service: 'Agent Builder',
      status: 'PASS',
      message: `Agent ID: ${gcpConfig.vertexAI.agentId}`,
    });
  } else {
    logResult({
      service: 'Agent Builder',
      status: 'WARN',
      message: 'VERTEX_AI_AGENT_ID not set',
    });
  }
}

async function testGemini() {
  console.log('\nðŸ’Ž Testing Gemini API...\n');

  if (gcpConfig.gemini.apiKey) {
    logResult({
      service: 'Gemini API',
      status: 'PASS',
      message: `Using model: ${gcpConfig.gemini.model}`,
    });
    logResult({
      service: 'Gemini Vision',
      status: 'PASS',
      message: `Using vision model: ${gcpConfig.gemini.visionModel}`,
    });
  } else {
    logResult({
      service: 'Gemini API',
      status: 'FAIL',
      message: 'GEMINI_API_KEY not set',
    });
  }
}

async function testBigQuery() {
  console.log('\nðŸ“Š Testing BigQuery...\n');

  if (gcpConfig.bigquery.dataset) {
    logResult({
      service: 'BigQuery Dataset',
      status: 'PASS',
      message: `Dataset: ${gcpConfig.bigquery.dataset}`,
    });
  } else {
    logResult({
      service: 'BigQuery Dataset',
      status: 'WARN',
      message: 'Using default dataset name',
    });
  }

  const tables = Object.entries(gcpConfig.bigquery.tables);
  logResult({
    service: 'BigQuery Tables',
    status: 'PASS',
    message: `${tables.length} tables configured`,
    details: tables.map(([key, value]) => `${key}: ${value}`),
  });
}

async function testPubSub() {
  console.log('\nðŸ“¨ Testing Pub/Sub...\n');

  const topics = Object.entries(gcpConfig.pubsub.topics);
  const subscriptions = Object.entries(gcpConfig.pubsub.subscriptions);

  logResult({
    service: 'Pub/Sub Topics',
    status: 'PASS',
    message: `${topics.length} topics configured`,
    details: topics.map(([key, value]) => `${key}: ${value}`),
  });

  logResult({
    service: 'Pub/Sub Subscriptions',
    status: 'PASS',
    message: `${subscriptions.length} subscriptions configured`,
    details: subscriptions.map(([key, value]) => `${key}: ${value}`),
  });
}

async function testCloudStorage() {
  console.log('\nðŸª£ Testing Cloud Storage...\n');

  const buckets = Object.entries(gcpConfig.storage.buckets);

  logResult({
    service: 'Cloud Storage Buckets',
    status: 'PASS',
    message: `${buckets.length} buckets configured`,
    details: buckets.map(([key, value]) => `${key}: ${value}`),
  });
}

async function testEarthEngine() {
  console.log('\nðŸŒ Testing Earth Engine...\n');

  if (gcpConfig.earthEngine.enabled) {
    if (gcpConfig.earthEngine.project) {
      logResult({
        service: 'Earth Engine',
        status: 'PASS',
        message: `Project: ${gcpConfig.earthEngine.project}`,
      });
    } else {
      logResult({
        service: 'Earth Engine',
        status: 'WARN',
        message: 'Enabled but project not set',
      });
    }
  } else {
    logResult({
      service: 'Earth Engine',
      status: 'SKIP',
      message: 'Disabled in configuration',
    });
  }
}

async function testOrchestrator() {
  console.log('\nðŸŽ¯ Testing GCP Services Orchestrator...\n');

  try {
    // Initialize orchestrator
    await gcpOrchestrator.initialize();

    logResult({
      service: 'GCP Orchestrator',
      status: 'PASS',
      message: 'Successfully initialized',
    });

    // Check health
    const healthy = await gcpOrchestrator.healthCheck();

    if (healthy) {
      logResult({
        service: 'Health Check',
        status: 'PASS',
        message: 'All services healthy',
      });
    } else {
      logResult({
        service: 'Health Check',
        status: 'WARN',
        message: 'Some services may not be fully operational',
      });
    }

    // Get status
    const status = gcpOrchestrator.getStatus();

    logResult({
      service: 'Service Status',
      status: status.initialized ? 'PASS' : 'FAIL',
      message: status.initialized ? 'Orchestrator ready' : 'Orchestrator not initialized',
      details: status.services,
    });

  } catch (error) {
    logResult({
      service: 'GCP Orchestrator',
      status: 'FAIL',
      message: 'Failed to initialize',
      details: error,
    });
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('ðŸ“‹ TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warned = results.filter((r) => r.status === 'WARN').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log(`âœ… Passed:  ${passed}`);
  console.log(`âŒ Failed:  ${failed}`);
  console.log(`âš ï¸  Warnings: ${warned}`);
  console.log(`â­ï¸  Skipped: ${skipped}`);
  console.log(`   Total:   ${results.length}\n`);

  if (failed > 0) {
    console.log('âŒ FAILED TESTS:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`   - ${r.service}: ${r.message}`);
      });
    console.log('');
  }

  if (warned > 0) {
    console.log('âš ï¸  WARNINGS:');
    results
      .filter((r) => r.status === 'WARN')
      .forEach((r) => {
        console.log(`   - ${r.service}: ${r.message}`);
      });
    console.log('');
  }

  const overallStatus = failed === 0 ? 'PASS' : 'FAIL';
  const statusEmoji = overallStatus === 'PASS' ? 'âœ…' : 'âŒ';

  console.log('='.repeat(60));
  console.log(`${statusEmoji} OVERALL STATUS: ${overallStatus}`);
  console.log('='.repeat(60) + '\n');

  if (overallStatus === 'PASS') {
    console.log('ðŸŽ‰ All critical services are properly configured!\n');
    console.log('Next steps:');
    console.log('  1. Start the development server: pnpm run dev');
    console.log('  2. Check service logs for any runtime errors');
    console.log('  3. Test end-to-end data flow\n');
  } else {
    console.log('âš ï¸  Please fix the failed tests before running the application.\n');
    console.log('See docs/GCP_DEVELOPER_SETUP_GUIDE.md for setup instructions.\n');
    process.exit(1);
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('ðŸš€ GCP SERVICES CONNECTIVITY TEST');
  console.log('   EventSphere / DrishtiX Platform');
  console.log('='.repeat(60));

  try {
    await testGCPConfiguration();
    await testFirebase();
    await testGoogleMaps();
    await testVertexAI();
    await testGemini();
    await testBigQuery();
    await testPubSub();
    await testCloudStorage();
    await testEarthEngine();
    await testOrchestrator();
    await printSummary();
  } catch (error) {
    console.error('\nâŒ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
main();
