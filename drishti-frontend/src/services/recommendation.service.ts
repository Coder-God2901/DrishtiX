/**
 * AI Recommendation Service
 * Connects to: /api/recommendations
 */

import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';

export interface AIRecommendation {
  id: string;
  eventId: string;
  zoneId?: string;
  type: 'REROUTE_TRAFFIC' | 'DISPATCH_STAFF' | 'THROTTLE_GATE' | 'BROADCAST_ALERT' | 'PAUSE_EVENT' | 'OPEN_GATE' | 'INCREASE_VENTILATION';
  title: string;
  description: string;
  confidence: number;
  impact: number;
  cost: number;
  executionTime: number;
  signals: string[];
  actionRequired: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: string;
  updatedAt?: string;
}

export interface RiskContext {
  eventId: string;
  zoneId?: string;
  forecastedDensity: number;
  anomalyScore: number;
  staticVulnerability: number;
  activeIncidents: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currentDensity: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

export interface RecommendationFeedback {
  actionId: string;
  eventId: string;
  zoneId?: string;
  outcome?: string;
  reason?: string;
}

class RecommendationService {
  /**
   * Get all recommendations for an event
   */
  async getRecommendations(eventId: string): Promise<{ success: boolean; data?: AIRecommendation[]; error?: string }> {
    try {
      return await apiClient.get<AIRecommendation[]>('/recommendations', { eventId });
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single recommendation by ID
   */
  async getRecommendation(id: string): Promise<{ success: boolean; data?: AIRecommendation; error?: string }> {
    try {
      return await apiClient.get<AIRecommendation>(`/recommendations/${id}`);
    } catch (error: any) {
      console.error('Error fetching recommendation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate recommendations based on risk context
   */
  async generateRecommendations(context: RiskContext): Promise<{ success: boolean; data?: AIRecommendation[]; error?: string }> {
    try {
      return await apiClient.post<AIRecommendation[]>('/recommendations/generate', context);
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve a recommendation
   */
  async approveRecommendation(
    actionId: string,
    eventId: string,
    zoneId?: string,
    outcome?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post(`/recommendations/${actionId}/approve`, {
        eventId,
        zoneId,
        outcome: outcome || 'approved_pending_execution'
      });
    } catch (error: any) {
      console.error('Error approving recommendation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a recommendation
   */
  async rejectRecommendation(
    actionId: string,
    eventId: string,
    reason?: string,
    zoneId?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post(`/recommendations/${actionId}/reject`, {
        eventId,
        zoneId,
        reason: reason || 'manual_override'
      });
    } catch (error: any) {
      console.error('Error rejecting recommendation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recommendation statistics
   */
  async getRecommendationStats(eventId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.get(`/recommendations/stats`, { eventId });
    } catch (error: any) {
      console.error('Error fetching recommendation stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recommendation history
   */
  async getRecommendationHistory(params: {
    eventId: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<{ success: boolean; data?: AIRecommendation[]; error?: string }> {
    try {
      return await apiClient.get<AIRecommendation[]>('/recommendations/history', params);
    } catch (error: any) {
      console.error('Error fetching recommendation history:', error);
      return { success: false, error: error.message };
    }
  }
}

export const recommendationService = new RecommendationService();
