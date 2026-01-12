/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * Zone Forecasting Test Utilities
 * 
 * Validation and testing tools for the real-time zone forecasting system
 */

import { PrismaClient } from '@prisma/client';
import { zoneRealtimeDataService } from '../services/zone-realtime-data.service';

const prisma = new PrismaClient();

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

export interface DataFlowTest {
  eventId: string;
  testName: string;
  passed: boolean;
  duration: number;
  details: any;
}

/**
 * Validate zone-camera configuration for an event
 */
export async function validateZoneConfiguration(eventId: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      result.valid = false;
      result.errors.push(`Event ${eventId} not found`);
      return result;
    }

    result.info.push(`Event found: ${event.name}`);

    // Check zones
    const zones = await prisma.zoneMetadata.findMany({
      where: { eventId },
    });

    if (zones.length === 0) {
      result.warnings.push('No zones configured. They will be auto-initialized on data collection start.');
    } else {
      result.info.push(`Found ${zones.length} zones configured`);

      // Validate each zone
      for (const zone of zones) {
        if (zone.cameraIds.length === 0) {
          result.warnings.push(`Zone ${zone.zoneName} has no cameras assigned`);
        }

        if (zone.capacity <= 0) {
          result.errors.push(`Zone ${zone.zoneName} has invalid capacity: ${zone.capacity}`);
          result.valid = false;
        }

        if (zone.areaSquareMeters <= 0) {
          result.errors.push(`Zone ${zone.zoneName} has invalid area: ${zone.areaSquareMeters}`);
          result.valid = false;
        }
      }

      // Check for duplicate camera assignments
      const allCameraIds: string[] = [];
      zones.forEach((zone) => allCameraIds.push(...zone.cameraIds));
      const duplicates = allCameraIds.filter((cam, idx) => allCameraIds.indexOf(cam) !== idx);

      if (duplicates.length > 0) {
        result.warnings.push(
          `Duplicate camera assignments found: ${[...new Set(duplicates)].join(', ')}`
        );
      }
    }

    // Check for existing zone state data
    const recentStates = await prisma.zoneState.count({
      where: {
        eventId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
    });

    if (recentStates > 0) {
      result.info.push(`Found ${recentStates} recent zone state records`);
    } else {
      result.warnings.push('No recent zone state data found');
    }

    // Check for camera frames
    const recentFrames = await prisma.videoFrame.count({
      where: {
        eventId,
        timestamp: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        },
      },
    });

    if (recentFrames > 0) {
      result.info.push(`Found ${recentFrames} recent camera frames`);
    } else {
      result.warnings.push('No recent camera frames found - ensure cameras are streaming');
    }
  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Validation error: ${error.message}`);
  }

  return result;
}

/**
 * Test data flow from cameras to database
 */
export async function testDataFlow(eventId: string): Promise<DataFlowTest> {
  const startTime = Date.now();
  const test: DataFlowTest = {
    eventId,
    testName: 'Data Flow Test',
    passed: false,
    duration: 0,
    details: {},
  };

  try {
    // Check if collection is active
    const activeEvents = zoneRealtimeDataService.getActiveEventIds();
    test.details.collectionActive = activeEvents.includes(eventId);

    if (!test.details.collectionActive) {
      test.details.message = 'Data collection not active. Start collection first.';
      test.duration = Date.now() - startTime;
      return test;
    }

    // Check metrics
    const metrics = zoneRealtimeDataService.getCollectionMetrics(eventId);
    test.details.metrics = metrics;

    // Check zones
    const zones = await prisma.zoneMetadata.count({ where: { eventId } });
    test.details.zonesConfigured = zones;

    // Check latest data
    const latestStates = await prisma.zoneState.findMany({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });

    if (latestStates.length > 0) {
      test.details.latestDataTime = latestStates[0].timestamp;
      test.details.dataFreshness = Date.now() - latestStates[0].timestamp.getTime();
      test.details.dataFreshnessMinutes = Math.round(test.details.dataFreshness / 60000);
    }

    // Check data continuity
    const states = await prisma.zoneState.findMany({
      where: {
        eventId,
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      orderBy: { timeIndex: 'asc' },
      select: { timeIndex: true },
    });

    const timeIndices = states.map((s) => s.timeIndex);
    const gaps: number[] = [];

    for (let i = 1; i < timeIndices.length; i++) {
      const gap = timeIndices[i] - timeIndices[i - 1];
      if (gap > 1) {
        gaps.push(gap - 1);
      }
    }

    test.details.dataPoints = timeIndices.length;
    test.details.gaps = gaps.length;
    test.details.continuity = gaps.length === 0 ? 'Perfect' : `${gaps.length} gaps found`;

    // Determine if test passed
    test.passed =
      test.details.collectionActive &&
      zones > 0 &&
      (metrics?.successRate || 0) > 80 &&
      test.details.dataFreshnessMinutes < 10;
  } catch (error: any) {
    test.details.error = error.message;
    test.passed = false;
  }

  test.duration = Date.now() - startTime;
  return test;
}

/**
 * Validate LSTM data format
 */
export async function validateLSTMDataFormat(eventId: string, zoneId?: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  try {
    const where: any = {
      eventId,
      timestamp: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    };

    if (zoneId) {
      where.zoneId = zoneId;
    }

    const states = await prisma.zoneState.findMany({
      where,
      orderBy: [{ zoneId: 'asc' }, { timestamp: 'asc' }],
    });

    if (states.length === 0) {
      result.valid = false;
      result.errors.push('No data available for LSTM validation');
      return result;
    }

    result.info.push(`Found ${states.length} data points`);

    // Group by zone
    const byZone: Map<string, any[]> = new Map();
    states.forEach((state) => {
      if (!byZone.has(state.zoneId)) {
        byZone.set(state.zoneId, []);
      }
      byZone.get(state.zoneId)!.push(state);
    });

    result.info.push(`Data for ${byZone.size} zones`);

    // Validate each zone's data
    for (const [zId, zoneStates] of byZone.entries()) {
      // Check for minimum required timesteps (12 for LSTM)
      if (zoneStates.length < 12) {
        result.warnings.push(`Zone ${zId} has only ${zoneStates.length} timesteps (need 12 for LSTM)`);
      }

      // Check time index continuity
      const indices = zoneStates.map((s: any) => s.timeIndex).sort((a: number, b: number) => a - b);
      let hasGaps = false;

      for (let i = 1; i < indices.length; i++) {
        if (indices[i] !== indices[i - 1] + 1) {
          hasGaps = true;
          break;
        }
      }

      if (hasGaps) {
        result.warnings.push(`Zone ${zId} has gaps in time index sequence`);
      }

      // Check for required LSTM features
      const requiredFields = [
        'peopleCount',
        'densityValue',
        'flowRateIn',
        'flowRateOut',
        'avgMovementSpeed',
      ];

      const sample = zoneStates[0];
      for (const field of requiredFields) {
        if (sample[field] === null || sample[field] === undefined) {
          result.errors.push(`Zone ${zId} missing required field: ${field}`);
          result.valid = false;
        }
      }

      // Check data quality
      const avgConfidence =
        zoneStates.reduce((sum: number, s: any) => sum + s.confidence, 0) / zoneStates.length;

      if (avgConfidence < 0.8) {
        result.warnings.push(`Zone ${zId} has low average confidence: ${avgConfidence.toFixed(2)}`);
      }
    }
  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Validation error: ${error.message}`);
  }

  return result;
}

/**
 * Check system health
 */
export async function checkSystemHealth(eventId?: string): Promise<{
  healthy: boolean;
  status: string;
  details: any;
}> {
  const details: any = {};

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    details.database = 'Connected';

    // Check active collections
    const activeEvents = zoneRealtimeDataService.getActiveEventIds();
    details.activeCollections = activeEvents.length;
    details.activeEventIds = activeEvents;

    // If specific event provided
    if (eventId) {
      const metrics = zoneRealtimeDataService.getCollectionMetrics(eventId);
      details.eventMetrics = metrics;

      if (metrics) {
        const timeSinceLastCollection =
          Date.now() - metrics.lastCollectionTime.getTime();
        details.timeSinceLastCollection = Math.round(timeSinceLastCollection / 1000);
        details.stale = timeSinceLastCollection > 10 * 60 * 1000; // > 10 minutes
      }
    }

    // Check recent data
    const recentStates = await prisma.zoneState.count({
      where: {
        ...(eventId && { eventId }),
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        },
      },
    });

    details.recentDataPoints = recentStates;

    // Determine health
    const healthy =
      details.database === 'Connected' &&
      details.activeCollections > 0 &&
      (!eventId || !details.stale);

    return {
      healthy,
      status: healthy ? 'Healthy' : 'Degraded',
      details,
    };
  } catch (error: any) {
    return {
      healthy: false,
      status: 'Unhealthy',
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Generate test report
 */
export async function generateTestReport(eventId: string): Promise<string> {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('Zone Forecasting System Test Report');
  lines.push('='.repeat(60));
  lines.push(`Event ID: ${eventId}`);
  lines.push(`Timestamp: ${new Date().toISOString()}`);
  lines.push('');

  // Configuration validation
  lines.push('1. Configuration Validation');
  lines.push('-'.repeat(60));
  const configResult = await validateZoneConfiguration(eventId);
  lines.push(`Status: ${configResult.valid ? 'PASS' : 'FAIL'}`);
  if (configResult.errors.length > 0) {
    lines.push('Errors:');
    configResult.errors.forEach((err) => lines.push(`  - ${err}`));
  }
  if (configResult.warnings.length > 0) {
    lines.push('Warnings:');
    configResult.warnings.forEach((warn) => lines.push(`  - ${warn}`));
  }
  if (configResult.info.length > 0) {
    lines.push('Info:');
    configResult.info.forEach((info) => lines.push(`  - ${info}`));
  }
  lines.push('');

  // Data flow test
  lines.push('2. Data Flow Test');
  lines.push('-'.repeat(60));
  const flowTest = await testDataFlow(eventId);
  lines.push(`Status: ${flowTest.passed ? 'PASS' : 'FAIL'}`);
  lines.push(`Duration: ${flowTest.duration}ms`);
  lines.push('Details:');
  Object.entries(flowTest.details).forEach(([key, value]) => {
    lines.push(`  ${key}: ${JSON.stringify(value)}`);
  });
  lines.push('');

  // LSTM format validation
  lines.push('3. LSTM Data Format Validation');
  lines.push('-'.repeat(60));
  const lstmResult = await validateLSTMDataFormat(eventId);
  lines.push(`Status: ${lstmResult.valid ? 'PASS' : 'FAIL'}`);
  if (lstmResult.errors.length > 0) {
    lines.push('Errors:');
    lstmResult.errors.forEach((err) => lines.push(`  - ${err}`));
  }
  if (lstmResult.warnings.length > 0) {
    lines.push('Warnings:');
    lstmResult.warnings.forEach((warn) => lines.push(`  - ${warn}`));
  }
  lines.push('');

  // System health
  lines.push('4. System Health Check');
  lines.push('-'.repeat(60));
  const health = await checkSystemHealth(eventId);
  lines.push(`Status: ${health.status}`);
  lines.push('Details:');
  Object.entries(health.details).forEach(([key, value]) => {
    lines.push(`  ${key}: ${JSON.stringify(value)}`);
  });
  lines.push('');

  lines.push('='.repeat(60));
  lines.push('End of Report');
  lines.push('='.repeat(60));

  return lines.join('\n');
}
