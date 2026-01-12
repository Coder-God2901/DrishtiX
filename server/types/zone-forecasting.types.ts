/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */

/**
 * Type definitions for Zone Forecasting APIs
 */

import { SchedulePhase, DensityLevel, RiskLevel } from '@prisma/client';

// =============================================================================
// Zone Metadata Types
// =============================================================================

export interface ZoneMetadataResponse {
  id: string;
  eventId: string;
  venueId: string;
  zoneId: string;
  zoneName: string;
  areaCategory: number;
  areaCategoryName: string;
  maxCapacity: number;
  areaSqMeters?: number;
  fixedSeating: boolean;
  bottleneckProne: boolean;
  queueProne: boolean;
  zonePriority: number;
  connectedZones: string[];
  coordinates: any;
  floor: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ZoneMetadataListResponse {
  success: boolean;
  data: ZoneMetadataResponse[];
  simulated: boolean;
  message?: string;
}

// =============================================================================
// Zone State Types (Time-Series)
// =============================================================================

export interface ZoneStateSnapshot {
  id: string;
  eventId: string;
  venueId: string;
  zoneId: string;
  timestamp: string;
  timestepIndex: number;

  // Crowd metrics
  crowdCount: number;
  crowdDensity: number;
  densityLevel: DensityLevel;

  // Flow dynamics
  inflowRate: number;
  outflowRate: number;
  netFlowRate: number;

  // Movement characteristics
  avgSpeed: number;
  directionEntropy: number;
  avgDwellTime?: number;

  // Queue metrics
  queueLength?: number;
  avgWaitTime?: number;

  // Schedule context
  schedulePhase: SchedulePhase;
  isPeakWindow: boolean;

  // Environmental factors
  temperature?: number;
  humidity?: number;
  weatherImpact?: number;

  // Risk indicators
  riskLevel: RiskLevel;
  congestionScore: number;
  bottleneckScore?: number;

  // Metadata
  dataSource: string;
  confidence: number;
  isPredicted: boolean;
  predictionHorizon?: number;

  createdAt: string;
}

export interface ZoneStateResponse {
  success: boolean;
  data: {
    states: ZoneStateSnapshot[];
    groupedByZone: { [zoneId: string]: ZoneStateSnapshot[] };
    windowMinutes: number;
    timesteps: number;
    zones: number;
  };
}

export interface ZoneStateLatestResponse {
  success: boolean;
  data: ZoneStateSnapshot[];
  simulated: boolean;
  timestamp: string;
}

export interface ZoneStateHistoryResponse {
  success: boolean;
  data: ZoneStateSnapshot[];
  count: number;
}

// =============================================================================
// Schedule Context Types
// =============================================================================

export interface EventScheduleData {
  id: string;
  eventId: string;
  gatesOpenTime: string;
  earlyEntryStart?: string;
  eventStartTime: string;
  eventEndTime: string;
  halftimeStart?: string;
  halftimeEnd?: string;
  exitStartTime: string;
  venueCloseTime: string;
  peakWindows: PeakWindow[];
  miniEvents: MiniEvent[];
  currentPhase: SchedulePhase;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface PeakWindow {
  start: string;
  end: string;
  phase: string;
  reason: string;
}

export interface MiniEvent {
  name: string;
  start: string;
  end: string;
  zones_affected?: string[];
}

export interface ScheduleContextResponse {
  success: boolean;
  data: {
    schedule: EventScheduleData;
    currentPhase: SchedulePhase;
    isPeakWindow: boolean;
    currentMiniEvent?: MiniEvent;
    timestamp: string;
  };
}

export interface CreateScheduleRequest {
  gatesOpenTime: string;
  eventStartTime: string;
  eventEndTime: string;
  exitStartTime: string;
  venueCloseTime: string;
  earlyEntryStart?: string;
  halftimeStart?: string;
  halftimeEnd?: string;
  peakWindows?: PeakWindow[];
  miniEvents?: MiniEvent[];
  currentPhase?: SchedulePhase;
}

// =============================================================================
// Forecast Types
// =============================================================================

export interface CrowdForecastData {
  id: string;
  eventId: string;
  zoneId: string;
  forecastTime: string;
  targetTime: string;
  horizonMinutes: number;

  // Predicted metrics
  predictedCount: number;
  predictedDensity: number;
  predictedDensityLevel: DensityLevel;
  predictedRiskLevel: RiskLevel;

  // Predicted flows
  predictedInflow: number;
  predictedOutflow: number;

  // Confidence metrics
  confidence: number;
  modelVersion: string;
  modelType: string;

  // Input features summary
  inputFeatures: any;

  // Recommendations
  alerts: any[];
  recommendations: string[];

  createdAt: string;
}

export interface CrowdForecastListResponse {
  success: boolean;
  data: CrowdForecastData[];
  count: number;
}

export interface CreateForecastRequest {
  zoneId: string;
  targetTime: string;
  horizonMinutes: number;
  predictedCount: number;
  predictedDensity: number;
  predictedDensityLevel?: DensityLevel;
  predictedRiskLevel?: RiskLevel;
  predictedInflow?: number;
  predictedOutflow?: number;
  confidence?: number;
  modelVersion?: string;
  modelType?: string;
  inputFeatures?: any;
  alerts?: any[];
  recommendations?: string[];
}

// =============================================================================
// Simulation Types
// =============================================================================

export interface SimulationRequest {
  duration?: number; // minutes
  interval?: number; // minutes between snapshots
  zones?: string[]; // optional zone IDs
}

export interface SimulationResponse {
  success: boolean;
  message: string;
  data: {
    zonesCount: number;
    timesteps: number;
    statesCreated: number;
    duration: string;
    interval: string;
  };
}

export interface CreateZoneStateRequest {
  venueId?: string;
  timestamp?: string;
  timestepIndex?: number;
  crowdCount: number;
  crowdDensity?: number;
  densityLevel?: DensityLevel;
  inflowRate?: number;
  outflowRate?: number;
  avgSpeed?: number;
  directionEntropy?: number;
  avgDwellTime?: number;
  queueLength?: number;
  avgWaitTime?: number;
  schedulePhase?: SchedulePhase;
  isPeakWindow?: boolean;
  temperature?: number;
  humidity?: number;
  weatherImpact?: number;
  riskLevel?: RiskLevel;
  congestionScore?: number;
  bottleneckScore?: number;
  dataSource?: string;
  confidence?: number;
  isPredicted?: boolean;
  predictionHorizon?: number;
}

// =============================================================================
// WebSocket Event Types
// =============================================================================

export interface ZoneUpdateEvent {
  type: 'zone_update';
  eventId: string;
  zoneId: string;
  data: ZoneStateSnapshot;
  timestamp: string;
}

export interface ZoneForecastEvent {
  type: 'zone_forecast';
  eventId: string;
  zoneId: string;
  data: CrowdForecastData;
  timestamp: string;
}

export interface ZoneAlertEvent {
  type: 'zone_alert';
  eventId: string;
  zoneId: string;
  alert: {
    type: string;
    severity: string;
    message: string;
    recommendation: string;
    timestamp: string;
  };
}

// =============================================================================
// Helper Types
// =============================================================================

export interface PhaseExpectations {
  description: string;
  expectedDensity: string;
  criticalZones: string[];
  recommendations: string[];
}

export interface TimeToNextPhase {
  nextPhase: SchedulePhase;
  minutesUntil: number;
  timestamp: Date;
}

export interface ZoneHealthScore {
  zoneId: string;
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  issues: string[];
  recommendations: string[];
}

// =============================================================================
// Error Types
// =============================================================================

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

// =============================================================================
// Query Parameter Types
// =============================================================================

export interface ZoneStateQueryParams {
  window?: string; // minutes to look back
  zoneId?: string; // filter by zone
  limit?: string; // max timesteps
}

export interface ZoneHistoryQueryParams {
  startTime?: string;
  endTime?: string;
  limit?: string;
}

export interface ForecastQueryParams {
  horizon?: string; // minutes ahead (10, 30, 60)
  zoneId?: string; // filter by zone
}

// =============================================================================
// ML Service Integration Types (for future ML service communication)
// =============================================================================

export interface MLServiceForecastRequest {
  eventId: string;
  zoneId: string;
  historicalWindow: ZoneStateSnapshot[]; // Last N timesteps
  horizon: number; // Minutes ahead to forecast
  metadata: {
    zoneMetadata: ZoneMetadataResponse;
    currentPhase: SchedulePhase;
    isPeakWindow: boolean;
  };
}

export interface MLServiceForecastResponse {
  zoneId: string;
  targetTime: string;
  horizonMinutes: number;
  predictions: {
    crowdCount: number;
    density: number;
    densityLevel: DensityLevel;
    riskLevel: RiskLevel;
    inflow: number;
    outflow: number;
  };
  confidence: number;
  modelVersion: string;
  alerts: any[];
  recommendations: string[];
}
