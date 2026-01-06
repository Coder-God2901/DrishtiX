/**
 * Ticket Management Service
 * Handles ticket purchase, cancellation, transfer, and refund operations
 */

import { apiClient, APIResponse } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

export interface Ticket {
  id: string;
  eventId: string;
  eventName: string; // Event name for display
  eventDate: string; // Event date
  eventTime: string; // Event time
  venue: string; // Event venue
  userId: string;
  type: 'GENERAL' | 'VIP' | 'EARLY_BIRD' | 'GROUP' | 'STUDENT' | 'SENIOR';
  status: 'ACTIVE' | 'CANCELLED' | 'USED' | 'REFUNDED' | 'EXPIRED';
  tier: 'STANDARD' | 'PREMIUM' | 'PLATINUM';
  price: number;
  quantity: number; // Number of tickets
  totalPaid: number; // Total amount paid
  purchaseDate: string | Date;
  validFrom?: string | Date;
  validUntil?: string | Date;
  qrCode?: string;
  seatNumber?: string;
  seatNumbers?: string[]; // Multiple seat numbers
  section?: string;
  seatSection?: string; // Seat section
  entryGate?: string; // Entry gate information
  holderName: string;
  holderEmail: string;
  holderPhone?: string;
  attendeeNames?: string[]; // Names of all attendees
  specialRequirements?: string[]; // Special requirements
  additionalInfo?: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TicketPurchaseRequest {
  eventId: string;
  userId: string;
  type: Ticket['type'];
  tier?: Ticket['tier'];
  quantity?: number;
  holderName: string;
  holderEmail: string;
  holderPhone?: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NET_BANKING' | 'WALLET';
  promoCode?: string;
}

export interface TicketTransferRequest {
  ticketId: string;
  fromUserId: string;
  toUserId: string;
  toEmail: string;
  toName: string;
  reason?: string;
}

export interface TicketStats {
  totalTickets: number;
  activeTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  refundedTickets: number;
  totalRevenue: number;
  averagePrice: number;
}

class TicketService {
  /**
   * Get all tickets for a user
   */
  async getUserTickets(userId: string, filters?: {
    eventId?: string;
    status?: Ticket['status'];
    type?: Ticket['type'];
  }): Promise<APIResponse<Ticket[]>> {
    const params = new URLSearchParams();
    if (filters?.eventId) params.append('eventId', filters.eventId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);

    const queryString = params.toString();
    const endpoint = `${API_ENDPOINTS.tickets.byUser(userId)}${queryString ? `?${queryString}` : ''}`;

    return await apiClient.get<Ticket[]>(endpoint);
  }

  /**
   * Get all tickets for an event
   */
  async getEventTickets(eventId: string): Promise<APIResponse<Ticket[]>> {
    return await apiClient.get<Ticket[]>(
      API_ENDPOINTS.tickets.byEvent(eventId)
    );
  }

  /**
   * Get a single ticket by ID
   */
  async getTicket(ticketId: string): Promise<APIResponse<Ticket>> {
    return await apiClient.get<Ticket>(
      API_ENDPOINTS.tickets.get(ticketId)
    );
  }

  /**
   * Purchase a new ticket
   */
  async purchaseTicket(purchaseData: TicketPurchaseRequest): Promise<APIResponse<Ticket>> {
    return await apiClient.post<Ticket>(
      API_ENDPOINTS.tickets.purchase,
      purchaseData
    );
  }

  /**
   * Cancel a ticket
   */
  async cancelTicket(ticketId: string, reason?: string): Promise<APIResponse<Ticket>> {
    return await apiClient.post<Ticket>(
      API_ENDPOINTS.tickets.cancel(ticketId),
      { reason }
    );
  }

  /**
   * Request a refund for a ticket
   */
  async refundTicket(ticketId: string, reason?: string): Promise<APIResponse<Ticket>> {
    return await apiClient.post<Ticket>(
      API_ENDPOINTS.tickets.refund(ticketId),
      { reason }
    );
  }

  /**
   * Transfer a ticket to another user
   */
  async transferTicket(transferData: TicketTransferRequest): Promise<APIResponse<Ticket>> {
    return await apiClient.post<Ticket>(
      API_ENDPOINTS.tickets.transfer(transferData.ticketId),
      transferData
    );
  }

  /**
   * Update ticket information
   */
  async updateTicket(
    ticketId: string,
    updates: Partial<Pick<Ticket, 'holderName' | 'holderEmail' | 'holderPhone' | 'additionalInfo'>>
  ): Promise<APIResponse<Ticket>> {
    return await apiClient.put<Ticket>(
      API_ENDPOINTS.tickets.get(ticketId),
      updates
    );
  }

  /**
   * Validate a ticket (e.g., at entry gate)
   */
  async validateTicket(ticketId: string, location?: string): Promise<APIResponse<{
    valid: boolean;
    ticket?: Ticket;
    reason?: string;
  }>> {
    return await apiClient.post(
      `/tickets/${ticketId}/validate`,
      { location }
    );
  }

  /**
   * Get ticket statistics for an event
   */
  async getTicketStats(eventId: string): Promise<APIResponse<TicketStats>> {
    return await apiClient.get<TicketStats>(
      `${API_ENDPOINTS.tickets.byEvent(eventId)}/stats`
    );
  }

  /**
   * Download ticket as PDF
   */
  async downloadTicket(ticketId: string): Promise<APIResponse<Blob>> {
    return await apiClient.get<Blob>(
      `/tickets/${ticketId}/download`,
      { responseType: 'blob' }
    );
  }

  /**
   * Resend ticket email
   */
  async resendTicketEmail(ticketId: string, email?: string): Promise<APIResponse<void>> {
    return await apiClient.post(
      `/tickets/${ticketId}/resend`,
      { email }
    );
  }

  /**
   * Search tickets
   */
  async searchTickets(query: string, filters?: {
    eventId?: string;
    status?: Ticket['status'];
  }): Promise<APIResponse<Ticket[]>> {
    const params = new URLSearchParams({ query });
    if (filters?.eventId) params.append('eventId', filters.eventId);
    if (filters?.status) params.append('status', filters.status);

    return await apiClient.get<Ticket[]>(
      `/tickets/search?${params.toString()}`
    );
  }

  /**
   * Get available ticket types for an event
   */
  async getAvailableTicketTypes(eventId: string): Promise<APIResponse<Array<{
    type: Ticket['type'];
    tier: Ticket['tier'];
    price: number;
    available: number;
    total: number;
    description?: string;
  }>>> {
    return await apiClient.get(
      `${API_ENDPOINTS.tickets.byEvent(eventId)}/types`
    );
  }
}

export const ticketService = new TicketService();
