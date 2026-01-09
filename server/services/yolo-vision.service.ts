/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
/**
 * YOLO Vision Service Client - Replaces Gemini Vision
 * Integrates with local YOLO + OpenCV vision service
 * Cost: FREE vs $50-200/month Gemini Vision API
 */

import axios from 'axios';

// Simple logger fallback
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
};

const VISION_SERVICE_URL = process.env.VISION_SERVICE_URL || 'http://vision-service:8001';

// ==================== Types ====================

export enum AnomalyType {
  PANIC = 'PANIC',
  FIRE = 'FIRE',
  SMOKE = 'SMOKE',
  VIOLENCE = 'VIOLENCE',
  SURGE = 'SURGE',
  FALL = 'FALL',
  STAGNATION = 'STAGNATION',
  UNUSUAL_PATTERN = 'UNUSUAL_PATTERN',
}

export enum CrowdBehavior {
  NORMAL = 'NORMAL',
  AGITATED = 'AGITATED',
  PANIC = 'PANIC',
  CHAOTIC = 'CHAOTIC',
}

export enum MovementPattern {
  FLOWING = 'FLOWING',
  STAGNANT = 'STAGNANT',
  SURGING = 'SURGING',
  DISPERSING = 'DISPERSING',
}

export interface Anomaly {
  type: AnomalyType;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  description: string;
  indicators: string[];
  timestamp: string;
}

export interface DetectionMetrics {
  panicLevel: number;
  fireDetected: boolean;
  fireConfidence: number;
  smokeDetected: boolean;
  smokeConfidence: number;
  violenceDetected: boolean;
  violenceConfidence: number;
  surgeDetected: boolean;
  surgeConfidence: number;
  crowdBehavior: CrowdBehavior;
  movementPattern: MovementPattern;
  personCount: number;
  densityScore: number;
}

export interface AnomalyDetectionResult {
  timestamp: string;
  anomalies: Anomaly[];
  overallSeverity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectionMetrics: DetectionMetrics;
  recommendations: string[];
  processingTimeMs: number;
}

export interface VisionInput {
  eventId: string;
  imageData: string; // Base64 encoded
  videoFrames?: string[]; // Array of base64 frames
  contextData?: Record<string, any>;
}

// ==================== Service Class ====================

class YOLOVisionService {
  private readonly serviceUrl: string;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(serviceUrl: string = VISION_SERVICE_URL) {
    this.serviceUrl = serviceUrl;
    this.startHealthCheck();
  }

  /**
   * Detect anomalies using YOLO + OpenCV vision service
   */
  async detectAnomalies(input: VisionInput): Promise<AnomalyDetectionResult> {
    try {
      logger.info(`[YOLO Vision] Analyzing frame for event ${input.eventId}`);

      const response = await axios.post(
        `${this.serviceUrl}/api/detect-anomalies`,
        {
          event_id: input.eventId,
          image_data: input.imageData,
          video_frames: input.videoFrames,
          context_data: input.contextData,
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = this.transformResponse(response.data);

      logger.info(
        `[YOLO Vision] Detected ${result.anomalies.length} anomalies in ${result.processingTimeMs}ms`
      );

      return result;
    } catch (error: any) {
      logger.error('[YOLO Vision] Detection error:', error.message);
      throw new Error(`YOLO Vision service error: ${error.message}`);
    }
  }

  /**
   * Analyze single image (convenience method)
   */
  async analyzeSingleImage(
    eventId: string,
    imageData: string
  ): Promise<AnomalyDetectionResult> {
    return this.detectAnomalies({
      eventId,
      imageData,
    });
  }

  /**
   * Analyze video frames (multi-frame analysis)
   */
  async analyzeVideoFrames(
    eventId: string,
    frames: string[]
  ): Promise<AnomalyDetectionResult[]> {
    const results: AnomalyDetectionResult[] = [];

    for (let i = 0; i < frames.length; i++) {
      const result = await this.detectAnomalies({
        eventId,
        imageData: frames[i],
        videoFrames: frames.slice(Math.max(0, i - 3), i + 1), // Include previous 3 frames for context
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Health check
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.serviceUrl}/health`, {
        timeout: 5000,
      });
      return response.data.status === 'healthy';
    } catch (error) {
      logger.warn('[YOLO Vision] Health check failed');
      return false;
    }
  }

  /**
   * Transform Python response to TypeScript format
   */
  private transformResponse(pythonResponse: any): AnomalyDetectionResult {
    return {
      timestamp: pythonResponse.timestamp,
      anomalies: pythonResponse.anomalies.map((a: any) => ({
        type: a.type as AnomalyType,
        confidence: a.confidence,
        severity: a.severity,
        location: a.location,
        description: a.description,
        indicators: a.indicators,
        timestamp: a.timestamp,
      })),
      overallSeverity: pythonResponse.overall_severity,
      detectionMetrics: {
        panicLevel: pythonResponse.detection_metrics.panic_level,
        fireDetected: pythonResponse.detection_metrics.fire_detected,
        fireConfidence: pythonResponse.detection_metrics.fire_confidence,
        smokeDetected: pythonResponse.detection_metrics.smoke_detected,
        smokeConfidence: pythonResponse.detection_metrics.smoke_confidence,
        violenceDetected: pythonResponse.detection_metrics.violence_detected,
        violenceConfidence: pythonResponse.detection_metrics.violence_confidence,
        surgeDetected: pythonResponse.detection_metrics.surge_detected,
        surgeConfidence: pythonResponse.detection_metrics.surge_confidence,
        crowdBehavior: pythonResponse.detection_metrics.crowd_behavior as CrowdBehavior,
        movementPattern: pythonResponse.detection_metrics.movement_pattern as MovementPattern,
        personCount: pythonResponse.detection_metrics.person_count,
        densityScore: pythonResponse.detection_metrics.density_score,
      },
      recommendations: pythonResponse.recommendations,
      processingTimeMs: pythonResponse.processing_time_ms,
    };
  }

  /**
   * Start periodic health check
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const healthy = await this.checkHealth();
      if (!healthy) {
        logger.warn('[YOLO Vision] Service unhealthy');
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop health check
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Singleton instance
export const yoloVisionService = new YOLOVisionService();

export default yoloVisionService;
