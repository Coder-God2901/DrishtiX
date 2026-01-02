/**
 * Automation Service
 * Manages automation policies, rules, and AI-driven responses
 */

import { APIResponse, apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

// Type alias for convenience
type ApiResponse<T> = APIResponse<T>;

// ==================== Types & Interfaces ====================

export interface AutomationPolicy {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastTriggered?: string | Date;
  executionCount: number;
}

export interface AutomationTrigger {
  type: 'incident' | 'crowd-density' | 'weather' | 'time' | 'manual' | 'anomaly';
  parameters: Record<string, any>;
  // Example: { incidentSeverity: 'critical' } or { densityThreshold: 0.8 }
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AutomationAction {
  type: 'dispatch' | 'alert' | 'gate_control' | 'broadcast' | 'camera' | 'log' | 'webhook';
  parameters: Record<string, any>;
  delay?: number; // delay in seconds before executing
}

export interface AutomationLog {
  id: string;
  policyId: string;
  policyName: string;
  triggeredAt: string | Date;
  triggeredBy: 'system' | 'user' | 'ai';
  status: 'pending' | 'executing' | 'completed' | 'failed';
  actions: {
    type: string;
    status: 'success' | 'failed' | 'pending';
    result?: any;
    error?: string;
  }[];
  duration?: number;
}

export interface AutomationStats {
  totalPolicies: number;
  activePolicies: number;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  recentLogs: AutomationLog[];
}

// ==================== Automation Service ====================

class AutomationService {
  /**
   * Get all automation policies for an event
   */
  async getPolicies(eventId: string): Promise<ApiResponse<AutomationPolicy[]>> {
    return await apiClient.get<AutomationPolicy[]>(
      API_ENDPOINTS.automation.policies(eventId)
    );
  }

  /**
   * Get specific policy details
   */
  async getPolicyById(policyId: string): Promise<ApiResponse<AutomationPolicy>> {
    return await apiClient.get<AutomationPolicy>(
      API_ENDPOINTS.automation.updatePolicy(policyId)
    );
  }

  /**
   * Create new automation policy
   */
  async createPolicy(policy: Omit<AutomationPolicy, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): Promise<ApiResponse<AutomationPolicy>> {
    return await apiClient.post<AutomationPolicy>(
      API_ENDPOINTS.automation.createPolicy,
      policy
    );
  }

  /**
   * Update existing automation policy
   */
  async updatePolicy(policyId: string, updates: Partial<AutomationPolicy>): Promise<ApiResponse<AutomationPolicy>> {
    return await apiClient.put<AutomationPolicy>(
      API_ENDPOINTS.automation.updatePolicy(policyId),
      updates
    );
  }

  /**
   * Delete automation policy
   */
  async deletePolicy(policyId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete(
      API_ENDPOINTS.automation.deletePolicy(policyId)
    );
  }

  /**
   * Toggle policy enabled/disabled
   */
  async togglePolicy(policyId: string, enabled: boolean): Promise<ApiResponse<AutomationPolicy>> {
    return await this.updatePolicy(policyId, { enabled });
  }

  /**
   * Manually trigger a policy
   */
  async triggerPolicy(policyId: string, context?: Record<string, any>): Promise<ApiResponse<{
    success: boolean;
    executionId: string;
    message: string;
  }>> {
    return await apiClient.post(
      `/automation/policies/${policyId}/trigger`,
      { context }
    );
  }

  /**
   * Get automation execution logs
   */
  async getExecutionLogs(
    options?: {
      policyId?: string;
      status?: AutomationLog['status'];
      limit?: number;
      startTime?: string;
      endTime?: string;
    }
  ): Promise<ApiResponse<AutomationLog[]>> {
    const params = new URLSearchParams();
    if (options?.policyId) params.append('policyId', options.policyId);
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.startTime) params.append('startTime', options.startTime);
    if (options?.endTime) params.append('endTime', options.endTime);

    return await apiClient.get<AutomationLog[]>(
      `/automation/logs?${params.toString()}`
    );
  }

  /**
   * Get automation statistics
   */
  async getStats(eventId: string): Promise<ApiResponse<AutomationStats>> {
    return await apiClient.get<AutomationStats>(
      `/automation/stats/${eventId}`
    );
  }

  /**
   * Test policy conditions
   */
  async testPolicy(policy: Partial<AutomationPolicy>, testData: Record<string, any>): Promise<ApiResponse<{
    conditionsMet: boolean;
    results: { condition: AutomationCondition; result: boolean }[];
  }>> {
    return await apiClient.post(
      '/automation/test',
      { policy, testData }
    );
  }

  /**
   * Get recommended policies based on event type
   */
  async getRecommendedPolicies(eventId: string, eventType: string): Promise<ApiResponse<AutomationPolicy[]>> {
    return await apiClient.get<AutomationPolicy[]>(
      `/automation/recommendations?eventId=${eventId}&eventType=${eventType}`
    );
  }

  /**
   * Clone existing policy
   */
  async clonePolicy(policyId: string, name: string): Promise<ApiResponse<AutomationPolicy>> {
    return await apiClient.post<AutomationPolicy>(
      `/automation/policies/${policyId}/clone`,
      { name }
    );
  }

  /**
   * Get available trigger types and their parameters
   */
  async getTriggerTypes(): Promise<ApiResponse<{
    type: string;
    description: string;
    parameters: {
      name: string;
      type: string;
      required: boolean;
      description: string;
    }[];
  }[]>> {
    return await apiClient.get('/automation/trigger-types');
  }

  /**
   * Get available action types and their parameters
   */
  async getActionTypes(): Promise<ApiResponse<{
    type: string;
    description: string;
    parameters: {
      name: string;
      type: string;
      required: boolean;
      description: string;
    }[];
  }[]>> {
    return await apiClient.get('/automation/action-types');
  }
}

// Export singleton instance
export const automationService = new AutomationService();
export default automationService;
