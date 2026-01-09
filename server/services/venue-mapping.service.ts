/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
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
 * Venue Mapping & Geofencing Service
 * Handles venue boundary validation, zone management, and geofencing logic
 */

import * as turf from '@turf/turf';
import { prisma, io } from '../index';

// Type aliases for clarity
type Position = number[];
type PolygonCoordinates = Position[][];

export interface VenueBoundary {
  type: 'Polygon';
  coordinates: Position[][];
}

export interface Zone {
  id: string;
  eventId: string;
  name: string;
  type: 'stage' | 'gate' | 'food' | 'medical' | 'vip' | 'parking' | 'restroom' | 'restricted';
  shape: VenueBoundary;
  capacity: number;
  properties: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    isVIP: boolean;
    allowedRoles?: string[];
    openTime?: string;
    closeTime?: string;
  };
  metadata?: Record<string, any>;
}

export interface GeofenceCheckResult {
  isInside: boolean;
  insideZones: string[];
  outsideVenue: boolean;
  nearestZone?: {
    zoneId: string;
    zoneName: string;
    distance: number;
  };
  alerts: GeofenceAlert[];
}

export interface GeofenceAlert {
  type: 'unauthorized_zone' | 'boundary_breach' | 'capacity_exceeded' | 'restricted_area';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  zoneId?: string;
  zoneName?: string;
}

class VenueMappingService {
  /**
   * Validate a polygon for self-intersections and proper closure
   */
  validatePolygon(coordinates: Position[][]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check if polygon is closed
      const firstPoint = coordinates[0][0];
      const lastPoint = coordinates[0][coordinates[0].length - 1];

      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        errors.push('Polygon must be closed (first and last points must match)');
      }

      // Check minimum vertices (at least 4 for a closed triangle)
      if (coordinates[0].length < 4) {
        errors.push('Polygon must have at least 3 unique vertices');
      }

      // Create turf polygon
      const polygon = turf.polygon(coordinates);

      // Check for self-intersections using turf kinks
      const kinks = turf.kinks(polygon);
      if (kinks.features.length > 0) {
        errors.push(`Polygon has ${kinks.features.length} self-intersection(s)`);
      }

      // Calculate area to ensure it's not degenerate
      const area = turf.area(polygon);
      if (area < 1) {
        errors.push('Polygon area is too small (degenerate polygon)');
      }

      return { valid: errors.length === 0, errors };
    } catch (error: any) {
      errors.push(`Invalid polygon structure: ${error.message}`);
      return { valid: false, errors };
    }
  }

  /**
   * Calculate polygon area in square meters
   */
  calculateArea(coordinates: Position[][]): number {
    try {
      const polygon = turf.polygon(coordinates);
      return turf.area(polygon);
    } catch {
      return 0;
    }
  }

  /**
   * Check if a point is inside a polygon using ray-casting algorithm
   */
  isPointInPolygon(point: [number, number], polygon: Position[][]): boolean {
    try {
      const turfPoint = turf.point(point);
      const turfPolygon = turf.polygon(polygon);
      return turf.booleanPointInPolygon(turfPoint, turfPolygon);
    } catch {
      return false;
    }
  }

  /**
   * Check if zones overlap
   */
  doZonesOverlap(zone1: Position[][], zone2: Position[][]): boolean {
    try {
      const poly1 = turf.polygon(zone1);
      const poly2 = turf.polygon(zone2);
      // Use booleanOverlap or booleanIntersects instead of intersect
      return turf.booleanOverlap(poly1, poly2) || turf.booleanIntersects(poly1, poly2);
    } catch {
      return false;
    }
  }

  /**
   * Check geofencing for a user location
   */
  async checkGeofence(
    eventId: string,
    location: { lat: number; lng: number },
    userId?: string,
    userRole?: string
  ): Promise<GeofenceCheckResult> {
    const result: GeofenceCheckResult = {
      isInside: false,
      insideZones: [],
      outsideVenue: true,
      alerts: []
    };

    try {
      // Get venue layout
      const venueLayout = await prisma.venueLayout.findUnique({
        where: { eventId }
      });

      if (!venueLayout || !venueLayout.boundary) {
        return result;
      }

      const point: [number, number] = [location.lng, location.lat];
      const boundary = venueLayout.boundary as VenueBoundary;

      // L1 Check: Is user inside venue boundary?
      const insideVenue = this.isPointInPolygon(point, boundary.coordinates);
      result.outsideVenue = !insideVenue;

      if (!insideVenue) {
        result.alerts.push({
          type: 'boundary_breach',
          severity: 'medium',
          message: 'User is outside venue boundary'
        });
        return result;
      }

      result.isInside = true;

      // L2 Check: Which zones is the user in?
      const zones = (venueLayout.zones || []) as Zone[];
      const insideZones: string[] = [];
      let nearestDistance = Infinity;
      let nearestZone: { zoneId: string; zoneName: string; distance: number } | undefined;

      for (const zone of zones) {
        const isInZone = this.isPointInPolygon(point, zone.shape.coordinates);

        if (isInZone) {
          insideZones.push(zone.id);

          // Check for unauthorized access
          if (zone.properties.isVIP && userRole !== 'VIP' && userRole !== 'ADMIN') {
            result.alerts.push({
              type: 'unauthorized_zone',
              severity: 'high',
              message: `Unauthorized access to ${zone.name}`,
              zoneId: zone.id,
              zoneName: zone.name
            });
          }

          // Check for restricted areas
          if (zone.type === 'restricted' &&
            zone.properties.allowedRoles &&
            userRole &&
            !zone.properties.allowedRoles.includes(userRole)) {
            result.alerts.push({
              type: 'restricted_area',
              severity: 'critical',
              message: `Restricted area access detected at ${zone.name}`,
              zoneId: zone.id,
              zoneName: zone.name
            });
          }
        } else {
          // Calculate distance to zone
          const zonePoly = turf.polygon(zone.shape.coordinates);
          const zoneCentroid = turf.centroid(zonePoly);
          const userPoint = turf.point(point);
          const distance = turf.distance(userPoint, zoneCentroid, { units: 'meters' });

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestZone = {
              zoneId: zone.id,
              zoneName: zone.name,
              distance
            };
          }
        }
      }

      result.insideZones = insideZones;
      if (nearestZone) {
        result.nearestZone = nearestZone;
      }

      // Emit real-time geofence event if alerts exist
      if (result.alerts.length > 0 && userId) {
        io.to(`event:${eventId}`).emit('geofence:alert', {
          userId,
          location,
          alerts: result.alerts,
          timestamp: new Date()
        });
      }

      return result;
    } catch (error) {
      console.error('Geofence check error:', error);
      return result;
    }
  }

  /**
   * Generate navigation graph from venue boundary and zones
   */
  generateNavigationGraph(
    boundary: Position[][],
    zones: Zone[]
  ): { nodes: Position[]; edges: [number, number][] } {
    const nodes: Position[] = [];
    const edges: [number, number][] = [];

    // Add boundary vertices as nodes
    boundary[0].forEach(coord => {
      if (nodes.length === 0 ||
        (nodes[nodes.length - 1][0] !== coord[0] || nodes[nodes.length - 1][1] !== coord[1])) {
        nodes.push(coord);
      }
    });

    // Add zone vertices (for obstacle avoidance)
    zones.forEach(zone => {
      zone.shape.coordinates[0].forEach(coord => {
        if (!nodes.some(n => n[0] === coord[0] && n[1] === coord[1])) {
          nodes.push(coord);
        }
      });
    });

    // Generate edges (simplified: connect adjacent boundary points)
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push([i, i + 1]);
    }

    return { nodes, edges };
  }

  /**
   * Find shortest path between two points avoiding crowded zones
   */
  async findOptimalPath(
    eventId: string,
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    avoidCrowdedZones: boolean = true
  ): Promise<{ path: Position[]; distance: number; estimatedTime: number }> {
    try {
      const venueLayout = await prisma.venueLayout.findUnique({
        where: { eventId }
      });

      if (!venueLayout) {
        throw new Error('Venue layout not found');
      }

      const fromPoint: Position = [from.lng, from.lat];
      const toPoint: Position = [to.lng, to.lat];

      // Simple straight-line path (can be enhanced with A* algorithm)
      const path = [fromPoint, toPoint];
      const distance = turf.distance(turf.point(fromPoint), turf.point(toPoint), { units: 'meters' });

      // Average walking speed: 1.4 m/s
      const baseSpeed = 1.4;
      const crowdPenalty = avoidCrowdedZones ? 1.3 : 1.0;
      const estimatedTime = Math.ceil((distance / baseSpeed) * crowdPenalty);

      return { path, distance, estimatedTime };
    } catch (error) {
      console.error('Path finding error:', error);
      throw error;
    }
  }

  /**
   * Save venue layout with validation
   */
  async saveVenueLayout(
    eventId: string,
    boundary: VenueBoundary,
    zones: Zone[],
    gates?: any[],
    routes?: any[]
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Validate boundary
      const boundaryValidation = this.validatePolygon(boundary.coordinates);
      if (!boundaryValidation.valid) {
        return { success: false, errors: boundaryValidation.errors };
      }

      // Validate all zones
      const zoneErrors: string[] = [];
      for (let i = 0; i < zones.length; i++) {
        const zoneValidation = this.validatePolygon(zones[i].shape.coordinates);
        if (!zoneValidation.valid) {
          zoneErrors.push(`Zone ${i + 1} (${zones[i].name}): ${zoneValidation.errors.join(', ')}`);
        }

        // Check if zone is inside boundary
        const zoneCenter = turf.centerOfMass(turf.polygon(zones[i].shape.coordinates));
        if (!this.isPointInPolygon([zoneCenter.geometry.coordinates[0], zoneCenter.geometry.coordinates[1]], boundary.coordinates)) {
          zoneErrors.push(`Zone ${i + 1} (${zones[i].name}): Zone center is outside venue boundary`);
        }
      }

      if (zoneErrors.length > 0) {
        return { success: false, errors: zoneErrors };
      }

      // Generate navigation graph
      const navGraph = this.generateNavigationGraph(boundary.coordinates, zones);

      // Save to database
      await prisma.venueLayout.upsert({
        where: { eventId },
        update: {
          boundary,
          zones: zones as any,
          gates: gates || [],
          routes: routes || [],
          navGraph: navGraph as any,
          metadata: {
            totalArea: this.calculateArea(boundary.coordinates),
            zoneCount: zones.length,
            lastUpdated: new Date()
          }
        },
        create: {
          eventId,
          boundary,
          zones: zones as any,
          gates: gates || [],
          routes: routes || [],
          navGraph: navGraph as any,
          metadata: {
            totalArea: this.calculateArea(boundary.coordinates),
            zoneCount: zones.length,
            lastUpdated: new Date()
          }
        }
      });

      // Emit real-time update
      io.to(`event:${eventId}`).emit('venue:updated', {
        eventId,
        boundary,
        zones,
        timestamp: new Date()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Save venue layout error:', error);
      return { success: false, errors: [error.message] };
    }
  }
}

export const venueMappingService = new VenueMappingService();
