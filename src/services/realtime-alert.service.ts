/**
 * Real-time Alert Service
 * Connects to backend API and WebSocket for live alert updates
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

export interface Alert {
  id: string;
  eventId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  location?: { lat: number; lon: number };
  targetZones?: string[];
  actionRequired?: boolean;
  createdAt: string;
  dismissedAt?: string;
  dismissedBy?: string;
}

class AlertService {
  /**
   * Get all alerts for an event
   */
  async getAlerts(params?: {
    eventId?: string;
    type?: string;
    severity?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Alert[]> {
    const queryParams = new URLSearchParams();
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await apiClient.get<ApiResponse<Alert[]>>(
      `/alerts?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Create new alert
   */
  async createAlert(alert: Partial<Alert>): Promise<Alert> {
    const response = await apiClient.post<ApiResponse<Alert>>('/alerts', alert);
    return response.data;
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(id: string, dismissedBy: string): Promise<Alert> {
    const response = await apiClient.post<ApiResponse<Alert>>(`/alerts/${id}/dismiss`, {
      dismissedBy,
    });
    return response.data;
  }

  /**
   * Subscribe to real-time alert updates for an event
   */
  subscribeToAlerts(eventId: string, callbacks: {
    onNewAlert?: (alert: Alert) => void;
    onDismissed?: (alert: Alert) => void;
  }) {
    socketService.emit('subscribe:alerts', eventId);

    if (callbacks.onNewAlert) {
      socketService.on('alert:new', callbacks.onNewAlert);
    }
    if (callbacks.onDismissed) {
      socketService.on('alert:dismissed', callbacks.onDismissed);
    }
  }

  /**
   * Unsubscribe from alert updates
   */
  unsubscribeFromAlerts() {
    socketService.off('alert:new');
    socketService.off('alert:dismissed');
  }
}

export const alertService = new AlertService();
