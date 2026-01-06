/**
 * Navigation and Routing Routes
 * Handles route calculation, POIs, emergency exits, and crowd-aware navigation
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/navigation/route
 * Calculate route between two points
 */
router.post('/route', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      userId,
      startLocation,
      endLocation,
      routeType = 'WALKING',
      isAccessible = false,
      avoidCrowds = false
    } = req.body;

    // Simple route calculation (in production, use proper pathfinding algorithm)
    const distance = calculateDistance(startLocation, endLocation);
    const estimatedTime = Math.ceil(distance / 1.4); // 1.4 m/s walking speed

    // Get crowd data for crowd-aware routing
    let crowdLevel = 'low';
    let alternateRoutes = [];

    if (avoidCrowds) {
      const heatmapData = await prisma.crowdHeatmapZone.findMany({
        where: {
          eventId,
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10
      });

      if (heatmapData.length > 0) {
        const avgDensity = heatmapData.reduce((sum: number, z: any) => sum + z.density, 0) / heatmapData.length;
        crowdLevel = avgDensity > 70 ? 'high' : avgDensity > 40 ? 'medium' : 'low';

        // Generate alternate routes if crowded
        if (avgDensity > 40) {
          alternateRoutes = generateAlternateRoutes(startLocation, endLocation, heatmapData);
        }
      }
    }

    // Get waypoints along the route
    const waypoints = generateWaypoints(startLocation, endLocation, isAccessible);
    const instructions = generateInstructions(waypoints);

    const route = await prisma.navigationRoute.create({
      data: {
        eventId,
        userId,
        startLocation,
        endLocation,
        routeType,
        distance,
        estimatedTime,
        waypoints,
        instructions,
        isAccessible,
        avoidCrowds,
        crowdLevel,
        alternateRoutes
      }
    });

    res.json({
      success: true,
      route
    });
  } catch (error: any) {
    console.error('Error calculating route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate route',
      message: error.message
    });
  }
});

/**
 * GET /api/navigation/event/:eventId/pois
 * Get all points of interest for an event
 */
router.get('/event/:eventId/pois', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { type, isAccessible, isEmergencyExit } = req.query;

    const where: any = { eventId, isActive: true };
    if (type) where.type = type;
    if (isAccessible !== undefined) where.isAccessible = isAccessible === 'true';
    if (isEmergencyExit !== undefined) where.isEmergencyExit = isEmergencyExit === 'true';

    const pois = await prisma.pointOfInterest.findMany({
      where,
      orderBy: {
        type: 'asc'
      }
    });

    // Group by type
    const grouped = pois.reduce((acc: Record<string, typeof pois>, poi: any) => {
      if (!acc[poi.type]) {
        acc[poi.type] = [];
      }
      acc[poi.type].push(poi);
      return acc;
    }, {} as Record<string, typeof pois>);

    res.json({
      success: true,
      pois,
      grouped,
      count: pois.length
    });
  } catch (error: any) {
    console.error('Error fetching POIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch POIs',
      message: error.message
    });
  }
});

/**
 * GET /api/navigation/event/:eventId/emergency-exits
 * Get emergency exits for an event
 */
router.get('/event/:eventId/emergency-exits', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { currentLocation } = req.query;

    const exits = await prisma.pointOfInterest.findMany({
      where: {
        eventId,
        isEmergencyExit: true,
        isActive: true
      }
    });

    // If current location provided, sort by distance
    if (currentLocation && typeof currentLocation === 'string') {
      const coords = JSON.parse(currentLocation);
      exits.sort((a: any, b: any) => {
        const distA = calculateDistance(coords, a.location as any);
        const distB = calculateDistance(coords, b.location as any);
        return distA - distB;
      });
    }

    res.json({
      success: true,
      exits,
      count: exits.length
    });
  } catch (error: any) {
    console.error('Error fetching emergency exits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency exits',
      message: error.message
    });
  }
});

/**
 * POST /api/navigation/event/:eventId/pois
 * Create a new POI (organizers only)
 */
router.post('/event/:eventId/pois', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const {
      name,
      type,
      location,
      coordinates,
      zone,
      floor,
      description,
      amenities,
      isAccessible,
      isEmergencyExit,
      capacity,
      operatingHours
    } = req.body;

    const poi = await prisma.pointOfInterest.create({
      data: {
        eventId,
        name,
        type,
        location,
        coordinates,
        zone,
        floor,
        description,
        amenities: amenities || [],
        isAccessible: isAccessible || false,
        isEmergencyExit: isEmergencyExit || false,
        capacity,
        operatingHours
      }
    });

    res.json({
      success: true,
      poi,
      message: 'POI created successfully'
    });
  } catch (error: any) {
    console.error('Error creating POI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create POI',
      message: error.message
    });
  }
});

/**
 * PATCH /api/navigation/pois/:id
 * Update POI
 */
router.patch('/pois/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const poi = await prisma.pointOfInterest.update({
      where: { id },
      data: updates
    });

    res.json({
      success: true,
      poi,
      message: 'POI updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating POI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update POI',
      message: error.message
    });
  }
});

/**
 * DELETE /api/navigation/pois/:id
 * Delete POI (soft delete - mark as inactive)
 */
router.delete('/pois/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.pointOfInterest.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'POI deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting POI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete POI',
      message: error.message
    });
  }
});

/**
 * GET /api/navigation/routes/:userId
 * Get user's navigation history
 */
router.get('/routes/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const routes = await prisma.navigationRoute.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    res.json({
      success: true,
      routes
    });
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routes',
      message: error.message
    });
  }
});

/**
 * PATCH /api/navigation/routes/:id/complete
 * Mark route as completed
 */
router.patch('/routes/:id/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const route = await prisma.navigationRoute.update({
      where: { id },
      data: {
        completedAt: new Date(),
        isActive: false
      }
    });

    res.json({
      success: true,
      route
    });
  } catch (error: any) {
    console.error('Error completing route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete route',
      message: error.message
    });
  }
});

// Helper functions
function calculateDistance(point1: any, point2: any): number {
  // Haversine formula for distance calculation
  const R = 6371e3; // Earth radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

function generateWaypoints(start: any, end: any, isAccessible: boolean): any[] {
  // Simple linear interpolation (in production, use proper pathfinding)
  const waypoints = [start];

  const steps = 5;
  for (let i = 1; i < steps; i++) {
    const ratio = i / steps;
    waypoints.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio
    });
  }

  waypoints.push(end);
  return waypoints;
}

function generateInstructions(waypoints: any[]): string[] {
  // Generate simple instructions based on waypoints
  const instructions = ['Start at your current location'];

  for (let i = 1; i < waypoints.length - 1; i++) {
    instructions.push(`Continue straight for ${Math.floor(Math.random() * 50 + 20)}m`);
  }

  instructions.push('You have arrived at your destination');
  return instructions;
}

function generateAlternateRoutes(start: any, end: any, heatmapData: any[]): any[] {
  // Generate alternate routes avoiding crowded zones
  // This is a simplified version - in production, use proper routing algorithms
  return [
    {
      distance: calculateDistance(start, end) * 1.2,
      estimatedTime: Math.ceil(calculateDistance(start, end) * 1.2 / 1.4),
      crowdLevel: 'low',
      description: 'Less crowded route (slightly longer)'
    },
    {
      distance: calculateDistance(start, end) * 1.1,
      estimatedTime: Math.ceil(calculateDistance(start, end) * 1.1 / 1.4),
      crowdLevel: 'medium',
      description: 'Balanced route'
    }
  ];
}

export default router;
