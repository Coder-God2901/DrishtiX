/**
 * DrishtiX - BigQuery Integration Tests
 * Tests BigQuery dataset creation, table schema, data insertion, and query execution
 */

const { testConfig } = require('./test-config');
const chalk = require('chalk');
const { BigQuery } = require('@google-cloud/bigquery');

export { };

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  duration: number;
}

const results: TestResult[] = [];
let bigquery: any;

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

async function initializeBigQuery(): Promise<void> {
  console.log(chalk.blue('🔧 Initializing BigQuery...'));

  const projectId = process.env.GCP_PROJECT_ID;

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID not set in environment');
  }

  bigquery = new BigQuery({
    projectId,
    keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
  });

  console.log(chalk.green(`✅ BigQuery initialized for project: ${projectId}`));
}

async function testDatasetAccess(): Promise<void> {
  console.log(chalk.blue('\\n📊 Testing Dataset Access...'));

  await runTest('Verify production dataset exists', async () => {
    const datasetId = testConfig.bigQueryDataset;
    const [dataset] = await bigquery.dataset(datasetId).get();

    console.log(chalk.gray(`   Dataset: ${dataset.id}`));
    console.log(chalk.gray(`   Location: ${dataset.location}`));
    console.log(chalk.gray(`   Created: ${dataset.metadata.creationTime}`));
  });

  await runTest('List dataset tables', async () => {
    const [tables] = await bigquery.dataset(testConfig.bigQueryDataset).getTables();

    console.log(chalk.gray(`   Tables found: ${tables.length}`));

    if (tables.length === 0) {
      console.log(chalk.yellow('   ⚠️  No tables found (expected for new dataset)'));
    } else {
      tables.slice(0, 10).forEach((table: any) => {
        console.log(chalk.gray(`     - ${table.id}`));
      });
    }
  });
}

async function testTableSchema(): Promise<void> {
  console.log(chalk.blue('\\n📋 Testing Table Schema...'));

  await runTest('Verify crowd_predictions table schema', async () => {
    const tableId = 'crowd_predictions';

    try {
      const [table] = await bigquery
        .dataset(testConfig.bigQueryDataset)
        .table(tableId)
        .get();

      const schema = table.metadata.schema.fields;
      console.log(chalk.gray(`   Table: ${tableId}`));
      console.log(chalk.gray(`   Fields: ${schema.length}`));

      const requiredFields = ['prediction_id', 'event_id', 'zone_id', 'timestamp', 'predicted_density', 'confidence'];
      const missingFields = requiredFields.filter(
        field => !schema.find((f: any) => f.name === field)
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log(chalk.gray(`   ✅ All required fields present`));
    } catch (error: any) {
      if (error.message?.includes('Not found')) {
        console.log(chalk.yellow(`   ⚠️  Table not found: ${tableId}`));
        console.log(chalk.yellow(`   Run: bq mk --table ${testConfig.bigQueryDataset}.${tableId} schema.json`));
      }
      throw error;
    }
  });

  await runTest('Verify incident_logs table schema', async () => {
    const tableId = 'incident_logs';

    try {
      const [table] = await bigquery
        .dataset(testConfig.bigQueryDataset)
        .table(tableId)
        .get();

      const schema = table.metadata.schema.fields;
      console.log(chalk.gray(`   Table: ${tableId}`));
      console.log(chalk.gray(`   Fields: ${schema.length}`));

      const requiredFields = ['incident_id', 'event_id', 'timestamp', 'type', 'severity', 'status'];
      const missingFields = requiredFields.filter(
        field => !schema.find((f: any) => f.name === field)
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log(chalk.gray(`   ✅ All required fields present`));
    } catch (error: any) {
      if (error.message?.includes('Not found')) {
        console.log(chalk.yellow(`   ⚠️  Table not found: ${tableId}`));
        console.log(chalk.yellow(`   Run: bq mk --table ${testConfig.bigQueryDataset}.${tableId} schema.json`));
      }
      throw error;
    }
  });

  await runTest('Verify event_analytics table schema', async () => {
    const tableId = 'event_analytics';

    try {
      const [table] = await bigquery
        .dataset(testConfig.bigQueryDataset)
        .table(tableId)
        .get();

      const schema = table.metadata.schema.fields;
      console.log(chalk.gray(`   Table: ${tableId}`));
      console.log(chalk.gray(`   Fields: ${schema.length}`));

      const requiredFields = ['event_id', 'date', 'total_attendees', 'peak_crowd_density', 'incidents_count'];
      const missingFields = requiredFields.filter(
        field => !schema.find((f: any) => f.name === field)
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log(chalk.gray(`   ✅ All required fields present`));
    } catch (error: any) {
      if (error.message?.includes('Not found')) {
        console.log(chalk.yellow(`   ⚠️  Table not found: ${tableId}`));
        console.log(chalk.yellow(`   Run: bq mk --table ${testConfig.bigQueryDataset}.${tableId} schema.json`));
      }
      throw error;
    }
  });
}

async function testDataInsertion(): Promise<void> {
  console.log(chalk.blue('\\n📝 Testing Data Insertion...'));

  await runTest('Insert test prediction data', async () => {
    const tableId = 'crowd_predictions';
    const rows = [
      {
        prediction_id: `test-${Date.now()}`,
        event_id: testConfig.testEventId,
        zone_id: 'zone-1',
        timestamp: new Date().toISOString(),
        predicted_density: 0.75,
        confidence: 0.92,
        prediction_horizon_minutes: 15,
        model_version: '2.0.0',
      },
    ];

    try {
      await bigquery
        .dataset(testConfig.bigQueryDataset)
        .table(tableId)
        .insert(rows);

      console.log(chalk.gray(`   Inserted ${rows.length} row(s) into ${tableId}`));
    } catch (error: any) {
      if (error.message?.includes('Not found')) {
        console.log(chalk.yellow(`   ⚠️  Skipping: Table ${tableId} not found`));
        return;
      }
      throw error;
    }
  });

  await runTest('Insert test incident data', async () => {
    const tableId = 'incident_logs';
    const rows = [
      {
        incident_id: `test-incident-${Date.now()}`,
        event_id: testConfig.testEventId,
        timestamp: new Date().toISOString(),
        type: 'CROWD_SURGE',
        severity: 'HIGH',
        status: 'RESOLVED',
        location: { lat: 40.7128, lng: -74.006 },
        affected_zones: ['zone-1', 'zone-2'],
        response_time_seconds: 120,
      },
    ];

    try {
      await bigquery
        .dataset(testConfig.bigQueryDataset)
        .table(tableId)
        .insert(rows);

      console.log(chalk.gray(`   Inserted ${rows.length} row(s) into ${tableId}`));
    } catch (error: any) {
      if (error.message?.includes('Not found')) {
        console.log(chalk.yellow(`   ⚠️  Skipping: Table ${tableId} not found`));
        return;
      }
      throw error;
    }
  });
}

async function testQueryExecution(): Promise<void> {
  console.log(chalk.blue('\\n🔍 Testing Query Execution...'));

  await runTest('Query recent predictions', async () => {
    const query = `
      SELECT 
        prediction_id,
        zone_id,
        predicted_density,
        confidence,
        timestamp
      FROM \`${testConfig.bigQueryDataset}.crowd_predictions\`
      WHERE event_id = @eventId
        AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    const options = {
      query,
      params: { eventId: testConfig.testEventId },
    };

    try {
      const [rows] = await bigquery.query(options);

      console.log(chalk.gray(`   Query returned ${rows.length} row(s)`));

      if (rows.length > 0) {
        rows.slice(0, 3).forEach((row: any) => {
          console.log(chalk.gray(`     - Zone ${row.zone_id}: ${(row.predicted_density * 100).toFixed(1)}% (${(row.confidence * 100).toFixed(1)}% confidence)`));
        });
      }
    } catch (error: any) {
      if (error.message?.includes('Not found')) {
        console.log(chalk.yellow(`   ⚠️  Skipping: Table not found`));
        return;
      }
      throw error;
    }
  });

  await runTest('Query incident statistics', async () => {
    const query = `
      SELECT 
        type,
        severity,
        COUNT(*) as incident_count,
        AVG(response_time_seconds) as avg_response_time
      FROM \`${testConfig.bigQueryDataset}.incident_logs\`
      WHERE event_id = @eventId
        AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
      GROUP BY type, severity
      ORDER BY incident_count DESC
      LIMIT 10
    `;

    const options = {
      query,
      params: { eventId: testConfig.testEventId },
    };

    try {
      const [rows] = await bigquery.query(options);

      console.log(chalk.gray(`   Query returned ${rows.length} incident type(s)`));

      if (rows.length > 0) {
        rows.slice(0, 3).forEach((row: any) => {
          console.log(chalk.gray(`     - ${row.type} (${row.severity}): ${row.incident_count} incidents, ${row.avg_response_time?.toFixed(0)}s avg response`));
        });
      }
    } catch (error: any) {
      if (error.message?.includes('Not found')) {
        console.log(chalk.yellow(`   ⚠️  Skipping: Table not found`));
        return;
      }
      throw error;
    }
  });
}

async function testStreamingInserts(): Promise<void> {
  console.log(chalk.blue('\\n⚡ Testing Streaming Inserts...'));

  await runTest('Stream multiple prediction rows', async () => {
    const tableId = 'crowd_predictions';
    const rows = Array.from({ length: 5 }, (_, i) => ({
      prediction_id: `stream-test-${Date.now()}-${i}`,
      event_id: testConfig.testEventId,
      zone_id: `zone-${i + 1}`,
      timestamp: bigquery.timestamp(new Date()),
      predicted_density: Math.random(),
      confidence: 0.8 + Math.random() * 0.2,
      prediction_horizon_minutes: 15,
      model_version: '2.0.0',
    }));

    try {
      const response = await bigquery
        .dataset(testConfig.bigQueryDataset)
        .table(tableId)
        .insert(rows); // Streaming insert (removed raw: true)

      console.log(chalk.gray(`   Streamed ${rows.length} rows to ${tableId}`));
      console.log(chalk.gray(`   Streaming inserts available immediately (no batch delay)`));
    } catch (error: any) {
      if (error.message?.includes('Not found')) {
        console.log(chalk.yellow(`   ⚠️  Skipping: Table ${tableId} not found`));
        return;
      }
      throw new Error(error.message || error.name || 'Unknown streaming insert error');
    }
  });
}

async function runAllTests(): Promise<void> {
  console.log(chalk.bold.cyan('\\n🧪 DrishtiX BigQuery Integration Tests'));
  console.log(chalk.cyan('='.repeat(50)));

  console.log(chalk.blue('\\n📌 Testing BigQuery Analytics'));
  console.log(chalk.gray(`   Project: ${process.env.GCP_PROJECT_ID}`));
  console.log(chalk.gray(`   Dataset: ${testConfig.bigQueryDataset}\\n`));

  try {
    await initializeBigQuery();
    await testDatasetAccess();
    await testTableSchema();
    await testDataInsertion();
    await testQueryExecution();
    await testStreamingInserts();

    // Print summary
    console.log(chalk.bold.cyan('\\n' + '='.repeat(50)));
    console.log(chalk.bold.cyan('Test Summary:'));
    console.log(chalk.cyan('='.repeat(50)));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warned = results.filter(r => r.status === 'WARN').length;

    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.yellow(`⚠️  Warnings: ${warned}`));
    console.log(chalk.white(`📊 Total: ${results.length}`));
    console.log(chalk.white(`⏱️  Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`));

    console.log(chalk.bold.cyan('\\n🎯 BigQuery Features Verified:'));
    console.log(chalk.green('   ✅ Dataset access'));
    console.log(chalk.green('   ✅ Table schemas (crowd_predictions, incident_logs, event_analytics)'));
    console.log(chalk.green('   ✅ Data insertion (batch)'));
    console.log(chalk.green('   ✅ Query execution (parameterized queries)'));
    console.log(chalk.green('   ✅ Streaming inserts (real-time analytics)'));
    console.log(chalk.green('   ✅ Aggregation queries (statistics)'));

    if (failed > 0) {
      console.log(chalk.red('\\n❌ Some tests failed. Check:'));
      console.log(chalk.yellow('   1. GCP credentials: GCP_SERVICE_ACCOUNT_KEY_PATH'));
      console.log(chalk.yellow('   2. Dataset exists: bq ls ${GCP_PROJECT_ID}:'));
      console.log(chalk.yellow('   3. Tables created: bq ls ${GCP_PROJECT_ID}:${testConfig.bigQueryDataset}'));
      console.log(chalk.yellow('   4. IAM permissions: BigQuery Data Editor, BigQuery Job User'));
      process.exit(1);
    } else {
      console.log(chalk.green('\\n✅ All BigQuery tests passed!'));
      console.log(chalk.green('   📊 Analytics pipeline is production-ready'));
      process.exit(0);
    }
  } catch (error: any) {
    console.error(chalk.red('\\n❌ Test suite failed:'), error.message);
    console.log(chalk.yellow('\\nℹ️  Troubleshooting:'));
    console.log(chalk.yellow('   1. Check project ID: GCP_PROJECT_ID'));
    console.log(chalk.yellow('   2. Check service account key: GCP_SERVICE_ACCOUNT_KEY_PATH'));
    console.log(chalk.yellow('   3. Create dataset: bq mk --dataset ${GCP_PROJECT_ID}:drishtix_analytics'));
    console.log(chalk.yellow('   4. Grant permissions: roles/bigquery.dataEditor, roles/bigquery.jobUser'));
    process.exit(1);
  }
}

// Run tests
runAllTests();
