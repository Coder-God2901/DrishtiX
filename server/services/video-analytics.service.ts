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
 * Video Analytics Service
 * Real-time video frame analysis for crowd detection and anomaly detection
 * 
 * Features:
 * - People counting and crowd density estimation
 * - Anomaly detection (panic, fire, violence, surge)
 * - Integration with Gemini Vision API for ML-powered detection
 * - OpenCV-based crowd analysis
 * - Real-time alerts and Pub/Sub publishing
 */

import cv from '@u4/opencv4nodejs';
import { yoloVisionService } from './yolo-vision.service';
import { anomalyDetectionService } from './anomaly-detection.service';
import { pubSubService } from './pubsub.service';
// Removed: cloudRunETLService - ETL now handled by Azure Stream Analytics
import { io } from '../index';
import { yoloDetectionService } from './yolo-detection.service';
import { facialRecognitionService } from './facial-recognition.service';
import { objectDetectionService } from './object-detection.service';
import { azureSynapseAnalyticsService } from './azure-synapse-analytics.service';
import { mlModelTrainingService } from './ml-training.service';
import { azureBlobStorageService } from './azure-blob-storage.service';
import { azureConfig } from '../config/azure.config';
import { PassThrough } from 'stream';

export interface FrameAnalysisInput {
  eventId: string;
  cameraId: string;
  timestamp: Date;
  imageData: Buffer; // JPEG encoded frame
  location: { lat: number; lon: number };
  zoneId?: string;
  cameraType?: 'CCTV' | 'DRONE' | 'IP_CAMERA' | 'WEBCAM';
}

export interface FrameAnalysisResult {
  cameraId: string;
  timestamp: Date;
  peopleCount: number;
  crowdDensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  densityValue: number; // 0-1 scale
  anomalies: VideoAnomaly[];
  heatmapData?: HeatmapCell[];
  alerts: Alert[];
  processingTimeMs: number;
  // New advanced features
  yoloDetections?: any;
  faceRecognitions?: any;
  objectDetections?: any;
  vipCount?: number;
  securityCount?: number;
  weaponsDetected?: number;
}

export interface VideoAnomaly {
  type: 'PANIC' | 'FIRE' | 'SMOKE' | 'VIOLENCE' | 'SURGE' | 'FALL' | 'STAGNATION' | 'UNUSUAL_PATTERN';
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location?: { lat?: number; lon?: number; x?: number; y?: number; width?: number; height?: number };
}

export interface HeatmapCell {
  cellId: string;
  x: number;
  y: number;
  count: number;
  density: number;
}

export interface Alert {
  type: 'CROWD_THRESHOLD' | 'ANOMALY_DETECTED' | 'CAMERA_FAILURE' | 'WEAPON_DETECTED' | 'SUSPICIOUS_OBJECT' | 'MISSING_SAFETY_EQUIPMENT' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  suggestedActions: string[];
  location?: { lat: number; lon: number };
  cameraId?: string;
  timestamp?: Date;
  priority?: string;
  requiresImmediateResponse?: boolean;
}

class VideoAnalyticsService {
  private readonly CROWD_THRESHOLDS = {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.85,
    CRITICAL: 0.95,
  };

  private readonly ANOMALY_DETECTION_INTERVAL = 5; // Analyze every 5th frame for anomalies
  private readonly FACIAL_RECOGNITION_INTERVAL = 10; // Face recognition every 10th frame
  private readonly OBJECT_DETECTION_INTERVAL = 5; // Object detection every 5th frame
  private frameCounter: Map<string, number> = new Map();
  private useYOLO: boolean = true; // Use YOLO for better accuracy
  private useFacialRecognition: boolean = true;
  private useObjectDetection: boolean = true;
  private useAnomalyDetectionService: boolean = true; // Use ML-based anomaly detection
  private videoStreams: Map<string, PassThrough> = new Map();

  constructor() {
    console.log('[Video Analytics Service] Initialized');
    this.initializeServices();
  }

  /**
   * Initialize all detection services
   */
  private async initializeServices(): Promise<void> {
    try {
      await yoloDetectionService.initialize();
      await facialRecognitionService.initialize();
      await objectDetectionService.initialize();
      console.log('[Video Analytics] All detection services initialized');
    } catch (error) {
      console.error('[Video Analytics] Error initializing services:', error);
    }
  }

  /**
   * Analyze a single camera frame
   */
  async analyzeFrame(input: FrameAnalysisInput): Promise<FrameAnalysisResult> {
    const startTime = Date.now();

    try {
      // Decode JPEG frame
      const mat = cv.imdecode(input.imageData);

      // Perform crowd detection using YOLO or OpenCV
      let peopleCount = 0;
      let yoloDetections = null;

      if (this.useYOLO) {
        const yoloResult = await yoloDetectionService.detectPeople(input.imageData);
        peopleCount = yoloResult.personCount;
        yoloDetections = yoloResult.detections;
      } else {
        peopleCount = await this.detectPeople(mat);
      }

      // Calculate crowd density
      const densityValue = this.calculateDensity(peopleCount, mat.rows * mat.cols);
      const crowdDensity = this.getDensityCategory(densityValue);

      // Generate heatmap data
      const heatmapData = await this.generateHeatmap(mat, peopleCount);

      // Anomaly detection (every Nth frame to reduce load)
      const frameCount = this.getFrameCount(input.cameraId);
      const anomalies: VideoAnomaly[] = [];

      if (frameCount % this.ANOMALY_DETECTION_INTERVAL === 0) {
        const detectedAnomalies = await this.detectAnomalies(input, mat);
        anomalies.push(...detectedAnomalies);

        // Use anomaly detection service for ML-based pattern analysis
        if (this.useAnomalyDetectionService) {
          const mlAnomalies = await this.detectMLAnomalies(input, peopleCount, densityValue);
          anomalies.push(...mlAnomalies);
        }
      }

      // Facial recognition (every 10th frame)
      let faceRecognitions = null;
      let vipCount = 0;
      let securityCount = 0;

      if (this.useFacialRecognition && frameCount % this.FACIAL_RECOGNITION_INTERVAL === 0) {
        faceRecognitions = await facialRecognitionService.analyzeFaces(
          input.imageData,
          input.eventId,
          input.zoneId
        );
        vipCount = faceRecognitions.vipCount;
        securityCount = faceRecognitions.securityCount;
      }

      // Object detection (weapons, safety equipment)
      let objectDetections = null;
      let weaponsDetected = 0;

      // Object detection check
      if (this.useObjectDetection && frameCount % this.OBJECT_DETECTION_INTERVAL === 0) {
        objectDetections = await objectDetectionService.detectObjects(
          input.imageData,
          input.eventId,
          input.cameraId,
          input.location
        );
        weaponsDetected = objectDetections.weaponDetections.length;
      }

      // Generate alerts (after all detections)
      const alerts = this.generateAlerts(peopleCount, densityValue, crowdDensity, anomalies);

      // Merge object detection alerts if any
      if (objectDetections && objectDetections.alerts) {
        alerts.push(...objectDetections.alerts);
      }

      // Publish to Pub/Sub
      this.publishAnalytics(input, peopleCount, densityValue, anomalies);

      // Send to Cloud Run ETL Worker
      await cloudRunETLService.sendCCTVData(input.eventId, {
        cameraId: input.cameraId,
        location: input.location,
        zoneId: input.zoneId,
        peopleCount,
        densityValue,
        cameraType: input.cameraType || 'CCTV',
        anomalies: anomalies.map(a => a.type),
      });

      // Emit to socket.io for real-time updates
      this.emitToClients(input.eventId, {
        cameraId: input.cameraId,
        peopleCount,
        crowdDensity,
        anomalies,
        alerts,
      });

      const processingTimeMs = Date.now() - startTime;

      // Save to Azure Synapse for analytics
      await this.saveToSynapse(input, {
        peopleCount,
        densityValue,
        anomalies,
        yoloDetections,
        faceRecognitions,
        objectDetections,
      });

      return {
        cameraId: input.cameraId,
        timestamp: input.timestamp,
        peopleCount,
        crowdDensity,
        densityValue,
        anomalies,
        heatmapData,
        alerts,
        processingTimeMs,
        yoloDetections,
        faceRecognitions,
        objectDetections,
        vipCount,
        securityCount,
        weaponsDetected,
      };
    } catch (error) {
      console.error(`[Video Analytics] Error analyzing frame from ${input.cameraId}:`, error);
      throw error;
    }
  }

  /**
   * Detect people in frame using OpenCV
   */
  private async detectPeople(mat: any): Promise<number> {
    try {
      // Convert to grayscale
      const gray = mat.cvtColor(cv.COLOR_BGR2GRAY);

      // Use HOG (Histogram of Oriented Gradients) for people detection
      // Note: This is a simplified implementation. In production, use:
      // - Pre-trained HOG descriptor
      // - YOLO model for better accuracy
      // - Custom ML model trained on event crowds

      // For now, use blob detection as a proxy
      const blur = gray.gaussianBlur(new cv.Size(5, 5), 0);
      const thresh = blur.threshold(127, 255, cv.THRESH_BINARY);

      // Find contours (each contour could represent a person)
      const contours = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      // Filter contours by size (approximate person size)
      const minArea = 500; // Minimum pixels for a person
      const maxArea = 10000; // Maximum pixels for a person

      const peopleContours = contours.filter((contour: any) => {
        const area = contour.area;
        return area >= minArea && area <= maxArea;
      });

      return peopleContours.length;
    } catch (error) {
      console.error('[Video Analytics] Error in people detection:', error);
      return 0;
    }
  }

  /**
   * Calculate crowd density (0-1 scale)
   */
  private calculateDensity(peopleCount: number, frameArea: number): number {
    // Average person occupies ~2000 pixels in a 1920x1080 frame
    const avgPersonArea = 2000;
    const estimatedOccupiedArea = peopleCount * avgPersonArea;
    const density = Math.min(estimatedOccupiedArea / frameArea, 1);
    return Math.round(density * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get density category
   */
  private getDensityCategory(density: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (density >= this.CROWD_THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (density >= this.CROWD_THRESHOLDS.HIGH) return 'HIGH';
    if (density >= this.CROWD_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate heatmap data from frame
   */
  private async generateHeatmap(mat: any, peopleCount: number): Promise<HeatmapCell[]> {
    const cells: HeatmapCell[] = [];
    const gridSize = 10; // 10x10 grid
    const cellWidth = Math.floor(mat.cols / gridSize);
    const cellHeight = Math.floor(mat.rows / gridSize);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Extract region of interest
        const roi = mat.getRegion(
          new cv.Rect(j * cellWidth, i * cellHeight, cellWidth, cellHeight)
        );

        // Calculate density in this cell (simplified)
        const gray = roi.cvtColor(cv.COLOR_BGR2GRAY);
        const mean = gray.mean();
        const density = Math.min(mean / 255, 1);

        cells.push({
          cellId: `r${i}c${j}`,
          x: j,
          y: i,
          count: Math.round(peopleCount * density / gridSize),
          density,
        });
      }
    }

    return cells;
  }

  /**
   * Detect anomalies using ML-based pattern analysis
   */
  private async detectMLAnomalies(
    input: FrameAnalysisInput,
    peopleCount: number,
    densityValue: number
  ): Promise<VideoAnomaly[]> {
    try {
      // Create feature vector for anomaly detection
      const feature = {
        density_norm: densityValue,
        delta_t1: 0, // Would need historical data to calculate delta
        delta_t5: 0, // Would need 5-frame history
        zone_type_enc: [1, 0, 0], // Default zone encoding
        time_enc: {
          sin: Math.sin((new Date().getHours() / 24) * 2 * Math.PI),
          cos: Math.cos((new Date().getHours() / 24) * 2 * Math.PI),
        },
      };

      const mlResult = await anomalyDetectionService.ingest(
        input.eventId,
        input.zoneId || input.cameraId,
        feature
      );

      return mlResult.anomalies.map((anomaly: any) => ({
        type: this.mapMLAnomalyToType(anomaly.tier, anomaly.severity),
        confidence: anomaly.score || 0.8,
        severity: anomaly.severity,
        description: anomaly.reason || `Tier ${anomaly.tier} anomaly detected`,
        location: input.location,
      }));
    } catch (error) {
      console.error('[Video Analytics] Error in ML anomaly detection:', error);
      return [];
    }
  }

  /**
   * Map ML anomaly tier/severity to VideoAnomaly types
   */
  private mapMLAnomalyToType(tier: number, severity: string): VideoAnomaly['type'] {
    if (severity === 'CRITICAL') return 'PANIC';
    if (tier === 1) return 'SURGE';
    if (tier === 2) return 'UNUSUAL_PATTERN';
    if (tier === 3) return 'STAGNATION';
    return 'UNUSUAL_PATTERN';
  }

  /**
   * Detect anomalies using YOLO Vision API
   */
  private async detectAnomalies(
    input: FrameAnalysisInput,
    mat: any
  ): Promise<VideoAnomaly[]> {
    try {
      // Fetch event data for accurate context
      const event = await prisma.event.findUnique({
        where: { id: input.eventId },
        select: { type: true, expectedAttendees: true }
      });

      // Encode frame as base64 for YOLO Vision
      const jpegBuffer = cv.imencode('.jpg', mat);
      const base64Image = jpegBuffer.toString('base64');

      // Call YOLO Vision service
      const visionResult = await yoloVisionService.detectAnomalies({
        eventId: input.eventId,
        imageData: base64Image,
        contextData: {
          eventType: event?.type || 'concert',
          expectedCrowd: event?.expectedAttendees || 10000,
          currentCrowd: 0, // Will be filled by people count
          timeOfDay: new Date().getHours() >= 18 ? 'evening' : 'day',
          location: `${input.location.lat},${input.location.lon}`,
        },
      });

      // Map YOLO Vision anomalies to VideoAnomaly format
      return visionResult.anomalies.map((anomaly) => ({
        type: anomaly.type,
        confidence: anomaly.confidence,
        severity: anomaly.severity,
        description: anomaly.description,
        location: anomaly.location,
      }));
    } catch (error) {
      console.error('[Video Analytics] Error detecting anomalies:', error);
      return [];
    }
  }

  /**
   * Generate alerts based on analysis
   */
  private generateAlerts(
    peopleCount: number,
    density: number,
    crowdDensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    anomalies: VideoAnomaly[]
  ): Alert[] {
    const alerts: Alert[] = [];

    // Crowd threshold alerts
    if (crowdDensity === 'CRITICAL') {
      alerts.push({
        type: 'CROWD_THRESHOLD',
        severity: 'CRITICAL',
        message: `Critical crowd density detected (${Math.round(density * 100)}%)`,
        suggestedActions: [
          'Deploy additional security teams',
          'Open emergency exits',
          'Halt entry at gates',
          'Initiate crowd dispersal protocol',
        ],
      });
    } else if (crowdDensity === 'HIGH') {
      alerts.push({
        type: 'CROWD_THRESHOLD',
        severity: 'HIGH',
        message: `High crowd density detected (${Math.round(density * 100)}%)`,
        suggestedActions: [
          'Monitor closely',
          'Prepare additional staff',
          'Slow entry rate',
        ],
      });
    }

    // Anomaly alerts
    anomalies.forEach((anomaly) => {
      alerts.push({
        type: 'ANOMALY_DETECTED',
        severity: anomaly.severity,
        message: `${anomaly.type} detected: ${anomaly.description}`,
        suggestedActions: this.getSuggestedActions(anomaly.type),
      });
    });

    return alerts;
  }

  /**
   * Get suggested actions for anomaly type
   */
  private getSuggestedActions(anomalyType: string): string[] {
    const actionMap: Record<string, string[]> = {
      PANIC: ['Dispatch security', 'Announce calm instructions', 'Open emergency routes'],
      FIRE: ['Activate fire suppression', 'Evacuate zone', 'Alert fire department'],
      VIOLENCE: ['Dispatch security immediately', 'Isolate area', 'Contact law enforcement'],
      SURGE: ['Control entry flow', 'Deploy barriers', 'Redirect crowd movement'],
      STAGNATION: ['Investigate blockage', 'Open alternate routes', 'Guide crowd movement'],
      UNUSUAL_PATTERN: ['Monitor closely', 'Investigate cause', 'Prepare response teams'],
    };

    return actionMap[anomalyType] || ['Monitor situation', 'Deploy response team'];
  }

  /**
   * Publish analytics to Pub/Sub and BigQuery
   */
  private async publishAnalytics(
    input: FrameAnalysisInput,
    peopleCount: number,
    density: number,
    anomalies: VideoAnomaly[]
  ): Promise<void> {
    // Publish to Pub/Sub for real-time processing
    await pubSubService.publishVideoAnalytics({
      eventId: input.eventId,
      cameraId: input.cameraId,
      timestamp: input.timestamp.toISOString(),
      peopleCount,
      density,
      anomalies: anomalies.map((a) => ({
        type: a.type,
        confidence: a.confidence,
        severity: a.severity,
      })),
      location: input.location,
    });

    // Stream to Azure Synapse for historical analytics
    await azureSynapseAnalyticsService.streamVideoAnalytics({
      eventId: input.eventId,
      cameraId: input.cameraId,
      zoneId: input.zoneId,
      timestamp: input.timestamp,
      peopleCount,
      densityValue: density,
      anomalies: anomalies.map((a) => ({
        type: a.type,
        confidence: a.confidence,
        location: a.location,
      })),
    });
  }

  /**
   * Emit to socket.io clients
   */
  private emitToClients(eventId: string, data: any): void {
    io.to(`event:${eventId}`).emit('video:analytics', data);
  }

  /**
   * Get and increment frame counter
   */
  private getFrameCount(cameraId: string): number {
    const count = (this.frameCounter.get(cameraId) || 0) + 1;
    this.frameCounter.set(cameraId, count);
    return count;
  }

  /**
   * Reset frame counter for camera
   */
  resetFrameCounter(cameraId: string): void {
    this.frameCounter.delete(cameraId);
  }

  /**
   * Stream processed frame to Azure Blob Storage for archival
   */
  private async streamFrameToStorage(
    input: FrameAnalysisInput,
    processedFrame: Buffer,
    analytics: any
  ): Promise<void> {
    try {
      const containerName = process.env.AZURE_VIDEO_CONTAINER || 'video-analytics';
      const blobName = `events/${input.eventId}/cameras/${input.cameraId}/${input.timestamp.getTime()}.jpg`;

      const metadata = {
        eventId: input.eventId,
        cameraId: input.cameraId,
        timestamp: input.timestamp.toISOString(),
        peopleCount: analytics.peopleCount?.toString() || '0',
        density: analytics.densityValue?.toString() || '0',
        anomalies: JSON.stringify(analytics.anomalies?.map((a: any) => a.type) || []),
      };

      await azureBlobStorageService.uploadFile(
        containerName,
        blobName,
        processedFrame,
        {
          contentType: 'image/jpeg',
          metadata,
        }
      );

      console.log(`[Video Analytics] Frame streamed to ${blobName}`);
    } catch (error) {
      console.error('[Video Analytics] Error streaming frame to storage:', error);
    }
  }

  /**
   * Cancel ongoing stream for a camera
   */
  cancelStream(cameraId: string): void {
    const stream = this.videoStreams.get(cameraId);
    if (stream) {
      stream.destroy();
      this.videoStreams.delete(cameraId);
      console.log(`[Video Analytics] Stream cancelled for camera ${cameraId}`);
    }
  }

  /**
   * Save analytics to Azure Synapse
   */
  private async saveToSynapse(input: FrameAnalysisInput, analytics: any): Promise<void> {
    try {
      // Stream processed frame to Azure Blob Storage for video archival
      const processedFrame = cv.imencode('.jpg', await cv.imdecodeAsync(input.imageData));
      await this.streamFrameToStorage(input, processedFrame, analytics);
    } catch (error) {
      console.error('[Video Analytics] Error saving to Synapse:', error);
    }
  }

  /**
   * Get analytics summary for event
   */
  async getEventSummary(eventId: string): Promise<any> {
    return await azureSynapseAnalyticsService.getEventMetrics(eventId);
  }

  /**
   * Get crowd trends
   */
  async getCrowdTrends(
    eventId: string,
    startTime: Date,
    endTime: Date,
    interval: '5min' | '15min' | '1hour' = '15min'
  ): Promise<any> {
    return await azureSynapseAnalyticsService.getCrowdTrends(eventId, startTime, endTime, interval);
  }

  /**
   * Get zone analytics
   */
  async getZoneAnalytics(eventId: string, zoneId?: string): Promise<any> {
    return await azureSynapseAnalyticsService.getZoneAnalytics(eventId, zoneId);
  }

  /**
   * Get predictive insights
   */
  async getPredictiveInsights(eventId: string): Promise<any> {
    return await azureSynapseAnalyticsService.getPredictiveInsights(eventId);
  }

  /**
   * Train custom ML model on event data
   */
  async trainCustomModel(
    modelType: 'crowd_density' | 'anomaly_detection' | 'transfer_learning',
    eventId?: string
  ): Promise<any> {
    const config = {
      modelName: `${modelType}-${Date.now()}`,
      modelType,
      architecture: 'mobilenet' as const,
      inputShape: [224, 224, 3] as [number, number, number],
      numClasses: 4,
      learningRate: 0.001,
      batchSize: 32,
      epochs: 50,
      validationSplit: 0.2,
    };

    return await mlModelTrainingService.trainModel(config, eventId);
  }

  /**
   * Register VIP or security personnel for facial recognition
   */
  async registerPerson(
    personId: string,
    name: string,
    role: 'VIP' | 'SECURITY' | 'STAFF',
    imageData: Buffer
  ): Promise<boolean> {
    return await facialRecognitionService.registerPerson(personId, name, role, imageData);
  }

  /**
   * Toggle advanced features
   */
  setFeatureFlags(flags: {
    useYOLO?: boolean;
    useFacialRecognition?: boolean;
    useObjectDetection?: boolean;
    useAnomalyDetectionService?: boolean;
  }): void {
    if (flags.useYOLO !== undefined) this.useYOLO = flags.useYOLO;
    if (flags.useFacialRecognition !== undefined) this.useFacialRecognition = flags.useFacialRecognition;
    if (flags.useObjectDetection !== undefined) this.useObjectDetection = flags.useObjectDetection;
    if (flags.useAnomalyDetectionService !== undefined) this.useAnomalyDetectionService = flags.useAnomalyDetectionService;
    console.log('[Video Analytics] Feature flags updated:', flags);
  }
}

export const videoAnalyticsService = new VideoAnalyticsService();
export { VideoAnalyticsService };
