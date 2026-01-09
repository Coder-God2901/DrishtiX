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
 * Help System Routes
 * Handles find person, medical assistance, SOS alerts, and general help requests
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/help/find-person
 * Create a find person request
 */
router.post('/find-person', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      requesterId,
      requesterName,
      requesterPhone,
      requesterLocation,
      missingPersonName,
      missingPersonDescription,
      missingPersonPhoto,
      lastSeenLocation,
      lastSeenTime
    } = req.body;

    const helpRequest = await prisma.helpRequest.create({
      data: {
        eventId,
        requesterId,
        requesterName,
        requesterPhone,
        requesterLocation,
        type: 'FIND_PERSON',
        priority: 'HIGH',
        description: `Looking for ${missingPersonName}`,
        missingPersonName,
        missingPersonDescription,
        missingPersonPhoto,
        lastSeenLocation,
        lastSeenTime: lastSeenTime ? new Date(lastSeenTime) : null,
        updates: []
      }
    });

    // Broadcast notification to volunteers and security
    await prisma.notification.createMany({
      data: [
        {
          userId: requesterId,
          eventId,
          type: 'HELP_REQUEST',
          priority: 'HIGH',
          title: 'Find Person Request Submitted',
          message: `We're actively looking for ${missingPersonName}. You'll be notified when found.`,
          channels: ['push']
        }
      ]
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: 'find_person_request',
        description: `Find person request for ${missingPersonName}`,
        userId: requesterId,
        entityType: 'help_request',
        entityId: helpRequest.id
      }
    });

    res.json({
      success: true,
      helpRequest,
      message: 'Find person request created. Our team is on it.'
    });
  } catch (error: any) {
    console.error('Error creating find person request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create find person request',
      message: error.message
    });
  }
});

/**
 * POST /api/help/medical
 * Create a medical assistance request
 */
router.post('/medical', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      requesterId,
      requesterName,
      requesterPhone,
      requesterLocation,
      medicalIssue,
      severity = 'MEDIUM',
      description
    } = req.body;

    const priority = severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'HIGH' : 'MEDIUM';

    const helpRequest = await prisma.helpRequest.create({
      data: {
        eventId,
        requesterId,
        requesterName,
        requesterPhone,
        requesterLocation,
        type: 'MEDICAL_ASSISTANCE',
        priority,
        description: description || `Medical assistance needed: ${medicalIssue}`,
        medicalIssue,
        severity,
        updates: []
      }
    });

    // Find nearest medical volunteers
    const medicalVolunteers = await prisma.volunteer.findMany({
      where: {
        eventId,
        role: 'medical',
        status: 'ACTIVE',
        isAvailable: true
      },
      take: 5
    });

    // Assign to nearest available volunteer
    if (medicalVolunteers.length > 0) {
      const assigned = medicalVolunteers[0];

      await prisma.helpRequest.update({
        where: { id: helpRequest.id },
        data: {
          assignedVolunteer: assigned.id,
          status: 'ACKNOWLEDGED',
          assignedAt: new Date()
        }
      });

      // Notify assigned volunteer
      await prisma.notification.create({
        data: {
          userId: assigned.email,
          eventId,
          type: 'HELP_REQUEST',
          priority: 'URGENT',
          title: 'Medical Assistance Needed',
          message: `${medicalIssue} - Location: ${requesterLocation}`,
          channels: ['push', 'sms'],
          actionUrl: `/help-requests/${helpRequest.id}`
        }
      });
    }

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: requesterId,
        eventId,
        type: 'HELP_REQUEST',
        priority: 'HIGH',
        title: 'Medical Help On The Way',
        message: 'Medical team has been notified and is coming to assist you.',
        channels: ['push']
      }
    });

    // Create incident if critical
    if (severity === 'CRITICAL') {
      await prisma.incident.create({
        data: {
          eventId,
          type: 'MEDICAL',
          severity: 'HIGH',
          status: 'ACTIVE',
          location: requesterLocation,
          zone: 'Unknown',
          description: `Medical emergency: ${medicalIssue}`,
          detectedBy: requesterName,
          confidence: 1.0
        }
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: 'medical_assistance_request',
        description: `Medical assistance request: ${medicalIssue}`,
        userId: requesterId,
        entityType: 'help_request',
        entityId: helpRequest.id
      }
    });

    res.json({
      success: true,
      helpRequest,
      message: 'Medical team has been notified',
      estimatedArrival: '5-10 minutes'
    });
  } catch (error: any) {
    console.error('Error creating medical assistance request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create medical assistance request',
      message: error.message
    });
  }
});

/**
 * POST /api/help/sos
 * Create an SOS/emergency alert
 */
router.post('/sos', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      attendeeId,
      attendeeName,
      issueType,
      description,
      location,
      imageUrls,
      videoUrls,
      audioNote
    } = req.body;

    const sosRequest = await prisma.sOSRequest.create({
      data: {
        eventId,
        attendeeId,
        attendeeName,
        issueType,
        description,
        location,
        priority: 'HIGH',
        imageUrls: imageUrls || [],
        videoUrls: videoUrls || [],
        audioNote
      }
    });

    // Create high-priority incident
    await prisma.incident.create({
      data: {
        eventId,
        type: issueType === 'MEDICAL_EMERGENCY' ? 'MEDICAL' :
          issueType === 'FIRE_HAZARD' ? 'FIRE' :
            issueType === 'CROWD_CRUSH' ? 'CRUSH' : 'OTHER',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        location,
        zone: 'SOS Alert',
        description: `SOS: ${description}`,
        detectedBy: attendeeName,
        confidence: 1.0
      }
    });

    // Broadcast to all emergency responders
    const responders = await prisma.volunteer.findMany({
      where: {
        eventId,
        role: { in: ['security', 'medical', 'coordinator'] },
        status: 'ACTIVE'
      }
    });

    await Promise.all(
      responders.map((responder: any) =>
        prisma.notification.create({
          data: {
            userId: responder.email,
            eventId,
            type: 'EMERGENCY',
            priority: 'URGENT',
            title: 'ðŸš¨ SOS ALERT',
            message: `${issueType}: ${description} - Location: ${JSON.stringify(location)}`,
            channels: ['push', 'sms'],
            actionUrl: `/sos/${sosRequest.id}`
          }
        })
      )
    );

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: attendeeId,
        eventId,
        type: 'EMERGENCY',
        priority: 'URGENT',
        title: 'Emergency Response Activated',
        message: 'Emergency services have been alerted. Stay calm, help is on the way.',
        channels: ['push']
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: 'sos_alert',
        description: `SOS Alert: ${issueType} - ${description}`,
        userId: attendeeId,
        entityType: 'sos_request',
        entityId: sosRequest.id
      }
    });

    res.json({
      success: true,
      sosRequest,
      message: 'Emergency alert sent. Help is on the way!',
      estimatedArrival: '2-5 minutes'
    });
  } catch (error: any) {
    console.error('Error creating SOS alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create SOS alert',
      message: error.message
    });
  }
});

/**
 * GET /api/help/requests/:requestId/status
 * Get help request status
 */
router.get('/requests/:requestId/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: requestId }
    });

    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        error: 'Help request not found'
      });
    }

    // Get assigned volunteer info if available
    let assignedVolunteer = null;
    if (helpRequest.assignedVolunteer) {
      assignedVolunteer = await prisma.volunteer.findUnique({
        where: { id: helpRequest.assignedVolunteer },
        select: {
          name: true,
          role: true,
          phone: true,
          lastLocation: true,
          locationCoords: true
        }
      });
    }

    res.json({
      success: true,
      helpRequest,
      assignedVolunteer,
      updates: helpRequest.updates
    });
  } catch (error: any) {
    console.error('Error fetching help request status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch help request status',
      message: error.message
    });
  }
});

/**
 * PATCH /api/help/requests/:requestId
 * Update help request (for volunteers/organizers)
 */
router.patch('/requests/:requestId', authenticate, authorize(['ORGANIZER', 'SECURITY', 'MEDICAL', 'VOLUNTEER']), async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, resolutionNotes, update } = req.body;

    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: requestId }
    });

    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        error: 'Help request not found'
      });
    }

    // Add update to history
    const updates = [...(helpRequest.updates as any[])];
    if (update) {
      updates.push({
        timestamp: new Date().toISOString(),
        message: update,
        updatedBy: req.body.updatedBy || 'System'
      });
    }

    const updatedRequest = await prisma.helpRequest.update({
      where: { id: requestId },
      data: {
        status: status || helpRequest.status,
        resolutionNotes,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
        updates
      }
    });

    // Notify requester of update
    if (update || status === 'RESOLVED') {
      await prisma.notification.create({
        data: {
          userId: helpRequest.requesterId,
          eventId: helpRequest.eventId,
          type: 'HELP_REQUEST',
          priority: 'MEDIUM',
          title: status === 'RESOLVED' ? 'Help Request Resolved' : 'Help Request Update',
          message: update || `Your request has been ${status?.toLowerCase()}`,
          channels: ['push']
        }
      });
    }

    res.json({
      success: true,
      helpRequest: updatedRequest,
      message: 'Help request updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating help request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update help request',
      message: error.message
    });
  }
});

/**
 * GET /api/help/event/:eventId/requests
 * Get all help requests for an event (organizers only)
 */
router.get('/event/:eventId/requests', authenticate, authorize(['ORGANIZER', 'SECURITY', 'MEDICAL']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { type, status, priority } = req.query;

    const where: any = { eventId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const requests = await prisma.helpRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const stats = {
      total: requests.length,
      byStatus: requests.reduce((acc: Record<string, number>, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: requests.reduce((acc: Record<string, number>, r: any) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: requests.reduce((acc: Record<string, number>, r: any) => {
        acc[r.priority] = (acc[r.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      requests,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch help requests',
      message: error.message
    });
  }
});

export default router;
