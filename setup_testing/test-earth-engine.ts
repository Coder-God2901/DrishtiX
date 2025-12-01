/**
 * DrishtiX - Earth Engine Integration Tests
 * Tests satellite imagery, terrain analysis, and land cover classification
 */

const { testConfig } = require('./test-config');
const chalk = require('chalk');
const axios = require('axios');

export { };

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  duration: number;
}

const results: TestResult[] = [];
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

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
    console.log(chalk.green(`✅ PASS: ${name}`));
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

async function testEarthEngineStatus(): Promise<void> {
  console.log(chalk.blue('\\n🌍 Testing Earth Engine Status...'));

  await runTest('Check Earth Engine service status', async () => {
    const response = await axios.get(`${API_BASE_URL}/earth-engine/status`);

    if (!response.data.success) {
      throw new Error('Earth Engine status check failed');
    }

    const { initialized, mode, features } = response.data.data;

    console.log(chalk.gray(`   Mode: ${mode}`));
    console.log(chalk.gray(`   Initialized: ${initialized}`));
    console.log(chalk.gray(`   Features: ${JSON.stringify(features, null, 2)}`));

    if (!initialized && testConfig.earthEngineEnabled) {
      throw new Error('Earth Engine should be initialized but is not');
    }
  });
}

async function testSatelliteImagery(): Promise<void> {
  console.log(chalk.blue('\\n🛰️  Testing Satellite Imagery (Sentinel-2)...'));

  await runTest('Retrieve venue satellite imagery', async () => {
    const response = await axios.post(`${API_BASE_URL}/earth-engine/venue-imagery`, {
      eventId: testConfig.testEventId,
      venueBounds: testConfig.testVenueBounds,
      resolution: 10,
      layers: ['rgb'],
    }, {
      timeout: testConfig.earthEngineTimeout,
    });

    if (!response.data.success) {
      throw new Error('Failed to retrieve satellite imagery');
    }

    const { imageryUrl, source, resolution } = response.data.data;

    console.log(chalk.gray(`   Source: ${source}`));
    console.log(chalk.gray(`   Resolution: ${resolution}`));
    console.log(chalk.gray(`   Imagery URL: ${imageryUrl.substring(0, 50)}...`));

    if (!imageryUrl || imageryUrl === '/api/fallback-imagery') {
      console.log(chalk.yellow(`   ⚠️  Using fallback imagery (Earth Engine may not be enabled)`));
    }
  });
}

async function testTerrainAnalysis(): Promise<void> {
  console.log(chalk.blue('\\n⛰️  Testing Terrain Analysis (SRTM)...'));

  await runTest('Analyze venue terrain', async () => {
    const response = await axios.post(`${API_BASE_URL}/earth-engine/terrain-data`, {
      venueBounds: testConfig.testVenueBounds,
    }, {
      timeout: testConfig.earthEngineTimeout,
    });

    if (!response.data.success) {
      throw new Error('Failed to analyze terrain');
    }

    const { elevation, slope, aspect, hazardZones, source, resolution } = response.data.data;

    console.log(chalk.gray(`   Source: ${source}`));
    console.log(chalk.gray(`   Resolution: ${resolution}`));
    console.log(chalk.gray(`   Elevation samples: ${elevation.length}`));
    console.log(chalk.gray(`   Slope samples: ${slope.length}`));
    console.log(chalk.gray(`   Aspect samples: ${aspect.length}`));
    console.log(chalk.gray(`   Hazard zones detected: ${hazardZones.length}`));

    if (hazardZones.length > 0) {
      console.log(chalk.yellow(`   ⚠️  ${hazardZones.length} hazard zones detected (steep slopes >30°)`));
      hazardZones.slice(0, 3).forEach((zone: any) => {
        console.log(chalk.yellow(`      - ${zone.type} at (${zone.lat.toFixed(4)}, ${zone.lon.toFixed(4)})`));
      });
    }
  });
}

async function testLandCoverClassification(): Promise<void> {
  console.log(chalk.blue('\\n🌳 Testing Land Cover Classification (ESA WorldCover)...'));

  await runTest('Classify venue land cover', async () => {
    const response = await axios.post(`${API_BASE_URL}/earth-engine/land-cover`, {
      venueBounds: testConfig.testVenueBounds,
    }, {
      timeout: testConfig.earthEngineTimeout,
    });

    if (!response.data.success) {
      throw new Error('Failed to classify land cover');
    }

    const { landCoverUrl, source, resolution } = response.data.data;

    console.log(chalk.gray(`   Source: ${source}`));
    console.log(chalk.gray(`   Resolution: ${resolution}`));
    console.log(chalk.gray(`   Land cover URL: ${landCoverUrl.substring(0, 50)}...`));

    if (!landCoverUrl || landCoverUrl === '/api/fallback-landcover') {
      console.log(chalk.yellow(`   ⚠️  Using fallback land cover (Earth Engine may not be enabled)`));
    }
  });
}

async function testSyntheticCrowdData(): Promise<void> {
  console.log(chalk.blue('\\n👥 Testing Synthetic Crowd Data Generation...'));

  await runTest('Generate synthetic crowd data', async () => {
    const response = await axios.post(`${API_BASE_URL}/earth-engine/synthetic-data`, {
      venueBounds: testConfig.testVenueBounds,
      gridSize: 50,
      scenario: 'NORMAL',
    });

    if (!response.data.success) {
      throw new Error('Failed to generate synthetic data');
    }

    const { gridCells, timestamp, scenario, totalSimulatedCount } = response.data.data;

    console.log(chalk.gray(`   Grid cells: ${gridCells.length}`));
    console.log(chalk.gray(`   Scenario: ${scenario}`));
    console.log(chalk.gray(`   Total simulated count: ${totalSimulatedCount}`));
    console.log(chalk.gray(`   Timestamp: ${new Date(timestamp).toISOString()}`));
  });

  await runTest('Generate SURGE scenario', async () => {
    const response = await axios.post(`${API_BASE_URL}/earth-engine/synthetic-data`, {
      venueBounds: testConfig.testVenueBounds,
      gridSize: 50,
      scenario: 'SURGE',
    });

    if (!response.data.success) {
      throw new Error('Failed to generate SURGE scenario');
    }

    const { totalSimulatedCount } = response.data.data;
    console.log(chalk.gray(`   SURGE total count: ${totalSimulatedCount}`));
  });
}

async function runAllTests(): Promise<void> {
  console.log(chalk.bold.cyan('\\n🧪 DrishtiX Earth Engine Integration Tests'));
  console.log(chalk.cyan('='.repeat(50)));

  if (!testConfig.earthEngineEnabled) {
    console.log(chalk.yellow('\\n⚠️  Earth Engine is disabled in config'));
    console.log(chalk.yellow('   Tests will run in fallback mode'));
  }

  try {
    await testEarthEngineStatus();
    await testSatelliteImagery();
    await testTerrainAnalysis();
    await testLandCoverClassification();
    await testSyntheticCrowdData();

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

    if (failed > 0) {
      console.log(chalk.red('\\n❌ Some tests failed. Check errors above.'));
      process.exit(1);
    } else {
      console.log(chalk.green('\\n✅ All tests passed successfully!'));
      process.exit(0);
    }
  } catch (error: any) {
    console.error(chalk.red('\\n❌ Test suite failed:'), error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
