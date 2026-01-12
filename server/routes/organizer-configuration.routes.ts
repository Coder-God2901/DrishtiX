/**
 * Organizer Configuration API Routes
 * 
 * Provides endpoints for organizers to:
 * - Create and manage venue configurations (zones, gates, cameras)
 * - Set custom safety thresholds
 * - Define emergency protocols
 * - Apply venue templates to events
 * 
 * These configurations eliminate hardcoded defaults throughout the platform.
 */

import { Router, Request, Response } from 'express';
import { organizerConfigService } from '../services/organizer-configuration.service';

const router = Router();

/**
 * POST /api/organizer/venues
 * Create a new venue configuration
 */
router.post('/venues', async (req: Request, res: Response) => {
  try {
    const config = req.body;

    // Validate required fields
    if (!config.organizerId || !config.venueId || !config.venueName) {
      return res.status(400).json({
        error: 'Missing required fields: organizerId, venueId, venueName',
      });
    }

    await organizerConfigService.saveVenueConfiguration(config);

    res.status(201).json({
      message: 'Venue configuration created successfully',
      venueId: config.venueId,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error creating venue:', error);
    res.status(500).json({ error: error.message || 'Failed to create venue configuration' });
  }
});

/**
 * GET /api/organizer/:organizerId/venues
 * List all venues for an organizer
 */
router.get('/:organizerId/venues', async (req: Request, res: Response) => {
  try {
    const { organizerId } = req.params;

    const venues = await organizerConfigService.listOrganizerVenues(organizerId);

    res.json({
      venues,
      count: venues.length,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error listing venues:', error);
    res.status(500).json({ error: error.message || 'Failed to list venues' });
  }
});

/**
 * GET /api/organizer/:organizerId/venues/:venueId
 * Get a specific venue configuration
 */
router.get('/:organizerId/venues/:venueId', async (req: Request, res: Response) => {
  try {
    const { organizerId, venueId } = req.params;

    const venue = await organizerConfigService.getVenueConfiguration(venueId, organizerId);

    if (!venue) {
      return res.status(404).json({ error: 'Venue configuration not found' });
    }

    res.json(venue);
  } catch (error: any) {
    console.error('[Organizer Config API] Error getting venue:', error);
    res.status(500).json({ error: error.message || 'Failed to get venue configuration' });
  }
});

/**
 * PUT /api/organizer/venues/:venueId
 * Update a venue configuration
 */
router.put('/venues/:venueId', async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const config = req.body;

    // Ensure venueId matches route param
    config.venueId = venueId;

    await organizerConfigService.saveVenueConfiguration(config);

    res.json({
      message: 'Venue configuration updated successfully',
      venueId,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error updating venue:', error);
    res.status(500).json({ error: error.message || 'Failed to update venue configuration' });
  }
});

/**
 * DELETE /api/organizer/:organizerId/venues/:venueId
 * Delete a venue configuration
 */
router.delete('/:organizerId/venues/:venueId', async (req: Request, res: Response) => {
  try {
    const { organizerId, venueId } = req.params;

    await organizerConfigService.deleteVenueConfiguration(venueId, organizerId);

    res.json({
      message: 'Venue configuration deleted successfully',
      venueId,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error deleting venue:', error);
    res.status(500).json({ error: error.message || 'Failed to delete venue configuration' });
  }
});

/**
 * GET /api/organizer/:organizerId/venues/:venueId/zones
 * Get all zones for a venue
 */
router.get('/:organizerId/venues/:venueId/zones', async (req: Request, res: Response) => {
  try {
    const { organizerId, venueId } = req.params;

    const zones = await organizerConfigService.getVenueZones(venueId, organizerId);

    res.json({
      zones,
      count: zones.length,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error getting zones:', error);
    res.status(500).json({ error: error.message || 'Failed to get venue zones' });
  }
});

/**
 * GET /api/organizer/:organizerId/venues/:venueId/cameras
 * Get all camera mappings for a venue
 */
router.get('/:organizerId/venues/:venueId/cameras', async (req: Request, res: Response) => {
  try {
    const { organizerId, venueId } = req.params;

    const cameras = await organizerConfigService.getVenueCameras(venueId, organizerId);

    res.json({
      cameras,
      count: cameras.length,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error getting cameras:', error);
    res.status(500).json({ error: error.message || 'Failed to get venue cameras' });
  }
});

/**
 * GET /api/organizer/:organizerId/venues/:venueId/thresholds
 * Get safety thresholds for a venue
 */
router.get('/:organizerId/venues/:venueId/thresholds', async (req: Request, res: Response) => {
  try {
    const { organizerId, venueId } = req.params;

    const thresholds = await organizerConfigService.getSafetyThresholds(venueId, organizerId);

    res.json(thresholds);
  } catch (error: any) {
    console.error('[Organizer Config API] Error getting thresholds:', error);
    res.status(500).json({ error: error.message || 'Failed to get safety thresholds' });
  }
});

/**
 * POST /api/organizer/:organizerId/venues/:venueId/validate
 * Validate a venue configuration before saving
 */
router.post('/:organizerId/venues/:venueId/validate', async (req: Request, res: Response) => {
  try {
    const config = req.body;

    const validation = await organizerConfigService.validateVenueConfiguration(config);

    res.json({
      valid: validation.valid,
      errors: validation.errors,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error validating venue:', error);
    res.status(500).json({ error: error.message || 'Failed to validate venue configuration' });
  }
});

/**
 * POST /api/events/:eventId/apply-venue
 * Apply a venue template to an event
 */
router.post('/:eventId/apply-venue', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { venueId, organizerId } = req.body;

    if (!venueId || !organizerId) {
      return res.status(400).json({
        error: 'Missing required fields: venueId, organizerId',
      });
    }

    await organizerConfigService.applyVenueConfigToEvent(eventId, venueId, organizerId);

    res.json({
      message: 'Venue configuration applied to event successfully',
      eventId,
      venueId,
    });
  } catch (error: any) {
    console.error('[Organizer Config API] Error applying venue config:', error);
    res.status(500).json({ error: error.message || 'Failed to apply venue configuration' });
  }
});

export default router;
