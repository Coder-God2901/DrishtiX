/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
/**
 * Google Cloud Pub/Sub Service
 * Real-time event streaming and message queue with advanced error handling
 */

import { PubSub, Message, Topic, Subscription } from '@google-cloud/pubsub';
import { gcpConfig } from '../config/gcp.config';

export interface PubSubMessage<T = any> {
  id: string;
  data: T;
  timestamp: Date;
  attributes?: Record<string, string>;
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2,
};

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds
const PUBLISH_TIMEOUT = 10000; // 10 seconds

class PubSubService {
  private client: PubSub;
  private topics: Map<string, Topic>;
  private subscriptions: Map<string, Subscription>;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private publishMetrics: Map<string, { success: number; failure: number }>;

  constructor() {
    this.client = new PubSub({
      projectId: gcpConfig.projectId,
      keyFilename: gcpConfig.credentials,
    });

    this.topics = new Map();
    this.subscriptions = new Map();
    this.circuitBreakers = new Map();
    this.publishMetrics = new Map();

    this.initializeTopicsAndSubscriptions();
  }

  /**
   * Initialize all topics and subscriptions with DLQ configuration
   */
  private async initializeTopicsAndSubscriptions() {
    try {
      // Create/get topics
      await this.ensureTopic(gcpConfig.pubsub.topics.crowdData);
      await this.ensureTopic(gcpConfig.pubsub.topics.predictions);
      await this.ensureTopic(gcpConfig.pubsub.topics.anomalies);
      await this.ensureTopic(gcpConfig.pubsub.topics.alerts);
      await this.ensureTopic(gcpConfig.pubsub.topics.dispatch);
      await this.ensureTopic(gcpConfig.pubsub.topics.riskEngine);

      // Create/get subscriptions with DLQ and retry policies
      await this.ensureSubscription(
        gcpConfig.pubsub.subscriptions.crowdData,
        gcpConfig.pubsub.topics.crowdData
      );
      await this.ensureSubscription(
        gcpConfig.pubsub.subscriptions.predictions,
        gcpConfig.pubsub.topics.predictions
      );
      await this.ensureSubscription(
        gcpConfig.pubsub.subscriptions.anomalies,
        gcpConfig.pubsub.topics.anomalies
      );
      await this.ensureSubscription(
        gcpConfig.pubsub.subscriptions.riskEngine,
        gcpConfig.pubsub.topics.riskEngine
      );

      console.log('Pub/Sub topics and subscriptions initialized with DLQ support');
    } catch (error) {
      console.error('Error initializing Pub/Sub:', error);
      // Don't throw - allow service to start even if Pub/Sub is unavailable
    }
  }

  /**
   * Ensure topic exists with proper configuration
   */
  private async ensureTopic(topicName: string): Promise<Topic> {
    try {
      const topic = this.client.topic(topicName);
      const [exists] = await topic.exists();

      if (!exists) {
        await topic.create();
        console.log(`Created topic: ${topicName}`);
      }

      this.topics.set(topicName, topic);
      return topic;
    } catch (error) {
      console.error(`Error ensuring topic ${topicName}:`, error);
      // Store topic reference anyway for future attempts
      const topic = this.client.topic(topicName);
      this.topics.set(topicName, topic);
      return topic;
    }
  }

  /**
   * Ensure subscription exists with DLQ and retry policy
   */
  private async ensureSubscription(
    subscriptionName: string,
    topicName: string
  ): Promise<Subscription> {
    try {
      const topic = this.topics.get(topicName) || this.client.topic(topicName);
      const subscription = topic.subscription(subscriptionName);
      const [exists] = await subscription.exists();

      if (!exists) {
        // Create DLQ topic for this subscription
        const dlqTopicName = `${subscriptionName}-dlq`;
        const dlqTopic = await this.ensureTopic(dlqTopicName);

        // Create subscription with DLQ and retry policy
        await subscription.create({
          ackDeadlineSeconds: 60,
          flowControl: {
            maxMessages: 100,
            maxBytes: 10 * 1024 * 1024, // 10MB
          },
          deadLetterPolicy: {
            deadLetterTopic: dlqTopic.name,
            maxDeliveryAttempts: 5,
          },
          retryPolicy: {
            minimumBackoff: { seconds: 10 },
            maximumBackoff: { seconds: 600 },
          },
          enableMessageOrdering: false,
          enableExactlyOnceDelivery: false, // Set to true for exactly-once semantics if needed
        });

        console.log(`Created subscription: ${subscriptionName} with DLQ: ${dlqTopicName}`);
      }

      this.subscriptions.set(subscriptionName, subscription);
      return subscription;
    } catch (error) {
      console.error(`Error ensuring subscription ${subscriptionName}:`, error);
      // Store subscription reference anyway for future attempts
      const topic = this.topics.get(topicName) || this.client.topic(topicName);
      const subscription = topic.subscription(subscriptionName);
      this.subscriptions.set(subscriptionName, subscription);
      return subscription;
    }
  }

  /**
   * Publish crowd density data
   */
  async publishCrowdData(data: any): Promise<string> {
    return this.publish(gcpConfig.pubsub.topics.crowdData, data, {
      type: 'crowd-density',
      eventId: data.eventId,
    });
  }

  /**
   * Publish prediction results
   */
  async publishPrediction(prediction: any): Promise<string> {
    return this.publish(gcpConfig.pubsub.topics.predictions, prediction, {
      type: 'prediction',
      eventId: prediction.eventId,
      riskLevel: prediction.riskLevel,
    });
  }

  /**
   * Publish anomaly detection
   */
  async publishAnomaly(anomaly: any): Promise<string> {
    return this.publish(gcpConfig.pubsub.topics.anomalies, anomaly, {
      type: 'anomaly',
      eventId: anomaly.eventId,
      severity: anomaly.overallSeverity,
    });
  }

  /**
   * Publish alert
   */
  async publishAlert(alert: any): Promise<string> {
    return this.publish(gcpConfig.pubsub.topics.alerts, alert, {
      type: 'alert',
      eventId: alert.eventId,
      severity: alert.severity,
      alertType: alert.type,
    });
  }

  /**
   * Publish dispatch order
   */
  async publishDispatch(dispatch: any): Promise<string> {
    return this.publish(gcpConfig.pubsub.topics.dispatch, dispatch, {
      type: 'dispatch',
      eventId: dispatch.eventId,
      responderId: dispatch.responderId,
    });
  }

  /**
   * Publish video analytics data (camera frames + ML analysis)
   */
  async publishVideoAnalytics(analytics: any): Promise<string> {
    return this.publish(gcpConfig.pubsub.topics.crowdData, analytics, {
      type: 'video-analytics',
      cameraId: analytics.cameraId,
      eventId: analytics.eventId || 'unknown',
    });
  }

  /**
   * Public method to publish message to any topic
   */
  async publishMessage(
    topicName: string,
    data: any,
    attributes: Record<string, string> = {}
  ): Promise<string> {
    return this.publish(topicName, data, attributes);
  }

  /**
   * Generic publish method with retry logic and circuit breaker
   */
  private async publish(
    topicName: string,
    data: any,
    attributes: Record<string, string> = {},
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<string> {
    // Check circuit breaker
    if (!this.isCircuitBreakerClosed(topicName)) {
      const error = new Error(`Circuit breaker OPEN for topic ${topicName}`);
      console.error(error.message);
      throw error;
    }

    let lastError: Error | null = null;
    let delay = retryConfig.initialDelay;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const topic = this.topics.get(topicName) || this.client.topic(topicName);

        const message = {
          data: Buffer.from(JSON.stringify(data)),
          attributes: {
            ...attributes,
            timestamp: new Date().toISOString(),
            attempt: attempt.toString(),
          },
        };

        // Publish with timeout
        const messageId = await this.publishWithTimeout(topic, message, PUBLISH_TIMEOUT);

        console.log(`Published message ${messageId} to ${topicName} (attempt ${attempt + 1})`);

        // Record success metrics
        this.recordPublishSuccess(topicName);

        // Reset circuit breaker on success
        this.resetCircuitBreaker(topicName);

        return messageId;
      } catch (error: any) {
        lastError = error;
        console.error(`Error publishing to ${topicName} (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}):`, error.message);

        // Record failure metrics
        this.recordPublishFailure(topicName);

        // Check if we should retry
        if (attempt < retryConfig.maxRetries) {
          // Exponential backoff with jitter
          const jitter = Math.random() * 0.3 * delay; // 0-30% jitter
          const waitTime = Math.min(delay + jitter, retryConfig.maxDelay);

          console.log(`Retrying in ${Math.round(waitTime)}ms...`);
          await this.sleep(waitTime);

          delay *= retryConfig.backoffMultiplier;
        } else {
          // Max retries exceeded, trip circuit breaker
          this.tripCircuitBreaker(topicName);
        }
      }
    }

    // All retries failed
    const error = new Error(
      `Failed to publish to ${topicName} after ${retryConfig.maxRetries + 1} attempts: ${lastError?.message}`
    );
    console.error(error.message);
    throw error;
  }

  /**
   * Publish with timeout to prevent hanging
   */
  private async publishWithTimeout(
    topic: Topic,
    message: any,
    timeoutMs: number
  ): Promise<string> {
    return Promise.race([
      topic.publishMessage(message),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Publish timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Circuit breaker check
   */
  private isCircuitBreakerClosed(topicName: string): boolean {
    const breaker = this.circuitBreakers.get(topicName);

    if (!breaker || breaker.state === 'CLOSED') {
      return true;
    }

    if (breaker.state === 'OPEN') {
      // Check if timeout has elapsed
      const now = Date.now();
      if (now - breaker.lastFailureTime >= CIRCUIT_BREAKER_TIMEOUT) {
        // Transition to half-open
        breaker.state = 'HALF_OPEN';
        console.log(`Circuit breaker for ${topicName} transitioning to HALF_OPEN`);
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow one attempt
    return true;
  }

  /**
   * Trip circuit breaker after repeated failures
   */
  private tripCircuitBreaker(topicName: string): void {
    let breaker = this.circuitBreakers.get(topicName);

    if (!breaker) {
      breaker = { failures: 0, lastFailureTime: 0, state: 'CLOSED' };
      this.circuitBreakers.set(topicName, breaker);
    }

    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      breaker.state = 'OPEN';
      console.error(`Circuit breaker OPEN for topic ${topicName} after ${breaker.failures} failures`);
    }
  }

  /**
   * Reset circuit breaker after successful publish
   */
  private resetCircuitBreaker(topicName: string): void {
    const breaker = this.circuitBreakers.get(topicName);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'CLOSED';
    }
  }

  /**
   * Record publish success metrics
   */
  private recordPublishSuccess(topicName: string): void {
    const metrics = this.publishMetrics.get(topicName) || { success: 0, failure: 0 };
    metrics.success++;
    this.publishMetrics.set(topicName, metrics);
  }

  /**
   * Record publish failure metrics
   */
  private recordPublishFailure(topicName: string): void {
    const metrics = this.publishMetrics.get(topicName) || { success: 0, failure: 0 };
    metrics.failure++;
    this.publishMetrics.set(topicName, metrics);
  }

  /**
   * Get publish metrics for monitoring
   */
  getPublishMetrics(topicName?: string): Record<string, { success: number; failure: number }> {
    if (topicName) {
      return { [topicName]: this.publishMetrics.get(topicName) || { success: 0, failure: 0 } };
    }
    return Object.fromEntries(this.publishMetrics);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Subscribe to crowd data updates
   */
  subscribeToCrowdData(handler: (message: PubSubMessage) => void | Promise<void>): void {
    this.subscribe(gcpConfig.pubsub.subscriptions.crowdData, handler);
  }

  /**
   * Subscribe to prediction results
   */
  subscribeToPredictions(handler: (message: PubSubMessage) => void | Promise<void>): void {
    this.subscribe(gcpConfig.pubsub.subscriptions.predictions, handler);
  }

  /**
   * Subscribe to anomaly detections
   */
  subscribeToAnomalies(handler: (message: PubSubMessage) => void | Promise<void>): void {
    this.subscribe(gcpConfig.pubsub.subscriptions.anomalies, handler);
  }

  /**
   * Subscribe to risk engine outputs
   */
  subscribeToRiskEngine(handler: (message: PubSubMessage) => void | Promise<void>): void {
    this.subscribe(gcpConfig.pubsub.subscriptions.riskEngine, handler);
  }

  /**
   * Generic subscribe method with enhanced error handling
   */
  private subscribe(
    subscriptionName: string,
    handler: (message: PubSubMessage) => void | Promise<void>
  ): void {
    try {
      const subscription = this.subscriptions.get(subscriptionName) ||
        this.client.subscription(subscriptionName);

      // Enhanced subscription configuration
      subscription.on('message', async (message: Message) => {
        const startTime = Date.now();
        let retries = 0;
        const maxRetries = 3;

        while (retries <= maxRetries) {
          try {
            const data = JSON.parse(message.data.toString());
            const pubsubMessage: PubSubMessage = {
              id: message.id,
              data,
              timestamp: new Date(message.attributes.timestamp || message.publishTime),
              attributes: message.attributes,
            };

            // Execute handler with timeout
            await Promise.race([
              handler(pubsubMessage),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Handler timeout')), 30000) // 30s timeout
              ),
            ]);

            // Acknowledge successful processing
            message.ack();

            const processingTime = Date.now() - startTime;
            console.log(`Processed message ${message.id} in ${processingTime}ms (${retries} retries)`);

            break; // Success, exit retry loop
          } catch (error: any) {
            retries++;
            console.error(
              `Error processing message ${message.id} (attempt ${retries}/${maxRetries + 1}):`,
              error.message
            );

            if (retries > maxRetries) {
              // Max retries exceeded, nack and send to dead letter queue
              console.error(
                `Message ${message.id} failed after ${maxRetries + 1} attempts, sending to DLQ`
              );
              message.nack();

              // Optionally publish to dead letter queue for manual inspection
              try {
                await this.publishToDeadLetterQueue(subscriptionName, {
                  originalMessageId: message.id,
                  data: message.data.toString(),
                  attributes: message.attributes,
                  error: error.message,
                  attempts: retries,
                  timestamp: new Date().toISOString(),
                });
              } catch (dlqError) {
                console.error('Failed to publish to DLQ:', dlqError);
              }

              break;
            } else {
              // Wait before retry with exponential backoff
              const backoff = Math.min(1000 * Math.pow(2, retries - 1), 5000);
              await this.sleep(backoff);
            }
          }
        }
      });

      // Handle subscription errors
      subscription.on('error', (error) => {
        console.error(`Subscription ${subscriptionName} error:`, error);

        // Implement reconnection logic
        setTimeout(() => {
          console.log(`Attempting to reconnect subscription ${subscriptionName}...`);
          this.subscribe(subscriptionName, handler);
        }, 5000);
      });

      // Handle subscription close
      subscription.on('close', () => {
        console.log(`Subscription ${subscriptionName} closed`);
      });

      console.log(`Subscribed to ${subscriptionName}`);
    } catch (error) {
      console.error(`Error subscribing to ${subscriptionName}:`, error);

      // Retry subscription after delay
      setTimeout(() => {
        console.log(`Retrying subscription to ${subscriptionName}...`);
        this.subscribe(subscriptionName, handler);
      }, 10000);
    }
  }

  /**
   * Publish failed messages to dead letter queue for inspection
   */
  private async publishToDeadLetterQueue(
    subscriptionName: string,
    failedMessage: any
  ): Promise<void> {
    const dlqTopicName = `${subscriptionName}-dlq`;

    try {
      // Ensure DLQ topic exists
      const [dlqTopic] = await this.client.topic(dlqTopicName).get({ autoCreate: true });

      const message = {
        data: Buffer.from(JSON.stringify(failedMessage)),
        attributes: {
          source: subscriptionName,
          failureTime: new Date().toISOString(),
        },
      };

      await dlqTopic.publishMessage(message);
      console.log(`Published failed message to DLQ: ${dlqTopicName}`);
    } catch (error) {
      console.error(`Error publishing to DLQ ${dlqTopicName}:`, error);
      // Don't throw - DLQ is best-effort
    }
  }

  /**
   * Close all subscriptions
   */
  async close(): Promise<void> {
    for (const [name, subscription] of this.subscriptions) {
      try {
        await subscription.close();
        console.log(`Closed subscription: ${name}`);
      } catch (error) {
        console.error(`Error closing subscription ${name}:`, error);
      }
    }
  }
}

export const pubSubService = new PubSubService();
export default pubSubService;
