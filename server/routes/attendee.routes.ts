/**
 * Attendee API Routes
 * Handles attendee-specific functionalities like event joining, navigation, SOS, feedback
 */

import { Router, Request, Response } from 'express';
import { prisma, io } from '../index';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { auditLoggerService } from '../services/audit-logger.service';

const router = Router();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// JOIN event (3 methods: QR_CODE, EVENT_CODE, BROWSE)
router.post('/events/:eventId/join', authenticate, requireRoles(['ATTENDEE']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { eventId } = req.params;
    const { joinMethod, eventCode, qrData } = req.body;

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, startDate: true, endDate: true, eventCode: true, status: true },
    });

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (event.status !== 'SCHEDULED' && event.status !== 'ONGOING') {
      return res.status(400).json({ success: false, error: 'Event is not active for registration' });
    }

    // Validate join method
    if (joinMethod === 'EVENT_CODE' && event.eventCode !== eventCode) {
      return res.status(400).json({ success: false, error: 'Invalid event code' });
    }

    if (joinMethod === 'QR_CODE' && !qrData) {
      return res.status(400).json({ success: false, error: 'QR code data required' });
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: { eventId, userId: authReq.userId },
    });

    if (existingRegistration) {
      return res.status(400).json({ success: false, error: 'Already registered for this event' });
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId: authReq.userId,
        joinMethod,
        checkedInAt: null,
      },
      include: {
        event: { select: { name: true, startDate: true, venue: true } },
        user: { select: { name: true, email: true } },
      },
    });

    await auditLoggerService.log({
      userId: authReq.userId,
      action: 'ATTENDEE_JOIN_EVENT',
      entityType: 'EVENT_REGISTRATION',
      entityId: registration.id,
      details: { eventId, joinMethod },
    } as any);

    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ success: false, error: 'Failed to join event' });
  }
});

// CHECK-IN at event
router.post('/events/:eventId/checkin', authenticate, requireRoles(['ATTENDEE']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { eventId } = req.params;
    const { location } = req.body;

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const registration = await prisma.eventRegistration.findFirst({
      where: { eventId, userId: authReq.userId },
    });

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    if (registration.checkedInAt) {
      return res.status(400).json({ success: false, error: 'Already checked in' });
    }

    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { checkedInAt: new Date() },
    });

    await auditLoggerService.log({
      userId: authReq.userId,
      action: 'ATTENDEE_CHECKIN',
      entityType: 'EVENT_REGISTRATION',
      entityId: registration.id,
      details: { eventId, location },
    } as any);

    res.json({ success: true, data: updatedRegistration });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ success: false, error: 'Failed to check in' });
  }
});

// GET venue map (USP 1: Predictions)
router.get('/events/:eventId/venue-map', authenticate, requireRoles(['ATTENDEE']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const venueLayout = await prisma.venueLayout.findUnique({
      where: { eventId },
      include: {
        zones: { include: { amenities: true } },
        entrances: true,
        amenities: true,
      },
    });

    if (!venueLayout) {
      return res.status(404).json({ success: false, error: 'Venue map not available' });
    }

    const crowdData = await prisma.crowdData.findMany({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json({
      success: true,
      data: {
        venueLayout,
        crowdData,
        heatmapData: crowdData.map((d: { zoneId: any; density: any; timestamp: any; predicted: any; }) => ({
          zoneId: d.zoneId,
          density: d.density,
          timestamp: d.timestamp,
          predicted: d.predicted,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching venue map:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch venue map' });
  }
});

// NAVIGATE (USP 4: crowd-aware routing)
router.post('/events/:eventId/navigate', authenticate, requireRoles(['ATTENDEE']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { eventId } = req.params;
    const { from, to, avoidCrowds = true } = req.body;

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const crowdData = await prisma.crowdData.findMany({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const crowdedZones = crowdData.filter((d: { density: number; }) => d.density > 0.7).map((d: { zoneId: any; }) => d.zoneId);

    const route = {
      from,
      to,
      distance: calculateDistance(from, to),
      estimatedTime: calculateETA(from, to, crowdedZones),
      avoidZones: avoidCrowds ? crowdedZones : [],
      waypoints: generateWaypoints(from, to, crowdedZones, avoidCrowds),
      crowdLevel: getCrowdLevel(crowdedZones.length),
      updatedAt: new Date(),
    };

    await auditLoggerService.log({
      userId: authReq.userId,
      action: 'ATTENDEE_REQUEST_NAVIGATION',
      entityType: 'EVENT',
      entityId: eventId,
      details: { from, to, avoidCrowds },
    } as any);

    res.json({ success: true, data: route });
  } catch (error) {
    console.error('Error calculating navigation:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate route' });
  }
});

// CREATE SOS (USP 4: Auto-dispatch)
router.post('/sos', authenticate, requireRoles(['ATTENDEE']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { eventId, issueType, description, location, media } = req.body;

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const sosRequest = await prisma.sOSRequest.create({
      data: {
        eventId,
        userId: authReq.userId,
        issueType,
        description,
        location,
        media,
        status: 'PENDING',
      },
    });

    const responders = await prisma.user.findMany({
      where: { role: { in: ['SECURITY', 'MEDICAL'] } },
      take: 5,
    });

    if (responders.length > 0) {
      await prisma.sOSRequest.update({
        where: { id: sosRequest.id },
        data: {
          status: 'ACKNOWLEDGED',
          responderId: responders[0].id,
          acknowledgedAt: new Date(),
        },
      });

      if (io) {
        io.to(`user-${responders[0].id}`).emit('sos-assigned', {
          sosId: sosRequest.id,
          issueType,
          location,
        });
      }
    }

    if (io) {
      io.to(`event-${eventId}`).emit('sos-created', {
        sosId: sosRequest.id,
        issueType,
        status: responders.length > 0 ? 'ACKNOWLEDGED' : 'PENDING',
      });
    }

    await auditLoggerService.log({
      userId: authReq.userId,
      action: 'ATTENDEE_CREATE_SOS',
      entityType: 'SOS_REQUEST',
      entityId: sosRequest.id,
      details: { eventId, issueType },
    } as any);

    res.json({ success: true, data: sosRequest });
  } catch (error) {
    console.error('Error creating SOS:', error);
    res.status(500).json({ success: false, error: 'Failed to create SOS' });
  }
});

// GET SOS status
router.get('/sos/:sosId', authenticate, requireRoles(['ATTENDEE']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { sosId } = req.params;

    const sosRequest = await prisma.sOSRequest.findUnique({
      where: { id: sosId },
      include: { responder: { select: { name: true, role: true } } },
    });

    if (!sosRequest || sosRequest.userId !== authReq.userId) {
      return res.status(404).json({ success: false, error: 'SOS not found' });
    }

    res.json({ success: true, data: sosRequest });
  } catch (error) {
    console.error('Error fetching SOS:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch SOS' });
  }
});

// SUBMIT feedback (USP 6: Self-learning)
router.post('/events/:eventId/feedback', authenticate, requireRoles(['ATTENDEE']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { eventId } = req.params;
    const {
      overallRating,
      safetyRating,
      navigationRating,
      facilitiesRating,
      managementRating,
      crowdManagementRating,
      alertUsefulnessRating,
      comments,
    } = req.body;

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const registration = await prisma.eventRegistration.findFirst({
      where: { eventId, userId: authReq.userId },
    });

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Must attend event to provide feedback' });
    }

    if (registration.feedbackSubmitted) {
      return res.status(400).json({ success: false, error: 'Feedback already submitted' });
    }

    const feedback = await prisma.eventFeedback.create({
      data: {
        eventId,
        userId: authReq.userId,
        overallRating,
        safetyRating,
        navigationRating,
        facilitiesRating,
        managementRating,
        crowdManagementRating,
        alertUsefulnessRating,
        comments,
      },
    });

    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { feedbackSubmitted: true },
    });

    const logEntry: any = {
      userId: authReq.userId,
      action: 'ATTENDEE_SUBMIT_FEEDBACK',
      entityType: 'EVENT_FEEDBACK',
      entityId: feedback.id,
      details: { eventId, ratings: { overall: overallRating, safety: safetyRating } },
    };
    await auditLoggerService.log(logEntry);

    res.json({ success: true, data: feedback, message: 'Your feedback helps improve our AI' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to submit feedback' });
  }
});

// GET my events
router.get('/my-events', authenticate, requireRoles(['ATTENDEE']), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: authReq.userId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            venue: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    res.json({ success: true, data: registrations });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

// GET attendee reports for an event
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { eventId, status, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    const reports = await prisma.attendeeReport.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
      include: {
        validations: true,
      },
    });

    const total = await prisma.attendeeReport.count({ where });

    res.json({
      success: true,
      data: reports,
      pagination: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    console.error('Error fetching attendee reports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendee reports' });
  }
});

// CREATE attendee report
router.post('/reports', async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      reporterId,
      reporterName,
      type,
      severity,
      description,
      location,
      imageUrls,
      videoUrls,
    } = req.body;

    const report = await prisma.attendeeReport.create({
      data: {
        eventId,
        reporterId,
        reporterName,
        type,
        severity,
        description,
        location,
        imageUrls: imageUrls || [],
        videoUrls: videoUrls || [],
        status: 'PENDING',
        validationThreshold: 0.3,
      },
    });

    // Emit real-time report
    io.to(`event:${eventId}`).emit('report:new', report);

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('Error creating attendee report:', error);
    res.status(500).json({ success: false, error: 'Failed to create attendee report' });
  }
});

// VALIDATE attendee report
router.post('/reports/:id/validate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { validatorId, validatorType, decision, notes } = req.body;

    const validation = await prisma.reportValidation.create({
      data: {
        reportId: id,
        validatorId,
        validatorType,
        decision,
        notes,
      },
    });

    // Update report validation counts
    const validations = await prisma.reportValidation.findMany({
      where: { reportId: id },
    });

    const validatedCount = validations.filter((v: { decision: string; }) => v.decision === 'CONFIRM').length;
    const rejectedCount = validations.filter((v: { decision: string; }) => v.decision === 'REJECT').length;

    const shouldConfirm = validatedCount >= 3;
    const shouldReject = rejectedCount >= 3;

    const report = await prisma.attendeeReport.update({
      where: { id },
      data: {
        validationCount: validations.length,
        validatedCount,
        rejectedCount,
        status: shouldConfirm ? 'CONFIRMED' : shouldReject ? 'REJECTED' : 'VALIDATING',
        confirmedAt: shouldConfirm ? new Date() : null,
      },
    });

    // Emit real-time validation update
    io.to(`event:${report.eventId}`).emit('report:validated', report);

    res.json({ success: true, data: { validation, report } });
  } catch (error) {
    console.error('Error validating report:', error);
    res.status(500).json({ success: false, error: 'Failed to validate report' });
  }
});

// Utility functions for navigation (USP 4)
function calculateDistance(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const R = 6371e3;
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function calculateETA(from: any, to: any, crowdedZones: string[]): number {
  const distance = calculateDistance(from, to);
  const baseSpeed = 1.4;
  const crowdPenalty = crowdedZones.length * 0.3;
  const adjustedSpeed = baseSpeed * (1 - crowdPenalty);
  return Math.ceil(distance / adjustedSpeed / 60);
}

function generateWaypoints(from: any, to: any, crowdedZones: string[], avoidCrowds: boolean): any[] {
  if (!avoidCrowds || crowdedZones.length === 0) {
    return [from, to];
  }

  const midpoint = {
    lat: (from.lat + to.lat) / 2,
    lng: (from.lng + to.lng) / 2,
    zoneId: null,
  };

  return [from, midpoint, to];
}

function getCrowdLevel(crowdedZoneCount: number): string {
  if (crowdedZoneCount === 0) return 'LOW';
  if (crowdedZoneCount <= 2) return 'MEDIUM';
  return 'HIGH';
}

export default router;
