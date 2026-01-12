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
 * Zone Real-Time Data Service
 * 
 * Integrates with existing DrishtiX services to collect real-time crowd data:
 * - Video Analytics Service for camera-based crowd detection
 * - YOLO Vision Service for accurate people counting
 * - Azure Synapse Analytics for historical data
 * - Camera feeds for live monitoring
 * 
 * Aggregates data every 5 minutes and stores in ZoneState for LSTM forecasting
 */

import { PrismaClient, DensityLevel, RiskLevel, SchedulePhase } from '@prisma/client';
import { videoAnalyticsService, FrameAnalysisResult } from './video-analytics.service';
import { azureSynapseAnalyticsService } from './azure-synapse-analytics.service';
import { classifyDensityLevel, getEventSafetyThresholds } from './organizer-config.helper';
import { organizerConfigService } from './organizer-config.service';
import { io } from '../index';
import {
  getEnabledZones,
  getVenueConfiguration,
  ZoneCameraMapping
} from '../config/zone-camera-mappings.config';

const prisma = new PrismaClient();

// Real-time zone state data
interface RealTimeZoneData {
  zoneId: string;
  timestamp: Date;
  peopleCount: number;
  densityLevel: DensityLevel;
  densityValue: number;
  riskLevel: RiskLevel;
  flowRateIn: number;
  flowRateOut: number;
  avgMovementSpeed: number;
  temperatureCelsius?: number;
  weatherConditions?: string;
  cameraHealth: number;
  anomaliesDetected: number;
  alertCount: number;
}

class ZoneRealtimeDataService {
  private readonly COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly CAMERA_ANALYSIS_INTERVAL = 10000; // Analyze camera frames every 10 seconds
  private activeCollections: Map<string, {
    timer: NodeJS.Timeout;
    cameraTimers: Map<string, NodeJS.Timeout>;
  }> = new Map();
  private lastZoneData: Map<string, Map<string, RealTimeZoneData>> = new Map(); // eventId -> zoneId -> data
  private cameraFrameBuffer: Map<string, Map<string, FrameAnalysisResult[]>> = new Map(); // eventId -> zoneId -> frames
  private zoneCameraMappings: Map<string, ZoneCameraMapping[]> = new Map(); // eventId -> mappings
  private collectionMetrics: Map<string, {
    collectionsCount: number;
    lastCollectionTime: Date;
    errors: number;
    successRate: number;
  }> = new Map();

  constructor() {
    console.log('[Zone Real-Time Data Service] Initialized with flexible configuration support');
  }

  /**
   * Load zone-camera mappings for an event
   */
  private async loadZoneMappings(eventId: string): Promise<ZoneCameraMapping[]> {
    // Check if already loaded
    if (this.zoneCameraMappings.has(eventId)) {
      return this.zoneCameraMappings.get(eventId)!;
    }

    // Get event venue information
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { venue: true },
    });

    // Load venue-specific configuration or use default
    const venueId = event?.venue || 'default-stadium';
    const mappings = getEnabledZones(venueId);

    this.zoneCameraMappings.set(eventId, mappings);
    console.log(`[Zone Real-Time Data] Loaded ${mappings.length} zone mappings for event ${eventId} (venue: ${venueId})`);

    return mappings;
  }

  /**
   * Start real-time data collection for an event
   */
  async startDataCollection(eventId: string): Promise<void> {
    // Check if already collecting for this event
    if (this.activeCollections.has(eventId)) {
      console.log(`[Zone Real-Time Data] Collection already active for event: ${eventId}`);
      return;
    }

    console.log(`[Zone Real-Time Data] Starting collection for event: ${eventId}`);

    // Load zone mappings
    const mappings = await this.loadZoneMappings(eventId);

    // Initialize zones if they don't exist
    await this.initializeZonesForEvent(eventId, mappings);

    // Initialize data structures
    this.lastZoneData.set(eventId, new Map());
    this.cameraFrameBuffer.set(eventId, new Map());
    this.collectionMetrics.set(eventId, {
      collectionsCount: 0,
      lastCollectionTime: new Date(),
      errors: 0,
      successRate: 100,
    });

    // Start 5-minute aggregation timer
    const collectionTimer = setInterval(async () => {
      await this.collectAndAggregateZoneData(eventId);
    }, this.COLLECTION_INTERVAL);

    // Start camera analysis for all zones
    const cameraTimers = new Map<string, NodeJS.Timeout>();
    for (const mapping of mappings) {
      const timer = this.startCameraAnalysis(eventId, mapping);
      cameraTimers.set(mapping.zoneId, timer);
    }

    // Store active collection
    this.activeCollections.set(eventId, {
      timer: collectionTimer,
      cameraTimers,
    });

    // Immediate first collection
    await this.collectAndAggregateZoneData(eventId);

    console.log(`[Zone Real-Time Data] Collection started for event ${eventId} - monitoring ${mappings.length} zones`);
  }

  /**
   * Stop data collection for a specific event
   */
  stopDataCollection(eventId: string): void {
    const collection = this.activeCollections.get(eventId);
    if (!collection) {
      console.log(`[Zone Real-Time Data] No active collection for event: ${eventId}`);
      return;
    }

    // Stop main collection timer
    clearInterval(collection.timer);

    // Stop all camera timers
    collection.cameraTimers.forEach((timer) => clearInterval(timer));

    // Clean up data structures
    this.activeCollections.delete(eventId);
    this.lastZoneData.delete(eventId);
    this.cameraFrameBuffer.delete(eventId);
    this.zoneCameraMappings.delete(eventId);

    console.log(`[Zone Real-Time Data] Collection stopped for event: ${eventId}`);
  }

  /**
   * Stop all active collections
   */
  stopAllCollections(): void {
    console.log(`[Zone Real-Time Data] Stopping all active collections (${this.activeCollections.size} events)`);
    const eventIds = Array.from(this.activeCollections.keys());
    eventIds.forEach((eventId) => this.stopDataCollection(eventId));
  }

  /**
   * Get active event IDs
   */
  getActiveEventIds(): string[] {
    return Array.from(this.activeCollections.keys());
  }

  /**
   * Get collection metrics for an event
   */
  getCollectionMetrics(eventId: string) {
    return this.collectionMetrics.get(eventId);
  }

  /**
   * Initialize zones in database if not exists
   */
  private async initializeZonesForEvent(eventId: string, mappings: ZoneCameraMapping[]): Promise<void> {
    const existingZones = await prisma.zoneMetadata.findMany({
      where: { eventId },
    });

    if (existingZones.length > 0) {
      console.log(`[Zone Real-Time Data] Found ${existingZones.length} existing zones for event ${eventId}`);
      return;
    }

    // Create zones based on camera mappings
    for (const mapping of mappings) {
      await prisma.zoneMetadata.create({
        data: {
          eventId,
          venueId: 'default', // mapping.venueId doesn't exist on ZoneCameraMapping type
          zoneId: mapping.zoneId,
          zoneName: mapping.zoneName,
          areaCategory: this.getAreaCategory(mapping.zoneType),
          areaCategoryName: mapping.zoneType,
          maxCapacity: mapping.capacity || 100, // Use 'capacity' not 'maxCapacity'
          areaSqMeters: mapping.areaSquareMeters,
          fixedSeating: false, // mapping.fixedSeating doesn't exist on ZoneCameraMapping type
          zonePriority: mapping.priority || 3, // Required field
          coordinates: mapping.location || {}, // Required field
          metadata: {
            cameraIds: mapping.cameraIds,
            adjacentZones: mapping.adjacentZones,
          },
        },
      });
    }

    console.log(`[Zone Real-Time Data] Initialized ${mappings.length} zones for event ${eventId}`);
  }

  /**
   * Start continuous camera analysis for a zone
   */
  private startCameraAnalysis(eventId: string, mapping: ZoneCameraMapping): NodeJS.Timeout {
    const timer = setInterval(async () => {
      await this.analyzeCamerasForZone(eventId, mapping);
    }, this.CAMERA_ANALYSIS_INTERVAL);

    return timer;
  }

  /**
   * Analyze all cameras in a zone
   */
  private async analyzeCamerasForZone(
    eventId: string,
    mapping: ZoneCameraMapping
  ): Promise<void> {
    try {
      const results: FrameAnalysisResult[] = [];

      // In a real implementation, you would fetch actual camera frames
      // For now, we'll query the latest VideoFrame data from the database
      const latestFrames = await prisma.videoFrame.findMany({
        where: {
          cameraId: { in: mapping.cameraIds },
          eventId,
          timestamp: {
            gte: new Date(Date.now() - this.CAMERA_ANALYSIS_INTERVAL * 2),
          },
        },
        orderBy: { timestamp: 'desc' },
        take: mapping.cameraIds.length,
      });

      // If we have camera frames, use them
      if (latestFrames.length > 0) {
        for (const frame of latestFrames) {
          const result: FrameAnalysisResult = {
            cameraId: frame.cameraId,
            timestamp: frame.timestamp,
            peopleCount: frame.peopleCount,
            crowdDensity: frame.densityLevel as any,
            densityValue: this.densityLevelToValue(frame.densityLevel),
            anomalies: (frame.anomalies as any[]) || [],
            alerts: [],
            processingTimeMs: 0,
          };
          results.push(result);
        }
      }

      // Store results in buffer for aggregation
      const eventBuffer = this.cameraFrameBuffer.get(eventId);
      if (!eventBuffer) return;

      if (!eventBuffer.has(mapping.zoneId)) {
        eventBuffer.set(mapping.zoneId, []);
      }

      const buffer = eventBuffer.get(mapping.zoneId)!;
      buffer.push(...results);

      // Keep only last 5 minutes of data
      const fiveMinutesAgo = new Date(Date.now() - this.COLLECTION_INTERVAL);
      eventBuffer.set(
        mapping.zoneId,
        buffer.filter((r) => r.timestamp >= fiveMinutesAgo)
      );
    } catch (error) {
      console.error(`[Zone Real-Time Data] Error analyzing cameras for zone ${mapping.zoneId}:`, error);
    }
  }

  /**
   * Collect and aggregate zone data every 5 minutes
   */
  private async collectAndAggregateZoneData(eventId: string): Promise<void> {
    console.log(`[Zone Real-Time Data] Collecting data for event: ${eventId}`);

    const timestamp = new Date();
    const timeIndex = Math.floor(timestamp.getTime() / this.COLLECTION_INTERVAL);

    try {
      // Get event schedule for phase detection
      const schedule = await prisma.eventSchedule.findFirst({
        where: { eventId },
      });

      const currentPhase = this.determineCurrentPhase(schedule, timestamp);

      // Get zone mappings for this event
      const mappings = this.zoneCameraMappings.get(eventId) || [];
      const eventLastData = this.lastZoneData.get(eventId);

      if (!eventLastData) {
        console.error(`[Zone Real-Time Data] No data cache for event ${eventId}`);
        return;
      }

      // Track metrics
      const metrics = this.collectionMetrics.get(eventId);
      if (metrics) {
        metrics.collectionsCount++;
        metrics.lastCollectionTime = timestamp;
      }

      // Process each zone
      let successCount = 0;
      for (const mapping of mappings) {
        try {
          const zoneData = await this.aggregateZoneData(eventId, mapping, timestamp, currentPhase);

          if (zoneData) {
            // Calculate flow rates from previous data
            const lastData = eventLastData.get(mapping.zoneId);
            const flowData = this.calculateFlowRates(lastData, zoneData);

            // Store in database
            await this.storeZoneState(eventId, mapping.zoneId, zoneData, flowData, timeIndex, currentPhase);

            // Update last data cache
            eventLastData.set(mapping.zoneId, zoneData);

            // Emit WebSocket update
            io.to(`event-${eventId}`).emit('zone:state-update', {
              zoneId: mapping.zoneId,
              data: zoneData,
              timestamp: timestamp.toISOString(),
            });

            successCount++;
          }
        } catch (error) {
          console.error(`[Zone Real-Time Data] Error processing zone ${mapping.zoneId}:`, error);
          if (metrics) metrics.errors++;
        }
      }

      console.log(`[Zone Real-Time Data] Collection complete for event ${eventId}: ${successCount}/${mappings.length} zones`);

      // Update metrics
      if (metrics) {
        metrics.successRate = (successCount / mappings.length) * 100;
      }
    } catch (error) {
      console.error(`[Zone Real-Time Data] Error during collection for event ${eventId}:`, error);
      const metrics = this.collectionMetrics.get(eventId);
      if (metrics) {
        metrics.errors++;
        metrics.successRate = 0;
      }
    }
  }

  /**
   * Aggregate data from all cameras in a zone
   */
  private async aggregateZoneData(
    eventId: string,
    mapping: ZoneCameraMapping,
    timestamp: Date,
    currentPhase: string
  ): Promise<RealTimeZoneData | null> {
    const eventBuffer = this.cameraFrameBuffer.get(eventId);
    const buffer = eventBuffer?.get(mapping.zoneId) || [];

    if (buffer.length === 0) {
      // No camera data available - try to get from CrowdDensity or VideoFrame table
      const recentData = await prisma.videoFrame.findFirst({
        where: {
          cameraId: { in: mapping.cameraIds },
          eventId,
          timestamp: {
            gte: new Date(Date.now() - this.COLLECTION_INTERVAL),
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!recentData) {
        console.warn(`[Zone Real-Time Data] No data available for zone: ${mapping.zoneId}`);
        return null;
      }

      // Use single camera data
      return {
        zoneId: mapping.zoneId,
        timestamp,
        peopleCount: recentData.peopleCount,
        densityLevel: recentData.densityLevel,
        densityValue: this.densityLevelToValue(recentData.densityLevel),
        riskLevel: 'LOW', // Will be calculated in async aggregation
        flowRateIn: 0,
        flowRateOut: 0,
        avgMovementSpeed: 0,
        cameraHealth: 1.0,
        anomaliesDetected: ((recentData.anomalies as any[]) || []).length,
        alertCount: 0,
      };
    }

    // Aggregate from multiple cameras
    const totalPeople = buffer.reduce((sum, r) => sum + r.peopleCount, 0);
    const avgPeople = Math.round(totalPeople / Math.max(buffer.length, 1));

    const avgDensity =
      buffer.reduce((sum, r) => sum + r.densityValue, 0) / Math.max(buffer.length, 1);

    const allAnomalies = buffer.flatMap((r) => r.anomalies);
    const totalAlerts = buffer.reduce((sum, r) => sum + r.alerts.length, 0);

    const densityLevel = await this.getDensityLevel(eventId, mapping.zoneId, avgDensity);
    const riskLevel = await this.calculateRiskLevel(eventId, mapping.zoneId, densityLevel, allAnomalies);

    // Camera health (percentage of expected cameras reporting)
    const cameraHealth = buffer.length / (mapping.cameraIds.length * 10); // Expected ~10 reports per camera in 5 min

    return {
      zoneId: mapping.zoneId,
      timestamp,
      peopleCount: avgPeople,
      densityLevel,
      densityValue: avgDensity,
      riskLevel,
      flowRateIn: 0, // Will be calculated from delta
      flowRateOut: 0,
      avgMovementSpeed: this.calculateAvgMovementSpeed(buffer),
      cameraHealth: Math.min(cameraHealth, 1.0),
      anomaliesDetected: allAnomalies.length,
      alertCount: totalAlerts,
    };
  }

  /**
   * Calculate flow rates from previous and current data
   */
  private calculateFlowRates(
    lastData: RealTimeZoneData | undefined,
    currentData: RealTimeZoneData
  ): { flowRateIn: number; flowRateOut: number } {
    if (!lastData) {
      return { flowRateIn: 0, flowRateOut: 0 };
    }

    const timeDeltaMinutes = 5; // Fixed 5-minute interval
    const countDelta = currentData.peopleCount - lastData.peopleCount;

    if (countDelta > 0) {
      return {
        flowRateIn: countDelta / timeDeltaMinutes,
        flowRateOut: 0,
      };
    } else {
      return {
        flowRateIn: 0,
        flowRateOut: Math.abs(countDelta) / timeDeltaMinutes,
      };
    }
  }

  /**
   * Store zone state in database
   */
  private async storeZoneState(
    eventId: string,
    zoneId: string,
    zoneData: RealTimeZoneData,
    flowData: { flowRateIn: number; flowRateOut: number },
    timeIndex: number,
    currentPhase: string
  ): Promise<void> {
    try {
      // Get zone metadata
      const zone = await prisma.zoneMetadata.findUnique({
        where: { id: zoneId },
      });

      if (!zone) {
        console.error(`[Zone Real-Time Data] Zone not found: ${zoneId}`);
        return;
      }

      // Calculate occupancy percentage
      const occupancyPercent = (zoneData.peopleCount / zone.maxCapacity) * 100;

      // Prepare data for storage
      await prisma.zoneState.create({
        data: {
          eventId,
          venueId: zone.venueId,
          zoneId,
          timestamp: zoneData.timestamp,
          timestepIndex: timeIndex,
          crowdCount: zoneData.peopleCount,
          crowdDensity: zoneData.densityValue,
          densityLevel: zoneData.densityLevel,
          inflowRate: flowData.flowRateIn,
          outflowRate: flowData.flowRateOut,
          netFlowRate: flowData.flowRateIn - flowData.flowRateOut,
          avgSpeed: zoneData.avgMovementSpeed,
          directionEntropy: 0.5, // Default value
          avgDwellTime: this.estimateWaitTime(zoneData.densityLevel),
          schedulePhase: currentPhase as SchedulePhase,
          isPeakWindow: false,
          temperature: zoneData.temperatureCelsius,
          riskLevel: zoneData.riskLevel,
          congestionScore: occupancyPercent / 100,
          dataSource: 'camera',
          confidence: zoneData.cameraHealth,
          isPredicted: false,
        },
      });

      // Also update CrowdDensity table for backward compatibility
      await this.updateCrowdDensityTable(eventId, zoneData);
    } catch (error) {
      console.error(`[Zone Real-Time Data] Error storing zone state for ${zoneId}:`, error);
    }
  }

  /**
   * Update legacy CrowdDensity table
   */
  private async updateCrowdDensityTable(
    eventId: string,
    zoneData: RealTimeZoneData
  ): Promise<void> {
    try {
      await prisma.crowdDensity.create({
        data: {
          eventId,
          timestamp: zoneData.timestamp,
          totalCount: zoneData.peopleCount,
          averageDensity: zoneData.densityValue,
          zones: [
            {
              zoneId: zoneData.zoneId,
              count: zoneData.peopleCount,
              density: zoneData.densityValue,
              densityLevel: zoneData.densityLevel,
            },
          ],
          cameraData: [],
          source: 'VIDEO_ANALYTICS',
        },
      });
    } catch (error) {
      console.error('[Zone Real-Time Data] Error updating CrowdDensity table:', error);
    }
  }

  /**
   * Get real-time data for a specific zone
   */
  async getCurrentZoneData(eventId: string, zoneId: string): Promise<RealTimeZoneData | null> {
    const eventData = this.lastZoneData.get(eventId);
    return eventData?.get(zoneId) || null;
  }

  /**
   * Get real-time data for all zones in an event
   */
  async getAllZonesData(eventId: string): Promise<RealTimeZoneData[]> {
    const eventData = this.lastZoneData.get(eventId);
    return eventData ? Array.from(eventData.values()) : [];
  }

  // Helper methods

  private formatZoneName(zoneId: string): string {
    return zoneId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async getZoneCapacity(eventId: string, zoneId: string, type: string): Promise<number> {
    try {
      // Try to get organizer-specific configuration first
      const zoneConfig = await organizerConfigService.getZoneConfiguration(eventId, zoneId);
      if (zoneConfig) {
        return zoneConfig.maxCapacity;
      }
    } catch (error) {
      console.warn(`[Zone Real-Time Data] Could not fetch capacity for zone ${zoneId}, using type-based default`);
    }

    // Fallback to type-based defaults
    const capacities: Record<string, number> = {
      GATE: 200,
      STAND: 1000,
      CONCOURSE: 500,
      EXIT: 150,
      PARKING: 300,
      VIP: 100,
      SECURITY: 50,
    };
    return capacities[type] || 500;
  }

  private async getZoneArea(eventId: string, zoneId: string, type: string): Promise<number> {
    try {
      // Try to get organizer-specific configuration first
      const zoneConfig = await organizerConfigService.getZoneConfiguration(eventId, zoneId);
      if (zoneConfig) {
        return zoneConfig.areaSqMeters;
      }
    } catch (error) {
      console.warn(`[Zone Real-Time Data] Could not fetch area for zone ${zoneId}, using type-based default`);
    }

    // Fallback to type-based defaults
    const areas: Record<string, number> = {
      GATE: 100,
      STAND: 500,
      CONCOURSE: 300,
      EXIT: 50,
      PARKING: 1000,
      VIP: 200,
      SECURITY: 50,
    };
    return areas[type] || 200;
  }

  private determineCurrentPhase(schedule: any, timestamp: Date): string {
    if (!schedule) return 'ACTIVE';

    const now = timestamp.getTime();
    const eventStart = new Date(schedule.eventStart).getTime();
    const gatesOpen = new Date(schedule.gatesOpen).getTime();
    const eventEnd = new Date(schedule.eventEnd).getTime();

    if (now < gatesOpen) return 'PRE_EVENT';
    if (now < eventStart) return 'ENTRY';
    if (now < eventEnd) return 'ACTIVE';
    return 'EXIT';
  }

  private densityLevelToValue(level: DensityLevel): number {
    const map: Record<DensityLevel, number> = {
      LOW: 0.25,
      MEDIUM: 0.55,
      HIGH: 0.8,
      CRITICAL: 0.95,
    };
    return map[level] || 0.5;
  }

  /**
   * Get density level using organizer's custom thresholds
   */
  private async getDensityLevel(eventId: string, zoneId: string, densityValue: number): Promise<DensityLevel> {
    try {
      // Prefer organizer-specific thresholds from config service
      const level = await organizerConfigService.getDensityLevel(eventId, zoneId, densityValue);
      return level;
    } catch (error) {
      // Fallback to classifyDensityLevel helper
      try {
        return await classifyDensityLevel(eventId, densityValue);
      } catch (error2) {
        // Ultimate fallback to default thresholds
        if (densityValue >= 0.85) return 'CRITICAL';
        if (densityValue >= 0.6) return 'HIGH';
        if (densityValue >= 0.3) return 'MEDIUM';
        return 'LOW';
      }
    }
  }

  /**
   * Calculate risk level using organizer's thresholds and anomaly data
   */
  private async calculateRiskLevel(
    eventId: string,
    zoneId: string,
    densityLevel: DensityLevel,
    anomalies: any[]
  ): Promise<RiskLevel> {
    try {
      // Calculate base risk score
      const baseRiskScore = this.riskLevelToScore(densityLevel);
      const anomalyBoost = anomalies.length * 0.1;
      const highSeverityBoost = anomalies.some(a => a.severity === 'HIGH' || a.severity === 'CRITICAL') ? 0.3 : 0;
      const totalRiskScore = Math.min(1.0, baseRiskScore + anomalyBoost + highSeverityBoost);

      // Use organizer-specific risk thresholds
      return await organizerConfigService.getRiskLevel(eventId, zoneId, totalRiskScore);
    } catch (error) {
      // Fallback to simple density-based risk calculation
      const hasHighSeverityAnomaly = anomalies.some(
        (a) => a.severity === 'HIGH' || a.severity === 'CRITICAL'
      );

      if (hasHighSeverityAnomaly || densityLevel === 'CRITICAL') return 'CRITICAL';
      if (densityLevel === 'HIGH' || anomalies.length > 2) return 'HIGH';
      if (densityLevel === 'MEDIUM' || anomalies.length > 0) return 'MEDIUM';
      return 'LOW';
    }
  }

  private calculateAvgMovementSpeed(results: FrameAnalysisResult[]): number {
    // Simplified - in real implementation, would use optical flow analysis
    return 1.2; // meters per second (average walking speed)
  }

  private estimateWaitTime(densityLevel: DensityLevel): number {
    const waitTimes: Record<DensityLevel, number> = {
      LOW: 0,
      MEDIUM: 2,
      HIGH: 5,
      CRITICAL: 10,
    };
    return waitTimes[densityLevel] || 0;
  }

  private riskLevelToScore(level: RiskLevel): number {
    const scores: Record<RiskLevel, number> = {
      LOW: 0.2,
      MEDIUM: 0.5,
      HIGH: 0.75,
      CRITICAL: 0.95,
    };
    return scores[level] || 0.5;
  }

  private getAreaCategory(zoneType: string): number {
    const categoryMap: Record<string, number> = {
      'entry_exit': 1,
      'seating': 2,
      'concourse': 3,
      'amenity': 4,
      'vip': 5,
      'emergency': 6,
      'parking': 7,
    };
    return categoryMap[zoneType] || 0;
  }
}

export const zoneRealtimeDataService = new ZoneRealtimeDataService();
