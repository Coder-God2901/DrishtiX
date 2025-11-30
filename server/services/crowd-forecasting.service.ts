import fs from 'fs';
import path from 'path';
import { forecastConfig } from '../config/forecast.config';
import { io } from '../index';
import { localMLService } from './local-ml.service';

interface DensityFrame {
  width: number;
  height: number;
  data: number[][]; // normalized density values 0-1
  timestamp: string;
}

interface PredictionResult {
  predictedFrame: DensityFrame;
  confidence: number;
  modelUsed: string;
  processingTime: number;
}

type Mode = string;

export class CrowdForecastingEngine {
  private activeMode: Mode;
  private frameBuffer: DensityFrame[] = [];
  private maxBuffer: number;
  private loadedModels: Record<Mode, boolean> = {};
  private pythonServiceEndpoint: string;
  private useRemoteInference: boolean;

  constructor() {
    this.activeMode = forecastConfig.defaultMode;
    this.maxBuffer = forecastConfig.bufferSize;
    this.pythonServiceEndpoint = process.env.CONVLSTM_SERVICE_ENDPOINT || 'http://localhost:5000';
    this.useRemoteInference = process.env.CONVLSTM_USE_REMOTE === 'true';
  }

  /**
   * Set event mode (SPORTS, CONCERT, GENERAL, ENTRY_EXIT)
   * Switches the active ConvLSTM model and clears buffer
   */
  setMode(mode: Mode) {
    if (mode === this.activeMode) return;
    if (!forecastConfig.allowedModes.includes(mode)) {
      throw new Error(`Mode ${mode} not allowed. Allowed modes: ${forecastConfig.allowedModes.join(', ')}`);
    }

    console.log(`[CrowdForecast] Switching mode: ${this.activeMode} -> ${mode}`);

    this.activeMode = mode;
    this.frameBuffer = []; // Clear buffer on switch (cold start)
    this.ensureModelLoaded(mode);

    // Broadcast mode change to frontend
    io.emit('forecast:mode-changed', {
      newMode: mode,
      previousMode: this.activeMode,
      bufferCleared: true,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Ensure model weights are loaded (lazy loading strategy)
   */
  ensureModelLoaded(mode: Mode) {
    if (this.loadedModels[mode]) return;

    const weightsFile = path.join(forecastConfig.registryPath, `${mode.toLowerCase()}_specific.h5`);

    if (this.useRemoteInference) {
      // Remote Python service handles model loading
      this.loadedModels[mode] = true;
      console.log(`[CrowdForecast] Using remote inference for mode: ${mode}`);
      return;
    }

    // Local file check (for TensorFlow.js or similar)
    if (!fs.existsSync(weightsFile)) {
      console.warn(`[CrowdForecast] Model file not found: ${weightsFile}, falling back to GENERAL`);
      this.loadedModels[mode] = false;
      return;
    }

    this.loadedModels[mode] = true;
    console.log(`[CrowdForecast] Model loaded: ${weightsFile}`);
  }

  /**
   * Ingest a new density frame (converted from RGB by CSRNet)
   */
  ingestFrame(rawFrame: number[][], eventId?: string) {
    const frame: DensityFrame = {
      width: rawFrame[0]?.length || 0,
      height: rawFrame.length,
      data: rawFrame,
      timestamp: new Date().toISOString(),
    };

    this.frameBuffer.push(frame);

    // Maintain buffer size
    if (this.frameBuffer.length > this.maxBuffer) {
      this.frameBuffer.shift();
    }

    // Broadcast buffer status
    if (eventId) {
      io.to(`forecast:${eventId}`).emit('forecast:buffer-updated', {
        bufferLength: this.frameBuffer.length,
        required: this.maxBuffer,
        ready: this.frameBuffer.length >= this.maxBuffer,
      });
    }
  }

  /**
   * Get current status
   */
  status() {
    return {
      mode: this.activeMode,
      bufferLength: this.frameBuffer.length,
      ready: this.frameBuffer.length >= this.maxBuffer,
      allowedModes: forecastConfig.allowedModes,
      coldStart: this.frameBuffer.length < this.maxBuffer,
      remainingFrames: Math.max(0, this.maxBuffer - this.frameBuffer.length),
    };
  }

  /**
   * Predict next density frame using ConvLSTM
   */
  async predictNext(eventId?: string): Promise<PredictionResult | 'CALIBRATING'> {
    // Check if buffer is ready
    if (this.frameBuffer.length < this.maxBuffer) {
      return 'CALIBRATING';
    }

    const startTime = Date.now();

    try {
      if (this.useRemoteInference) {
        // Call Python microservice
        const prediction = await this.callRemoteInference();
        const processingTime = Date.now() - startTime;

        // Broadcast prediction to frontend
        if (eventId) {
          io.to(`forecast:${eventId}`).emit('forecast:prediction', {
            prediction: prediction.predictedFrame,
            confidence: prediction.confidence,
            modelUsed: this.activeMode,
            processingTime,
            timestamp: new Date().toISOString(),
          });
        }

        return {
          ...prediction,
          processingTime,
        };
      } else {
        // Fallback: Simple synthetic prediction
        const prediction = this.syntheticPrediction();
        const processingTime = Date.now() - startTime;

        return {
          predictedFrame: prediction,
          confidence: 0.65, // Lower confidence for synthetic
          modelUsed: `${this.activeMode}_SYNTHETIC`,
          processingTime,
        };
      }
    } catch (error) {
      console.error('[CrowdForecast] Prediction error:', error);

      // Fallback to synthetic on error
      const prediction = this.syntheticPrediction();
      return {
        predictedFrame: prediction,
        confidence: 0.5,
        modelUsed: `${this.activeMode}_FALLBACK`,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Call local ML service for ConvLSTM inference (replaces Vertex AI)
   */
  private async callRemoteInference(): Promise<PredictionResult> {
    try {
      // Call local ML Docker service instead of Vertex AI
      const result = await localMLService.forecastCrowdDensity({
        frames: this.frameBuffer,
        mode: this.activeMode,
        forecast_horizon_minutes: 15
      });

      return {
        predictedFrame: result.predicted_frames[0], // Use first predicted frame
        confidence: result.confidence,
        modelUsed: result.model_used,
        processingTime: result.processing_time_ms,
      };
    } catch (error: any) {
      console.error('[CrowdForecast] Local ML service error:', error.message);
      throw error;
    }
  }

  /**
   * Synthetic prediction (fallback when no model available)
   * Duplicates last frame with slight noise
   */
  private syntheticPrediction(): DensityFrame {
    const last = this.frameBuffer[this.frameBuffer.length - 1];

    // Add small random noise to simulate prediction
    const noisy = last.data.map((row) =>
      row.map((v) => Math.min(1, Math.max(0, v + (Math.random() - 0.5) * 0.05)))
    );

    return {
      width: last.width,
      height: last.height,
      data: noisy,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Convert density frame to heatmap RGB values
   * Implements JET colormap
   */
  convertToHeatmap(
    frame: DensityFrame,
    colormap: 'JET' | 'VIRIDIS' = 'JET'
  ): {
    width: number;
    height: number;
    data: number[][][]; // [y][x][rgb]
  } {
    const { width, height, data } = frame;
    const rgb: number[][][] = [];

    for (let y = 0; y < height; y++) {
      rgb[y] = [];
      for (let x = 0; x < width; x++) {
        const density = data[y][x];
        const color = this.getJetColor(density);
        rgb[y][x] = [color.r, color.g, color.b];
      }
    }

    return { width, height, data: rgb };
  }

  /**
   * JET colormap: Blue -> Cyan -> Yellow -> Red
   */
  private getJetColor(value: number): { r: number; g: number; b: number } {
    value = Math.max(0, Math.min(1, value)); // Clamp 0-1

    if (value < 0.25) {
      // Blue -> Cyan
      const t = value / 0.25;
      return { r: 0, g: Math.round(t * 255), b: 255 };
    } else if (value < 0.5) {
      // Cyan -> Green
      const t = (value - 0.25) / 0.25;
      return { r: 0, g: 255, b: Math.round((1 - t) * 255) };
    } else if (value < 0.75) {
      // Green -> Yellow
      const t = (value - 0.5) / 0.25;
      return { r: Math.round(t * 255), g: 255, b: 0 };
    } else {
      // Yellow -> Red
      const t = (value - 0.75) / 0.25;
      return { r: 255, g: Math.round((1 - t) * 255), b: 0 };
    }
  }

  /**
   * Reset the forecasting engine
   */
  reset() {
    this.frameBuffer = [];
    this.activeMode = forecastConfig.defaultMode;
    console.log('[CrowdForecast] Engine reset');
  }
}

export const crowdForecastingEngine = new CrowdForecastingEngine();
