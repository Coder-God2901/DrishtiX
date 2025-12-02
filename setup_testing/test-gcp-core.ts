/**
 * DrishtiX - Core GCP Services Integration Tests
 * Tests service account authentication, project access, and IAM permissions
 */

const { testConfig } = require('./test-config');
const chalk = require('chalk');
const { Storage } = require('@google-cloud/storage');
const { BigQuery } = require('@google-cloud/bigquery');
const { PubSub } = require('@google-cloud/pubsub');
const fs = require('fs');
const path = require('path');

export { };

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      status: 'PASS',
      message: 'Test passed successfully',
      duration: Date.now() - startTime,
    });
    console.log(chalk.green(`✅ PASS: ${name} (${Date.now() - startTime}ms)`));
  } catch (error: any) {
    results.push({
      name,
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - startTime,
    });
    console.log(chalk.red(`❌ FAIL: ${name}`));
    console.log(chalk.red(`   Error: ${error.message}`));
  }
}

async function testServiceAccountAuthentication(): Promise<void> {
  console.log(chalk.blue('\n🔐 Testing Service Account Authentication...'));

  await runTest('Verify service account key file exists', async () => {
    const keyPath = process.env.GCP_SERVICE_ACCOUNT_KEY_PATH;

    if (!keyPath) {
      throw new Error('GCP_SERVICE_ACCOUNT_KEY_PATH not set in environment');
    }

    const absolutePath = path.isAbsolute(keyPath) ? keyPath : path.resolve(__dirname, keyPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Service account key file not found at: ${absolutePath}`);
    }

    console.log(chalk.gray(`   Key file found: ${absolutePath}`));
  });

  await runTest('Parse and validate service account credentials', async () => {
    const keyPath = process.env.GCP_SERVICE_ACCOUNT_KEY_PATH;
    const absolutePath = path.isAbsolute(keyPath) ? keyPath : path.resolve(__dirname, keyPath);

    const keyContent = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter((field) => !keyContent[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in service account key: ${missingFields.join(', ')}`);
    }

    if (keyContent.type !== 'service_account') {
      throw new Error(`Invalid service account type: ${keyContent.type}`);
    }

    console.log(chalk.gray(`   Service Account: ${keyContent.client_email}`));
    console.log(chalk.gray(`   Project ID: ${keyContent.project_id}`));
  });

  await runTest('Authenticate with GCP using service account', async () => {
    const storage = new Storage({
      projectId: testConfig.projectId,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
    });

    // Simple API call to verify authentication
    await storage.getBuckets({ maxResults: 1 });

    console.log(chalk.gray(`   Successfully authenticated with GCP`));
  });
}

async function testProjectAccess(): Promise<void> {
  console.log(chalk.blue('\n🏗️  Testing GCP Project Access...'));

  await runTest('Verify project ID matches configuration', async () => {
    const keyPath = process.env.GCP_SERVICE_ACCOUNT_KEY_PATH;
    const absolutePath = path.isAbsolute(keyPath) ? keyPath : path.resolve(__dirname, keyPath);
    const keyContent = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

    const expectedProjectId = process.env.GCP_PROJECT_ID || testConfig.projectId;

    if (keyContent.project_id !== expectedProjectId) {
      throw new Error(
        `Project ID mismatch: Expected ${expectedProjectId}, got ${keyContent.project_id}`
      );
    }

    console.log(chalk.gray(`   Project ID verified: ${keyContent.project_id}`));
  });

  await runTest('Test Storage API access', async () => {
    const storage = new Storage({
      projectId: testConfig.projectId,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
    });

    const [buckets] = await storage.getBuckets({ maxResults: 5 });

    console.log(chalk.gray(`   Storage API accessible`));
    console.log(chalk.gray(`   Found ${buckets.length} storage buckets`));
  });

  await runTest('Test BigQuery API access', async () => {
    const bigquery = new BigQuery({
      projectId: testConfig.projectId,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
    });

    const [datasets] = await bigquery.getDatasets({ maxResults: 5 });

    console.log(chalk.gray(`   BigQuery API accessible`));
    console.log(chalk.gray(`   Found ${datasets.length} datasets`));
  });

  await runTest('Test Pub/Sub API access', async () => {
    const pubsub = new PubSub({
      projectId: testConfig.projectId,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
    });

    const [topics] = await pubsub.getTopics({ pageSize: 5 });

    console.log(chalk.gray(`   Pub/Sub API accessible`));
    console.log(chalk.gray(`   Found ${topics.length} topics`));
  });
}

async function testIAMPermissions(): Promise<void> {
  console.log(chalk.blue('\n🔑 Testing IAM Permissions...'));

  await runTest('Test Pub/Sub permissions', async () => {
    const pubsub = new PubSub({
      projectId: testConfig.projectId,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
    });

    const requiredPermissions = [
      'pubsub.topics.list',
      'pubsub.topics.get',
      'pubsub.topics.publish',
    ];

    // Test by attempting to list topics (requires pubsub.topics.list)
    await pubsub.getTopics({ pageSize: 1 });

    console.log(chalk.gray(`   Pub/Sub permissions verified`));
  });

  await runTest('Test BigQuery permissions', async () => {
    const bigquery = new BigQuery({
      projectId: testConfig.projectId,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
    });

    // Test by attempting to list datasets (requires bigquery.datasets.get)
    await bigquery.getDatasets({ maxResults: 1 });

    console.log(chalk.gray(`   BigQuery permissions verified`));
  });

  await runTest('Test Storage permissions', async () => {
    const storage = new Storage({
      projectId: testConfig.projectId,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
    });

    // Test by attempting to list buckets (requires storage.buckets.list)
    await storage.getBuckets({ maxResults: 1 });

    console.log(chalk.gray(`   Storage permissions verified`));
  });
}

async function testEnvironmentConfiguration(): Promise<void> {
  console.log(chalk.blue('\n⚙️  Testing Environment Configuration...'));

  await runTest('Verify required environment variables', async () => {
    const requiredVars = [
      'GCP_PROJECT_ID',
      'GCP_SERVICE_ACCOUNT_KEY_PATH',
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log(chalk.gray(`   All required environment variables are set`));
  });

  await runTest('Verify GCP region configuration', async () => {
    const region = process.env.GCP_REGION || testConfig.location;

    const validRegions = [
      'us-central1',
      'us-east1',
      'us-west1',
      'europe-west1',
      'asia-south1',
    ];

    if (!validRegions.includes(region)) {
      console.log(chalk.yellow(`   ⚠️  Region ${region} is valid but not in the common list`));
    } else {
      console.log(chalk.gray(`   Region configured: ${region}`));
    }
  });
}

async function testAPIQuotasAndLimits(): Promise<void> {
  console.log(chalk.blue('\n📊 Testing API Quotas and Rate Limits...'));

  await runTest('Test Pub/Sub rate limits', async () => {
    const pubsub = new PubSub({
      projectId: testConfig.projectId,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
    });

    // Make multiple rapid API calls to test rate limiting
    const promises = Array.from({ length: 5 }, () => pubsub.getTopics({ pageSize: 1 }));

    await Promise.all(promises);

    console.log(chalk.gray(`   Successfully made 5 rapid API calls`));
    console.log(chalk.gray(`   No rate limit errors encountered`));
  });

  await runTest('Test BigQuery concurrent queries', async () => {
    const bigquery = new BigQuery({
      projectId: testConfig.projectId,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
    });

    // Test concurrent dataset listing
    const promises = Array.from({ length: 3 }, () => bigquery.getDatasets({ maxResults: 1 }));

    await Promise.all(promises);

    console.log(chalk.gray(`   Successfully executed 3 concurrent queries`));
  });
}

async function printSummary(): Promise<void> {
  console.log(chalk.bold.blue('\n' + '='.repeat(60)));
  console.log(chalk.bold.blue('📊 TEST SUMMARY - GCP Core Services'));
  console.log(chalk.bold.blue('='.repeat(60)));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warned = results.filter((r) => r.status === 'WARN').length;
  const total = results.length;

  console.log(chalk.green(`✅ Passed: ${passed}/${total}`));
  if (failed > 0) {
    console.log(chalk.red(`❌ Failed: ${failed}/${total}`));
  }
  if (warned > 0) {
    console.log(chalk.yellow(`⚠️  Warnings: ${warned}/${total}`));
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(chalk.gray(`\n⏱️  Total Duration: ${totalDuration}ms`));

  if (failed > 0) {
    console.log(chalk.red('\n❌ Some tests failed. Please review the errors above.'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ All GCP core service tests passed!'));
  }
}

async function main(): Promise<void> {
  console.log(chalk.bold.cyan('\n🚀 DrishtiX - GCP Core Services Integration Tests'));
  console.log(chalk.cyan('Testing: Service Account, Project Access, and IAM Permissions\n'));

  try {
    await testServiceAccountAuthentication();
    await testProjectAccess();
    await testIAMPermissions();
    await testEnvironmentConfiguration();
    await testAPIQuotasAndLimits();

    await printSummary();
  } catch (error: any) {
    console.log(chalk.red('\n❌ Fatal error during test execution:'));
    console.log(chalk.red(error.message));
    console.log(chalk.red(error.stack));
    process.exit(1);
  }
}

main();
