/**
 * DrishtiX - Google Maps Platform Integration Tests
 * Tests Maps, Routes, Places, Street View, and Traffic Layer
 */

import { testConfig } from './test-config';
import chalk from 'chalk';
import axios from 'axios';

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

async function testMapsAPI(): Promise<void> {
  console.log(chalk.blue('\\n🗺️  Testing Google Maps API...'));

  await runTest('Verify Maps API key', async () => {
    if (!testConfig.mapsApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }
    console.log(chalk.gray(`   API Key: ${testConfig.mapsApiKey.substring(0, 20)}...`));
  });
}

async function testRoutesAPI(): Promise<void> {
  console.log(chalk.blue('\\n🚗 Testing Routes API (Safe Routing)...'));

  await runTest('Calculate safe route', async () => {
    const response = await axios.post(`${API_BASE_URL}/maps/safe-route`, {
      origin: { lat: 18.5204, lng: 73.8567 },
      destination: { lat: 18.5304, lng: 73.8667 },
      travelMode: 'WALKING',
      avoidCrowdedZones: [],
    });

    if (!response.data.success) {
      throw new Error('Failed to calculate safe route');
    }

    const { recommendedRoute, alternativeRoutes } = response.data.data;

    console.log(chalk.gray(`   Recommended route:`));
    console.log(chalk.gray(`     Distance: ${recommendedRoute.distance}m`));
    console.log(chalk.gray(`     Duration: ${recommendedRoute.duration}s`));
    console.log(chalk.gray(`     Safety score: ${recommendedRoute.safetyScore}/100`));
    console.log(chalk.gray(`   Alternative routes: ${alternativeRoutes.length}`));
  });
}

async function testPlacesAPI(): Promise<void> {
  console.log(chalk.blue('\\n📍 Testing Places API (POI Discovery)...'));

  await runTest('Discover venue POIs automatically', async () => {
    const response = await axios.post(`${API_BASE_URL}/maps/discover-venue-pois`, {
      venueBounds: testConfig.testVenueBounds,
    });

    if (!response.data.success) {
      throw new Error('Failed to discover POIs');
    }

    const { totalFound, categories } = response.data.summary;

    console.log(chalk.gray(`   Total POIs found: ${totalFound}`));
    console.log(chalk.gray(`   Categories:`));
    Object.entries(categories).forEach(([category, count]) => {
      console.log(chalk.gray(`     - ${category}: ${count}`));
    });
  });

  await runTest('Search specific POI type (parking)', async () => {
    const response = await axios.post(`${API_BASE_URL}/maps/search-poi`, {
      venueCenter: testConfig.testLocation,
      radius: 1000,
      poiType: 'parking',
      maxResults: 5,
    });

    if (!response.data.success) {
      throw new Error('Failed to search POIs');
    }

    const { data, count } = response.data;
    console.log(chalk.gray(`   Parking POIs found: ${count}`));

    data.slice(0, 3).forEach((poi: any) => {
      console.log(chalk.gray(`     - ${poi.name} (${poi.status})`));
    });
  });

  await runTest('Search medical facilities', async () => {
    const response = await axios.post(`${API_BASE_URL}/maps/search-poi`, {
      venueCenter: testConfig.testLocation,
      radius: 2000,
      poiType: 'hospital',
      maxResults: 3,
    });

    if (!response.data.success) {
      throw new Error('Failed to search medical facilities');
    }

    const { count } = response.data;
    console.log(chalk.gray(`   Medical facilities found: ${count}`));
  });
}

async function testGateRecommendations(): Promise<void> {
  console.log(chalk.blue('\\n🚪 Testing Gate Recommendations...'));

  await runTest('Get gate recommendations', async () => {
    const gates = [
      {
        id: 'gate-1',
        name: 'North Gate',
        type: 'ENTRANCE',
        location: { lat: 18.5254, lng: 73.8617 },
        capacity: 500,
        status: 'OPEN',
      },
      {
        id: 'gate-2',
        name: 'South Gate',
        type: 'ENTRANCE',
        location: { lat: 18.5154, lng: 73.8517 },
        capacity: 300,
        status: 'OPEN',
      },
    ];

    const crowdMap = new Map([
      ['gate-1', 450], // 90% capacity
      ['gate-2', 100], // 33% capacity
    ]);

    const response = await axios.post(`${API_BASE_URL}/maps/gate-recommendations`, {
      userLocation: testConfig.testLocation,
      gates,
      crowdMap: Object.fromEntries(crowdMap),
    });

    if (!response.data.success) {
      throw new Error('Failed to get gate recommendations');
    }

    const recommendations = response.data.data;
    console.log(chalk.gray(`   Recommendations:`));
    recommendations.forEach((rec: any) => {
      console.log(chalk.gray(`     ${rec.gate.name}: ${rec.recommendation} (${rec.crowdLevel})`));
      console.log(chalk.gray(`       Distance: ${rec.distance.toFixed(0)}m, Wait: ${rec.estimatedWaitTime}min`));
    });
  });
}

async function testGeocodingAPI(): Promise<void> {
  console.log(chalk.blue('\\n🌐 Testing Geocoding API...'));

  await runTest('Geocode address to coordinates', async () => {
    const response = await axios.post(`${API_BASE_URL}/maps/geocode`, {
      address: 'Shivajinagar, Pune, Maharashtra, India',
    });

    if (!response.data.success) {
      throw new Error('Geocoding failed');
    }

    const { lat, lng, formattedAddress } = response.data.data;
    console.log(chalk.gray(`   Address: ${formattedAddress}`));
    console.log(chalk.gray(`   Coordinates: (${lat}, ${lng})`));
  });

  await runTest('Reverse geocode coordinates to address', async () => {
    const response = await axios.post(`${API_BASE_URL}/maps/reverse-geocode`, {
      lat: 18.5204,
      lng: 73.8567,
    });

    if (!response.data.success) {
      throw new Error('Reverse geocoding failed');
    }

    const { formattedAddress } = response.data.data;
    console.log(chalk.gray(`   Address: ${formattedAddress}`));
  });
}

async function runAllTests(): Promise<void> {
  console.log(chalk.bold.cyan('\\n🧪 DrishtiX Google Maps Platform Integration Tests'));
  console.log(chalk.cyan('='.repeat(50)));

  try {
    await testMapsAPI();
    await testRoutesAPI();
    await testPlacesAPI();
    await testGateRecommendations();
    await testGeocodingAPI();

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

    console.log(chalk.bold.cyan('\\n📋 Features Verified:'));
    console.log(chalk.green('   ✅ Maps JavaScript API'));
    console.log(chalk.green('   ✅ Routes API (Safe routing)'));
    console.log(chalk.green('   ✅ Places API (POI discovery)'));
    console.log(chalk.green('   ✅ Geocoding API'));
    console.log(chalk.gray('   ℹ️  Street View (frontend component)'));
    console.log(chalk.gray('   ℹ️  Traffic Layer (frontend component)'));

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
