/**
 * Facial Recognition Service
 * Real-time face detection and recognition using face-api.js
 * 
 * Features:
 * - Face detection with bounding boxes
 * - Face recognition for VIP/Security/Staff identification
 * - Age and gender estimation
 * - Expression detection (happy, sad, angry, etc.)
 * - Unauthorized access alerts
 * - Firebase storage for face descriptors
 * 
 * Models used:
 * - SSD MobileNet V1 for face detection
 * - FaceNet for face recognition (128D face descriptors)
 * - Age/Gender models
 */

import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs-node';
import * as canvas from 'canvas';
import cv from '@u4/opencv4nodejs';
import { firebaseAdminService } from './firebase-admin.service';
import * as path from 'path';
import * as fs from 'fs';

// Patch face-api to use node-canvas
const { Canvas, Image, ImageData } = canvas;
(faceapi.env as any).monkeyPatch({ Canvas, Image, ImageData });

interface FaceRecognitionResult {
  totalFaces: number;
  vipCount: number;
  securityCount: number;
  unknownCount: number;
  recognizedFaces: Array<{
    personId: string;
    name: string;
    confidence: number;
    role: 'VIP' | 'SECURITY' | 'STAFF' | 'UNKNOWN';
    bbox: { x: number; y: number; width: number; height: number };
    age?: number;
    gender?: 'male' | 'female';
    expression?: string;
  }>;
  alerts: Array<{
    type: 'UNAUTHORIZED_ACCESS';
    severity: 'HIGH';
    message: string;
    suggestedActions: string[];
    location: { lat: number; lon: number };
    cameraId: string;
    timestamp: Date;
  }>;
}

interface RegisteredPerson {
  personId: string;
  name: string;
  role: 'VIP' | 'SECURITY' | 'STAFF';
  descriptor: Float32Array;
  registeredAt: Date;
}

class FacialRecognitionService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private registeredFaces: Map<string, RegisteredPerson> = new Map();
  private modelsPath = path.join(__dirname, '../models/face-api');

  constructor() {
    // Auto-initialize on service creation
    this.initialize().catch((error) => {
      console.error('[Facial Recognition] Failed to initialize:', error.message);
    });
  }

  /**
   * Initialize face-api.js models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('[Facial Recognition] Initializing TensorFlow.js backend...');

      await tf.setBackend('tensorflow');
      await tf.ready();

      console.log('[Facial Recognition] Loading face-api.js models...');

      // Create models directory if it doesn't exist
      if (!fs.existsSync(this.modelsPath)) {
        console.warn(`[Facial Recognition] Models directory not found: ${this.modelsPath}`);
        console.warn('[Facial Recognition] Download models from: https://github.com/vladmandic/face-api/tree/master/model');
        throw new Error('Face-api models not found. Please download and place in server/models/face-api/');
      }

      // Load all models
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelsPath), // Face detection
        faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelsPath), // Face landmarks
        faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelsPath), // Face recognition (FaceNet)
        faceapi.nets.ageGenderNet.loadFromDisk(this.modelsPath), // Age/Gender
        faceapi.nets.faceExpressionNet.loadFromDisk(this.modelsPath), // Expressions
      ]);

      // Load registered faces from Firebase
      await this.loadRegisteredFaces();

      this.isInitialized = true;
      console.log('✓ [Facial Recognition] All models loaded successfully');
      console.log(`✓ [Facial Recognition] ${this.registeredFaces.size} registered faces loaded`);
    } catch (error: any) {
      console.error('[Facial Recognition] Initialization failed:', error.message);
      console.warn('[Facial Recognition] Falling back to stub mode.');
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Load model (alias for initialize)
   */
  async loadModel(): Promise<void> {
    return this.initialize();
  }

  /**
   * Analyze faces in image
   */
  async analyzeFaces(
    imageData: Buffer,
    eventId: string,
    zoneId?: string,
    cameraId?: string,
    location?: { lat: number; lon: number }
  ): Promise<FaceRecognitionResult> {
    if (!this.isInitialized) {
      console.warn('[Facial Recognition] Model not initialized. Returning empty results.');
      return {
        totalFaces: 0,
        vipCount: 0,
        securityCount: 0,
        unknownCount: 0,
        recognizedFaces: [],
        alerts: [],
      };
    }

    try {
      // Decode image using OpenCV
      const mat = cv.imdecode(imageData);

      // Convert to Canvas for face-api
      const img = await canvas.loadImage(imageData);

      // Detect faces with all features
      const detections = await faceapi
        .detectAllFaces(img as any, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withAgeAndGender()
        .withFaceExpressions();

      const recognizedFaces: FaceRecognitionResult['recognizedFaces'] = [];
      const alerts: FaceRecognitionResult['alerts'] = [];

      let vipCount = 0;
      let securityCount = 0;
      let unknownCount = 0;

      // Match each detected face with registered faces
      for (const detection of detections) {
        const { descriptor, age, gender, expressions } = detection;
        const bbox = detection.detection.box;

        // Find best match from registered faces
        const match = this.findBestMatch(descriptor);

        if (match) {
          recognizedFaces.push({
            personId: match.personId,
            name: match.name,
            confidence: match.confidence,
            role: match.role,
            bbox: {
              x: bbox.x,
              y: bbox.y,
              width: bbox.width,
              height: bbox.height,
            },
            age: Math.round(age),
            gender: gender as 'male' | 'female',
            expression: this.getDominantExpression(expressions),
          });

          // Count by role
          if (match.role === 'VIP') vipCount++;
          else if (match.role === 'SECURITY') securityCount++;
        } else {
          // Unknown person detected
          unknownCount++;

          // Generate alert for unauthorized access in restricted zones
          if (zoneId && this.isRestrictedZone(zoneId)) {
            alerts.push({
              type: 'UNAUTHORIZED_ACCESS',
              severity: 'HIGH',
              message: `Unrecognized person detected in restricted zone ${zoneId}`,
              suggestedActions: [
                'Dispatch security to investigate',
                'Review camera footage',
                'Verify access credentials',
              ],
              location: location || { lat: 0, lon: 0 },
              cameraId: cameraId || 'unknown',
              timestamp: new Date(),
            });
          }
        }
      }

      console.log(`[Facial Recognition] Detected ${detections.length} faces: ${vipCount} VIP, ${securityCount} Security, ${unknownCount} Unknown`);

      return {
        totalFaces: detections.length,
        vipCount,
        securityCount,
        unknownCount,
        recognizedFaces,
        alerts,
      };
    } catch (error: any) {
      console.error('[Facial Recognition] Analysis error:', error.message);
      return {
        totalFaces: 0,
        vipCount: 0,
        securityCount: 0,
        unknownCount: 0,
        recognizedFaces: [],
        alerts: [],
      };
    }
  }

  /**
   * Register a new person for recognition
   */
  async registerPerson(
    personId: string,
    name: string,
    role: 'VIP' | 'SECURITY' | 'STAFF',
    imageData: Buffer
  ): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('[Facial Recognition] Model not initialized.');
      return false;
    }

    try {
      // Load image
      const img = await canvas.loadImage(imageData);

      // Detect face and extract descriptor
      const detection = await faceapi
        .detectSingleFace(img as any, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.error('[Facial Recognition] No face detected in registration image');
        return false;
      }

      const descriptor = detection.descriptor;

      // Store in memory
      const person: RegisteredPerson = {
        personId,
        name,
        role,
        descriptor,
        registeredAt: new Date(),
      };

      this.registeredFaces.set(personId, person);

      // Store in Firebase for persistence
      await this.saveRegisteredFace(person);

      console.log(`✓ [Facial Recognition] Registered ${name} (${role})`);
      return true;
    } catch (error: any) {
      console.error('[Facial Recognition] Registration error:', error.message);
      return false;
    }
  }

  /**
   * Find best match from registered faces
   */
  private findBestMatch(
    descriptor: Float32Array
  ): { personId: string; name: string; role: 'VIP' | 'SECURITY' | 'STAFF'; confidence: number } | null {
    const threshold = 0.6; // Distance threshold (lower is better match)
    let bestMatch: any = null;
    let bestDistance = Infinity;

    for (const [personId, person] of this.registeredFaces) {
      const distance = faceapi.euclideanDistance(descriptor, person.descriptor);

      if (distance < threshold && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = {
          personId: person.personId,
          name: person.name,
          role: person.role,
          confidence: 1 - distance, // Convert distance to confidence
        };
      }
    }

    return bestMatch;
  }

  /**
   * Get dominant facial expression
   */
  private getDominantExpression(expressions: any): string {
    const expressionMap = expressions as Record<string, number>;
    let maxExpression = 'neutral';
    let maxValue = 0;

    for (const [expression, value] of Object.entries(expressionMap)) {
      if (value > maxValue) {
        maxValue = value;
        maxExpression = expression;
      }
    }

    return maxExpression;
  }

  /**
   * Check if zone is restricted
   */
  private isRestrictedZone(zoneId: string): boolean {
    const restrictedZones = ['backstage', 'vip-lounge', 'control-room', 'server-room'];
    return restrictedZones.some((zone) => zoneId.toLowerCase().includes(zone));
  }

  /**
   * Load registered faces from Firebase
   */
  private async loadRegisteredFaces(): Promise<void> {
    try {
      const db = firebaseAdminService.getFirestore();
      const snapshot = await db.collection('registered_faces').get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const person: RegisteredPerson = {
          personId: doc.id,
          name: data.name,
          role: data.role,
          descriptor: new Float32Array(data.descriptor),
          registeredAt: data.registeredAt?.toDate() || new Date(),
        };

        this.registeredFaces.set(doc.id, person);
      }

      console.log(`[Facial Recognition] Loaded ${this.registeredFaces.size} registered faces`);
    } catch (error: any) {
      console.error('[Facial Recognition] Error loading registered faces:', error.message);
      // Continue without registered faces
    }
  }

  /**
   * Save registered face to Firebase
   */
  private async saveRegisteredFace(person: RegisteredPerson): Promise<void> {
    try {
      const db = firebaseAdminService.getFirestore();
      await db.collection('registered_faces').doc(person.personId).set({
        name: person.name,
        role: person.role,
        descriptor: Array.from(person.descriptor),
        registeredAt: person.registeredAt,
      });
    } catch (error: any) {
      console.error('[Facial Recognition] Error saving to Firebase:', error.message);
      // Don't throw - keep in-memory version
    }
  }

  /**
   * Dispose models and cleanup
   */
  async dispose(): Promise<void> {
    this.registeredFaces.clear();
    this.isInitialized = false;
    console.log('[Facial Recognition] Service disposed');
  }
}

export const facialRecognitionService = new FacialRecognitionService();
export { FaceRecognitionResult, RegisteredPerson };
