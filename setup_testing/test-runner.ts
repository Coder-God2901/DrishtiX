/**
 * DrishtiX - Test Runner
 * Orchestrates all integration tests and generates comprehensive reports
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestSuite {
  name: string;
  file: string;
  description: string;
  required: boolean;
  timeout: number;
}

interface TestResult {
  suite: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  output: string;
  error?: string;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'Pub/Sub Integration',
    file: 'test-pubsub.ts',
    description: 'Tests Pub/Sub topic creation, message publishing, and subscriptions',
    required: true,
    timeout: 60000,
  },
  {
    name: 'BigQuery Analytics',
    file: 'test-bigquery.ts',
    description: 'Tests BigQuery dataset, table schema, queries, and streaming inserts',
    required: true,
    timeout: 90000,
  },
  {
    name: 'Firestore Database',
    file: 'test-firestore.ts',
    description: 'Tests Firestore CRUD, security rules, indexes, and real-time listeners',
    required: true,
    timeout: 60000,
  },
  {
    name: 'Earth Engine API',
    file: 'test-earth-engine.ts',
    description: 'Tests satellite imagery, terrain analysis, land cover, and synthetic data',
    required: true,
    timeout: 120000,
  },
  {
    name: 'Maps Platform',
    file: 'test-maps-platform.ts',
    description: 'Tests Maps API, Routes, Places, POI discovery, and geocoding',
    required: true,
    timeout: 60000,
  },
  {
    name: 'Local ML Services',
    file: 'test-local-ml.ts',
    description: 'Tests YOLO vision service and ConvLSTM forecasting service',
    required: true,
    timeout: 60000,
  },
  {
    name: 'Firebase Auth & FCM',
    file: 'test-firebase.ts',
    description: 'Tests Firebase Authentication, custom claims, FCM, and MFA',
    required: true,
    timeout: 60000,
  },
];

const results: TestResult[] = [];

async function runTestSuite(suite: TestSuite): Promise<TestResult> {
  console.log(chalk.bold.blue(`\\n${'='.repeat(60)}`));
  console.log(chalk.bold.blue(`Running: ${suite.name}`));
  console.log(chalk.blue(`Description: ${suite.description}`));
  console.log(chalk.blue(`Timeout: ${suite.timeout / 1000}s`));
  console.log(chalk.bold.blue('='.repeat(60)));

  const startTime = Date.now();

  return new Promise<TestResult>((resolve) => {
    let output = '';
    let errorOutput = '';

    const testProcess = spawn('npx', ['ts-node', suite.file], {
      cwd: __dirname,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    const timeout = setTimeout(() => {
      testProcess.kill();
      resolve({
        suite: suite.name,
        status: 'FAIL',
        duration: Date.now() - startTime,
        output: output + '\\n[TIMEOUT]',
        error: `Test suite exceeded timeout of ${suite.timeout / 1000}s`,
      });
    }, suite.timeout);

    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    testProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });

    testProcess.on('close', (code) => {
      clearTimeout(timeout);

      const duration = Date.now() - startTime;
      const status = code === 0 ? 'PASS' : 'FAIL';

      resolve({
        suite: suite.name,
        status,
        duration,
        output,
        error: code !== 0 ? errorOutput || `Exit code: ${code}` : undefined,
      });
    });
  });
}

async function generateHTMLReport(results: TestResult[]): Promise<void> {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DrishtiX Integration Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 40px; }
    h1 { color: #1a1a1a; margin-bottom: 10px; }
    .subtitle { color: #666; margin-bottom: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
    .summary-card.passed { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); }
    .summary-card.failed { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .summary-card.skipped { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); }
    .summary-card h3 { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
    .summary-card .value { font-size: 32px; font-weight: bold; }
    .test-list { margin-top: 20px; }
    .test-item { border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }
    .test-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #fafafa; cursor: pointer; }
    .test-header:hover { background: #f0f0f0; }
    .test-name { font-weight: 600; font-size: 16px; }
    .test-status { padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; }
    .test-status.PASS { background: #d1fae5; color: #065f46; }
    .test-status.FAIL { background: #fee2e2; color: #991b1b; }
    .test-status.SKIP { background: #fef3c7; color: #92400e; }
    .test-body { padding: 20px; background: #fafafa; display: none; }
    .test-body.expanded { display: block; }
    .test-output { background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 4px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 12px; max-height: 400px; overflow-y: auto; }
    .test-meta { display: flex; gap: 20px; margin-bottom: 15px; color: #666; font-size: 14px; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 DrishtiX Integration Test Report</h1>
    <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Total Tests</h3>
        <div class="value">${total}</div>
      </div>
      <div class="summary-card passed">
        <h3>Passed</h3>
        <div class="value">${passed}</div>
      </div>
      <div class="summary-card failed">
        <h3>Failed</h3>
        <div class="value">${failed}</div>
      </div>
      <div class="summary-card skipped">
        <h3>Skipped</h3>
        <div class="value">${skipped}</div>
      </div>
      <div class="summary-card">
        <h3>Success Rate</h3>
        <div class="value">${successRate}%</div>
      </div>
    </div>
    
    <h2>Test Results</h2>
    <div class="test-list">
      ${results.map((result, index) => `
        <div class="test-item">
          <div class="test-header" onclick="document.getElementById('test-${index}').classList.toggle('expanded')">
            <div class="test-name">${result.suite}</div>
            <div class="test-status ${result.status}">${result.status}</div>
          </div>
          <div id="test-${index}" class="test-body">
            <div class="test-meta">
              <span>⏱️ Duration: ${(result.duration / 1000).toFixed(2)}s</span>
            </div>
            ${result.error ? `<div style="color: #dc2626; margin-bottom: 10px;">❌ Error: ${result.error}</div>` : ''}
            <div class="test-output">${escapeHtml(stripAnsiCodes(result.output))}</div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p>DrishtiX v2.0.0 - AI-Powered Crowd Safety Platform</p>
      <p>Hybrid Architecture: Local ML + GCP Services</p>
    </div>
  </div>
  
  <script>
    // Click first failed test to expand it
    const failedTests = document.querySelectorAll('.test-status.FAIL');
    if (failedTests.length > 0) {
      failedTests[0].parentElement.click();
    }
  </script>
</body>
</html>
`;

  const reportPath = path.join(__dirname, 'test-report.html');
  fs.writeFileSync(reportPath, html);
  console.log(chalk.green(`\\n✅ HTML report generated: ${reportPath}`));
}

function stripAnsiCodes(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, '');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

async function generateJSONReport(results: TestResult[]): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    platform: 'DrishtiX v2.0.0',
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      failed: results.filter(r => r.status === 'FAIL').length,
      skipped: results.filter(r => r.status === 'SKIP').length,
      successRate: ((results.filter(r => r.status === 'PASS').length / results.length) * 100).toFixed(1),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    },
    results: results.map(r => ({
      suite: r.suite,
      status: r.status,
      duration: r.duration,
      error: r.error,
    })),
  };

  const reportPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(chalk.green(`✅ JSON report generated: ${reportPath}`));
}

async function generateLogReport(results: TestResult[]): Promise<void> {
  let log = '';

  log += '='.repeat(80) + '\\n';
  log += 'DrishtiX Integration Test Report\\n';
  log += `Generated: ${new Date().toISOString()}\\n`;
  log += '='.repeat(80) + '\\n\\n';

  results.forEach((result) => {
    log += `[${result.status}] ${result.suite}\\n`;
    log += `Duration: ${(result.duration / 1000).toFixed(2)}s\\n`;
    if (result.error) {
      log += `Error: ${result.error}\\n`;
    }
    log += '\\n' + stripAnsiCodes(result.output) + '\\n';
    log += '-'.repeat(80) + '\\n\\n';
  });

  const reportPath = path.join(__dirname, 'test-results.log');
  fs.writeFileSync(reportPath, log);
  console.log(chalk.green(`✅ Log report generated: ${reportPath}`));
}

async function runAllTests(): Promise<void> {
  console.log(chalk.bold.cyan('\\n' + '='.repeat(80)));
  console.log(chalk.bold.cyan('🧪 DrishtiX Comprehensive Integration Test Suite'));
  console.log(chalk.bold.cyan('='.repeat(80)));

  console.log(chalk.blue('\\n📋 Test Plan:'));
  TEST_SUITES.forEach((suite, index) => {
    console.log(chalk.white(`   ${index + 1}. ${suite.name} - ${suite.description}`));
  });

  console.log(chalk.blue('\\n🚀 Starting test execution...\\n'));

  for (const suite of TEST_SUITES) {
    const result = await runTestSuite(suite);
    results.push(result);

    if (result.status === 'FAIL' && suite.required) {
      console.log(chalk.yellow(`\\n⚠️  Required test suite failed: ${suite.name}`));
      console.log(chalk.yellow('Continuing with remaining tests...\\n'));
    }
  }

  // Generate reports
  console.log(chalk.bold.cyan('\\n' + '='.repeat(80)));
  console.log(chalk.bold.cyan('📊 Generating Test Reports'));
  console.log(chalk.bold.cyan('='.repeat(80)));

  await generateJSONReport(results);
  await generateLogReport(results);
  await generateHTMLReport(results);

  // Print final summary
  console.log(chalk.bold.cyan('\\n' + '='.repeat(80)));
  console.log(chalk.bold.cyan('📈 Final Test Summary'));
  console.log(chalk.bold.cyan('='.repeat(80)));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);

  console.log(chalk.green(`\\n✅ Passed: ${passed}/${total}`));
  console.log(chalk.red(`❌ Failed: ${failed}/${total}`));
  console.log(chalk.yellow(`⏭️  Skipped: ${skipped}/${total}`));
  console.log(chalk.white(`📊 Success Rate: ${successRate}%`));

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(chalk.white(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`));

  console.log(chalk.bold.cyan('\\n🎯 Test Suite Breakdown:'));
  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    const color = result.status === 'PASS' ? chalk.green : result.status === 'FAIL' ? chalk.red : chalk.yellow;
    console.log(color(`   ${icon} ${result.suite} (${(result.duration / 1000).toFixed(2)}s)`));
  });

  if (failed > 0) {
    console.log(chalk.bold.red('\\n❌ Some tests failed!'));
    console.log(chalk.yellow('\\n📋 Check test-report.html for detailed results'));
    console.log(chalk.yellow('💡 Troubleshooting steps:'));
    console.log(chalk.yellow('   1. Verify all environment variables are set (.env file)'));
    console.log(chalk.yellow('   2. Check GCP credentials and permissions'));
    console.log(chalk.yellow('   3. Ensure Docker containers are running (ml-service, vision-service)'));
    console.log(chalk.yellow('   4. Verify Firebase project configuration'));
    console.log(chalk.yellow('   5. Check network connectivity to GCP services'));
    process.exit(1);
  } else {
    console.log(chalk.bold.green('\\n🎉 All tests passed!'));
    console.log(chalk.green('\\n✅ DrishtiX is production-ready!'));
    console.log(chalk.green('   🔥 All GCP integrations verified'));
    console.log(chalk.green('   🤖 Local ML services operational'));
    console.log(chalk.green('   🔐 Authentication and messaging configured'));
    console.log(chalk.green('   📊 Analytics pipeline ready'));
    console.log(chalk.green('   💰 Cost-optimized hybrid architecture'));
    process.exit(0);
  }
}

// Run all tests
runAllTests().catch((error) => {
  console.error(chalk.red('\\n❌ Test runner failed:'), error);
  process.exit(1);
});
