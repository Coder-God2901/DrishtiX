/**
 * Responder API Routes
 */

import { Router, Request, Response } from 'express';
import { prisma, io } from '../index';

const router = Router();

// GET all responders
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const responders = await prisma.responder.findMany({
      where,
      orderBy: { lastUpdate: 'desc' },
    });

    res.json({ success: true, data: responders });
  } catch (error) {
    console.error('Error fetching responders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch responders' });
  }
});

// UPDATE responder location
router.put('/:id/location', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { location } = req.body;

    const responder = await prisma.responder.update({
      where: { id },
      data: {
        location,
        lastUpdate: new Date(),
      },
    });

    // Emit real-time location update
    io.emit('responder:location', responder);

    res.json({ success: true, data: responder });
  } catch (error) {
    console.error('Error updating responder location:', error);
    res.status(500).json({ success: false, error: 'Failed to update responder location' });
  }
});

// UPDATE responder status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const responder = await prisma.responder.update({
      where: { id },
      data: {
        status,
        lastUpdate: new Date(),
      },
    });

    // Emit real-time status update
    io.emit('responder:status', responder);

    res.json({ success: true, data: responder });
  } catch (error) {
    console.error('Error updating responder status:', error);
    res.status(500).json({ success: false, error: 'Failed to update responder status' });
  }
});

export default router;
