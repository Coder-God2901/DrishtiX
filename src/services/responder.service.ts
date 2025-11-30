import { apiClient } from '@/lib/api-client';

interface Responder {
  id: string;
  name: string;
  type: 'MEDICAL' | 'SECURITY' | 'FIRE' | 'POLICE' | 'EVACUATION' | 'COORDINATOR';
  status: 'AVAILABLE' | 'DISPATCHED' | 'RESPONDING' | 'ON_SCENE' | 'RETURNING' | 'OFFLINE';
  location?: { lat: number; lon: number };
  skills: string[];
  equipment: string[];
  currentIncidentId?: string;
  assignedAt?: Date;
  eta?: number;
  phone?: string;
  email?: string;
}

interface CreateResponderRequest {
  name: string;
  type: Responder['type'];
  skills?: string[];
  equipment?: string[];
  phone?: string;
  email?: string;
  location?: { lat: number; lon: number };
}

interface UpdateLocationRequest {
  location: { lat: number; lon: number };
}

interface AssignResponderRequest {
  incidentId: string;
  eta?: number;
}

class ResponderService {
  /**
   * Get all responders
   */
  async getResponders(filters?: {
    status?: Responder['status'];
    type?: Responder['type'];
    available?: boolean;
  }): Promise<Responder[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.available !== undefined) params.append('available', String(filters.available));

    const response = await apiClient.get<{ success: boolean; data: Responder[] }>(
      `/responders?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get single responder
   */
  async getResponder(id: string): Promise<Responder> {
    const response = await apiClient.get<{ success: boolean; data: Responder }>(
      `/responders/${id}`
    );
    return response.data;
  }

  /**
   * Create responder
   */
  async createResponder(data: CreateResponderRequest): Promise<Responder> {
    const response = await apiClient.post<{ success: boolean; data: Responder }>(
      '/responders',
      data
    );
    return response.data;
  }

  /**
   * Update responder
   */
  async updateResponder(id: string, updates: Partial<CreateResponderRequest>): Promise<Responder> {
    const response = await apiClient.put<{ success: boolean; data: Responder }>(
      `/responders/${id}`,
      updates
    );
    return response.data;
  }

  /**
   * Delete responder
   */
  async deleteResponder(id: string): Promise<void> {
    await apiClient.delete(`/responders/${id}`);
  }

  /**
   * Update responder location
   */
  async updateLocation(id: string, data: UpdateLocationRequest): Promise<Responder> {
    const response = await apiClient.post<{ success: boolean; data: Responder }>(
      `/responders/${id}/location`,
      data
    );
    return response.data;
  }

  /**
   * Assign responder to incident
   */
  async assignToIncident(id: string, data: AssignResponderRequest): Promise<Responder> {
    const response = await apiClient.post<{ success: boolean; data: Responder }>(
      `/responders/${id}/assign`,
      data
    );
    return response.data;
  }

  /**
   * Mark responder as available
   */
  async markAvailable(id: string): Promise<Responder> {
    const response = await apiClient.post<{ success: boolean; data: Responder }>(
      `/responders/${id}/available`
    );
    return response.data;
  }

  /**
   * Get available responders near location
   */
  async getNearbyAvailable(location: { lat: number; lon: number }, radius: number = 5000): Promise<Responder[]> {
    const response = await apiClient.get<{ success: boolean; data: Responder[] }>(
      `/responders/nearby?lat=${location.lat}&lon=${location.lon}&radius=${radius}`
    );
    return response.data;
  }

  /**
   * Get responder stats
   */
  async getStats(): Promise<{
    total: number;
    available: number;
    dispatched: number;
    onScene: number;
    byType: Record<string, number>;
  }> {
    const response = await apiClient.get<{ success: boolean; data: any }>('/responders/stats');
    return response.data;
  }
}

export const responderService = new ResponderService();
export type { Responder, CreateResponderRequest, UpdateLocationRequest, AssignResponderRequest };
