import { apiClient } from '@/lib/api-client';

interface SimulationParams {
  eventId: string;
  venueBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  scenario: 'NORMAL' | 'SURGE' | 'BOTTLENECK' | 'EVACUATION';
  duration: number; // minutes
  interval: number; // seconds
  baseAttendees: number;
}

interface Simulation {
  id: string;
  eventId: string;
  scenario: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  currentFrame: number;
  totalFrames: number;
  startTime: Date;
  endTime?: Date;
  generatedData: {
    totalFrames: number;
    totalPeople: number;
    avgDensity: number;
    peakDensity: number;
    anomaliesDetected: number;
  };
}

interface SimulationFrame {
  timestamp: Date;
  gridCells: Array<{
    gridId: string;
    lat: number;
    lon: number;
    density: number;
    count: number;
  }>;
  totalCount: number;
  avgDensity: number;
}

class SimulationService {
  /**
   * Generate synthetic crowd data simulation
   */
  async generateSimulation(params: SimulationParams): Promise<Simulation> {
    const response = await apiClient.post<{ success: boolean; data: Simulation }>(
      '/simulation/generate',
      params
    );
    return response.data;
  }

  /**
   * Get all simulations
   */
  async getSimulations(eventId?: string): Promise<Simulation[]> {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);

    const response = await apiClient.get<{ success: boolean; data: Simulation[] }>(
      `/simulation/list?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get simulation by ID
   */
  async getSimulation(id: string): Promise<Simulation> {
    const response = await apiClient.get<{ success: boolean; data: Simulation }>(
      `/simulation/${id}`
    );
    return response.data;
  }

  /**
   * Get simulation frames
   */
  async getSimulationFrames(id: string, limit?: number): Promise<SimulationFrame[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));

    const response = await apiClient.get<{ success: boolean; data: SimulationFrame[] }>(
      `/simulation/${id}/frames?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Stop running simulation
   */
  async stopSimulation(id: string): Promise<Simulation> {
    const response = await apiClient.post<{ success: boolean; data: Simulation }>(
      `/simulation/${id}/stop`
    );
    return response.data;
  }

  /**
   * Delete simulation
   */
  async deleteSimulation(id: string): Promise<void> {
    await apiClient.delete(`/simulation/${id}`);
  }

  /**
   * Export simulation data
   */
  async exportSimulation(id: string, format: 'JSON' | 'CSV' = 'JSON'): Promise<Blob> {
    const response = await apiClient.get(`/simulation/${id}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }
}

export const simulationService = new SimulationService();
export type { SimulationParams, Simulation, SimulationFrame };
