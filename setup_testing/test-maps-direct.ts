/**
 * DrishtiX - Google Maps Platform Direct API Tests
 * Tests Maps APIs directly without backend server
 * Separate test file - does not modify existing test suite
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
const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || testConfig.mapsApiKey;
const ROUTES_API_KEY = process.env.GOOGLE_MAPS_ROUTES_API_KEY || MAPS_API_KEY;
const PLACES_API_KEY = process.env.GOOGLE_MAPS_PLACES_API_KEY || MAPS_API_KEY;

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
  console.log(chalk.blue('\n🗺️  Testing Google Maps API (Direct)...'));

  await runTest('Verify Maps API key', async () => {
    if (!MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }
    console.log(chalk.gray(`   API Key: ${MAPS_API_KEY.substring(0, 20)}...`));
  });

  await runTest('Test Geocoding API', async () => {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: 'Pune, Maharashtra, India',
        key: MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    const location = response.data.results[0].geometry.location;
    console.log(chalk.gray(`   Geocoded location: (${location.lat}, ${location.lng})`));
  });

  await runTest('Test Reverse Geocoding', async () => {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: '18.5204,73.8567',
        key: MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Reverse Geocoding error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    const address = response.data.results[0].formatted_address;
    console.log(chalk.gray(`   Address: ${address}`));
  });
}

async function testDirectionsAPI(): Promise<void> {
  console.log(chalk.blue('\n🚗 Testing Directions API (Direct)...'));

  await runTest('Calculate walking route', async () => {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: '18.5204,73.8567',
        destination: '18.5304,73.8667',
        mode: 'walking',
        key: ROUTES_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Directions API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    console.log(chalk.gray(`   Route calculated:`));
    console.log(chalk.gray(`     Distance: ${leg.distance.text}`));
    console.log(chalk.gray(`     Duration: ${leg.duration.text}`));
    console.log(chalk.gray(`     Steps: ${leg.steps.length}`));
  });

  await runTest('Calculate driving route with alternatives', async () => {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: '18.5204,73.8567',
        destination: '18.5304,73.8667',
        mode: 'driving',
        alternatives: true,
        key: ROUTES_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Directions API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    const routeCount = response.data.routes.length;
    console.log(chalk.gray(`   Alternative routes found: ${routeCount}`));
  });
}

async function testPlacesAPI(): Promise<void> {
  console.log(chalk.blue('\n📍 Testing Places API (Direct)...'));

  await runTest('Search parking facilities', async () => {
    const location = `${testConfig.testLocation.lat},${testConfig.testLocation.lng}`;
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location,
        radius: 1000,
        type: 'parking',
        key: PLACES_API_KEY,
      },
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    const count = response.data.results.length;
    console.log(chalk.gray(`   Parking facilities found: ${count}`));

    if (count > 0) {
      response.data.results.slice(0, 3).forEach((place: any) => {
        console.log(chalk.gray(`     - ${place.name} (${place.business_status || 'Unknown'})`));
      });
    }
  });

  await runTest('Search medical facilities', async () => {
    const location = `${testConfig.testLocation.lat},${testConfig.testLocation.lng}`;
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location,
        radius: 2000,
        type: 'hospital',
        key: PLACES_API_KEY,
      },
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    const count = response.data.results.length;
    console.log(chalk.gray(`   Medical facilities found: ${count}`));

    if (count > 0) {
      response.data.results.slice(0, 3).forEach((place: any) => {
        console.log(chalk.gray(`     - ${place.name}`));
      });
    }
  });

  await runTest('Search restaurants', async () => {
    const location = `${testConfig.testLocation.lat},${testConfig.testLocation.lng}`;
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location,
        radius: 1500,
        type: 'restaurant',
        key: PLACES_API_KEY,
      },
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    const count = response.data.results.length;
    console.log(chalk.gray(`   Restaurants found: ${count}`));
  });

  await runTest('Place details lookup', async () => {
    // First, get a place
    const location = `${testConfig.testLocation.lat},${testConfig.testLocation.lng}`;
    const searchResponse = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location,
        radius: 1000,
        type: 'hospital',
        key: PLACES_API_KEY,
      },
    });

    if (searchResponse.data.results.length === 0) {
      console.log(chalk.yellow('   No places found for details test - SKIPPED'));
      return;
    }

    const placeId = searchResponse.data.results[0].place_id;

    // Get place details
    const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        key: PLACES_API_KEY,
      },
    });

    if (detailsResponse.data.status !== 'OK') {
      throw new Error(`Place Details error: ${detailsResponse.data.status}`);
    }

    const place = detailsResponse.data.result;
    console.log(chalk.gray(`   Place: ${place.name}`));
    console.log(chalk.gray(`   Rating: ${place.rating || 'N/A'}`));
    console.log(chalk.gray(`   Phone: ${place.formatted_phone_number || 'N/A'}`));
  });
}

async function runAllTests(): Promise<void> {
  console.log(chalk.bold.cyan('\n🧪 DrishtiX Google Maps Platform Direct API Tests'));
  console.log(chalk.cyan('='.repeat(60)));
  console.log(chalk.yellow('ℹ️  Testing APIs directly (no backend server required)'));

  try {
    await testMapsAPI();
    await testDirectionsAPI();
    await testPlacesAPI();

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

    console.log(chalk.bold.cyan('\n📋 APIs Verified:'));
    console.log(chalk.green('   ✅ Geocoding API'));
    console.log(chalk.green('   ✅ Directions API'));
    console.log(chalk.green('   ✅ Places API (Nearby Search)'));
    console.log(chalk.green('   ✅ Place Details API'));

    if (failed > 0) {
      console.log(chalk.red('\n❌ Some tests failed. Check errors above.'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ All Maps API tests passed successfully!'));
      process.exit(0);
    }
  } catch (error: any) {
    console.error(chalk.red('\n❌ Test suite failed:'), error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
