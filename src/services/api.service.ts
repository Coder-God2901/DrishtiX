/**
 * Comprehensive API Service
 * High-level wrapper around API client with typed responses
 */

import { apiClient } from '@/lib/api-client';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export const apiService = {
  // ==================== AUTH ====================
  auth: {
    login: async (email: string, password: string) =>
      apiClient.post<ApiResponse>('/auth/login', { email, password }),

    register: async (data: { name: string; email: string; password: string; role?: string }) =>
      apiClient.post<ApiResponse>('/auth/register', data),

    logout: async () =>
      apiClient.post<ApiResponse>('/auth/logout'),

    refreshToken: async (refreshToken: string) =>
      apiClient.post<ApiResponse>('/auth/refresh', { refreshToken }),

    me: async () =>
      apiClient.get<ApiResponse>('/auth/me'),

    verifyMFA: async (code: string) =>
      apiClient.post<ApiResponse>('/auth/verify-mfa', { code }),
  },

  // ==================== EVENTS ====================
  events: {
    getAll: async (params?: Record<string, any>) =>
      apiClient.get<ApiResponse>('/events', params ? { params } : undefined),

    getById: async (id: string) =>
      apiClient.get<ApiResponse>(`/events/${id}`),

    create: async (data: any) =>
      apiClient.post<ApiResponse>('/events', data),

    update: async (id: string, data: any) =>
      apiClient.put<ApiResponse>(`/events/${id}`, data),

    delete: async (id: string) =>
      apiClient.delete<ApiResponse>(`/events/${id}`),
  },

  // ==================== PREDICTIONS ====================
  predictions: {
    getAll: async (eventId: string, params?: Record<string, any>) =>
      apiClient.get<ApiResponse>('/predictions', { params: { eventId, ...(params || {}) } }),

    getByEvent: async (eventId: string) =>
      apiClient.get<ApiResponse>('/predictions', { params: { eventId } }),

    getLatest: async (eventId: string) =>
      apiClient.get<ApiResponse>('/predictions/latest', { params: { eventId } }),

    getHotspots: async (id: string) =>
      apiClient.get<ApiResponse>(`/predictions/${id}/hotspots`),

    create: async (data: any) =>
      apiClient.post<ApiResponse>('/predictions', data),
  },

  // ==================== INCIDENTS ====================
  incidents: {
    getAll: async (params?: Record<string, any>) =>
      apiClient.get<ApiResponse>('/incidents', params ? { params } : undefined),

    getByEvent: async (eventId: string) =>
      apiClient.get<ApiResponse>('/incidents', { params: { eventId } }),

    getById: async (id: string) =>
      apiClient.get<ApiResponse>(`/incidents/${id}`),

    create: async (data: any) =>
      apiClient.post<ApiResponse>('/incidents', data),

    update: async (id: string, data: any) =>
      apiClient.put<ApiResponse>(`/incidents/${id}`, data),

    resolve: async (id: string, data: any) =>
      apiClient.post<ApiResponse>(`/incidents/${id}/resolve`, data),

    delete: async (id: string) =>
      apiClient.delete<ApiResponse>(`/incidents/${id}`),
  },

  // ==================== ALERTS ====================
  alerts: {
    getAll: async (params?: Record<string, any>) =>
      apiClient.get<ApiResponse>('/alerts', params ? { params } : undefined),

    getByEvent: async (eventId: string) =>
      apiClient.get<ApiResponse>('/alerts', { params: { eventId } }),

    create: async (data: any) =>
      apiClient.post<ApiResponse>('/alerts', data),

    dismiss: async (id: string, data: any) =>
      apiClient.post<ApiResponse>(`/alerts/${id}/dismiss`, data),
  },

  // ==================== RESPONDERS ====================
  responders: {
    getAll: async (params?: Record<string, any>) =>
      apiClient.get<ApiResponse>('/responders', params ? { params } : undefined),

    getById: async (id: string) =>
      apiClient.get<ApiResponse>(`/responders/${id}`),

    create: async (data: any) =>
      apiClient.post<ApiResponse>('/responders', data),

    update: async (id: string, data: any) =>
      apiClient.put<ApiResponse>(`/responders/${id}`, data),

    updateLocation: async (id: string, location: any) =>
      apiClient.post<ApiResponse>(`/responders/${id}/location`, { location }),
  },

  // ==================== ATTENDEE ====================
  attendee: {
    joinEvent: async (eventId: string, data: any) =>
      apiClient.post<ApiResponse>(`/attendee/events/${eventId}/join`, data),

    checkIn: async (eventId: string, data: any) =>
      apiClient.post<ApiResponse>(`/attendee/events/${eventId}/checkin`, data),

    getVenueMap: async (eventId: string) =>
      apiClient.get<ApiResponse>(`/attendee/events/${eventId}/venue-map`),

    navigate: async (eventId: string, data: any) =>
      apiClient.post<ApiResponse>(`/attendee/events/${eventId}/navigate`, data),

    createSOS: async (data: any) =>
      apiClient.post<ApiResponse>('/attendee/sos', data),

    getSOSStatus: async (sosId: string) =>
      apiClient.get<ApiResponse>(`/attendee/sos/${sosId}`),

    submitFeedback: async (eventId: string, data: any) =>
      apiClient.post<ApiResponse>(`/attendee/events/${eventId}/feedback`, data),

    getMyEvents: async () =>
      apiClient.get<ApiResponse>('/attendee/my-events'),

    getReports: async (params?: Record<string, any>) =>
      apiClient.get<ApiResponse>('/attendee/reports', params ? { params } : undefined),

    createReport: async (data: any) =>
      apiClient.post<ApiResponse>('/attendee/reports', data),

    validateReport: async (id: string, data: any) =>
      apiClient.post<ApiResponse>(`/attendee/reports/${id}/validate`, data),
  },

  // ==================== GCP / BIGQUERY ====================
  gcp: {
    bigquery: {
      predictions: async (params: Record<string, any>) =>
        apiClient.get<ApiResponse>('/bigquery/predictions', { params }),

      incidents: async (params: Record<string, any>) =>
        apiClient.get<ApiResponse>('/bigquery/incidents', { params }),

      crowdDensity: async (params: Record<string, any>) =>
        apiClient.get<ApiResponse>('/bigquery/crowd-density', { params }),

      anomalyPatterns: async (params: Record<string, any>) =>
        apiClient.get<ApiResponse>('/bigquery/anomaly-patterns', { params }),

      eventMetrics: async (params: Record<string, any>) =>
        apiClient.get<ApiResponse>('/bigquery/event-metrics', { params }),

      zoneAnalytics: async (params: Record<string, any>) =>
        apiClient.get<ApiResponse>('/bigquery/zone-analytics', { params }),

      weatherCorrelation: async (params: Record<string, any>) =>
        apiClient.get<ApiResponse>('/bigquery/weather-correlation', { params }),

      health: async () =>
        apiClient.get<ApiResponse>('/bigquery/health'),
    },

    vertexAI: {
      predict: async (data: any) =>
        apiClient.post<ApiResponse>('/gcp/vertex-ai/predict', data),

      status: async () =>
        apiClient.get<ApiResponse>('/gcp/vertex-ai/status'),
    },

    pubsub: {
      publish: async (topic: string, data: any) =>
        apiClient.post<ApiResponse>('/gcp/pubsub/publish', { topic, data }),
    },
  },

  // ==================== CAMERAS ====================
  cameras: {
    getAll: async (params?: Record<string, any>) =>
      apiClient.get<ApiResponse>('/cameras', params ? { params } : undefined),

    getById: async (id: string) =>
      apiClient.get<ApiResponse>(`/cameras/${id}`),

    getAnalytics: async (id: string, params?: Record<string, any>) =>
      apiClient.get<ApiResponse>(`/cameras/${id}/analytics`, params ? { params } : undefined),
  },

  // ==================== CROWD DENSITY ====================
  crowdDensity: {
    getAll: async (params?: Record<string, any>) =>
      apiClient.get<ApiResponse>('/crowd-density', params ? { params } : undefined),

    getLatest: async (eventId: string) =>
      apiClient.get<ApiResponse>('/crowd-density/latest', { params: { eventId } }),
  },

  // ==================== VENUE ====================
  venue: {
    getLayout: async (eventId: string) =>
      apiClient.get<ApiResponse>(`/venue/${eventId}/layout`),

    updateLayout: async (eventId: string, data: any) =>
      apiClient.put<ApiResponse>(`/venue/${eventId}/layout`, data),

    getZones: async (eventId: string) =>
      apiClient.get<ApiResponse>(`/venue/${eventId}/zones`),
  },

  // ==================== ATTENDEE REPORTS ====================
  attendeeReports: {
    getAll: async (params?: Record<string, any>) =>
      apiClient.get<ApiResponse>('/attendee-reports', params ? { params } : undefined),

    getByEvent: async (eventId: string) =>
      apiClient.get<ApiResponse>(`/events/${eventId}/reports`),

    getById: async (id: string) =>
      apiClient.get<ApiResponse>(`/attendee-reports/${id}`),

    create: async (data: any) =>
      apiClient.post<ApiResponse>('/attendee-reports', data),

    validate: async (reportId: string, validation: any) =>
      apiClient.post<ApiResponse>(`/attendee-reports/${reportId}/validate`, validation),

    getValidations: async (reportId: string) =>
      apiClient.get<ApiResponse>(`/attendee-reports/${reportId}/validations`),

    updateStatus: async (reportId: string, status: string) =>
      apiClient.patch<ApiResponse>(`/attendee-reports/${reportId}/status`, { status }),
  },
};

export default apiService;
