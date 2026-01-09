/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
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
 * Operations Log Routes
 * Tracks all operational activities during events
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/operations/:eventId
 * Get operations log for an event
 */
router.get('/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const {
      limit = 100,
      entityType,
      action,
      startDate,
      endDate
    } = req.query;

    const where: any = { eventId };

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = { contains: action as string, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Number(limit)
    });

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/operations/log
 * Create new operations log entry
 */
router.post('/log', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      action,
      description,
      entityType,
      entityId,
      metadata
    } = req.body;

    const log = await prisma.activityLog.create({
      data: {
        eventId,
        action,
        description,
        entityType: entityType || null,
        entityId: entityId || null,
        userId: req.user?.id,
        userName: req.user?.name,
        metadata: metadata || null
      }
    });

    res.status(201).json({
      success: true,
      data: log,
      message: 'Log entry created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/operations/:eventId/stats
 * Get operations statistics
 */
router.get('/:eventId/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const logs = await prisma.activityLog.findMany({
      where: { eventId },
      select: {
        action: true,
        entityType: true,
        userId: true,
        timestamp: true
      }
    });

    // Group by action
    const actionCounts: any = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    // Group by entity type
    const entityCounts: any = {};
    logs.forEach(log => {
      if (log.entityType) {
        entityCounts[log.entityType] = (entityCounts[log.entityType] || 0) + 1;
      }
    });

    // Group by user
    const userCounts: any = {};
    logs.forEach(log => {
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }
    });

    // Activity timeline (hourly)
    const timeline: any = {};
    logs.forEach(log => {
      const hour = new Date(log.timestamp).toISOString().slice(0, 13) + ':00:00';
      timeline[hour] = (timeline[hour] || 0) + 1;
    });

    const stats = {
      totalLogs: logs.length,
      actionBreakdown: actionCounts,
      entityBreakdown: entityCounts,
      userActivity: userCounts,
      timeline: Object.entries(timeline).map(([time, count]) => ({
        time,
        count
      })).sort((a, b) => a.time.localeCompare(b.time))
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/operations/:eventId/recent
 * Get recent operations (last 50)
 */
router.get('/:eventId/recent', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const logs = await prisma.activityLog.findMany({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/operations/:eventId/user/:userId
 * Get operations by specific user
 */
router.get('/:eventId/user/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId, userId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await prisma.activityLog.findMany({
      where: {
        eventId,
        userId
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit)
    });

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/operations/:eventId/entity/:entityType/:entityId
 * Get operations for specific entity
 */
router.get('/:eventId/entity/:entityType/:entityId', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId, entityType, entityId } = req.params;

    const logs = await prisma.activityLog.findMany({
      where: {
        eventId,
        entityType,
        entityId
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/operations/:eventId/cleanup
 * Cleanup old operations logs (older than 90 days)
 */
router.delete('/:eventId/cleanup', authenticate, authorize(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { days = 90 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const result = await prisma.activityLog.deleteMany({
      where: {
        eventId,
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    res.json({
      success: true,
      message: `Deleted ${result.count} old log entries`,
      deletedCount: result.count
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
