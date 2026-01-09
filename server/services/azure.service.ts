/**
 * Azure Service
 * Server-side Azure integration for authentication, Cosmos DB, and Notification Hubs
 * 
 * Purpose:
 * - Azure AD B2C: Secure user management and role-based access
 * - Azure Notification Hubs: Push notifications for alerts
 * - Azure Cosmos DB: Real-time database for live event data
 */

import { CosmosClient, Container, Database } from '@azure/cosmos';
import {
  NotificationHubsClient,
  createAppleNotification,
  createFcmLegacyNotification
} from '@azure/notification-hubs';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { azureConfig } from '../config/azure.config';

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
  sound?: string;
  badge?: string;
}

interface BulkNotification extends PushNotification {
  tokens: string[];
  tags?: string[];
}

interface CosmosDocument {
  container: string;
  docId?: string;
  data: any;
}

interface AlertNotification {
  eventId: string;
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  message: string;
  zone?: string;
  location?: { lat: number; lon: number };
  actionRequired?: string;
}

interface UserToken {
  accessToken: string;
  expiresOn: Date;
  userId: string;
}

class AzureService {
  private cosmosClient!: CosmosClient;
  private database!: Database;
  private containers: Map<string, Container> = new Map();
  private notificationHubClient!: NotificationHubsClient;
  private msalClient!: ConfidentialClientApplication;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Azure Services
   */
  private async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        console.log('[Azure Service] Already initialized');
        return;
      }

      // Initialize Cosmos DB Client
      this.cosmosClient = new CosmosClient({
        endpoint: azureConfig.cosmosDb.endpoint,
        key: azureConfig.cosmosDb.key,
      });

      // Get or create database
      const { database } = await this.cosmosClient.databases.createIfNotExists({
        id: azureConfig.cosmosDb.databaseId,
      });
      this.database = database;

      // Initialize containers
      await this.initializeContainers();

      // Initialize Notification Hubs
      if (azureConfig.notificationHubs.connectionString) {
        this.notificationHubClient = new NotificationHubsClient(
          azureConfig.notificationHubs.connectionString,
          azureConfig.notificationHubs.hubName
        );
      }

      // Initialize MSAL for Azure AD B2C
      this.msalClient = new ConfidentialClientApplication({
        auth: {
          clientId: azureConfig.auth.b2c.clientId,
          authority: azureConfig.auth.b2c.authority,
          clientSecret: azureConfig.auth.clientSecret,
        },
      });

      this.initialized = true;
      console.log('✓ Azure Service initialized successfully');
    } catch (error) {
      console.error('Error initializing Azure Service:', error);
      throw error;
    }
  }

  /**
   * Initialize Cosmos DB containers
   */
  private async initializeContainers(): Promise<void> {
    const containerConfigs = [
      { id: azureConfig.cosmosDb.containers.users, partitionKey: '/userId' },
      { id: azureConfig.cosmosDb.containers.events, partitionKey: '/eventId' },
      { id: azureConfig.cosmosDb.containers.analytics, partitionKey: '/eventId' },
      { id: azureConfig.cosmosDb.containers.sessions, partitionKey: '/sessionId' },
    ];

    for (const config of containerConfigs) {
      const { container } = await this.database.containers.createIfNotExists({
        id: config.id,
        partitionKey: { paths: [config.partitionKey] },
      });
      this.containers.set(config.id, container);
    }

    console.log('✓ Cosmos DB containers initialized');
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Verify Azure AD B2C token
   */
  async verifyIdToken(idToken: string): Promise<any> {
    try {
      // In production, use proper token validation with MSAL
      // This is a simplified version
      const decoded = JSON.parse(
        Buffer.from(idToken.split('.')[1], 'base64').toString()
      );

      // Validate token expiration
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return decoded;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw new Error('Invalid authentication token');
    }
  }

  /**
   * Acquire token for user (server-to-server)
   */
  async acquireToken(scopes: string[]): Promise<UserToken> {
    try {
      const result = await this.msalClient.acquireTokenByClientCredential({
        scopes,
      });

      if (!result) {
        throw new Error('Failed to acquire token');
      }

      return {
        accessToken: result.accessToken,
        expiresOn: result.expiresOn!,
        userId: result.account?.homeAccountId || '',
      };
    } catch (error) {
      console.error('Error acquiring token:', error);
      throw error;
    }
  }

  /**
   * Get user by ID from Cosmos DB
   */
  async getUserByUid(uid: string): Promise<any> {
    try {
      const container = this.containers.get(azureConfig.cosmosDb.containers.users);
      if (!container) throw new Error('Users container not initialized');

      const { resource } = await container.item(uid, uid).read();
      return resource;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Create new user in Cosmos DB
   */
  async createUser(
    userId: string,
    email: string,
    displayName?: string,
    customClaims?: object
  ): Promise<any> {
    try {
      const container = this.containers.get(azureConfig.cosmosDb.containers.users);
      if (!container) throw new Error('Users container not initialized');

      const user = {
        id: userId,
        userId,
        email,
        displayName,
        customClaims: customClaims || {},
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { resource } = await container.items.create(user);
      console.log(`Created user ${userId}`);
      return resource;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user custom claims (roles)
   */
  async setUserClaims(uid: string, claims: object): Promise<void> {
    try {
      const container = this.containers.get(azureConfig.cosmosDb.containers.users);
      if (!container) throw new Error('Users container not initialized');

      const { resource: user } = await container.item(uid, uid).read();

      if (!user) {
        throw new Error('User not found');
      }

      user.customClaims = { ...user.customClaims, ...claims };
      user.updatedAt = new Date().toISOString();

      await container.item(uid, uid).replace(user);
      console.log(`Set custom claims for user ${uid}:`, claims);
    } catch (error) {
      console.error('Error setting user claims:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      const container = this.containers.get(azureConfig.cosmosDb.containers.users);
      if (!container) throw new Error('Users container not initialized');

      await container.item(uid, uid).delete();
      console.log(`Deleted user ${uid}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ==================== AZURE NOTIFICATION HUBS ====================

  /**
   * Send push notification to single device
   */
  async sendNotification(token: string, notification: PushNotification): Promise<string> {
    try {
      if (!this.notificationHubClient) {
        throw new Error('Notification Hubs not configured');
      }

      // Create FCM notification
      const fcmNotification = createFcmLegacyNotification({
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        priority: notification.priority || 'high',
      });

      const result = await this.notificationHubClient.sendNotification(fcmNotification, {
        deviceHandle: token,
      });

      console.log(`Successfully sent notification: ${result.trackingId}`);
      return result.trackingId || '';
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple devices
   */
  async sendBulkNotifications(notification: BulkNotification): Promise<any> {
    try {
      if (!this.notificationHubClient) {
        throw new Error('Notification Hubs not configured');
      }

      const fcmNotification = createFcmLegacyNotification({
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        priority: notification.priority || 'high',
      });

      // Send to tags if provided, otherwise send to all devices
      const result = await this.notificationHubClient.sendNotification(
        fcmNotification,
        notification.tags ? { tags: notification.tags } : undefined
      );

      console.log(`Sent bulk notification: ${result.trackingId}`);
      return result;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification to topic/tag
   */
  async sendToTopic(topic: string, notification: PushNotification): Promise<string> {
    try {
      if (!this.notificationHubClient) {
        throw new Error('Notification Hubs not configured');
      }

      const fcmNotification = createFcmLegacyNotification({
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
      });

      const result = await this.notificationHubClient.sendNotification(fcmNotification, {
        tags: [topic],
      });

      console.log(`Sent notification to topic ${topic}: ${result.trackingId}`);
      return result.trackingId || '';
    } catch (error) {
      console.error('Error sending to topic:', error);
      throw error;
    }
  }

  /**
   * Subscribe device to topic
   */
  async subscribeToTopic(token: string, topic: string): Promise<void> {
    try {
      if (!this.notificationHubClient) {
        throw new Error('Notification Hubs not configured');
      }

      // Create or update registration with tag
      const installation = {
        installationId: token,
        platform: 'fcm' as const,
        pushChannel: token,
        tags: [topic],
      };

      await this.notificationHubClient.createOrUpdateInstallation(installation);
      console.log(`Subscribed ${token} to topic ${topic}`);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(alert: AlertNotification): Promise<void> {
    try {
      const notification: PushNotification = {
        title: alert.title,
        body: alert.message,
        priority: 'high',
        sound: 'alert',
        data: {
          eventId: alert.eventId,
          type: alert.type,
          zone: alert.zone || '',
          actionRequired: alert.actionRequired || '',
        },
      };

      // Send to alert topic
      await this.sendToTopic(`event-${alert.eventId}`, notification);

      // If critical, send to all emergency responders
      if (alert.type === 'CRITICAL') {
        await this.sendToTopic('emergency-responders', notification);
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      throw error;
    }
  }

  // ==================== COSMOS DB OPERATIONS ====================

  /**
   * Create document in Cosmos DB
   */
  async createDocument(doc: CosmosDocument): Promise<any> {
    try {
      const container = this.containers.get(doc.container);
      if (!container) throw new Error(`Container ${doc.container} not found`);

      const document = {
        id: doc.docId || `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ...doc.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { resource } = await container.items.create(document);
      return resource;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Get document from Cosmos DB
   */
  async getDocument(container: string, docId: string, partitionKey: string): Promise<any> {
    try {
      const containerObj = this.containers.get(container);
      if (!containerObj) throw new Error(`Container ${container} not found`);

      const { resource } = await containerObj.item(docId, partitionKey).read();
      return resource;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * Update document in Cosmos DB
   */
  async updateDocument(
    container: string,
    docId: string,
    partitionKey: string,
    data: any
  ): Promise<any> {
    try {
      const containerObj = this.containers.get(container);
      if (!containerObj) throw new Error(`Container ${container} not found`);

      const { resource: existingDoc } = await containerObj.item(docId, partitionKey).read();

      if (!existingDoc) {
        throw new Error('Document not found');
      }

      const updatedDoc = {
        ...existingDoc,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const { resource } = await containerObj.item(docId, partitionKey).replace(updatedDoc);
      return resource;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete document from Cosmos DB
   */
  async deleteDocument(container: string, docId: string, partitionKey: string): Promise<void> {
    try {
      const containerObj = this.containers.get(container);
      if (!containerObj) throw new Error(`Container ${container} not found`);

      await containerObj.item(docId, partitionKey).delete();
      console.log(`Deleted document ${docId} from ${container}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Query documents in Cosmos DB
   */
  async queryDocuments(container: string, query: string, parameters?: any[]): Promise<any[]> {
    try {
      const containerObj = this.containers.get(container);
      if (!containerObj) throw new Error(`Container ${container} not found`);

      const querySpec = {
        query,
        parameters: parameters || [],
      };

      const { resources } = await containerObj.items.query(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  /**
   * Get Cosmos DB container
   */
  getContainer(name: string): Container | undefined {
    return this.containers.get(name);
  }

  /**
   * Get Cosmos DB database
   */
  getDatabase(): Database {
    return this.database;
  }
}

// Export singleton instance
export const azureService = new AzureService();
export default azureService;
