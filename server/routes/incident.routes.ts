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
 * Incident API Routes
 */

import { Router, Request, Response } from 'express';
import { prisma, io } from '../index';

const router = Router();

// GET all incidents
router.get('/', async (req: Request, res: Response) => {
  try {
    const { eventId, status, severity, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (eventId) where.eventId = eventId as string;
    if (status) where.status = status as any;
    if (severity) where.severity = severity as any;

    const incidents = await prisma.incident.findMany({
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
      include: {
        responders: true,
      },
    });

    const total = await prisma.incident.count({ where });

    res.json({
      success: true,
      data: incidents,
      pagination: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incidents' });
  }
});

// GET single incident
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        responders: true,
        event: true,
      },
    });

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.json({ success: true, data: incident });
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incident' });
  }
});

// CREATE incident
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      type,
      severity,
      status = 'ACTIVE',
      location,
      description,
      detectedBy = 'manual',
      confidence,
      aiSummary,
    } = req.body;

    const incident = await prisma.incident.create({
      data: {
        eventId,
        type,
        severity,
        status,
        location,
        description,
        detectedBy,
        confidence: confidence ? parseFloat(confidence) : undefined,
        aiSummary,
      },
    });

    // Emit real-time update via Socket.IO
    io.to(`incidents:${eventId}`).emit('incident:created', incident);
    io.to(`event:${eventId}`).emit('incident:created', incident);

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ success: false, error: 'Failed to create incident' });
  }
});

// UPDATE incident
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: { responders: true },
    });

    // Emit real-time update
    io.to(`incidents:${incident.eventId}`).emit('incident:updated', incident);
    io.to(`event:${incident.eventId}`).emit('incident:updated', incident);

    res.json({ success: true, data: incident });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ success: false, error: 'Failed to update incident' });
  }
});

// RESOLVE incident
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution, resolvedBy } = req.body;

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolution,
        resolvedBy,
      },
    });

    // Emit real-time update
    io.to(`incidents:${incident.eventId}`).emit('incident:resolved', incident);
    io.to(`event:${incident.eventId}`).emit('incident:resolved', incident);

    res.json({ success: true, data: incident });
  } catch (error) {
    console.error('Error resolving incident:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve incident' });
  }
});

// DELETE incident
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    await prisma.incident.delete({ where: { id } });

    // Emit real-time update
    io.to(`incidents:${incident.eventId}`).emit('incident:deleted', { id });

    res.json({ success: true, message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({ success: false, error: 'Failed to delete incident' });
  }
});

export default router;
