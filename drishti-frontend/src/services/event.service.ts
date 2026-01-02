/**
 * Event Service
 * Handles all event-related API calls and real-time updates
 */

import { apiClient } from './api.client';
import { wsService } from './websocket.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Event {
  id: string;
  name: string;
  description: string;
  venue: string;
  location: string;
  startTime: string | Date;
  endTime: string | Date;
  expectedAttendees: number;
  actualAttendees?: number;
  organizerId: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string | Date;
  updatedAt?: string | Date;
  _count?: {
    incidents: number;
    alerts: number;
    predictions: number;
  };
}

export interface EventMetrics {
  currentAttendees: number;
  checkIns: number;
  activeVolunteers: number;
  incidentReports: number;
  crowdDensity: number;
  timestamp: number;
}

export interface CrowdHeatmap {
  zoneId: string;
  zoneName: string;
  density: number; // 0-100
  waitTime: number; // minutes
  coordinates: { x: number; y: number };
}

class EventService {
  /**
   * Get all events with optional filtering
   */
  async getEvents(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return await apiClient.get<Event[]>(API_ENDPOINTS.events.list, params);
  }

  /**
   * Get a single event by ID
   */
  async getEvent(id: string) {
    return await apiClient.get<Event>(API_ENDPOINTS.events.get(id));
  }

  /**
   * Get active events
   */
  async getActiveEvents() {
    return await apiClient.get<Event[]>(API_ENDPOINTS.events.active);
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: Partial<Event>) {
    return await apiClient.post<Event>(API_ENDPOINTS.events.create, eventData);
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: string, eventData: Partial<Event>) {
    return await apiClient.put<Event>(API_ENDPOINTS.events.update(id), eventData);
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string) {
    return await apiClient.delete(API_ENDPOINTS.events.delete(id));
  }

  /**
   * Get real-time metrics for an event
   */
  async getEventMetrics(eventId: string) {
    return await apiClient.get<EventMetrics>(API_ENDPOINTS.events.metrics(eventId));
  }

  /**
   * Get crowd heatmap for an event
   */
  async getEventHeatmap(eventId: string) {
    return await apiClient.get<CrowdHeatmap[]>(API_ENDPOINTS.events.heatmap(eventId));
  }

  /**
   * Subscribe to real-time event updates
   */
  subscribeToEvent(eventId: string, callback: (data: any) => void) {
    wsService.joinEvent(eventId);
    wsService.on('event:updated', callback);
    return () => {
      wsService.off('event:updated', callback);
      wsService.leaveEvent(eventId);
    };
  }

  /**
   * Subscribe to real-time metrics updates
   */
  subscribeToMetrics(eventId: string, callback: (metrics: EventMetrics) => void) {
    wsService.joinEvent(eventId);
    wsService.on('metrics:updated', callback);
    return () => {
      wsService.off('metrics:updated', callback);
    };
  }

  /**
   * Subscribe to real-time heatmap updates
   */
  subscribeToHeatmap(eventId: string, callback: (heatmap: CrowdHeatmap[]) => void) {
    wsService.joinEvent(eventId);
    wsService.on('heatmap:updated', callback);
    return () => {
      wsService.off('heatmap:updated', callback);
    };
  }
}

export const eventService = new EventService();
