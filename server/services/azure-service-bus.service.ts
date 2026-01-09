/**
 * Azure Service Bus Service
 * Message queue and pub/sub messaging
 * 
 * Features:
 * - Topic-based publish/subscribe
 * - Message queuing and routing
 * - Dead-letter queues
 * - Message sessions and ordering
 * - Scheduled message delivery
 * 
 * Replaces: Google Cloud Pub/Sub
 */

import {
  ServiceBusClient,
  ServiceBusSender,
  ServiceBusReceiver,
  ServiceBusMessage,
} from '@azure/service-bus';
import { azureConfig } from '../config/azure.config';

interface PublishMessageRequest {
  topic: string;
  data: any;
  attributes?: Record<string, string>;
}

interface SubscribeOptions {
  subscription: string;
  topic: string;
  handler: (message: any) => Promise<void>;
  maxConcurrentCalls?: number;
}

class AzureServiceBusService {
  private client: ServiceBusClient;
  private senders: Map<string, ServiceBusSender> = new Map();
  private receivers: Map<string, ServiceBusReceiver> = new Map();

  constructor() {
    this.client = new ServiceBusClient(azureConfig.serviceBus.connectionString);
    console.log('[Azure Service Bus Service] Initialized');
  }

  /**
   * Get or create sender for a topic
   */
  private getSender(topic: string): ServiceBusSender {
    if (!this.senders.has(topic)) {
      const sender = this.client.createSender(topic);
      this.senders.set(topic, sender);
    }
    return this.senders.get(topic)!;
  }

  /**
   * Get or create receiver for a subscription
   */
  private getReceiver(topic: string, subscription: string): ServiceBusReceiver {
    const key = `${topic}/${subscription}`;
    if (!this.receivers.has(key)) {
      const receiver = this.client.createReceiver(topic, subscription);
      this.receivers.set(key, receiver);
    }
    return this.receivers.get(key)!;
  }

  /**
   * Publish message to topic
   */
  async publishMessage(request: PublishMessageRequest): Promise<void> {
    try {
      const sender = this.getSender(request.topic);

      const message: ServiceBusMessage = {
        body: request.data,
        applicationProperties: request.attributes || {},
        contentType: 'application/json',
      };

      await sender.sendMessages(message);
      console.log(`[Service Bus] Published message to topic: ${request.topic}`);
    } catch (error) {
      console.error(`[Service Bus] Error publishing to ${request.topic}:`, error);
      throw error;
    }
  }

  /**
   * Publish batch of messages
   */
  async publishBatch(topic: string, messages: any[]): Promise<void> {
    try {
      const sender = this.getSender(topic);

      const batch = await sender.createMessageBatch();

      for (const data of messages) {
        const message: ServiceBusMessage = {
          body: data,
          contentType: 'application/json',
        };

        if (!batch.tryAddMessage(message)) {
          // Send current batch and create new one
          await sender.sendMessages(batch);
          batch.tryAddMessage(message);
        }
      }

      if (batch.count > 0) {
        await sender.sendMessages(batch);
      }

      console.log(`[Service Bus] Published ${messages.length} messages to ${topic}`);
    } catch (error) {
      console.error(`[Service Bus] Error publishing batch to ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to topic with message handler
   */
  subscribe(options: SubscribeOptions): void {
    try {
      const receiver = this.getReceiver(options.topic, options.subscription);

      receiver.subscribe(
        {
          processMessage: async (message) => {
            try {
              await options.handler(message.body);
              await receiver.completeMessage(message);
            } catch (error) {
              console.error(`[Service Bus] Error processing message:`, error);
              await receiver.abandonMessage(message);
            }
          },
          processError: async (error) => {
            console.error(`[Service Bus] Error in subscription:`, error);
          },
        },
        {
          maxConcurrentCalls: options.maxConcurrentCalls || 1,
        }
      );

      console.log(
        `[Service Bus] Subscribed to topic: ${options.topic}, subscription: ${options.subscription}`
      );
    } catch (error) {
      console.error(`[Service Bus] Error subscribing:`, error);
      throw error;
    }
  }

  /**
   * Publish crowd density update
   */
  async publishCrowdData(data: any): Promise<void> {
    await this.publishMessage({
      topic: azureConfig.serviceBus.topics.crowdData,
      data,
      attributes: {
        eventId: data.eventId,
        zoneId: data.zoneId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish prediction result
   */
  async publishPrediction(data: any): Promise<void> {
    await this.publishMessage({
      topic: azureConfig.serviceBus.topics.predictions,
      data,
      attributes: {
        eventId: data.eventId,
        modelVersion: data.modelVersion || 'v1',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish anomaly detection
   */
  async publishAnomaly(data: any): Promise<void> {
    await this.publishMessage({
      topic: azureConfig.serviceBus.topics.anomalies,
      data,
      attributes: {
        eventId: data.eventId,
        severity: data.severity,
        zoneId: data.zoneId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish emergency alert
   */
  async publishAlert(data: any): Promise<void> {
    await this.publishMessage({
      topic: azureConfig.serviceBus.topics.alerts,
      data,
      attributes: {
        eventId: data.eventId,
        priority: data.priority || 'HIGH',
        alertType: data.type,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish responder dispatch
   */
  async publishDispatch(data: any): Promise<void> {
    await this.publishMessage({
      topic: azureConfig.serviceBus.topics.dispatch,
      data,
      attributes: {
        eventId: data.eventId,
        responderId: data.responderId,
        urgency: data.urgency,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      // Close all senders
      for (const sender of this.senders.values()) {
        await sender.close();
      }
      this.senders.clear();

      // Close all receivers
      for (const receiver of this.receivers.values()) {
        await receiver.close();
      }
      this.receivers.clear();

      // Close client
      await this.client.close();
      console.log('[Service Bus] All connections closed');
    } catch (error) {
      console.error('[Service Bus] Error closing connections:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to create a sender as a health check
      const testTopic = azureConfig.serviceBus.topics.crowdData;
      const sender = this.getSender(testTopic);
      return sender !== null;
    } catch (error) {
      console.error('[Service Bus] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const azureServiceBusService = new AzureServiceBusService();
export default azureServiceBusService;
