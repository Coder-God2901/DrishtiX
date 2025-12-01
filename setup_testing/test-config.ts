/**
 * Test Configuration for DrishtiX GCP Integration Tests
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

export const testConfig = {
  // GCP Configuration
  projectId: process.env.GCP_PROJECT_ID || 'drishtix-479606',
  location: process.env.GCP_REGION || 'us-central1',
  credentialsPath: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH || './config/gcp-service-account-key.json',

  // Test Timeouts (milliseconds)
  defaultTimeout: 30000,
  earthEngineTimeout: 60000,
  bigQueryTimeout: 45000,
  firestoreTimeout: 20000,

  // Test Data
  testEventId: 'test-event-' + Date.now(),
  testVenueName: 'Test Venue - ' + new Date().toISOString(),
  testVenueBounds: {
    north: 18.5304,
    south: 18.5104,
    east: 73.8667,
    west: 73.8467,
  },
  testLocation: {
    lat: 18.5204,
    lng: 73.8567,
  },

  // Pub/Sub Configuration
  pubsubTopics: [
    'crowd-density-updates',
    'prediction-results',
    'anomaly-detections',
    'emergency-alerts',
    'responder-dispatch',
    'risk-engine',
  ],

  // BigQuery Configuration
  bigQueryDataset: 'drishtix_analytics_test',
  bigQueryTables: {
    predictions: 'crowd_predictions',
    incidents: 'incident_logs',
    analytics: 'event_analytics',
  },

  // Firestore Configuration
  firestoreCollections: [
    'events',
    'predictions',
    'alerts',
    'incidents',
    'dispatch',
    'venues',
    'users',
  ],

  // Local ML Services
  mlServiceEndpoint: process.env.ML_SERVICE_ENDPOINT || 'http://localhost:8000',
  visionServiceEndpoint: process.env.VISION_SERVICE_URL || 'http://localhost:8001',

  // Google Maps API
  mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  placesApiKey: process.env.GOOGLE_MAPS_PLACES_API_KEY || '',

  // Earth Engine
  earthEngineEnabled: process.env.EARTH_ENGINE_ENABLED === 'true',
  earthEngineProject: process.env.EARTH_ENGINE_PROJECT || '',

  // Retry Logic
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  exponentialBackoff: true,

  // Cleanup
  cleanupAfterTests: true,
  keepTestResourcesOnFailure: true,

  // Logging
  verboseLogging: process.env.VERBOSE_LOGGING === 'true',
  logFile: './test-results.log',

  // Performance Thresholds
  maxLatency: {
    pubsub: 500, // ms
    bigquery: 2000, // ms
    firestore: 300, // ms
    earthEngine: 5000, // ms
    maps: 1000, // ms
    ml: 500, // ms
  },
};

export default testConfig;
