/**
 * Incident Service
 * Handles all incident-related API calls and real-time updates
 */

import { apiClient } from './api.client';
import { wsService } from './websocket.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Incident {
  id: string;
  eventId: string;
  type: 'MEDICAL' | 'SECURITY' | 'CROWD' | 'SAFETY' | 'LOST_FOUND' | 'FIRE' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  location: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  detectedBy?: string;
  reportedBy?: string;
  assignedTo?: string[];
  confidence?: number;
  aiSummary?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  resolvedAt?: string | Date;
  responders?: any[];
}

class IncidentService {
  /**
   * Get all incidents with optional filtering
   */
  async getIncidents(params?: {
    eventId?: string;
    status?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  }) {
    return await apiClient.get<Incident[]>(API_ENDPOINTS.incidents.list, params);
  }

  /**
   * Get incidents for a specific event
   */
  async getEventIncidents(eventId: string) {
    return await apiClient.get<Incident[]>(API_ENDPOINTS.incidents.byEvent(eventId));
  }

  /**
   * Get a single incident by ID
   */
  async getIncident(id: string) {
    return await apiClient.get<Incident>(API_ENDPOINTS.incidents.get(id));
  }

  /**
   * Create a new incident
   */
  async createIncident(incidentData: Partial<Incident>) {
    return await apiClient.post<Incident>(API_ENDPOINTS.incidents.create, incidentData);
  }

  /**
   * Update an existing incident
   */
  async updateIncident(id: string, incidentData: Partial<Incident>) {
    return await apiClient.put<Incident>(API_ENDPOINTS.incidents.update(id), incidentData);
  }

  /**
   * Assign responders to an incident
   */
  async assignResponders(id: string, responderIds: string[]) {
    return await apiClient.post(API_ENDPOINTS.incidents.assign(id), { responderIds });
  }

  /**
   * Resolve an incident
   */
  async resolveIncident(id: string, resolution?: string) {
    return await apiClient.post(API_ENDPOINTS.incidents.resolve(id), { resolution });
  }

  /**
   * Delete an incident
   */
  async deleteIncident(id: string) {
    return await apiClient.delete(API_ENDPOINTS.incidents.delete(id));
  }

  /**
   * Subscribe to real-time incident updates
   */
  subscribeToIncidents(eventId: string, callback: (incident: Incident) => void) {
    wsService.joinEvent(eventId);
    wsService.on('incident:created', callback);
    wsService.on('incident:updated', callback);
    return () => {
      wsService.off('incident:created', callback);
      wsService.off('incident:updated', callback);
    };
  }

  /**
   * Subscribe to incident creation
   */
  onIncidentCreated(eventId: string, callback: (incident: Incident) => void) {
    wsService.joinEvent(eventId);
    wsService.on('incident:created', callback);
    return () => {
      wsService.off('incident:created', callback);
    };
  }

  /**
   * Subscribe to incident updates
   */
  onIncidentUpdated(callback: (incident: Incident) => void) {
    wsService.on('incident:updated', callback);
    return () => {
      wsService.off('incident:updated', callback);
    };
  }

  /**
   * Subscribe to incident resolution
   */
  onIncidentResolved(callback: (incident: Incident) => void) {
    wsService.on('incident:resolved', callback);
    return () => {
      wsService.off('incident:resolved', callback);
    };
  }
}

export const incidentService = new IncidentService();
