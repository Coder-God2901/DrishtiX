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
 * Gate Control Routes
 * Handles entry/exit gates, access control, and gate monitoring
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/gates/:eventId
 * Get all gates for an event
 */
router.get('/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status, type } = req.query;

    const where: any = { eventId };
    if (status) where.status = status;
    if (type) where.type = type;

    const gates = await prisma.gateControl.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: gates,
      count: gates.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gates/detail/:gateId
 * Get specific gate details
 */
router.get('/detail/:gateId', authenticate, async (req: Request, res: Response) => {
  try {
    const { gateId } = req.params;

    const gate = await prisma.gateControl.findUnique({
      where: { id: gateId },
      include: {
        entries: {
          orderBy: { entryTime: 'desc' },
          take: 50
        }
      }
    });

    if (!gate) {
      return res.status(404).json({
        success: false,
        error: 'Gate not found'
      });
    }

    res.json({
      success: true,
      data: gate
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gates
 * Create new gate
 */
router.post('/', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      name,
      type,
      location,
      zone,
      capacity,
      accessLevel
    } = req.body;

    const gate = await prisma.gateControl.create({
      data: {
        eventId,
        name,
        type,
        location,
        zone,
        capacity: capacity || 0,
        accessLevel: accessLevel || 'PUBLIC',
        status: 'OPEN',
        currentOccupancy: 0,
        totalEntries: 0,
        totalExits: 0,
        averageWaitTime: 0
      }
    });

    res.status(201).json({
      success: true,
      data: gate,
      message: 'Gate created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/gates/:gateId
 * Update gate configuration
 */
router.put('/:gateId', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { gateId } = req.params;
    const updateData = req.body;

    const gate = await prisma.gateControl.update({
      where: { id: gateId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: gate,
      message: 'Gate updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gates/:gateId/control
 * Control gate status (open/close/lock)
 */
router.post('/:gateId/control', authenticate, authorize(['ORGANIZER', 'SECURITY', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { gateId } = req.params;
    const { action, reason } = req.body;

    const gate = await prisma.gateControl.findUnique({
      where: { id: gateId }
    });

    if (!gate) {
      return res.status(404).json({
        success: false,
        error: 'Gate not found'
      });
    }

    let newStatus = gate.status;
    switch (action) {
      case 'open':
        newStatus = 'OPEN';
        break;
      case 'close':
        newStatus = 'CLOSED';
        break;
      case 'lock':
        newStatus = 'LOCKED';
        break;
      case 'emergency':
        newStatus = 'EMERGENCY';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    const updated = await prisma.gateControl.update({
      where: { id: gateId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        eventId: gate.eventId,
        action: `Gate ${action}`,
        description: `Gate ${gate.name} was ${action}ed${reason ? `: ${reason}` : ''}`,
        entityType: 'gate',
        entityId: gateId,
        userId: req.user?.id,
        userName: req.user?.name
      }
    });

    res.json({
      success: true,
      data: updated,
      message: `Gate ${action}ed successfully`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gates/:gateId/entry
 * Record gate entry
 */
router.post('/:gateId/entry', authenticate, async (req: Request, res: Response) => {
  try {
    const { gateId } = req.params;
    const {
      userId,
      ticketId,
      entryType,
      metadata
    } = req.body;

    const gate = await prisma.gateControl.findUnique({
      where: { id: gateId }
    });

    if (!gate) {
      return res.status(404).json({
        success: false,
        error: 'Gate not found'
      });
    }

    if (gate.status === 'CLOSED' || gate.status === 'LOCKED') {
      return res.status(403).json({
        success: false,
        error: 'Gate is currently closed'
      });
    }

    const entry = await prisma.gateEntry.create({
      data: {
        gateId,
        eventId: gate.eventId,
        userId: userId || null,
        ticketId: ticketId || null,
        entryType,
        entryTime: new Date(),
        metadata
      }
    });

    // Update gate statistics
    await prisma.gateControl.update({
      where: { id: gateId },
      data: {
        currentOccupancy: { increment: 1 },
        totalEntries: { increment: 1 }
      }
    });

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Entry recorded successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gates/:gateId/exit
 * Record gate exit
 */
router.post('/:gateId/exit', authenticate, async (req: Request, res: Response) => {
  try {
    const { gateId } = req.params;
    const { userId } = req.body;

    const gate = await prisma.gateControl.findUnique({
      where: { id: gateId }
    });

    if (!gate) {
      return res.status(404).json({
        success: false,
        error: 'Gate not found'
      });
    }

    await prisma.gateEntry.create({
      data: {
        gateId,
        eventId: gate.eventId,
        userId: userId || null,
        entryType: 'EXIT',
        entryTime: new Date()
      }
    });

    // Update gate statistics
    await prisma.gateControl.update({
      where: { id: gateId },
      data: {
        currentOccupancy: { decrement: 1 },
        totalExits: { increment: 1 }
      }
    });

    res.json({
      success: true,
      message: 'Exit recorded successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gates/:gateId/activity
 * Get gate activity log
 */
router.get('/:gateId/activity', authenticate, async (req: Request, res: Response) => {
  try {
    const { gateId } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    const where: any = { gateId };

    if (startDate || endDate) {
      where.entryTime = {};
      if (startDate) where.entryTime.gte = new Date(startDate as string);
      if (endDate) where.entryTime.lte = new Date(endDate as string);
    }

    const entries = await prisma.gateEntry.findMany({
      where,
      orderBy: { entryTime: 'desc' },
      take: Number(limit)
    });

    res.json({
      success: true,
      data: entries,
      count: entries.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gates/:eventId/metrics
 * Get gate metrics for event
 */
router.get('/:eventId/metrics', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const gates = await prisma.gateControl.findMany({
      where: { eventId }
    });

    const totalEntries = gates.reduce((sum: number, g: any) => sum + g.totalEntries, 0);
    const totalExits = gates.reduce((sum: number, g: any) => sum + g.totalExits, 0);
    const currentOccupancy = gates.reduce((sum: number, g: any) => sum + g.currentOccupancy, 0);
    const totalCapacity = gates.reduce((sum: number, g: any) => sum + g.capacity, 0);

    const metrics = {
      totalGates: gates.length,
      openGates: gates.filter(g => g.status === 'OPEN').length,
      closedGates: gates.filter(g => g.status === 'CLOSED').length,
      totalEntries,
      totalExits,
      currentOccupancy,
      totalCapacity,
      utilizationRate: totalCapacity > 0 ? (currentOccupancy / totalCapacity) * 100 : 0,
      peakHourEntries: 0, // Calculate from time-series data
      averageWaitTime: gates.reduce((sum, g) => sum + g.averageWaitTime, 0) / gates.length
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gates/:eventId/analytics
 * Get gate analytics (hourly breakdown)
 */
router.get('/:eventId/analytics', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { date } = req.query;

    // Query for hourly breakdown
    const gates = await prisma.gateControl.findMany({
      where: { eventId },
      include: {
        entries: {
          where: date ? {
            entryTime: {
              gte: new Date(date as string),
              lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
            }
          } : undefined
        }
      }
    });

    // Group by hour
    const hourlyData: any = {};
    gates.forEach(gate => {
      gate.entries.forEach(entry => {
        const hour = new Date(entry.entryTime).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { hour, entries: 0, exits: 0 };
        }
        if (entry.entryType === 'ENTRY') {
          hourlyData[hour].entries++;
        } else if (entry.entryType === 'EXIT') {
          hourlyData[hour].exits++;
        }
      });
    });

    const analytics = Object.values(hourlyData).sort((a: any, b: any) => a.hour - b.hour);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gates/emergency/:eventId
 * Emergency: Open all gates
 */
router.post('/emergency/:eventId', authenticate, authorize(['ORGANIZER', 'SECURITY', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;

    await prisma.gateControl.updateMany({
      where: { eventId },
      data: {
        status: 'EMERGENCY',
        updatedAt: new Date()
      }
    });

    // Log emergency action
    await prisma.activityLog.create({
      data: {
        eventId,
        action: 'Emergency Gate Opening',
        description: `All gates opened for emergency: ${reason || 'Emergency situation'}`,
        entityType: 'gate',
        userId: req.user?.id,
        userName: req.user?.name
      }
    });

    res.json({
      success: true,
      message: 'All gates opened for emergency'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gates/alerts/:eventId
 * Get gate alerts (capacity, bottleneck, etc.)
 */
router.get('/alerts/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const gates = await prisma.gateControl.findMany({
      where: { eventId }
    });

    const alerts: any[] = [];

    gates.forEach(gate => {
      // Check capacity
      if (gate.capacity > 0 && gate.currentOccupancy >= gate.capacity * 0.9) {
        alerts.push({
          gateId: gate.id,
          gateName: gate.name,
          type: 'CAPACITY_WARNING',
          severity: 'HIGH',
          message: `Gate ${gate.name} is at ${Math.round((gate.currentOccupancy / gate.capacity) * 100)}% capacity`
        });
      }

      // Check wait time
      if (gate.averageWaitTime > 300) { // 5 minutes
        alerts.push({
          gateId: gate.id,
          gateName: gate.name,
          type: 'WAIT_TIME_HIGH',
          severity: 'MEDIUM',
          message: `Gate ${gate.name} has high wait time: ${Math.round(gate.averageWaitTime / 60)} minutes`
        });
      }

      // Check status
      if (gate.status === 'CLOSED' || gate.status === 'LOCKED') {
        alerts.push({
          gateId: gate.id,
          gateName: gate.name,
          type: 'GATE_CLOSED',
          severity: 'INFO',
          message: `Gate ${gate.name} is ${gate.status.toLowerCase()}`
        });
      }
    });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
