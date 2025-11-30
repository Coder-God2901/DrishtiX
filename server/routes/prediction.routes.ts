/**
 * Prediction API Routes
 */

import { Router, Request, Response } from 'express';
import { prisma, io } from '../index';
import { crowdForecastingEngine } from '../services/crowd-forecasting.service';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// GET predictions for an event
router.get('/', async (req: Request, res: Response) => {
  try {
    const { eventId, limit = '20', offset = '0' } = req.query;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId is required' });
    }

    const predictions = await prisma.prediction.findMany({
      where: { eventId: eventId as string },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { timestamp: 'desc' },
    });

    const total = await prisma.prediction.count({
      where: { eventId: eventId as string },
    });

    res.json({
      success: true,
      data: predictions,
      pagination: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch predictions' });
  }
});

// GET latest prediction for event
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId is required' });
    }

    const prediction = await prisma.prediction.findFirst({
      where: { eventId: eventId as string },
      orderBy: { timestamp: 'desc' },
    });

    if (!prediction) {
      return res.status(404).json({ success: false, error: 'No predictions found' });
    }

    res.json({ success: true, data: prediction });
  } catch (error) {
    console.error('Error fetching latest prediction:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch latest prediction' });
  }
});

// CREATE prediction
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      forecastHorizon,
      predictedCount,
      predictedDensity,
      densityLevel,
      confidence,
      gridPredictions,
      hotspots,
      riskLevel,
      riskFactors,
      signals,
      anomalies,
      modelVersion,
      modelType,
    } = req.body;

    const prediction = await prisma.prediction.create({
      data: {
        eventId,
        timestamp: new Date(),
        forecastTime: new Date(Date.now() + forecastHorizon * 60000),
        forecastHorizon: parseInt(forecastHorizon),
        predictedCount: parseInt(predictedCount),
        predictedDensity: parseFloat(predictedDensity),
        densityLevel,
        confidence: parseFloat(confidence),
        gridPredictions,
        hotspots,
        riskLevel,
        riskFactors,
        signals,
        anomalies: anomalies || [],
        violenceDetected: false,
        fireDetected: false,
        panicDetected: false,
        surgDetected: false,
        modelVersion,
        modelType,
      },
    });

    // Emit real-time prediction via Socket.IO
    io.to(`predictions:${eventId}`).emit('prediction:new', prediction);
    io.to(`event:${eventId}`).emit('prediction:new', prediction);

    res.status(201).json({ success: true, data: prediction });
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({ success: false, error: 'Failed to create prediction' });
  }
});

// GET prediction hotspots
router.get('/:id/hotspots', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prediction = await prisma.prediction.findUnique({
      where: { id },
      select: { hotspots: true, eventId: true },
    });

    if (!prediction) {
      return res.status(404).json({ success: false, error: 'Prediction not found' });
    }

    res.json({ success: true, data: prediction.hotspots });
  } catch (error) {
    console.error('Error fetching hotspots:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hotspots' });
  }
});

// SWITCH forecasting mode
router.post('/mode', authenticate, requireRoles(['ADMIN', 'SECURITY']), (req: Request, res: Response) => {
  try {
    const { mode } = req.body
    if (!mode) return res.status(400).json({ success: false, error: 'mode required' })
    crowdForecastingEngine.setMode(mode)
    res.json({ success: true, data: crowdForecastingEngine.status() })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

// INGEST synthetic density frame (placeholder for live feed converted via teacher CNN)
router.post('/ingest-frame', authenticate, requireRoles(['ADMIN', 'SECURITY']), (req: Request, res: Response) => {
  const { frame } = req.body
  if (!frame || !Array.isArray(frame)) {
    return res.status(400).json({ success: false, error: 'frame must be 2D array' })
  }
  crowdForecastingEngine.ingestFrame(frame)
  res.json({ success: true, data: crowdForecastingEngine.status() })
})

// GET next ConvLSTM prediction (placeholder)
router.get('/next-frame', async (req: Request, res: Response) => {
  const prediction = crowdForecastingEngine.predictNext()
  if (await prediction === 'CALIBRATING') {
    return res.status(202).json({ success: false, status: 'CALIBRATING' })
  }
  res.json({ success: true, data: prediction })
})

// GET engine status
router.get('/engine-status', (req: Request, res: Response) => {
  res.json({ success: true, data: crowdForecastingEngine.status() })
})

export default router;
