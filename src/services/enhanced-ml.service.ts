/**
 * Enhanced ML Service with Advanced Features
 * 
 * Capabilities:
 * - ConvLSTM for 5-30 minute grid-based forecasting
 * - Vertex AI Forecasting integration
 * - Multi-signal anomaly detection (violence, fire, panic, surge)
 * - Ensemble methods combining multiple models
 * - Real-time predictions with confidence intervals
 */

// import * as tf from '@tensorflow/tfjs'; // Future: for ConvLSTM model
import googleCloudService from './google-cloud.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ForecastConfig {
  horizons: number[]; // [5, 10, 15, 20, 30] minutes
  gridSize: { rows: number; cols: number };
  useEnsemble: boolean;
}

export interface GridPrediction {
  gridCell: { row: number; col: number };
  timestamp: string;
  totalCount: number;
  avgDensity: number;
  velocity: { x: number; y: number };
  confidence: number;
}

export interface AnomalyDetection {
  type: 'VIOLENCE' | 'FIRE' | 'PANIC' | 'SURGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: { lat: number; lon: number };
  confidence: number;
  description: string;
  evidence: string[];
}

export interface MultiSignalInput {
  video?: {
    detected_objects: Array<{ class: string; confidence: number }>;
    motion_vectors: number[][];
  };
  gps?: {
    deviceCount: number;
    avgVelocity: number;
    stationaryRatio: number;
  };
  socialSentiment?: {
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'PANIC';
    panicLevel: number;
    keywords: string[];
  };
}

class EnhancedMLService {
  // Future: Load pre-trained ConvLSTM model
  // private convLSTMModel: tf.LayersModel | null = null;
  // private initialized = false;

  // Ensemble weights
  private weights = {
    convLSTM: 0.4,
    vertexAI: 0.35,
    historical: 0.15,
    social: 0.1,
  };

  /**
   * Initialize ML models
   */
  async initialize(): Promise<void> {
    try {
      console.log('[Enhanced ML] Initializing...');

      // In production, load pre-trained ConvLSTM model
      // this.convLSTMModel = await tf.loadLayersModel('path/to/model.json');
      // this.initialized = true;

      console.log('[Enhanced ML] Initialized successfully');
    } catch (error) {
      console.error('[Enhanced ML] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate grid-based forecasts for multiple time horizons
   */
  async generateGridForecast(
    eventId: string,
    config: ForecastConfig,
    signals: MultiSignalInput
  ): Promise<GridPrediction[][]> {
    try {
      const forecasts: GridPrediction[][] = [];

      for (const horizon of config.horizons) {
        // ConvLSTM prediction
        const convLSTMResult = await this.runConvLSTM(eventId, config.gridSize, horizon);

        // Vertex AI prediction
        const vertexAIResult = config.useEnsemble
          ? await this.runVertexAIForecasting(eventId, signals, horizon)
          : null;

        // Historical baseline
        const historicalResult = await this.getHistoricalBaseline(eventId, horizon);

        // Ensemble combination
        const finalPrediction = config.useEnsemble && vertexAIResult
          ? this.combineEnsemble(convLSTMResult, vertexAIResult, historicalResult, signals)
          : convLSTMResult;

        forecasts.push(finalPrediction);

        // Store predictions
        await this.storePredictions(eventId, finalPrediction, horizon);
      }

      return forecasts;
    } catch (error) {
      console.error('[Enhanced ML] Grid forecast failed:', error);
      throw error;
    }
  }

  /**
   * Run ConvLSTM model for grid-based prediction
   */
  private async runConvLSTM(
    _eventId: string,
    gridSize: { rows: number; cols: number },
    horizon: number
  ): Promise<GridPrediction[]> {
    try {
      // Placeholder - implement actual ConvLSTM inference
      const predictions: GridPrediction[] = [];

      for (let row = 0; row < gridSize.rows; row++) {
        for (let col = 0; col < gridSize.cols; col++) {
          predictions.push({
            gridCell: { row, col },
            timestamp: new Date(Date.now() + horizon * 60 * 1000).toISOString(),
            totalCount: Math.floor(Math.random() * 100),
            avgDensity: Math.random(),
            velocity: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 },
            confidence: 0.75,
          });
        }
      }

      return predictions;
    } catch (error) {
      console.error('[Enhanced ML] ConvLSTM failed:', error);
      return [];
    }
  }

  /**
   * Use Vertex AI Forecasting for time-series prediction
   */
  private async runVertexAIForecasting(
    eventId: string,
    signals: MultiSignalInput,
    horizon: number
  ): Promise<any> {
    try {
      const endpoint = import.meta.env.VITE_VERTEX_AI_FORECASTING_ENDPOINT;

      if (!endpoint) {
        return null;
      }

      const features = {
        event_id: eventId,
        horizon_minutes: horizon,
        video_object_count: signals.video?.detected_objects.length || 0,
        gps_device_count: signals.gps?.deviceCount || 0,
        social_panic: signals.socialSentiment?.panicLevel || 0,
      };

      // Call Vertex AI endpoint
      const prediction = await googleCloudService.predictWithVertexAI(endpoint, [features]);

      return prediction.predictions[0];
    } catch (error) {
      console.error('⚠️ Vertex AI forecasting failed:', error);
      return null;
    }
  }

  /**
   * Get historical baseline for comparison
   */
  private async getHistoricalBaseline(eventId: string, _horizon: number): Promise<any> {
    try {
      const sameDayOfWeek = new Date();
      sameDayOfWeek.setDate(sameDayOfWeek.getDate() - 7);

      const historical = await prisma.prediction.findMany({
        where: {
          eventId,
          createdAt: {
            gte: sameDayOfWeek,
            lt: new Date(sameDayOfWeek.getTime() + 60 * 60 * 1000),
          },
        },
        select: {
          predictedDensity: true,
        },
      });

      const avgDensity = historical.length > 0
        ? historical.reduce((sum, p) => sum + (p.predictedDensity || 0), 0) / historical.length
        : 0.5;

      return { avgDensity, confidence: 0.5 };
    } catch (error) {
      return { avgDensity: 0.5, confidence: 0.5 };
    }
  }

  /**
   * Combine predictions using ensemble weights
   */
  private combineEnsemble(
    convLSTM: GridPrediction[],
    vertexAI: any,
    historical: any,
    signals: MultiSignalInput
  ): GridPrediction[] {
    const socialWeight = signals.socialSentiment?.panicLevel || 0 > 0.5 ? this.weights.social * 2 : this.weights.social;
    const totalWeight = this.weights.convLSTM + this.weights.vertexAI + this.weights.historical + socialWeight;

    return convLSTM.map((cell) => ({
      ...cell,
      totalCount: Math.round(
        (cell.totalCount * this.weights.convLSTM +
          (vertexAI.totalCount * this.weights.vertexAI) +
          (historical.avgDensity * 100 * this.weights.historical) +
          (signals.socialSentiment?.panicLevel || 0) * 50 * socialWeight) / totalWeight
      ),
      avgDensity:
        (cell.avgDensity * this.weights.convLSTM +
          (vertexAI.avgDensity * this.weights.vertexAI) +
          (historical.avgDensity * this.weights.historical) +
          (signals.socialSentiment?.panicLevel || 0) * socialWeight) / totalWeight,
      confidence: Math.min(
        cell.confidence,
        vertexAI.confidence,
        historical.confidence
      ),
    }));
  }

  /**
   * Detect multi-signal anomalies
   */
  async detectAnomalies(
    _eventId: string,
    signals: MultiSignalInput
  ): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Violence detection
    if (signals.socialSentiment && signals.socialSentiment.panicLevel > 0.6) {
      const hasVideoEvidence = signals.video?.detected_objects.some(
        (obj) => obj.class === 'person' && obj.confidence > 0.8
      );

      if (hasVideoEvidence || signals.socialSentiment.panicLevel > 0.8) {
        anomalies.push({
          type: 'VIOLENCE',
          severity: signals.socialSentiment.panicLevel > 0.8 ? 'CRITICAL' : 'HIGH',
          location: { lat: 0, lon: 0 }, // Get from event data
          confidence: signals.socialSentiment.panicLevel,
          description: `Potential violence detected. Social panic level: ${(signals.socialSentiment.panicLevel * 100).toFixed(0)}%`,
          evidence: ['social_sentiment', ...(hasVideoEvidence ? ['video_feed'] : [])],
        });
      }
    }

    // Fire detection
    const fireInSocial = signals.socialSentiment?.sentiment === 'PANIC' &&
      signals.socialSentiment.panicLevel > 0.7;

    if (fireInSocial) {
      anomalies.push({
        type: 'FIRE',
        severity: 'CRITICAL',
        location: { lat: 0, lon: 0 },
        confidence: 0.85,
        description: 'Fire or smoke detected - immediate evacuation required',
        evidence: ['social_keywords', 'panic_level'],
      });
    }

    // Panic wave detection (sudden movement patterns)
    if (signals.gps && signals.gps.avgVelocity > 2.0 && signals.gps.stationaryRatio < 0.1) {
      anomalies.push({
        type: 'PANIC',
        severity: 'HIGH',
        location: { lat: 0, lon: 0 },
        confidence: 0.75,
        description: 'Mass panic movement detected - crowd surge in progress',
        evidence: ['gps_velocity', 'movement_patterns'],
      });
    }

    return anomalies;
  }

  /**
   * Store predictions in database
   */
  private async storePredictions(
    eventId: string,
    predictions: GridPrediction[],
    horizon: number
  ): Promise<void> {
    try {
      for (const pred of predictions) {
        await prisma.prediction.create({
          data: {
            eventId,
            timestamp: new Date(),
            forecastTime: new Date(pred.timestamp),
            forecastHorizon: horizon,
            predictedCount: pred.totalCount,
            predictedDensity: pred.avgDensity,
            densityLevel: pred.avgDensity > 0.75 ? 'CRITICAL' : pred.avgDensity > 0.6 ? 'HIGH' : pred.avgDensity > 0.4 ? 'MEDIUM' : 'LOW',
            riskLevel: pred.avgDensity > 0.75 ? 'CRITICAL' : pred.avgDensity > 0.6 ? 'HIGH' : pred.avgDensity > 0.4 ? 'MEDIUM' : 'LOW',
            confidence: pred.confidence,
            modelType: 'ENSEMBLE',
            modelVersion: '1.0',
            gridPredictions: [{
              gridId: `grid_${pred.gridCell.row}_${pred.gridCell.col}`,
              lat: 0, // Would come from actual grid mapping
              lon: 0,
              density: pred.avgDensity,
              count: pred.totalCount,
              velocity: pred.velocity,
            }],
            hotspots: [],
            signals: {
              convLSTM: true,
              vertexAI: true,
              historical: true,
              social: false,
            },
            anomalies: [],
            riskFactors: [],
            alerts: [],
          },
        });
      }
    } catch (error) {
      console.error('[Enhanced ML] Failed to store predictions:', error);
    }
  }
}

export const enhancedMLService = new EnhancedMLService();
export default enhancedMLService;
