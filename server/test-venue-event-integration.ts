/**
 * End-to-End Integration Test for Venue Mapping & Dynamic Event Creator
 * 
 * Tests the complete flow:
 * 1. Template retrieval
 * 2. Event creation from template
 * 3. Venue layout creation with validation
 * 4. Geofencing checks
 * 5. Navigation path generation
 * 6. Real-time Socket.IO events
 */

import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3000/api';
const WS_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

// Test configuration
const TEST_ORGANIZER_ID = 'test_organizer_123';
const TEST_EVENT_NAME = 'Test Concert Integration';

let createdEventId: string;
let socket: Socket;

/**
 * Helper function to run a test
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, message: 'Success', duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    results.push({ name, passed: false, message: error.message, duration });
    console.error(`❌ ${name} (${duration}ms): ${error.message}`);
  }
}

/**
 * Test 1: Get all event templates
 */
async function testGetTemplates(): Promise<void> {
  const response = await axios.get(`${API_BASE_URL}/events/templates`);

  if (!response.data.success) {
    throw new Error('Failed to get templates');
  }

  const templates = response.data.data;
  if (!Array.isArray(templates) || templates.length === 0) {
    throw new Error('No templates returned');
  }

  const concertTemplate = templates.find((t: any) => t.id === 'concert');
  if (!concertTemplate) {
    throw new Error('Concert template not found');
  }

  console.log(`   Found ${templates.length} templates: ${templates.map((t: any) => t.id).join(', ')}`);
}

/**
 * Test 2: Get specific template
 */
async function testGetSpecificTemplate(): Promise<void> {
  const response = await axios.get(`${API_BASE_URL}/events/templates/concert`);

  if (!response.data.success) {
    throw new Error('Failed to get concert template');
  }

  const template = response.data.data;
  if (template.id !== 'concert') {
    throw new Error('Wrong template returned');
  }

  if (!template.fields || template.fields.length === 0) {
    throw new Error('Template has no fields');
  }

  console.log(`   Template has ${template.fields.length} fields`);
}

/**
 * Test 3: Create event from template
 */
async function testCreateEvent(): Promise<void> {
  const eventData = {
    organizerId: TEST_ORGANIZER_ID,
    name: TEST_EVENT_NAME,
    description: 'End-to-end integration test event',
    venue: 'Test Venue, Pune',
    location: { lat: 18.5204, lng: 73.8567 },
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
    expectedAttendees: 5000,
    eventTypeId: 'concert',
    dynamicFields: {
      artist: 'Test Artist',
      hasAlcohol: true,
      stages: 2,
      ticketTypes: ['VIP', 'General', 'Standing'],
      hasVIP: true
    }
  };

  const response = await axios.post(`${API_BASE_URL}/events`, eventData);

  if (!response.data.success) {
    throw new Error(`Failed to create event: ${JSON.stringify(response.data.errors || response.data.message)}`);
  }

  createdEventId = response.data.data.id;
  console.log(`   Created event with ID: ${createdEventId}`);
}

/**
 * Test 4: Create venue layout with valid boundary
 */
async function testCreateVenueLayout(): Promise<void> {
  const venueLayout = {
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [73.8568, 18.5203],
          [73.8575, 18.5203],
          [73.8575, 18.5210],
          [73.8568, 18.5210],
          [73.8568, 18.5203] // Closed polygon
        ]
      ]
    },
    zones: [
      {
        id: 'zone_main_stage',
        name: 'Main Stage',
        type: 'stage',
        capacity: 3000,
        shape: {
          type: 'Polygon',
          coordinates: [
            [
              [73.8569, 18.5204],
              [73.8571, 18.5204],
              [73.8571, 18.5206],
              [73.8569, 18.5206],
              [73.8569, 18.5204]
            ]
          ]
        },
        properties: {
          riskLevel: 'high',
          isVIP: false
        }
      },
      {
        id: 'zone_vip',
        name: 'VIP Lounge',
        type: 'vip',
        capacity: 500,
        shape: {
          type: 'Polygon',
          coordinates: [
            [
              [73.8572, 18.5204],
              [73.8574, 18.5204],
              [73.8574, 18.5206],
              [73.8572, 18.5206],
              [73.8572, 18.5204]
            ]
          ]
        },
        properties: {
          riskLevel: 'medium',
          isVIP: true,
          allowedRoles: ['VIP', 'ORGANIZER']
        }
      }
    ],
    gates: [],
    routes: []
  };

  const response = await axios.post(
    `${API_BASE_URL}/events/${createdEventId}/venue-layout`,
    venueLayout
  );

  if (!response.data.success) {
    throw new Error(`Failed to create venue layout: ${JSON.stringify(response.data.errors)}`);
  }

  console.log(`   Created venue layout with 2 zones`);
}

/**
 * Test 5: Test self-intersecting polygon validation
 */
async function testInvalidPolygon(): Promise<void> {
  const invalidLayout = {
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [73.8568, 18.5203],
          [73.8575, 18.5210], // Creating a figure-8
          [73.8575, 18.5203],
          [73.8568, 18.5210],
          [73.8568, 18.5203]
        ]
      ]
    },
    zones: [],
    gates: [],
    routes: []
  };

  try {
    const response = await axios.post(
      `${API_BASE_URL}/events/${createdEventId}/venue-layout`,
      invalidLayout
    );

    if (response.data.success) {
      throw new Error('Invalid polygon was accepted');
    }

    // Should have validation errors
    if (!response.data.errors || response.data.errors.length === 0) {
      throw new Error('No validation errors returned');
    }

    console.log(`   Correctly rejected invalid polygon`);
  } catch (error: any) {
    if (error.response && !error.response.data.success) {
      // Expected failure
      console.log(`   Correctly rejected invalid polygon`);
    } else {
      throw error;
    }
  }
}

/**
 * Test 6: Geofence check - inside venue
 */
async function testGeofenceInside(): Promise<void> {
  const checkData = {
    location: { lat: 18.5205, lng: 73.8570 },
    userId: 'test_user_123',
    userRole: 'ATTENDEE'
  };

  const response = await axios.post(
    `${API_BASE_URL}/events/${createdEventId}/geofence-check`,
    checkData
  );

  if (!response.data.success) {
    throw new Error('Geofence check failed');
  }

  const result = response.data.data;
  if (!result.isInside) {
    throw new Error('User should be inside venue');
  }

  console.log(`   User inside venue, in zones: ${result.insideZones.join(', ') || 'none'}`);
}

/**
 * Test 7: Geofence check - outside venue
 */
async function testGeofenceOutside(): Promise<void> {
  const checkData = {
    location: { lat: 18.5200, lng: 73.8560 }, // Far from venue
    userId: 'test_user_456',
    userRole: 'ATTENDEE'
  };

  const response = await axios.post(
    `${API_BASE_URL}/events/${createdEventId}/geofence-check`,
    checkData
  );

  if (!response.data.success) {
    throw new Error('Geofence check failed');
  }

  const result = response.data.data;
  if (result.isInside) {
    throw new Error('User should be outside venue');
  }

  if (result.alerts.length === 0) {
    throw new Error('Should have boundary breach alert');
  }

  console.log(`   User outside venue, alerts: ${result.alerts.length}`);
}

/**
 * Test 8: Geofence check - VIP zone unauthorized access
 */
async function testGeofenceVIPUnauthorized(): Promise<void> {
  const checkData = {
    location: { lat: 18.5205, lng: 73.8573 }, // VIP zone
    userId: 'test_user_789',
    userRole: 'ATTENDEE' // Not VIP
  };

  const response = await axios.post(
    `${API_BASE_URL}/events/${createdEventId}/geofence-check`,
    checkData
  );

  if (!response.data.success) {
    throw new Error('Geofence check failed');
  }

  const result = response.data.data;
  const hasUnauthorizedAlert = result.alerts.some(
    (a: any) => a.type === 'unauthorized_zone' || a.type === 'restricted_area'
  );

  if (!hasUnauthorizedAlert) {
    throw new Error('Should have unauthorized access alert for VIP zone');
  }

  console.log(`   Detected unauthorized VIP access`);
}

/**
 * Test 9: Navigation path generation
 */
async function testNavigation(): Promise<void> {
  const navData = {
    from: { lat: 18.5204, lng: 73.8569 },
    to: { lat: 18.5209, lng: 73.8574 },
    avoidCrowds: true
  };

  const response = await axios.post(
    `${API_BASE_URL}/events/${createdEventId}/navigate`,
    navData
  );

  if (!response.data.success) {
    throw new Error('Navigation failed');
  }

  const result = response.data.data;
  if (!result.path || result.path.length === 0) {
    throw new Error('No path returned');
  }

  if (typeof result.distance !== 'number' || result.distance <= 0) {
    throw new Error('Invalid distance');
  }

  console.log(`   Generated path: ${result.path.length} points, ${result.distance.toFixed(1)}m, ~${result.estimatedTime}s`);
}

/**
 * Test 10: Update event config
 */
async function testUpdateEventConfig(): Promise<void> {
  const updateData = {
    dynamicFields: {
      artist: 'Updated Artist Name',
      stages: 3 // Changed from 2 to 3
    }
  };

  const response = await axios.put(
    `${API_BASE_URL}/events/${createdEventId}/config`,
    updateData
  );

  if (!response.data.success) {
    throw new Error('Failed to update event config');
  }

  console.log(`   Updated event config`);
}

/**
 * Test 11: Socket.IO real-time events
 */
async function testSocketIO(): Promise<void> {
  return new Promise((resolve, reject) => {
    socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    let eventCreatedReceived = false;
    let venueUpdatedReceived = false;

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket.IO timeout - no events received'));
    }, 5000);

    socket.on('connect', () => {
      console.log('   Connected to Socket.IO');

      // Subscribe to event
      socket.emit('subscribe', { eventId: createdEventId });

      // Listen for events
      socket.on('event:created', (data: any) => {
        eventCreatedReceived = true;
        console.log(`   Received event:created for ${data.name}`);
        checkCompletion();
      });

      socket.on('venue:updated', (data: any) => {
        venueUpdatedReceived = true;
        console.log(`   Received venue:updated for event ${data.eventId}`);
        checkCompletion();
      });

      // Trigger events by creating a new test event
      axios.post(`${API_BASE_URL}/events`, {
        organizerId: TEST_ORGANIZER_ID,
        name: 'Socket Test Event',
        venue: 'Test',
        location: { lat: 18.5204, lng: 73.8567 },
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        expectedAttendees: 100
      }).catch(console.error);
    });

    function checkCompletion() {
      if (eventCreatedReceived) {
        clearTimeout(timeout);
        socket.disconnect();
        resolve();
      }
    }

    socket.on('connect_error', (error: any) => {
      clearTimeout(timeout);
      reject(new Error(`Socket.IO connection error: ${error.message}`));
    });
  });
}

/**
 * Cleanup: Delete test event
 */
async function cleanup(): Promise<void> {
  try {
    if (createdEventId) {
      await axios.delete(`${API_BASE_URL}/events/${createdEventId}`);
      console.log(`   Cleaned up test event ${createdEventId}`);
    }
  } catch (error) {
    console.log('   Cleanup skipped (delete endpoint may not exist)');
  }
}

/**
 * Main test runner
 */
async function runAllTests(): Promise<void> {
  console.log('\n🚀 Starting Venue Mapping & Dynamic Event Creator Integration Tests\n');
  console.log('='.repeat(80));

  await runTest('1. Get all event templates', testGetTemplates);
  await runTest('2. Get specific template (concert)', testGetSpecificTemplate);
  await runTest('3. Create event from template', testCreateEvent);
  await runTest('4. Create venue layout with validation', testCreateVenueLayout);
  await runTest('5. Reject invalid self-intersecting polygon', testInvalidPolygon);
  await runTest('6. Geofence check - inside venue', testGeofenceInside);
  await runTest('7. Geofence check - outside venue', testGeofenceOutside);
  await runTest('8. Geofence check - VIP unauthorized access', testGeofenceVIPUnauthorized);
  await runTest('9. Generate navigation path', testNavigation);
  await runTest('10. Update event configuration', testUpdateEventConfig);
  await runTest('11. Socket.IO real-time events', testSocketIO);

  console.log('='.repeat(80));

  // Print summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n📊 Test Summary:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Passed: ${passed} ✅`);
  console.log(`   Failed: ${failed} ❌`);
  console.log(`   Total Time: ${totalTime}ms`);

  if (failed > 0) {
    console.log(`\n❌ Failed Tests:`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }

  // Cleanup
  await cleanup();

  console.log('\n' + '='.repeat(80));
  console.log(failed === 0 ? '✅ All tests passed!' : `❌ ${failed} test(s) failed`);
  console.log('='.repeat(80) + '\n');

  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
