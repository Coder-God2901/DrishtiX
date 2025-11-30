/**
 * Firebase Admin SDK Service
 * Server-side Firebase integration for authentication, FCM, and Firestore
 * 
 * Purpose:
 * - Firebase Authentication: Secure user management and role-based access
 * - Firebase Cloud Messaging (FCM): Push notifications for alerts
 * - Firestore: Real-time database for live event data
 */

import * as admin from 'firebase-admin';
import { gcpConfig } from '../config/gcp.config';

interface FCMNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
  sound?: string;
  badge?: string;
}

interface BulkNotification extends FCMNotification {
  tokens: string[];
  topic?: string;
}

interface FirestoreDocument {
  collection: string;
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

class FirebaseAdminService {
  private app!: admin.app.App;
  private db!: admin.firestore.Firestore;
  private messaging!: admin.messaging.Messaging;
  private auth!: admin.auth.Auth;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initialize(): void {
    try {
      if (this.initialized) {
        console.log('[Firebase Admin] Already initialized');
        return;
      }

      // Initialize Firebase Admin with service account
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(gcpConfig.credentials),
          projectId: gcpConfig.projectId,
          databaseURL: `https://${gcpConfig.projectId}.firebaseio.com`,
          storageBucket: `${gcpConfig.projectId}.appspot.com`,
        });
      } else {
        this.app = admin.app();
      }

      this.db = admin.firestore();
      this.messaging = admin.messaging();
      this.auth = admin.auth();
      this.initialized = true;

      // Configure Firestore settings
      this.db.settings({
        timestampsInSnapshots: true,
        ignoreUndefinedProperties: true,
      });

      console.log('✓ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw new Error('Invalid authentication token');
    }
  }

  /**
   * Create custom token for user
   */
  async createCustomToken(uid: string, claims?: object): Promise<string> {
    try {
      return await this.auth.createCustomToken(uid, claims);
    } catch (error) {
      console.error('Error creating custom token:', error);
      throw error;
    }
  }

  /**
   * Set custom user claims (roles)
   */
  async setUserClaims(uid: string, claims: object): Promise<void> {
    try {
      await this.auth.setCustomUserClaims(uid, claims);
      console.log(`Set custom claims for user ${uid}:`, claims);
    } catch (error) {
      console.error('Error setting user claims:', error);
      throw error;
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUser(uid);
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(email: string, password: string, displayName?: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
      console.log(`Deleted user ${uid}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ==================== FIREBASE CLOUD MESSAGING (FCM) ====================

  /**
   * Send push notification to single device
   */
  async sendNotification(token: string, notification: FCMNotification): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: notification.priority || 'high',
          notification: {
            sound: notification.sound || 'default',
            channelId: 'alerts',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: notification.badge ? parseInt(notification.badge) : undefined,
              sound: notification.sound || 'default',
            },
          },
        },
      };

      const messageId = await this.messaging.send(message);
      console.log(`Successfully sent notification: ${messageId}`);
      return messageId;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple devices
   */
  async sendBulkNotifications(notification: BulkNotification): Promise<admin.messaging.BatchResponse> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: notification.tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: notification.priority || 'high',
        },
      };

      const response = await this.messaging.sendMulticast(message);
      console.log(`Sent ${response.successCount}/${notification.tokens.length} notifications`);

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to ${notification.tokens[idx]}:`, resp.error);
          }
        });
      }

      return response;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification to topic (e.g., all attendees of an event)
   */
  async sendTopicNotification(topic: string, notification: FCMNotification): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: notification.priority || 'high',
        },
      };

      const messageId = await this.messaging.send(message);
      console.log(`Successfully sent topic notification to ${topic}: ${messageId}`);
      return messageId;
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }

  /**
   * Subscribe device tokens to topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      console.log(`Subscribed ${response.successCount} devices to topic ${topic}`);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe device tokens from topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      console.log(`Unsubscribed ${response.successCount} devices from topic ${topic}`);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  /**
   * Send emergency alert notification
   */
  async sendEmergencyAlert(alert: AlertNotification, deviceTokens: string[]): Promise<void> {
    try {
      const priorityMap = {
        CRITICAL: 'high' as const,
        HIGH: 'high' as const,
        MEDIUM: 'normal' as const,
        INFO: 'normal' as const,
      };

      await this.sendBulkNotifications({
        tokens: deviceTokens,
        title: `🚨 ${alert.type}: ${alert.title}`,
        body: alert.message,
        priority: priorityMap[alert.type],
        sound: alert.type === 'CRITICAL' ? 'alert' : 'default',
        data: {
          eventId: alert.eventId,
          type: alert.type,
          zone: alert.zone || '',
          actionRequired: alert.actionRequired || '',
          lat: alert.location?.lat.toString() || '',
          lon: alert.location?.lon.toString() || '',
        },
      });

      console.log(`Emergency alert sent to ${deviceTokens.length} devices`);
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      throw error;
    }
  }

  // ==================== FIRESTORE REAL-TIME DATABASE ====================

  /**
   * Write document to Firestore
   */
  async setDocument(doc: FirestoreDocument): Promise<void> {
    try {
      const docRef = doc.docId
        ? this.db.collection(doc.collection).doc(doc.docId)
        : this.db.collection(doc.collection).doc();

      await docRef.set({
        ...doc.data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`Document written to ${doc.collection}/${docRef.id}`);
    } catch (error) {
      console.error('Error writing document:', error);
      throw error;
    }
  }

  /**
   * Get document from Firestore
   */
  async getDocument(collection: string, docId: string): Promise<any> {
    try {
      const doc = await this.db.collection(collection).doc(docId).get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error reading document:', error);
      throw error;
    }
  }

  /**
   * Query documents from Firestore
   */
  async queryDocuments(
    collection: string,
    filters?: { field: string; operator: admin.firestore.WhereFilterOp; value: any }[],
    orderByField?: string,
    limitCount?: number
  ): Promise<any[]> {
    try {
      let query: admin.firestore.Query = this.db.collection(collection);

      if (filters) {
        filters.forEach(filter => {
          query = query.where(filter.field, filter.operator, filter.value);
        });
      }

      if (orderByField) {
        query = query.orderBy(orderByField, 'desc');
      }

      if (limitCount) {
        query = query.limit(limitCount);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  /**
   * Update crowd density in real-time (Firestore)
   */
  async updateCrowdDensity(eventId: string, gridData: any[]): Promise<void> {
    try {
      await this.setDocument({
        collection: 'crowdDensity',
        docId: eventId,
        data: {
          eventId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          gridData,
          totalCount: gridData.reduce((sum, cell) => sum + cell.count, 0),
          averageDensity: gridData.reduce((sum, cell) => sum + cell.density, 0) / gridData.length,
        },
      });

      console.log(`Updated crowd density for event ${eventId}`);
    } catch (error) {
      console.error('Error updating crowd density:', error);
      throw error;
    }
  }

  /**
   * Update responder positions in real-time
   */
  async updateResponderPosition(responderId: string, location: { lat: number; lon: number }, status: string): Promise<void> {
    try {
      await this.setDocument({
        collection: 'responders',
        docId: responderId,
        data: {
          location,
          status,
          lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    } catch (error) {
      console.error('Error updating responder position:', error);
      throw error;
    }
  }

  /**
   * Broadcast live alert to Firestore
   */
  async broadcastAlert(eventId: string, alert: any): Promise<void> {
    try {
      await this.setDocument({
        collection: 'alerts',
        data: {
          eventId,
          ...alert,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

      console.log(`Alert broadcasted for event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting alert:', error);
      throw error;
    }
  }

  /**
   * Delete document from Firestore
   */
  async deleteDocument(collection: string, docId: string): Promise<void> {
    try {
      await this.db.collection(collection).doc(docId).delete();
      console.log(`Document ${collection}/${docId} deleted`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Batch write to Firestore (for bulk operations)
   */
  async batchWrite(operations: Array<{ collection: string; docId?: string; data: any }>): Promise<void> {
    try {
      const batch = this.db.batch();

      operations.forEach(op => {
        const docRef = op.docId
          ? this.db.collection(op.collection).doc(op.docId)
          : this.db.collection(op.collection).doc();

        batch.set(docRef, {
          ...op.data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });

      await batch.commit();
      console.log(`Batch write completed: ${operations.length} operations`);
    } catch (error) {
      console.error('Error in batch write:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get Firestore instance
   */
  getFirestore(): admin.firestore.Firestore {
    return this.db;
  }

  /**
   * Get Messaging instance
   */
  getMessaging(): admin.messaging.Messaging {
    return this.messaging;
  }

  /**
   * Get Auth instance
   */
  getAuth(): admin.auth.Auth {
    return this.auth;
  }
}

// Export singleton instance
export const firebaseAdminService = new FirebaseAdminService();
export default firebaseAdminService;
