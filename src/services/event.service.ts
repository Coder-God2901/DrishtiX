import { apiClient } from '../lib/api-client';
import { Event } from '../store/useEventStore';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export const eventService = {
  async getEvents(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await apiClient.get<ApiResponse<Event[]>>(
      `/events?${queryParams.toString()}`
    );
    return response.data;
  },

  async getEventById(id: string): Promise<Event> {
    const response = await apiClient.get<ApiResponse<Event>>(`/events/${id}`);
    return response.data;
  },

  async createEvent(event: Partial<Event>): Promise<Event> {
    const response = await apiClient.post<ApiResponse<Event>>('/events', event);
    return response.data;
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const response = await apiClient.put<ApiResponse<Event>>(`/events/${id}`, updates);
    return response.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/events/${id}`);
  },

  async getActiveEvents(): Promise<Event[]> {
    const response = await apiClient.get<ApiResponse<Event[]>>('/events?status=ACTIVE');
    return response.data;
  },

  async getEventStats(id: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/events/${id}/stats`);
    return response.data;
  },
};
