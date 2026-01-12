/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * Organizer Configuration API Routes
 * 
 * Endpoints for organizers to configure venues, zones, thresholds,
 * and event-specific settings. All data is customizable and real-time.
 */

import { Router, Request, Response } from 'express';
import { organizerConfigService } from '../services/organizer-config.service';
import {
  CreateVenueConfigRequest,
  UpdateVenueConfigRequest,
  CreateEventConfigRequest,
  UpdateEventConfigRequest,
} from '../types/organizer-config.types';

const router = Router();

// =============================================================================
// Venue Configuration Endpoints
// =============================================================================

/**
 * POST /api/organizer/venues
 * Create a new venue configuration
 */
router.post('/venues', async (req: Request, res: Response) => {
  try {
    const request: CreateVenueConfigRequest = req.body;

    // Validate request
    if (!request.organizerId || !request.venueName || !request.venueType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: organizerId, venueName, venueType',
      });
    }

    if (!request.zones || request.zones.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one zone is required',
      });
    }

    // Create venue configuration
    const config = await organizerConfigService.createVenueConfiguration(request);

    // Validate configuration
    const validation = organizerConfigService.validateVenueConfiguration(config);

    return res.status(201).json({
      success: true,
      data: config,
      validation,
      message: 'Venue configuration created successfully',
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error creating venue:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/organizer/venues/:venueId
 * Get venue configuration by ID
 */
router.get('/venues/:venueId', async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;

    const config = await organizerConfigService.getVenueConfiguration(venueId);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Venue configuration not found',
      });
    }

    return res.json({
      success: true,
      data: config,
      isDefault: false,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error fetching venue:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/organizer/:organizerId/venues
 * Get all venues for an organizer
 */
router.get('/:organizerId/venues', async (req: Request, res: Response) => {
  try {
    const { organizerId } = req.params;

    const venues = await organizerConfigService.getOrganizerVenues(organizerId);

    return res.json({
      success: true,
      data: venues,
      count: venues.length,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error fetching venues:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/organizer/venues/:venueId
 * Update venue configuration
 */
router.put('/venues/:venueId', async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const updates: UpdateVenueConfigRequest = req.body;

    const config = await organizerConfigService.updateVenueConfiguration(
      venueId,
      updates
    );

    const validation = organizerConfigService.validateVenueConfiguration(config);

    return res.json({
      success: true,
      data: config,
      validation,
      message: 'Venue configuration updated successfully',
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error updating venue:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================================================
// Event Configuration Endpoints
// =============================================================================

/**
 * POST /api/organizer/events/:eventId/config
 * Create event-specific configuration
 */
router.post('/events/:eventId/config', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const request: CreateEventConfigRequest = {
      ...req.body,
      eventId,
    };

    // Validate request
    if (!request.organizerId || !request.venueId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: organizerId, venueId',
      });
    }

    if (!request.schedule || !request.crowdBehavior || !request.alertConfiguration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: schedule, crowdBehavior, alertConfiguration',
      });
    }

    const config = await organizerConfigService.createEventConfiguration(request);

    return res.status(201).json({
      success: true,
      data: config,
      message: 'Event configuration created successfully',
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error creating event config:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/organizer/events/:eventId/config
 * Get event configuration
 */
router.get('/events/:eventId/config', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const config = await organizerConfigService.getEventConfiguration(eventId);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Event configuration not found',
      });
    }

    return res.json({
      success: true,
      data: config,
      isDefault: false,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error fetching event config:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/organizer/events/:eventId/config
 * Update event configuration
 */
router.put('/events/:eventId/config', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const updates: UpdateEventConfigRequest = req.body;

    const config = await organizerConfigService.updateEventConfiguration(
      eventId,
      updates
    );

    return res.json({
      success: true,
      data: config,
      message: 'Event configuration updated successfully',
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error updating event config:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================================================
// Zone Configuration Queries
// =============================================================================

/**
 * GET /api/organizer/events/:eventId/zones
 * Get all zones for an event (with overrides applied)
 */
router.get('/events/:eventId/zones', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const zones = await organizerConfigService.getEventZones(eventId);

    return res.json({
      success: true,
      data: zones,
      count: zones.length,
      isCustomized: true,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error fetching event zones:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/organizer/events/:eventId/zones/:zoneId
 * Get specific zone configuration (with overrides)
 */
router.get('/events/:eventId/zones/:zoneId', async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.params;

    const zone = await organizerConfigService.getZoneConfiguration(eventId, zoneId);

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Zone configuration not found',
      });
    }

    return res.json({
      success: true,
      data: zone,
      isCustomized: true,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error fetching zone config:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/organizer/events/:eventId/zones/:zoneId/thresholds
 * Get zone-specific thresholds (with fallbacks)
 */
router.get('/events/:eventId/zones/:zoneId/thresholds', async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.params;

    const thresholds = await organizerConfigService.getZoneThresholds(eventId, zoneId);

    return res.json({
      success: true,
      data: thresholds,
      isCustomized: true,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error fetching zone thresholds:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================================================
// Threshold Queries (Real-time)
// =============================================================================

/**
 * POST /api/organizer/events/:eventId/zones/:zoneId/density-level
 * Get density level based on organizer's custom thresholds
 */
router.post('/events/:eventId/zones/:zoneId/density-level', async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.params;
    const { densityValue } = req.body;

    if (typeof densityValue !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'densityValue must be a number',
      });
    }

    const level = await organizerConfigService.getDensityLevel(
      eventId,
      zoneId,
      densityValue
    );

    return res.json({
      success: true,
      data: {
        densityValue,
        densityLevel: level,
      },
      isCustomized: true,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error calculating density level:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/organizer/events/:eventId/zones/:zoneId/risk-level
 * Get risk level based on organizer's custom thresholds
 */
router.post('/events/:eventId/zones/:zoneId/risk-level', async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.params;
    const { riskScore } = req.body;

    if (typeof riskScore !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'riskScore must be a number',
      });
    }

    const level = await organizerConfigService.getRiskLevel(
      eventId,
      zoneId,
      riskScore
    );

    return res.json({
      success: true,
      data: {
        riskScore,
        riskLevel: level,
      },
      isCustomized: true,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error calculating risk level:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================================================
// Configuration Templates (Starter Templates for Organizers)
// =============================================================================

/**
 * GET /api/organizer/templates/venues/:venueType
 * Get starter template for venue type
 */
router.get('/templates/venues/:venueType', async (req: Request, res: Response) => {
  try {
    const { venueType } = req.params;

    // Return starter templates based on venue type
    const templates = {
      STADIUM: {
        recommendedZones: [
          { type: 'ENTRY_GATE', count: 4, capacity: 500 },
          { type: 'SEATING_STAND', count: 4, capacity: 5000 },
          { type: 'CONCOURSE', count: 4, capacity: 800 },
          { type: 'FOOD_COURT', count: 2, capacity: 300 },
          { type: 'WASHROOM', count: 4, capacity: 50 },
          { type: 'VIP_AREA', count: 1, capacity: 150 },
        ],
        recommendedGates: 4,
        recommendedThresholds: {
          density: { low: 0.5, medium: 1.5, high: 3.0, critical: 5.0 },
          risk: { low: 0.3, medium: 0.5, high: 0.7, critical: 0.9 },
        },
      },
      CONCERT_HALL: {
        recommendedZones: [
          { type: 'ENTRY_GATE', count: 2, capacity: 300 },
          { type: 'SEATING_STAND', count: 2, capacity: 2000 },
          { type: 'CONCOURSE', count: 2, capacity: 400 },
          { type: 'FOOD_COURT', count: 1, capacity: 200 },
          { type: 'WASHROOM', count: 2, capacity: 40 },
        ],
        recommendedGates: 2,
        recommendedThresholds: {
          density: { low: 0.8, medium: 2.0, high: 4.0, critical: 6.0 },
          risk: { low: 0.3, medium: 0.5, high: 0.7, critical: 0.9 },
        },
      },
      ARENA: {
        recommendedZones: [
          { type: 'ENTRY_GATE', count: 3, capacity: 400 },
          { type: 'SEATING_STAND', count: 3, capacity: 3000 },
          { type: 'CONCOURSE', count: 3, capacity: 600 },
          { type: 'FOOD_COURT', count: 2, capacity: 250 },
          { type: 'WASHROOM', count: 3, capacity: 45 },
          { type: 'VIP_AREA', count: 1, capacity: 100 },
        ],
        recommendedGates: 3,
        recommendedThresholds: {
          density: { low: 0.6, medium: 1.8, high: 3.5, critical: 5.5 },
          risk: { low: 0.3, medium: 0.5, high: 0.7, critical: 0.9 },
        },
      },
    };

    const template = (templates as any)[venueType];

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found for venue type',
        availableTypes: Object.keys(templates),
      });
    }

    return res.json({
      success: true,
      data: template,
      venueType,
      message: 'This is a starter template. Please customize for your specific venue.',
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error fetching template:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
