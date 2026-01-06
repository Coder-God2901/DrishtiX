/**
 * Recommendation API Routes
 * Handles approval/rejection feedback and statistics
 */

import { Router } from 'express';
import { recommendationEngineService } from '../services/recommendation-engine.service';
import { riskEngineService } from '../services/risk-engine.service';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/recommendations/:actionId/approve
 * Approve a recommendation and record feedback
 */
router.post('/:actionId/approve', authenticate, async (req, res) => {
  try {
    const { actionId } = req.params;
    const { eventId, zoneId, outcome } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId required' });
    }

    // Record feedback
    await recommendationEngineService.recordFeedback(
      eventId,
      actionId,
      'APPROVED',
      outcome,
      (req as any).user?.id
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.id || 'system',
        action: 'RECOMMENDATION_APPROVED',
        entityType: 'RECOMMENDATION',
        entityId: actionId,
        metadata: {
          eventId,
          zoneId,
          actionId,
          approvedAt: new Date().toISOString(),
        },
        ipAddress: req.ip || '0.0.0.0',
      },
    });

    res.json({
      success: true,
      message: 'Recommendation approved successfully',
      actionId,
    });
  } catch (error) {
    console.error('Error approving recommendation:', error);
    res.status(500).json({ success: false, error: 'Failed to approve recommendation' });
  }
});

/**
 * POST /api/recommendations/:actionId/reject
 * Reject a recommendation and record feedback
 */
router.post('/:actionId/reject', authenticate, async (req, res) => {
  try {
    const { actionId } = req.params;
    const { eventId, zoneId, reason } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId required' });
    }

    // Record feedback
    await recommendationEngineService.recordFeedback(
      eventId,
      actionId,
      'REJECTED',
      undefined,
      (req as any).user?.id
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.id || 'system',
        action: 'RECOMMENDATION_REJECTED',
        entityType: 'RECOMMENDATION',
        entityId: actionId,
        metadata: {
          eventId,
          zoneId,
          actionId,
          reason,
          rejectedAt: new Date().toISOString(),
        },
        ipAddress: req.ip || '0.0.0.0',
      },
    });

    res.json({
      success: true,
      message: 'Recommendation rejected successfully',
      actionId,
    });
  } catch (error) {
    console.error('Error rejecting recommendation:', error);
    res.status(500).json({ success: false, error: 'Failed to reject recommendation' });
  }
});

/**
 * GET /api/recommendations/stats
 * Get recommendation effectiveness statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { eventId } = req.query;

    const stats = await recommendationEngineService.getEffectivenessStats(
      eventId as string | undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching recommendation stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/recommendations/risk-stats/:eventId
 * Get current risk statistics for an event
 */
router.get('/risk-stats/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const stats = await riskEngineService.getRiskStats(eventId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching risk stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch risk statistics' });
  }
});

/**
 * GET /api/recommendations/history/:eventId
 * Get recommendation history for an event
 */
router.get('/history/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    const history = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['RECOMMENDATION_APPROVED', 'RECOMMENDATION_REJECTED'],
        },
        // Metadata filtering would need JSON query - simplified
        entityType: 'RECOMMENDATION',
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.auditLog.count({
      where: {
        action: {
          in: ['RECOMMENDATION_APPROVED', 'RECOMMENDATION_REJECTED'],
        },
        entityType: 'RECOMMENDATION',
      },
    });

    res.json({
      success: true,
      data: history,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching recommendation history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

export default router;
