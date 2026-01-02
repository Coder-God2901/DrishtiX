/**
 * Alert Service
 * Handles all alert-related API calls and real-time updates
 */

import { apiClient } from './api.client';
import { wsService } from './websocket.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Alert {
  id: string;
  eventId: string;
  type: 'CROWD_SURGE' | 'EMERGENCY' | 'WEATHER' | 'SECURITY' | 'MEDICAL' | 'INFO' | 'WARNING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  location?: string;
  affectedAreas?: string[];
  targetAudience: 'ALL' | 'ORGANIZERS' | 'RESPONDERS' | 'ATTENDEES' | 'VOLUNTEERS';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  expiresAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

class AlertService {
  /**
   * Get all alerts with optional filtering
   */
  async getAlerts(params?: {
    eventId?: string;
    type?: string;
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return await apiClient.get<Alert[]>(API_ENDPOINTS.alerts.list, params);
  }

  /**
   * Get alerts for a specific event
   */
  async getEventAlerts(eventId: string) {
    return await apiClient.get<Alert[]>(API_ENDPOINTS.alerts.byEvent(eventId));
  }

  /**
   * Get a single alert by ID
   */
  async getAlert(id: string) {
    return await apiClient.get<Alert>(API_ENDPOINTS.alerts.get(id));
  }

  /**
   * Create a new alert
   */
  async createAlert(alertData: Partial<Alert>) {
    return await apiClient.post<Alert>(API_ENDPOINTS.alerts.create, alertData);
  }

  /**
   * Update an existing alert
   */
  async updateAlert(id: string, alertData: Partial<Alert>) {
    return await apiClient.put<Alert>(API_ENDPOINTS.alerts.update(id), alertData);
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(id: string) {
    return await apiClient.post(API_ENDPOINTS.alerts.dismiss(id));
  }

  /**
   * Delete an alert
   */
  async deleteAlert(id: string) {
    return await apiClient.delete(API_ENDPOINTS.alerts.delete(id));
  }

  /**
   * Subscribe to real-time alert updates
   */
  subscribeToAlerts(eventId: string, callback: (alert: Alert) => void) {
    wsService.joinEvent(eventId);
    wsService.on('alert:created', callback);
    wsService.on('alert:updated', callback);
    return () => {
      wsService.off('alert:created', callback);
      wsService.off('alert:updated', callback);
    };
  }

  /**
   * Subscribe to new alerts
   */
  onAlertCreated(eventId: string, callback: (alert: Alert) => void) {
    wsService.joinEvent(eventId);
    wsService.on('alert:created', callback);
    return () => {
      wsService.off('alert:created', callback);
    };
  }
}

export const alertService = new AlertService();
