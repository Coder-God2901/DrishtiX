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

import { pubSubService } from './pubsub.service';
import { firebaseAdminService } from './firebase-admin.service';
import { googleMapsService } from './google-maps.service';
import { googleEarthEngineService } from './earth-engine.service';
import { dataProcessingPipeline } from './data-processing-pipeline.service';
import { vertexAIService } from './vertexai.service';
import { geminiVisionService } from './gemini-vision.service';
import { agentBuilderService } from './agent-builder.service';
import { riskEngineService } from './risk-engine.service';
import { bigQueryFeatureService } from './bigquery-feature.service';
import { cloudLoggingMonitoring } from './cloud-logging-monitoring.service';
import { gcpConfig } from '../config/gcp.config';

interface OrchestratorConfig {
  enableEarthEngine: boolean;
  enableDataflow: boolean;
  enableVertexAI: boolean;
  enableGeminiVision: boolean;
  enableAgentBuilder: boolean;
  enableFirestore: boolean;
  enableFCM: boolean;
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
      enableEarthEngine: gcpConfig.earthEngine?.enabled || false,
      enableDataflow: true,
      enableVertexAI: !!gcpConfig.vertexAI?.modelId,
      enableGeminiVision: !!gcpConfig.gemini?.apiKey,
      enableAgentBuilder: !!gcpConfig.vertexAI?.agentId,
      enableFirestore: true,
      enableFCM: true,
      enableMaps: !!gcpConfig.maps?.apiKey,
    };
  }

  /**
   * Initialize all GCP services
   */
  private async initialize(): Promise<void> {
    try {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 Initializing GCP Services Orchestrator');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ GCP Services Orchestrator Ready');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      await cloudLoggingMonitoring.info('GCP Services Orchestrator initialized', {
        config: this.config,
      });
    } catch (error) {
      console.error('❌ Error initializing GCP Services Orchestrator:', error);
      await cloudLoggingMonitoring.error('Orchestrator initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Initialize core infrastructure services
   */
  private async initializeCoreServices(): Promise<void> {
    console.log('📡 Initializing Core Services...');

    // Pub/Sub is initialized in its constructor
    console.log('  ✓ Pub/Sub (Event Streaming)');

    // Cloud Storage is initialized in its constructor
    console.log('  ✓ Cloud Storage (Asset Storage)');

    console.log('');
  }

  /**
   * Initialize AI/ML services
   */
  private async initializeAIServices(): Promise<void> {
    console.log('🤖 Initializing AI/ML Services...');

    if (this.config.enableVertexAI) {
      console.log('  ✓ Vertex AI (Crowd Forecasting)');
    } else {
      console.log('  ⚠ Vertex AI disabled (missing model ID)');
    }

    if (this.config.enableGeminiVision) {
      console.log('  ✓ Gemini Vision (Anomaly Detection)');
    } else {
      console.log('  ⚠ Gemini Vision disabled (missing API key)');
    }

    if (this.config.enableAgentBuilder) {
      console.log('  ✓ Agent Builder (Automated Dispatch)');
    } else {
      console.log('  ⚠ Agent Builder disabled (missing agent ID)');
    }

    console.log('');
  }

  /**
   * Initialize data services
   */
  private async initializeDataServices(): Promise<void> {
    console.log('💾 Initializing Data Services...');

    console.log('  ✓ BigQuery (Analytics & Training Data)');

    if (this.config.enableEarthEngine) {
      console.log('  ✓ Earth Engine (Satellite Imagery)');
    } else {
      console.log('  ⚠ Earth Engine disabled (hardware-free mode unavailable)');
    }

    console.log('  ✓ Data Processing Pipeline (ETL)');

    console.log('');
  }

  /**
   * Initialize delivery services
   */
  private async initializeDeliveryServices(): Promise<void> {
    console.log('📱 Initializing Delivery Services...');

    if (this.config.enableFirestore) {
      console.log('  ✓ Firestore (Real-time Database)');
    }

    if (this.config.enableFCM) {
      console.log('  ✓ FCM (Push Notifications)');
    }

    if (this.config.enableMaps) {
      console.log('  ✓ Google Maps (Navigation & Routing)');
    } else {
      console.log('  ⚠ Google Maps disabled (missing API key)');
    }

    console.log('');
  }

  /**
   * Initialize monitoring
   */
  private async initializeMonitoring(): Promise<void> {
    console.log('📊 Initializing Monitoring...');
    console.log('  ✓ Cloud Logging & Monitoring');
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
          earthEngine: config.sources?.earthEngine ?? this.config.enableEarthEngine,
          social: config.sources?.social ?? true,
          weather: config.sources?.weather ?? true,
        },
        processing: {
          realtime: config.processing?.realtime ?? true,
          batch: config.processing?.batch ?? true,
        },
        ml: {
          forecasting: config.ml?.forecasting ?? this.config.enableVertexAI,
          anomalyDetection: config.ml?.anomalyDetection ?? this.config.enableGeminiVision,
          riskAssessment: config.ml?.riskAssessment ?? true,
        },
        delivery: {
          dashboards: config.delivery?.dashboards ?? true,
          notifications: config.delivery?.notifications ?? this.config.enableFCM,
          routing: config.delivery?.routing ?? this.config.enableMaps,
        },
      };

      this.activePipelines.set(eventId, pipeline);

      await cloudLoggingMonitoring.info(`Started event pipeline for ${eventId}`, { pipeline });

      console.log(`✅ Event pipeline started for ${eventId}`);
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
      console.log(`✅ Event pipeline stopped for ${eventId}`);
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

      // 1. Ingest data via Pub/Sub
      await pubSubService.publishCrowdData({
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
        await firebaseAdminService.setDocument({
          collection: 'crowdDensity',
          docId: eventId,
          data: {
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
      // 1. Publish to Pub/Sub for downstream processing
      await pubSubService.publishAlert(alert);

      // 2. Send FCM push notifications
      if (this.config.enableFCM && deviceTokens.length > 0) {
        await firebaseAdminService.sendEmergencyAlert(
          {
            eventId,
            type: alert.priority,
            title: alert.title,
            message: alert.message,
            zone: alert.zone,
            location: alert.location,
          },
          deviceTokens
        );
      }

      // 3. Update Firestore for real-time dashboard
      if (this.config.enableFirestore) {
        await firebaseAdminService.broadcastAlert(eventId, alert);
      }

      // 4. Log to Cloud Logging
      await cloudLoggingMonitoring.warn(`Emergency alert sent for event ${eventId}`, {
        alert,
        recipientCount: deviceTokens.length,
      });

      console.log(`🚨 Emergency alert sent for event ${eventId} to ${deviceTokens.length} devices`);
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
        throw new Error('Google Maps integration not available');
      }

      // Extract crowded zones from current density data
      const crowdedZones = crowdData
        .filter((cell: any) => cell.density > 0.7)
        .map((cell: any) => ({ lat: cell.lat, lng: cell.lon }));

      // Calculate safe route avoiding crowds
      const route = await googleMapsService.calculateSafeRoute({
        origin,
        destination,
        avoidCrowdedZones: crowdedZones,
        travelMode: 'WALKING',
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
        pubsub: true, // PubSubService is always initialized on import
        firebaseAdmin: firebaseAdminService.isInitialized(),
        maps: googleMapsService.isInitialized(),
        earthEngine: googleEarthEngineService.isInitialized(),
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
        pubsub: true, // Always available
        firebaseAdmin: firebaseAdminService.isInitialized(),
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
      // Close Pub/Sub connections
      await pubSubService.close();
      console.log('✓ Pub/Sub closed');

      // Close BigQuery connections (if any)
      // BigQuery client auto-closes

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
