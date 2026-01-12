/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * LSTM Integration Service
 * 
 * Helper service for LSTM model integration with real-time zone data
 */

import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { classifyDensityLevel as classifyDensityUsingOrganizerConfig, getEventSafetyThresholds } from './organizer-config.helper';

const prisma = new PrismaClient();

export interface LSTMFeatures {
  peopleCount: number;
  densityValue: number;
  flowRateIn: number;
  flowRateOut: number;
  avgMovementSpeed: number;
  temperatureCelsius: number;
  occupancyPercent: number;
  riskScore: number;
}

export interface LSTMInput {
  zoneId: string;
  zoneName: string;
  features: LSTMFeatures[];
  timeIndices: number[];
  timestamps: string[];
  windowSize: number;
}

export interface LSTMPrediction {
  zoneId: string;
  timestamp: string;
  forecastHorizon: number; // minutes ahead
  predictedCrowd: number;
  predictedDensity: number;
  confidence: number;
  alerts: string[];
}

class LSTMIntegrationService {
  private lstmServiceUrl: string;
  private lstmClient: AxiosInstance;
  private readonly DEFAULT_WINDOW_SIZE = 12; // 60 minutes (12 x 5-min intervals)
  private readonly DEFAULT_FEATURES = [
    'peopleCount',
    'densityValue',
    'flowRateIn',
    'flowRateOut',
    'avgMovementSpeed',
    'temperatureCelsius',
    'occupancyPercent',
    'riskScore',
  ];

  constructor() {
    this.lstmServiceUrl = process.env.LSTM_SERVICE_URL || 'http://localhost:5000';
    this.lstmClient = axios.create({
      baseURL: this.lstmServiceUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`[LSTM Integration] Initialized with service URL: ${this.lstmServiceUrl}`);
  }

  /**
   * Fetch LSTM-ready data for a specific zone
   */
  async getLSTMInputForZone(
    eventId: string,
    zoneId: string,
    windowMinutes: number = 60
  ): Promise<LSTMInput | null> {
    try {
      const windowSize = Math.floor(windowMinutes / 5); // Convert to number of 5-min intervals

      // Get zone metadata
      const zone = await prisma.zoneMetadata.findUnique({
        where: {
          eventId_zoneId: {
            eventId,
            zoneId,
          },
        },
      });

      if (!zone) {
        console.error(`[LSTM Integration] Zone not found: ${zoneId}`);
        return null;
      }

      // Get time-series data
      const states = await prisma.zoneState.findMany({
        where: {
          eventId,
          zoneId,
          timestamp: {
            gte: new Date(Date.now() - windowMinutes * 60 * 1000),
          },
        },
        orderBy: { timestamp: 'asc' },
        take: windowSize,
      });

      if (states.length < windowSize) {
        console.warn(
          `[LSTM Integration] Insufficient data for zone ${zoneId}: ${states.length}/${windowSize}`
        );
      }

      // Extract features
      const features: LSTMFeatures[] = states.map((state) => ({
        peopleCount: state.crowdCount,
        densityValue: state.crowdDensity,
        flowRateIn: state.inflowRate,
        flowRateOut: state.outflowRate || 0,
        avgMovementSpeed: state.avgSpeed || 1.2,
        temperatureCelsius: state.temperature || 25,
        occupancyPercent: (state.crowdCount / (zone.maxCapacity || 100)) * 100,
        riskScore: this.getRiskScore(state.riskLevel),
      }));

      return {
        zoneId,
        zoneName: zone.zoneName,
        features,
        timeIndices: states.map((s) => s.timestepIndex),
        timestamps: states.map((s) => s.timestamp.toISOString()),
        windowSize: states.length,
      };
    } catch (error) {
      console.error(`[LSTM Integration] Error fetching data for zone ${zoneId}:`, error);
      return null;
    }
  }

  /**
   * Fetch LSTM-ready data for all zones in an event
   */
  async getLSTMInputForAllZones(
    eventId: string,
    windowMinutes: number = 60
  ): Promise<LSTMInput[]> {
    try {
      // Get all zones for event
      const zones = await prisma.zoneMetadata.findMany({
        where: { eventId },
        select: { zoneId: true },
      });

      const inputs: LSTMInput[] = [];

      for (const zone of zones) {
        const input = await this.getLSTMInputForZone(eventId, zone.zoneId, windowMinutes);
        if (input && input.features.length >= this.DEFAULT_WINDOW_SIZE) {
          inputs.push(input);
        }
      }

      return inputs;
    } catch (error) {
      console.error('[LSTM Integration] Error fetching data for all zones:', error);
      return [];
    }
  }

  /**
   * Call external LSTM service for predictions
   */
  async callLSTMService(input: LSTMInput): Promise<LSTMPrediction | null> {
    try {
      const response = await this.lstmClient.post('/predict', {
        zone_id: input.zoneId,
        features: input.features,
        time_indices: input.timeIndices,
      });

      if (response.status === 200 && response.data) {
        return {
          zoneId: input.zoneId,
          timestamp: new Date().toISOString(),
          forecastHorizon: response.data.forecast_horizon || 15,
          predictedCrowd: response.data.predicted_count || 0,
          predictedDensity: response.data.predicted_density || 0,
          confidence: response.data.confidence || 0.5,
          alerts: response.data.alerts || [],
        };
      }

      return null;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('[LSTM Integration] LSTM service not available - is it running?');
      } else {
        console.error('[LSTM Integration] Error calling LSTM service:', error.message);
      }
      return null;
    }
  }

  /**
   * Get predictions for all zones
   */
  async getPredictionsForAllZones(eventId: string): Promise<LSTMPrediction[]> {
    const inputs = await this.getLSTMInputForAllZones(eventId);
    const predictions: LSTMPrediction[] = [];

    for (const input of inputs) {
      const prediction = await this.callLSTMService(input);
      if (prediction) {
        predictions.push(prediction);
      }
    }

    return predictions;
  }

  /**
   * Store prediction in database
   */
  async storePrediction(eventId: string, prediction: LSTMPrediction): Promise<void> {
    try {
      const forecastTime = new Date(prediction.timestamp);
      const targetTime = new Date(forecastTime.getTime() + prediction.forecastHorizon * 60000);

      // Use organizer's density classification
      const densityLevel = await classifyDensityUsingOrganizerConfig(eventId, prediction.predictedDensity);

      // Calculate risk level based on density and organizer thresholds
      const riskLevel = await this.calculateRiskLevel(eventId, prediction.predictedDensity, prediction.predictedCrowd, prediction.zoneId);

      // Estimate inflow/outflow based on historical patterns
      const flowEstimates = await this.estimateFlowRates(eventId, prediction.zoneId, prediction.predictedCrowd);

      await prisma.crowdForecast.create({
        data: {
          eventId,
          zoneId: prediction.zoneId,
          forecastTime,
          targetTime,
          horizonMinutes: prediction.forecastHorizon,
          predictedCount: prediction.predictedCrowd,
          predictedDensity: prediction.predictedDensity,
          predictedDensityLevel: densityLevel,
          predictedRiskLevel: riskLevel,
          predictedInflow: flowEstimates.inflow,
          predictedOutflow: flowEstimates.outflow,
          confidence: prediction.confidence,
          modelVersion: 'lstm-v1',
          modelType: 'LSTM',
          inputFeatures: {},
          alerts: [],
          recommendations: [],
        },
      });
    } catch (error) {
      console.error('[LSTM Integration] Error storing prediction:', error);
    }
  }

  /**
   * Calculate risk level based on organizer's thresholds
   */
  private async calculateRiskLevel(
    eventId: string,
    density: number,
    count: number,
    zoneId: string
  ): Promise<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> {
    try {
      const thresholds = await getEventSafetyThresholds(eventId);

      // Get zone capacity to calculate occupancy
      const zoneData = await prisma.zoneMetadata.findFirst({
        where: { eventId, zoneId },
        select: { maxCapacity: true },
      });

      const capacity = zoneData?.maxCapacity || 1000;
      const occupancy = count / capacity;

      // Risk increases with both density and occupancy
      if (density >= thresholds.densityLevels.critical || occupancy >= 0.95) {
        return 'CRITICAL';
      }
      if (density >= thresholds.densityLevels.high || occupancy >= 0.8) {
        return 'HIGH';
      }
      if (density >= thresholds.densityLevels.medium || occupancy >= 0.6) {
        return 'MEDIUM';
      }
      return 'LOW';
    } catch (error) {
      console.error('[LSTM Integration] Error calculating risk level:', error);
      // Fallback to density-based classification
      if (density >= 2.0) return 'HIGH';
      if (density >= 1.0) return 'MEDIUM';
      return 'LOW';
    }
  }

  /**
   * Estimate flow rates based on historical patterns
   */
  private async estimateFlowRates(
    eventId: string,
    zoneId: string,
    predictedCount: number
  ): Promise<{ inflow: number; outflow: number }> {
    try {
      // Get recent historical flow data
      const recentStates = await prisma.zoneState.findMany({
        where: { eventId, zoneId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { inflowRate: true, outflowRate: true, crowdCount: true },
      });

      if (recentStates.length === 0) {
        return { inflow: 0, outflow: 0 };
      }

      // Average recent flow rates
      const avgInflow = recentStates.reduce((sum, s) => sum + s.inflowRate, 0) / recentStates.length;
      const avgOutflow = recentStates.reduce((sum, s) => sum + s.outflowRate, 0) / recentStates.length;

      // Adjust based on predicted count change
      const currentCount = recentStates[0].crowdCount;
      const countChange = predictedCount - currentCount;

      // If count is increasing, higher inflow expected
      // If decreasing, higher outflow expected
      const inflowAdjustment = countChange > 0 ? countChange * 0.1 : 0;
      const outflowAdjustment = countChange < 0 ? Math.abs(countChange) * 0.1 : 0;

      return {
        inflow: Math.max(0, avgInflow + inflowAdjustment),
        outflow: Math.max(0, avgOutflow + outflowAdjustment),
      };
    } catch (error) {
      console.error('[LSTM Integration] Error estimating flow rates:', error);
      return { inflow: 0, outflow: 0 };
    }
  }

  private async getDensityLevel(eventId: string, density: number): Promise<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> {
    return await classifyDensityUsingOrganizerConfig(eventId, density);
  }

  /**
   * Run full prediction loop for an event
   */
  async runPredictionLoop(eventId: string): Promise<{
    success: boolean;
    predictionsCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let predictionsCount = 0;

    try {
      console.log(`[LSTM Integration] Running prediction loop for event ${eventId}`);

      // Get inputs for all zones
      const inputs = await this.getLSTMInputForAllZones(eventId);

      if (inputs.length === 0) {
        errors.push('No LSTM inputs available - insufficient data');
        return { success: false, predictionsCount: 0, errors };
      }

      console.log(`[LSTM Integration] Processing ${inputs.length} zones`);

      // Get predictions
      for (const input of inputs) {
        try {
          const prediction = await this.callLSTMService(input);

          if (prediction) {
            await this.storePrediction(eventId, prediction);
            predictionsCount++;

            // Log warnings if needed
            if (prediction.alerts.length > 0) {
              console.log(
                `[LSTM Integration] Alerts for zone ${prediction.zoneId}: ${prediction.alerts.join(', ')}`
              );
            }
          } else {
            errors.push(`Failed to get prediction for zone ${input.zoneId}`);
          }
        } catch (error: any) {
          errors.push(`Error processing zone ${input.zoneId}: ${error.message}`);
        }
      }

      const success = predictionsCount > 0;
      console.log(
        `[LSTM Integration] Prediction loop complete: ${predictionsCount}/${inputs.length} successful`
      );

      return { success, predictionsCount, errors };
    } catch (error: any) {
      errors.push(`Prediction loop error: ${error.message}`);
      return { success: false, predictionsCount, errors };
    }
  }

  /**
   * Validate LSTM service connection
   */
  async validateConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
    try {
      const response = await this.lstmClient.get('/health');

      if (response.status === 200) {
        return {
          connected: true,
          version: response.data.version || 'unknown',
        };
      }

      return {
        connected: false,
        error: `Unexpected status code: ${response.status}`,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.code === 'ECONNREFUSED' ? 'Service not running' : error.message,
      };
    }
  }

  /**
   * Export data for offline LSTM training
   */
  async exportTrainingData(
    eventId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    metadata: any;
    zones: Array<{
      zoneId: string;
      zoneName: string;
      data: LSTMFeatures[];
      timestamps: string[];
    }>;
  }> {
    const zones = await prisma.zoneMetadata.findMany({
      where: { eventId },
      select: { zoneId: true, zoneName: true },
    });

    const exportData = {
      metadata: {
        eventId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        exportTime: new Date().toISOString(),
        zonesCount: zones.length,
      },
      zones: [] as any[],
    };

    for (const zone of zones) {
      const states = await prisma.zoneState.findMany({
        where: {
          eventId,
          zoneId: zone.zoneId,
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      const data: LSTMFeatures[] = states.map((state) => ({
        peopleCount: state.crowdCount,
        densityValue: state.crowdDensity,
        flowRateIn: state.inflowRate,
        flowRateOut: state.outflowRate || 0,
        avgMovementSpeed: state.avgSpeed || 1.2,
        temperatureCelsius: state.temperature || 25,
        occupancyPercent: 0, // Cannot calculate without maxCapacity
        riskScore: this.getRiskScore(state.riskLevel),
      }));

      exportData.zones.push({
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        data,
        timestamps: states.map((s) => s.timestamp.toISOString()),
      });
    }

    return exportData;
  }

  /**
   * Convert risk level enum to numeric score
   */
  private getRiskScore(riskLevel: string): number {
    const riskMap: Record<string, number> = {
      LOW: 0.25,
      MEDIUM: 0.5,
      HIGH: 0.75,
      CRITICAL: 1.0,
    };
    return riskMap[riskLevel] || 0.5;
  }
}

export const lstmIntegrationService = new LSTMIntegrationService();
