/**
 * Navigation Service
 * Handles navigation, routing, and wayfinding
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

export interface NavigationRoute {
  id: string;
  from: string;
  to: string;
  distance: number; // meters
  estimatedTime: number; // minutes
  waypoints: Array<{
    lat: number;
    lng: number;
    name: string;
    instruction?: string;
  }>;
  accessible: boolean;
  crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AccessibleRoute extends NavigationRoute {
  features: Array<{
    type: 'ELEVATOR' | 'RAMP' | 'WIDE_PATH' | 'REST_AREA' | 'MEDICAL_STATION';
    location: string;
    coordinates: { lat: number; lng: number };
  }>;
  difficulty: 'EASY' | 'MODERATE' | 'CHALLENGING';
}

export interface EmergencyRoute {
  id: string;
  from: string;
  to: string;
  type: 'EVACUATION' | 'EMERGENCY_EXIT' | 'ASSEMBLY_POINT';
  priority: number;
  distance: number;
  estimatedTime: number;
  waypoints: Array<{
    lat: number;
    lng: number;
    name: string;
  }>;
}

class NavigationService {
  /**
   * Get route between two points
   */
  async getRoute(from: string, to: string, accessible = false) {
    return await apiClient.post<NavigationRoute>(API_ENDPOINTS.navigation.route, {
      from,
      to,
      accessible,
    });
  }

  /**
   * Get accessible route
   */
  async getAccessibleRoute(from: string, to: string) {
    return await apiClient.post<AccessibleRoute>(API_ENDPOINTS.navigation.accessible, {
      from,
      to,
    });
  }

  /**
   * Get emergency evacuation route
   */
  async getEmergencyRoute(from: string) {
    return await apiClient.post<EmergencyRoute>(API_ENDPOINTS.navigation.emergency, {
      from,
    });
  }

  /**
   * Get waypoints for an area
   */
  async getWaypoints(eventId: string) {
    return await apiClient.get(API_ENDPOINTS.navigation.waypoints, { eventId });
  }
}

export const navigationService = new NavigationService();
