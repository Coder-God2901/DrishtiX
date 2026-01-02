/**
 * Ticket Management Routes
 * Handles ticket purchase, validation, cancellation, refund, and transfer
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

const router = Router();

/**
 * GET /api/tickets/user/:userId
 * Get all tickets for a user
 */
router.get('/user/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const tickets = await prisma.ticket.findMany({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'USED']
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    });

    res.json({
      success: true,
      tickets
    });
  } catch (error: any) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
      message: error.message
    });
  }
});

/**
 * GET /api/tickets/:id
 * Get ticket details
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket',
      message: error.message
    });
  }
});

/**
 * POST /api/tickets/purchase
 * Purchase tickets
 */
router.post('/purchase', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      eventName,
      eventDate,
      eventTime,
      venue,
      userId,
      userName,
      userEmail,
      userPhone,
      quantity,
      ticketType,
      totalPaid,
      currency = 'INR',
      entryGate,
      seatSection,
      seatNumbers,
      attendeeNames,
      specialRequirements
    } = req.body;

    // Generate unique QR code
    const qrData = uuidv4();
    const qrCode = await QRCode.toDataURL(qrData);

    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        eventName,
        eventDate,
        eventTime,
        venue,
        userId,
        userName,
        userEmail,
        userPhone,
        quantity,
        ticketType,
        totalPaid,
        currency,
        entryGate,
        qrCode,
        seatSection,
        seatNumbers: seatNumbers || [],
        attendeeNames: attendeeNames || [],
        specialRequirements: specialRequirements || []
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        eventId,
        type: 'TICKET',
        priority: 'MEDIUM',
        title: 'Ticket Purchase Successful',
        message: `Your ticket for ${eventName} has been confirmed!`,
        channels: ['push', 'email'],
        isSent: true,
        sentAt: new Date()
      }
    });

    res.json({
      success: true,
      ticket
    });
  } catch (error: any) {
    console.error('Error purchasing ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase ticket',
      message: error.message
    });
  }
});

/**
 * POST /api/tickets/:id/validate
 * Validate ticket at gate (for organizers/security)
 */
router.post('/:id/validate', authenticate, authorize(['ORGANIZER', 'SECURITY']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { validatedBy } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    if (ticket.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: `Cannot validate ticket with status: ${ticket.status}`
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        validatedBy
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId: ticket.eventId,
        action: 'ticket_validated',
        description: `Ticket validated at gate ${ticket.entryGate}`,
        userId: validatedBy,
        entityType: 'ticket',
        entityId: id
      }
    });

    res.json({
      success: true,
      ticket: updatedTicket,
      message: 'Ticket validated successfully'
    });
  } catch (error: any) {
    console.error('Error validating ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate ticket',
      message: error.message
    });
  }
});

/**
 * POST /api/tickets/:id/cancel
 * Cancel ticket
 */
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    if (ticket.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Only active tickets can be cancelled'
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        eventId: ticket.eventId,
        type: 'TICKET',
        priority: 'MEDIUM',
        title: 'Ticket Cancelled',
        message: `Your ticket for ${ticket.eventName} has been cancelled.`,
        channels: ['push', 'email']
      }
    });

    res.json({
      success: true,
      ticket: updatedTicket,
      message: 'Ticket cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel ticket',
      message: error.message
    });
  }
});

/**
 * POST /api/tickets/:id/refund
 * Process ticket refund
 */
router.post('/:id/refund', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { refundAmount, refundStatus = 'PENDING' } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    if (ticket.status !== 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Only cancelled tickets can be refunded'
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        refundAmount: refundAmount || ticket.totalPaid,
        refundStatus,
        refundedAt: new Date()
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        eventId: ticket.eventId,
        type: 'TICKET',
        priority: 'HIGH',
        title: 'Refund Processed',
        message: `Refund of ${refundAmount || ticket.totalPaid} ${ticket.currency} has been initiated.`,
        channels: ['push', 'email', 'sms']
      }
    });

    res.json({
      success: true,
      ticket: updatedTicket,
      message: 'Refund processed successfully'
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
      message: error.message
    });
  }
});

/**
 * POST /api/tickets/:id/transfer
 * Transfer ticket to another user
 */
router.post('/:id/transfer', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { transferToEmail, transferToName } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    if (ticket.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Only active tickets can be transferred'
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'TRANSFERRED',
        transferredTo: transferToEmail,
        transferredAt: new Date()
      }
    });

    // Create new ticket for recipient
    const qrData = uuidv4();
    const qrCode = await QRCode.toDataURL(qrData);

    const newTicket = await prisma.ticket.create({
      data: {
        ...ticket,
        id: undefined,
        userId: transferToEmail,
        userName: transferToName,
        userEmail: transferToEmail,
        qrCode,
        status: 'ACTIVE',
        purchaseDate: new Date()
      } as any
    });

    // Create notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: ticket.userId,
          eventId: ticket.eventId,
          type: 'TICKET',
          priority: 'MEDIUM',
          title: 'Ticket Transferred',
          message: `Your ticket has been transferred to ${transferToName}`,
          channels: ['push', 'email']
        },
        {
          userId: transferToEmail,
          eventId: ticket.eventId,
          type: 'TICKET',
          priority: 'HIGH',
          title: 'Ticket Received',
          message: `You have received a ticket for ${ticket.eventName}`,
          channels: ['push', 'email']
        }
      ]
    });

    res.json({
      success: true,
      oldTicket: updatedTicket,
      newTicket,
      message: 'Ticket transferred successfully'
    });
  } catch (error: any) {
    console.error('Error transferring ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer ticket',
      message: error.message
    });
  }
});

/**
 * GET /api/tickets/event/:eventId/stats
 * Get ticket statistics for an event (organizers only)
 */
router.get('/event/:eventId/stats', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const stats = await prisma.ticket.groupBy({
      by: ['status'],
      where: { eventId },
      _count: true,
      _sum: {
        totalPaid: true,
        quantity: true
      }
    });

    const totalRevenue = stats.reduce((sum: number, s: any) => sum + (s._sum.totalPaid || 0), 0);
    const totalTickets = stats.reduce((sum: number, s: any) => sum + (s._sum.quantity || 0), 0);

    res.json({
      success: true,
      stats,
      summary: {
        totalRevenue,
        totalTickets,
        byStatus: stats.reduce((acc: Record<string, number>, s: any) => {
          acc[s.status] = s._count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error: any) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket stats',
      message: error.message
    });
  }
});

export default router;
