/**
 * Google Cloud Pub/Sub Service
 * Real-time data pipeline for event streaming and processing
 * 
 * Topics:
 * - video-analytics: Video frame analysis results
 * - social-signals: Twitter/social media sentiment
 * - gps-tracking: Real-time GPS location updates
 * - incident-alerts: Critical incident notifications
 * - crowd-predictions: ML model predictions
 */

/// <reference types="vite/client" />

import { PubSub, Message, Topic, Subscription } from '@google-cloud/pubsub';

// Message interfaces for type safety
interface VideoAnalyticsMessage {
  eventId: string;
  cameraId: string;
  timestamp: string;
  peopleCount: number;
  crowdDensity: number;
  anomalies: Array<{
    type: string;
    confidence: number;
    location: { lat: number; lon: number };
  }>;
}

interface SocialSignalMessage {
  eventId: string;
  platform: 'twitter' | 'instagram' | 'facebook';
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'panic';
  panicLevel: number;
  keywords: string[];
  location?: { lat: number; lon: number };
}

interface GPSTrackingMessage {
  eventId: string;
  deviceId: string;
  userId: string;
  timestamp: string;
  location: { lat: number; lon: number };
  accuracy: number;
  speed?: number;
  heading?: number;
}

interface IncidentAlertMessage {
  eventId: string;
  incidentId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location: { lat: number; lon: number };
  description: string;
  metadata?: Record<string, any>;
}

interface CrowdPredictionMessage {
  eventId: string;
  timestamp: string;
  predictionHorizon: number; // minutes
  predictions: Array<{
    zoneId: string;
    density: number;
    confidence: number;
    bottleneckRisk: number;
  }>;
}

type PubSubMessage =
  | VideoAnalyticsMessage
  | SocialSignalMessage
  | GPSTrackingMessage
  | IncidentAlertMessage
  | CrowdPredictionMessage;

// Topic names
export enum PubSubTopic {
  VIDEO_ANALYTICS = 'video-analytics',
  SOCIAL_SIGNALS = 'social-signals',
  GPS_TRACKING = 'gps-tracking',
  INCIDENT_ALERTS = 'incident-alerts',
  CROWD_PREDICTIONS = 'crowd-predictions',
}

// Subscription names
export enum PubSubSubscription {
  VIDEO_ANALYTICS_PROCESSOR = 'video-analytics-processor',
  SOCIAL_SIGNALS_PROCESSOR = 'social-signals-processor',
  GPS_TRACKING_PROCESSOR = 'gps-tracking-processor',
  INCIDENT_ALERTS_DISPATCHER = 'incident-alerts-dispatcher',
  CROWD_PREDICTIONS_ANALYZER = 'crowd-predictions-analyzer',
  // BigQuery streaming subscriptions
  VIDEO_ANALYTICS_BQ = 'video-analytics-bigquery',
  INCIDENT_ALERTS_BQ = 'incident-alerts-bigquery',
}

class PubSubService {
  private pubsub: PubSub | null = null;
  private topics: Map<string, Topic> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private messageHandlers: Map<string, Array<(message: any) => void>> = new Map();
  private isEnabled: boolean;
  private projectId: string;

  constructor() {
    this.projectId = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || '';
    this.isEnabled = import.meta.env.VITE_ENABLE_PUBSUB === 'true';

    if (this.isEnabled && this.projectId) {
      this.initialize();
    } else {
      console.warn('[Pub/Sub] Service disabled or project ID not configured');
    }
  }

  /**
   * Initialize Pub/Sub client
   */
  private initialize(): void {
    try {
      this.pubsub = new PubSub({
        projectId: this.projectId,
      });
      console.log('[Pub/Sub] Client initialized for project:', this.projectId);
    } catch (error) {
      console.error('[Pub/Sub] Initialization failed:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Create topic if it doesn't exist
   */
  async createTopic(topicName: string): Promise<Topic | null> {
    if (!this.pubsub) {
      console.warn('[Pub/Sub] Client not initialized');
      return null;
    }

    try {
      const topic = this.pubsub.topic(topicName);
      const [exists] = await topic.exists();

      if (!exists) {
        await topic.create();
        console.log(`[Pub/Sub] Created topic: ${topicName}`);
      }

      this.topics.set(topicName, topic);
      return topic;
    } catch (error) {
      console.error(`[Pub/Sub] Failed to create topic ${topicName}:`, error);
      return null;
    }
  }

  /**
   * Create subscription if it doesn't exist
   */
  async createSubscription(
    topicName: string,
    subscriptionName: string,
    options?: {
      ackDeadlineSeconds?: number;
      enableMessageOrdering?: boolean;
      filter?: string;
    }
  ): Promise<Subscription | null> {
    if (!this.pubsub) {
      console.warn('[Pub/Sub] Client not initialized');
      return null;
    }

    try {
      const topic = await this.createTopic(topicName);
      if (!topic) return null;

      const subscription = topic.subscription(subscriptionName);
      const [exists] = await subscription.exists();

      if (!exists) {
        await subscription.create({
          ackDeadlineSeconds: options?.ackDeadlineSeconds || 60,
          enableMessageOrdering: options?.enableMessageOrdering || false,
          filter: options?.filter,
        });
        console.log(`[Pub/Sub] Created subscription: ${subscriptionName}`);
      }

      this.subscriptions.set(subscriptionName, subscription);
      return subscription;
    } catch (error) {
      console.error(`[Pub/Sub] Failed to create subscription ${subscriptionName}:`, error);
      return null;
    }
  }

  /**
   * Publish message to topic
   */
  async publish<T extends PubSubMessage>(
    topicName: string,
    message: T,
    attributes?: Record<string, string>
  ): Promise<string | null> {
    if (!this.isEnabled) {
      console.log('[Pub/Sub] Skipping publish - service disabled');
      return null;
    }

    try {
      let topic = this.topics.get(topicName);
      if (!topic) {
        topic = await this.createTopic(topicName);
        if (!topic) return null;
      }

      const dataBuffer = Buffer.from(JSON.stringify(message));
      const messageId = await topic.publishMessage({
        data: dataBuffer,
        attributes: {
          eventId: (message as any).eventId || '',
          timestamp: new Date().toISOString(),
          ...attributes,
        },
      });

      console.log(`[Pub/Sub] Published message ${messageId} to ${topicName}`);
      return messageId;
    } catch (error) {
      console.error(`[Pub/Sub] Publish failed for topic ${topicName}:`, error);
      return null;
    }
  }

  /**
   * Publish batch of messages (more efficient)
   */
  async publishBatch<T extends PubSubMessage>(
    topicName: string,
    messages: T[],
    attributes?: Record<string, string>
  ): Promise<string[]> {
    if (!this.isEnabled) {
      console.log('[Pub/Sub] Skipping batch publish - service disabled');
      return [];
    }

    try {
      let topic = this.topics.get(topicName);
      if (!topic) {
        topic = await this.createTopic(topicName);
        if (!topic) return [];
      }

      const publishPromises = messages.map(message => {
        const dataBuffer = Buffer.from(JSON.stringify(message));
        return topic!.publishMessage({
          data: dataBuffer,
          attributes: {
            eventId: (message as any).eventId || '',
            timestamp: new Date().toISOString(),
            ...attributes,
          },
        });
      });

      const messageIds = await Promise.all(publishPromises);
      console.log(`[Pub/Sub] Published ${messageIds.length} messages to ${topicName}`);
      return messageIds;
    } catch (error) {
      console.error(`[Pub/Sub] Batch publish failed for topic ${topicName}:`, error);
      return [];
    }
  }

  /**
   * Subscribe to messages with handler
   */
  async subscribe<T extends PubSubMessage>(
    subscriptionName: string,
    handler: (message: T) => void | Promise<void>
  ): Promise<void> {
    if (!this.isEnabled) {
      console.log('[Pub/Sub] Skipping subscribe - service disabled');
      return;
    }

    try {
      let subscription = this.subscriptions.get(subscriptionName);
      if (!subscription) {
        console.warn(`[Pub/Sub] Subscription ${subscriptionName} not created yet`);
        return;
      }

      // Store handler
      const handlers = this.messageHandlers.get(subscriptionName) || [];
      handlers.push(handler as any);
      this.messageHandlers.set(subscriptionName, handlers);

      // Listen for messages
      subscription.on('message', async (message: Message) => {
        try {
          const data = JSON.parse(message.data.toString()) as T;

          // Call all handlers for this subscription
          const handlers = this.messageHandlers.get(subscriptionName) || [];
          await Promise.all(handlers.map(h => h(data)));

          // Acknowledge message
          message.ack();
        } catch (error) {
          console.error(`[Pub/Sub] Message processing failed:`, error);
          // Don't ack - message will be redelivered
          message.nack();
        }
      });

      subscription.on('error', error => {
        console.error(`[Pub/Sub] Subscription error for ${subscriptionName}:`, error);
      });

      console.log(`[Pub/Sub] Subscribed to ${subscriptionName}`);
    } catch (error) {
      console.error(`[Pub/Sub] Subscribe failed for ${subscriptionName}:`, error);
    }
  }

  /**
   * Publish video analytics result
   */
  async publishVideoAnalytics(data: VideoAnalyticsMessage): Promise<string | null> {
    return this.publish(PubSubTopic.VIDEO_ANALYTICS, data, {
      cameraId: data.cameraId,
      anomalyCount: data.anomalies.length.toString(),
    });
  }

  /**
   * Publish social signal
   */
  async publishSocialSignal(data: SocialSignalMessage): Promise<string | null> {
    return this.publish(PubSubTopic.SOCIAL_SIGNALS, data, {
      platform: data.platform,
      sentiment: data.sentiment,
    });
  }

  /**
   * Publish GPS tracking update
   */
  async publishGPSTracking(data: GPSTrackingMessage): Promise<string | null> {
    return this.publish(PubSubTopic.GPS_TRACKING, data, {
      deviceId: data.deviceId,
      userId: data.userId,
    });
  }

  /**
   * Publish incident alert
   */
  async publishIncidentAlert(data: IncidentAlertMessage): Promise<string | null> {
    return this.publish(PubSubTopic.INCIDENT_ALERTS, data, {
      incidentId: data.incidentId,
      severity: data.severity,
      type: data.type,
    });
  }

  /**
   * Publish crowd prediction
   */
  async publishCrowdPrediction(data: CrowdPredictionMessage): Promise<string | null> {
    return this.publish(PubSubTopic.CROWD_PREDICTIONS, data, {
      predictionHorizon: data.predictionHorizon.toString(),
      zoneCount: data.predictions.length.toString(),
    });
  }

  /**
   * Setup all topics and subscriptions
   */
  async setupInfrastructure(): Promise<void> {
    if (!this.isEnabled) {
      console.log('[Pub/Sub] Skipping infrastructure setup - service disabled');
      return;
    }

    console.log('[Pub/Sub] Setting up infrastructure...');

    try {
      // Create topics
      await Promise.all([
        this.createTopic(PubSubTopic.VIDEO_ANALYTICS),
        this.createTopic(PubSubTopic.SOCIAL_SIGNALS),
        this.createTopic(PubSubTopic.GPS_TRACKING),
        this.createTopic(PubSubTopic.INCIDENT_ALERTS),
        this.createTopic(PubSubTopic.CROWD_PREDICTIONS),
      ]);

      // Create processing subscriptions
      await Promise.all([
        this.createSubscription(
          PubSubTopic.VIDEO_ANALYTICS,
          PubSubSubscription.VIDEO_ANALYTICS_PROCESSOR,
          { ackDeadlineSeconds: 60 }
        ),
        this.createSubscription(
          PubSubTopic.SOCIAL_SIGNALS,
          PubSubSubscription.SOCIAL_SIGNALS_PROCESSOR,
          { ackDeadlineSeconds: 30 }
        ),
        this.createSubscription(
          PubSubTopic.GPS_TRACKING,
          PubSubSubscription.GPS_TRACKING_PROCESSOR,
          { ackDeadlineSeconds: 30 }
        ),
        this.createSubscription(
          PubSubTopic.INCIDENT_ALERTS,
          PubSubSubscription.INCIDENT_ALERTS_DISPATCHER,
          { ackDeadlineSeconds: 60 }
        ),
        this.createSubscription(
          PubSubTopic.CROWD_PREDICTIONS,
          PubSubSubscription.CROWD_PREDICTIONS_ANALYZER,
          { ackDeadlineSeconds: 60 }
        ),
      ]);

      // Create BigQuery streaming subscriptions
      await Promise.all([
        this.createSubscription(
          PubSubTopic.VIDEO_ANALYTICS,
          PubSubSubscription.VIDEO_ANALYTICS_BQ,
          { ackDeadlineSeconds: 30 }
        ),
        this.createSubscription(
          PubSubTopic.INCIDENT_ALERTS,
          PubSubSubscription.INCIDENT_ALERTS_BQ,
          { ackDeadlineSeconds: 30 }
        ),
      ]);

      console.log('[Pub/Sub] Infrastructure setup complete');
    } catch (error) {
      console.error('[Pub/Sub] Infrastructure setup failed:', error);
      throw error;
    }
  }

  /**
   * Get topic statistics
   */
  async getTopicStats(topicName: string): Promise<any> {
    if (!this.pubsub) return null;

    try {
      const topic = this.pubsub.topic(topicName);
      const [metadata] = await topic.getMetadata();
      return metadata;
    } catch (error) {
      console.error(`[Pub/Sub] Failed to get stats for ${topicName}:`, error);
      return null;
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(subscriptionName: string): Promise<any> {
    if (!this.pubsub) return null;

    try {
      const subscription = this.subscriptions.get(subscriptionName);
      if (!subscription) return null;

      const [metadata] = await subscription.getMetadata();
      return metadata;
    } catch (error) {
      console.error(`[Pub/Sub] Failed to get stats for ${subscriptionName}:`, error);
      return null;
    }
  }

  /**
   * Close all subscriptions and cleanup
   */
  async close(): Promise<void> {
    console.log('[Pub/Sub] Closing all subscriptions...');

    for (const [name, subscription] of this.subscriptions.entries()) {
      try {
        await subscription.close();
        console.log(`[Pub/Sub] Closed subscription: ${name}`);
      } catch (error) {
        console.error(`[Pub/Sub] Failed to close subscription ${name}:`, error);
      }
    }

    this.subscriptions.clear();
    this.topics.clear();
    this.messageHandlers.clear();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled || !this.pubsub) {
      return false;
    }

    try {
      // Try to list topics as a health check
      await this.pubsub.getTopics({ pageSize: 1 });
      return true;
    } catch (error) {
      console.error('[Pub/Sub] Health check failed:', error);
      return false;
    }
  }
}

export const pubsubService = new PubSubService();
export default pubsubService;

// Export types
export type {
  VideoAnalyticsMessage,
  SocialSignalMessage,
  GPSTrackingMessage,
  IncidentAlertMessage,
  CrowdPredictionMessage,
  PubSubMessage,
};
