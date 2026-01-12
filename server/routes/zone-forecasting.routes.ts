/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */

/**
 * Zone Forecasting API Routes
 * Provides endpoints for crowd forecasting model integration
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { zoneSimulationService } from '../services/zone-simulation.service';
import { zoneForecastingService } from '../services/zone-forecasting.service';
import { zoneRealtimeDataService } from '../services/zone-realtime-data.service';

const router = Router();

// Flag to enable/disable simulation fallback (set to false for production)
const ENABLE_SIMULATION_FALLBACK = process.env.ENABLE_SIMULATION_FALLBACK === 'true';

// =============================================================================
// 1. Zone Metadata API (Static Configuration)
// =============================================================================

/**
 * GET /api/events/:eventId/zones
 * Returns all zones with static metadata for an event
 * Used during model initialization
 */
router.get('/:eventId/zones', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    let zones = await prisma.zoneMetadata.findMany({
      where: { eventId },
      orderBy: [
        { zonePriority: 'desc' },
        { zoneName: 'asc' }
      ]
    });

    // If no zones exist, initialize them (real zones, not simulated)
    if (zones.length === 0) {
      console.log(`[Zone Forecasting] No zones found for event ${eventId}. Starting real-time data collection...`);

      // Start real-time data collection which will auto-initialize zones
      await zoneRealtimeDataService.startDataCollection(eventId);

      // Fetch the initialized zones
      zones = await prisma.zoneMetadata.findMany({
        where: { eventId },
        orderBy: [
          { zonePriority: 'desc' },
          { zoneName: 'asc' }
        ]
      });

      return res.json({
        success: true,
        data: zones,
        message: 'Zones initialized and real-time data collection started',
        realtime: true
      });
    }

    res.json({
      success: true,
      data: zones,
      realtime: true
    });
  } catch (error) {
    console.error('Error fetching zone metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zone metadata'
    });
  }
});

/**
 * GET /api/events/:eventId/zones/:zoneId
 * Get single zone metadata
 */
router.get('/:eventId/zones/:zoneId', async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.params;

    const zone = await prisma.zoneMetadata.findUnique({
      where: {
        eventId_zoneId: {
          eventId,
          zoneId
        }
      },
      include: {
        zoneStates: {
          orderBy: { timestamp: 'desc' },
          take: 1 // Get latest state
        }
      }
    });

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Zone not found'
      });
    }

    res.json({ success: true, data: zone });
  } catch (error) {
    console.error('Error fetching zone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zone'
    });
  }
});

// =============================================================================
// 2. Live Zone State API (Time-Series Input)
// =============================================================================

/**
 * GET /api/events/:eventId/zones/state
 * Returns time-series zone data for sliding window
 * Query params:
 *   - window: minutes to look back (default: 60)
 *   - zoneId: filter by specific zone (optional)
 *   - limit: max timesteps to return (optional)
 */
router.get('/:eventId/zones/state', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const {
      window = '60',
      zoneId,
      limit
    } = req.query;

    const windowMinutes = parseInt(window as string);
    const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);

    const where: any = {
      eventId,
      timestamp: {
        gte: cutoffTime
      }
    };

    if (zoneId) {
      where.zoneId = zoneId as string;
    }

    const queryOptions: any = {
      where,
      orderBy: [
        { zoneId: 'asc' },
        { timestamp: 'asc' }
      ]
    };

    if (limit) {
      queryOptions.take = parseInt(limit as string);
    }

    let zoneStates = await prisma.zoneState.findMany(queryOptions);

    // If no real data and simulation fallback is enabled
    if (zoneStates.length === 0) {
      if (ENABLE_SIMULATION_FALLBACK) {
        console.log(`[Zone Forecasting] No zone state data found for event ${eventId}. Using simulation fallback...`);
        zoneStates = await zoneSimulationService.generateTimeSeriesWindow(
          eventId,
          windowMinutes,
          zoneId as string | undefined
        );
      } else {
        return res.status(404).json({
          success: false,
          error: 'No real-time data available. Please ensure data collection is started for this event.',
          hint: 'Call POST /api/events/:eventId/zones/start-collection to begin real-time data collection'
        });
      }
    }

    // Group by zone for easier consumption
    const groupedByZone = zoneStates.reduce((acc: any, state: any) => {
      if (!acc[state.zoneId]) {
        acc[state.zoneId] = [];
      }
      acc[state.zoneId].push(state);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        states: zoneStates,
        groupedByZone,
        windowMinutes,
        timesteps: zoneStates.length > 0 ? zoneStates.length / Object.keys(groupedByZone).length : 0,
        zones: Object.keys(groupedByZone).length
      },
      realtime: true,
      dataSource: zoneStates[0]?.dataSource || 'CAMERA'
    });
  } catch (error) {
    console.error('Error fetching zone state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zone state'
    });
  }
});

/**
 * GET /api/events/:eventId/zones/state/latest
 * Returns the latest zone state snapshot for all zones
 */
router.get('/:eventId/zones/state/latest', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Get all zones for this event
    const zones = await prisma.zoneMetadata.findMany({
      where: { eventId },
      select: { zoneId: true }
    });

    const zoneIds = zones.map(z => z.zoneId);

    // Get latest state for each zone
    const latestStates = await Promise.all(
      zoneIds.map(async (zoneId) => {
        return await prisma.zoneState.findFirst({
          where: { eventId, zoneId },
          orderBy: { timestamp: 'desc' }
        });
      })
    );

    const validStates = latestStates.filter(Boolean);

    // If no real data and simulation fallback is enabled
    if (validStates.length === 0) {
      if (ENABLE_SIMULATION_FALLBACK) {
        const simulatedStates = await zoneSimulationService.generateCurrentSnapshot(eventId);
        return res.json({
          success: true,
          data: simulatedStates,
          simulated: true,
          timestamp: new Date().toISOString()
        });
      } else {
        // Try to get from real-time service cache
        const realtimeData = await zoneRealtimeDataService.getAllZonesData(eventId);
        if (Object.keys(realtimeData).length > 0) {
          return res.json({
            success: true,
            data: realtimeData,
            realtime: true,
            fromCache: true,
            timestamp: new Date().toISOString()
          });
        }

        return res.status(404).json({
          success: false,
          error: 'No real-time data available. Please ensure data collection is started for this event.',
          hint: 'Call POST /api/events/:eventId/zones/start-collection to begin real-time data collection'
        });
      }
    }

    res.json({
      success: true,
      data: validStates,
      realtime: true,
      dataSource: validStates[0]?.dataSource || 'CAMERA',
      timestamp: validStates[0]?.timestamp || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching latest zone state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest zone state'
    });
  }
});

/**
 * GET /api/events/:eventId/zones/:zoneId/state/history
 * Get historical state data for a specific zone
 */
router.get('/:eventId/zones/:zoneId/state/history', async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.params;
    const { startTime, endTime, limit = '100' } = req.query;

    const where: any = { eventId, zoneId };

    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) where.timestamp.gte = new Date(startTime as string);
      if (endTime) where.timestamp.lte = new Date(endTime as string);
    }

    const history = await prisma.zoneState.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching zone history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zone history'
    });
  }
});

// =============================================================================
// 3. Schedule Context API
// =============================================================================

/**
 * GET /api/events/:eventId/schedule/context
 * Returns current schedule phase and context
 */
router.get('/:eventId/schedule/context', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    let schedule = await prisma.eventSchedule.findUnique({
      where: { eventId }
    });

    // If no schedule exists, create default from event
    if (!schedule) {
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Create default schedule
      schedule = await zoneSimulationService.createDefaultSchedule(event);
    }

    // Determine current phase based on time
    const now = new Date();
    const currentPhase = zoneForecastingService.determineCurrentPhase(schedule, now);

    // Check if we're in a peak window
    const isPeakWindow = zoneForecastingService.isInPeakWindow(schedule, now);

    // Get current mini-event if any
    const currentMiniEvent = zoneForecastingService.getCurrentMiniEvent(schedule, now);

    res.json({
      success: true,
      data: {
        schedule,
        currentPhase,
        isPeakWindow,
        currentMiniEvent,
        timestamp: now.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching schedule context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule context'
    });
  }
});

/**
 * POST /api/events/:eventId/schedule
 * Create or update event schedule
 */
router.post('/:eventId/schedule', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const scheduleData = req.body;

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Convert string dates to Date objects
    const processedData: any = {
      eventId,
      gatesOpenTime: new Date(scheduleData.gatesOpenTime),
      eventStartTime: new Date(scheduleData.eventStartTime),
      eventEndTime: new Date(scheduleData.eventEndTime),
      exitStartTime: new Date(scheduleData.exitStartTime),
      venueCloseTime: new Date(scheduleData.venueCloseTime),
      currentPhase: scheduleData.currentPhase || 'PRE_EVENT'
    };

    // Optional fields
    if (scheduleData.earlyEntryStart) {
      processedData.earlyEntryStart = new Date(scheduleData.earlyEntryStart);
    }
    if (scheduleData.halftimeStart) {
      processedData.halftimeStart = new Date(scheduleData.halftimeStart);
    }
    if (scheduleData.halftimeEnd) {
      processedData.halftimeEnd = new Date(scheduleData.halftimeEnd);
    }
    if (scheduleData.peakWindows) {
      processedData.peakWindows = scheduleData.peakWindows;
    }
    if (scheduleData.miniEvents) {
      processedData.miniEvents = scheduleData.miniEvents;
    }

    const schedule = await prisma.eventSchedule.upsert({
      where: { eventId },
      create: processedData,
      update: {
        ...processedData,
        lastUpdated: new Date()
      }
    });

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error creating/updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create/update schedule'
    });
  }
});

// =============================================================================
// 4. Forecasting & Predictions
// =============================================================================

/**
 * GET /api/events/:eventId/zones/forecast
 * Get crowd forecasts for zones
 * Query params:
 *   - horizon: minutes ahead (10, 30, 60)
 *   - zoneId: filter by zone (optional)
 */
router.get('/:eventId/zones/forecast', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { horizon = '30', zoneId } = req.query;

    const where: any = {
      eventId,
      horizonMinutes: parseInt(horizon as string)
    };

    if (zoneId) {
      where.zoneId = zoneId as string;
    }

    const forecasts = await prisma.crowdForecast.findMany({
      where,
      orderBy: { forecastTime: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: forecasts,
      count: forecasts.length
    });
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forecasts'
    });
  }
});

/**
 * POST /api/events/:eventId/zones/forecast
 * Create new forecast (typically called by ML service)
 */
router.post('/:eventId/zones/forecast', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const forecastData = req.body;

    // Validate required fields
    if (!forecastData.zoneId || !forecastData.targetTime || !forecastData.horizonMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: zoneId, targetTime, horizonMinutes'
      });
    }

    const forecast = await prisma.crowdForecast.create({
      data: {
        eventId,
        zoneId: forecastData.zoneId,
        forecastTime: new Date(),
        targetTime: new Date(forecastData.targetTime),
        horizonMinutes: forecastData.horizonMinutes,
        predictedCount: forecastData.predictedCount,
        predictedDensity: forecastData.predictedDensity,
        predictedDensityLevel: forecastData.predictedDensityLevel || 'MEDIUM',
        predictedRiskLevel: forecastData.predictedRiskLevel || 'LOW',
        predictedInflow: forecastData.predictedInflow || 0,
        predictedOutflow: forecastData.predictedOutflow || 0,
        confidence: forecastData.confidence || 0.8,
        modelVersion: forecastData.modelVersion || 'v1.0',
        modelType: forecastData.modelType || 'LSTM',
        inputFeatures: forecastData.inputFeatures || {},
        alerts: forecastData.alerts || [],
        recommendations: forecastData.recommendations || []
      }
    });

    res.status(201).json({ success: true, data: forecast });
  } catch (error) {
    console.error('Error creating forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create forecast'
    });
  }
});

// =============================================================================
// 5. Real-Time Data Collection Control
// =============================================================================

/**
 * POST /api/events/:eventId/zones/start-collection
 * Start real-time data collection for an event
 */
router.post('/:eventId/zones/start-collection', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    await zoneRealtimeDataService.startDataCollection(eventId);

    res.json({
      success: true,
      message: 'Real-time data collection started',
      eventId,
      collectionInterval: '5 minutes',
      dataSource: 'CAMERA'
    });
  } catch (error) {
    console.error('Error starting data collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start data collection'
    });
  }
});

/**
 * POST /api/events/:eventId/zones/stop-collection
 * Stop real-time data collection for an event
 */
router.post('/:eventId/zones/stop-collection', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    zoneRealtimeDataService.stopDataCollection(eventId);

    res.json({
      success: true,
      message: 'Real-time data collection stopped'
    });
  } catch (error) {
    console.error('Error stopping data collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop data collection'
    });
  }
});

/**
 * GET /api/events/:eventId/zones/realtime-status
 * Get current status of real-time data collection
 */
router.get('/:eventId/zones/realtime-status', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Get latest data timestamp for each zone
    const latestData = await prisma.zoneState.groupBy({
      by: ['zoneId'],
      where: { eventId },
      _max: { timestamp: true },
      _count: { id: true }
    });

    // Get real-time cache data
    const cacheData = await zoneRealtimeDataService.getAllZonesData(eventId);

    res.json({
      success: true,
      data: {
        zonesTracked: latestData.length,
        latestUpdates: latestData.map(z => ({
          zoneId: z.zoneId,
          lastUpdate: z._max.timestamp,
          dataPoints: z._count.id
        })),
        cacheStatus: {
          zonesInCache: cacheData.length,
          lastCacheUpdate: cacheData[0]?.timestamp || null
        },
        collectionInterval: '5 minutes',
        dataSource: 'CAMERA'
      }
    });
  } catch (error) {
    console.error('Error fetching realtime status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch realtime status'
    });
  }
});

// =============================================================================
// 6. Data Simulation & Testing (Optional - for development)
// =============================================================================

/**
 * POST /api/events/:eventId/zones/simulate
 * Generate simulated zone data for testing
 */
router.post('/:eventId/zones/simulate', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const {
      duration = 120, // minutes
      interval = 5,   // minutes between snapshots
      zones = null    // optional zone IDs
    } = req.body;

    const result = await zoneSimulationService.generateSimulatedData(
      eventId,
      parseInt(duration as string),
      parseInt(interval as string),
      zones
    );

    res.json({
      success: true,
      message: 'Simulation data generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error generating simulation data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate simulation data'
    });
  }
});

/**
 * POST /api/events/:eventId/zones/:zoneId/state
 * Manually push a zone state update (for testing or sensor integration)
 */
router.post('/:eventId/zones/:zoneId/state', async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.params;
    const stateData = req.body;

    // Validate zone exists
    const zone = await prisma.zoneMetadata.findUnique({
      where: {
        eventId_zoneId: {
          eventId,
          zoneId
        }
      }
    });

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Zone not found'
      });
    }

    const state = await prisma.zoneState.create({
      data: {
        eventId,
        venueId: stateData.venueId || zone.venueId,
        zoneId,
        timestamp: stateData.timestamp ? new Date(stateData.timestamp) : new Date(),
        timestepIndex: stateData.timestepIndex || 0,
        crowdCount: stateData.crowdCount || 0,
        crowdDensity: stateData.crowdDensity || 0,
        densityLevel: stateData.densityLevel || 'LOW',
        inflowRate: stateData.inflowRate || 0,
        outflowRate: stateData.outflowRate || 0,
        netFlowRate: (stateData.inflowRate || 0) - (stateData.outflowRate || 0),
        avgSpeed: stateData.avgSpeed || 1.0,
        directionEntropy: stateData.directionEntropy || 0,
        avgDwellTime: stateData.avgDwellTime,
        queueLength: stateData.queueLength,
        avgWaitTime: stateData.avgWaitTime,
        schedulePhase: stateData.schedulePhase || 'PRE_EVENT',
        isPeakWindow: stateData.isPeakWindow || false,
        temperature: stateData.temperature,
        humidity: stateData.humidity,
        weatherImpact: stateData.weatherImpact,
        riskLevel: stateData.riskLevel || 'LOW',
        congestionScore: stateData.congestionScore || 0,
        bottleneckScore: stateData.bottleneckScore,
        dataSource: stateData.dataSource || 'manual',
        confidence: stateData.confidence || 1.0,
        isPredicted: stateData.isPredicted || false,
        predictionHorizon: stateData.predictionHorizon
      }
    });

    res.status(201).json({ success: true, data: state });
  } catch (error) {
    console.error('Error creating zone state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create zone state'
    });
  }
});

export default router;
