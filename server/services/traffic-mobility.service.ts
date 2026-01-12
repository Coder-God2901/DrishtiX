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
 * Traffic & Mobility Monitoring Service
 * Real-time traffic data integration with Waze and Google Maps
 * 
 * Features:
 * - Waze for Cities API integration
 * - Google Maps Traffic Layer API
 * - Real-time traffic incident detection
 * - Route optimization based on live traffic
 * - WebSocket broadcasting
 * - Pub/Sub integration
 * - BigQuery analytics storage
 */

import axios from 'axios';
import { azureMapsService } from './azure-maps.service';
import { azureSynapseAnalyticsService } from './azure-synapse-analytics.service';
import { azureServiceBusMessagingService as pubSubService } from './azure-service-bus-messaging.service';
import { io } from '../index';

// Waze API Configuration
const WAZE_CONFIG = {
  apiKey: process.env.WAZE_API_KEY || '',
  baseUrl: process.env.WAZE_BASE_URL || 'https://www.waze.com/partnerhub-api/feeds',
};

export interface TrafficIncident {
  id: string;
  source: 'waze' | 'google_maps' | 'manual';
  type: 'JAM' | 'ACCIDENT' | 'CONSTRUCTION' | 'CLOSURE' | 'HAZARD' | 'WEATHER' | 'EVENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: {
    lat: number;
    lon: number;
    street?: string;
    city?: string;
  };
  description: string;
  startTime: Date;
  endTime?: Date;
  delayMinutes?: number;
  affectedRoads: string[];
  confidence: number;
  metadata?: any;
}

export interface TrafficCondition {
  roadSegmentId: string;
  speed: number; // km/h
  freeFlowSpeed: number; // km/h
  congestionLevel: 'FREE_FLOW' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'STOPPED';
  travelTime: number; // seconds
  delayTime: number; // seconds vs free flow
  coordinates: Array<{ lat: number; lon: number }>;
}

export interface RouteImpact {
  eventId: string;
  routeId: string;
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  normalDuration: number; // minutes
  currentDuration: number; // minutes
  delayMinutes: number;
  affectedByIncidents: string[];
  alternativeRoutesAvailable: boolean;
  recommendation: 'USE_ROUTE' | 'USE_ALTERNATIVE' | 'DELAY_TRAVEL' | 'AVOID_AREA';
}

export interface MobilityData {
  eventId: string;
  timestamp: Date;
  activeIncidents: number;
  criticalIncidents: number;
  averageDelay: number; // minutes
  mostAffectedRoutes: string[];
  recommendations: string[];
  trafficScore: number; // 0-100, where 100 is worst
}

class TrafficMobilityService {
  private mapsClient: Client;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private incidentCache: Map<string, TrafficIncident> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.mapsClient = new Client({});
    this.initialized = !!gcpConfig.maps.apiKey;

    if (!this.initialized) {
      console.warn('[Traffic] Google Maps API not configured');
    } else {
      console.log('âœ“ Traffic & Mobility Service initialized');
    }
  }

  /**
   * Start monitoring traffic for an event
   */
  async startMonitoring(
    eventId: string,
    eventLocation: { lat: number; lon: number },
    radius: number = 5 // km
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Google Maps API not configured');
    }

    // Stop existing monitoring if any
    this.stopMonitoring(eventId);

    console.log(`[Traffic] Starting monitoring for event ${eventId} within ${radius}km radius`);

    // Initial fetch
    await this.fetchAndAnalyze(eventId, eventLocation, radius);

    // Poll every 5 minutes
    const interval = setInterval(async () => {
      try {
        await this.fetchAndAnalyze(eventId, eventLocation, radius);
      } catch (error) {
        console.error('[Traffic] Error in monitoring interval:', error);
      }
    }, 5 * 60 * 1000);

    this.monitoringIntervals.set(eventId, interval);
    console.log(`âœ“ Traffic monitoring active for event ${eventId}`);
  }

  /**
   * Stop monitoring for an event
   */
  stopMonitoring(eventId: string): void {
    const interval = this.monitoringIntervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(eventId);
      console.log(`âœ“ Stopped traffic monitoring for event ${eventId}`);
    }
  }

  /**
   * Fetch and analyze traffic data
   */
  private async fetchAndAnalyze(
    eventId: string,
    location: { lat: number; lon: number },
    radius: number
  ): Promise<void> {
    try {
      // Fetch incidents from multiple sources
      const [wazeIncidents, mapsIncidents] = await Promise.allSettled([
        this.fetchWazeIncidents(location, radius),
        this.fetchGoogleMapsTraffic(location, radius),
      ]);

      const allIncidents: TrafficIncident[] = [];

      if (wazeIncidents.status === 'fulfilled') {
        allIncidents.push(...wazeIncidents.value);
      }

      if (mapsIncidents.status === 'fulfilled') {
        allIncidents.push(...mapsIncidents.value);
      }

      // Deduplicate incidents
      const uniqueIncidents = this.deduplicateIncidents(allIncidents);

      // Calculate mobility impact
      const mobilityData = this.calculateMobilityImpact(eventId, uniqueIncidents);

      // Publish to Pub/Sub
      await pubSubService.publishMessage('traffic-updates', {
        eventId,
        incidents: uniqueIncidents,
        mobilityData,
        timestamp: new Date().toISOString(),
      });

      // Broadcast via WebSocket
      io.to(`event:${eventId}`).emit('traffic:update', mobilityData);
      io.to(`traffic:${eventId}`).emit('traffic:incidents', uniqueIncidents);

      // Store in BigQuery
      await this.storeToBigQuery(eventId, uniqueIncidents, mobilityData);

      // Check for critical incidents
      if (mobilityData.criticalIncidents > 0) {
        await this.triggerAlerts(eventId, mobilityData, uniqueIncidents);
      }

      console.log(`[Traffic] Analyzed ${uniqueIncidents.length} incidents for event ${eventId}, traffic score: ${mobilityData.trafficScore}`);

    } catch (error) {
      console.error('[Traffic] Error in fetch and analyze:', error);
      throw error;
    }
  }

  /**
   * Fetch traffic incidents from Waze API
   */
  private async fetchWazeIncidents(
    location: { lat: number; lon: number },
    radius: number
  ): Promise<TrafficIncident[]> {
    if (!WAZE_CONFIG.apiKey) {
      return [];
    }

    try {
      // Waze API uses bounding box
      const bbox = this.calculateBoundingBox(location, radius);

      const response = await axios.get(`${WAZE_CONFIG.baseUrl}/alerts`, {
        headers: {
          'X-API-Key': WAZE_CONFIG.apiKey,
        },
        params: {
          bbox: `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`,
        },
        timeout: 10000,
      });

      const alerts = response.data.alerts || [];

      return alerts.map((alert: any) => this.parseWazeIncident(alert));

    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('[Traffic] Waze API authentication failed');
      } else if (error.response?.status === 429) {
        console.warn('[Traffic] Waze API rate limit exceeded');
      } else {
        console.error('[Traffic] Error fetching Waze incidents:', error.message);
      }
      return [];
    }
  }

  /**
   * Fetch traffic data from Google Maps
   */
  private async fetchGoogleMapsTraffic(
    location: { lat: number; lon: number },
    radius: number
  ): Promise<TrafficIncident[]> {
    try {
      // Use Google Maps Roads API to get traffic conditions
      // Note: This is a simplified implementation
      // In production, you'd use the Distance Matrix API with traffic model

      const response = await this.mapsClient.distancematrix({
        params: {
          key: gcpConfig.maps.apiKey,
          origins: [{ lat: location.lat, lng: location.lon }],
          destinations: [{ lat: location.lat, lng: location.lon }], // Same point for traffic check
          mode: 'driving' as any,
          departure_time: 'now' as any,
          traffic_model: 'best_guess' as any,
        },
      });

      // Parse traffic data from response
      const incidents: TrafficIncident[] = [];

      // This is a placeholder - Google Maps doesn't directly provide incident data
      // You would typically use the Traffic Layer data or integrate with other sources

      return incidents;

    } catch (error) {
      console.error('[Traffic] Error fetching Google Maps traffic:', error);
      return [];
    }
  }

  /**
   * Parse Waze incident
   */
  private parseWazeIncident(alert: any): TrafficIncident {
    const typeMap: Record<string, TrafficIncident['type']> = {
      'JAM': 'JAM',
      'ACCIDENT': 'ACCIDENT',
      'ROAD_CLOSED': 'CLOSURE',
      'WEATHERHAZARD': 'WEATHER',
      'HAZARD': 'HAZARD',
    };

    const severityMap: Record<string, TrafficIncident['severity']> = {
      '1': 'LOW',
      '2': 'LOW',
      '3': 'MEDIUM',
      '4': 'HIGH',
      '5': 'CRITICAL',
    };

    return {
      id: `waze_${alert.uuid}`,
      source: 'waze',
      type: typeMap[alert.type] || 'HAZARD',
      severity: severityMap[alert.magvar?.toString()] || 'MEDIUM',
      location: {
        lat: alert.location.y,
        lon: alert.location.x,
        street: alert.street,
        city: alert.city,
      },
      description: alert.reportDescription || alert.type,
      startTime: new Date(alert.pubMillis),
      delayMinutes: alert.jamLevel ? alert.jamLevel * 2 : undefined,
      affectedRoads: alert.street ? [alert.street] : [],
      confidence: alert.reliability / 10,
      metadata: {
        subtype: alert.subtype,
        reportBy: alert.reportBy,
      },
    };
  }

  /**
   * Calculate bounding box for given location and radius
   */
  private calculateBoundingBox(
    center: { lat: number; lon: number },
    radiusKm: number
  ): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
    const latChange = radiusKm / 111; // 1 degree latitude = ~111km
    const lonChange = radiusKm / (111 * Math.cos(center.lat * Math.PI / 180));

    return {
      minLat: center.lat - latChange,
      maxLat: center.lat + latChange,
      minLon: center.lon - lonChange,
      maxLon: center.lon + lonChange,
    };
  }

  /**
   * Deduplicate incidents from multiple sources
   */
  private deduplicateIncidents(incidents: TrafficIncident[]): TrafficIncident[] {
    const unique = new Map<string, TrafficIncident>();

    incidents.forEach(incident => {
      // Check if similar incident already exists
      const key = `${incident.type}_${incident.location.lat.toFixed(3)}_${incident.location.lon.toFixed(3)}`;

      const existing = unique.get(key);
      if (!existing || incident.confidence > existing.confidence) {
        unique.set(key, incident);
      }
    });

    return Array.from(unique.values());
  }

  /**
   * Calculate mobility impact
   */
  private calculateMobilityImpact(
    eventId: string,
    incidents: TrafficIncident[]
  ): MobilityData {
    const activeIncidents = incidents.length;
    const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL').length;

    let totalDelay = 0;
    const affectedRoads = new Set<string>();

    incidents.forEach(incident => {
      if (incident.delayMinutes) {
        totalDelay += incident.delayMinutes;
      }
      incident.affectedRoads.forEach(road => affectedRoads.add(road));
    });

    const averageDelay = activeIncidents > 0 ? totalDelay / activeIncidents : 0;

    // Calculate traffic score (0-100, higher is worse)
    let trafficScore = 0;
    trafficScore += criticalIncidents * 20;
    trafficScore += incidents.filter(i => i.severity === 'HIGH').length * 10;
    trafficScore += incidents.filter(i => i.severity === 'MEDIUM').length * 5;
    trafficScore += incidents.filter(i => i.severity === 'LOW').length * 2;
    trafficScore = Math.min(trafficScore, 100);

    const recommendations: string[] = [];

    if (trafficScore >= 70) {
      recommendations.push('CRITICAL: Severe traffic delays expected - consider alternative transportation');
    } else if (trafficScore >= 50) {
      recommendations.push('WARNING: Heavy traffic - allow extra travel time');
    } else if (trafficScore >= 30) {
      recommendations.push('MODERATE: Some delays possible - monitor traffic updates');
    }

    if (criticalIncidents > 0) {
      recommendations.push(`${criticalIncidents} critical incident(s) affecting area`);
    }

    return {
      eventId,
      timestamp: new Date(),
      activeIncidents,
      criticalIncidents,
      averageDelay,
      mostAffectedRoutes: Array.from(affectedRoads).slice(0, 5),
      recommendations,
      trafficScore,
    };
  }

  /**
   * Store traffic data to BigQuery
   */
  private async storeToBigQuery(
    eventId: string,
    incidents: TrafficIncident[],
    mobilityData: MobilityData
  ): Promise<void> {
    try {
      // Stream individual incidents for detailed analytics
      for (const incident of incidents) {
        await bigQueryAnalyticsService.streamTrafficIncident({
          eventId,
          incidentId: incident.id,
          timestamp: incident.startTime,
          source: incident.source,
          type: incident.type,
          severity: incident.severity,
          location: { lat: incident.location.lat, lon: incident.location.lon },
          description: incident.description,
          mobilityImpact: incident.delayMinutes,
        });
      }

      console.log(`[Traffic] Streamed ${incidents.length} incidents to BigQuery (score: ${mobilityData.trafficScore})`);
    } catch (error) {
      console.error('[Traffic] Error storing to BigQuery:', error);
    }
  }

  /**
   * Trigger alerts for critical traffic conditions
   */
  private async triggerAlerts(
    eventId: string,
    mobilityData: MobilityData,
    incidents: TrafficIncident[]
  ): Promise<void> {
    try {
      const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL');

      await pubSubService.publishMessage('emergency-alerts', {
        eventId,
        type: 'TRAFFIC_CRITICAL',
        severity: 'HIGH',
        source: 'traffic_monitoring',
        incidents: criticalIncidents,
        mobilityData,
        timestamp: new Date().toISOString(),
      });

      io.to(`event:${eventId}`).emit('alert:traffic-critical', {
        severity: 'HIGH',
        message: `${criticalIncidents.length} critical traffic incident(s) detected`,
        trafficScore: mobilityData.trafficScore,
        incidents: criticalIncidents,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('[Traffic] Error triggering alerts:', error);
    }
  }

  /**
   * Get optimal route considering traffic
   */
  async getOptimalRoute(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    departureTime?: Date
  ): Promise<any> {
    try {
      const response = await this.mapsClient.directions({
        params: {
          key: gcpConfig.maps.apiKey,
          origin: { lat: origin.lat, lng: origin.lon },
          destination: { lat: destination.lat, lng: destination.lon },
          mode: 'driving' as any,
          departure_time: departureTime || 'now' as any,
          traffic_model: 'best_guess' as any,
          alternatives: true,
        },
      });

      return response.data.routes;

    } catch (error) {
      console.error('[Traffic] Error getting optimal route:', error);
      throw error;
    }
  }

  /**
   * Get current mobility data for an event
   */
  async getCurrentMobility(eventId: string): Promise<MobilityData | null> {
    // This would query recent data from cache or database
    return null;
  }
}

export const trafficMobilityService = new TrafficMobilityService();
export default trafficMobilityService;
