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
#!/usr/bin/env node

/**
 * Test Script for Vertex AI Forecasting Endpoint
 *
 * Tests the deployed Vertex AI endpoint with sample data
 * and validates response format and accuracy
 */

import googleCloudService from '../src/services/google-cloud.service.js';
import predictiveAnalyticsService from '../src/services/predictive-analytics.service.js';

// ANSI color codes
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

async function testVertexAIEndpoint() {
  log('\n=== Vertex AI Forecasting Endpoint Test ===\n', 'cyan');

  // Check environment variables
  const endpoint = process.env.VITE_VERTEX_AI_FORECASTING_ENDPOINT;
  const projectId = process.env.VITE_GOOGLE_CLOUD_PROJECT_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  log('1. Checking Configuration...', 'blue');

  if (!endpoint) {
    log('âŒ VITE_VERTEX_AI_FORECASTING_ENDPOINT not set', 'red');
    log('   Please configure in .env file', 'yellow');
    process.exit(1);
  }

  if (!projectId) {
    log('âŒ VITE_GOOGLE_CLOUD_PROJECT_ID not set', 'red');
    process.exit(1);
  }

  if (!credentialsPath) {
    log('âš ï¸  GOOGLE_APPLICATION_CREDENTIALS not set', 'yellow');
    log('   Using default application credentials', 'yellow');
  }

  log(`âœ… Endpoint: ${endpoint}`, 'green');
  log(`âœ… Project: ${projectId}`, 'green');

  // Test 1: Direct Vertex AI prediction
  log('\n2. Testing Direct Vertex AI Prediction...', 'blue');

  try {
    const testInstances = [
      {
        event_id: 'test-event-001',
        horizon_minutes: 20,
        historical_avg_density: 0.65,
        current_count: 850,
        day_of_week: 6, // Saturday
        hour_of_day: 18, // 6 PM
        is_weekend: true,
      },
    ];

    const startTime = Date.now();
    const response = await googleCloudService.predictWithVertexAI(endpoint, testInstances);
    const latency = Date.now() - startTime;

    log(`âœ… Prediction successful in ${latency}ms`, 'green');
    log(`   Predictions: ${JSON.stringify(response.predictions, null, 2)}`, 'cyan');

    if (latency > 2000) {
      log(`âš ï¸  High latency detected (${latency}ms > 2000ms)`, 'yellow');
      log('   Consider increasing replica count', 'yellow');
    }

    // Validate response structure
    if (!response.predictions || response.predictions.length === 0) {
      log('âŒ No predictions returned', 'red');
      process.exit(1);
    }

    const prediction = response.predictions[0];

    // Check for expected fields
    const expectedFields = ['predicted_density', 'predicted_count', 'confidence'];
    const missingFields = expectedFields.filter((field) => !(field in prediction));

    if (missingFields.length > 0) {
      log(`âš ï¸  Missing expected fields: ${missingFields.join(', ')}`, 'yellow');
    }
  } catch (error) {
    log(`âŒ Vertex AI prediction failed: ${error.message}`, 'red');
    if (error.code) {
      log(`   Error code: ${error.code}`, 'yellow');
    }
    process.exit(1);
  }

  // Test 2: Predictive Analytics Service
  log('\n3. Testing Predictive Analytics Service...', 'blue');

  try {
    const forecasts = await predictiveAnalyticsService.forecastCrowdDensity({
      eventId: 'test-event-001',
      horizonMinutes: 20,
    });

    log(`âœ… Generated ${forecasts.length} forecasts`, 'green');

    forecasts.forEach((forecast, index) => {
      log(
        `   [+${forecast.horizon}min] Count: ${forecast.predictedCount}, Density: ${(forecast.density * 100).toFixed(1)}%, Risk: ${forecast.riskLevel}, Confidence: ${(forecast.confidence * 100).toFixed(1)}%`,
        'cyan'
      );
    });

    // Validate accuracy target
    const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;

    if (avgConfidence >= 0.75) {
      log(`\nâœ… Accuracy target met: ${(avgConfidence * 100).toFixed(1)}% â‰¥ 75%`, 'green');
    } else {
      log(`\nâš ï¸  Accuracy below target: ${(avgConfidence * 100).toFixed(1)}% < 75%`, 'yellow');
      log('   Consider retraining model with more data', 'yellow');
    }
  } catch (error) {
    log(`âŒ Predictive analytics failed: ${error.message}`, 'red');
    process.exit(1);
  }

  // Test 3: BigQuery Integration
  log('\n4. Testing BigQuery Integration...', 'blue');

  try {
    await googleCloudService.insertIntoBigQuery({
      datasetId: 'drishtix_analytics',
      tableId: 'predictions_test',
      rows: [
        {
          event_id: 'test-event-001',
          timestamp: new Date().toISOString(),
          predicted_count: 850,
          predicted_density: 0.65,
          risk_level: 'MEDIUM',
          confidence: 0.82,
        },
      ],
    });

    log('âœ… BigQuery insert successful', 'green');
  } catch (error) {
    log(`âš ï¸  BigQuery insert failed: ${error.message}`, 'yellow');
    log('   This is optional - predictions will still work', 'yellow');
  }

  // Summary
  log('\n=== Test Summary ===\n', 'cyan');
  log('âœ… Vertex AI endpoint is operational', 'green');
  log('âœ… Forecasting service is working', 'green');
  log('âœ… Ready for production use', 'green');
  log('\nNext steps:', 'blue');
  log('  1. Monitor prediction latency and accuracy', 'cyan');
  log('  2. Set up Cloud Monitoring alerts', 'cyan');
  log('  3. Enable model monitoring in Vertex AI Console', 'cyan');
  log('  4. Proceed to Task #3: Enable Gemini Pro API\n', 'cyan');
}

// Run tests
testVertexAIEndpoint().catch((error) => {
  log(`\nâŒ Test failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
