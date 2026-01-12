/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
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
 * Azure Service Bus Messaging Service
 * Real-time event streaming and message queue with advanced error handling
 * Replaces Google Cloud Pub/Sub with Azure Service Bus
 */

import { ServiceBusClient, ServiceBusMessage, ServiceBusSender, ServiceBusReceiver, ServiceBusReceivedMessage } from '@azure/service-bus';
import { azureConfig } from '../config/azure.config';

export interface ServiceBusMessageData<T = any> {
  id: string;
  data: T;
  timestamp: Date;
  properties?: Record<string, any>;
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

// Topic names (now queue names for Azure Service Bus)
const QUEUE_NAMES = {
  crowdData: 'crowd-data',
  predictions: 'predictions',
  anomalies: 'anomalies',
  alerts: 'alerts',
  dispatch: 'dispatch',
  riskEngine: 'risk-engine',
  analytics: 'analytics',
  socialMedia: 'social-media',
  recommendations: 'recommendations',
  feedback: 'recommendation-feedback',
  emergencyAlerts: 'emergency-alerts',
};

class AzureServiceBusMessagingService {
  private client: ServiceBusClient | null;
  private senders: Map<string, ServiceBusSender>;
  private receivers: Map<string, ServiceBusReceiver>;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private publishMetrics: Map<string, { success: number; failure: number }>;
  private messageHandlers: Map<string, ((message: any) => Promise<void>)[]>;

  constructor() {
    const connectionString = azureConfig.serviceBus?.connectionString || process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;

    if (!connectionString) {
      console.warn('[Azure Service Bus] Connection string not configured, service disabled');
      this.client = null;
      this.senders = new Map();
      this.receivers = new Map();
      this.circuitBreakers = new Map();
      this.publishMetrics = new Map();
      this.messageHandlers = new Map();
      return;
    }

    this.client = new ServiceBusClient(connectionString);
    this.senders = new Map();
    this.receivers = new Map();
    this.circuitBreakers = new Map();
    this.publishMetrics = new Map();
    this.messageHandlers = new Map();

    console.log('✓ Azure Service Bus Messaging Service initialized');
  }

  /**
   * Get or create sender for a queue
   */
  private async getSender(queueName: string): Promise<ServiceBusSender> {
    if (!this.client) {
      throw new Error('Azure Service Bus not configured');
    }

    if (!this.senders.has(queueName)) {
      const sender = this.client.createSender(queueName);
      this.senders.set(queueName, sender);
    }
    return this.senders.get(queueName)!;
  }

  /**
   * Get or create receiver for a queue
   */
  private async getReceiver(queueName: string): Promise<ServiceBusReceiver> {
    if (!this.client) {
      throw new Error('Azure Service Bus not configured');
    }

    if (!this.receivers.has(queueName)) {
      const receiver = this.client.createReceiver(queueName, {
        receiveMode: 'peekLock',
      });
      this.receivers.set(queueName, receiver);
    }
    return this.receivers.get(queueName)!;
  }

  /**
   * Publish message to a queue with retry logic and circuit breaker
   */
  private async publish<T>(
    queueName: string,
    data: T,
    properties?: Record<string, any>,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<string> {
    if (!this.client) {
      console.warn(`[Azure Service Bus] Skipping publish to ${queueName} - service not configured`);
      return 'mock-message-id';
    }

    // Check circuit breaker
    if (this.isCircuitOpen(queueName)) {
      throw new Error(`Circuit breaker OPEN for queue: ${queueName}`);
    }

    const messageId = this.generateMessageId();
    const message: ServiceBusMessage = {
      messageId,
      body: data,
      applicationProperties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const sender = await this.getSender(queueName);

      // Publish with timeout
      await Promise.race([
        sender.sendMessages(message),
        this.timeout(PUBLISH_TIMEOUT),
      ]);

      this.recordSuccess(queueName);
      return messageId;
    } catch (error) {
      this.recordFailure(queueName);

      // Retry logic
      if (retryConfig.maxRetries > 0) {
        const delay = Math.min(
          retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, DEFAULT_RETRY_CONFIG.maxRetries - retryConfig.maxRetries),
          retryConfig.maxDelay
        );

        await this.sleep(delay);

        return this.publish(queueName, data, properties, {
          ...retryConfig,
          maxRetries: retryConfig.maxRetries - 1,
        });
      }

      console.error(`[Azure Service Bus] Failed to publish to ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to messages from a queue
   */
  async subscribe<T>(
    queueName: string,
    handler: (message: ServiceBusMessageData<T>) => Promise<void>
  ): Promise<void> {
    if (!this.client) {
      console.warn(`[Azure Service Bus] Skipping subscribe to ${queueName} - service not configured`);
      return;
    }

    const receiver = await this.getReceiver(queueName);

    const messageHandler = async (receivedMessage: ServiceBusReceivedMessage) => {
      try {
        const messageData: ServiceBusMessageData<T> = {
          id: String(receivedMessage.messageId) || this.generateMessageId(),
          data: receivedMessage.body,
          timestamp: new Date(receivedMessage.enqueuedTimeUtc || Date.now()),
          properties: receivedMessage.applicationProperties,
        };

        await handler(messageData);

        // Complete the message (remove from queue)
        await receiver.completeMessage(receivedMessage);
      } catch (error: any) {
        console.error(`[Azure Service Bus] Error processing message from ${queueName}:`, error);

        // Abandon message (return to queue for redelivery)
        await receiver.abandonMessage(receivedMessage);
      }
    };

    const errorHandler = async (args: { error: Error }) => {
      console.error(`[Azure Service Bus] Error in receiver for ${queueName}:`, args.error);
    };

    receiver.subscribe({
      processMessage: messageHandler,
      processError: errorHandler,
    });

    console.log(`[Azure Service Bus] Subscribed to queue: ${queueName}`);
  }

  /**
   * Publish crowd data
   */
  async publishCrowdData(data: any): Promise<string> {
    return this.publish(QUEUE_NAMES.crowdData, data, {
      type: 'crowd-data',
      source: 'video-analytics',
    });
  }

  /**
   * Publish prediction
   */
  async publishPrediction(prediction: any): Promise<string> {
    return this.publish(QUEUE_NAMES.predictions, prediction, {
      type: 'prediction',
      source: 'ml-service',
    });
  }

  /**
   * Publish anomaly detection
   */
  async publishAnomaly(anomaly: any): Promise<string> {
    return this.publish(QUEUE_NAMES.anomalies, anomaly, {
      type: 'anomaly',
      priority: anomaly.severity === 'CRITICAL' ? 'high' : 'normal',
    });
  }

  /**
   * Publish alert
   */
  async publishAlert(alert: any): Promise<string> {
    return this.publish(QUEUE_NAMES.alerts, alert, {
      type: 'alert',
      priority: alert.priority || 'medium',
    });
  }

  /**
   * Publish dispatch command
   */
  async publishDispatch(dispatch: any): Promise<string> {
    return this.publish(QUEUE_NAMES.dispatch, dispatch, {
      type: 'dispatch-command',
      priority: 'high',
    });
  }

  /**
   * Publish analytics data
   */
  async publishAnalytics(analytics: any): Promise<string> {
    return this.publish(QUEUE_NAMES.analytics, analytics, {
      type: 'analytics',
    });
  }

  /**
   * Publish message to any queue
   */
  async publishMessage(queueName: string, data: any, properties?: Record<string, any>): Promise<string> {
    return this.publish(queueName, data, properties);
  }

  /**
   * Subscribe to crowd data
   */
  onCrowdData(handler: (message: any) => Promise<void>): void {
    this.subscribe(QUEUE_NAMES.crowdData, handler);
  }

  /**
   * Subscribe to predictions
   */
  onPredictions(handler: (message: any) => Promise<void>): void {
    this.subscribe(QUEUE_NAMES.predictions, handler);
  }

  /**
   * Subscribe to anomalies
   */
  onAnomalies(handler: (message: any) => Promise<void>): void {
    this.subscribe(QUEUE_NAMES.anomalies, handler);
  }

  /**
   * Subscribe to risk engine events
   */
  onRiskEngine(handler: (message: any) => Promise<void>): void {
    this.subscribe(QUEUE_NAMES.riskEngine, handler);
  }

  /**
   * Get queue metrics
   */
  getMetrics(queueName: string) {
    return this.publishMetrics.get(queueName) || { success: 0, failure: 0 };
  }

  /**
   * Close all connections
   */
  async shutdown(): Promise<void> {
    if (!this.client) {
      return;
    }

    console.log('[Azure Service Bus] Shutting down...');

    // Close all senders
    for (const [name, sender] of this.senders.entries()) {
      try {
        await sender.close();
        console.log(`[Azure Service Bus] Closed sender: ${name}`);
      } catch (error) {
        console.error(`[Azure Service Bus] Error closing sender ${name}:`, error);
      }
    }

    // Close all receivers
    for (const [name, receiver] of this.receivers.entries()) {
      try {
        await receiver.close();
        console.log(`[Azure Service Bus] Closed receiver: ${name}`);
      } catch (error) {
        console.error(`[Azure Service Bus] Error closing receiver ${name}:`, error);
      }
    }

    // Close client
    try {
      await this.client.close();
      console.log('[Azure Service Bus] Client closed');
    } catch (error) {
      console.error('[Azure Service Bus] Error closing client:', error);
    }
  }

  // Circuit Breaker Implementation
  private isCircuitOpen(queueName: string): boolean {
    const breaker = this.circuitBreakers.get(queueName);
    if (!breaker) return false;

    if (breaker.state === 'OPEN') {
      if (Date.now() - breaker.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
        breaker.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }

    return false;
  }

  private recordSuccess(queueName: string): void {
    const breaker = this.circuitBreakers.get(queueName) || {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED' as const,
    };

    breaker.failures = 0;
    breaker.state = 'CLOSED';
    this.circuitBreakers.set(queueName, breaker);

    const metrics = this.publishMetrics.get(queueName) || { success: 0, failure: 0 };
    metrics.success++;
    this.publishMetrics.set(queueName, metrics);
  }

  private recordFailure(queueName: string): void {
    const breaker = this.circuitBreakers.get(queueName) || {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED' as const,
    };

    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      breaker.state = 'OPEN';
      console.warn(`[Azure Service Bus] Circuit breaker OPENED for queue: ${queueName}`);
    }

    this.circuitBreakers.set(queueName, breaker);

    const metrics = this.publishMetrics.get(queueName) || { success: 0, failure: 0 };
    metrics.failure++;
    this.publishMetrics.set(queueName, metrics);
  }

  // Utility Methods
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), ms)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const azureServiceBusMessagingService = new AzureServiceBusMessagingService();

// Backward compatibility alias
export const pubSubService = azureServiceBusMessagingService;

export default azureServiceBusMessagingService;
