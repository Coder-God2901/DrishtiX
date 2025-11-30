/**
 * Attendee Service
 * Handles attendee-specific API calls for event joining, navigation, SOS, and feedback
 */

import { apiClient } from '@/lib/api-client';

export interface JoinEventRequest {
  joinMethod: 'QR_CODE' | 'EVENT_CODE' | 'BROWSE';
  eventCode?: string;
  qrData?: string;
}

export interface NavigationRequest {
  from: { lat: number; lng: number; zoneId?: string };
  to: { lat: number; lng: number; zoneId?: string };
  avoidCrowds?: boolean;
}

export interface SOSRequest {
  eventId: string;
  issueType: 'MEDICAL' | 'SECURITY' | 'FIRE' | 'CROWD_CRUSH' | 'LOST_PERSON' | 'OTHER';
  description: string;
  location: { lat: number; lng: number; zoneId?: string };
  media?: { type: string; url: string }[];
}

export interface FeedbackRequest {
  overallRating: number;
  safetyRating: number;
  navigationRating: number;
  facilitiesRating: number;
  managementRating: number;
  crowdManagementRating: number;
  alertUsefulnessRating: number;
  comments?: string;
}

class AttendeeService {
  /**
   * Join an event using one of three methods: QR_CODE, EVENT_CODE, or BROWSE
   */
  async joinEvent(eventId: string, request: JoinEventRequest) {
    try {
      return await apiClient.post(`/attendee/events/${eventId}/join`, request);
    } catch (error: any) {
      console.error('Join event error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Check in at an event
   */
  async checkin(eventId: string, location?: { lat: number; lng: number }) {
    try {
      return await apiClient.post(`/attendee/events/${eventId}/checkin`, { location });
    } catch (error: any) {
      console.error('Checkin error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get venue map with crowd heatmap (USP 1: Predictions)
   */
  async getVenueMap(eventId: string) {
    try {
      return await apiClient.get(`/attendee/events/${eventId}/venue-map`);
    } catch (error: any) {
      console.error('Get venue map error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Request navigation with crowd-aware routing (USP 4: Actions)
   */
  async navigate(eventId: string, request: NavigationRequest) {
    try {
      return await apiClient.post(`/attendee/events/${eventId}/navigate`, request);
    } catch (error: any) {
      console.error('Navigation error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Create SOS emergency request (USP 4: Auto-dispatch)
   */
  async createSOS(request: SOSRequest) {
    try {
      return await apiClient.post('/attendee/sos', request);
    } catch (error: any) {
      console.error('Create SOS error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get SOS request status
   */
  async getSOSStatus(sosId: string) {
    try {
      return await apiClient.get(`/attendee/sos/${sosId}`);
    } catch (error: any) {
      console.error('Get SOS status error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Submit event feedback (USP 6: Self-learning system)
   */
  async submitFeedback(eventId: string, feedback: FeedbackRequest) {
    try {
      return await apiClient.post(`/attendee/events/${eventId}/feedback`, feedback);
    } catch (error: any) {
      console.error('Submit feedback error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get my registered events
   */
  async getMyEvents() {
    try {
      return await apiClient.get('/attendee/my-events');
    } catch (error: any) {
      console.error('Get my events error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Search for events (for browse functionality)
   */
  async searchEvents(query?: {
    search?: string;
    category?: string;
    nearby?: boolean;
    featured?: boolean;
    status?: string;
  }) {
    try {
      const params = new URLSearchParams();
      if (query?.search) params.append('search', query.search);
      if (query?.category) params.append('category', query.category);
      if (query?.nearby) params.append('nearby', 'true');
      if (query?.featured) params.append('featured', 'true');
      if (query?.status) params.append('status', query.status);

      return await apiClient.get(`/events?${params.toString()}`);
    } catch (error: any) {
      console.error('Search events error:', error);
      throw error.response?.data || error;
    }
  }
}

export const attendeeService = new AttendeeService();
export default attendeeService;
