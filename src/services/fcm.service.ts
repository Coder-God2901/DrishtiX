/**
 * Firebase Cloud Messaging (FCM) Service
 * 
 * Handles push notifications for:
 * - Critical alerts (fire, panic, crush)
 * - Important updates (crowd density, route changes)
 * - Informational messages (schedule changes, announcements)
 * 
 * Features:
 * - Role-based targeting (Admin, Security, Logistics, Attendee)
 * - Topic-based subscriptions
 * - Geo-targeted notifications
 * - Batch messaging
 * - Silent data messages for background sync
 */

import admin from 'firebase-admin';

export interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

export interface SendNotificationOptions {
  tokens?: string[];
  topic?: string;
  condition?: string;
  priority?: 'high' | 'normal';
  category?: 'CRITICAL' | 'IMPORTANT' | 'INFORMATIONAL';
  sound?: string;
  badge?: number;
  clickAction?: string;
  ttl?: number; // Time to live in seconds
}

export interface AlertNotification {
  eventId: string;
  type: 'fire' | 'panic' | 'crush' | 'bottleneck' | 'medical' | 'general';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  location?: { lat: number; lon: number; zone?: string };
  actionRequired?: string;
  targetRoles?: ('ADMIN' | 'SECURITY' | 'MEDICAL' | 'LOGISTICS' | 'ATTENDEE')[];
  targetRadius?: number; // meters (for geo-targeted alerts)
}

class FCMService {
  private messaging: admin.messaging.Messaging;

  constructor() {
    // Firebase Admin SDK is initialized in firebase.service.ts
    this.messaging = admin.messaging();
  }

  /**
   * Send notification to specific devices
   */
  async sendToTokens(
    tokens: string[],
    payload: NotificationPayload,
    options: SendNotificationOptions = {}
  ): Promise<admin.messaging.BatchResponse> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: options.priority || 'high',
          ttl: options.ttl || 3600000, // 1 hour default
          notification: {
            sound: options.sound || 'default',
            clickAction: options.clickAction,
            channelId: this.getChannelId(options.category),
            priority: options.priority === 'high' ? 'high' : 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge,
              category: options.clickAction,
              contentAvailable: true,
            },
          },
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            requireInteraction: options.category === 'CRITICAL',
          },
        },
      };

      const response = await this.messaging.sendMulticast(message);

      console.log(`✅ Sent ${response.successCount}/${tokens.length} notifications`);

      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.error(`❌ Failed to send to ${tokens[idx]}:`, resp.error);
          }
        });

        // Clean up invalid tokens
        await this.removeInvalidTokens(failedTokens);
      }

      return response;
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    topic: string,
    payload: NotificationPayload,
    options: SendNotificationOptions = {}
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: options.priority || 'high',
          ttl: options.ttl || 3600000,
          notification: {
            sound: options.sound || 'default',
            channelId: this.getChannelId(options.category),
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              contentAvailable: true,
            },
          },
        },
      };

      const messageId = await this.messaging.send(message);

      console.log(`✅ Sent notification to topic "${topic}": ${messageId}`);

      return messageId;
    } catch (error) {
      console.error(`❌ Error sending to topic "${topic}":`, error);
      throw error;
    }
  }

  /**
   * Send emergency alert
   */
  async sendAlert(alert: AlertNotification): Promise<void> {
    try {
      const payload: NotificationPayload = {
        title: `${this.getSeverityEmoji(alert.severity)} ${alert.title}`,
        body: alert.message,
        data: {
          type: 'alert',
          eventId: alert.eventId,
          alertType: alert.type,
          severity: alert.severity,
          location: alert.location ? JSON.stringify(alert.location) : '',
          actionRequired: alert.actionRequired || '',
          timestamp: new Date().toISOString(),
        },
      };

      const options: SendNotificationOptions = {
        priority: alert.severity === 'CRITICAL' ? 'high' : 'normal',
        category: alert.severity as any,
        sound: alert.severity === 'CRITICAL' ? 'emergency' : 'alert',
      };

      // Send to role-based topics
      if (alert.targetRoles && alert.targetRoles.length > 0) {
        for (const role of alert.targetRoles) {
          const topic = `event_${alert.eventId}_${role.toLowerCase()}`;
          await this.sendToTopic(topic, payload, options);
        }
      } else {
        // Send to all event participants
        const topic = `event_${alert.eventId}`;
        await this.sendToTopic(topic, payload, options);
      }

      console.log(`✅ Alert sent: ${alert.type} (${alert.severity})`);
    } catch (error) {
      console.error('❌ Error sending alert:', error);
      throw error;
    }
  }

  /**
   * Send crowd density update to attendees
   */
  async sendCrowdDensityAlert(
    eventId: string,
    zone: string,
    densityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    alternativeRoute?: string
  ): Promise<void> {
    const messages = {
      HIGH: `Gate ${zone} is getting crowded. Consider using ${alternativeRoute || 'an alternative entrance'}.`,
      CRITICAL: `⚠️ Gate ${zone} is at capacity. Please use ${alternativeRoute || 'another entrance'} immediately.`,
    };

    if (densityLevel === 'HIGH' || densityLevel === 'CRITICAL') {
      await this.sendAlert({
        eventId,
        type: 'bottleneck',
        severity: densityLevel === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        title: 'Crowd Alert',
        message: messages[densityLevel],
        location: { lat: 0, lon: 0, zone },
        targetRoles: ['ATTENDEE'],
      });
    }
  }

  /**
   * Send responder dispatch notification
   */
  async notifyResponder(
    responderId: string,
    incidentType: string,
    location: { lat: number; lon: number },
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  ): Promise<void> {
    // This would look up the responder's FCM token
    // For now, send to responder topic

    await this.sendToTopic(
      `responder_${responderId}`,
      {
        title: `New ${urgency} Incident`,
        body: `${incidentType} reported at ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`,
        data: {
          type: 'dispatch',
          incidentType,
          location: JSON.stringify(location),
          urgency,
          timestamp: new Date().toISOString(),
        },
      },
      {
        priority: 'high',
        category: urgency === 'CRITICAL' ? 'CRITICAL' : 'IMPORTANT',
        sound: 'dispatch',
      }
    );
  }

  /**
   * Send periodic safety briefing
   */
  async sendSafetyBriefing(
    eventId: string,
    briefing: string,
    targetRoles?: string[]
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: 'Safety Briefing',
      body: briefing,
      data: {
        type: 'briefing',
        eventId,
        timestamp: new Date().toISOString(),
      },
    };

    if (targetRoles && targetRoles.length > 0) {
      for (const role of targetRoles) {
        await this.sendToTopic(`event_${eventId}_${role.toLowerCase()}`, payload, {
          category: 'INFORMATIONAL',
          priority: 'normal',
        });
      }
    } else {
      await this.sendToTopic(`event_${eventId}`, payload, {
        category: 'INFORMATIONAL',
        priority: 'normal',
      });
    }
  }

  /**
   * Subscribe devices to topics
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      console.log(`✅ Subscribed ${response.successCount} devices to "${topic}"`);

      if (response.failureCount > 0) {
        console.error(`❌ Failed to subscribe ${response.failureCount} devices`);
      }
    } catch (error) {
      console.error(`❌ Error subscribing to topic "${topic}":`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe devices from topics
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      console.log(`✅ Unsubscribed ${response.successCount} devices from "${topic}"`);
    } catch (error) {
      console.error(`❌ Error unsubscribing from topic "${topic}":`, error);
      throw error;
    }
  }

  /**
   * Subscribe user to event and role topics
   */
  async subscribeUserToEvent(
    token: string,
    eventId: string,
    role: 'ADMIN' | 'ORGANIZER' | 'SECURITY' | 'LOGISTICS' | 'MEDICAL' | 'ATTENDEE'
  ): Promise<void> {
    const topics = [
      `event_${eventId}`,
      `event_${eventId}_${role.toLowerCase()}`,
    ];

    for (const topic of topics) {
      await this.subscribeToTopic([token], topic);
    }

    console.log(`✅ User subscribed to event ${eventId} as ${role}`);
  }

  /**
   * Send silent data message for background sync
   */
  async sendDataMessage(
    tokens: string[],
    data: Record<string, string>
  ): Promise<admin.messaging.BatchResponse> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        data,
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
      };

      const response = await this.messaging.sendMulticast(message);

      console.log(`✅ Sent data message to ${response.successCount} devices`);

      return response;
    } catch (error) {
      console.error('❌ Error sending data message:', error);
      throw error;
    }
  }

  /**
   * Get Android notification channel ID based on category
   */
  private getChannelId(category?: string): string {
    switch (category) {
      case 'CRITICAL':
        return 'critical_alerts';
      case 'IMPORTANT':
        return 'important_updates';
      case 'INFORMATIONAL':
        return 'informational';
      default:
        return 'default';
    }
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
        return 'ℹ️';
      default:
        return '';
    }
  }

  /**
   * Remove invalid tokens from database
   */
  private async removeInvalidTokens(tokens: string[]): Promise<void> {
    // This would remove tokens from your user database
    console.log(`🗑️ Removing ${tokens.length} invalid tokens`);
    // TODO: Implement database cleanup
  }
}

export const fcmService = new FCMService();
