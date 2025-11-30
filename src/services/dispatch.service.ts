import { apiClient } from '@/lib/api-client';

interface DispatchRequest {
  eventId: string;
  incidentId?: string;
  type: 'MEDICAL' | 'SECURITY' | 'FIRE' | 'EVACUATION' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: { lat: number; lon: number };
  description: string;
  requiredSkills?: string[];
  requiredEquipment?: string[];
  estimatedDuration?: number;
  zone?: string;
}

interface Dispatch {
  id: string;
  eventId: string;
  incidentId?: string;
  type: string;
  priority: string;
  status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'COMPLETED' | 'CANCELLED';
  location: { lat: number; lon: number };
  description: string;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  assignedResponders: Array<{
    responderId: string;
    responderName: string;
    status: string;
    eta?: number;
  }>;
  completedAt?: Date;
  resolution?: string;
}

interface ApproveDispatchRequest {
  approvedBy: string;
  responderIds: string[];
  notes?: string;
}

interface UpdateStatusRequest {
  status: Dispatch['status'];
  notes?: string;
  resolution?: string;
}

class DispatchService {
  /**
   * Create dispatch request
   */
  async createDispatch(request: DispatchRequest): Promise<Dispatch> {
    const response = await apiClient.post<{ success: boolean; data: Dispatch }>(
      '/dispatch/create',
      request
    );
    return response.data;
  }

  /**
   * Approve dispatch request
   */
  async approveDispatch(id: string, data: ApproveDispatchRequest): Promise<Dispatch> {
    const response = await apiClient.put<{ success: boolean; data: Dispatch }>(
      `/dispatch/${id}/approve`,
      data
    );
    return response.data;
  }

  /**
   * Update dispatch status
   */
  async updateStatus(id: string, data: UpdateStatusRequest): Promise<Dispatch> {
    const response = await apiClient.put<{ success: boolean; data: Dispatch }>(
      `/dispatch/${id}/status`,
      data
    );
    return response.data;
  }

  /**
   * Get dispatches for event
   */
  async getEventDispatches(eventId: string, filters?: {
    status?: string;
    priority?: string;
  }): Promise<Dispatch[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await apiClient.get<{ success: boolean; data: Dispatch[] }>(
      `/dispatch/${eventId}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get active dispatches
   */
  async getActiveDispatches(eventId: string): Promise<Dispatch[]> {
    const response = await apiClient.get<{ success: boolean; data: Dispatch[] }>(
      `/dispatch/${eventId}/active`
    );
    return response.data;
  }

  /**
   * Get dispatch by ID
   */
  async getDispatch(id: string): Promise<Dispatch> {
    const response = await apiClient.get<{ success: boolean; data: Dispatch }>(
      `/dispatch/${id}`
    );
    return response.data;
  }

  /**
   * Cancel dispatch
   */
  async cancelDispatch(id: string, reason?: string): Promise<Dispatch> {
    const response = await apiClient.put<{ success: boolean; data: Dispatch }>(
      `/dispatch/${id}/status`,
      {
        status: 'CANCELLED',
        notes: reason,
      }
    );
    return response.data;
  }

  /**
   * Get dispatch stats
   */
  async getStats(eventId: string): Promise<{
    total: number;
    pending: number;
    active: number;
    completed: number;
    avgResponseTime: number;
    byType: Record<string, number>;
  }> {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/dispatch/${eventId}/stats`
    );
    return response.data;
  }
}

export const dispatchService = new DispatchService();
export type { DispatchRequest, Dispatch, ApproveDispatchRequest, UpdateStatusRequest };
