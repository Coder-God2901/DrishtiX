/**
 * Simulation Engine Service
 * Hardware-free crowd simulation using Earth Engine and synthetic feeds
 */

import { Storage } from '@google-cloud/storage';
import { gcpConfig } from '../config/gcp.config';

export interface SimulationConfig {
  sceneType: 'concert' | 'marathon' | 'religious' | 'stadium' | 'transport';
  location: { lat: number; lon: number; address: string };
  expectedCrowd: number;
  duration: number; // minutes
  weatherCondition: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface SimulationFrame {
  timestamp: Date;
  frameNumber: number;
  imageData: string; // Base64 or URL
  crowdDensity: number;
  gridData: GridData[];
  metadata: FrameMetadata;
}

export interface GridData {
  gridId: string;
  lat: number;
  lon: number;
  density: number;
  count: number;
}

export interface FrameMetadata {
  crowdBehavior: string;
  movementPattern: string;
  hotspots: number;
  anomalyRisk: number;
}

class SimulationEngineService {
  private storage: Storage;
  private simulationBucket: string;

  constructor() {
    this.storage = new Storage({
      projectId: gcpConfig.projectId,
      keyFilename: gcpConfig.credentials,
    });
    this.simulationBucket = gcpConfig.storage.buckets.simulations;
  }

  /**
   * Generate simulation feed
   */
  async generateSimulation(config: SimulationConfig): Promise<SimulationFrame[]> {
    try {
      const frames: SimulationFrame[] = [];
      const fps = 1; // 1 frame per second
      const totalFrames = config.duration * 60 / fps;

      for (let i = 0; i < totalFrames; i++) {
        const frame = await this.generateFrame(config, i, fps);
        frames.push(frame);
      }

      // Save simulation to storage
      await this.saveSimulation(config, frames);

      return frames;
    } catch (error) {
      console.error('Simulation generation error:', error);
      throw new Error(`Failed to generate simulation: ${error}`);
    }
  }

  /**
   * Generate single simulation frame
   */
  private async generateFrame(
    config: SimulationConfig,
    frameNumber: number,
    fps: number
  ): Promise<SimulationFrame> {
    const timestamp = new Date(Date.now() + frameNumber * 1000 / fps);

    // Simulate crowd density evolution
    const densityPattern = this.simulateDensityPattern(config, frameNumber);

    // Generate grid data
    const gridData = this.generateGridData(config.location, densityPattern);

    // Calculate metadata
    const metadata = this.calculateFrameMetadata(gridData, densityPattern);

    // Generate visual representation (placeholder)
    const imageData = await this.generateVisualFrame(config, gridData);

    return {
      timestamp,
      frameNumber,
      imageData,
      crowdDensity: densityPattern.averageDensity,
      gridData,
      metadata,
    };
  }

  /**
   * Simulate crowd density pattern over time
   */
  private simulateDensityPattern(config: SimulationConfig, frameNumber: number): any {
    const totalFrames = config.duration * 60;
    const progress = frameNumber / totalFrames;

    // Different patterns for different event types
    let densityMultiplier = 1.0;

    switch (config.sceneType) {
      case 'concert':
        // Build up, plateau, then disperse
        if (progress < 0.2) {
          densityMultiplier = progress / 0.2; // Build up
        } else if (progress < 0.8) {
          densityMultiplier = 1.0; // Plateau
        } else {
          densityMultiplier = 1.0 - (progress - 0.8) / 0.2; // Disperse
        }
        break;

      case 'marathon':
        // Wave pattern as runners pass
        densityMultiplier = Math.sin(progress * Math.PI * 4) * 0.3 + 0.7;
        break;

      case 'religious':
        // Gradual build to peak, then slow disperse
        if (progress < 0.5) {
          densityMultiplier = progress / 0.5;
        } else {
          densityMultiplier = 1.0 - (progress - 0.5) / 1.0;
        }
        break;

      case 'stadium':
        // Rapid fill, steady, rapid empty
        if (progress < 0.15) {
          densityMultiplier = progress / 0.15;
        } else if (progress < 0.85) {
          densityMultiplier = 1.0;
        } else {
          densityMultiplier = 1.0 - (progress - 0.85) / 0.15;
        }
        break;

      case 'transport':
        // Periodic waves (every 10-15 min)
        densityMultiplier = Math.sin(progress * Math.PI * 6) * 0.4 + 0.6;
        break;
    }

    // Apply crowd size factor
    const baseDensity = Math.min(config.expectedCrowd / 10000, 1.0);
    const averageDensity = baseDensity * densityMultiplier;

    // Add some randomness
    const noise = (Math.random() - 0.5) * 0.1;

    return {
      averageDensity: Math.max(0, Math.min(1, averageDensity + noise)),
      peakDensity: Math.max(0, Math.min(1, averageDensity * 1.3 + noise)),
      variability: Math.random() * 0.2,
    };
  }

  /**
   * Generate grid-based density data
   */
  private generateGridData(
    center: { lat: number; lon: number },
    pattern: any
  ): GridData[] {
    const gridSize = 0.0005; // ~50m
    const gridRange = 10; // 10x10 grid
    const gridData: GridData[] = [];

    for (let x = -gridRange; x <= gridRange; x++) {
      for (let y = -gridRange; y <= gridRange; y++) {
        const lat = center.lat + x * gridSize;
        const lon = center.lon + y * gridSize;

        // Distance from center
        const distanceFromCenter = Math.sqrt(x * x + y * y);

        // Density decreases with distance (Gaussian distribution)
        const densityFalloff = Math.exp(-(distanceFromCenter * distanceFromCenter) / 50);
        const density = pattern.averageDensity * densityFalloff;

        // Add some randomness
        const noise = (Math.random() - 0.5) * pattern.variability;
        const finalDensity = Math.max(0, Math.min(1, density + noise));

        // Estimate count based on density and grid area
        const gridAreaM2 = 50 * 50; // 50m x 50m
        const count = Math.round(finalDensity * gridAreaM2 / 2); // 2 sq.m per person

        gridData.push({
          gridId: `grid_${x}_${y}`,
          lat,
          lon,
          density: finalDensity,
          count,
        });
      }
    }

    return gridData;
  }

  /**
   * Calculate frame metadata
   */
  private calculateFrameMetadata(gridData: GridData[], pattern: any): FrameMetadata {
    const hotspots = gridData.filter(g => g.density > 0.7).length;
    const avgDensity = gridData.reduce((sum, g) => sum + g.density, 0) / gridData.length;

    let crowdBehavior = 'NORMAL';
    if (avgDensity > 0.8) crowdBehavior = 'CHAOTIC';
    else if (avgDensity > 0.6) crowdBehavior = 'AGITATED';

    let movementPattern = 'FLOWING';
    if (pattern.variability > 0.15) movementPattern = 'SURGING';
    else if (avgDensity > 0.7) movementPattern = 'STAGNANT';

    const anomalyRisk = avgDensity > 0.75 ? 0.7 : avgDensity > 0.5 ? 0.4 : 0.1;

    return {
      crowdBehavior,
      movementPattern,
      hotspots,
      anomalyRisk,
    };
  }

  /**
   * Generate visual frame representation
   */
  private async generateVisualFrame(
    config: SimulationConfig,
    gridData: GridData[]
  ): Promise<string> {
    // In production, this would:
    // 1. Use Earth Engine to get satellite/street view imagery
    // 2. Overlay crowd density heatmap
    // 3. Add synthetic crowd elements
    // 4. Return as base64 image or GCS URL

    // For now, return a data structure that can be visualized
    return `SIMULATION_FRAME:${JSON.stringify({
      sceneType: config.sceneType,
      location: config.location,
      gridData: gridData.slice(0, 100), // Top 100 cells
    })}`;
  }

  /**
   * Save simulation to Cloud Storage
   */
  private async saveSimulation(
    config: SimulationConfig,
    frames: SimulationFrame[]
  ): Promise<void> {
    try {
      const simulationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `${simulationId}.json`;

      const bucket = this.storage.bucket(this.simulationBucket);
      const file = bucket.file(fileName);

      const simulationData = {
        id: simulationId,
        config,
        frames: frames.map(f => ({
          ...f,
          imageData: f.imageData.substring(0, 100) + '...', // Truncate for storage
        })),
        createdAt: new Date().toISOString(),
      };

      await file.save(JSON.stringify(simulationData), {
        contentType: 'application/json',
        metadata: {
          sceneType: config.sceneType,
          duration: config.duration,
        },
      });

      console.log(`Simulation saved: ${simulationId}`);
    } catch (error) {
      console.error('Error saving simulation:', error);
    }
  }

  /**
   * Load simulation from storage
   */
  async loadSimulation(simulationId: string): Promise<any> {
    try {
      const bucket = this.storage.bucket(this.simulationBucket);
      const file = bucket.file(`${simulationId}.json`);

      const [contents] = await file.download();
      return JSON.parse(contents.toString());
    } catch (error) {
      console.error('Error loading simulation:', error);
      throw new Error(`Failed to load simulation: ${error}`);
    }
  }

  /**
   * List available simulations
   */
  async listSimulations(): Promise<any[]> {
    try {
      const bucket = this.storage.bucket(this.simulationBucket);
      const [files] = await bucket.getFiles();

      return files.map(file => ({
        id: file.name.replace('.json', ''),
        name: file.name,
        created: file.metadata.timeCreated,
        size: file.metadata.size,
        metadata: file.metadata.metadata,
      }));
    } catch (error) {
      console.error('Error listing simulations:', error);
      return [];
    }
  }
}

export const simulationEngineService = new SimulationEngineService();
export default simulationEngineService;
