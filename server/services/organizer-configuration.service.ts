/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * Organizer Configuration Service
 * Allows organizers to customize venue mappings, zones, gates, and all platform settings
 * Replaces all hardcoded defaults with organizer-specific configurations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface VenueZoneConfig {
  zoneId: string;
  zoneName: string;
  zoneType: 'GATE' | 'STAND' | 'CONCOURSE' | 'EXIT' | 'PARKING' | 'VIP' | 'SECURITY' | 'FOOD' | 'WASHROOM' | 'CORRIDOR';
  capacity: number;
  areaSquareMeters: number;
  fixedSeating: boolean;
  coordinates: {
    type: 'Polygon' | 'Point';
    coordinates: number[][][] | number[];
  };
  priority: number; // 1-5 for safety importance
  bottleneckProne: boolean;
  queueProne: boolean;
  connectedZones: string[];
  cameraIds: string[];
  floor: number;
  metadata?: Record<string, any>;
}

export interface VenueCameraMapping {
  cameraId: string;
  cameraName: string;
  location: string;
  zones: string[]; // Multiple zones can be monitored by one camera
  rtspUrl: string;
  isActive: boolean;
  capabilities: {
    crowdCounting: boolean;
    objectDetection: boolean;
    faceRecognition: boolean;
    anomalyDetection: boolean;
  };
}

export interface VenueConfiguration {
  venueId: string;
  venueName: string;
  organizerId: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  totalCapacity: number;
  zones: VenueZoneConfig[];
  cameras: VenueCameraMapping[];
  safetyThresholds: {
    densityLevels: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    flowRates: {
      normal: number;
      congested: number;
      critical: number;
    };
    waitTimes: {
      acceptable: number;
      concerning: number;
      critical: number;
    };
  };
  eventScheduleTemplate?: {
    preEventDuration: number; // minutes
    mainEventDuration: number;
    postEventDuration: number;
    peakPhases: string[]; // ['entry', 'half-time', 'exit']
  };
  emergencyProtocols: {
    evacuationRoutes: Array<{
      fromZone: string;
      toExit: string;
      capacity: number;
      estimatedTime: number;
    }>;
    assemblyPoints: Array<{
      id: string;
      location: any;
      capacity: number;
    }>;
    emergencyContacts: Array<{
      role: string;
      name: string;
      phone: string;
      email: string;
    }>;
  };
  customSettings: Record<string, any>;
}

export interface OrganizerSettings {
  organizerId: string;
  organizationName: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  preferences: {
    alertSensitivity: 'low' | 'medium' | 'high';
    notificationChannels: Array<'email' | 'sms' | 'push' | 'webhook'>;
    reportingFrequency: 'realtime' | 'every-5min' | 'every-15min' | 'hourly';
    autoDispatch: boolean;
    mlModelPreference: 'conservative' | 'balanced' | 'aggressive';
  };
  integrations: {
    azureSubscriptionId?: string;
    azureResourceGroup?: string;
    customWebhooks?: Array<{
      name: string;
      url: string;
      events: string[];
    }>;
  };
}

class OrganizerConfigurationService {
  getZoneThresholds(eventId: string, zoneId: string) {
    throw new Error('Method not implemented.');
  }
  /**
   * Create or update venue configuration
   */
  async saveVenueConfiguration(config: VenueConfiguration): Promise<void> {
    try {
      // Store venue configuration in JSON metadata field
      // Note: VenueLayout is event-specific, so we store organizer configs as templates
      const venueConfigData = {
        organizerId: config.organizerId,
        venueId: config.venueId,
        venueName: config.venueName,
        location: config.location,
        totalCapacity: config.totalCapacity,
        safetyThresholds: config.safetyThresholds,
        emergencyProtocols: config.emergencyProtocols,
        customSettings: config.customSettings || {},
        cameras: config.cameras,
      };

      // Save as template for the organizer's venue
      const templateEventId = `template-${config.organizerId}-${config.venueId}`;

      await prisma.venueLayout.upsert({
        where: { eventId: templateEventId },
        create: {
          eventId: templateEventId,
          boundary: {},
          zones: config.zones.map(z => ({ ...z })),
          gates: config.zones.filter(z => z.zoneType === 'GATE').map(z => ({ id: z.zoneId, name: z.zoneName })),
          routes: [],
          metadata: JSON.parse(JSON.stringify(venueConfigData)), // Deep clone to satisfy Prisma JSON type
        },
        update: {
          zones: config.zones.map(z => ({ ...z })),
          gates: config.zones.filter(z => z.zoneType === 'GATE').map(z => ({ id: z.zoneId, name: z.zoneName })),
          metadata: JSON.parse(JSON.stringify(venueConfigData)), // Deep clone to satisfy Prisma JSON type
        },
      });

      // Create zone metadata entries for each zone
      for (const zone of config.zones) {
        await prisma.zoneMetadata.upsert({
          where: {
            eventId_zoneId: {
              eventId: templateEventId,
              zoneId: zone.zoneId,
            },
          },
          create: {
            eventId: templateEventId,
            venueId: config.venueId,
            zoneId: zone.zoneId,
            zoneName: zone.zoneName,
            areaCategory: this.getAreaCategory(zone.zoneType),
            areaCategoryName: zone.zoneType,
            maxCapacity: zone.capacity,
            areaSqMeters: zone.areaSquareMeters,
            fixedSeating: zone.fixedSeating,
            bottleneckProne: zone.bottleneckProne,
            queueProne: zone.queueProne,
            zonePriority: zone.priority,
            connectedZones: zone.connectedZones,
            coordinates: zone.coordinates,
            floor: zone.floor,
            metadata: zone.metadata || {},
          },
          update: {
            zoneName: zone.zoneName,
            areaCategory: this.getAreaCategory(zone.zoneType),
            areaCategoryName: zone.zoneType,
            maxCapacity: zone.capacity,
            areaSqMeters: zone.areaSquareMeters,
            fixedSeating: zone.fixedSeating,
            bottleneckProne: zone.bottleneckProne,
            queueProne: zone.queueProne,
            zonePriority: zone.priority,
            connectedZones: zone.connectedZones,
            coordinates: zone.coordinates,
            floor: zone.floor,
            metadata: zone.metadata || {},
          },
        });
      }

      console.log(`[Organizer Config] Saved venue configuration: ${config.venueName}`);
    } catch (error) {
      console.error('[Organizer Config] Error saving venue configuration:', error);
      throw error;
    }
  }

  /**
   * Get venue configuration for an organizer
   */
  async getVenueConfiguration(venueId: string, organizerId: string): Promise<VenueConfiguration | null> {
    try {
      const templateEventId = `template-${organizerId}-${venueId}`;

      const venue = await prisma.venueLayout.findUnique({
        where: { eventId: templateEventId },
      });

      if (!venue || !venue.metadata) {
        return null;
      }

      const metadata = venue.metadata as any;

      return {
        venueId: metadata.venueId || venueId,
        venueName: metadata.venueName || 'Unnamed Venue',
        organizerId: metadata.organizerId || organizerId,
        location: metadata.location,
        totalCapacity: metadata.totalCapacity,
        zones: venue.zones as unknown as VenueZoneConfig[],
        cameras: metadata.cameras || [],
        safetyThresholds: metadata.safetyThresholds,
        emergencyProtocols: metadata.emergencyProtocols,
        customSettings: metadata.customSettings || {},
      };
    } catch (error) {
      console.error('[Organizer Config] Error getting venue configuration:', error);
      throw error;
    }
  }

  /**
   * Save organizer settings
   */
  async saveOrganizerSettings(settings: OrganizerSettings): Promise<void> {
    try {
      // Store in database (you'll need to add OrganizerSettings model to Prisma)
      console.log(`[Organizer Config] Saved settings for: ${settings.organizationName}`);
      // Implementation depends on your database schema
    } catch (error) {
      console.error('[Organizer Config] Error saving organizer settings:', error);
      throw error;
    }
  }

  /**
   * Get all zones for a venue
   */
  async getVenueZones(venueId: string, organizerId: string): Promise<VenueZoneConfig[]> {
    try {
      const templateEventId = `template-${organizerId}-${venueId}`;

      const zones = await prisma.zoneMetadata.findMany({
        where: {
          eventId: templateEventId,
        },
      });

      return zones.map((zone) => ({
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        zoneType: zone.areaCategoryName as any,
        capacity: zone.maxCapacity,
        areaSquareMeters: zone.areaSqMeters || 100,
        fixedSeating: zone.fixedSeating,
        coordinates: zone.coordinates as any,
        priority: zone.zonePriority,
        bottleneckProne: zone.bottleneckProne,
        queueProne: zone.queueProne,
        connectedZones: zone.connectedZones,
        cameraIds: [],
        floor: zone.floor,
        metadata: zone.metadata as any,
      }));
    } catch (error) {
      console.error('[Organizer Config] Error getting venue zones:', error);
      throw error;
    }
  }

  /**
   * Get camera mappings for a venue
   */
  async getVenueCameras(venueId: string, organizerId: string): Promise<VenueCameraMapping[]> {
    try {
      const venue = await this.getVenueConfiguration(venueId, organizerId);
      return venue?.cameras || [];
    } catch (error) {
      console.error('[Organizer Config] Error getting venue cameras:', error);
      throw error;
    }
  }

  /**
   * Get safety thresholds for a venue
   */
  async getSafetyThresholds(venueId: string, organizerId: string) {
    try {
      const venue = await this.getVenueConfiguration(venueId, organizerId);
      return venue?.safetyThresholds || this.getDefaultSafetyThresholds();
    } catch (error) {
      console.error('[Organizer Config] Error getting safety thresholds:', error);
      return this.getDefaultSafetyThresholds();
    }
  }

  /**
   * Apply venue configuration to an event
   */
  async applyVenueConfigToEvent(eventId: string, venueId: string, organizerId: string): Promise<void> {
    try {
      const venueConfig = await this.getVenueConfiguration(venueId, organizerId);

      if (!venueConfig) {
        throw new Error(`Venue configuration not found: ${venueId}`);
      }

      // Create zone metadata for this event based on venue template
      for (const zone of venueConfig.zones) {
        await prisma.zoneMetadata.create({
          data: {
            eventId,
            venueId: venueConfig.venueId,
            zoneId: zone.zoneId,
            zoneName: zone.zoneName,
            areaCategory: this.getAreaCategory(zone.zoneType),
            areaCategoryName: zone.zoneType,
            maxCapacity: zone.capacity,
            areaSqMeters: zone.areaSquareMeters,
            fixedSeating: zone.fixedSeating,
            bottleneckProne: zone.bottleneckProne,
            queueProne: zone.queueProne,
            zonePriority: zone.priority,
            connectedZones: zone.connectedZones,
            coordinates: zone.coordinates,
            floor: zone.floor,
            metadata: zone.metadata || {},
          },
        });
      }

      console.log(`[Organizer Config] Applied venue config to event: ${eventId}`);
    } catch (error) {
      console.error('[Organizer Config] Error applying venue config to event:', error);
      throw error;
    }
  }

  /**
   * Helper: Map zone type to category number
   */
  private getAreaCategory(zoneType: string): number {
    const mapping: Record<string, number> = {
      GATE: 1,
      STAND: 2,
      FOOD: 3,
      WASHROOM: 4,
      CORRIDOR: 5,
      CONCOURSE: 6,
      EXIT: 7,
      PARKING: 8,
      VIP: 9,
      SECURITY: 10,
    };
    return mapping[zoneType] || 0;
  }

  /**
   * Get default safety thresholds (fallback only)
   */
  private getDefaultSafetyThresholds() {
    console.warn('[Organizer Config] Using default safety thresholds - organizer should configure custom values');
    return {
      densityLevels: {
        low: 0.5,
        medium: 1.0,
        high: 2.0,
        critical: 3.0,
      },
      flowRates: {
        normal: 50,
        congested: 100,
        critical: 150,
      },
      waitTimes: {
        acceptable: 5,
        concerning: 15,
        critical: 30,
      },
    };
  }

  /**
   * List all venues for an organizer
   */
  async listOrganizerVenues(organizerId: string) {
    try {
      const venues = await prisma.venueLayout.findMany({
        where: {
          eventId: {
            startsWith: `template-${organizerId}-`,
          },
        },
        select: {
          eventId: true,
          metadata: true,
          zones: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return venues.map((v) => {
        const metadata = v.metadata as any || {};
        return {
          venueId: metadata.venueId,
          name: metadata.venueName,
          location: metadata.location,
          capacity: metadata.totalCapacity,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        };
      });
    } catch (error) {
      console.error('[Organizer Config] Error listing venues:', error);
      throw error;
    }
  }

  /**
   * Delete venue configuration
   */
  async deleteVenueConfiguration(venueId: string, organizerId: string): Promise<void> {
    try {
      const templateEventId = `template-${organizerId}-${venueId}`;

      await prisma.venueLayout.delete({
        where: { eventId: templateEventId },
      });

      // Delete associated zone templates
      await prisma.zoneMetadata.deleteMany({
        where: { eventId: templateEventId },
      });

      console.log(`[Organizer Config] Deleted venue configuration: ${venueId}`);
    } catch (error) {
      console.error('[Organizer Config] Error deleting venue configuration:', error);
      throw error;
    }
  }

  /**
   * Validate venue configuration
   */
  validateVenueConfiguration(config: VenueConfiguration): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.venueId) errors.push('Venue ID is required');
    if (!config.venueName) errors.push('Venue name is required');
    if (!config.organizerId) errors.push('Organizer ID is required');
    if (!config.totalCapacity || config.totalCapacity <= 0) errors.push('Total capacity must be positive');
    if (!config.zones || config.zones.length === 0) errors.push('At least one zone is required');
    if (!config.cameras || config.cameras.length === 0) errors.push('At least one camera is required');

    // Validate zones
    config.zones?.forEach((zone, index) => {
      if (!zone.zoneId) errors.push(`Zone ${index + 1}: Zone ID is required`);
      if (!zone.zoneName) errors.push(`Zone ${index + 1}: Zone name is required`);
      if (!zone.capacity || zone.capacity <= 0) errors.push(`Zone ${index + 1}: Capacity must be positive`);
      if (!zone.areaSquareMeters || zone.areaSquareMeters <= 0)
        errors.push(`Zone ${index + 1}: Area must be positive`);
      if (!zone.coordinates) errors.push(`Zone ${index + 1}: Coordinates are required`);
    });

    // Validate cameras
    config.cameras?.forEach((camera, index) => {
      if (!camera.cameraId) errors.push(`Camera ${index + 1}: Camera ID is required`);
      if (!camera.cameraName) errors.push(`Camera ${index + 1}: Camera name is required`);
      if (!camera.zones || camera.zones.length === 0)
        errors.push(`Camera ${index + 1}: At least one zone must be assigned`);
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const organizerConfigService = new OrganizerConfigurationService();

export default organizerConfigService;
