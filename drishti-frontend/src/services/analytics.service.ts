/**
 * Analytics Service
 * Connects to: /api/gcp, /api/bigquery
 */

import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';

export interface AnalyticsMetrics {
  totalAttendees: number;
  currentAttendees: number;
  avgDensity: number;
  peakDensity: number;
  peakTime: string;
  incidentCount: number;
  resolvedIncidents: number;
  crowdFlowRate: number;
  safetyScore: number;
  alertsCount: number;
  timestamp: string;
}

export interface BigQueryAnalytics {
  eventId: string;
  metric: string;
  data: any[];
  aggregations: Record<string, any>;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface CrowdPredictionData {
  eventId: string;
  timestamp: string;
  predictedCount: number;
  predictedDensity: number;
  confidence: number;
  forecastHorizon: number;
  gridPredictions?: any[];
  hotspots?: any[];
}

export interface IncidentAnalytics {
  eventId: string;
  totalIncidents: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  avgResponseTime: number;
  avgResolutionTime: number;
  peakIncidentTime: string;
}

class AnalyticsService {
  /**
   * Get real-time dashboard metrics for an event
   */
  async getDashboardMetrics(eventId: string): Promise<{ success: boolean; data?: AnalyticsMetrics; error?: string }> {
    try {
      return await apiClient.get<AnalyticsMetrics>('/gcp/dashboard', { eventId });
    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get real-time metrics (updates frequently)
   */
  async getRealtimeMetrics(eventId: string): Promise<{ success: boolean; data?: AnalyticsMetrics; error?: string }> {
    try {
      return await apiClient.get<AnalyticsMetrics>('/gcp/metrics', {
        eventId,
        realtime: true
      });
    } catch (error: any) {
      console.error('Error fetching realtime metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Query BigQuery for analytics data
   */
  async queryBigQuery(params: {
    eventId: string;
    metric: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data?: BigQueryAnalytics; error?: string }> {
    try {
      return await apiClient.get<BigQueryAnalytics>('/bigquery/analytics', params);
    } catch (error: any) {
      console.error('Error querying BigQuery:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get crowd predictions from BigQuery
   */
  async getPredictions(eventId: string): Promise<{ success: boolean; data?: CrowdPredictionData[]; error?: string }> {
    try {
      return await apiClient.get<CrowdPredictionData[]>('/bigquery/predictions', { eventId });
    } catch (error: any) {
      console.error('Error fetching predictions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get incident analytics from BigQuery
   */
  async getIncidentAnalytics(eventId: string): Promise<{ success: boolean; data?: IncidentAnalytics; error?: string }> {
    try {
      return await apiClient.get<IncidentAnalytics>('/bigquery/incidents', { eventId });
    } catch (error: any) {
      console.error('Error fetching incident analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate custom analytics report
   */
  async generateReport(params: {
    eventId: string;
    reportType: string;
    startDate?: string;
    endDate?: string;
    metrics?: string[];
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post('/gcp/reports', params);
    } catch (error: any) {
      console.error('Error generating report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger video analysis via GCP
   */
  async triggerVideoAnalysis(params: {
    eventId: string;
    cameraId: string;
    frameData?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post('/gcp/video-analysis', params);
    } catch (error: any) {
      console.error('Error triggering video analysis:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger social sentiment analysis
   */
  async triggerSocialSentiment(params: {
    eventId: string;
    keywords: string[];
    sources?: string[];
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post('/gcp/social-sentiment', params);
    } catch (error: any) {
      console.error('Error triggering social sentiment analysis:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get historical trends
   */
  async getHistoricalTrends(params: {
    eventId: string;
    metric: string;
    interval: 'hourly' | 'daily' | 'weekly';
    startDate: string;
    endDate: string;
  }): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      return await apiClient.get('/gcp/trends', params);
    } catch (error: any) {
      console.error('Error fetching historical trends:', error);
      return { success: false, error: error.message };
    }
  }
}

export const analyticsService = new AnalyticsService();
