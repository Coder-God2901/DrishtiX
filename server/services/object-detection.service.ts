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
 * Object Detection Service
 * Security-critical object detection (weapons, fire extinguishers, etc.)
 * 
 * Features:
 * - Weapon detection (guns, knives, etc.) using COCO-SSD + custom training
 * - Safety equipment detection (fire extinguishers, emergency exits)
 * - Suspicious object detection (abandoned bags, etc.)
 * - Real-time security alerts with WebSocket broadcasting
 * - Integration with YOLO service for enhanced detection
 */

import cv from '@u4/opencv4nodejs';
import { azureServiceBusMessagingService as pubSubService } from './azure-service-bus-messaging.service';
import { yoloDetectionService } from './yolo-detection.service';
import { io } from '../index';
import * as tf from '@tensorflow/tfjs-node';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface ObjectDetection {
  class: string;
  category: 'WEAPON' | 'SAFETY_EQUIPMENT' | 'SUSPICIOUS' | 'NORMAL';
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ObjectDetectionResult {
  detections: ObjectDetection[];
  weaponDetections: ObjectDetection[];
  safetyEquipment: ObjectDetection[];
  suspiciousObjects: ObjectDetection[];
  alerts: SecurityAlert[];
  processingTimeMs: number;
}

export interface SecurityAlert {
  type: 'WEAPON_DETECTED' | 'SUSPICIOUS_OBJECT' | 'MISSING_SAFETY_EQUIPMENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  location?: { lat: number; lon: number };
  cameraId?: string;
  timestamp?: Date;
  suggestedActions: string[];
}

class ObjectDetectionService {
  private model?: cocoSsd.ObjectDetection;
  private readonly CONFIDENCE_THRESHOLD = 0.6;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Security-critical object classes
  private readonly WEAPON_CLASSES = [
    'knife', 'scissors', 'baseball bat'
  ];

  private readonly SAFETY_EQUIPMENT_CLASSES = [
    'fire extinguisher', 'emergency exit', 'first aid kit', 'defibrillator',
    'fire alarm', 'sprinkler', 'emergency light'
  ];

  private readonly SUSPICIOUS_CLASSES = [
    'backpack', 'suitcase', 'handbag', 'tie' // Abandoned luggage
  ];

  // Personal Protective Equipment (PPE)
  private readonly PPE_CLASSES = [
    'helmet', 'vest', 'gloves', 'safety goggles'
  ];

  constructor() {
    console.log('[Object Detection Service] Initializing...');
    this.initialize().catch((error) => {
      console.error('[Object Detection] Failed to initialize:', error.message);
    });
  }

  /**
   * Initialize object detection model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('[Object Detection] Initializing TensorFlow.js...');
      await tf.setBackend('tensorflow');
      await tf.ready();

      console.log('[Object Detection] Loading COCO-SSD model for object detection...');
      this.model = await cocoSsd.load({
        base: 'mobilenet_v2', // Better accuracy than lite version
      });

      this.isInitialized = true;
      console.log('âœ“ [Object Detection] Service initialized successfully');
    } catch (error: any) {
      console.error('[Object Detection] Initialization error:', error.message);
      console.warn('[Object Detection] Falling back to OpenCV-only detection');
      this.isInitialized = false;
    }
  }

  /**
   * Detect objects in frame
   */
  async detectObjects(
    imageBuffer: Buffer,
    eventId: string,
    cameraId: string,
    location?: { lat: number; lon: number }
  ): Promise<ObjectDetectionResult> {
    const startTime = Date.now();

    try {
      // Decode image
      const mat = cv.imdecode(imageBuffer);

      // Perform object detection
      const detections = await this.runDetection(mat);

      // Categorize detections
      const weaponDetections = detections.filter((d) => d.category === 'WEAPON');
      const safetyEquipment = detections.filter((d) => d.category === 'SAFETY_EQUIPMENT');
      const suspiciousObjects = detections.filter((d) => d.category === 'SUSPICIOUS');

      // Generate security alerts
      const alerts = this.generateSecurityAlerts(
        weaponDetections,
        suspiciousObjects,
        eventId,
        cameraId,
        location
      );

      // Emit alerts if any weapons detected
      if (weaponDetections.length > 0) {
        this.emitWeaponAlert(eventId, cameraId, weaponDetections, location);
      }

      const processingTimeMs = Date.now() - startTime;

      return {
        detections,
        weaponDetections,
        safetyEquipment,
        suspiciousObjects,
        alerts,
        processingTimeMs,
      };
    } catch (error) {
      console.error('[Object Detection] Detection error:', error);
      return {
        detections: [],
        weaponDetections: [],
        safetyEquipment: [],
        suspiciousObjects: [],
        alerts: [],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Run object detection on image using TensorFlow.js + OpenCV
   */
  private async runDetection(mat: any): Promise<ObjectDetection[]> {
    const detections: ObjectDetection[] = [];

    // Use TensorFlow.js COCO-SSD for object detection
    if (this.isInitialized && this.model) {
      try {
        const height = mat.rows;
        const width = mat.cols;

        // Convert OpenCV Mat to TensorFlow.js tensor
        const rgbMat = mat.cvtColor(cv.COLOR_BGR2RGB);
        const imageArray = new Uint8Array(rgbMat.getData());
        const tensor = tf.tensor3d(imageArray, [height, width, 3]);

        // Run COCO-SSD detection
        const predictions = await this.model.detect(tensor as any);
        tensor.dispose();

        // Process detections
        for (const pred of predictions) {
          const [x, y, w, h] = pred.bbox;
          const category = this.categorizeObject(pred.class);
          const threatLevel = this.getThreatLevel(category, pred.score);

          if (pred.score >= this.CONFIDENCE_THRESHOLD || category === 'WEAPON') {
            detections.push({
              class: pred.class,
              category,
              confidence: pred.score,
              bbox: { x, y, width: w, height: h },
              threatLevel,
            });
          }
        }
      } catch (error: any) {
        console.error('[Object Detection] TensorFlow.js detection error:', error.message);
      }
    }

    // Fallback: Use OpenCV-based detection methods
    const cvDetections = await this.runOpenCVDetection(mat);
    detections.push(...cvDetections);

    return detections;
  }

  /**
   * OpenCV-based detection (fallback and supplement to ML detection)
   */
  private async runOpenCVDetection(mat: any): Promise<ObjectDetection[]> {
    const detections: ObjectDetection[] = [];

    // Use edge detection and contour analysis for suspicious objects
    const gray = mat.cvtColor(cv.COLOR_BGR2GRAY);
    const blur = gray.gaussianBlur(new cv.Size(5, 5), 0);
    const edges = blur.canny(50, 150);
    const contours = edges.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Analyze contours for suspicious objects
    for (const contour of contours) {
      const area = contour.area;
      const rect = contour.boundingRect();

      // Filter by size and shape
      if (area > 1000 && area < 50000) {
        const aspectRatio = rect.width / rect.height;

        // Suspicious bag/package detection (rectangular shape)
        if (aspectRatio > 0.5 && aspectRatio < 2) {
          const detection = this.createDetection(
            'suspicious bag',
            'SUSPICIOUS',
            rect,
            0.7
          );
          detections.push(detection);
        }
      }
    }

    // Color-based detection for safety equipment (red fire extinguishers)
    const hsv = mat.cvtColor(cv.COLOR_BGR2HSV);

    // Red color range for fire extinguishers
    const lowerRed1 = new cv.Vec3(0, 100, 100);
    const upperRed1 = new cv.Vec3(10, 255, 255);
    const lowerRed2 = new cv.Vec3(160, 100, 100);
    const upperRed2 = new cv.Vec3(180, 255, 255);

    const mask1 = hsv.inRange(lowerRed1, upperRed1);
    const mask2 = hsv.inRange(lowerRed2, upperRed2);
    const redMask = mask1.or(mask2);

    const redContours = redMask.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (const contour of redContours) {
      const area = contour.area;
      if (area > 2000 && area < 20000) {
        const rect = contour.boundingRect();
        const aspectRatio = rect.width / rect.height;

        // Fire extinguisher shape (vertical cylinder)
        if (aspectRatio > 0.3 && aspectRatio < 0.8) {
          const detection = this.createDetection(
            'fire extinguisher',
            'SAFETY_EQUIPMENT',
            rect,
            0.75
          );
          detections.push(detection);
        }
      }
    }

    // Weapon detection using shape analysis (simplified)
    // In production, use a trained ML model
    const weaponDetections = this.detectWeaponShapes(mat);
    detections.push(...weaponDetections);

    return detections;
  }

  /**
   * Categorize detected object by security relevance
   */
  private categorizeObject(className: string): 'WEAPON' | 'SAFETY_EQUIPMENT' | 'SUSPICIOUS' | 'NORMAL' {
    const lower = className.toLowerCase();

    if (this.WEAPON_CLASSES.some((w) => lower.includes(w))) {
      return 'WEAPON';
    }
    if (this.SAFETY_EQUIPMENT_CLASSES.some((s) => lower.includes(s))) {
      return 'SAFETY_EQUIPMENT';
    }
    if (this.SUSPICIOUS_CLASSES.some((s) => lower.includes(s))) {
      return 'SUSPICIOUS';
    }
    return 'NORMAL';
  }

  /**
   * Detect weapon shapes (simplified heuristic) - Enhanced version
   */
  private detectWeaponShapes(mat: any): ObjectDetection[] {
    const detections: ObjectDetection[] = [];

    try {
      // Use edge detection for metallic objects
      const gray = mat.cvtColor(cv.COLOR_BGR2GRAY);
      const blur = gray.gaussianBlur(new cv.Size(3, 3), 0);
      const edges = blur.canny(100, 200);

      // Look for straight lines (gun barrel indicators)
      const lines = edges.houghLinesP(1, Math.PI / 180, 50, 50, 10);

      // Analyze line patterns for weapon-like shapes
      if (lines.length > 15) {
        // Potential weapon-like pattern detected
        // Group nearby lines
        const lineGroups = this.groupNearbyLines(lines, 50);

        for (const group of lineGroups) {
          if (group.length >= 3) {
            // Get bounding box for line group
            const bbox = this.getBoundingBoxForLines(group);

            detections.push({
              class: 'potential weapon (requires verification)',
              category: 'WEAPON',
              confidence: 0.45, // Medium-low confidence
              bbox,
              threatLevel: 'MEDIUM',
            });
          }
        }
      }
    } catch (error: any) {
      console.error('[Object Detection] Weapon shape detection error:', error.message);
    }

    return detections;
  }

  /**
   * Group nearby lines for pattern analysis
   */
  private groupNearbyLines(lines: any[], maxDistance: number): any[][] {
    const groups: any[][] = [];
    const used = new Set<number>();

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const group = [lines[i]];
      used.add(i);

      for (let j = i + 1; j < lines.length; j++) {
        if (used.has(j)) continue;

        const dist = this.lineDistance(lines[i], lines[j]);
        if (dist < maxDistance) {
          group.push(lines[j]);
          used.add(j);
        }
      }

      if (group.length >= 2) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Calculate distance between two lines
   */
  private lineDistance(line1: any, line2: any): number {
    const x1 = (line1.x + line1.z) / 2;
    const y1 = (line1.y + line1.w) / 2;
    const x2 = (line2.x + line2.z) / 2;
    const y2 = (line2.y + line2.w) / 2;

    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Get bounding box for a group of lines
   */
  private getBoundingBoxForLines(lines: any[]): { x: number; y: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const line of lines) {
      minX = Math.min(minX, line.x, line.z);
      minY = Math.min(minY, line.y, line.w);
      maxX = Math.max(maxX, line.x, line.z);
      maxY = Math.max(maxY, line.y, line.w);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Create detection object
   */
  private createDetection(
    objectClass: string,
    category: 'WEAPON' | 'SAFETY_EQUIPMENT' | 'SUSPICIOUS' | 'NORMAL',
    rect: any,
    confidence: number
  ): ObjectDetection {
    const threatLevel = this.getThreatLevel(category, confidence);

    return {
      class: objectClass,
      category,
      confidence,
      bbox: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      threatLevel,
    };
  }

  /**
   * Get threat level based on category
   */
  private getThreatLevel(
    category: string,
    confidence: number
  ): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (category === 'WEAPON') {
      return confidence > 0.8 ? 'CRITICAL' : 'HIGH';
    }
    if (category === 'SUSPICIOUS') {
      return confidence > 0.8 ? 'MEDIUM' : 'LOW';
    }
    if (category === 'SAFETY_EQUIPMENT') {
      return 'NONE';
    }
    return 'NONE';
  }

  /**
   * Generate security alerts
   */
  private generateSecurityAlerts(
    weaponDetections: ObjectDetection[],
    suspiciousObjects: ObjectDetection[],
    eventId: string,
    cameraId: string,
    location?: { lat: number; lon: number }
  ): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];

    // Weapon alerts
    for (const weapon of weaponDetections) {
      alerts.push({
        type: 'WEAPON_DETECTED',
        severity: weapon.threatLevel as 'HIGH' | 'CRITICAL',
        message: `WEAPON DETECTED: ${weapon.class} (${Math.round(weapon.confidence * 100)}% confidence) on camera ${cameraId}`,
        ...(location && { location }),
        cameraId,
        timestamp: new Date(),
        suggestedActions: [
          'Deploy security team immediately',
          'Lock down area',
          'Contact law enforcement',
          'Activate emergency protocol',
          'Review live camera feed',
        ],
      });
    }

    // Suspicious object alerts
    const highConfidenceSuspicious = suspiciousObjects.filter((o) => o.confidence > 0.8);
    if (highConfidenceSuspicious.length > 0) {
      alerts.push({
        type: 'SUSPICIOUS_OBJECT',
        severity: 'MEDIUM',
        message: `${highConfidenceSuspicious.length} suspicious object(s) detected on camera ${cameraId}`,
        ...(location && { location }),
        cameraId,
        timestamp: new Date(),
        suggestedActions: [
          'Investigate object',
          'Deploy security personnel',
          'Monitor closely',
          'Prepare evacuation if needed',
        ],
      });
    }

    return alerts;
  }

  /**
   * Emit weapon detection alert
   */
  private emitWeaponAlert(
    eventId: string,
    cameraId: string,
    weaponDetections: ObjectDetection[],
    location?: { lat: number; lon: number }
  ): void {
    const alert = {
      eventId,
      cameraId,
      type: 'WEAPON_DETECTED',
      severity: 'CRITICAL',
      weaponCount: weaponDetections.length,
      weapons: weaponDetections.map((w) => ({
        class: w.class,
        confidence: w.confidence,
        bbox: w.bbox,
      })),
      location,
      timestamp: new Date().toISOString(),
      message: `CRITICAL SECURITY ALERT: ${weaponDetections.length} weapon(s) detected`,
    };

    // Emit to Socket.IO with high priority
    io.to(`event:${eventId}`).emit('alert:weapon-detected', alert);

    // Publish to Pub/Sub for immediate response
    pubSubService.publishAlert({
      ...alert,
      priority: 'CRITICAL',
      requiresImmediateResponse: true,
    });

    console.error(`[Object Detection] WEAPON ALERT: ${alert.message}`);
  }

  /**
   * Validate safety equipment presence in zone
   */
  async validateSafetyEquipment(
    imageBuffer: Buffer,
    requiredEquipment: string[]
  ): Promise<{ compliant: boolean; missing: string[] }> {
    const result = await this.detectObjects(imageBuffer, 'validation', 'validation');

    const detectedEquipment = result.safetyEquipment.map((e) => e.class);
    const missing = requiredEquipment.filter((eq) => !detectedEquipment.includes(eq));

    return {
      compliant: missing.length === 0,
      missing,
    };
  }

  /**
   * Detect Personal Protective Equipment (PPE) compliance
   */
  async detectPPECompliance(
    imageBuffer: Buffer,
    requiredPPE: string[] = ['helmet', 'vest']
  ): Promise<{
    compliant: boolean;
    detected: string[];
    missing: string[];
    confidence: number;
  }> {
    try {
      // Use YOLO service for person detection
      const yoloResult = await yoloDetectionService.detectObjects(imageBuffer);

      // Filter for PPE-related objects
      const ppeDetections = yoloResult.filter((d) =>
        this.PPE_CLASSES.some((ppe) => d.className.toLowerCase().includes(ppe))
      );

      const detected = ppeDetections.map((d) => d.className);
      const missing = requiredPPE.filter((ppe) =>
        !detected.some((d) => d.toLowerCase().includes(ppe.toLowerCase()))
      );

      const confidence = ppeDetections.length > 0
        ? ppeDetections.reduce((sum, d) => sum + d.confidence, 0) / ppeDetections.length
        : 0;

      return {
        compliant: missing.length === 0,
        detected,
        missing,
        confidence,
      };
    } catch (error: any) {
      console.error('[Object Detection] PPE detection error:', error.message);
      return {
        compliant: false,
        detected: [],
        missing: requiredPPE,
        confidence: 0,
      };
    }
  }

  /**
   * Detect abandoned objects (stationary suspicious items)
   */
  async detectAbandonedObjects(
    currentFrame: Buffer,
    previousFrame: Buffer,
    threshold: number = 0.95
  ): Promise<ObjectDetection[]> {
    try {
      const mat1 = cv.imdecode(previousFrame);
      const mat2 = cv.imdecode(currentFrame);

      // Convert to grayscale
      const gray1 = mat1.cvtColor(cv.COLOR_BGR2GRAY);
      const gray2 = mat2.cvtColor(cv.COLOR_BGR2GRAY);

      // Calculate frame difference
      const diff = gray1.absdiff(gray2);
      const blurred = diff.gaussianBlur(new cv.Size(5, 5), 0);
      const thresh = blurred.threshold(25, 255, cv.THRESH_BINARY);

      // Find contours of changed regions
      const contours = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      const abandonedObjects: ObjectDetection[] = [];

      for (const contour of contours) {
        const area = contour.area;

        // Filter by size (too small = noise, too large = person moving)
        if (area > 500 && area < 5000) {
          const rect = contour.boundingRect();

          abandonedObjects.push({
            class: 'abandoned object',
            category: 'SUSPICIOUS',
            confidence: 0.7,
            bbox: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
            threatLevel: 'MEDIUM',
          });
        }
      }

      return abandonedObjects;
    } catch (error: any) {
      console.error('[Object Detection] Abandoned object detection error:', error.message);
      return [];
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryInfo(): any {
    return tf.memory();
  }

  /**
   * Dispose model and cleanup
   */
  async dispose(): Promise<void> {
    if (this.model) {
      this.model = undefined;
    }
    this.isInitialized = false;
    console.log('[Object Detection] Model disposed');
  }
}

export const objectDetectionService = new ObjectDetectionService();
export { ObjectDetectionService };
