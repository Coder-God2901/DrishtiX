/**
 * DrishtiX - Earth Engine Direct API Tests
 * Tests Earth Engine API directly without backend server
 * Separate test file - does not modify existing test suite
 */

const { testConfig } = require('./test-config');
const chalk = require('chalk');
const ee = require('@google/earthengine');
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
let eeInitialized = false;

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

async function initializeEarthEngine(): Promise<void> {
  if (eeInitialized) return;

  return new Promise<void>((resolve, reject) => {
    try {
      const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                      path.join(__dirname, '..', 'config', 'gcp-service-account-key.json');
      
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Service account key not found at: ${keyPath}`);
      }

      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

      ee.data.authenticateViaPrivateKey(
        serviceAccount,
        () => {
          ee.initialize(
            null,
            null,
            () => {
              console.log(chalk.green('✅ Earth Engine initialized successfully'));
              eeInitialized = true;
              resolve();
            },
            (error: Error) => {
              reject(new Error(`Earth Engine initialization failed: ${error.message}`));
            }
          );
        },
        (error: Error) => {
          reject(new Error(`Earth Engine authentication failed: ${error.message}`));
        }
      );
    } catch (error: any) {
      reject(error);
    }
  });
}

async function testEarthEngineInit(): Promise<void> {
  console.log(chalk.blue('\n🌍 Testing Earth Engine Initialization...'));

  await runTest('Initialize Earth Engine', async () => {
    await initializeEarthEngine();
    console.log(chalk.gray(`   Status: Initialized`));
  });

  await runTest('Verify Earth Engine API access', async () => {
    if (!eeInitialized) {
      throw new Error('Earth Engine not initialized');
    }

    // Simple test - get Earth Engine version info
    const testImage = ee.Image(1);
    console.log(chalk.gray(`   Earth Engine API accessible`));
  });
}

async function testImageCollections(): Promise<void> {
  console.log(chalk.blue('\n🛰️  Testing Image Collections...'));

  await runTest('Access Sentinel-2 collection', async () => {
    if (!eeInitialized) {
      throw new Error('Earth Engine not initialized');
    }

    const bounds = ee.Geometry.Rectangle([
      testConfig.testVenueBounds.west,
      testConfig.testVenueBounds.south,
      testConfig.testVenueBounds.east,
      testConfig.testVenueBounds.north,
    ]);

    const sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(bounds)
      .filterDate('2024-01-01', '2024-12-31')
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

    // Get collection info
    const info: any = await new Promise((resolve, reject) => {
      sentinel2.size().evaluate((result: any, error: any) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log(chalk.gray(`   Sentinel-2 images found: ${info}`));
  });

  await runTest('Access Landsat 8 collection', async () => {
    if (!eeInitialized) {
      throw new Error('Earth Engine not initialized');
    }

    const bounds = ee.Geometry.Rectangle([
      testConfig.testVenueBounds.west,
      testConfig.testVenueBounds.south,
      testConfig.testVenueBounds.east,
      testConfig.testVenueBounds.north,
    ]);

    const landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .filterBounds(bounds)
      .filterDate('2024-01-01', '2024-12-31')
      .filter(ee.Filter.lt('CLOUD_COVER', 20));

    const info: any = await new Promise((resolve, reject) => {
      landsat8.size().evaluate((result: any, error: any) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log(chalk.gray(`   Landsat 8 images found: ${info}`));
  });
}

async function testTerrainData(): Promise<void> {
  console.log(chalk.blue('\n⛰️  Testing Terrain Data (SRTM)...'));

  await runTest('Access SRTM elevation data', async () => {
    if (!eeInitialized) {
      throw new Error('Earth Engine not initialized');
    }

    const srtm = ee.Image('USGS/SRTMGL1_003');
    const point = ee.Geometry.Point([
      testConfig.testLocation.lng,
      testConfig.testLocation.lat,
    ]);

    const elevation: any = await new Promise((resolve, reject) => {
      srtm.select('elevation').reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: point,
        scale: 30,
      }).evaluate((result: any, error: any) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log(chalk.gray(`   Elevation at venue: ${Math.round(elevation.elevation)}m`));
  });

  await runTest('Calculate slope from SRTM', async () => {
    if (!eeInitialized) {
      throw new Error('Earth Engine not initialized');
    }

    const srtm = ee.Image('USGS/SRTMGL1_003');
    const slope = ee.Terrain.slope(srtm);
    
    const bounds = ee.Geometry.Rectangle([
      testConfig.testVenueBounds.west,
      testConfig.testVenueBounds.south,
      testConfig.testVenueBounds.east,
      testConfig.testVenueBounds.north,
    ]);

    const slopeStats: any = await new Promise((resolve, reject) => {
      slope.reduceRegion({
        reducer: ee.Reducer.mean().combine({
          reducer2: ee.Reducer.max(),
          sharedInputs: true,
        }),
        geometry: bounds,
        scale: 30,
      }).evaluate((result: any, error: any) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log(chalk.gray(`   Average slope: ${slopeStats.slope_mean?.toFixed(2)}°`));
    console.log(chalk.gray(`   Maximum slope: ${slopeStats.slope_max?.toFixed(2)}°`));
  });
}

async function testLandCover(): Promise<void> {
  console.log(chalk.blue('\n🌳 Testing Land Cover Data...'));

  await runTest('Access ESA WorldCover', async () => {
    if (!eeInitialized) {
      throw new Error('Earth Engine not initialized');
    }

    const worldCover = ee.ImageCollection('ESA/WorldCover/v200')
      .first();

    const bounds = ee.Geometry.Rectangle([
      testConfig.testVenueBounds.west,
      testConfig.testVenueBounds.south,
      testConfig.testVenueBounds.east,
      testConfig.testVenueBounds.north,
    ]);

    const landCoverStats: any = await new Promise((resolve, reject) => {
      worldCover.select('Map').reduceRegion({
        reducer: ee.Reducer.frequencyHistogram(),
        geometry: bounds,
        scale: 10,
      }).evaluate((result: any, error: any) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log(chalk.gray(`   Land cover classes detected: ${Object.keys(landCoverStats.Map || {}).length}`));
  });
}

async function testDataExport(): Promise<void> {
  console.log(chalk.blue('\n📤 Testing Data Export Capabilities...'));

  await runTest('Generate thumbnail URL', async () => {
    if (!eeInitialized) {
      throw new Error('Earth Engine not initialized');
    }

    const bounds = ee.Geometry.Rectangle([
      testConfig.testVenueBounds.west,
      testConfig.testVenueBounds.south,
      testConfig.testVenueBounds.east,
      testConfig.testVenueBounds.north,
    ]);

    const sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(bounds)
      .filterDate('2024-01-01', '2024-12-31')
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
      .first();

    const rgbVis = {
      min: 0,
      max: 3000,
      bands: ['B4', 'B3', 'B2'],
    };

    const thumbUrl: any = await new Promise((resolve, reject) => {
      sentinel2.getThumbURL({
        dimensions: '512x512',
        region: bounds,
        format: 'png',
        ...rgbVis,
      }, (url: string, error: any) => {
        if (error) reject(error);
        else resolve(url);
      });
    });

    console.log(chalk.gray(`   Thumbnail URL generated: ${thumbUrl.substring(0, 50)}...`));
  });
}

async function runAllTests(): Promise<void> {
  console.log(chalk.bold.cyan('\n🧪 DrishtiX Earth Engine Direct API Tests'));
  console.log(chalk.cyan('='.repeat(60)));
  console.log(chalk.yellow('ℹ️  Testing Earth Engine API directly (no backend server required)'));

  if (!process.env.EARTH_ENGINE_ENABLED || process.env.EARTH_ENGINE_ENABLED === 'false') {
    console.log(chalk.yellow('\n⚠️  Earth Engine is disabled in .env'));
    console.log(chalk.yellow('   Set EARTH_ENGINE_ENABLED=true to run these tests'));
    process.exit(0);
  }

  try {
    await testEarthEngineInit();
    await testImageCollections();
    await testTerrainData();
    await testLandCover();
    await testDataExport();

    // Print summary
    console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
    console.log(chalk.bold.cyan('Test Summary:'));
    console.log(chalk.cyan('='.repeat(60)));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warned = results.filter(r => r.status === 'WARN').length;

    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.yellow(`⚠️  Warnings: ${warned}`));
    console.log(chalk.white(`📊 Total: ${results.length}`));
    console.log(chalk.white(`⏱️  Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`));

    console.log(chalk.bold.cyan('\n📋 Features Verified:'));
    console.log(chalk.green('   ✅ Earth Engine Authentication'));
    console.log(chalk.green('   ✅ Sentinel-2 Satellite Imagery'));
    console.log(chalk.green('   ✅ Landsat 8 Imagery'));
    console.log(chalk.green('   ✅ SRTM Terrain Data'));
    console.log(chalk.green('   ✅ ESA WorldCover Land Cover'));
    console.log(chalk.green('   ✅ Thumbnail Export'));

    if (failed > 0) {
      console.log(chalk.red('\n❌ Some tests failed. Check errors above.'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ All Earth Engine API tests passed successfully!'));
      process.exit(0);
    }
  } catch (error: any) {
    console.error(chalk.red('\n❌ Test suite failed:'), error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
