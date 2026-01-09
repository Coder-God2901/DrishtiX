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
 * Notification Routes
 * Handles multi-channel notifications (push, email, SMS)
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/notifications
 * Get notifications for a user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, eventId, isRead, type, limit = '20' } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (eventId) where.eventId = eventId as string;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (type) where.type = type;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false
      }
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      notification
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/clear-all
 * Clear all notifications for a user
 */
router.post('/clear-all', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    await prisma.notification.deleteMany({
      where: { userId }
    });

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear notifications',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for a user
 */
router.post('/mark-all-read', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/send
 * Send notification (organizers only)
 */
router.post('/send', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const {
      userId,
      eventId,
      type,
      priority = 'MEDIUM',
      title,
      message,
      channels = ['push'],
      actionUrl,
      actionLabel,
      data
    } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        eventId,
        type,
        priority,
        title,
        message,
        channels,
        actionUrl,
        actionLabel,
        data,
        isSent: true,
        sentAt: new Date()
      }
    });

    // Emit via WebSocket for real-time delivery
    const { io } = require('../index');
    if (userId) {
      io.to(`user:${userId}`).emit('notification:new', notification);
    }
    if (eventId) {
      io.to(`event:${eventId}`).emit('notification:broadcast', notification);
    }

    res.json({
      success: true,
      notification,
      message: 'Notification sent successfully'
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/bulk
 * Send bulk notifications (organizers only)
 */
router.post('/bulk', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const {
      userIds,
      eventId,
      type,
      priority = 'MEDIUM',
      title,
      message,
      channels = ['push']
    } = req.body;

    const notifications = await Promise.all(
      userIds.map((userId: string) =>
        prisma.notification.create({
          data: {
            userId,
            eventId,
            type,
            priority,
            title,
            message,
            channels,
            isSent: true,
            sentAt: new Date()
          }
        })
      )
    );

    // Emit via WebSocket
    const { io } = require('../index');
    notifications.forEach((notification: any) => {
      io.to(`user:${notification.userId}`).emit('notification:new', notification);
    });

    res.json({
      success: true,
      count: notifications.length,
      message: `${notifications.length} notifications sent successfully`
    });
  } catch (error: any) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk notifications',
      message: error.message
    });
  }
});

export default router;
