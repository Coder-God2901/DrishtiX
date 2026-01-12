/**
 * Organizer Configuration Helper
 * 
 * Provides utility functions for services to access organizer-specific configurations
 * including safety thresholds, venue settings, and zone data.
 * 
 * This eliminates hardcoded defaults throughout the platform.
 */

import { organizerConfigService } from './organizer-configuration.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get organizer's safety thresholds for an event
 * Falls back to defaults if organizer hasn't configured custom values
 */
export async function getEventSafetyThresholds(eventId: string) {
  try {
    // Get event to find organizer and venue
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        organizerId: true,
        venue: true,
      },
    });

    if (!event || !event.organizerId || !event.venue) {
      console.warn(`[Config Helper] Event ${eventId} missing organizer/venue info, using defaults`);
      return getDefaultSafetyThresholds();
    }

    // Get organizer's custom thresholds
    const thresholds = await organizerConfigService.getSafetyThresholds(
      event.venue,
      event.organizerId
    );

    return thresholds;
  } catch (error) {
    console.error('[Config Helper] Error getting event safety thresholds:', error);
    return getDefaultSafetyThresholds();
  }
}

/**
 * Get organizer's venue configuration for an event
 */
export async function getEventVenueConfig(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        organizerId: true,
        venue: true,
      },
    });

    if (!event || !event.organizerId || !event.venue) {
      return null;
    }

    return await organizerConfigService.getVenueConfiguration(
      event.venue,
      event.organizerId
    );
  } catch (error) {
    console.error('[Config Helper] Error getting event venue config:', error);
    return null;
  }
}

/**
 * Get zone capacity from organizer config
 */
export async function getZoneCapacity(eventId: string, zoneId: string): Promise<number> {
  try {
    const venueConfig = await getEventVenueConfig(eventId);

    if (venueConfig) {
      const zone = venueConfig.zones.find(z => z.zoneId === zoneId);
      if (zone) {
        return zone.capacity;
      }
    }

    // Fallback: try to get from database
    const zoneMetadata = await prisma.zoneMetadata.findFirst({
      where: { eventId, zoneId },
      select: { maxCapacity: true },
    });

    return zoneMetadata?.maxCapacity || 1000; // Last resort default
  } catch (error) {
    console.error('[Config Helper] Error getting zone capacity:', error);
    return 1000;
  }
}

/**
 * Classify density level based on organizer's thresholds
 */
export async function classifyDensityLevel(
  eventId: string,
  densityValue: number
): Promise<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> {
  try {
    const thresholds = await getEventSafetyThresholds(eventId);
    const { low, medium, high, critical } = thresholds.densityLevels;

    if (densityValue >= critical) return 'CRITICAL';
    if (densityValue >= high) return 'HIGH';
    if (densityValue >= medium) return 'MEDIUM';
    return 'LOW';
  } catch (error) {
    console.error('[Config Helper] Error classifying density:', error);
    // Fallback to hardcoded classification
    if (densityValue >= 3.0) return 'CRITICAL';
    if (densityValue >= 2.0) return 'HIGH';
    if (densityValue >= 1.0) return 'MEDIUM';
    return 'LOW';
  }
}

/**
 * Check if flow rate is critical based on organizer's thresholds
 */
export async function isFlowRateCritical(
  eventId: string,
  flowRate: number
): Promise<boolean> {
  try {
    const thresholds = await getEventSafetyThresholds(eventId);
    return flowRate >= thresholds.flowRates.critical;
  } catch (error) {
    console.error('[Config Helper] Error checking flow rate:', error);
    return flowRate >= 150; // Fallback
  }
}

/**
 * Check if wait time is concerning based on organizer's thresholds
 */
export async function isWaitTimeConcerning(
  eventId: string,
  waitTimeMinutes: number
): Promise<'ACCEPTABLE' | 'CONCERNING' | 'CRITICAL'> {
  try {
    const thresholds = await getEventSafetyThresholds(eventId);

    if (waitTimeMinutes >= thresholds.waitTimes.critical) return 'CRITICAL';
    if (waitTimeMinutes >= thresholds.waitTimes.concerning) return 'CONCERNING';
    return 'ACCEPTABLE';
  } catch (error) {
    console.error('[Config Helper] Error checking wait time:', error);
    if (waitTimeMinutes >= 30) return 'CRITICAL';
    if (waitTimeMinutes >= 15) return 'CONCERNING';
    return 'ACCEPTABLE';
  }
}

/**
 * Get emergency contacts for an event
 */
export async function getEmergencyContacts(eventId: string) {
  try {
    const venueConfig = await getEventVenueConfig(eventId);

    if (venueConfig?.emergencyProtocols) {
      return venueConfig.emergencyProtocols.emergencyContacts;
    }

    return []; // No emergency contacts configured
  } catch (error) {
    console.error('[Config Helper] Error getting emergency contacts:', error);
    return [];
  }
}

/**
 * Get evacuation routes for an event
 */
export async function getEvacuationRoutes(eventId: string) {
  try {
    const venueConfig = await getEventVenueConfig(eventId);

    if (venueConfig?.emergencyProtocols) {
      return venueConfig.emergencyProtocols.evacuationRoutes;
    }

    return []; // No evacuation routes configured
  } catch (error) {
    console.error('[Config Helper] Error getting evacuation routes:', error);
    return [];
  }
}

/**
 * Default safety thresholds (fallback only)
 * Organizers should always configure their own thresholds
 */
function getDefaultSafetyThresholds() {
  console.warn('[Config Helper] Using default safety thresholds - organizer should configure custom values');
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
 * Check if organizer has configured custom thresholds
 */
export async function hasCustomThresholds(eventId: string): Promise<boolean> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        organizerId: true,
        venue: true,
      },
    });

    if (!event || !event.organizerId || !event.venue) {
      return false;
    }

    const venueConfig = await organizerConfigService.getVenueConfiguration(
      event.venue,
      event.organizerId
    );

    return venueConfig !== null;
  } catch (error) {
    return false;
  }
}
