/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * Zone Monitoring & Testing Routes
 * 
 * API endpoints for zone forecasting system monitoring, validation, and testing
 */

import { Router, Request, Response } from 'express';
import { zoneRealtimeDataService } from '../services/zone-realtime-data.service';
import { lstmIntegrationService } from '../services/lstm-integration.service';
import {
  validateZoneConfiguration,
  testDataFlow,
  validateLSTMDataFormat,
  checkSystemHealth,
  generateTestReport,
} from '../utils/zone-forecasting-test.utils';

const router = Router();

/**
 * POST /api/monitoring/zones/validate
 * Validate zone configuration for an event
 */
router.post('/zones/validate', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const result = await validateZoneConfiguration(eventId);

    return res.json({
      success: result.valid,
      validation: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] Validation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/monitoring/zones/test-flow
 * Test data flow from cameras to database
 */
router.post('/zones/test-flow', async (req: Request, res: Response) => {
  try {
    const { eventId, durationMinutes = 10 } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const result = await testDataFlow(eventId);

    return res.json({
      success: result.passed,
      test: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] Data flow test error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/monitoring/zones/validate-lstm
 * Validate LSTM data format
 */
router.post('/zones/validate-lstm', async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const result = await validateLSTMDataFormat(eventId, zoneId);

    return res.json({
      success: result.valid,
      validation: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] LSTM validation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/health
 * System health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;

    const health = await checkSystemHealth(eventId as string | undefined);

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return res.status(statusCode).json({
      status: health.status,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] Health check error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/events/:eventId/report
 * Generate comprehensive test report
 */
router.get('/events/:eventId/report', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const report = await generateTestReport(eventId);

    return res.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] Report generation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/events/:eventId/zones/status
 * Get real-time status of all zones
 */
router.get('/events/:eventId/zones/status', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const allZonesData = await zoneRealtimeDataService.getAllZonesData(eventId);

    const zoneStatuses = Object.entries(allZonesData).map(([zoneId, data]: [string, any]) => ({
      zoneId,
      zoneName: data.zoneName || zoneId,
      currentCount: data.peopleCount || 0,
      occupancyPercent: data.occupancyPercent || 0,
      densityValue: data.densityValue || 0,
      riskScore: data.riskScore || 0,
      lastUpdated: data.timestamp || new Date().toISOString(),
      dataAge: Date.now() - new Date(data.timestamp || new Date()).getTime(),
    }));

    return res.json({
      success: true,
      eventId,
      zonesCount: zoneStatuses.length,
      zones: zoneStatuses,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] Zone status error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/events/:eventId/metrics
 * Get collection metrics for an event
 */
router.get('/events/:eventId/metrics', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const metrics = zoneRealtimeDataService.getCollectionMetrics(eventId);

    if (!metrics) {
      return res.status(404).json({
        error: 'No collection metrics found for this event',
      });
    }

    return res.json({
      success: true,
      eventId,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] Metrics error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/active-events
 * Get all active event IDs
 */
router.get('/active-events', async (req: Request, res: Response) => {
  try {
    const activeEvents = zoneRealtimeDataService.getActiveEventIds();

    return res.json({
      success: true,
      count: activeEvents.length,
      eventIds: activeEvents,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] Active events error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/monitoring/lstm/predict
 * Run LSTM predictions for an event
 */
router.post('/lstm/predict', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const result = await lstmIntegrationService.runPredictionLoop(eventId);

    return res.json({
      success: result.success,
      predictionsCount: result.predictionsCount,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] LSTM prediction error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/lstm/health
 * Check LSTM service health
 */
router.get('/lstm/health', async (req: Request, res: Response) => {
  try {
    const health = await lstmIntegrationService.validateConnection();

    const statusCode = health.connected ? 200 : 503;

    return res.status(statusCode).json({
      connected: health.connected,
      version: health.version,
      error: health.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] LSTM health check error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/monitoring/lstm/export-training-data
 * Export data for LSTM training
 */
router.post('/lstm/export-training-data', async (req: Request, res: Response) => {
  try {
    const { eventId, startTime, endTime } = req.body;

    if (!eventId || !startTime || !endTime) {
      return res.status(400).json({
        error: 'eventId, startTime, and endTime are required',
      });
    }

    const data = await lstmIntegrationService.exportTrainingData(
      eventId,
      new Date(startTime),
      new Date(endTime)
    );

    return res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Zone Monitoring] Export training data error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
