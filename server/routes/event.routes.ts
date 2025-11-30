/**
 * Event API Routes
 */

import { Router, Request, Response } from 'express';
import { prisma, io } from '../index';
import { eventTemplateService } from '../services/event-template.service';
import { venueMappingService } from '../services/venue-mapping.service';

const router = Router();

// GET all events
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as any;
    }

    const events = await prisma.event.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { startTime: 'desc' },
      include: {
        _count: {
          select: {
            incidents: true,
            alerts: true,
            predictions: true,
          },
        },
      },
    });

    const total = await prisma.event.count({ where });

    res.json({
      success: true,
      data: events,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

// GET single event
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        incidents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        predictions: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
});

// CREATE event
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      venue,
      location,
      startTime,
      endTime,
      expectedAttendees,
      organizerId,
      eventTypeId,
      dynamicFields,
    } = req.body;

    // If eventTypeId is provided, use template-based creation
    if (eventTypeId && dynamicFields) {
      const result = await eventTemplateService.createEventFromTemplate(
        eventTypeId,
        {
          organizerId,
          name,
          description,
          venue,
          location,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          expectedAttendees: parseInt(expectedAttendees)
        },
        dynamicFields
      );

      if (!result.success) {
        return res.status(400).json({ success: false, errors: result.errors });
      }

      return res.status(201).json({ success: true, data: result.event });
    }

    // Legacy creation without template
    const event = await prisma.event.create({
      data: {
        name,
        description,
        venue,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        expectedAttendees: parseInt(expectedAttendees),
        organizerId,
        status: 'UPCOMING',
      },
    });

    if (dynamicFields && typeof dynamicFields === 'object') {
      await prisma.eventConfig.upsert({
        where: { eventId: event.id },
        update: { dynamicFields },
        create: { eventId: event.id, dynamicFields },
      });
    }

    // Emit real-time event creation
    io.to(`organizer:${organizerId}`).emit('event:created', event);

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

// UPDATE event
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert date strings to Date objects if present
    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime);
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime);
    if (updateData.expectedAttendees) updateData.expectedAttendees = parseInt(updateData.expectedAttendees);

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

// DELETE event
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

// GET event statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [
      event,
      incidentCount,
      alertCount,
      latestPrediction,
      criticalIncidents,
    ] = await Promise.all([
      prisma.event.findUnique({ where: { id } }),
      prisma.incident.count({ where: { eventId: id } }),
      prisma.alert.count({ where: { eventId: id } }),
      prisma.prediction.findFirst({
        where: { eventId: id },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.incident.count({
        where: {
          eventId: id,
          severity: 'CRITICAL',
          status: { in: ['ACTIVE', 'RESPONDING'] },
        },
      }),
    ]);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({
      success: true,
      data: {
        event,
        stats: {
          totalIncidents: incidentCount,
          totalAlerts: alertCount,
          criticalIncidents,
          latestPrediction,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event statistics' });
  }
});

// ===== VENUE MAPPING & GEOFENCING ENDPOINTS =====

// GET event type templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = eventTemplateService.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching event templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event templates' });
  }
});

// GET specific event type template
router.get('/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const template = eventTemplateService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching event template:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event template' });
  }
});

// GET venue layout
router.get('/:id/venue-layout', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const venueLayout = await prisma.venueLayout.findUnique({
      where: { eventId: id }
    });

    if (!venueLayout) {
      return res.status(404).json({ success: false, error: 'Venue layout not found' });
    }

    res.json({ success: true, data: venueLayout });
  } catch (error) {
    console.error('Error fetching venue layout:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch venue layout' });
  }
});

// SAVE venue layout with full validation
router.post('/:id/venue-layout', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { boundary, zones, gates, routes } = req.body;

    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Validate and save using service
    const result = await venueMappingService.saveVenueLayout(
      id,
      boundary,
      zones || [],
      gates || [],
      routes || []
    );

    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }

    res.json({ success: true, message: 'Venue layout saved successfully' });
  } catch (error) {
    console.error('Error saving venue layout:', error);
    res.status(500).json({ success: false, error: 'Failed to save venue layout' });
  }
});

// CHECK geofence for a location
router.post('/:id/geofence-check', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { location, userId, userRole } = req.body;

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ success: false, error: 'Valid location (lat, lng) required' });
    }

    const result = await venueMappingService.checkGeofence(
      id,
      location,
      userId,
      userRole
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error checking geofence:', error);
    res.status(500).json({ success: false, error: 'Failed to check geofence' });
  }
});

// FIND optimal path with crowd avoidance
router.post('/:id/navigate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to, avoidCrowds = true } = req.body;

    if (!from || !to || !from.lat || !from.lng || !to.lat || !to.lng) {
      return res.status(400).json({
        success: false,
        error: 'Valid from and to locations (lat, lng) required'
      });
    }

    const result = await venueMappingService.findOptimalPath(id, from, to, avoidCrowds);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error finding optimal path:', error);
    res.status(500).json({ success: false, error: 'Failed to find optimal path' });
  }
});

// UPDATE event dynamic fields
router.put('/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dynamicFields } = req.body;

    if (!dynamicFields) {
      return res.status(400).json({ success: false, error: 'dynamicFields required' });
    }

    const result = await eventTemplateService.updateEventDynamicFields(id, dynamicFields);

    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }

    res.json({ success: true, message: 'Event configuration updated successfully' });
  } catch (error) {
    console.error('Error updating event config:', error);
    res.status(500).json({ success: false, error: 'Failed to update event configuration' });
  }
});

export default router;
