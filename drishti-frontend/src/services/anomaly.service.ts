/**
 * Anomaly Service
 * Detects and analyzes behavioral anomalies and unusual patterns
 */

import { APIResponse, apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

// Type alias for convenience
type ApiResponse<T> = APIResponse<T>;

// ==================== Types & Interfaces ====================

export interface Anomaly {
  id: string;
  eventId: string;
  type: 'crowd' | 'behavior' | 'environmental' | 'security' | 'traffic' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: {
    zone: string;
    coordinates?: { lat: number; lng: number };
  };
  detectedAt: string | Date;
  resolvedAt?: string | Date;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  confidence: number; // 0-1
  metrics: {
    deviationScore: number; // How much it deviates from normal
    impactScore: number; // Potential impact on event
    urgencyScore: number; // How urgently it needs attention
  };
  affectedEntities: string[]; // zones, cameras, gates affected
  recommendations: string[];
  relatedAnomalies?: string[]; // IDs of related anomalies
}

export interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  type: Anomaly['type'];
  indicators: {
    metric: string;
    threshold: number;
    operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  }[];
  historicalOccurrences: number;
  avgResolutionTime: number; // minutes
  typicalResolution: string[];
}

export interface AnomalyMetrics {
  totalAnomalies: number;
  activeAnomalies: number;
  resolvedAnomalies: number;
  falsePositives: number;
  byType: Record<Anomaly['type'], number>;
  bySeverity: Record<Anomaly['severity'], number>;
  avgDetectionAccuracy: number;
  avgResolutionTime: number;
  trendsLast24h: {
    count: number;
    change: number; // percentage
  };
}

export interface BehaviorFeature {
  timestamp: string | Date;
  features: Record<string, number>; // key-value pairs of behavioral metrics
  metadata?: Record<string, any>;
}

// ==================== Anomaly Service ====================

class AnomalyService {
  /**
   * Get all anomalies for an event
   */
  async getAnomalies(eventId: string): Promise<ApiResponse<Anomaly[]>> {
    return await apiClient.get<Anomaly[]>(
      API_ENDPOINTS.anomalies.byEvent(eventId)
    );
  }

  /**
   * Get active anomalies only
   */
  async getCurrentAnomalies(eventId: string): Promise<ApiResponse<Anomaly[]>> {
    return await apiClient.get<Anomaly[]>(
      API_ENDPOINTS.anomalies.current(eventId)
    );
  }

  /**
   * Get specific anomaly details
   */
  async getAnomalyById(anomalyId: string): Promise<ApiResponse<Anomaly>> {
    return await apiClient.get<Anomaly>(
      API_ENDPOINTS.anomalies.get(anomalyId)
    );
  }

  /**
   * Trigger anomaly detection
   */
  async detectAnomalies(eventId: string): Promise<ApiResponse<{
    detected: number;
    anomalies: Anomaly[];
  }>> {
    return await apiClient.post(
      API_ENDPOINTS.anomalies.detect,
      { eventId }
    );
  }

  /**
   * Get anomaly metrics and statistics
   */
  async getMetrics(eventId: string): Promise<ApiResponse<AnomalyMetrics>> {
    return await apiClient.get<AnomalyMetrics>(
      API_ENDPOINTS.anomalies.metrics(eventId)
    );
  }

  /**
   * Update anomaly status
   */
  async updateStatus(
    anomalyId: string,
    status: Anomaly['status'],
    notes?: string
  ): Promise<ApiResponse<Anomaly>> {
    return await apiClient.put<Anomaly>(
      API_ENDPOINTS.anomalies.get(anomalyId),
      { status, notes }
    );
  }

  /**
   * Mark anomaly as false positive
   */
  async markFalsePositive(
    anomalyId: string,
    reason?: string
  ): Promise<ApiResponse<Anomaly>> {
    return await this.updateStatus(anomalyId, 'false_positive', reason);
  }

  /**
   * Get anomaly patterns
   */
  async getPatterns(eventId?: string): Promise<ApiResponse<AnomalyPattern[]>> {
    const endpoint = eventId
      ? `/anomalies/patterns?eventId=${eventId}`
      : '/anomalies/patterns';

    return await apiClient.get<AnomalyPattern[]>(endpoint);
  }

  /**
   * Get anomalies by type
   */
  async getAnomaliesByType(
    eventId: string,
    type: Anomaly['type']
  ): Promise<ApiResponse<Anomaly[]>> {
    return await apiClient.get<Anomaly[]>(
      `${API_ENDPOINTS.anomalies.byEvent(eventId)}?type=${type}`
    );
  }

  /**
   * Get anomalies by severity
   */
  async getAnomaliesBySeverity(
    eventId: string,
    severity: Anomaly['severity']
  ): Promise<ApiResponse<Anomaly[]>> {
    return await apiClient.get<Anomaly[]>(
      `${API_ENDPOINTS.anomalies.byEvent(eventId)}?severity=${severity}`
    );
  }

  /**
   * Get anomaly timeline
   */
  async getTimeline(
    eventId: string,
    startTime?: string,
    endTime?: string
  ): Promise<ApiResponse<{
    timestamp: string;
    anomalies: Anomaly[];
  }[]>> {
    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);

    return await apiClient.get(
      `/anomalies/${eventId}/timeline?${params.toString()}`
    );
  }

  /**
   * Ingest behavior features for anomaly detection
   */
  async ingestFeatures(
    eventId: string,
    features: BehaviorFeature
  ): Promise<ApiResponse<{ success: boolean }>> {
    return await apiClient.post(
      API_ENDPOINTS.anomalies.ingest,
      { eventId, ...features }
    );
  }

  /**
   * Get anomaly detection configuration
   */
  async getDetectionConfig(eventId: string): Promise<ApiResponse<{
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    detectionInterval: number; // seconds
    thresholds: Record<string, number>;
  }>> {
    return await apiClient.get(
      `/anomalies/config/${eventId}`
    );
  }

  /**
   * Update anomaly detection configuration
   */
  async updateDetectionConfig(
    eventId: string,
    config: {
      enabled?: boolean;
      sensitivity?: 'low' | 'medium' | 'high';
      detectionInterval?: number;
      thresholds?: Record<string, number>;
    }
  ): Promise<ApiResponse<{ success: boolean }>> {
    return await apiClient.put(
      `/anomalies/config/${eventId}`,
      config
    );
  }

  /**
   * Get related anomalies
   */
  async getRelatedAnomalies(anomalyId: string): Promise<ApiResponse<Anomaly[]>> {
    return await apiClient.get<Anomaly[]>(
      `/anomalies/${anomalyId}/related`
    );
  }

  /**
   * Get anomaly impact analysis
   */
  async getImpactAnalysis(anomalyId: string): Promise<ApiResponse<{
    crowdImpact: {
      affectedCount: number;
      zones: string[];
    };
    operationalImpact: {
      level: 'minimal' | 'moderate' | 'significant' | 'severe';
      affectedSystems: string[];
    };
    financialImpact?: {
      estimatedCost: number;
      currency: string;
    };
    recommendations: string[];
  }>> {
    return await apiClient.get(
      `/anomalies/${anomalyId}/impact`
    );
  }

  /**
   * Generate anomaly report
   */
  async generateReport(
    eventId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{
    summary: AnomalyMetrics;
    topAnomalies: Anomaly[];
    insights: string[];
    recommendations: string[];
  }>> {
    return await apiClient.post(
      `/anomalies/${eventId}/report`,
      { startDate, endDate }
    );
  }
}

// Export singleton instance
export const anomalyService = new AnomalyService();
export default anomalyService;
