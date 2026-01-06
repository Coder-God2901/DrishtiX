/**
 * Prediction & Analytics Service
 * Handles AI predictions, crowd intelligence, and analytics
 */

import { apiClient } from './api.client';
import { wsService } from './websocket.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface CrowdPrediction {
  id: string;
  eventId: string;
  timestamp: string | Date;
  predictedDensity: number;
  confidenceLevel: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedZones: string[];
  recommendations: string[];
}

export interface RiskAnalysis {
  overallRisk: number;
  factors: Array<{
    name: string;
    value: number;
    weight: number;
    status: 'normal' | 'warning' | 'critical';
  }>;
  predictions: string[];
  recommendations: string[];
}

export interface PredictiveInsight {
  id: string;
  type: 'CROWD_SURGE' | 'BOTTLENECK' | 'WEATHER_IMPACT' | 'SAFETY_RISK' | 'RESOURCE_SHORTAGE';
  title: string;
  description: string;
  probability: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timeframe: string;
  affectedAreas: string[];
  recommendations: string[];
}

export interface AIRecommendation {
  id: string;
  category: 'CROWD_MANAGEMENT' | 'RESOURCE_ALLOCATION' | 'EMERGENCY_RESPONSE' | 'PREVENTIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
}

class PredictionService {
  /**
   * Get all predictions
   */
  async getPredictions(eventId?: string) {
    return await apiClient.get<CrowdPrediction[]>(API_ENDPOINTS.predictions.list, { eventId });
  }

  /**
   * Get crowd density prediction
   */
  async getCrowdDensityPrediction(eventId: string) {
    return await apiClient.get<CrowdPrediction>(
      API_ENDPOINTS.predictions.crowdDensity(eventId)
    );
  }

  /**
   * Get risk analysis for event
   */
  async getRiskAnalysis(eventId: string) {
    return await apiClient.get<RiskAnalysis>(
      API_ENDPOINTS.predictions.riskAnalysis(eventId)
    );
  }

  /**
   * Subscribe to real-time predictions
   */
  subscribeToPredictions(eventId: string, callback: (prediction: CrowdPrediction) => void) {
    wsService.joinEvent(eventId);
    wsService.on('prediction:new', callback);
    return () => {
      wsService.off('prediction:new', callback);
    };
  }

  /**
   * Subscribe to risk updates
   */
  subscribeToRiskUpdates(eventId: string, callback: (risk: RiskAnalysis) => void) {
    wsService.joinEvent(eventId);
    wsService.on('risk:updated', callback);
    return () => {
      wsService.off('risk:updated', callback);
    };
  }
}

export const predictionService = new PredictionService();
