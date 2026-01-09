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
 * Alert API Routes
 */

import { Router, Request, Response } from 'express';
import { prisma, io } from '../index';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { auditLoggerService } from '../services/audit-logger.service';

const router = Router();

// GET all alerts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { eventId, type, severity, active, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (eventId) where.eventId = eventId as string;
    if (type) where.type = type as any;
    if (severity) where.severity = severity as any;
    if (active === 'true') where.dismissedAt = null;
    const alerts = await prisma.alert.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.alert.count({ where });

    res.json({
      success: true,
      data: alerts,
      pagination: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

// CREATE alert
router.post('/', authenticate, requireRoles(['ADMIN', 'SECURITY', 'ORGANIZER']), async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      type,
      severity,
      title,
      message,
      location,
      targetZones,
      actionRequired,
    } = req.body;

    const alert = await prisma.alert.create({
      data: {
        eventId,
        type,
        severity,
        title,
        message,
        location,
        targetZones,
        actionRequired,
      },
    });

    // Emit real-time alert via Socket.IO
    io.to(`alerts:${eventId}`).emit('alert:new', alert);
    io.to(`event:${eventId}`).emit('alert:new', alert);

    // Audit log broadcast
    await auditLoggerService.logFromRequest(
      req,
      'ALERT_BROADCAST',
      'Alert',
      alert.id,
      { type, severity, title },
      { targetZones, eventId }
    );

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ success: false, error: 'Failed to create alert' });
  }
});

// DISMISS alert
router.post('/:id/dismiss', authenticate, requireRoles(['ADMIN', 'SECURITY', 'ORGANIZER']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dismissedBy } = req.body;

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        dismissedAt: new Date(),
        dismissedBy,
      },
    });

    // Emit real-time update
    io.to(`alerts:${alert.eventId}`).emit('alert:dismissed', alert);

    // Audit log
    await auditLoggerService.logFromRequest(
      req,
      'ALERT_DISMISS',
      'Alert',
      id,
      { dismissedAt: new Date() },
      { dismissedBy }
    );

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ success: false, error: 'Failed to dismiss alert' });
  }
});

export default router;
