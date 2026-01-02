/**
 * Gate Control Service
 * Manages gate operations, entry/exit monitoring, and access control
 */

import { APIResponse, apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

// Type alias for convenience
type ApiResponse<T> = APIResponse<T>;

// ==================== Types & Interfaces ====================

export interface Gate {
  id: string;
  name: string;
  type: 'entry' | 'exit' | 'emergency';
  status: 'open' | 'closed' | 'restricted' | 'maintenance';
  capacity: number;
  currentOccupancy: number;
  throughput: {
    hourly: number;
    daily: number;
    peak: number;
  };
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  lastActivity: string | Date;
}

export interface GateActivity {
  id: string;
  gateId: string;
  gateName: string;
  type: 'entry' | 'exit';
  count: number;
  timestamp: string | Date;
  method: 'ticket' | 'qr' | 'nfc' | 'manual';
  alerts?: string[];
}

export interface AccessRule {
  id: string;
  name: string;
  gateIds: string[];
  ticketTypes: string[];
  timeRestrictions?: {
    start: string;
    end: string;
  };
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
}

export interface GateAlert {
  id: string;
  gateId: string;
  gateName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'overcapacity' | 'malfunction' | 'security' | 'unauthorized';
  message: string;
  timestamp: string | Date;
  resolved: boolean;
}

export interface GateDashboardMetrics {
  totalGates: number;
  activeGates: number;
  totalEntries: number;
  totalExits: number;
  currentOccupancy: number;
  maxCapacity: number;
  averageThroughput: number;
  alerts: GateAlert[];
}

// ==================== Gate Control Service ====================

class GateControlService {
  /**
   * Get all gates for an event
   */
  async getGates(eventId: string): Promise<ApiResponse<Gate[]>> {
    return await apiClient.get<Gate[]>(
      API_ENDPOINTS.gates.list(eventId)
    );
  }

  /**
   * Get specific gate details
   */
  async getGateById(gateId: string): Promise<ApiResponse<Gate>> {
    return await apiClient.get<Gate>(
      API_ENDPOINTS.gates.details(gateId)
    );
  }

  /**
   * Get gate dashboard metrics
   */
  async getDashboardMetrics(eventId: string): Promise<ApiResponse<GateDashboardMetrics>> {
    return await apiClient.get<GateDashboardMetrics>(
      API_ENDPOINTS.gates.metrics(eventId)
    );
  }

  /**
   * Get gate activity history
   */
  async getGateActivity(
    gateId: string,
    options?: {
      startTime?: string;
      endTime?: string;
      limit?: number;
    }
  ): Promise<ApiResponse<GateActivity[]>> {
    const params = new URLSearchParams();
    if (options?.startTime) params.append('startTime', options.startTime);
    if (options?.endTime) params.append('endTime', options.endTime);
    if (options?.limit) params.append('limit', options.limit.toString());

    return await apiClient.get<GateActivity[]>(
      `${API_ENDPOINTS.gates.activity(gateId)}?${params.toString()}`
    );
  }

  /**
   * Update gate status
   */
  async updateGateStatus(
    gateId: string,
    status: Gate['status']
  ): Promise<ApiResponse<Gate>> {
    return await apiClient.put<Gate>(
      API_ENDPOINTS.gates.details(gateId),
      { status }
    );
  }

  /**
   * Open/Close gate
   */
  async controlGate(
    gateId: string,
    action: 'open' | 'close'
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return await apiClient.post(
      API_ENDPOINTS.gates.control(gateId),
      { action }
    );
  }

  /**
   * Get access rules for gates
   */
  async getAccessRules(eventId: string): Promise<ApiResponse<AccessRule[]>> {
    return await apiClient.get<AccessRule[]>(
      API_ENDPOINTS.gates.accessRules(eventId)
    );
  }

  /**
   * Create new access rule
   */
  async createAccessRule(rule: Omit<AccessRule, 'id'>): Promise<ApiResponse<AccessRule>> {
    return await apiClient.post<AccessRule>(
      API_ENDPOINTS.gates.accessRules('default-event-id'),
      rule
    );
  }

  /**
   * Update access rule
   */
  async updateAccessRule(ruleId: string, updates: Partial<AccessRule>): Promise<ApiResponse<AccessRule>> {
    return await apiClient.put<AccessRule>(
      API_ENDPOINTS.gates.accessRuleDetails(ruleId),
      updates
    );
  }

  /**
   * Delete access rule
   */
  async deleteAccessRule(ruleId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete(
      API_ENDPOINTS.gates.accessRuleDetails(ruleId)
    );
  }

  /**
   * Get gate alerts
   */
  async getAlerts(eventId: string): Promise<ApiResponse<GateAlert[]>> {
    return await apiClient.get<GateAlert[]>(
      API_ENDPOINTS.gates.alerts(eventId)
    );
  }

  /**
   * Resolve gate alert
   */
  async resolveAlert(alertId: string): Promise<ApiResponse<GateAlert>> {
    return await apiClient.put<GateAlert>(
      API_ENDPOINTS.gates.alertDetails(alertId),
      { resolved: true }
    );
  }

  /**
   * Get real-time gate statistics
   */
  async getRealtimeStats(eventId: string): Promise<ApiResponse<{
    entries: number;
    exits: number;
    occupancy: number;
    throughput: number;
  }>> {
    return await apiClient.get(
      API_ENDPOINTS.gates.realtimeStats(eventId)
    );
  }

  /**
   * Emergency gate control - Open all gates
   */
  async emergencyOpenAll(eventId: string): Promise<ApiResponse<{
    success: boolean;
    gatesAffected: string[];
  }>> {
    return await apiClient.post(
      API_ENDPOINTS.gates.emergency(eventId),
      { action: 'open_all' }
    );
  }

  /**
   * Get gate throughput analytics
   */
  async getThroughputAnalytics(
    gateId: string,
    timeRange: '1h' | '6h' | '24h' | '7d'
  ): Promise<ApiResponse<{
    labels: string[];
    entries: number[];
    exits: number[];
  }>> {
    return await apiClient.get(
      `${API_ENDPOINTS.gates.analytics(gateId)}?range=${timeRange}`
    );
  }
}

// Export singleton instance
export const gateControlService = new GateControlService();
export default gateControlService;
