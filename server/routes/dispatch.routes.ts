/**
 * DrishtiX Dispatch API Routes
 * Automated emergency responder dispatch and routing
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { agentBuilderService } from '../services/agent-builder.service';
import { pubSubService } from '../services/pubsub.service';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { auditLoggerService } from '../services/audit-logger.service';

const router = Router();

/**
 * POST /api/dispatch/create
 * Create and execute dispatch plan
 */
router.post('/create', authenticate, requireRoles(['ADMIN', 'SECURITY', 'ORGANIZER']), async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      incidentId,
      alertId,
      incidentType,
      location,
      severity,
      description,
      estimatedCrowd,
    } = req.body;

    if (!eventId || !incidentType || !location || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: eventId, incidentType, location, severity',
      });
    }

    // Get available responders (mock for now - should query responder database)
    const availableResponders = await getAvailableResponders(eventId);

    // Create dispatch plan using Agent Builder
    const dispatchPlan = await agentBuilderService.createDispatchPlan(
      {
        eventId,
        incidentId,
        alertId,
        incidentType,
        location,
        severity,
        description,
        estimatedCrowd,
        timestamp: new Date(),
      },
      availableResponders
    );

    // Save dispatch record
    const dispatch = await prisma.dispatch.create({
      data: {
        eventId,
        incidentId,
        alertId,
        type: incidentType,
        location: location as any,
        severity,
        description,
        status: dispatchPlan.status,
        assignedResponders: dispatchPlan.assignedResponders as any,
        estimatedResponseTime: dispatchPlan.estimatedResponseTime,
        routes: dispatchPlan.routes as any,
        requiresApproval: dispatchPlan.requiresHumanApproval,
      },
    });

    // Publish to Pub/Sub
    await pubSubService.publishDispatch({
      dispatchId: dispatch.id,
      eventId,
      assignedResponders: dispatchPlan.assignedResponders,
      timestamp: new Date(),
    });

    // Audit log
    await auditLoggerService.logFromRequest(
      req,
      'DISPATCH_CREATE',
      'Dispatch',
      dispatch.id,
      { incidentType, severity, location },
      { requiresApproval: dispatchPlan.requiresHumanApproval }
    );

    res.json({
      success: true,
      data: {
        dispatch,
        plan: dispatchPlan,
      },
    });
  } catch (error) {
    console.error('Create dispatch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dispatch',
    });
  }
});

/**
 * PUT /api/dispatch/:id/approve
 * Approve pending dispatch
 */
router.put('/:id/approve', authenticate, requireRoles(['ADMIN', 'SECURITY']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const dispatch = await prisma.dispatch.update({
      where: { id },
      data: {
        status: 'DISPATCHED',
        approvedAt: new Date(),
        approvedBy,
      },
    });

    // Notify responders
    await pubSubService.publishDispatch({
      dispatchId: id,
      status: 'DISPATCHED',
      timestamp: new Date(),
    });

    // Audit log
    await auditLoggerService.logFromRequest(
      req,
      'DISPATCH_APPROVE',
      'Dispatch',
      id,
      { status: 'DISPATCHED' },
      { approvedBy }
    );

    res.json({
      success: true,
      data: dispatch,
    });
  } catch (error) {
    console.error('Approve dispatch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve dispatch',
    });
  }
});

/**
 * PUT /api/dispatch/:id/status
 * Update dispatch status
 */
router.put('/:id/status', authenticate, requireRoles(['ADMIN', 'SECURITY', 'MEDICAL', 'LOGISTICS']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, responderId, notes } = req.body;

    const dispatch = await prisma.dispatch.update({
      where: { id },
      data: {
        status,
        ...(responderId && { currentResponderId: responderId }),
        ...(status === 'EN_ROUTE' && { dispatchedAt: new Date() }),
        ...(status === 'ARRIVED' && { arrivedAt: new Date() }),
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
        ...(notes && { notes }),
      },
    });

    res.json({
      success: true,
      data: dispatch,
    });
  } catch (error) {
    console.error('Update dispatch status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dispatch status',
    });
  }
});

/**
 * GET /api/dispatch/:eventId
 * Get all dispatches for an event
 */
router.get('/:eventId', authenticate, requireRoles(['ADMIN', 'SECURITY', 'LOGISTICS', 'VIEWER']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status, limit = '50' } = req.query;

    const where: any = { eventId };
    if (status) {
      where.status = status;
    }

    const dispatches = await prisma.dispatch.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: dispatches,
      total: dispatches.length,
    });
  } catch (error) {
    console.error('Get dispatches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dispatches',
    });
  }
});

/**
 * GET /api/dispatch/:eventId/active
 * Get active dispatches
 */
router.get('/:eventId/active', authenticate, requireRoles(['ADMIN', 'SECURITY', 'LOGISTICS', 'VIEWER']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const dispatches = await prisma.dispatch.findMany({
      where: {
        eventId,
        status: {
          in: ['PENDING', 'APPROVED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: dispatches,
      total: dispatches.length,
    });
  } catch (error) {
    console.error('Get active dispatches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active dispatches',
    });
  }
});

/**
 * Helper: Get available responders
 */
async function getAvailableResponders(eventId: string): Promise<any[]> {
  // Mock responders - in production, query from responder database
  return [
    {
      id: 'resp-001',
      type: 'POLICE',
      name: 'Unit Alpha-1',
      currentLocation: { lat: 28.6139, lon: 77.2090 },
      status: 'AVAILABLE',
      specializations: ['Crowd Control', 'First Response'],
    },
    {
      id: 'resp-002',
      type: 'FIRE',
      name: 'Fire Engine 5',
      currentLocation: { lat: 28.6129, lon: 77.2295 },
      status: 'AVAILABLE',
      specializations: ['Fire Suppression', 'Rescue'],
    },
    {
      id: 'resp-003',
      type: 'AMBULANCE',
      name: 'Ambulance 12',
      currentLocation: { lat: 28.6169, lon: 77.2085 },
      status: 'AVAILABLE',
      specializations: ['Emergency Medical'],
    },
    {
      id: 'resp-004',
      type: 'MEDICAL',
      name: 'Medical Team 3',
      currentLocation: { lat: 28.6142, lon: 77.2100 },
      status: 'AVAILABLE',
      specializations: ['Trauma Care', 'Triage'],
    },
    {
      id: 'resp-005',
      type: 'SECURITY',
      name: 'Security Squad B',
      currentLocation: { lat: 28.6135, lon: 77.2088 },
      status: 'AVAILABLE',
      specializations: ['Crowd Management'],
    },
  ];
}

export default router;
