/**
 * DrishtiX Voice AI API Routes
 * Voice-first command center interface
 */

import { Router, Request, Response } from 'express';
import { voiceAIService } from '../services/voice-ai.service';
import { prisma } from '../index';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/voice/command
 * Process voice command
 */
router.post('/command', authenticate, requireRoles(['ADMIN', 'ORGANIZER', 'SECURITY']), async (req: Request, res: Response) => {
  try {
    const { text, language = 'en', eventId, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Command text is required',
      });
    }

    // Get context data for the event
    const contextData = eventId ? await getEventContext(eventId) : undefined;

    // Process command
    const response = await voiceAIService.processCommand(
      {
        text,
        language,
        eventId,
        userId,
        timestamp: new Date(),
      },
      contextData
    );

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Voice command error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice command',
    });
  }
});

/**
 * POST /api/voice/translate
 * Translate command to another language
 */
router.post('/translate', authenticate, requireRoles(['ADMIN', 'ORGANIZER', 'SECURITY', 'VOLUNTEER']), async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'text and targetLanguage are required',
      });
    }

    const translated = await voiceAIService.translateCommand(text, targetLanguage);

    res.json({
      success: true,
      data: {
        original: text,
        translated,
        targetLanguage,
      },
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate command',
    });
  }
});

/**
 * DELETE /api/voice/history/:sessionId
 * Clear conversation history
 */
router.delete('/history/:sessionId', authenticate, requireRoles(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    voiceAIService.clearHistory(sessionId);

    res.json({
      success: true,
      message: 'Conversation history cleared',
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear history',
    });
  }
});

/**
 * Helper: Get event context
 */
async function getEventContext(eventId: string): Promise<any> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            alerts: true,
            predictions: true,
            incidents: true,
          },
        },
      },
    });

    const activeAlerts = await prisma.alert.findMany({
      where: {
        eventId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        type: true,
        severity: true,
        title: true,
      },
    });

    const latestPrediction = await prisma.prediction.findFirst({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
      select: {
        riskLevel: true,
        forecastHorizon: true,
        hotspots: true,
        predictedDensity: true,
      },
    });

    return {
      eventInfo: event,
      activeAlerts,
      predictions: latestPrediction ? [latestPrediction] : [],
      currentDensity: latestPrediction?.predictedDensity || 0,
    };
  } catch (error) {
    console.error('Error getting event context:', error);
    return undefined;
  }
}

export default router;
