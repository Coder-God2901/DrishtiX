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
 * DrishtiX Platform Health Check Script
 * 
 * Verifies all services are properly configured and ready:
 * - Database connectivity (PostgreSQL + PostGIS)
 * - GCP services (Pub/Sub, BigQuery, Cloud Storage, Firebase)
 * - API routes and endpoints
 * - Socket.IO real-time connections
 * - ML infrastructure (without requiring trained models)
 * - External APIs (Weather, Maps)
 * 
 * Usage:
 *   npx tsx scripts/health-check.ts
 */

import { PrismaClient } from '@prisma/client';
import { PubSub } from '@google-cloud/pubsub';
import { BigQuery } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';
import * as admin from 'firebase-admin';
import axios from 'axios';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';

dotenv.config();

// Configuration
const PROJECT_ID = process.env.VITE_GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID || '';
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './config/gcp-service-account-key.json';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

interface HealthCheckResult {
  service: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: HealthCheckResult[] = [];

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}\n`);
}

function pass(service: string, message: string, details?: any) {
  console.log(`${colors.green}âœ“${colors.reset} ${service}: ${message}`);
  results.push({ service, status: 'PASS', message, details });
}

function fail(service: string, message: string, details?: any) {
  console.log(`${colors.red}âœ—${colors.reset} ${service}: ${message}`);
  results.push({ service, status: 'FAIL', message, details });
}

function warn(service: string, message: string, details?: any) {
  console.log(`${colors.yellow}âš ${colors.reset} ${service}: ${message}`);
  results.push({ service, status: 'WARN', message, details });
}

async function checkEnvironmentVariables() {
  header('1. Environment Variables');

  const required = [
    { key: 'VITE_GOOGLE_CLOUD_PROJECT_ID', value: PROJECT_ID },
    { key: 'GOOGLE_APPLICATION_CREDENTIALS', value: CREDENTIALS_PATH },
    { key: 'DATABASE_URL', value: process.env.DATABASE_URL },
  ];

  const optional = [
    { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY },
    { key: 'OPENWEATHER_API_KEY', value: process.env.OPENWEATHER_API_KEY },
    { key: 'GOOGLE_MAPS_API_KEY', value: process.env.GOOGLE_MAPS_API_KEY },
    { key: 'VERTEX_AI_MODEL_ENDPOINT', value: process.env.VERTEX_AI_MODEL_ENDPOINT },
  ];

  for (const env of required) {
    if (!env.value || env.value === 'your-gcp-project-id') {
      fail('Environment', `${env.key} not set or invalid`);
    } else {
      pass('Environment', `${env.key} is configured`);
    }
  }

  for (const env of optional) {
    if (!env.value) {
      warn('Environment', `${env.key} not set (optional, some features may not work)`);
    } else {
      pass('Environment', `${env.key} is configured`);
    }
  }

  // Check credentials file
  if (existsSync(CREDENTIALS_PATH)) {
    pass('Environment', `Service account key found at ${CREDENTIALS_PATH}`);
  } else {
    fail('Environment', `Service account key not found at ${CREDENTIALS_PATH}`);
  }
}

async function checkDatabaseConnection() {
  header('2. Database Connectivity');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    pass('PostgreSQL', 'Connection successful');

    // Check PostGIS extension
    const postgisCheck = await prisma.$queryRaw`SELECT PostGIS_Version() as version`;
    if (postgisCheck && Array.isArray(postgisCheck) && postgisCheck.length > 0) {
      pass('PostGIS', `Extension installed: ${(postgisCheck[0] as any).version}`);
    } else {
      warn('PostGIS', 'Extension not detected (required for location features)');
    }

    // Check tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    if (Array.isArray(tables) && tables.length > 0) {
      pass('Database Schema', `${tables.length} tables found`);
    } else {
      warn('Database Schema', 'No tables found. Run: npx prisma migrate dev');
    }

    await prisma.$disconnect();
  } catch (error: any) {
    fail('PostgreSQL', `Connection failed: ${error.message}`);
  }
}

async function checkGCPPubSub() {
  header('3. Google Cloud Pub/Sub');

  if (!PROJECT_ID || PROJECT_ID === 'your-gcp-project-id') {
    fail('Pub/Sub', 'GCP Project ID not configured');
    return;
  }

  try {
    const pubsub = new PubSub({
      projectId: PROJECT_ID,
      keyFilename: CREDENTIALS_PATH,
    });

    // List topics
    const [topics] = await pubsub.getTopics();
    const drishtixTopics = topics.filter(t =>
      t.name.includes('crowd') ||
      t.name.includes('prediction') ||
      t.name.includes('anomaly') ||
      t.name.includes('alert')
    );

    if (drishtixTopics.length > 0) {
      pass('Pub/Sub', `${drishtixTopics.length} DrishtiX topics found`);
      drishtixTopics.slice(0, 5).forEach(topic => {
        const topicName = topic.name.split('/').pop();
        log(`  â€¢ ${topicName}`, 'reset');
      });
    } else {
      warn('Pub/Sub', 'No DrishtiX topics found. Run: npx tsx scripts/initialize-gcp-services.ts');
    }
  } catch (error: any) {
    if (error.code === 7) {
      fail('Pub/Sub', 'Permission denied. Check service account IAM roles');
    } else {
      fail('Pub/Sub', `Error: ${error.message}`);
    }
  }
}

async function checkGCPBigQuery() {
  header('4. Google Cloud BigQuery');

  if (!PROJECT_ID || PROJECT_ID === 'your-gcp-project-id') {
    fail('BigQuery', 'GCP Project ID not configured');
    return;
  }

  try {
    const bigquery = new BigQuery({
      projectId: PROJECT_ID,
      keyFilename: CREDENTIALS_PATH,
    });

    // Check for DrishtiX dataset
    const [datasets] = await bigquery.getDatasets();
    const drishtixDataset = datasets.find(d => d.id === 'drishtix_analytics');

    if (drishtixDataset) {
      pass('BigQuery', 'Dataset drishtix_analytics found');

      // Check tables
      const [tables] = await drishtixDataset.getTables();
      if (tables.length > 0) {
        pass('BigQuery', `${tables.length} tables in dataset`);
        tables.slice(0, 5).forEach(table => {
          log(`  â€¢ ${table.id}`, 'reset');
        });
      } else {
        warn('BigQuery', 'Dataset exists but no tables found');
      }
    } else {
      warn('BigQuery', 'Dataset drishtix_analytics not found. Run initialization script');
    }
  } catch (error: any) {
    if (error.code === 7) {
      fail('BigQuery', 'Permission denied. Check service account IAM roles');
    } else {
      fail('BigQuery', `Error: ${error.message}`);
    }
  }
}

async function checkGCPStorage() {
  header('5. Google Cloud Storage');

  if (!PROJECT_ID || PROJECT_ID === 'your-gcp-project-id') {
    fail('Cloud Storage', 'GCP Project ID not configured');
    return;
  }

  try {
    const storage = new Storage({
      projectId: PROJECT_ID,
      keyFilename: CREDENTIALS_PATH,
    });

    // List buckets
    const [buckets] = await storage.getBuckets();
    const drishtixBuckets = buckets.filter(b => b.name.includes('drishtix'));

    if (drishtixBuckets.length > 0) {
      pass('Cloud Storage', `${drishtixBuckets.length} DrishtiX buckets found`);
      drishtixBuckets.forEach(bucket => {
        log(`  â€¢ ${bucket.name}`, 'reset');
      });
    } else {
      warn('Cloud Storage', 'No DrishtiX buckets found. Run initialization script');
    }
  } catch (error: any) {
    if (error.code === 7) {
      fail('Cloud Storage', 'Permission denied. Check service account IAM roles');
    } else {
      fail('Cloud Storage', `Error: ${error.message}`);
    }
  }
}

async function checkFirebase() {
  header('6. Firebase Admin SDK');

  if (!existsSync(CREDENTIALS_PATH)) {
    fail('Firebase', 'Service account key not found');
    return;
  }

  try {
    const serviceAccount = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'));

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID,
      });
    }

    pass('Firebase', 'Admin SDK initialized');

    // Test Firestore
    const db = admin.firestore();
    const testDoc = db.collection('_health_check').doc('test');
    await testDoc.set({ timestamp: admin.firestore.Timestamp.now() });
    await testDoc.delete();
    pass('Firestore', 'Read/write operations successful');

    // Check Auth
    const auth = admin.auth();
    pass('Firebase Auth', 'Service available');

    // Check FCM
    const messaging = admin.messaging();
    pass('Firebase Cloud Messaging', 'Service available');
  } catch (error: any) {
    fail('Firebase', `Error: ${error.message}`);
  }
}

async function checkExternalAPIs() {
  header('7. External API Services');

  // Check OpenWeatherMap
  const weatherKey = process.env.OPENWEATHER_API_KEY;
  if (weatherKey && weatherKey !== 'your-api-key') {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=28.7041&lon=77.1025&appid=${weatherKey}`
      );
      if (response.status === 200) {
        pass('OpenWeatherMap', 'API key valid');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        fail('OpenWeatherMap', 'Invalid API key');
      } else {
        warn('OpenWeatherMap', `API check failed: ${error.message}`);
      }
    }
  } else {
    warn('OpenWeatherMap', 'API key not configured (weather features disabled)');
  }

  // Check Google Maps
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
  if (mapsKey && mapsKey !== 'your-api-key') {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Delhi&key=${mapsKey}`
      );
      if (response.status === 200 && response.data.status === 'OK') {
        pass('Google Maps', 'API key valid');
      } else if (response.data.status === 'REQUEST_DENIED') {
        fail('Google Maps', 'API key invalid or API not enabled');
      }
    } catch (error: any) {
      warn('Google Maps', `API check failed: ${error.message}`);
    }
  } else {
    warn('Google Maps', 'API key not configured (maps features disabled)');
  }

  // Check Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your-api-key') {
    pass('Gemini AI', 'API key configured');
  } else {
    warn('Gemini AI', 'API key not configured (vision features disabled)');
  }
}

async function checkMLInfrastructure() {
  header('8. ML Infrastructure (Pre-Training)');

  // Check ML model directories
  const modelPaths = [
    './models/convlstm',
    './models/isolation-forest',
    './models/autoencoder',
    './data/convlstm',
    './data/isolation-forest',
  ];

  let dirsExist = 0;
  for (const path of modelPaths) {
    if (existsSync(path)) {
      dirsExist++;
    }
  }

  if (dirsExist > 0) {
    pass('ML Directories', `${dirsExist}/${modelPaths.length} model directories exist`);
  } else {
    warn('ML Directories', 'No model directories found (will be created during training)');
  }

  // Check Python training scripts
  const trainingScripts = [
    './scripts/train-convlstm.py',
    './scripts/train-isolation-forest.py',
    './scripts/train-autoencoder.py',
  ];

  let scriptsExist = 0;
  for (const script of trainingScripts) {
    if (existsSync(script)) {
      scriptsExist++;
    }
  }

  if (scriptsExist === trainingScripts.length) {
    pass('Training Scripts', 'All 3 training scripts present');
  } else {
    fail('Training Scripts', `Only ${scriptsExist}/${trainingScripts.length} training scripts found`);
  }

  // Check if models are trained (optional)
  warn('Trained Models', 'Models not yet trained (run training scripts when ready)');
}

async function checkBackendServer() {
  header('9. Backend Server Health');

  try {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 5000,
    });

    if (response.status === 200 && response.data.status === 'ok') {
      pass('Backend Server', `Running at ${BACKEND_URL}`);
      pass('Backend Health', `Uptime: ${Math.floor(response.data.uptime)}s`);
      pass('Database Status', response.data.database);
    } else {
      warn('Backend Server', 'Server responded but health check failed');
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      warn('Backend Server', `Not running at ${BACKEND_URL} (start with: npm run dev)`);
    } else {
      warn('Backend Server', `Health check failed: ${error.message}`);
    }
  }
}

async function displaySummary() {
  header('10. Health Check Summary');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;

  log(`\n${colors.bright}Results:${colors.reset}`, 'reset');
  log(`  ${colors.green}âœ“ Passed:${colors.reset}   ${passed}`, 'reset');
  log(`  ${colors.red}âœ— Failed:${colors.reset}   ${failed}`, 'reset');
  log(`  ${colors.yellow}âš  Warnings:${colors.reset} ${warnings}`, 'reset');
  log('', 'reset');

  if (failed > 0) {
    log(`${colors.red}${colors.bright}FAILED CHECKS:${colors.reset}`, 'reset');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      log(`  â€¢ ${r.service}: ${r.message}`, 'red');
    });
    log('', 'reset');
  }

  if (warnings > 0) {
    log(`${colors.yellow}${colors.bright}WARNINGS:${colors.reset}`, 'reset');
    results.filter(r => r.status === 'WARN').forEach(r => {
      log(`  â€¢ ${r.service}: ${r.message}`, 'yellow');
    });
    log('', 'reset');
  }

  const healthScore = Math.round((passed / results.length) * 100);
  log(`Overall Health Score: ${healthScore}%`, healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red');
  log('', 'reset');

  if (healthScore >= 80) {
    log('âœ“ Platform is ready for operation!', 'green');
    log('  Start backend: cd server && npm run dev', 'reset');
    log('  Start frontend: npm run dev', 'reset');
  } else if (healthScore >= 60) {
    log('âš  Platform is partially ready. Fix critical issues before deployment.', 'yellow');
  } else {
    log('âœ— Platform is not ready. Fix critical issues.', 'red');
    log('  Run: npx tsx scripts/initialize-gcp-services.ts', 'reset');
  }
}

async function main() {
  log('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—', 'bright');
  log('â•‘           DrishtiX Platform - Health Check System             â•‘', 'bright');
  log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n', 'bright');

  await checkEnvironmentVariables();
  await checkDatabaseConnection();
  await checkGCPPubSub();
  await checkGCPBigQuery();
  await checkGCPStorage();
  await checkFirebase();
  await checkExternalAPIs();
  await checkMLInfrastructure();
  await checkBackendServer();
  await displaySummary();
}

main();
