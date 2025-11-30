/**
 * Google Maps Platform Integration Service
 * Handles navigation, routing, safe paths, and venue mapping
 * 
 * Purpose:
 * - Maps SDK: Display maps with crowd density overlays
 * - Routes API: Calculate optimal and safe routes for attendees
 * - Places API: Identify POIs, gates, amenities within venue
 * - Directions API: Real-time navigation with traffic
 */

import { Client, TravelMode, TrafficModel, DirectionsRequest, DirectionsResponse, LatLng, Place } from '@googlemaps/google-maps-services-js';
import { gcpConfig } from '../config/gcp.config';

interface SafeRouteRequest {
  origin: LatLng;
  destination: LatLng;
  avoidCrowdedZones?: LatLng[];
  avoidHazards?: LatLng[];
  travelMode?: 'WALKING' | 'DRIVING' | 'TRANSIT';
  departureTime?: Date;
}

interface SafeRouteResponse {
  routes: RouteInfo[];
  recommendedRoute: RouteInfo;
  alternativeRoutes: RouteInfo[];
  warnings: string[];
}

interface RouteInfo {
  summary: string;
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
  polyline: string;
  crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  safetyScore: number; // 0-100
  warnings: string[];
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: LatLng;
  endLocation: LatLng;
  maneuver?: string;
}

interface VenuePOI {
  id: string;
  name: string;
  type: 'ENTRANCE' | 'EXIT' | 'MEDICAL' | 'RESTROOM' | 'FOOD' | 'SECURITY' | 'PARKING' | 'OTHER';
  location: LatLng;
  capacity?: number;
  currentOccupancy?: number;
  status: 'OPEN' | 'CLOSED' | 'CROWDED' | 'HAZARD';
  description?: string;
}

interface GateRecommendation {
  gate: VenuePOI;
  distance: number;
  estimatedWaitTime: number; // minutes
  crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: 'RECOMMENDED' | 'ALTERNATIVE' | 'AVOID';
  reason: string;
}

class GoogleMapsService {
  private client: Client;
  private apiKey: string;
  private initialized: boolean = false;

  constructor() {
    this.apiKey = gcpConfig.maps.apiKey;
    this.client = new Client({});
    this.initialized = true;
    console.log('✓ Google Maps Service initialized');
  }

  // ==================== ROUTING & NAVIGATION ====================

  /**
   * Calculate safe route avoiding crowded zones
   */
  async calculateSafeRoute(request: SafeRouteRequest): Promise<SafeRouteResponse> {
    try {
      // Build waypoints to avoid crowded zones
      const avoid: LatLng[] = [
        ...(request.avoidCrowdedZones || []),
        ...(request.avoidHazards || []),
      ];

      const directionsRequest: DirectionsRequest = {
        params: {
          key: this.apiKey,
          origin: request.origin,
          destination: request.destination,
          mode: this.mapTravelMode(request.travelMode || 'WALKING'),
          alternatives: true,
          traffic_model: TrafficModel.best_guess,
          departure_time: request.departureTime || new Date(),
        },
      };

      const response = await this.client.directions(directionsRequest);

      if (response.data.status !== 'OK') {
        throw new Error(`Directions API error: ${response.data.status}`);
      }

      // Process routes and calculate safety scores
      const routes: RouteInfo[] = response.data.routes.map((route, index) => {
        const safetyScore = this.calculateSafetyScore(route, avoid);
        const crowdLevel = this.estimateCrowdLevel(route, avoid);

        return {
          summary: route.summary,
          distance: route.legs[0].distance.value,
          duration: route.legs[0].duration.value,
          polyline: route.overview_polyline.points,
          crowdLevel,
          safetyScore,
          warnings: route.warnings,
          steps: route.legs[0].steps.map(step => ({
            instruction: step.html_instructions,
            distance: step.distance.value,
            duration: step.duration.value,
            startLocation: step.start_location as LatLng,
            endLocation: step.end_location as LatLng,
            maneuver: step.maneuver,
          })),
        };
      });

      // Select recommended route (highest safety score)
      const recommendedRoute = routes.reduce((best, current) =>
        current.safetyScore > best.safetyScore ? current : best
      );

      const alternativeRoutes = routes.filter(r => r !== recommendedRoute);

      return {
        routes,
        recommendedRoute,
        alternativeRoutes,
        warnings: this.generateRouteWarnings(routes, avoid),
      };
    } catch (error) {
      console.error('Error calculating safe route:', error);
      throw error;
    }
  }

  /**
   * Get directions with real-time traffic
   */
  async getDirections(
    origin: LatLng,
    destination: LatLng,
    mode: 'WALKING' | 'DRIVING' | 'TRANSIT' = 'WALKING'
  ): Promise<any> {
    try {
      const response = await this.client.directions({
        params: {
          key: this.apiKey,
          origin,
          destination,
          mode: this.mapTravelMode(mode),
          traffic_model: TrafficModel.best_guess,
          departure_time: new Date(),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }

  /**
   * Calculate distance matrix for multiple origins/destinations
   */
  async getDistanceMatrix(
    origins: LatLng[],
    destinations: LatLng[],
    mode: 'WALKING' | 'DRIVING' = 'WALKING'
  ): Promise<any> {
    try {
      const response = await this.client.distancematrix({
        params: {
          key: this.apiKey,
          origins,
          destinations,
          mode: this.mapTravelMode(mode),
          traffic_model: TrafficModel.best_guess,
          departure_time: new Date(),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      throw error;
    }
  }

  // ==================== VENUE & POI MANAGEMENT ====================

  /**
   * Find nearby places (gates, amenities, etc.)
   */
  async findNearbyPlaces(
    location: LatLng,
    radius: number = 500,
    type?: string
  ): Promise<Place[]> {
    try {
      const response = await this.client.placesNearby({
        params: {
          key: this.apiKey,
          location,
          radius,
          type: type as any,
        },
      });

      return response.data.results;
    } catch (error) {
      console.error('Error finding nearby places:', error);
      throw error;
    }
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await this.client.placeDetails({
        params: {
          key: this.apiKey,
          place_id: placeId,
        },
      });

      return response.data.result;
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }

  /**
   * Recommend best gate/entrance based on crowd levels
   */
  async recommendGate(
    userLocation: LatLng,
    gates: VenuePOI[],
    crowdData: Map<string, number> // gateId -> crowdLevel
  ): Promise<GateRecommendation[]> {
    try {
      const recommendations: GateRecommendation[] = [];

      for (const gate of gates.filter(g => g.type === 'ENTRANCE')) {
        const distance = this.calculateDistance(userLocation, gate.location);
        const crowdLevel = this.getCrowdLevel(crowdData.get(gate.id) || 0);
        const estimatedWaitTime = this.estimateWaitTime(crowdLevel, gate.capacity);

        let recommendation: 'RECOMMENDED' | 'ALTERNATIVE' | 'AVOID';
        let reason: string;

        if (crowdLevel === 'LOW' && distance < 500) {
          recommendation = 'RECOMMENDED';
          reason = 'Close distance with low crowd density';
        } else if (crowdLevel === 'CRITICAL') {
          recommendation = 'AVOID';
          reason = 'Extremely crowded, long wait times expected';
        } else {
          recommendation = 'ALTERNATIVE';
          reason = crowdLevel === 'HIGH'
            ? 'Moderately crowded, consider alternative gates'
            : 'Acceptable crowd levels';
        }

        recommendations.push({
          gate,
          distance,
          estimatedWaitTime,
          crowdLevel,
          recommendation,
          reason,
        });
      }

      // Sort by recommendation priority
      return recommendations.sort((a, b) => {
        const priority = { RECOMMENDED: 0, ALTERNATIVE: 1, AVOID: 2 };
        return priority[a.recommendation] - priority[b.recommendation];
      });
    } catch (error) {
      console.error('Error recommending gate:', error);
      throw error;
    }
  }

  // ==================== CONGESTION & TRAFFIC ====================

  /**
   * Get traffic conditions for route
   */
  async getTrafficConditions(polyline: string): Promise<any> {
    try {
      // Decode polyline and check traffic along the route
      // This would integrate with Maps Traffic API
      // For now, return mock data structure
      return {
        overallLevel: 'MODERATE',
        segments: [],
        incidents: [],
      };
    } catch (error) {
      console.error('Error getting traffic conditions:', error);
      throw error;
    }
  }

  /**
   * Suggest alternative route to avoid congestion
   */
  async suggestAlternativeRoute(
    origin: LatLng,
    destination: LatLng,
    congestedAreas: LatLng[]
  ): Promise<RouteInfo> {
    try {
      const safeRoute = await this.calculateSafeRoute({
        origin,
        destination,
        avoidCrowdedZones: congestedAreas,
        travelMode: 'WALKING',
      });

      return safeRoute.recommendedRoute;
    } catch (error) {
      console.error('Error suggesting alternative route:', error);
      throw error;
    }
  }

  // ==================== GEOCODING ====================

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<LatLng> {
    try {
      const response = await this.client.geocode({
        params: {
          key: this.apiKey,
          address,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('Address not found');
      }

      return response.data.results[0].geometry.location as LatLng;
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(location: LatLng): Promise<string> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          key: this.apiKey,
          latlng: location,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('Location not found');
      }

      return response.data.results[0].formatted_address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371e3; // Earth's radius in meters

    // Normalize LatLng to get lat/lng values
    const lat1 = this.getLatFromLatLng(point1);
    const lat2 = this.getLatFromLatLng(point2);
    const lng1 = this.getLngFromLatLng(point1);
    const lng2 = this.getLngFromLatLng(point2);

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate safety score for route (0-100)
   */
  private calculateSafetyScore(route: any, avoidZones: LatLng[]): number {
    let score = 100;

    // Penalize proximity to crowded/hazard zones
    avoidZones.forEach(zone => {
      route.legs[0].steps.forEach((step: any) => {
        const distance = this.calculateDistance(step.start_location, zone);
        if (distance < 100) score -= 30;
        else if (distance < 200) score -= 15;
        else if (distance < 300) score -= 5;
      });
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Estimate crowd level along route
   */
  private estimateCrowdLevel(route: any, crowdedZones: LatLng[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let maxProximity = 1000;

    crowdedZones.forEach(zone => {
      route.legs[0].steps.forEach((step: any) => {
        const distance = this.calculateDistance(step.start_location, zone);
        if (distance < maxProximity) maxProximity = distance;
      });
    });

    if (maxProximity < 50) return 'CRITICAL';
    if (maxProximity < 100) return 'HIGH';
    if (maxProximity < 200) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate route warnings
   */
  private generateRouteWarnings(routes: RouteInfo[], avoidZones: LatLng[]): string[] {
    const warnings: string[] = [];

    routes.forEach(route => {
      if (route.crowdLevel === 'CRITICAL') {
        warnings.push('⚠️ Route passes through critically crowded area');
      } else if (route.crowdLevel === 'HIGH') {
        warnings.push('⚠️ Route may experience high crowd density');
      }

      if (route.safetyScore < 50) {
        warnings.push('⚠️ Low safety score - consider alternative route');
      }
    });

    return [...new Set(warnings)];
  }

  /**
   * Get crowd level from density value
   */
  private getCrowdLevel(density: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (density >= 0.8) return 'CRITICAL';
    if (density >= 0.6) return 'HIGH';
    if (density >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Estimate wait time based on crowd level
   */
  private estimateWaitTime(crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', capacity?: number): number {
    const baseWaitTime = {
      LOW: 2,
      MEDIUM: 5,
      HIGH: 10,
      CRITICAL: 20,
    };

    let waitTime = baseWaitTime[crowdLevel];

    if (capacity && capacity < 100) {
      waitTime *= 1.5; // Small capacity gates take longer
    }

    return Math.round(waitTime);
  }

  /**
   * Map travel mode to Google Maps TravelMode
   */
  private mapTravelMode(mode: string): TravelMode {
    const modeMap: { [key: string]: TravelMode } = {
      WALKING: TravelMode.walking,
      DRIVING: TravelMode.driving,
      TRANSIT: TravelMode.transit,
      BICYCLING: TravelMode.bicycling,
    };

    return modeMap[mode] || TravelMode.walking;
  }

  /**
   * Extract lat from LatLng union type
   */
  private getLatFromLatLng(latlng: LatLng): number {
    if (typeof latlng === 'string') {
      const [lat] = latlng.split(',').map(Number);
      return lat || 0;
    }
    if (Array.isArray(latlng)) {
      return latlng[0] || 0;
    }
    return (latlng as any).lat || (latlng as any).latitude || 0;
  }

  /**
   * Extract lng from LatLng union type
   */
  private getLngFromLatLng(latlng: LatLng): number {
    if (typeof latlng === 'string') {
      const [, lng] = latlng.split(',').map(Number);
      return lng || 0;
    }
    if (Array.isArray(latlng)) {
      return latlng[1] || 0;
    }
    return (latlng as any).lng || (latlng as any).longitude || 0;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();
export default googleMapsService;
