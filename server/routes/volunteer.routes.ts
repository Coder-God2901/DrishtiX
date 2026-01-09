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
 * Volunteer Management Routes
 * Handles volunteer registration, task assignment, location tracking, check-in/out
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/volunteers/event/:eventId
 * Get all volunteers for an event
 */
router.get('/event/:eventId', authenticate, authorize(['ORGANIZER', 'SECURITY', 'LOGISTICS']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status, zone, role } = req.query;

    const where: any = { eventId };
    if (status) where.status = status;
    if (zone) where.zone = zone;
    if (role) where.role = role;

    const volunteers = await prisma.volunteer.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      volunteers,
      count: volunteers.length
    });
  } catch (error: any) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteers',
      message: error.message
    });
  }
});

/**
 * GET /api/volunteers/:id
 * Get volunteer details
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const volunteer = await prisma.volunteer.findUnique({
      where: { id }
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    // Get assigned tasks
    const tasks = await prisma.volunteerTask.findMany({
      where: { volunteerId: id },
      orderBy: { assignedAt: 'desc' }
    });

    res.json({
      success: true,
      volunteer,
      tasks
    });
  } catch (error: any) {
    console.error('Error fetching volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteer',
      message: error.message
    });
  }
});

/**
 * POST /api/volunteers
 * Register a new volunteer
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      name,
      email,
      phone,
      role,
      zone,
      skills,
      emergencyContact,
      shiftStart,
      shiftEnd
    } = req.body;

    // Check if already registered
    const existing = await prisma.volunteer.findFirst({
      where: {
        eventId,
        email
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Volunteer already registered for this event'
      });
    }

    const volunteer = await prisma.volunteer.create({
      data: {
        eventId,
        name,
        email,
        phone,
        role,
        zone,
        skills: skills || [],
        emergencyContact,
        shiftStart: shiftStart ? new Date(shiftStart) : null,
        shiftEnd: shiftEnd ? new Date(shiftEnd) : null
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: email,
        eventId,
        type: 'VOLUNTEER_TASK',
        priority: 'MEDIUM',
        title: 'Volunteer Registration Successful',
        message: `You have been registered as a ${role} volunteer for zone ${zone}`,
        channels: ['push', 'email']
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: 'volunteer_registered',
        description: `${name} registered as ${role} volunteer`,
        entityType: 'volunteer',
        entityId: volunteer.id
      }
    });

    res.json({
      success: true,
      volunteer,
      message: 'Volunteer registered successfully'
    });
  } catch (error: any) {
    console.error('Error registering volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register volunteer',
      message: error.message
    });
  }
});

/**
 * PATCH /api/volunteers/:id
 * Update volunteer details
 */
router.patch('/:id', authenticate, authorize(['ORGANIZER', 'LOGISTICS']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const volunteer = await prisma.volunteer.update({
      where: { id },
      data: updates
    });

    res.json({
      success: true,
      volunteer,
      message: 'Volunteer updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update volunteer',
      message: error.message
    });
  }
});

/**
 * POST /api/volunteers/:id/assign-task
 * Assign task to volunteer
 */
router.post('/:id/assign-task', authenticate, authorize(['ORGANIZER', 'LOGISTICS']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      zone,
      priority = 'MEDIUM',
      dueAt
    } = req.body;

    const volunteer = await prisma.volunteer.findUnique({
      where: { id }
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    const task = await prisma.volunteerTask.create({
      data: {
        volunteerId: id,
        eventId: volunteer.eventId,
        title,
        description,
        zone,
        priority,
        dueAt: dueAt ? new Date(dueAt) : null
      }
    });

    // Update volunteer task count
    await prisma.volunteer.update({
      where: { id },
      data: {
        assignedTasks: { increment: 1 },
        currentTask: title
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: volunteer.email,
        eventId: volunteer.eventId,
        type: 'VOLUNTEER_TASK',
        priority: priority === 'URGENT' ? 'URGENT' : 'MEDIUM',
        title: 'New Task Assigned',
        message: `You have been assigned: ${title}`,
        channels: ['push', 'sms']
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId: volunteer.eventId,
        action: 'task_assigned',
        description: `Task "${title}" assigned to ${volunteer.name}`,
        entityType: 'volunteer',
        entityId: id
      }
    });

    res.json({
      success: true,
      task,
      message: 'Task assigned successfully'
    });
  } catch (error: any) {
    console.error('Error assigning task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign task',
      message: error.message
    });
  }
});

/**
 * PATCH /api/volunteers/:id/task/:taskId
 * Update task status
 */
router.patch('/:id/task/:taskId', authenticate, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;

    const task = await prisma.volunteerTask.update({
      where: { id: taskId },
      data: {
        status,
        notes,
        startedAt: status === 'IN_PROGRESS' && !notes ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined
      }
    });

    // If completed, update volunteer stats
    if (status === 'COMPLETED') {
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: task.volunteerId }
      });

      if (volunteer) {
        await prisma.volunteer.update({
          where: { id: task.volunteerId },
          data: {
            completedTasks: { increment: 1 },
            currentTask: null
          }
        });
      }
    }

    res.json({
      success: true,
      task,
      message: 'Task updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      message: error.message
    });
  }
});

/**
 * POST /api/volunteers/:id/check-in
 * Check in volunteer
 */
router.post('/:id/check-in', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { location, locationCoords } = req.body;

    const volunteer = await prisma.volunteer.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        checkInTime: new Date(),
        lastLocation: location,
        locationCoords,
        lastLocationUpdate: new Date()
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId: volunteer.eventId,
        action: 'volunteer_checked_in',
        description: `${volunteer.name} checked in at ${location}`,
        entityType: 'volunteer',
        entityId: id
      }
    });

    res.json({
      success: true,
      volunteer,
      message: 'Checked in successfully'
    });
  } catch (error: any) {
    console.error('Error checking in volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check in',
      message: error.message
    });
  }
});

/**
 * POST /api/volunteers/:id/check-out
 * Check out volunteer
 */
router.post('/:id/check-out', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const volunteer = await prisma.volunteer.findUnique({
      where: { id }
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    // Calculate total hours
    let totalHours = volunteer.totalHours;
    if (volunteer.checkInTime) {
      const hoursWorked = (new Date().getTime() - volunteer.checkInTime.getTime()) / (1000 * 60 * 60);
      totalHours += hoursWorked;
    }

    const updatedVolunteer = await prisma.volunteer.update({
      where: { id },
      data: {
        status: 'OFFLINE',
        checkOutTime: new Date(),
        totalHours
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId: volunteer.eventId,
        action: 'volunteer_checked_out',
        description: `${volunteer.name} checked out (${totalHours.toFixed(2)} hours total)`,
        entityType: 'volunteer',
        entityId: id
      }
    });

    res.json({
      success: true,
      volunteer: updatedVolunteer,
      hoursWorked: totalHours.toFixed(2),
      message: 'Checked out successfully'
    });
  } catch (error: any) {
    console.error('Error checking out volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check out',
      message: error.message
    });
  }
});

/**
 * POST /api/volunteers/:id/location
 * Update volunteer location (for tracking)
 */
router.post('/:id/location', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { location, locationCoords } = req.body;

    const volunteer = await prisma.volunteer.update({
      where: { id },
      data: {
        lastLocation: location,
        locationCoords,
        lastLocationUpdate: new Date()
      }
    });

    res.json({
      success: true,
      volunteer
    });
  } catch (error: any) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
      message: error.message
    });
  }
});

/**
 * DELETE /api/volunteers/:id
 * Remove volunteer
 */
router.delete('/:id', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const volunteer = await prisma.volunteer.update({
      where: { id },
      data: {
        status: 'REMOVED',
        isAvailable: false
      }
    });

    res.json({
      success: true,
      message: 'Volunteer removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove volunteer',
      message: error.message
    });
  }
});

/**
 * GET /api/volunteers/event/:eventId/stats
 * Get volunteer statistics
 */
router.get('/event/:eventId/stats', authenticate, authorize(['ORGANIZER', 'LOGISTICS']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const total = await prisma.volunteer.count({
      where: { eventId }
    });

    const byStatus = await prisma.volunteer.groupBy({
      by: ['status'],
      where: { eventId },
      _count: true
    });

    const byZone = await prisma.volunteer.groupBy({
      by: ['zone'],
      where: { eventId },
      _count: true
    });

    const byRole = await prisma.volunteer.groupBy({
      by: ['role'],
      where: { eventId },
      _count: true
    });

    const totalHours = await prisma.volunteer.aggregate({
      where: { eventId },
      _sum: {
        totalHours: true
      }
    });

    res.json({
      success: true,
      stats: {
        total,
        byStatus: byStatus.reduce((acc: Record<string, number>, s: any) => {
          acc[s.status] = s._count;
          return acc;
        }, {} as Record<string, number>),
        byZone: byZone.reduce((acc: Record<string, number>, z: any) => {
          acc[z.zone] = z._count;
          return acc;
        }, {} as Record<string, number>),
        byRole: byRole.reduce((acc: Record<string, number>, r: any) => {
          acc[r.role] = r._count;
          return acc;
        }, {} as Record<string, number>),
        totalHours: totalHours._sum.totalHours || 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching volunteer stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteer stats',
      message: error.message
    });
  }
});

export default router;
