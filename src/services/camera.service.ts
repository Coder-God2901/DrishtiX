import { apiClient } from '@/lib/api-client';

interface CameraConfig {
  cameraId: string;
  eventId: string;
  zoneId?: string;
  location?: { lat: number; lon: number };
  streamUrl?: string;
  rtspUrl?: string;
  enableYOLO?: boolean;
  enableFacialRecognition?: boolean;
  enableObjectDetection?: boolean;
  frameRate?: number;
}

interface CameraStatus {
  cameraId: string;
  isActive: boolean;
  fps: number;
  framesProcessed: number;
  lastFrame?: Date;
  errors: string[];
  peopleCount?: number;
  densityLevel?: string;
  detections?: {
    yolo: number;
    facial: number;
    objects: number;
  };
}

interface CameraFrame {
  cameraId: string;
  timestamp: Date;
  frameUrl: string;
  peopleCount: number;
  densityLevel: string;
  detections: any[];
  heatmap?: any;
}

class CameraService {
  /**
   * Start camera processing
   */
  async startCamera(config: CameraConfig): Promise<{ success: boolean; cameraId: string }> {
    const response = await apiClient.post<{ success: boolean; data: { cameraId: string } }>(
      '/camera/start',
      config
    );
    return { success: true, cameraId: response.data.cameraId };
  }

  /**
   * Stop camera processing
   */
  async stopCamera(cameraId: string): Promise<void> {
    await apiClient.post(`/camera/stop/${cameraId}`);
  }

  /**
   * Get camera status
   */
  async getStatus(cameraId?: string): Promise<CameraStatus | Record<string, CameraStatus>> {
    if (cameraId) {
      const response = await apiClient.get<{ success: boolean; data: CameraStatus }>(
        `/camera/status/${cameraId}`
      );
      return response.data;
    } else {
      const response = await apiClient.get<{ success: boolean; data: Record<string, CameraStatus> }>(
        '/camera/status'
      );
      return response.data;
    }
  }

  /**
   * Get latest frame from camera
   */
  async getLatestFrame(cameraId: string): Promise<CameraFrame | null> {
    const response = await apiClient.get<{ success: boolean; data: CameraFrame | null }>(
      `/camera/frame/${cameraId}`
    );
    return response.data;
  }

  /**
   * Stop all active cameras
   */
  async stopAllCameras(): Promise<void> {
    await apiClient.post('/camera/stop-all');
  }

  /**
   * Get all active cameras for an event
   */
  async getEventCameras(eventId: string): Promise<CameraStatus[]> {
    const response = await apiClient.get<{ success: boolean; data: CameraStatus[] }>(
      `/camera/event/${eventId}`
    );
    return response.data;
  }

  /**
   * Update camera configuration
   */
  async updateCamera(cameraId: string, updates: Partial<CameraConfig>): Promise<CameraStatus> {
    const response = await apiClient.put<{ success: boolean; data: CameraStatus }>(
      `/camera/${cameraId}`,
      updates
    );
    return response.data;
  }
}

export const cameraService = new CameraService();
export type { CameraConfig, CameraStatus, CameraFrame };
