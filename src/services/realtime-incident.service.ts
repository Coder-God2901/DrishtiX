/**
 * Real-time Incident Service
 * Connects to backend API and WebSocket for live incident updates
 */

import { apiClient } from '../lib/api-client';
import { socketService } from './socket.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface Incident {
  id: string;
  eventId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'RESPONDING' | 'RESOLVED';
  location: { lat: number; lon: number };
  description: string;
  detectedBy: string;
  confidence?: number;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
}

class IncidentService {
  /**
   * Get all incidents for an event
   */
  async getIncidents(params?: {
    eventId?: string;
    status?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  }): Promise<Incident[]> {
    const queryParams = new URLSearchParams();
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await apiClient.get<ApiResponse<Incident[]>>(
      `/incidents?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Get single incident by ID
   */
  async getIncidentById(id: string): Promise<Incident> {
    const response = await apiClient.get<ApiResponse<Incident>>(`/incidents/${id}`);
    return response.data;
  }

  /**
   * Create new incident
   */
  async createIncident(incident: Partial<Incident>): Promise<Incident> {
    const response = await apiClient.post<ApiResponse<Incident>>('/incidents', incident);
    return response.data;
  }

  /**
   * Update incident
   */
  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident> {
    const response = await apiClient.put<ApiResponse<Incident>>(`/incidents/${id}`, updates);
    return response.data;
  }

  /**
   * Resolve incident
   */
  async resolveIncident(id: string, resolution: string, resolvedBy: string): Promise<Incident> {
    const response = await apiClient.post<ApiResponse<Incident>>(`/incidents/${id}/resolve`, {
      resolution,
      resolvedBy,
    });
    return response.data;
  }

  /**
   * Delete incident
   */
  async deleteIncident(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/incidents/${id}`);
  }

  /**
   * Subscribe to real-time incident updates for an event
   */
  subscribeToIncidents(eventId: string, callbacks: {
    onCreated?: (incident: Incident) => void;
    onUpdated?: (incident: Incident) => void;
    onResolved?: (incident: Incident) => void;
    onDeleted?: (data: { id: string }) => void;
  }) {
    socketService.emit('subscribe:incidents', eventId);

    if (callbacks.onCreated) {
      socketService.on('incident:created', callbacks.onCreated);
    }
    newFunction();

    function newFunction() {
      if (callbacks.onUpdated) {
        socketService.on('incident:updated', callbacks.onUpdated);
      }
      if (callbacks.onResolved) {
        socketService.on('incident:resolved', callbacks.onResolved);
      }
      if (callbacks.onDeleted) {
        socketService.on('incident:deleted', callbacks.onDeleted);
      }
    }
  }

  /**
   * Unsubscribe from incident updates
   */
  unsubscribeFromIncidents() {
    socketService.off('incident:created');
    socketService.off('incident:updated');
    socketService.off('incident:resolved');
    socketService.off('incident:deleted');
  }
}

export const incidentService = new IncidentService();
