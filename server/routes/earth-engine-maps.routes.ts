/**
 * Earth Engine & Maps API Routes
 * Endpoints for satellite imagery, synthetic data, and routing
 */

import { Router } from 'express';
import { googleEarthEngineService } from '../services/earth-engine.service';
import { googleMapsService } from '../services/google-maps.service';

const router = Router();

// ==================== EARTH ENGINE ROUTES ====================

/**
 * POST /api/earth-engine/synthetic-data
 * Generate synthetic crowd data for hardware-free mode
 */
router.post('/synthetic-data', async (req, res) => {
  try {
    const { venueBounds, gridSize = 50, scenario = 'NORMAL' } = req.body;

    if (!venueBounds || !venueBounds.north || !venueBounds.south || !venueBounds.east || !venueBounds.west) {
      return res.status(400).json({
        success: false,
        error: 'Missing required venue bounds (north, south, east, west)',
      });
    }

    const syntheticData = await googleEarthEngineService.generateSyntheticCrowdData(
      venueBounds,
      gridSize,
      scenario
    );

    res.json({
      success: true,
      data: syntheticData,
    });
  } catch (error: any) {
    console.error('Error generating synthetic data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/earth-engine/heatmap-overlay
 * Generate GeoJSON heatmap overlay from crowd data
 */
router.post('/heatmap-overlay', async (req, res) => {
  try {
    const { crowdData } = req.body;

    if (!crowdData || !crowdData.gridCells) {
      return res.status(400).json({
        success: false,
        error: 'Missing required crowd data',
      });
    }

    const heatmap = await googleEarthEngineService.generateHeatmapOverlay(crowdData);

    res.json({
      success: true,
      data: heatmap,
    });
  } catch (error: any) {
    console.error('Error generating heatmap overlay:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/earth-engine/venue-suitability
 * Analyze venue suitability based on terrain and environmental factors
 */
router.post('/venue-suitability', async (req, res) => {
  try {
    const { venueBounds } = req.body;

    if (!venueBounds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required venue bounds',
      });
    }

    const suitability = await googleEarthEngineService.analyzeVenueSuitability(venueBounds);

    res.json({
      success: true,
      data: suitability,
    });
  } catch (error: any) {
    console.error('Error analyzing venue suitability:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/earth-engine/status
 * Check Earth Engine service status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      initialized: googleEarthEngineService.isInitialized(),
      mode: googleEarthEngineService.isInitialized() ? 'full' : 'fallback',
      features: {
        syntheticDataGeneration: true,
        heatmapOverlay: true,
        venueSuitability: true,
        satelliteImagery: false, // Not implemented yet
        terrainAnalysis: false, // Not implemented yet
      },
    },
  });
});

// ==================== GOOGLE MAPS ROUTES ====================

/**
 * POST /api/maps/safe-route
 * Calculate safe route avoiding crowded zones
 */
router.post('/safe-route', async (req, res) => {
  try {
    const { origin, destination, avoidCrowdedZones, avoidHazards, travelMode, departureTime } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Missing required origin and destination',
      });
    }

    const route = await googleMapsService.calculateSafeRoute({
      origin,
      destination,
      avoidCrowdedZones,
      avoidHazards,
      travelMode,
      departureTime: departureTime ? new Date(departureTime) : undefined,
    });

    res.json({
      success: true,
      data: route,
    });
  } catch (error: any) {
    console.error('Error calculating safe route:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/maps/gate-recommendations
 * Get recommended gates based on crowd levels and wait times
 */
router.post('/gate-recommendations', async (req, res) => {
  try {
    const { userLocation, gates, crowdData } = req.body;

    if (!userLocation || !gates) {
      return res.status(400).json({
        success: false,
        error: 'Missing required user location and gates',
      });
    }

    // Convert crowdData object to Map if needed
    const crowdMap = new Map(
      Object.entries(crowdData || {}).map(([key, value]) => [
        key,
        typeof value === 'number' ? value : 0,
      ])
    );

    const recommendations = await googleMapsService.recommendGate(
      userLocation,
      gates,
      crowdMap
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error getting gate recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/maps/venue-pois
 * Search for points of interest within venue
 */
router.post('/venue-pois', async (req, res) => {
  try {
    const { location, radius = 500, poiType } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required location',
      });
    }

    const pois = await googleMapsService.findNearbyPlaces(
      location,
      radius,
      poiType
    );

    res.json({
      success: true,
      data: pois,
    });
  } catch (error: any) {
    console.error('Error searching venue POIs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/maps/geocode
 * Convert address to coordinates
 */
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required address',
      });
    }

    const result = await googleMapsService.geocodeAddress(address);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error geocoding address:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/maps/reverse-geocode
 * Convert coordinates to address
 */
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required lat/lng coordinates',
      });
    }

    const result = await googleMapsService.reverseGeocode({ lat, lng });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error reverse geocoding:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
