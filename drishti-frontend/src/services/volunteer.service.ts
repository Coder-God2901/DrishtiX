/**
 * Volunteer Management Service
 * Connects to: /api/volunteers
 */

import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';

export interface Volunteer {
  id: string;
  userId: string;
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'available' | 'assigned' | 'break' | 'offline' | 'checked-in';
  location?: { lat: number; lng: number };
  assignedTask?: string;
  skills?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: number;
  lastLocationUpdate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VolunteerTask {
  id: string;
  volunteerId: string;
  taskType: string;
  description: string;
  location?: { lat: number; lng: number };
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
}

export interface VolunteerStats {
  total: number;
  available: number;
  assigned: number;
  onBreak: number;
  offline: number;
  checkedIn: number;
}

class VolunteerService {
  /**
   * Get all volunteers for an event
   */
  async getVolunteers(params: { eventId: string }): Promise<{ success: boolean; data?: Volunteer[]; error?: string }> {
    try {
      return await apiClient.get<Volunteer[]>(`/volunteers/event/${params.eventId}`);
    } catch (error: any) {
      console.error('Error fetching volunteers:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single volunteer by ID
   */
  async getVolunteer(id: string): Promise<{ success: boolean; data?: Volunteer; error?: string }> {
    try {
      return await apiClient.get<Volunteer>(`/volunteers/${id}`);
    } catch (error: any) {
      console.error('Error fetching volunteer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new volunteer
   */
  async createVolunteer(data: Partial<Volunteer>): Promise<{ success: boolean; data?: Volunteer; error?: string }> {
    try {
      return await apiClient.post<Volunteer>('/volunteers', data);
    } catch (error: any) {
      console.error('Error creating volunteer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update volunteer details
   */
  async updateVolunteer(id: string, data: Partial<Volunteer>): Promise<{ success: boolean; data?: Volunteer; error?: string }> {
    try {
      return await apiClient.patch<Volunteer>(`/volunteers/${id}`, data);
    } catch (error: any) {
      console.error('Error updating volunteer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a volunteer
   */
  async deleteVolunteer(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await apiClient.delete(`/volunteers/${id}`);
    } catch (error: any) {
      console.error('Error deleting volunteer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign a task to a volunteer
   */
  async assignTask(volunteerId: string, taskData: {
    taskType: string;
    description: string;
    location?: { lat: number; lng: number };
    priority?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post(`/volunteers/${volunteerId}/assign-task`, taskData);
    } catch (error: any) {
      console.error('Error assigning task:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(volunteerId: string, taskId: string, status: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.patch(`/volunteers/${volunteerId}/task/${taskId}`, { status });
    } catch (error: any) {
      console.error('Error updating task status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check in a volunteer
   */
  async checkIn(volunteerId: string, location: { lat: number; lng: number }): Promise<{ success: boolean; data?: Volunteer; error?: string }> {
    try {
      return await apiClient.post<Volunteer>(`/volunteers/${volunteerId}/check-in`, {
        location,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error checking in volunteer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check out a volunteer
   */
  async checkOut(volunteerId: string): Promise<{ success: boolean; data?: Volunteer; error?: string }> {
    try {
      return await apiClient.post<Volunteer>(`/volunteers/${volunteerId}/check-out`, {
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error checking out volunteer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update volunteer location
   */
  async updateLocation(volunteerId: string, location: { lat: number; lng: number }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post(`/volunteers/${volunteerId}/location`, {
        location,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error updating location:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get volunteer statistics for an event
   */
  async getVolunteerStats(eventId: string): Promise<{ success: boolean; data?: VolunteerStats; error?: string }> {
    try {
      return await apiClient.get<VolunteerStats>(`/volunteers/event/${eventId}/stats`);
    } catch (error: any) {
      console.error('Error fetching volunteer stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search volunteers by criteria
   */
  async searchVolunteers(params: {
    eventId: string;
    query?: string;
    status?: string;
    skills?: string[];
  }): Promise<{ success: boolean; data?: Volunteer[]; error?: string }> {
    try {
      return await apiClient.get<Volunteer[]>('/volunteers', params);
    } catch (error: any) {
      console.error('Error searching volunteers:', error);
      return { success: false, error: error.message };
    }
  }
}

export const volunteerService = new VolunteerService();
