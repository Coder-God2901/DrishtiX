/**
 * Real-time Prediction Service
 * Connects to backend API and WebSocket for live prediction updates
 */

import { apiClient } from '../lib/api-client';
import { socketService } from './socket.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface Prediction {
  id: string;
  eventId: string;
  timestamp: string;
  forecastTime: string;
  forecastHorizon: number;
  predictedCount: number;
  predictedDensity: number;
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  gridPredictions: any[];
  hotspots: any[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  signals: any;
  anomalies: any[];
  violenceDetected: boolean;
  fireDetected: boolean;
  panicDetected: boolean;
  surgDetected: boolean;
  modelVersion: string;
  modelType: string;
}

class PredictionService {
  /**
   * Get predictions for an event
   */
  async getPredictions(params: {
    eventId: string;
    limit?: number;
    offset?: number;
  }): Promise<Prediction[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('eventId', params.eventId);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await apiClient.get<ApiResponse<Prediction[]>>(
      `/predictions?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Get latest prediction for an event
   */
  async getLatestPrediction(eventId: string): Promise<Prediction> {
    const response = await apiClient.get<ApiResponse<Prediction>>(
      `/predictions/latest?eventId=${eventId}`
    );
    return response.data;
  }

  /**
   * Create new prediction
   */
  async createPrediction(prediction: Partial<Prediction>): Promise<Prediction> {
    const response = await apiClient.post<ApiResponse<Prediction>>('/predictions', prediction);
    return response.data;
  }

  /**
   * Get hotspots for a prediction
   */
  async getHotspots(predictionId: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/predictions/${predictionId}/hotspots`
    );
    return response.data;
  }

  /**
   * Subscribe to real-time prediction updates for an event
   */
  subscribeToPredictions(eventId: string, callback: (prediction: Prediction) => void) {
    socketService.emit('subscribe:predictions', eventId);
    socketService.on('prediction:new', callback);
  }

  /**
   * Unsubscribe from prediction updates
   */
  unsubscribeFromPredictions() {
    socketService.off('prediction:new');
  }
}

export const predictionService = new PredictionService();
