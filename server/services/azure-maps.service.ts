/**
 * Azure Maps Service
 * Mapping, geocoding, routing, and spatial analysis
 * 
 * Features:
 * - Geocoding and reverse geocoding
 * - Route calculation and directions
 * - Places search and POI lookup
 * - Geofencing and spatial operations
 * - Traffic data and incident reporting
 * 
 * Replaces: Google Maps Platform
 */

import axios from 'axios';
import { azureConfig } from '../config/azure.config';

interface GeocodingResult {
  address: string;
  lat: number;
  lon: number;
  confidence: number;
  type: string;
}

interface ReverseGeocodingResult {
  address: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface RouteRequest {
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  waypoints?: { lat: number; lon: number }[];
  travelMode?: 'car' | 'truck' | 'taxi' | 'bus' | 'walk' | 'bicycle';
}

interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  polyline: string;
  steps: RouteStep[];
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: { lat: number; lon: number };
  endLocation: { lat: number; lon: number };
}

interface PlaceSearchRequest {
  query: string;
  location?: { lat: number; lon: number };
  radius?: number;
  type?: string;
}

interface Place {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lon: number };
  types: string[];
  rating?: number;
  distance?: number;
}

class AzureMapsService {
  private readonly subscriptionKey: string;
  private readonly baseUrl: string = 'https://atlas.microsoft.com';

  constructor() {
    this.subscriptionKey = azureConfig.maps.subscriptionKey;
    console.log('[Azure Maps Service] Initialized');
  }

  /**
   * Get common query parameters
   */
  private getCommonParams(): Record<string, string> {
    return {
      'api-version': '1.0',
      'subscription-key': this.subscriptionKey,
    };
  }

  /**
   * Geocoding - Convert address to coordinates
   */
  async geocode(address: string): Promise<GeocodingResult[]> {
    try {
      const params = {
        ...this.getCommonParams(),
        query: address,
        limit: '5',
      };

      const response = await axios.get(`${this.baseUrl}/search/address/json`, { params });

      if (!response.data.results || response.data.results.length === 0) {
        return [];
      }

      return response.data.results.map((result: any) => ({
        address: result.address.freeformAddress,
        lat: result.position.lat,
        lon: result.position.lon,
        confidence: result.score,
        type: result.type,
      }));
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  /**
   * Reverse Geocoding - Convert coordinates to address
   */
  async reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodingResult> {
    try {
      const params = {
        ...this.getCommonParams(),
        query: `${lat},${lon}`,
      };

      const response = await axios.get(`${this.baseUrl}/search/address/reverse/json`, { params });

      if (!response.data.addresses || response.data.addresses.length === 0) {
        throw new Error('No address found for coordinates');
      }

      const address = response.data.addresses[0].address;

      return {
        address: address.freeformAddress,
        street: address.streetName || '',
        city: address.municipality || address.municipalitySubdivision || '',
        postalCode: address.postalCode || '',
        country: address.country || '',
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  }

  /**
   * Calculate route between two points
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    try {
      const { origin, destination, waypoints, travelMode = 'car' } = request;

      // Build coordinates string: origin:waypoint1:waypoint2:destination
      let coordinates = `${origin.lat},${origin.lon}`;
      
      if (waypoints && waypoints.length > 0) {
        waypoints.forEach(wp => {
          coordinates += `:${wp.lat},${wp.lon}`;
        });
      }
      
      coordinates += `:${destination.lat},${destination.lon}`;

      const params = {
        ...this.getCommonParams(),
        query: coordinates,
        travelMode,
        traffic: 'true',
        routeRepresentation: 'polyline',
        computeBestOrder: 'false',
      };

      const response = await axios.get(`${this.baseUrl}/route/directions/json`, { params });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = response.data.routes[0];
      const summary = route.summary;
      const legs = route.legs || [];

      // Extract steps from all legs
      const steps: RouteStep[] = [];
      legs.forEach((leg: any) => {
        leg.points?.forEach((point: any, index: number) => {
          if (index < leg.points.length - 1) {
            steps.push({
              instruction: point.instruction || 'Continue',
              distance: point.distanceMeters || 0,
              duration: point.travelTimeSeconds || 0,
              startLocation: {
                lat: point.latitude,
                lon: point.longitude,
              },
              endLocation: {
                lat: leg.points[index + 1].latitude,
                lon: leg.points[index + 1].longitude,
              },
            });
          }
        });
      });

      return {
        distance: summary.lengthInMeters,
        duration: summary.travelTimeInSeconds,
        polyline: route.legs[0]?.points?.map((p: any) => 
          `${p.latitude},${p.longitude}`
        ).join('|') || '',
        steps,
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }

  /**
   * Search for places/POIs
   */
  async searchPlaces(request: PlaceSearchRequest): Promise<Place[]> {
    try {
      const { query, location, radius = 5000, type } = request;

      const params: any = {
        ...this.getCommonParams(),
        query,
        limit: '20',
      };

      // Add location bias if provided
      if (location) {
        params.lat = location.lat.toString();
        params.lon = location.lon.toString();
        params.radius = radius.toString();
      }

      // Add category filter if type provided
      if (type) {
        params.categorySet = this.mapPlaceTypeToCategory(type);
      }

      const response = await axios.get(`${this.baseUrl}/search/poi/json`, { params });

      if (!response.data.results || response.data.results.length === 0) {
        return [];
      }

      return response.data.results.map((result: any) => ({
        id: result.id,
        name: result.poi?.name || result.address.freeformAddress,
        address: result.address.freeformAddress,
        location: {
          lat: result.position.lat,
          lon: result.position.lon,
        },
        types: result.poi?.classifications?.map((c: any) => c.code) || [],
        rating: result.rating || undefined,
        distance: result.dist,
      }));
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }

  /**
   * Get nearby places by category
   */
  async getNearbyPlaces(
    lat: number,
    lon: number,
    category: string,
    radius: number = 1000
  ): Promise<Place[]> {
    try {
      const params = {
        ...this.getCommonParams(),
        lat: lat.toString(),
        lon: lon.toString(),
        radius: radius.toString(),
        categorySet: this.mapPlaceTypeToCategory(category),
        limit: '10',
      };

      const response = await axios.get(`${this.baseUrl}/search/nearby/json`, { params });

      if (!response.data.results || response.data.results.length === 0) {
        return [];
      }

      return response.data.results.map((result: any) => ({
        id: result.id,
        name: result.poi?.name || 'Unnamed Place',
        address: result.address?.freeformAddress || '',
        location: {
          lat: result.position.lat,
          lon: result.position.lon,
        },
        types: result.poi?.classifications?.map((c: any) => c.code) || [],
        distance: result.dist,
      }));
    } catch (error) {
      console.error('Error getting nearby places:', error);
      throw error;
    }
  }

  /**
   * Get traffic incidents in area
   */
  async getTrafficIncidents(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<any[]> {
    try {
      const params = {
        ...this.getCommonParams(),
        bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
        language: 'en-US',
        projection: 'EPSG4326',
      };

      const response = await axios.get(`${this.baseUrl}/traffic/incident/tile/json`, { params });

      return response.data.incidents || [];
    } catch (error) {
      console.error('Error getting traffic incidents:', error);
      return [];
    }
  }

  /**
   * Calculate distance matrix between multiple origins and destinations
   */
  async calculateDistanceMatrix(
    origins: { lat: number; lon: number }[],
    destinations: { lat: number; lon: number }[]
  ): Promise<number[][]> {
    try {
      // Azure Maps doesn't have a direct distance matrix API
      // We'll calculate routes for each origin-destination pair
      const matrix: number[][] = [];

      for (const origin of origins) {
        const row: number[] = [];
        
        for (const destination of destinations) {
          try {
            const route = await this.calculateRoute({ origin, destination });
            row.push(route.duration);
          } catch {
            row.push(Infinity);
          }
        }
        
        matrix.push(row);
      }

      return matrix;
    } catch (error) {
      console.error('Error calculating distance matrix:', error);
      throw error;
    }
  }

  /**
   * Map Google Maps place types to Azure Maps categories
   */
  private mapPlaceTypeToCategory(type: string): string {
    const mapping: Record<string, string> = {
      restaurant: '7315',
      hospital: '9663',
      police: '9221',
      'fire_station': '9221',
      hotel: '7314',
      'gas_station': '7311',
      'parking': '7313',
      'shopping_mall': '7373',
      airport: '7383',
      'train_station': '7380',
      school: '8211',
      university: '8200',
      bank: '9154',
      atm: '7328',
      pharmacy: '9663',
      // Add more mappings as needed
    };

    return mapping[type] || '9999'; // 9999 = All categories
  }

  /**
   * Generate static map image URL
   */
  getStaticMapUrl(
    center: { lat: number; lon: number },
    zoom: number = 12,
    width: number = 512,
    height: number = 512,
    markers?: { lat: number; lon: number; label?: string }[]
  ): string {
    let url = `${this.baseUrl}/map/static/png`;
    url += `?api-version=1.0`;
    url += `&subscription-key=${this.subscriptionKey}`;
    url += `&center=${center.lon},${center.lat}`;
    url += `&zoom=${zoom}`;
    url += `&width=${width}`;
    url += `&height=${height}`;

    if (markers && markers.length > 0) {
      const pins = markers.map(m => `${m.lon} ${m.lat}`).join('|');
      url += `&pins=default||${pins}`;
    }

    return url;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test geocoding endpoint
      await this.geocode('Seattle, WA');
      return true;
    } catch (error) {
      console.error('Azure Maps health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const azureMapsService = new AzureMapsService();
export default azureMapsService;
