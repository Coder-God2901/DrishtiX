/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * Azure Notification Service
 * Push notifications using Azure Notification Hubs and Azure Communication Services
 * 
 * Features:
 * - Push notifications to mobile devices (iOS, Android, Web)
 * - Topic-based notifications
 * - User segmentation and targeting
 * - SMS and email notifications
 * - Real-time alert delivery
 * 
 * Replaces: Firebase Cloud Messaging (FCM)
 * 
 * Note: Requires Azure SDK packages:
 *   npm install @azure/notification-hubs @azure/communication-email @azure/communication-sms
 */

// import { NotificationHubsClient } from '@azure/notification-hubs';
// import { EmailClient } from '@azure/communication-email';
// import { SmsClient } from '@azure/communication-sms';
import { azureConfig } from '../config/azure.config';

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
  sound?: string;
  badge?: number;
  icon?: string;
  imageUrl?: string;
}

interface NotificationTarget {
  tokens?: string[]; // Device tokens
  topic?: string; // Topic name (e.g., 'all-users', 'event-123')
  tags?: string[]; // User tags/segments
  userId?: string; // Specific user ID
}

interface BulkNotification extends PushNotification {
  target: NotificationTarget;
}

interface AlertNotification {
  eventId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'CROWD_SURGE' | 'ANOMALY' | 'INCIDENT' | 'WEATHER' | 'EVACUATION';
  message: string;
  zoneId?: string;
  actionUrl?: string;
}

interface EmailNotification {
  to: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
}

interface SmsNotification {
  to: string[];
  message: string;
  from?: string;
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  failedTokens?: string[];
  errors?: string[];
}

class AzureNotificationService {
  private notificationClient: any; // NotificationHubsClient when installed
  private emailClient: any; // EmailClient when installed
  private smsClient: any; // SmsClient when installed
  private readonly hubName: string;
  private readonly connectionString: string;

  constructor() {
    // Initialize Notification Hubs
    this.hubName = (azureConfig as any).notificationHubs?.hubName || process.env.AZURE_NOTIFICATION_HUB_NAME || '';
    this.connectionString = (azureConfig as any).notificationHubs?.connectionString || process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING || '';

    // Note: Uncomment when Azure SDKs are installed
    // if (this.connectionString && this.hubName) {
    //   this.notificationClient = new NotificationHubsClient(this.connectionString, this.hubName);
    // }

    // Initialize Email Client
    const emailConnectionString = (azureConfig as any).communication?.emailConnectionString || process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING || '';
    // if (emailConnectionString) {
    //   this.emailClient = new EmailClient(emailConnectionString);
    // }

    // Initialize SMS Client
    const smsConnectionString = (azureConfig as any).communication?.smsConnectionString || process.env.AZURE_COMMUNICATION_SMS_CONNECTION_STRING || '';
    // if (smsConnectionString) {
    //   this.smsClient = new SmsClient(smsConnectionString);
    // }

    console.log('[Azure Notification Service] Initialized (install Azure SDKs to enable)');
  }

  /**
   * Send push notification to specific devices
   */
  async sendToDevices(notification: PushNotification, tokens: string[]): Promise<NotificationResult> {
    try {
      if (!this.notificationClient) {
        throw new Error('Notification Hub not configured');
      }

      const payload = this.buildNotificationPayload(notification);
      const failedTokens: string[] = [];

      // Send to each device token
      for (const token of tokens) {
        try {
          await this.notificationClient.sendNotification(payload, { deviceHandle: token });
        } catch (error) {
          console.error(`[Azure Notification] Failed to send to token: ${token}`, error);
          failedTokens.push(token);
        }
      }

      return {
        success: failedTokens.length === 0,
        failedTokens: failedTokens.length > 0 ? failedTokens : undefined,
      };
    } catch (error: any) {
      console.error('[Azure Notification] Error sending to devices:', error);
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Send notification to a topic (broadcast)
   */
  async sendToTopic(notification: PushNotification, topic: string): Promise<NotificationResult> {
    try {
      if (!this.notificationClient) {
        throw new Error('Notification Hub not configured');
      }

      const payload = this.buildNotificationPayload(notification);

      // Send to tag (topic)
      const result = await this.notificationClient.sendNotification(payload, { tagExpression: topic });

      return {
        success: true,
        messageId: result.notificationId,
      };
    } catch (error: any) {
      console.error('[Azure Notification] Error sending to topic:', error);
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Send notification to users with specific tags
   */
  async sendToTags(notification: PushNotification, tags: string[]): Promise<NotificationResult> {
    try {
      if (!this.notificationClient) {
        throw new Error('Notification Hub not configured');
      }

      const payload = this.buildNotificationPayload(notification);
      const tagExpression = tags.join(' || '); // OR expression

      const result = await this.notificationClient.sendNotification(payload, { tagExpression });

      return {
        success: true,
        messageId: result.notificationId,
      };
    } catch (error: any) {
      console.error('[Azure Notification] Error sending to tags:', error);
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Send bulk notification based on target
   */
  async sendBulkNotification(bulkNotification: BulkNotification): Promise<NotificationResult> {
    const { target, ...notification } = bulkNotification;

    if (target.tokens && target.tokens.length > 0) {
      return await this.sendToDevices(notification, target.tokens);
    } else if (target.topic) {
      return await this.sendToTopic(notification, target.topic);
    } else if (target.tags && target.tags.length > 0) {
      return await this.sendToTags(notification, target.tags);
    }

    return {
      success: false,
      errors: ['No valid target specified'],
    };
  }

  /**
   * Send alert notification to all event attendees
   */
  async sendAlertToAttendees(alert: AlertNotification, attendeeTokens: string[]): Promise<NotificationResult> {
    const notification: PushNotification = {
      title: this.getAlertTitle(alert.severity, alert.type),
      body: alert.message,
      data: {
        eventId: alert.eventId,
        severity: alert.severity,
        type: alert.type,
        zoneId: alert.zoneId || '',
        actionUrl: alert.actionUrl || '',
        timestamp: new Date().toISOString(),
      },
      priority: alert.severity === 'CRITICAL' ? 'high' : 'normal',
      sound: alert.severity === 'CRITICAL' ? 'alarm' : 'default',
    };

    return await this.sendToDevices(notification, attendeeTokens);
  }

  /**
   * Send email notification
   */
  async sendEmail(emailNotification: EmailNotification): Promise<NotificationResult> {
    try {
      if (!this.emailClient) {
        throw new Error('Email service not configured');
      }

      const fromAddress = emailNotification.from || (azureConfig as any).communication?.defaultSenderEmail || 'noreply@drishtix.com';

      const message = {
        senderAddress: fromAddress,
        content: {
          subject: emailNotification.subject,
          html: emailNotification.htmlContent,
          plainText: emailNotification.textContent,
        },
        recipients: {
          to: emailNotification.to.map(email => ({ address: email })),
        },
      };

      const poller = await this.emailClient.beginSend(message);
      const result = await poller.pollUntilDone();

      return {
        success: result.status === 'Succeeded',
        messageId: result.id,
      };
    } catch (error: any) {
      console.error('[Azure Notification] Error sending email:', error);
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSms(smsNotification: SmsNotification): Promise<NotificationResult> {
    try {
      if (!this.smsClient) {
        throw new Error('SMS service not configured');
      }

      const fromNumber = smsNotification.from || (azureConfig as any).communication?.defaultSenderPhone || '';

      const results = await this.smsClient.send({
        from: fromNumber,
        to: smsNotification.to,
        message: smsNotification.message,
      });

      const failedNumbers = results.filter((r: any) => !r.successful).map((r: any) => r.to);

      return {
        success: failedNumbers.length === 0,
        failedTokens: failedNumbers.length > 0 ? failedNumbers : undefined,
      };
    } catch (error: any) {
      console.error('[Azure Notification] Error sending SMS:', error);
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Subscribe device to topic
   */
  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    try {
      if (!this.notificationClient) {
        throw new Error('Notification Hub not configured');
      }

      const installation = await this.notificationClient.getInstallation(token);

      if (!installation.tags) {
        installation.tags = [];
      }

      if (!installation.tags.includes(topic)) {
        installation.tags.push(topic);
        await this.notificationClient.createOrUpdateInstallation(installation);
      }

      return true;
    } catch (error) {
      console.error('[Azure Notification] Error subscribing to topic:', error);
      return false;
    }
  }

  /**
   * Unsubscribe device from topic
   */
  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    try {
      if (!this.notificationClient) {
        throw new Error('Notification Hub not configured');
      }

      const installation = await this.notificationClient.getInstallation(token);

      if (installation.tags && installation.tags.includes(topic)) {
        installation.tags = installation.tags.filter((t: any) => t !== topic);
        await this.notificationClient.createOrUpdateInstallation(installation);
      }

      return true;
    } catch (error) {
      console.error('[Azure Notification] Error unsubscribing from topic:', error);
      return false;
    }
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    tags?: string[]
  ): Promise<boolean> {
    try {
      if (!this.notificationClient) {
        throw new Error('Notification Hub not configured');
      }

      const installation = {
        installationId: deviceToken,
        platform: platform === 'ios' ? 'apple' : platform === 'android' ? 'gcm' : 'browser',
        pushChannel: deviceToken,
        tags: [userId, platform, ...(tags || [])],
      };

      await this.notificationClient.createOrUpdateInstallation(installation);

      console.log(`[Azure Notification] Device registered: ${userId} (${platform})`);
      return true;
    } catch (error) {
      console.error('[Azure Notification] Error registering device:', error);
      return false;
    }
  }

  /**
   * Unregister device
   */
  async unregisterDevice(deviceToken: string): Promise<boolean> {
    try {
      if (!this.notificationClient) {
        throw new Error('Notification Hub not configured');
      }

      await this.notificationClient.deleteInstallation(deviceToken);

      console.log(`[Azure Notification] Device unregistered: ${deviceToken}`);
      return true;
    } catch (error) {
      console.error('[Azure Notification] Error unregistering device:', error);
      return false;
    }
  }

  /**
   * Build notification payload for different platforms
   */
  private buildNotificationPayload(notification: PushNotification): any {
    return {
      notification: {
        title: notification.title,
        body: notification.body,
        sound: notification.sound || 'default',
        badge: notification.badge,
        icon: notification.icon,
        image: notification.imageUrl,
      },
      data: notification.data || {},
      priority: notification.priority || 'normal',
    };
  }

  /**
   * Get alert title based on severity and type
   */
  private getAlertTitle(severity: string, type: string): string {
    const prefix = severity === 'CRITICAL' ? '🚨 URGENT' : severity === 'WARNING' ? '⚠️ Warning' : 'ℹ️ Info';

    const typeText = {
      CROWD_SURGE: 'Crowd Surge Detected',
      ANOMALY: 'Anomaly Detected',
      INCIDENT: 'Incident Reported',
      WEATHER: 'Weather Alert',
      EVACUATION: 'Evacuation Notice',
    }[type] || 'Alert';

    return `${prefix}: ${typeText}`;
  }
}

export const azureNotificationService = new AzureNotificationService();
