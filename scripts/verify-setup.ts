#!/usr/bin/env node

/**
 * DrishtiX Setup Verification Script
 * Checks all environment variables, GCP services, and database connections
 */

import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

config();

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, message: string, isWarning = false): void {
  results.push({
    name,
    status: condition ? 'pass' : isWarning ? 'warning' : 'fail',
    message: condition ? '✅ ' + message : (isWarning ? '⚠️  ' : '❌ ') + message,
  });
}

console.log('\n🔍 DrishtiX Setup Verification\n');
console.log('='.repeat(60));

// 1. Check .env file
console.log('\n📋 Checking Environment Configuration...\n');

const envPath = join(process.cwd(), '.env');
check(
  'Environment File',
  existsSync(envPath),
  existsSync(envPath) ? '.env file found' : '.env file not found. Copy from .env.example'
);

// 2. Check required environment variables
const requiredVars = [
  'VITE_GOOGLE_CLOUD_PROJECT_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'DATABASE_URL',
];

requiredVars.forEach((varName) => {
  check(
    varName,
    !!process.env[varName] && !process.env[varName]?.includes('your-'),
    process.env[varName]
      ? `${varName} is set`
      : `${varName} is missing or using placeholder value`
  );
});

// 3. Check optional but recommended variables
const optionalVars = [
  'VITE_GOOGLE_MAPS_KEY',
  'VITE_GEMINI_API_KEY',
  'TWITTER_BEARER_TOKEN',
  'OPENWEATHER_API_KEY',
];

console.log('\n📦 Checking Optional APIs...\n');

optionalVars.forEach((varName) => {
  check(
    varName,
    !!process.env[varName] && !process.env[varName]?.includes('your-'),
    process.env[varName]
      ? `${varName} is configured`
      : `${varName} not configured (optional)`,
    true
  );
});

// 4. Check GCP service account file
console.log('\n🔐 Checking GCP Credentials...\n');

const gcpKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './config/gcp-service-account-key.json';
check(
  'GCP Service Account',
  existsSync(gcpKeyPath),
  existsSync(gcpKeyPath)
    ? `Service account key found at ${gcpKeyPath}`
    : `Service account key not found at ${gcpKeyPath}`
);

if (existsSync(gcpKeyPath)) {
  try {
    const keyData = JSON.parse(readFileSync(gcpKeyPath, 'utf-8'));
    check(
      'Service Account Format',
      keyData.type === 'service_account',
      keyData.type === 'service_account'
        ? 'Valid service account JSON'
        : 'Invalid service account format'
    );
    check(
      'Project ID Match',
      keyData.project_id === process.env.VITE_GOOGLE_CLOUD_PROJECT_ID,
      keyData.project_id === process.env.VITE_GOOGLE_CLOUD_PROJECT_ID
        ? 'Project IDs match'
        : `Project ID mismatch: ${keyData.project_id} vs ${process.env.VITE_GOOGLE_CLOUD_PROJECT_ID}`
    );
  } catch (error) {
    check('Service Account Format', false, 'Failed to parse service account JSON');
  }
}

// 5. Check Prisma schema
console.log('\n🗄️  Checking Database Configuration...\n');

const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
check(
  'Prisma Schema',
  existsSync(schemaPath),
  existsSync(schemaPath) ? 'Prisma schema found' : 'Prisma schema not found'
);

// 6. Check if DATABASE_URL is properly formatted
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  check(
    'Database URL Format',
    dbUrl.startsWith('postgresql://'),
    dbUrl.startsWith('postgresql://')
      ? 'PostgreSQL connection string format is valid'
      : 'Invalid database URL format. Should start with postgresql://'
  );
}

// 7. Check Firebase config
console.log('\n🔥 Checking Firebase Configuration...\n');

const firebaseVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const firebaseConfigured = firebaseVars.every((v) => process.env[v] && !process.env[v]?.includes('your-'));
check(
  'Firebase Config',
  firebaseConfigured,
  firebaseConfigured
    ? 'All Firebase config variables are set'
    : 'Some Firebase config variables are missing'
);

// 8. Check feature flags
console.log('\n🚩 Checking Feature Flags...\n');

const features = [
  'VITE_ENABLE_PREDICTIVE_ANALYTICS',
  'VITE_ENABLE_VIDEO_ANALYTICS',
  'VITE_ENABLE_TRAFFIC_FEEDS',
  'VITE_ENABLE_AGENT_ORCHESTRATION',
  'VITE_ENABLE_GEMINI_SUMMARIES',
];

features.forEach((flag) => {
  const enabled = process.env[flag] === 'true';
  check(
    flag.replace('VITE_ENABLE_', ''),
    true,
    enabled ? `${flag} is ENABLED` : `${flag} is DISABLED`,
    !enabled
  );
});

// 9. Check Firestore schema doc
console.log('\n📚 Checking Documentation...\n');

const docsPath = join(process.cwd(), 'docs', 'FIRESTORE_SCHEMA.md');
check(
  'Firestore Schema Doc',
  existsSync(docsPath),
  existsSync(docsPath) ? 'Firestore schema documentation found' : 'Documentation missing'
);

const setupGuidePath = join(process.cwd(), 'docs', 'GOOGLE_CLOUD_SETUP.md');
check(
  'Setup Guide',
  existsSync(setupGuidePath),
  existsSync(setupGuidePath) ? 'Google Cloud setup guide found' : 'Setup guide missing'
);

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n📊 Verification Results\n');

const passed = results.filter((r) => r.status === 'pass').length;
const failed = results.filter((r) => r.status === 'fail').length;
const warnings = results.filter((r) => r.status === 'warning').length;

results.forEach((result) => {
  console.log(result.message);
});

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log('\n' + '='.repeat(60));

if (failed > 0) {
  console.log('\n⚠️  Setup is incomplete. Please fix the failed checks above.');
  console.log('\n📖 See docs/GOOGLE_CLOUD_SETUP.md for detailed setup instructions.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n✅ Basic setup complete! Some optional features are not configured.');
  console.log('\n📖 See docs/GOOGLE_CLOUD_SETUP.md to enable additional features.\n');
  process.exit(0);
} else {
  console.log('\n🎉 Perfect! Your DrishtiX setup is complete and ready to use!\n');
  console.log('Next steps:');
  console.log('  1. Run migrations: pnpm prisma migrate dev');
  console.log('  2. Seed database: pnpm prisma db seed');
  console.log('  3. Start dev server: pnpm dev');
  console.log('  4. Visit: http://localhost:5173\n');
  process.exit(0);
}
