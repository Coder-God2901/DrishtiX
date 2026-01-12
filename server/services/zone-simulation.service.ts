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
 * Zone Simulation Service
 * Generates realistic simulated crowd data for zones
 * Ensures temporal continuity and realistic patterns
 */

import { prisma } from '../index';
import { SchedulePhase, DensityLevel, RiskLevel } from '@prisma/client';

interface ZoneTemplate {
  zoneId: string;
  zoneName: string;
  areaCategory: number;
  areaCategoryName: string;
  maxCapacity: number;
  areaSqMeters: number;
  fixedSeating: boolean;
  bottleneckProne: boolean;
  queueProne: boolean;
  zonePriority: number;
  connectedZones: string[];
}

// Stadium zone templates
const STADIUM_ZONE_TEMPLATES: ZoneTemplate[] = [
  // Entry Gates (High Priority, Bottleneck-Prone)
  {
    zoneId: 'gate_north',
    zoneName: 'North Entrance Gate',
    areaCategory: 1,
    areaCategoryName: 'Entry Gate',
    maxCapacity: 500,
    areaSqMeters: 200,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: true,
    zonePriority: 5,
    connectedZones: ['concourse_north', 'security_north']
  },
  {
    zoneId: 'gate_south',
    zoneName: 'South Entrance Gate',
    areaCategory: 1,
    areaCategoryName: 'Entry Gate',
    maxCapacity: 500,
    areaSqMeters: 200,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: true,
    zonePriority: 5,
    connectedZones: ['concourse_south', 'security_south']
  },
  {
    zoneId: 'gate_east',
    zoneName: 'East Entrance Gate',
    areaCategory: 1,
    areaCategoryName: 'Entry Gate',
    maxCapacity: 400,
    areaSqMeters: 180,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: true,
    zonePriority: 5,
    connectedZones: ['concourse_east', 'security_east']
  },
  {
    zoneId: 'gate_west',
    zoneName: 'West Entrance Gate (VIP)',
    areaCategory: 1,
    areaCategoryName: 'Entry Gate',
    maxCapacity: 200,
    areaSqMeters: 150,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: true,
    zonePriority: 4,
    connectedZones: ['vip_lounge', 'concourse_west']
  },
  // Seating Sections (Fixed Seating)
  {
    zoneId: 'stand_a',
    zoneName: 'Stand A - North',
    areaCategory: 2,
    areaCategoryName: 'Seating Stand',
    maxCapacity: 5000,
    areaSqMeters: 2500,
    fixedSeating: true,
    bottleneckProne: false,
    queueProne: false,
    zonePriority: 3,
    connectedZones: ['concourse_north', 'aisle_north']
  },
  {
    zoneId: 'stand_b',
    zoneName: 'Stand B - East',
    areaCategory: 2,
    areaCategoryName: 'Seating Stand',
    maxCapacity: 5000,
    areaSqMeters: 2500,
    fixedSeating: true,
    bottleneckProne: false,
    queueProne: false,
    zonePriority: 3,
    connectedZones: ['concourse_east', 'aisle_east']
  },
  {
    zoneId: 'stand_c',
    zoneName: 'Stand C - South',
    areaCategory: 2,
    areaCategoryName: 'Seating Stand',
    maxCapacity: 5000,
    areaSqMeters: 2500,
    fixedSeating: true,
    bottleneckProne: false,
    queueProne: false,
    zonePriority: 3,
    connectedZones: ['concourse_south', 'aisle_south']
  },
  {
    zoneId: 'stand_d',
    zoneName: 'Stand D - West',
    areaCategory: 2,
    areaCategoryName: 'Seating Stand',
    maxCapacity: 4000,
    areaSqMeters: 2000,
    fixedSeating: true,
    bottleneckProne: false,
    queueProne: false,
    zonePriority: 3,
    connectedZones: ['concourse_west', 'aisle_west']
  },
  // Food Courts (Queue-Prone)
  {
    zoneId: 'food_north',
    zoneName: 'North Food Court',
    areaCategory: 3,
    areaCategoryName: 'Food Court',
    maxCapacity: 300,
    areaSqMeters: 400,
    fixedSeating: false,
    bottleneckProne: false,
    queueProne: true,
    zonePriority: 2,
    connectedZones: ['concourse_north']
  },
  {
    zoneId: 'food_south',
    zoneName: 'South Food Court',
    areaCategory: 3,
    areaCategoryName: 'Food Court',
    maxCapacity: 300,
    areaSqMeters: 400,
    fixedSeating: false,
    bottleneckProne: false,
    queueProne: true,
    zonePriority: 2,
    connectedZones: ['concourse_south']
  },
  // Washrooms (Queue-Prone)
  {
    zoneId: 'washroom_north',
    zoneName: 'North Washrooms',
    areaCategory: 4,
    areaCategoryName: 'Washroom',
    maxCapacity: 50,
    areaSqMeters: 100,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: true,
    zonePriority: 4,
    connectedZones: ['concourse_north']
  },
  {
    zoneId: 'washroom_south',
    zoneName: 'South Washrooms',
    areaCategory: 4,
    areaCategoryName: 'Washroom',
    maxCapacity: 50,
    areaSqMeters: 100,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: true,
    zonePriority: 4,
    connectedZones: ['concourse_south']
  },
  // Corridors/Concourses (Bottleneck-Prone)
  {
    zoneId: 'concourse_north',
    zoneName: 'North Concourse',
    areaCategory: 5,
    areaCategoryName: 'Concourse',
    maxCapacity: 800,
    areaSqMeters: 600,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: false,
    zonePriority: 4,
    connectedZones: ['stand_a', 'food_north', 'washroom_north', 'gate_north']
  },
  {
    zoneId: 'concourse_south',
    zoneName: 'South Concourse',
    areaCategory: 5,
    areaCategoryName: 'Concourse',
    maxCapacity: 800,
    areaSqMeters: 600,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: false,
    zonePriority: 4,
    connectedZones: ['stand_c', 'food_south', 'washroom_south', 'gate_south']
  },
  {
    zoneId: 'concourse_east',
    zoneName: 'East Concourse',
    areaCategory: 5,
    areaCategoryName: 'Concourse',
    maxCapacity: 700,
    areaSqMeters: 550,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: false,
    zonePriority: 4,
    connectedZones: ['stand_b', 'gate_east']
  },
  {
    zoneId: 'concourse_west',
    zoneName: 'West Concourse',
    areaCategory: 5,
    areaCategoryName: 'Concourse',
    maxCapacity: 600,
    areaSqMeters: 500,
    fixedSeating: false,
    bottleneckProne: true,
    queueProne: false,
    zonePriority: 4,
    connectedZones: ['stand_d', 'gate_west', 'vip_lounge']
  },
  // VIP Area
  {
    zoneId: 'vip_lounge',
    zoneName: 'VIP Lounge',
    areaCategory: 6,
    areaCategoryName: 'VIP Area',
    maxCapacity: 150,
    areaSqMeters: 300,
    fixedSeating: false,
    bottleneckProne: false,
    queueProne: false,
    zonePriority: 2,
    connectedZones: ['gate_west', 'concourse_west']
  }
];

class ZoneSimulationService {
  /**
   * Initialize zones for an event
   */
  async initializeZones(eventId: string, venueId?: string): Promise<any[]> {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const useVenueId = venueId || event.venue || 'default_venue';

    const zones = await Promise.all(
      STADIUM_ZONE_TEMPLATES.map(async (template) => {
        return await prisma.zoneMetadata.upsert({
          where: {
            eventId_zoneId: {
              eventId,
              zoneId: template.zoneId
            }
          },
          create: {
            eventId,
            venueId: useVenueId,
            zoneId: template.zoneId,
            zoneName: template.zoneName,
            areaCategory: template.areaCategory,
            areaCategoryName: template.areaCategoryName,
            maxCapacity: template.maxCapacity,
            areaSqMeters: template.areaSqMeters,
            fixedSeating: template.fixedSeating,
            bottleneckProne: template.bottleneckProne,
            queueProne: template.queueProne,
            zonePriority: template.zonePriority,
            connectedZones: template.connectedZones,
            coordinates: {
              type: 'Point',
              coordinates: [0, 0] // Placeholder
            },
            floor: 1
          },
          update: {}
        });
      })
    );

    return zones;
  }

  /**
   * Create default event schedule
   */
  async createDefaultSchedule(event: any): Promise<any> {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    // Calculate reasonable defaults
    const gatesOpen = new Date(eventStart.getTime() - 90 * 60 * 1000); // 90 min before
    const exitStart = new Date(eventEnd.getTime() - 15 * 60 * 1000);   // 15 min before end
    const venueClose = new Date(eventEnd.getTime() + 60 * 60 * 1000);  // 60 min after

    // Define peak windows
    const peakWindows = [
      {
        start: gatesOpen.toISOString(),
        end: new Date(eventStart.getTime() - 30 * 60 * 1000).toISOString(),
        phase: 'MAIN_ENTRY',
        reason: 'Initial entry rush'
      },
      {
        start: new Date(eventStart.getTime() + 45 * 60 * 1000).toISOString(),
        end: new Date(eventStart.getTime() + 60 * 60 * 1000).toISOString(),
        phase: 'HALFTIME',
        reason: 'Halftime break - food and washrooms'
      },
      {
        start: eventEnd.toISOString(),
        end: venueClose.toISOString(),
        phase: 'EXIT_PHASE',
        reason: 'Exit rush'
      }
    ];

    const schedule = await prisma.eventSchedule.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        gatesOpenTime: gatesOpen,
        eventStartTime: eventStart,
        eventEndTime: eventEnd,
        halftimeStart: new Date(eventStart.getTime() + 45 * 60 * 1000),
        halftimeEnd: new Date(eventStart.getTime() + 60 * 60 * 1000),
        exitStartTime: exitStart,
        venueCloseTime: venueClose,
        peakWindows,
        miniEvents: [],
        currentPhase: 'PRE_EVENT'
      },
      update: {}
    });

    return schedule;
  }

  /**
   * Generate realistic crowd count based on zone and phase
   */
  private generateCrowdCount(
    zone: any,
    phase: SchedulePhase,
    timestepIndex: number,
    previousCount?: number
  ): number {
    const { maxCapacity, areaCategory, fixedSeating, queueProne } = zone;

    let baseOccupancy = 0;

    // Base occupancy by phase
    switch (phase) {
      case 'PRE_EVENT':
        baseOccupancy = 0;
        break;
      case 'EARLY_ENTRY':
        baseOccupancy = areaCategory === 6 ? 0.3 : 0.1; // VIP areas fill first
        break;
      case 'MAIN_ENTRY':
        if (areaCategory === 1) { // Gates
          baseOccupancy = 0.7 + Math.sin(timestepIndex * 0.3) * 0.2;
        } else if (areaCategory === 5) { // Concourse
          baseOccupancy = 0.5 + Math.sin(timestepIndex * 0.2) * 0.3;
        } else if (fixedSeating) {
          baseOccupancy = Math.min(0.9, timestepIndex * 0.05);
        } else {
          baseOccupancy = 0.3;
        }
        break;
      case 'PRE_SHOW':
        if (fixedSeating) {
          baseOccupancy = 0.95;
        } else if (queueProne) {
          baseOccupancy = 0.6;
        } else {
          baseOccupancy = 0.3;
        }
        break;
      case 'MAIN_EVENT':
        if (fixedSeating) {
          baseOccupancy = 1.0;
        } else if (areaCategory === 3 || areaCategory === 4) { // Food, washroom
          baseOccupancy = 0.2;
        } else {
          baseOccupancy = 0.1;
        }
        break;
      case 'HALFTIME':
        if (fixedSeating) {
          baseOccupancy = 0.3; // People leave seats
        } else if (queueProne) { // Food, washroom
          baseOccupancy = 0.9;
        } else if (areaCategory === 5) { // Concourse
          baseOccupancy = 0.8;
        } else {
          baseOccupancy = 0.4;
        }
        break;
      case 'POST_HALFTIME':
        return this.generateCrowdCount(zone, 'MAIN_EVENT', timestepIndex);
      case 'EVENT_ENDING':
        if (fixedSeating) {
          baseOccupancy = 0.9;
        } else {
          baseOccupancy = 0.2;
        }
        break;
      case 'EXIT_PHASE':
        if (areaCategory === 1) { // Gates
          baseOccupancy = 0.8;
        } else if (areaCategory === 5) { // Concourse
          baseOccupancy = 0.7;
        } else if (fixedSeating) {
          baseOccupancy = Math.max(0, 0.9 - timestepIndex * 0.1);
        } else {
          baseOccupancy = 0.3;
        }
        break;
      case 'POST_EVENT':
        baseOccupancy = Math.max(0, 0.2 - timestepIndex * 0.05);
        break;
      default:
        baseOccupancy = 0;
    }

    // Add noise (±10%)
    const noise = (Math.random() - 0.5) * 0.2;
    const occupancy = Math.max(0, Math.min(1.2, baseOccupancy + noise));

    let count = Math.round(maxCapacity * occupancy);

    // Smooth transition from previous count
    if (previousCount !== undefined) {
      const maxChange = maxCapacity * 0.15; // Max 15% change per timestep
      if (Math.abs(count - previousCount) > maxChange) {
        count = previousCount + (count > previousCount ? maxChange : -maxChange);
      }
    }

    return Math.max(0, Math.round(count));
  }

  /**
   * Generate flow rates
   */
  private generateFlowRates(
    zone: any,
    crowdCount: number,
    previousCount: number,
    phase: SchedulePhase
  ): { inflowRate: number; outflowRate: number } {
    const netChange = crowdCount - previousCount;
    const baseFlow = Math.abs(netChange) / 5; // Per 5-minute interval

    let inflowRate = 0;
    let outflowRate = 0;

    if (netChange > 0) {
      inflowRate = baseFlow * (1 + Math.random() * 0.3);
      outflowRate = baseFlow * 0.3 * Math.random();
    } else if (netChange < 0) {
      outflowRate = baseFlow * (1 + Math.random() * 0.3);
      inflowRate = baseFlow * 0.3 * Math.random();
    } else {
      // Equilibrium - some movement still occurs
      const baseRate = zone.maxCapacity * 0.01;
      inflowRate = baseRate * (0.8 + Math.random() * 0.4);
      outflowRate = baseRate * (0.8 + Math.random() * 0.4);
    }

    return {
      inflowRate: Math.max(0, inflowRate),
      outflowRate: Math.max(0, outflowRate)
    };
  }

  /**
   * Calculate density metrics
   */
  private calculateDensityMetrics(zone: any, crowdCount: number): {
    crowdDensity: number;
    densityLevel: DensityLevel;
    congestionScore: number;
  } {
    const crowdDensity = crowdCount / zone.areaSqMeters;
    const congestionScore = Math.min(1.2, crowdCount / zone.maxCapacity);

    let densityLevel: DensityLevel;
    if (congestionScore < 0.5) {
      densityLevel = 'LOW';
    } else if (congestionScore < 0.75) {
      densityLevel = 'MEDIUM';
    } else if (congestionScore < 1.0) {
      densityLevel = 'HIGH';
    } else {
      densityLevel = 'CRITICAL';
    }

    return { crowdDensity, densityLevel, congestionScore };
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(
    zone: any,
    densityLevel: DensityLevel,
    congestionScore: number
  ): RiskLevel {
    let riskScore = 0;

    // Base risk from density
    switch (densityLevel) {
      case 'LOW': riskScore = 0.1; break;
      case 'MEDIUM': riskScore = 0.3; break;
      case 'HIGH': riskScore = 0.6; break;
      case 'CRITICAL': riskScore = 0.9; break;
    }

    // Increase risk for bottleneck-prone zones
    if (zone.bottleneckProne && congestionScore > 0.6) {
      riskScore += 0.2;
    }

    // Increase risk for queue-prone zones with high wait times
    if (zone.queueProne && congestionScore > 0.7) {
      riskScore += 0.15;
    }

    if (riskScore < 0.3) return 'LOW';
    if (riskScore < 0.6) return 'MEDIUM';
    if (riskScore < 0.85) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Generate time-series window
   */
  async generateTimeSeriesWindow(
    eventId: string,
    windowMinutes: number = 60,
    zoneId?: string
  ): Promise<any[]> {
    // Get zones
    const zones = await prisma.zoneMetadata.findMany({
      where: {
        eventId,
        ...(zoneId ? { zoneId } : {})
      }
    });

    if (zones.length === 0) {
      throw new Error('No zones found for event');
    }

    // Get or create schedule
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    let schedule = await prisma.eventSchedule.findUnique({ where: { eventId } });
    if (!schedule) {
      schedule = await this.createDefaultSchedule(event);
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - windowMinutes * 60 * 1000);
    const timesteps = Math.floor(windowMinutes / 5); // 5-minute intervals

    const states: any[] = [];
    const previousCounts: { [key: string]: number } = {};

    for (let i = 0; i < timesteps; i++) {
      const timestamp = new Date(startTime.getTime() + i * 5 * 60 * 1000);
      const phase = this.determinePhaseForTime(schedule, timestamp);
      const isPeakWindow = this.isInPeakWindowForTime(schedule, timestamp);

      for (const zone of zones) {
        const previousCount = previousCounts[zone.zoneId] || 0;
        const crowdCount = this.generateCrowdCount(zone, phase, i, previousCount);
        previousCounts[zone.zoneId] = crowdCount;

        const flows = this.generateFlowRates(zone, crowdCount, previousCount, phase);
        const metrics = this.calculateDensityMetrics(zone, crowdCount);
        const riskLevel = this.calculateRiskLevel(zone, metrics.densityLevel, metrics.congestionScore);

        states.push({
          id: `sim_${zone.zoneId}_${i}`,
          eventId,
          venueId: zone.venueId,
          zoneId: zone.zoneId,
          timestamp,
          timestepIndex: i,
          crowdCount,
          ...metrics,
          ...flows,
          netFlowRate: flows.inflowRate - flows.outflowRate,
          avgSpeed: metrics.congestionScore > 0.8 ? 0.5 : 1.2,
          directionEntropy: zone.bottleneckProne ? 0.7 : 0.3,
          avgDwellTime: zone.queueProne ? 5 + Math.random() * 10 : null,
          queueLength: zone.queueProne ? Math.floor(crowdCount * 0.3) : null,
          avgWaitTime: zone.queueProne ? 2 + Math.random() * 8 : null,
          schedulePhase: phase,
          isPeakWindow,
          temperature: 22 + Math.random() * 8,
          humidity: 40 + Math.random() * 30,
          weatherImpact: 0.1,
          riskLevel,
          bottleneckScore: zone.bottleneckProne ? metrics.congestionScore * 0.8 : null,
          dataSource: 'simulation',
          confidence: 0.85,
          isPredicted: false,
          predictionHorizon: null,
          createdAt: new Date()
        });
      }
    }

    return states;
  }

  /**
   * Generate current snapshot
   */
  async generateCurrentSnapshot(eventId: string): Promise<any[]> {
    return this.generateTimeSeriesWindow(eventId, 5);
  }

  /**
   * Generate simulated data for extended period
   */
  async generateSimulatedData(
    eventId: string,
    durationMinutes: number = 120,
    intervalMinutes: number = 5,
    zoneIds?: string[]
  ): Promise<any> {
    const zones = await prisma.zoneMetadata.findMany({
      where: {
        eventId,
        ...(zoneIds ? { zoneId: { in: zoneIds } } : {})
      }
    });

    if (zones.length === 0) {
      await this.initializeZones(eventId);
    }

    const states = await this.generateTimeSeriesWindow(eventId, durationMinutes);

    // Bulk insert
    const created = await prisma.zoneState.createMany({
      data: states.map(s => ({
        ...s,
        id: undefined // Let Prisma generate IDs
      })),
      skipDuplicates: true
    });

    return {
      zonesCount: zones.length,
      timesteps: Math.floor(durationMinutes / intervalMinutes),
      statesCreated: created.count,
      duration: `${durationMinutes} minutes`,
      interval: `${intervalMinutes} minutes`
    };
  }

  /**
   * Determine phase for given time
   */
  private determinePhaseForTime(schedule: any, time: Date): SchedulePhase {
    const t = time.getTime();

    if (t < schedule.gatesOpenTime.getTime()) return 'PRE_EVENT';
    if (schedule.earlyEntryStart && t < schedule.earlyEntryStart.getTime()) return 'EARLY_ENTRY';
    if (t < schedule.eventStartTime.getTime()) return 'MAIN_ENTRY';
    if (schedule.halftimeStart && t >= schedule.halftimeStart.getTime() && t < schedule.halftimeEnd.getTime()) {
      return 'HALFTIME';
    }
    if (t < schedule.eventEndTime.getTime()) return 'MAIN_EVENT';
    if (t < schedule.exitStartTime.getTime()) return 'EVENT_ENDING';
    if (t < schedule.venueCloseTime.getTime()) return 'EXIT_PHASE';
    return 'POST_EVENT';
  }

  /**
   * Check if time is in peak window
   */
  private isInPeakWindowForTime(schedule: any, time: Date): boolean {
    if (!schedule.peakWindows || !Array.isArray(schedule.peakWindows)) {
      return false;
    }

    const t = time.getTime();
    return schedule.peakWindows.some((window: any) => {
      const start = new Date(window.start).getTime();
      const end = new Date(window.end).getTime();
      return t >= start && t <= end;
    });
  }
}

export const zoneSimulationService = new ZoneSimulationService();
