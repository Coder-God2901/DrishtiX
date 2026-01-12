/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * Organizer Configuration Service
 * 
 * Manages all organizer-specific configurations including venues, zones,
 * thresholds, and event-specific overrides. Replaces all hardcoded defaults
 * with customizable, real-time data.
 */

import { PrismaClient } from '@prisma/client';
import {
  VenueConfiguration,
  ZoneConfiguration,
  EventConfiguration,
  VenueThresholds,
  ZoneThresholds,
  DensityThresholds,
  RiskThresholds,
  CreateVenueConfigRequest,
  UpdateVenueConfigRequest,
  CreateEventConfigRequest,
  UpdateEventConfigRequest,
  ConfigValidationResult,
} from '../types/organizer-config.types';

const prisma = new PrismaClient();

class OrganizerConfigurationService {

  // =============================================================================
  // Venue Configuration Management
  // =============================================================================

  /**
   * Create a new venue configuration for an organizer
   */
  async createVenueConfiguration(
    request: CreateVenueConfigRequest
  ): Promise<VenueConfiguration> {
    // Generate zone IDs
    const zones = request.zones.map((zone, index) => ({
      ...zone,
      zoneId: `zone-${Date.now()}-${index}`,
    }));

    // Generate gate IDs
    const gates = request.gates.map((gate, index) => ({
      ...gate,
      gateId: `gate-${Date.now()}-${index}`,
    }));

    // Apply default thresholds if not provided, or merge partials with defaults
    const thresholds: VenueThresholds = {
      ...this.getDefaultVenueThresholds(),
      ...(request.thresholds || {}),
      overallDensity: {
        ...this.getDefaultVenueThresholds().overallDensity,
        ...(request.thresholds?.overallDensity || {}),
      },
      overallRisk: {
        ...this.getDefaultVenueThresholds().overallRisk,
        ...(request.thresholds?.overallRisk || {}),
      },
    };

    const config: VenueConfiguration = {
      id: `venue-config-${Date.now()}`,
      organizerId: request.organizerId,
      venueId: `venue-${Date.now()}`,
      venueName: request.venueName,
      venueType: request.venueType,
      totalCapacity: request.totalCapacity,
      totalArea: zones.reduce((sum, z) => sum + z.areaSqMeters, 0),
      floors: Math.max(...zones.map(z => z.floor), 1),
      location: request.location,
      zones: zones as ZoneConfiguration[],
      gates: gates,
      emergencyExits: [],
      medicalStations: [],
      thresholds,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in database (using EventConfig's dynamicFields for now)
    await prisma.eventConfig.create({
      data: {
        eventId: config.venueId, // Use venueId as eventId for venue configs
        dynamicFields: config as any,
      },
    });

    console.log(`[Organizer Config] Created venue configuration: ${config.venueId}`);
    return config;
  }

  /**
   * Get venue configuration by venueId
   */
  async getVenueConfiguration(venueId: string): Promise<VenueConfiguration | null> {
    const config = await prisma.eventConfig.findUnique({
      where: { eventId: venueId },
    });

    if (!config) {
      return null;
    }

    return config.dynamicFields as any as VenueConfiguration;
  }

  /**
   * Update venue configuration
   */
  async updateVenueConfiguration(
    venueId: string,
    updates: UpdateVenueConfigRequest
  ): Promise<VenueConfiguration> {
    const existing = await this.getVenueConfiguration(venueId);

    if (!existing) {
      throw new Error(`Venue configuration not found: ${venueId}`);
    }

    const updated: VenueConfiguration = {
      ...existing,
      ...updates,
      zones: updates.zones
        ? this.mergeZoneConfigurations(existing.zones, updates.zones)
        : existing.zones,
      gates: updates.gates
        ? this.mergeGateConfigurations(existing.gates, updates.gates)
        : existing.gates,
      thresholds: updates.thresholds
        ? { ...existing.thresholds, ...updates.thresholds }
        : existing.thresholds,
      updatedAt: new Date(),
    };

    await prisma.eventConfig.update({
      where: { eventId: venueId },
      data: { dynamicFields: updated as any },
    });

    console.log(`[Organizer Config] Updated venue configuration: ${venueId}`);
    return updated;
  }

  /**
   * Get all venues for an organizer
   */
  async getOrganizerVenues(organizerId: string): Promise<VenueConfiguration[]> {
    // This is a simplified query - in production, you'd have a proper index
    const configs = await prisma.eventConfig.findMany({});

    return configs
      .map(c => c.dynamicFields as any as VenueConfiguration)
      .filter(c => c.organizerId === organizerId);
  }

  // =============================================================================
  // Event Configuration Management
  // =============================================================================

  /**
   * Create event-specific configuration
   */
  async createEventConfiguration(
    request: CreateEventConfigRequest
  ): Promise<EventConfiguration> {
    const config: EventConfiguration = {
      id: `event-config-${Date.now()}`,
      eventId: request.eventId,
      organizerId: request.organizerId,
      venueId: request.venueId,
      schedule: request.schedule,
      crowdBehavior: request.crowdBehavior,
      alertConfiguration: request.alertConfiguration,
      staffAllocation: request.staffAllocation || [],
      zoneOverrides: request.zoneOverrides,
      thresholdOverrides: request.thresholdOverrides,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await prisma.eventConfig.create({
      data: {
        eventId: request.eventId,
        dynamicFields: config as any,
      },
    });

    console.log(`[Organizer Config] Created event configuration: ${request.eventId}`);
    return config;
  }

  /**
   * Get event configuration
   */
  async getEventConfiguration(eventId: string): Promise<EventConfiguration | null> {
    const config = await prisma.eventConfig.findUnique({
      where: { eventId },
    });

    if (!config) {
      return null;
    }

    return config.dynamicFields as any as EventConfiguration;
  }

  /**
   * Update event configuration
   */
  async updateEventConfiguration(
    eventId: string,
    updates: UpdateEventConfigRequest
  ): Promise<EventConfiguration> {
    const existing = await this.getEventConfiguration(eventId);

    if (!existing) {
      throw new Error(`Event configuration not found: ${eventId}`);
    }

    const updated: EventConfiguration = {
      ...existing,
      schedule: updates.schedule
        ? { ...existing.schedule, ...updates.schedule }
        : existing.schedule,
      crowdBehavior: updates.crowdBehavior
        ? { ...existing.crowdBehavior, ...updates.crowdBehavior }
        : existing.crowdBehavior,
      alertConfiguration: updates.alertConfiguration
        ? { ...existing.alertConfiguration, ...updates.alertConfiguration }
        : existing.alertConfiguration,
      staffAllocation: updates.staffAllocation || existing.staffAllocation,
      zoneOverrides: updates.zoneOverrides || existing.zoneOverrides,
      thresholdOverrides: updates.thresholdOverrides || existing.thresholdOverrides,
      updatedAt: new Date(),
    };

    await prisma.eventConfig.update({
      where: { eventId },
      data: { dynamicFields: updated as any },
    });

    console.log(`[Organizer Config] Updated event configuration: ${eventId}`);
    return updated;
  }

  // =============================================================================
  // Zone Configuration Queries
  // =============================================================================

  /**
   * Get zone configuration for a specific event/venue
   * This merges venue defaults with event overrides
   */
  async getZoneConfiguration(
    eventId: string,
    zoneId: string
  ): Promise<ZoneConfiguration | null> {
    const eventConfig = await this.getEventConfiguration(eventId);

    if (!eventConfig) {
      return null;
    }

    // Get venue configuration
    const venueConfig = await this.getVenueConfiguration(eventConfig.venueId);

    if (!venueConfig) {
      return null;
    }

    // Find zone in venue
    const venueZone = venueConfig.zones.find(z => z.zoneId === zoneId);

    if (!venueZone) {
      return null;
    }

    // Apply event-specific overrides
    if (eventConfig.zoneOverrides) {
      const override = eventConfig.zoneOverrides.find(
        (o: any) => o.zoneId === zoneId
      );

      if (override) {
        return { ...venueZone, ...override };
      }
    }

    return venueZone;
  }

  /**
   * Get all zones for an event (with overrides applied)
   */
  async getEventZones(eventId: string): Promise<ZoneConfiguration[]> {
    const eventConfig = await this.getEventConfiguration(eventId);

    if (!eventConfig) {
      return [];
    }

    const venueConfig = await this.getVenueConfiguration(eventConfig.venueId);

    if (!venueConfig) {
      return [];
    }

    // Apply overrides
    return venueConfig.zones.map(zone => {
      if (eventConfig.zoneOverrides) {
        const override = eventConfig.zoneOverrides.find(
          (o: any) => o.zoneId === zone.zoneId
        );

        if (override) {
          return { ...zone, ...override };
        }
      }

      return zone;
    });
  }

  // =============================================================================
  // Threshold Configuration Queries
  // =============================================================================

  /**
   * Get zone-specific thresholds (with fallbacks)
   */
  async getZoneThresholds(eventId: string, zoneId: string): Promise<ZoneThresholds> {
    const zoneConfig = await this.getZoneConfiguration(eventId, zoneId);

    if (zoneConfig?.thresholds) {
      return zoneConfig.thresholds;
    }

    // Fall back to event-level thresholds
    const eventConfig = await this.getEventConfiguration(eventId);

    if (eventConfig?.thresholdOverrides) {
      return this.convertVenueToZoneThresholds(
        eventConfig.thresholdOverrides as any
      );
    }

    // Fall back to venue thresholds
    if (eventConfig) {
      const venueConfig = await this.getVenueConfiguration(eventConfig.venueId);

      if (venueConfig?.thresholds) {
        return this.convertVenueToZoneThresholds(venueConfig.thresholds);
      }
    }

    // Ultimate fallback: default thresholds
    return this.getDefaultZoneThresholds();
  }

  /**
   * Get density level based on organizer's custom thresholds
   */
  async getDensityLevel(
    eventId: string,
    zoneId: string,
    densityValue: number
  ): Promise<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> {
    const thresholds = await this.getZoneThresholds(eventId, zoneId);

    if (densityValue >= thresholds.density.critical) return 'CRITICAL';
    if (densityValue >= thresholds.density.high) return 'HIGH';
    if (densityValue >= thresholds.density.medium) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get risk level based on organizer's custom thresholds
   */
  async getRiskLevel(
    eventId: string,
    zoneId: string,
    riskScore: number
  ): Promise<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> {
    const thresholds = await this.getZoneThresholds(eventId, zoneId);

    if (riskScore >= thresholds.risk.critical) return 'CRITICAL';
    if (riskScore >= thresholds.risk.high) return 'HIGH';
    if (riskScore >= thresholds.risk.medium) return 'MEDIUM';
    return 'LOW';
  }

  // =============================================================================
  // Validation
  // =============================================================================

  /**
   * Validate venue configuration
   */
  validateVenueConfiguration(config: VenueConfiguration): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!config.venueName || config.venueName.trim() === '') {
      errors.push('Venue name is required');
    }

    if (config.totalCapacity <= 0) {
      errors.push('Total capacity must be greater than 0');
    }

    if (config.zones.length === 0) {
      errors.push('At least one zone is required');
    }

    // Validate zones
    config.zones.forEach((zone, index) => {
      if (zone.maxCapacity <= 0) {
        errors.push(`Zone ${zone.zoneName} (index ${index}): Invalid max capacity`);
      }

      if (zone.areaSqMeters <= 0) {
        errors.push(`Zone ${zone.zoneName} (index ${index}): Invalid area`);
      }

      if (zone.zonePriority < 1 || zone.zonePriority > 5) {
        errors.push(`Zone ${zone.zoneName} (index ${index}): Priority must be 1-5`);
      }

      // Warning for high density
      const maxDensity = zone.maxCapacity / zone.areaSqMeters;
      if (maxDensity > 5) {
        warnings.push(
          `Zone ${zone.zoneName}: Very high max density (${maxDensity.toFixed(2)} people/m²)`
        );
      }
    });

    // Validate thresholds
    if (config.thresholds) {
      if (
        config.thresholds.overallDensity.low >= config.thresholds.overallDensity.medium ||
        config.thresholds.overallDensity.medium >= config.thresholds.overallDensity.high ||
        config.thresholds.overallDensity.high >= config.thresholds.overallDensity.critical
      ) {
        errors.push('Density thresholds must be in ascending order');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // =============================================================================
  // Default Configurations
  // =============================================================================

  /**
   * Get default venue thresholds
   */
  private getDefaultVenueThresholds(): VenueThresholds {
    return {
      overallDensity: {
        low: 0.5,
        medium: 1.5,
        high: 3.0,
        critical: 5.0,
      },
      overallRisk: {
        low: 0.3,
        medium: 0.5,
        high: 0.7,
        critical: 0.9,
      },
      temperatureWarning: 30,
      temperatureCritical: 35,
      humidityWarning: 70,
      humidityCritical: 85,
      dataCollectionInterval: 5,
      predictionHorizons: [10, 30, 60],
    };
  }

  /**
   * Get default zone thresholds
   */
  private getDefaultZoneThresholds(): ZoneThresholds {
    return {
      density: {
        low: 0.5,
        medium: 1.5,
        high: 3.0,
        critical: 5.0,
      },
      risk: {
        low: 0.3,
        medium: 0.5,
        high: 0.7,
        critical: 0.9,
      },
      waitTime: {
        normal: 5,
        warning: 10,
        critical: 20,
      },
      queueLength: {
        normal: 10,
        warning: 30,
        critical: 50,
      },
      congestion: {
        low: 0.5,
        medium: 0.7,
        high: 0.85,
        critical: 1.0,
      },
      bottleneck: {
        normal: 0.5,
        warning: 0.7,
        critical: 0.9,
      },
      movementSpeed: {
        normal: 1.2,
        slow: 0.5,
        stagnant: 0.1,
      },
    };
  }

  /**
   * Convert venue thresholds to zone thresholds
   */
  private convertVenueToZoneThresholds(venueThresholds: VenueThresholds): ZoneThresholds {
    return {
      ...this.getDefaultZoneThresholds(),
      density: venueThresholds.overallDensity,
      risk: venueThresholds.overallRisk,
    };
  }

  /**
   * Merge zone configurations (for updates)
   */
  private mergeZoneConfigurations(
    existing: ZoneConfiguration[],
    updates: Partial<ZoneConfiguration>[]
  ): ZoneConfiguration[] {
    return existing.map(zone => {
      const update = updates.find((u: any) => u.zoneId === zone.zoneId);
      return update ? { ...zone, ...update } : zone;
    });
  }

  /**
   * Merge gate configurations (for updates)
   */
  private mergeGateConfigurations(
    existing: any[],
    updates: Partial<any>[]
  ): any[] {
    return existing.map(gate => {
      const update = updates.find((u: any) => u.gateId === gate.gateId);
      return update ? { ...gate, ...update } : gate;
    });
  }
}

export const organizerConfigService = new OrganizerConfigurationService();
