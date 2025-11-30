/**
 * Traffic & Incident Feed Integration Service
 * Waze for Cities, OpenStreetMap, Google Maps Roads API
 */

import axios from 'axios';
import { Client as GoogleMapsClient } from '@googlemaps/google-maps-services-js';

interface TrafficIncident {
  id: string;
  source: 'waze' | 'osm' | 'google_maps' | 'crowdsource';
  type:
  | 'construction'
  | 'roadwork'
  | 'closure'
  | 'accident'
  | 'jam'
  | 'hazard'
  | 'event';
  location: { lat: number; lon: number };
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date;
  endTime?: Date;
  affectedRoads: string[];
  confidence: number;
  metadata?: any;
}

interface WazeAlert {
  uuid: string;
  type: string;
  subtype: string;
  location: { x: number; y: number };
  street: string;
  city: string;
  country: string;
  magvar: number;
  reliability: number;
  reportRating: number;
  confidence: number;
  pubMillis: number;
}

interface WazeJam {
  uuid: string;
  line: { x: number; y: number }[];
  level: number;
  length: number;
  speedKMH: number;
  delay: number;
  street: string;
  city: string;
  type: string;
  pubMillis: number;
}

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

class TrafficFeedService {
  private googleMapsClient: GoogleMapsClient;
  private wazeApiKey: string = '';
  private wazeBaseUrl: string = 'https://www.waze.com/partnerhub-api/feeds';

  constructor() {
    this.googleMapsClient = new GoogleMapsClient({});
    this.wazeApiKey = import.meta.env.VITE_WAZE_API_KEY || '';
  }

  /**
   * Fetch Waze incidents for a geographic area
   */
  async fetchWazeIncidents(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<TrafficIncident[]> {
    try {
      const response = await axios.get(`${this.wazeBaseUrl}/alerts`, {
        params: {
          polygon: `${bounds.north},${bounds.west};${bounds.south},${bounds.east}`,
        },
        headers: {
          'x-api-key': this.wazeApiKey,
        },
        timeout: 10000,
      });

      const alerts: WazeAlert[] = response.data.alerts || [];
      const jams: WazeJam[] = response.data.jams || [];

      const incidents: TrafficIncident[] = [];

      // Process alerts
      for (const alert of alerts) {
        incidents.push({
          id: `waze_${alert.uuid}`,
          source: 'waze',
          type: this.mapWazeAlertType(alert.type, alert.subtype),
          location: { lat: alert.location.y, lon: alert.location.x },
          description: `${alert.type} on ${alert.street}`,
          severity: this.mapWazeSeverity(alert.confidence, alert.reliability),
          startTime: new Date(alert.pubMillis),
          affectedRoads: [alert.street],
          confidence: alert.confidence / 10,
          metadata: { waze: alert },
        });
      }

      // Process jams
      for (const jam of jams) {
        const centerLat =
          jam.line.reduce((sum, p) => sum + p.y, 0) / jam.line.length;
        const centerLon =
          jam.line.reduce((sum, p) => sum + p.x, 0) / jam.line.length;

        incidents.push({
          id: `waze_jam_${jam.uuid}`,
          source: 'waze',
          type: 'jam',
          location: { lat: centerLat, lon: centerLon },
          description: `Traffic jam on ${jam.street} (Level ${jam.level}, ${jam.delay}s delay)`,
          severity: this.mapJamSeverity(jam.level),
          startTime: new Date(jam.pubMillis),
          affectedRoads: [jam.street],
          confidence: 0.9,
          metadata: { waze: jam },
        });
      }

      console.log(`[TrafficFeed] Fetched ${incidents.length} Waze incidents`);
      return incidents;
    } catch (error) {
      console.error('[TrafficFeed] Waze fetch failed:', error);
      return [];
    }
  }

  /**
   * Fetch OpenStreetMap construction data
   */
  async fetchOSMConstruction(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<TrafficIncident[]> {
    try {
      const query = `
        [out:json];
        (
          way["highway"]["construction"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["highway"]["construction"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        );
        out body geom;
      `;

      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        query,
        {
          headers: { 'Content-Type': 'text/plain' },
          timeout: 15000,
        }
      );

      const elements: OSMElement[] = response.data.elements || [];
      const incidents: TrafficIncident[] = [];

      for (const element of elements) {
        const location =
          element.type === 'node'
            ? { lat: element.lat!, lon: element.lon! }
            : element.geometry && element.geometry.length > 0
              ? element.geometry[0]
              : null;

        if (!location) continue;

        incidents.push({
          id: `osm_${element.type}_${element.id}`,
          source: 'osm',
          type: 'construction',
          location,
          description:
            element.tags.note ||
            element.tags.description ||
            `Construction on ${element.tags.name || 'unnamed road'}`,
          severity: 'medium',
          startTime: new Date(), // OSM doesn't provide timestamps
          affectedRoads: element.tags.name ? [element.tags.name] : [],
          confidence: 0.85,
          metadata: { osm: element.tags },
        });
      }

      console.log(`[TrafficFeed] Fetched ${incidents.length} OSM construction sites`);
      return incidents;
    } catch (error) {
      console.error('[TrafficFeed] OSM fetch failed:', error);
      return [];
    }
  }

  /**
   * Fetch Google Maps traffic conditions
   */
  async fetchGoogleTrafficConditions(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number }
  ): Promise<{
    duration: number;
    durationInTraffic: number;
    delay: number;
    condition: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'severe';
  }> {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

      const response = await this.googleMapsClient.directions({
        params: {
          origin: `${origin.lat},${origin.lon}`,
          destination: `${destination.lat},${destination.lon}`,
          mode: 'driving' as any,
          departure_time: 'now',
          traffic_model: 'best_guess' as any,
          key: apiKey,
        },
        timeout: 10000,
      });

      if (response.data.status !== 'OK' || !response.data.routes[0]) {
        throw new Error('No route found');
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      const duration = leg.duration.value;
      const durationInTraffic = leg.duration_in_traffic?.value || duration;
      const delay = durationInTraffic - duration;

      const delayRatio = delay / duration;
      let condition: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'severe' =
        'free_flow';

      if (delayRatio > 0.5) condition = 'severe';
      else if (delayRatio > 0.3) condition = 'heavy';
      else if (delayRatio > 0.15) condition = 'moderate';
      else if (delayRatio > 0.05) condition = 'light';

      return {
        duration,
        durationInTraffic,
        delay,
        condition,
      };
    } catch (error) {
      console.error('[TrafficFeed] Google traffic fetch failed:', error);
      return {
        duration: 0,
        durationInTraffic: 0,
        delay: 0,
        condition: 'free_flow',
      };
    }
  }

  /**
   * Aggregate all traffic feeds
   */
  async aggregateFeeds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<TrafficIncident[]> {
    console.log('[TrafficFeed] Aggregating all feeds...');

    const [wazeIncidents, osmConstruction] = await Promise.all([
      this.fetchWazeIncidents(bounds),
      this.fetchOSMConstruction(bounds),
    ]);

    const allIncidents = [...wazeIncidents, ...osmConstruction];

    // Deduplicate incidents within 100m radius
    const deduplicated = this.deduplicateIncidents(allIncidents, 0.1); // 100m in km

    console.log(
      `[TrafficFeed] Aggregated ${deduplicated.length} unique incidents`
    );
    return deduplicated;
  }

  /**
   * Deduplicate incidents based on proximity
   */
  private deduplicateIncidents(
    incidents: TrafficIncident[],
    radiusKm: number
  ): TrafficIncident[] {
    const deduplicated: TrafficIncident[] = [];

    for (const incident of incidents) {
      const isDuplicate = deduplicated.some((existing) => {
        const distance = this.haversineDistance(
          incident.location,
          existing.location
        );
        return distance <= radiusKm && incident.type === existing.type;
      });

      if (!isDuplicate) {
        deduplicated.push(incident);
      }
    }

    return deduplicated;
  }

  /**
   * Calculate Haversine distance
   */
  private haversineDistance(
    coord1: { lat: number; lon: number },
    coord2: { lat: number; lon: number }
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLon = this.toRadians(coord2.lon - coord1.lon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
      Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Map Waze alert types
   */
  private mapWazeAlertType(
    type: string,
    _subtype: string
  ): TrafficIncident['type'] {
    const mapping: Record<string, TrafficIncident['type']> = {
      ACCIDENT: 'accident',
      JAM: 'jam',
      WEATHERHAZARD: 'hazard',
      ROAD_CLOSED: 'closure',
      CONSTRUCTION: 'construction',
      HAZARD: 'hazard',
    };

    return mapping[type.toUpperCase()] || 'hazard';
  }

  /**
   * Map Waze severity
   */
  private mapWazeSeverity(
    confidence: number,
    reliability: number
  ): TrafficIncident['severity'] {
    const score = (confidence + reliability) / 2;

    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Map jam severity
   */
  private mapJamSeverity(level: number): TrafficIncident['severity'] {
    if (level >= 4) return 'critical';
    if (level >= 3) return 'high';
    if (level >= 2) return 'medium';
    return 'low';
  }

  /**
   * Submit crowdsourced incident
   */
  async submitCrowdsourcedIncident(
    incident: Omit<TrafficIncident, 'id' | 'source' | 'confidence'>
  ): Promise<string> {
    const newIncident: TrafficIncident = {
      ...incident,
      id: `crowd_${Date.now()}`,
      source: 'crowdsource',
      confidence: 0.6, // Lower confidence for crowdsourced data
    };

    // In production, store to Firestore/BigQuery
    console.log('[TrafficFeed] Crowdsourced incident submitted:', newIncident.id);
    return newIncident.id;
  }

  /**
   * Get incidents affecting route
   */
  async getIncidentsOnRoute(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    radiusKm: number = 0.5
  ): Promise<TrafficIncident[]> {
    // Get route polyline
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    const response = await this.googleMapsClient.directions({
      params: {
        origin: `${origin.lat},${origin.lon}`,
        destination: `${destination.lat},${destination.lon}`,
        mode: 'driving' as any,
        key: apiKey,
      },
      timeout: 10000,
    });

    if (response.data.status !== 'OK') {
      return [];
    }

    const route = response.data.routes[0];
    const polyline = route.overview_polyline.points;

    // Decode polyline and get bounding box
    const bounds = this.getPolylineBounds(polyline);

    // Fetch incidents in area
    const incidents = await this.aggregateFeeds(bounds);

    // Filter incidents near route
    return incidents.filter((incident) => {
      // Check if incident is within radius of any point on route
      // Simplified: just check against start/end for now
      const distToOrigin = this.haversineDistance(incident.location, origin);
      const distToDestination = this.haversineDistance(
        incident.location,
        destination
      );

      return distToOrigin <= radiusKm || distToDestination <= radiusKm;
    });
  }

  /**
   * Get polyline bounding box
   */
  private getPolylineBounds(_polyline: string): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    // Simplified: return large area (in production, decode polyline properly)
    return {
      north: 28.62,
      south: 28.60,
      east: 77.22,
      west: 77.20,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test Waze API
      await axios.get(`${this.wazeBaseUrl}/alerts`, {
        params: { polygon: '0,0;0,0' },
        headers: { 'x-api-key': this.wazeApiKey },
        timeout: 5000,
      });

      return true;
    } catch (error) {
      console.error('[TrafficFeed] Health check failed:', error);
      return false;
    }
  }
}

export const trafficFeedService = new TrafficFeedService();
export default trafficFeedService;
