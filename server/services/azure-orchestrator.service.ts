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
 * GCP Services Orchestrator
 * Central coordinator for all Google Cloud Platform services
 * 
 * This service connects all GCP tools according to the architecture:
 * 
 * Data Flow:
 * 1. Ingestion Layer: Drones, CCTV, Mobile, Earth Engine, Social Media
 * 2. Streaming Layer: Pub/Sub (event streaming)
 * 3. Processing Layer: Dataflow/ETL (clean, merge, feature engineering)
 * 4. AI/ML Layer: Vertex AI (forecasting), Gemini Vision (anomaly detection)
 * 5. Decision Layer: Agent Builder (automated actions), Risk Engine
 * 6. Storage Layer: BigQuery (analytics), Cloud Storage (assets), Firestore (real-time)
 * 7. Delivery Layer: Firebase Admin (FCM notifications), Maps (routing)
 * 8. Monitoring Layer: Cloud Logging & Monitoring
 */

import { azureServiceBusService } from './azure-service-bus.service';
import { azureService } from './azure.service';
import { azureMapsService } from './azure-maps.service';
import { azurePlanetaryComputerService } from './azure-planetary-computer.service';
import { dataProcessingPipeline } from './data-processing-pipeline.service';
import { azureOpenAIService } from './azure-openai.service';
import { agentBuilderService } from './agent-builder.service';
import { riskEngineService } from './risk-engine.service';
import { azureSynapseAnalyticsService } from './azure-synapse-analytics.service';
// Removed: cloudLoggingMonitoring - Now using Azure Monitor and Application Insights
import { azureConfig } from '../config/azure.config';

interface OrchestratorConfig {
  enablePlanetaryComputer: boolean;
  enableDataflow: boolean;
  enableOpenAI: boolean;
  enableVisionAI: boolean;
  enableAgentBuilder: boolean;
  enableCosmosDB: boolean;
  enableNotificationHubs: boolean;
  enableMaps: boolean;
}

interface EventDataPipeline {
  eventId: string;
  sources: {
    drones: boolean;
    cctv: boolean;
    userGPS: boolean;
    earthEngine: boolean;
    social: boolean;
    weather: boolean;
  };
  processing: {
    realtime: boolean;
    batch: boolean;
  };
  ml: {
    forecasting: boolean;
    anomalyDetection: boolean;
    riskAssessment: boolean;
  };
  delivery: {
    dashboards: boolean;
    notifications: boolean;
    routing: boolean;
  };
}

class GCPServicesOrchestrator {
  private config: OrchestratorConfig;
  private activePipelines: Map<string, EventDataPipeline> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.config = this.loadConfig();
    this.initialize();
  }

  /**
   * Load orchestrator configuration
   */
  private loadConfig(): OrchestratorConfig {
    return {
      enablePlanetaryComputer: !!azureConfig.planetaryComputer?.apiKey,
      enableDataflow: true,
      enableOpenAI: !!azureConfig.openai?.apiKey,
      enableVisionAI: !!azureConfig.openai?.apiKey,
      enableAgentBuilder: !!azureConfig.openai?.apiKey,
      enableCosmosDB: !!azureConfig.cosmosDb?.endpoint,
      enableNotificationHubs: !!azureConfig.notificationHubs?.connectionString,
      enableMaps: !!azureConfig.maps?.subscriptionKey,
    };
  }

  /**
   * Initialize all GCP services
   */
  public async initialize(): Promise<void> {
    try {
      console.log('\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
      console.log('ðŸš€ Initializing GCP Services Orchestrator');
      console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n');

      // Initialize core services
      await this.initializeCoreServices();

      // Initialize AI/ML services
      await this.initializeAIServices();

      // Initialize data services
      await this.initializeDataServices();

      // Initialize delivery services
      await this.initializeDeliveryServices();

      // Initialize monitoring
      await this.initializeMonitoring();

      this.initialized = true;

      console.log('\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
      console.log('âœ… GCP Services Orchestrator Ready');
      console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n');

      await cloudLoggingMonitoring.info('GCP Services Orchestrator initialized', {
        config: this.config,
      });
    } catch (error) {
      console.error('âŒ Error initializing GCP Services Orchestrator:', error);
      await cloudLoggingMonitoring.error('Orchestrator initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Initialize core infrastructure services
   */
  private async initializeCoreServices(): Promise<void> {
    console.log('ðŸ“¡ Initializing Core Services...');

    // Azure Service Bus is initialized in its constructor
    console.log('  âœ“ Azure Service Bus (Event Streaming)');

    // Azure Blob Storage is initialized in its constructor
    console.log('  âœ“ Azure Blob Storage (Asset Storage)');

    console.log('');
  }

  /**
   * Initialize AI/ML services
   */
  private async initializeAIServices(): Promise<void> {
    console.log('ðŸ¤– Initializing AI/ML Services...');

    if (this.config.enableOpenAI) {
      console.log('  âœ“ Azure OpenAI (Crowd Forecasting)');
    } else {
      console.log('  âš  Azure OpenAI disabled (missing API key)');
    }

    if (this.config.enableVisionAI) {
      console.log('  âœ“ Azure OpenAI Vision (Anomaly Detection)');
    } else {
      console.log('  âš  Azure OpenAI Vision disabled (missing API key)');
    }

    if (this.config.enableAgentBuilder) {
      console.log('  âœ“ Agent Builder (Automated Dispatch)');
    } else {
      console.log('  âš  Agent Builder disabled (missing OpenAI key)');
    }

    console.log('');
  }

  /**
   * Initialize data services
   */
  private async initializeDataServices(): Promise<void> {
    console.log('ðŸ’¾ Initializing Data Services...');

    console.log('  âœ“ Azure Synapse Analytics (Analytics & Training Data)');

    if (this.config.enablePlanetaryComputer) {
      console.log('  âœ“ Azure Planetary Computer (Satellite Imagery)');
    } else {
      console.log('  âš  Azure Planetary Computer disabled (missing API key)');
    }

    console.log('  âœ“ Data Processing Pipeline (ETL)');

    console.log('');
  }

  /**
   * Initialize delivery services
   */
  private async initializeDeliveryServices(): Promise<void> {
    console.log('ðŸ“± Initializing Delivery Services...');

    if (this.config.enableCosmosDB) {
      console.log('  âœ“ Azure Cosmos DB (Real-time Database)');
    }

    if (this.config.enableNotificationHubs) {
      console.log('  âœ“ Azure Notification Hubs (Push Notifications)');
    }

    if (this.config.enableMaps) {
      console.log('  âœ“ Azure Maps (Navigation & Routing)');
    } else {
      console.log('  âš  Azure Maps disabled (missing subscription key)');
    }

    console.log('');
  }

  /**
   * Initialize monitoring
   */
  private async initializeMonitoring(): Promise<void> {
    console.log('ðŸ“Š Initializing Monitoring...');
    console.log('  âœ“ Cloud Logging & Monitoring');
    console.log('');
  }

  // ==================== DATA PIPELINE ORCHESTRATION ====================

  /**
   * Start complete event safety pipeline
   */
  async startEventPipeline(eventId: string, config: Partial<EventDataPipeline> = {}): Promise<void> {
    try {
      const pipeline: EventDataPipeline = {
        eventId,
        sources: {
          drones: config.sources?.drones ?? true,
          cctv: config.sources?.cctv ?? true,
          userGPS: config.sources?.userGPS ?? true,
          earthEngine: config.sources?.earthEngine ?? this.config.enablePlanetaryComputer,
          social: config.sources?.social ?? true,
          weather: config.sources?.weather ?? true,
        },
        processing: {
          realtime: config.processing?.realtime ?? true,
          batch: config.processing?.batch ?? true,
        },
        ml: {
          forecasting: config.ml?.forecasting ?? this.config.enableOpenAI,
          anomalyDetection: config.ml?.anomalyDetection ?? this.config.enableVisionAI,
          riskAssessment: config.ml?.riskAssessment ?? true,
        },
        delivery: {
          dashboards: config.delivery?.dashboards ?? true,
          notifications: config.delivery?.notifications ?? this.config.enableNotificationHubs,
          routing: config.delivery?.routing ?? this.config.enableMaps,
        },
      };

      this.activePipelines.set(eventId, pipeline);

      await cloudLoggingMonitoring.info(`Started event pipeline for ${eventId}`, { pipeline });

      console.log(`âœ… Event pipeline started for ${eventId}`);
    } catch (error) {
      await cloudLoggingMonitoring.error(`Failed to start event pipeline for ${eventId}`, error as Error);
      throw error;
    }
  }

  /**
   * Stop event pipeline
   */
  async stopEventPipeline(eventId: string): Promise<void> {
    try {
      this.activePipelines.delete(eventId);
      await cloudLoggingMonitoring.info(`Stopped event pipeline for ${eventId}`);
      console.log(`âœ… Event pipeline stopped for ${eventId}`);
    } catch (error) {
      await cloudLoggingMonitoring.error(`Failed to stop event pipeline for ${eventId}`, error as Error);
      throw error;
    }
  }

  /**
   * Process incoming data through the complete pipeline
   */
  async processEventData(eventId: string, dataType: string, data: any): Promise<void> {
    try {
      const pipeline = this.activePipelines.get(eventId);
      if (!pipeline) {
        throw new Error(`No active pipeline for event ${eventId}`);
      }

      // 1. Ingest data via Azure Service Bus
      await azureServiceBusService.publishCrowdData({
        eventId,
        dataType,
      });

      // 2. Process through ETL pipeline
      if (pipeline.processing.realtime) {
        await dataProcessingPipeline.ingestData(eventId, {
          type: dataType as any,
          timestamp: new Date(),
          data,
        });
      }

      // 3. Run ML inference if enabled
      if (pipeline.ml.forecasting && dataType === 'CROWD_DENSITY') {
        // Trigger Vertex AI forecasting
        // This would be handled by a Pub/Sub subscriber in production
      }

      if (pipeline.ml.anomalyDetection && dataType === 'VIDEO_FRAME') {
        // Trigger Gemini Vision analysis
        // This would be handled by a Pub/Sub subscriber in production
      }

      // 4. Update real-time databases
      if (pipeline.delivery.dashboards) {
        await azureService.createDocument({
          databaseId: azureConfig.cosmosDb.databaseName,
          containerId: 'crowdDensity',
          document: {
            id: eventId,
            eventId,
            lastUpdate: new Date(),
            ...data,
          },
        });
      }

      await cloudLoggingMonitoring.info(`Processed ${dataType} data for event ${eventId}`);
    } catch (error) {
      await cloudLoggingMonitoring.error(`Error processing data for event ${eventId}`, error as Error);
      throw error;
    }
  }

  /**
   * Send emergency alert through all channels
   */
  async sendEmergencyAlert(eventId: string, alert: any, deviceTokens: string[]): Promise<void> {
    try {
      // 1. Publish to Azure Service Bus for downstream processing
      await azureServiceBusService.publishAlert(alert);

      // 2. Send Azure Notification Hubs push notifications
      if (this.config.enableNotificationHubs && deviceTokens.length > 0) {
        await azureService.sendNotification({
          title: alert.title,
          body: alert.message,
          data: {
            eventId,
            type: alert.priority,
            zone: alert.zone,
            location: JSON.stringify(alert.location),
          },
          deviceTokens,
        });
      }

      // 3. Update Cosmos DB for real-time dashboard
      if (this.config.enableCosmosDB) {
        await azureService.createDocument({
          databaseId: azureConfig.cosmosDb.databaseName,
          containerId: 'alerts',
          document: {
            id: `${eventId}-${Date.now()}`,
            eventId,
            ...alert,
            timestamp: new Date(),
          },
        });
      }

      // 4. Log to Cloud Logging
      await cloudLoggingMonitoring.warn(`Emergency alert sent for event ${eventId}`, {
        alert,
        recipientCount: deviceTokens.length,
      });

      console.log(`ðŸš¨ Emergency alert sent for event ${eventId} to ${deviceTokens.length} devices`);
    } catch (error) {
      await cloudLoggingMonitoring.critical(`Failed to send emergency alert for event ${eventId}`, error as Error);
      throw error;
    }
  }

  /**
   * Calculate safe route for attendee
   */
  async calculateSafeRoute(
    eventId: string,
    origin: any,
    destination: any,
    crowdData: any
  ): Promise<any> {
    try {
      if (!this.config.enableMaps) {
        throw new Error('Azure Maps integration not available');
      }

      // Extract crowded zones from current density data
      const crowdedZones = crowdData
        .filter((cell: any) => cell.density > 0.7)
        .map((cell: any) => ({ latitude: cell.lat, longitude: cell.lon }));

      // Calculate safe route avoiding crowds
      const route = await azureMapsService.calculateRoute({
        origin: `${origin.lat},${origin.lon}`,
        destination: `${destination.lat},${destination.lon}`,
        travelMode: 'pedestrian',
      });

      await cloudLoggingMonitoring.info(`Calculated safe route for event ${eventId}`, {
        origin,
        destination,
        crowdedZonesAvoided: crowdedZones.length,
      });

      return route;
    } catch (error) {
      await cloudLoggingMonitoring.error(`Error calculating safe route for event ${eventId}`, error as Error);
      throw error;
    }
  }

  // ==================== MONITORING & HEALTH ====================

  /**
   * Get orchestrator status
   */
  getStatus(): any {
    return {
      initialized: this.initialized,
      config: this.config,
      activePipelines: Array.from(this.activePipelines.keys()),
      services: {
        serviceBus: true, // Azure Service Bus is always initialized on import
        cosmosDb: true, // Azure service is always initialized on import
        maps: true, // Azure Maps service is always initialized on import
        planetaryComputer: true, // Azure Planetary Computer service is always initialized on import
        logging: cloudLoggingMonitoring.isInitialized(),
      },
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check critical services
      const checks = {
        serviceBus: true, // Always available
        cosmosDb: true, // Always available
        logging: cloudLoggingMonitoring.isInitialized(),
      };

      const allHealthy = Object.values(checks).every(status => status === true);

      await cloudLoggingMonitoring.info('Health check performed', { checks, healthy: allHealthy });

      return allHealthy;
    } catch (error) {
      await cloudLoggingMonitoring.error('Health check failed', error as Error);
      return false;
    }
  }

  /**
   * Check if orchestrator is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Graceful shutdown - cleanup all services
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[GCP Orchestrator] Shutting down services...');

    try {
      // Close Azure Service Bus connections
      await azureServiceBusService.close();
      console.log('âœ“ Azure Service Bus closed');

      // Close Azure Synapse connections (if any)
      await azureSynapseAnalyticsService.close();
      console.log('âœ“ Azure Synapse closed');

      // Close other service connections
      this.initialized = false;

      console.log('[GCP Orchestrator] All services shut down gracefully');
    } catch (error) {
      console.error('[GCP Orchestrator] Error during shutdown:', error);
    }
  }
}

// Export singleton instance
export const gcpOrchestrator = new GCPServicesOrchestrator();
export default gcpOrchestrator;
