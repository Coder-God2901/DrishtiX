/**
 * Notification Service
 * Handles real-time notifications from backend
 */

import { apiClient } from './api.client';
import { wsService } from './websocket.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Notification {
  id: string;
  eventId: string;
  userId?: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS' | 'ERROR';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt?: string | Date;
  expiresAt?: string | Date;
}

class NotificationService {
  /**
   * Get notifications for a user/event
   */
  async getNotifications(params?: {
    eventId?: string;
    userId?: string;
    unreadOnly?: boolean;
    limit?: number;
  }) {
    return await apiClient.get<Notification[]>(API_ENDPOINTS.notifications.list, params);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string) {
    return await apiClient.put(API_ENDPOINTS.notifications.markRead(id));
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(params?: { eventId?: string; userId?: string }) {
    return await apiClient.put(API_ENDPOINTS.notifications.markAllRead, params);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string) {
    return await apiClient.delete(`/notifications/${id}`);
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(eventId: string, callback: (notification: Notification) => void) {
    wsService.joinEvent(eventId);
    wsService.on('notification:new', callback);
    wsService.on('notification:updated', callback);

    return () => {
      wsService.off('notification:new', callback);
      wsService.off('notification:updated', callback);
    };
  }

  /**
   * Send a notification (admin/organizer only)
   */
  async sendNotification(notificationData: Partial<Notification>) {
    return await apiClient.post<Notification>('/notifications', notificationData);
  }

  /**
   * Broadcast notification to all users in event
   */
  async broadcastNotification(eventId: string, notification: {
    type: Notification['type'];
    title: string;
    message: string;
    priority?: Notification['priority'];
  }) {
    return await apiClient.post('/notifications/broadcast', {
      eventId,
      ...notification
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
