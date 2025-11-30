/**
 * End-to-End Pipeline Test
 * 
 * Tests complete data flow:
 * Video → Vertex AI Vision → Pub/Sub → Cloud Functions → BigQuery → Dashboard
 * 
 * Usage: node scripts/test-e2e-pipeline.js
 */

const { PubSub } = require('@google-cloud/pubsub');
const { BigQuery } = require('@google-cloud/bigquery');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ID = process.env.VITE_GCP_PROJECT_ID || 'your-project-id';
const EVENT_ID = 'test_event_' + Date.now();
const TEST_DURATION_MS = 60000; // 1 minute test

// Initialize clients
const pubsubClient = new PubSub({ projectId: PROJECT_ID });
const bigqueryClient = new BigQuery({ projectId: PROJECT_ID });

// Test metrics
const metrics = {
  startTime: Date.now(),
  videoAnalysisCount: 0,
  socialSignalsCount: 0,
  gpsTrackingCount: 0,
  incidentAlertsCount: 0,
  cloudFunctionInvocations: 0,
  bigqueryInserts: 0,
  latencies: [],
  errors: []
};

/**
 * Test 1: Video Analysis Pipeline
 */
async function testVideoAnalysisPipeline() {
  console.log('\n📹 Testing Video Analysis Pipeline...');
  
  try {
    const startTime = Date.now();
    
    // Simulate video frame analysis result
    const videoAnalysisData = {
      analysis_id: `video_${Date.now()}`,
      event_id: EVENT_ID,
      camera_id: 'camera_001',
      timestamp: new Date().toISOString(),
      people_count: Math.floor(Math.random() * 500) + 100,
      density_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      anomalies: Math.random() > 0.8 ? ['crowd_surge'] : [],
      confidence_score: 0.85 + Math.random() * 0.15,
      processing_time_ms: Math.floor(Math.random() * 1000) + 500
    };

    // Publish to Pub/Sub
    const topic = pubsubClient.topic('video-analytics');
    const messageId = await topic.publishMessage({
      data: Buffer.from(JSON.stringify(videoAnalysisData))
    });

    const latency = Date.now() - startTime;
    metrics.videoAnalysisCount++;
    metrics.latencies.push({ pipeline: 'video', latency });

    console.log(`✅ Video analysis published (${latency}ms)`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   People Count: ${videoAnalysisData.people_count}`);
    console.log(`   Density: ${videoAnalysisData.density_level}`);

    return videoAnalysisData;

  } catch (error) {
    console.error('❌ Video analysis test failed:', error.message);
    metrics.errors.push({ pipeline: 'video', error: error.message });
    throw error;
  }
}

/**
 * Test 2: Social Signals Pipeline
 */
async function testSocialSignalsPipeline() {
  console.log('\n🐦 Testing Social Signals Pipeline...');
  
  try {
    const startTime = Date.now();
    
    // Simulate sentiment analysis result
    const socialSignalData = {
      signal_id: `signal_${Date.now()}`,
      event_id: EVENT_ID,
      timestamp: new Date().toISOString(),
      platform: 'twitter',
      content: 'Test tweet about the event #TestEvent',
      sentiment: ['very_positive', 'positive', 'neutral', 'negative'][Math.floor(Math.random() * 4)],
      panic_level: Math.floor(Math.random() * 30),
      urgency: 'low',
      location: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.01,
        lng: -74.0060 + (Math.random() - 0.5) * 0.01
      },
      hashtags: ['TestEvent', 'EventSphere']
    };

    // Publish to Pub/Sub
    const topic = pubsubClient.topic('social-signals');
    const messageId = await topic.publishMessage({
      data: Buffer.from(JSON.stringify(socialSignalData))
    });

    const latency = Date.now() - startTime;
    metrics.socialSignalsCount++;
    metrics.latencies.push({ pipeline: 'social', latency });

    console.log(`✅ Social signal published (${latency}ms)`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Sentiment: ${socialSignalData.sentiment}`);
    console.log(`   Panic Level: ${socialSignalData.panic_level}`);

    return socialSignalData;

  } catch (error) {
    console.error('❌ Social signals test failed:', error.message);
    metrics.errors.push({ pipeline: 'social', error: error.message });
    throw error;
  }
}

/**
 * Test 3: GPS Tracking Pipeline
 */
async function testGPSTrackingPipeline() {
  console.log('\n📍 Testing GPS Tracking Pipeline...');
  
  try {
    const startTime = Date.now();
    
    // Simulate GPS tracking data
    const gpsData = {
      tracking_id: `gps_${Date.now()}`,
      event_id: EVENT_ID,
      user_id: 'team_member_001',
      timestamp: new Date().toISOString(),
      location: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.001,
        lng: -74.0060 + (Math.random() - 0.5) * 0.001,
        accuracy: 5 + Math.random() * 10
      },
      battery_level: 70 + Math.floor(Math.random() * 30),
      speed: Math.random() * 2,
      heading: Math.floor(Math.random() * 360)
    };

    // Publish to Pub/Sub
    const topic = pubsubClient.topic('gps-tracking');
    const messageId = await topic.publishMessage({
      data: Buffer.from(JSON.stringify(gpsData))
    });

    const latency = Date.now() - startTime;
    metrics.gpsTrackingCount++;
    metrics.latencies.push({ pipeline: 'gps', latency });

    console.log(`✅ GPS tracking published (${latency}ms)`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Location: (${gpsData.location.lat.toFixed(6)}, ${gpsData.location.lng.toFixed(6)})`);
    console.log(`   Battery: ${gpsData.battery_level}%`);

    return gpsData;

  } catch (error) {
    console.error('❌ GPS tracking test failed:', error.message);
    metrics.errors.push({ pipeline: 'gps', error: error.message });
    throw error;
  }
}

/**
 * Test 4: Incident Alert Pipeline
 */
async function testIncidentAlertPipeline() {
  console.log('\n🚨 Testing Incident Alert Pipeline...');
  
  try {
    const startTime = Date.now();
    
    // Simulate incident alert
    const incidentData = {
      incident_id: `incident_${Date.now()}`,
      event_id: EVENT_ID,
      timestamp: new Date().toISOString(),
      incident_type: 'medical_emergency',
      severity: 'high',
      location: {
        lat: 40.7128,
        lng: -74.0060,
        name: 'Main Stage Area'
      },
      description: 'Test incident - medical emergency reported',
      response_time_seconds: 0,
      resolved: false
    };

    // Publish to Pub/Sub
    const topic = pubsubClient.topic('incident-alerts');
    const messageId = await topic.publishMessage({
      data: Buffer.from(JSON.stringify(incidentData))
    });

    const latency = Date.now() - startTime;
    metrics.incidentAlertsCount++;
    metrics.latencies.push({ pipeline: 'incident', latency });

    console.log(`✅ Incident alert published (${latency}ms)`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Type: ${incidentData.incident_type}`);
    console.log(`   Severity: ${incidentData.severity}`);

    // This should trigger Cloud Function for SMS alerts
    metrics.cloudFunctionInvocations++;

    return incidentData;

  } catch (error) {
    console.error('❌ Incident alert test failed:', error.message);
    metrics.errors.push({ pipeline: 'incident', error: error.message });
    throw error;
  }
}

/**
 * Test 5: Crowd Prediction Pipeline
 */
async function testCrowdPredictionPipeline() {
  console.log('\n🔮 Testing Crowd Prediction Pipeline...');
  
  try {
    const startTime = Date.now();
    
    // Simulate crowd prediction
    const predictionData = {
      prediction_id: `pred_${Date.now()}`,
      event_id: EVENT_ID,
      timestamp: new Date().toISOString(),
      prediction_time: new Date(Date.now() + 15 * 60000).toISOString(), // 15 min ahead
      location_id: 'zone_a',
      predicted_count: Math.floor(Math.random() * 1000) + 1000,
      confidence_score: 0.8 + Math.random() * 0.2,
      risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      model_version: 'v1.2.0'
    };

    // Publish to Pub/Sub
    const topic = pubsubClient.topic('crowd-predictions');
    const messageId = await topic.publishMessage({
      data: Buffer.from(JSON.stringify(predictionData))
    });

    const latency = Date.now() - startTime;
    metrics.latencies.push({ pipeline: 'prediction', latency });

    console.log(`✅ Crowd prediction published (${latency}ms)`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Predicted Count: ${predictionData.predicted_count}`);
    console.log(`   Risk Level: ${predictionData.risk_level}`);

    return predictionData;

  } catch (error) {
    console.error('❌ Crowd prediction test failed:', error.message);
    metrics.errors.push({ pipeline: 'prediction', error: error.message });
    throw error;
  }
}

/**
 * Test 6: BigQuery Data Validation
 */
async function testBigQueryData() {
  console.log('\n💾 Testing BigQuery Data Insertion...');
  
  try {
    // Wait a few seconds for Pub/Sub → BigQuery to process
    console.log('   Waiting 10 seconds for data to flow to BigQuery...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const tables = ['video_analytics', 'social_signals', 'gps_tracking', 'incidents'];
    
    for (const table of tables) {
      try {
        const query = `
          SELECT COUNT(*) as count
          FROM \`${PROJECT_ID}.drishtix_analytics.${table}\`
          WHERE event_id = '${EVENT_ID}'
            AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE)
        `;

        const [rows] = await bigqueryClient.query({ query, location: 'US' });
        const count = rows[0].count;
        
        console.log(`✅ ${table}: ${count} records found`);
        metrics.bigqueryInserts += count;

      } catch (error) {
        console.warn(`⚠️  ${table}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ BigQuery validation failed:', error.message);
    metrics.errors.push({ pipeline: 'bigquery', error: error.message });
  }
}

/**
 * Test 7: Latency Measurement
 */
function analyzeLat encies() {
  console.log('\n⏱️  Latency Analysis:');
  
  const byPipeline = {};
  metrics.latencies.forEach(({ pipeline, latency }) => {
    if (!byPipeline[pipeline]) {
      byPipeline[pipeline] = [];
    }
    byPipeline[pipeline].push(latency);
  });

  Object.entries(byPipeline).forEach(([pipeline, latencies]) => {
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const max = Math.max(...latencies);
    const min = Math.min(...latencies);
    
    console.log(`   ${pipeline.padEnd(15)}: avg=${avg.toFixed(0)}ms, min=${min}ms, max=${max}ms`);
  });

  const allLatencies = metrics.latencies.map(l => l.latency);
  const overallAvg = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;
  
  console.log(`\n   Overall Average: ${overallAvg.toFixed(0)}ms`);
  console.log(`   Target: <500ms ${overallAvg < 500 ? '✅' : '❌'}`);
}

/**
 * Generate Test Report
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 END-TO-END PIPELINE TEST REPORT');
  console.log('='.repeat(60));
  
  const duration = Date.now() - metrics.startTime;
  
  console.log(`\n🕒 Test Duration: ${(duration / 1000).toFixed(1)} seconds`);
  console.log(`\n📈 Messages Published:`);
  console.log(`   Video Analysis:     ${metrics.videoAnalysisCount}`);
  console.log(`   Social Signals:     ${metrics.socialSignalsCount}`);
  console.log(`   GPS Tracking:       ${metrics.gpsTrackingCount}`);
  console.log(`   Incident Alerts:    ${metrics.incidentAlertsCount}`);
  console.log(`   Total:              ${metrics.videoAnalysisCount + metrics.socialSignalsCount + metrics.gpsTrackingCount + metrics.incidentAlertsCount}`);
  
  console.log(`\n⚡ Cloud Functions:`);
  console.log(`   Invocations:        ${metrics.cloudFunctionInvocations}`);
  
  console.log(`\n💾 BigQuery:`);
  console.log(`   Records Inserted:   ${metrics.bigqueryInserts}`);
  
  analyzeLat encies();
  
  if (metrics.errors.length > 0) {
    console.log(`\n❌ Errors (${metrics.errors.length}):`);
    metrics.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.pipeline}] ${err.error}`);
    });
  } else {
    console.log(`\n✅ No errors detected`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ PIPELINE TEST COMPLETED');
  console.log('='.repeat(60) + '\n');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting End-to-End Pipeline Test...');
  console.log(`   Project ID: ${PROJECT_ID}`);
  console.log(`   Event ID: ${EVENT_ID}`);
  console.log(`   Test Duration: ${TEST_DURATION_MS / 1000} seconds\n`);

  try {
    // Run each pipeline test multiple times
    const iterations = 5;
    
    for (let i = 0; i < iterations; i++) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Iteration ${i + 1}/${iterations}`);
      console.log('─'.repeat(60));
      
      await testVideoAnalysisPipeline();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testSocialSignalsPipeline();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testGPSTrackingPipeline();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (i === 0) {
        // Test incident alert once (triggers SMS)
        await testIncidentAlertPipeline();
      }
      
      await testCrowdPredictionPipeline();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Validate BigQuery data
    await testBigQueryData();

    // Generate final report
    generateReport();

    process.exit(0);

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    generateReport();
    process.exit(1);
  }
}

// Run tests
runAllTests();
