/**
 * Camera Service
 * Connects to: /api/cameras
 */

import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';

export interface Camera {
  id: string;
  cameraId: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PROCESSING';
  streamUrl: string;
  location: { lat: number; lng: number };
  eventId: string;
  analytics?: CameraAnalytics;
  zone?: string;
  resolution?: string;
  fps?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CameraAnalytics {
  peopleCount: number;
  density: number;
  crowdFlow: number;
  anomalies: CameraAnomaly[];
  heatmap?: any;
  lastUpdate: string;
  processingTime?: number;
}

export interface CameraAnomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: { x: number; y: number };
  confidence: number;
  timestamp: string;
}

export interface CameraConfig {
  cameraId: string;
  streamUrl: string;
  eventId: string;
  zone?: string;
  detectionType?: 'yolo' | 'gemini' | 'opencv';
  fps?: number;
  enableAnalytics?: boolean;
}

export interface CameraStatus {
  cameraId: string;
  status: string;
  framesProcessed: number;
  fps: number;
  lastFrameTime: string;
  analytics?: CameraAnalytics;
}

class CameraService {
  /**
   * Get all cameras for an event
   */
  async getCameras(eventId: string): Promise<{ success: boolean; data?: Camera[]; error?: string }> {
    try {
      return await apiClient.get<Camera[]>('/cameras', { eventId });
    } catch (error: any) {
      console.error('Error fetching cameras:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single camera by ID
   */
  async getCamera(cameraId: string): Promise<{ success: boolean; data?: Camera; error?: string }> {
    try {
      return await apiClient.get<Camera>(`/cameras/${cameraId}`);
    } catch (error: any) {
      console.error('Error fetching camera:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get camera status
   */
  async getCameraStatus(cameraId: string): Promise<{ success: boolean; data?: CameraStatus; error?: string }> {
    try {
      return await apiClient.get<CameraStatus>(`/cameras/status/${cameraId}`);
    } catch (error: any) {
      console.error('Error fetching camera status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all camera statuses
   */
  async getAllCameraStatuses(): Promise<{ success: boolean; data?: CameraStatus[]; error?: string }> {
    try {
      return await apiClient.get<CameraStatus[]>('/cameras/status');
    } catch (error: any) {
      console.error('Error fetching camera statuses:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start a camera stream
   */
  async startCamera(config: CameraConfig): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post('/cameras/start', config);
    } catch (error: any) {
      console.error('Error starting camera:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop a camera stream
   */
  async stopCamera(cameraId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post(`/cameras/stop/${cameraId}`, {});
    } catch (error: any) {
      console.error('Error stopping camera:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get camera analytics
   */
  async getCameraAnalytics(cameraId: string): Promise<{ success: boolean; data?: CameraAnalytics; error?: string }> {
    try {
      return await apiClient.get<CameraAnalytics>(`/cameras/${cameraId}/analytics`);
    } catch (error: any) {
      console.error('Error fetching camera analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get stream URL for a camera
   */
  getStreamUrl(cameraId: string): string {
    return `${API_CONFIG.baseURL}/cameras/${cameraId}/stream`;
  }

  /**
   * Get thumbnail URL for a camera
   */
  getThumbnailUrl(cameraId: string): string {
    return `${API_CONFIG.baseURL}/cameras/${cameraId}/thumbnail`;
  }

  /**
   * Trigger manual analysis on a camera
   */
  async triggerAnalysis(cameraId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await apiClient.post(`/cameras/${cameraId}/analyze`, {});
    } catch (error: any) {
      console.error('Error triggering analysis:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update camera configuration
   */
  async updateCamera(cameraId: string, updates: Partial<CameraConfig>): Promise<{ success: boolean; data?: Camera; error?: string }> {
    try {
      return await apiClient.patch<Camera>(`/cameras/${cameraId}`, updates);
    } catch (error: any) {
      console.error('Error updating camera:', error);
      return { success: false, error: error.message };
    }
  }
}

export const cameraService = new CameraService();
