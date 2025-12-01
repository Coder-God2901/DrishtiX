/**
 * DrishtiX Anomaly Detection API Routes
 * Real-time anomaly, panic, fire, and violence detection
 * 
 * Production-grade features:
 * - Comprehensive error handling and logging
 * - Input validation and sanitization
 * - Type safety throughout
 * - Performance optimizations
 * - Security best practices
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, io } from '../index';
import { yoloVisionService } from '../services/yolo-vision.service';
import { pubSubService } from '../services/pubsub.service';
import { anomalyDetectionService, FeatureVector } from '../services/anomaly-detection.service';
import { validateAnomalyConfig, anomalyConfig } from '../config/anomaly.config';
import { bigQueryFeatureService } from '../services/bigquery-feature.service';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Logger utility
const logger = {
  error: (message: string, error?: any) => console.error(`[Anomaly Routes] ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`[Anomaly Routes] ${message}`, data),
  info: (message: string, data?: any) => console.info(`[Anomaly Routes] ${message}`, data),
};

// Type definitions for better type safety
interface AnomalyDetection {
  timestamp: Date | string;
  anomalies: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    confidence: number;
    location?: any;
  }>;
  overallSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectionMetrics: {
    violenceDetected: boolean;
    fireDetected: boolean;
    panicLevel: number;
    surgeDetected: boolean;
  };
  recommendations?: string[];
}

/**
 * POST /api/anomalies/detect
 * Detect anomalies in visual feed
 * 
 * @body eventId - Event identifier (required)
 * @body imageData - Base64 encoded image or URL
 * @body videoFrames - Array of video frames
 * @body contextData - Additional context for detection
 */
router.post('/detect', authenticate, requireRoles(['ADMIN', 'SECURITY']), async (req: Request, res: Response): Promise<void | Response> => {
  const startTime = Date.now();

  try {
    const {
      eventId,
      imageData,
      videoFrames,
      contextData,
    } = req.body;

    // Input validation
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid eventId is required',
      });
    }

    if (!imageData && !videoFrames) {
      return res.status(400).json({
        success: false,
        error: 'Either imageData or videoFrames is required',
      });
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, status: true },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Detect anomalies using YOLO Vision
    logger.info(`Starting anomaly detection for event: ${eventId}`);

    const detection = await yoloVisionService.detectAnomalies({
      eventId,
      imageData,
      videoFrames,
      contextData,
    }) as AnomalyDetection;

    if (!detection || !detection.anomalies) {
      throw new Error('Invalid detection result from vision service');
    }

    // Create prediction record with anomaly data using transaction
    const detectionTimestamp = detection.timestamp instanceof Date
      ? detection.timestamp
      : new Date(detection.timestamp);

    const confidenceScores = detection.anomalies.map(a => a.confidence).filter(c => c > 0);
    const maxConfidence = confidenceScores.length > 0 ? Math.max(...confidenceScores) : 0.5;

    const prediction = await prisma.prediction.create({
      data: {
        eventId,
        timestamp: detectionTimestamp,
        forecastTime: detectionTimestamp,
        forecastHorizon: 0, // Real-time detection
        predictedCount: 0,
        predictedDensity: 0,
        densityLevel: 'MEDIUM',
        confidence: Math.min(Math.max(maxConfidence, 0), 1), // Clamp between 0 and 1
        gridPredictions: [],
        hotspots: [],
        riskLevel: detection.overallSeverity,
        riskFactors: detection.anomalies.map(a => a.description),
        anomalies: detection.anomalies as any,
        violenceDetected: detection.detectionMetrics.violenceDetected,
        fireDetected: detection.detectionMetrics.fireDetected,
        panicDetected: detection.detectionMetrics.panicLevel > 0.7,
        surgDetected: detection.detectionMetrics.surgeDetected,
        panicLevel: Math.min(Math.max(detection.detectionMetrics.panicLevel, 0), 1),
        modelType: 'YOLOVision',
        modelVersion: 'yolov8n-opencv',
      },
    });

    // Publish anomalies to Pub/Sub (non-blocking)
    pubSubService.publishAnomaly({
      eventId,
      predictionId: prediction.id,
      anomalies: detection.anomalies,
      severity: detection.overallSeverity,
      timestamp: detectionTimestamp.toISOString(),
    }).catch(err => {
      logger.error('Failed to publish anomaly to Pub/Sub (non-fatal)', err);
    });

    // Create alerts for critical anomalies in batch
    const criticalAnomalies = detection.anomalies.filter(
      a => a.severity === 'CRITICAL' || a.severity === 'HIGH'
    );

    if (criticalAnomalies.length > 0) {
      try {
        await prisma.alert.createMany({
          data: criticalAnomalies.map(anomaly => ({
            eventId,
            predictionId: prediction.id,
            type: anomaly.type,
            severity: anomaly.severity,
            title: `${anomaly.type} Detected`,
            message: anomaly.description || 'No description available',
            location: anomaly.location as any,
            actionRequired: true,
            status: 'ACTIVE' as const,
          })),
          skipDuplicates: true,
        });

        logger.info(`Created ${criticalAnomalies.length} alerts for event ${eventId}`);
      } catch (alertErr) {
        logger.error('Failed to create alerts', alertErr);
        // Don't fail the request if alerts fail
      }
    }

    // Emit real-time socket event
    io.to(`event:${eventId}`).emit('anomaly:detected', {
      predictionId: prediction.id,
      anomalies: detection.anomalies,
      severity: detection.overallSeverity,
      timestamp: detectionTimestamp.toISOString(),
    });

    const processingTime = Date.now() - startTime;
    logger.info(`Anomaly detection completed for event ${eventId} in ${processingTime}ms`);

    return res.json({
      success: true,
      data: {
        predictionId: prediction.id,
        anomalies: detection.anomalies,
        overallSeverity: detection.overallSeverity,
        detectionMetrics: detection.detectionMetrics,
        recommendations: detection.recommendations || [],
        timestamp: detectionTimestamp.toISOString(),
        alertsCreated: criticalAnomalies.length,
      },
      meta: {
        processingTimeMs: processingTime,
      },
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    logger.error('Anomaly detection error', {
      error: error.message,
      stack: error.stack,
      eventId: req.body.eventId,
      processingTime,
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to detect anomalies',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
});

/**
 * POST /api/anomalies/ingest-feature
 * Ingest structured feature vector (Tiered anomaly detection pipeline)
 * 
 * @body eventId - Event identifier (required)
 * @body zoneId - Zone identifier (required) 
 * @body feature - Feature vector with density, delta, zone_type, time encoding
 */
router.post('/ingest-feature', authenticate, requireRoles(['ADMIN', 'SECURITY']), async (req: Request, res: Response): Promise<void | Response> => {
  const startTime = Date.now();

  try {
    const { eventId, zoneId, feature } = req.body;

    // Input validation
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid eventId required' });
    }

    if (!zoneId || typeof zoneId !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid zoneId required' });
    }

    if (!feature || typeof feature !== 'object') {
      return res.status(400).json({ success: false, error: 'Valid feature object required' });
    }

    // Validate feature vector structure
    if (typeof feature.density_norm !== 'number' ||
      typeof feature.delta_t1 !== 'number' ||
      typeof feature.delta_t5 !== 'number' ||
      !feature.zone_type_enc ||
      !feature.time_enc?.sin ||
      !feature.time_enc?.cos) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feature vector structure. Required: density_norm, delta_t1, delta_t5, zone_type_enc, time_enc',
      });
    }

    const cfgValidation = validateAnomalyConfig();
    if (!cfgValidation.valid) {
      logger.warn('Anomaly config validation warnings', cfgValidation.errors);
    }

    // FIX: Await the async ingest method
    const { anomalies, overallSeverity, results } = await anomalyDetectionService.ingest(eventId, zoneId, feature as FeatureVector);

    // Persist feature vector to BigQuery (best-effort, non-blocking)
    const typedFeature = feature as FeatureVector;
    const zoneType = Array.isArray(typedFeature.zone_type_enc)
      ? 'UNKNOWN'
      : Object.keys(typedFeature.zone_type_enc).find(k => {
        const enc = typedFeature.zone_type_enc as Record<string, number>;
        return enc[k] === 1;
      }) || 'UNKNOWN';

    bigQueryFeatureService.insertFeatures([
      {
        event_id: eventId,
        zone_id: zoneId,
        timestamp: new Date().toISOString(),
        density_norm: typedFeature.density_norm,
        delta_t1: typedFeature.delta_t1,
        delta_t5: typedFeature.delta_t5,
        zone_type: zoneType,
        time_sin: typedFeature.time_enc.sin,
        time_cos: typedFeature.time_enc.cos,
      },
    ]).catch(bqError => {
      logger.warn('BigQuery insert failed (non-fatal)', { error: bqError.message, eventId, zoneId });
    });

    // Persist minimal anomaly snapshot if triggered
    let predictionId: string | undefined;
    if (anomalies.length > 0) {
      const prediction = await prisma.prediction.create({
        data: {
          eventId,
          timestamp: new Date(),
          forecastTime: new Date(),
          forecastHorizon: 0,
          predictedCount: 0,
          predictedDensity: 0,
          densityLevel: 'MEDIUM',
          confidence: 0.6,
          gridPredictions: [],
          hotspots: [],
          riskLevel: overallSeverity,
          riskFactors: anomalies.map((a: { reason?: string }) => a.reason || 'UNKNOWN'),
          anomalies: anomalies as any,
          violenceDetected: false,
          fireDetected: false,
          panicDetected: overallSeverity === 'CRITICAL',
          surgDetected: false,
          panicLevel: overallSeverity === 'CRITICAL' ? 0.9 : 0.3,
          modelType: 'TieredAnomaly',
          modelVersion: 'tiered-v0',
        },
      });
      predictionId = prediction.id;

      // Create alert for HIGH/CRITICAL
      if (overallSeverity === 'HIGH' || overallSeverity === 'CRITICAL') {
        try {
          await prisma.alert.create({
            data: {
              eventId,
              predictionId: prediction.id,
              type: 'ANOMALY',
              severity: overallSeverity,
              title: `Anomaly (${overallSeverity}) in zone ${zoneId}`,
              message: anomalies.map((a: { reason?: string }) => a.reason || 'Unknown').join('; '),
              location: {
                type: 'Feature',
                properties: { zoneId },
                geometry: { type: 'Point', coordinates: [0, 0] }
              } as any,
              actionRequired: true,
              status: 'ACTIVE',
            },
          });
        } catch (alertErr) {
          logger.error('Failed to create tiered anomaly alert', alertErr);
        }
      }

      // Emit real-time update
      io.to(`event:${eventId}`).emit('tiered-anomaly:detected', {
        predictionId,
        zoneId,
        anomalies,
        severity: overallSeverity,
        timestamp: new Date().toISOString(),
      });
    }

    const processingTime = Date.now() - startTime;
    logger.info(`Feature ingestion completed for event ${eventId}, zone ${zoneId} in ${processingTime}ms`);

    return res.json({
      success: true,
      data: {
        eventId,
        zoneId,
        predictionId,
        anomalies,
        overallSeverity,
        tierResults: results,
        config: {
          tier1DensityThreshold: anomalyConfig.tier1DensityThreshold,
          tier1DeltaThreshold: anomalyConfig.tier1DeltaThreshold,
          isolationForestThreshold: anomalyConfig.isolationForestThreshold,
          autoencoderThreshold: anomalyConfig.autoencoderThreshold,
        },
      },
      meta: {
        processingTimeMs: processingTime,
        tiersEvaluated: results.length,
      },
    });
  } catch (err: any) {
    const processingTime = Date.now() - startTime;
    logger.error('Feature ingest error', {
      error: err.message,
      stack: err.stack,
      eventId: req.body.eventId,
      zoneId: req.body.zoneId,
      processingTime,
    });

    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to ingest feature vector',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
});

/**
 * GET /api/anomalies/:eventId
 * Get anomaly detection history
 * 
 * @param eventId - Event identifier
 * @query limit - Maximum number of results (default: 20, max: 100)
 * @query type - Filter by anomaly type
 */
router.get('/:eventId', async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { eventId } = req.params;
    const { limit = '20', type } = req.query;

    // Validate and sanitize limit
    const parsedLimit = Math.min(parseInt(limit as string) || 20, 100);

    if (parsedLimit < 1) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be at least 1',
      });
    }

    const predictions = await prisma.prediction.findMany({
      where: {
        eventId,
        anomalies: {
          not: { equals: [] },
        },
      },
      take: parsedLimit,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        anomalies: true,
        violenceDetected: true,
        fireDetected: true,
        panicDetected: true,
        surgDetected: true,
        panicLevel: true,
        riskLevel: true,
        riskFactors: true,
        modelType: true,
        modelVersion: true,
      },
    });

    // Filter by type if provided
    let filtered = predictions;
    if (type && typeof type === 'string') {
      filtered = predictions.filter((p: typeof predictions[0]) => {
        const anomalies = p.anomalies as any[];
        return Array.isArray(anomalies) && anomalies.some(a => a.type === type);
      });
    }

    return res.json({
      success: true,
      data: filtered,
      meta: {
        total: filtered.length,
        limit: parsedLimit,
        filtered: !!type,
        filterType: type || null,
      },
    });
  } catch (error: any) {
    logger.error('Get anomalies error', { error: error.message, eventId: req.params.eventId });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch anomalies',
    });
  }
});

/**
 * GET /api/anomalies/:eventId/current
 * Get current active anomalies (within last 5 minutes)
 * 
 * @param eventId - Event identifier
 */
router.get('/:eventId/current', async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid eventId required',
      });
    }

    // Get latest prediction with anomalies (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const prediction = await prisma.prediction.findFirst({
      where: {
        eventId,
        timestamp: { gte: fiveMinutesAgo },
        anomalies: {
          not: { equals: [] },
        },
      },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        anomalies: true,
        violenceDetected: true,
        fireDetected: true,
        panicDetected: true,
        surgDetected: true,
        panicLevel: true,
        riskLevel: true,
      },
    });

    if (!prediction) {
      return res.json({
        success: true,
        data: {
          hasActiveAnomalies: false,
          anomalies: [],
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.json({
      success: true,
      data: {
        hasActiveAnomalies: true,
        predictionId: prediction.id,
        timestamp: prediction.timestamp,
        anomalies: prediction.anomalies,
        detectionMetrics: {
          violenceDetected: prediction.violenceDetected,
          fireDetected: prediction.fireDetected,
          panicDetected: prediction.panicDetected,
          surgDetected: prediction.surgDetected,
          panicLevel: prediction.panicLevel || 0,
        },
        riskLevel: prediction.riskLevel,
      },
    });
  } catch (error: any) {
    logger.error('Get current anomalies error', { error: error.message, eventId: req.params.eventId });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch current anomalies',
    });
  }
});

/**
 * GET /api/anomalies/:eventId/metrics
 * Get anomaly detection metrics summary
 * 
 * @param eventId - Event identifier
 */
router.get('/:eventId/metrics', async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid eventId required',
      });
    }

    const predictions = await prisma.prediction.findMany({
      where: {
        eventId,
        anomalies: {
          not: { equals: [] },
        },
      },
      select: {
        violenceDetected: true,
        fireDetected: true,
        panicDetected: true,
        surgDetected: true,
        panicLevel: true,
        anomalies: true,
        timestamp: true,
      },
    });

    type PredictionType = typeof predictions[0];

    const violenceCount = predictions.filter((p: PredictionType) => p.violenceDetected).length;
    const fireCount = predictions.filter((p: PredictionType) => p.fireDetected).length;
    const panicCount = predictions.filter((p: PredictionType) => p.panicDetected).length;
    const surgeCount = predictions.filter((p: PredictionType) => p.surgDetected).length;

    const totalPanicLevel = predictions.reduce((sum: number, p: PredictionType) => sum + (p.panicLevel || 0), 0);
    const averagePanicLevel = predictions.length > 0 ? totalPanicLevel / predictions.length : 0; const metrics = {
      totalAnomalies: predictions.length,
      violenceCount,
      fireCount,
      panicCount,
      surgeCount,
      averagePanicLevel: Math.round(averagePanicLevel * 100) / 100,
      anomalyTypes: aggregateAnomalyTypes(predictions),
      timeDistribution: getTimeDistribution(predictions),
    };

    return res.json({
      success: true,
      data: metrics,
      meta: {
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Get anomaly metrics error', { error: error.message, eventId: req.params.eventId });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch anomaly metrics',
    });
  }
});

/**
 * Helper: Aggregate anomaly types
 */
function aggregateAnomalyTypes(
  predictions: Array<{ anomalies: any }>
): Record<string, number> {
  const types: Record<string, number> = {};

  for (const prediction of predictions) {
    const anomalies = prediction.anomalies as any[];
    if (Array.isArray(anomalies)) {
      for (const anomaly of anomalies) {
        if (anomaly?.type) {
          types[anomaly.type] = (types[anomaly.type] || 0) + 1;
        }
      }
    }
  }

  return types;
}

/**
 * Helper: Get time distribution
 */
function getTimeDistribution(
  predictions: Array<{ timestamp: Date; anomalies: any }>
): { last24Hours: number; hourlyDistribution: Record<number, number> } {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = predictions.filter(p => {
    const predTime = p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp);
    return predTime >= last24h;
  });

  const hourly: Record<number, number> = {};
  for (const prediction of recent) {
    const predTime = prediction.timestamp instanceof Date
      ? prediction.timestamp
      : new Date(prediction.timestamp);
    const hour = predTime.getHours();
    hourly[hour] = (hourly[hour] || 0) + 1;
  }

  return {
    last24Hours: recent.length,
    hourlyDistribution: hourly,
  };
}

/**
 * GET /api/anomalies/:eventId/status
 * Returns ingestion status (zone counts, entries)
 * 
 * @param eventId - Event identifier
 * @query zoneId - Optional zone filter
 */
router.get('/:eventId/status', async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { eventId } = req.params;
    const { zoneId } = req.query;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid eventId required',
      });
    }

    const summary = anomalyDetectionService.status(
      eventId,
      zoneId as string | undefined
    );

    return res.json({
      success: true,
      data: {
        ...summary,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Status error', { error: error.message, eventId: req.params.eventId });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get anomaly status',
    });
  }
});

export default router;
