/**
 * Dispatch Service
 * Handles dispatch, team management, and volunteer coordination
 */

import { apiClient } from './api.client';
import { wsService } from './websocket.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Team {
  id: string;
  name: string;
  type: 'MEDICAL' | 'SECURITY' | 'EMERGENCY' | 'SUPPORT';
  members: string[];
  status: 'AVAILABLE' | 'DEPLOYED' | 'OFFLINE';
  currentLocation?: string;
  assignedIncident?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  skills: string[];
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  currentLocation?: string;
  assignedTask?: string;
  eventId?: string;
}

export interface DispatchAssignment {
  teamId?: string;
  volunteerId?: string;
  incidentId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedArrival?: number;
}

class DispatchService {
  /**
   * Get all teams
   */
  async getTeams(eventId?: string) {
    return await apiClient.get<Team[]>(API_ENDPOINTS.dispatch.teams, { eventId });
  }

  /**
   * Get all volunteers
   */
  async getVolunteers(eventId?: string) {
    return await apiClient.get<Volunteer[]>(API_ENDPOINTS.dispatch.volunteers, { eventId });
  }

  /**
   * Assign team or volunteer to incident
   */
  async assignToIncident(assignment: DispatchAssignment) {
    return await apiClient.post(API_ENDPOINTS.dispatch.assign, assignment);
  }

  /**
   * Get dispatch status for event
   */
  async getDispatchStatus(eventId: string) {
    return await apiClient.get(API_ENDPOINTS.dispatch.status, { eventId });
  }

  /**
   * Subscribe to dispatch updates
   */
  subscribeToDispatch(eventId: string, callback: (data: any) => void) {
    wsService.joinEvent(eventId);
    wsService.on('dispatch:updated', callback);
    wsService.on('team:updated', callback);
    wsService.on('volunteer:updated', callback);
    return () => {
      wsService.off('dispatch:updated', callback);
      wsService.off('team:updated', callback);
      wsService.off('volunteer:updated', callback);
    };
  }
}

export const dispatchService = new DispatchService();
