/**
 * YOLO Detection Service
 * Real-time object detection using COCO-SSD (TensorFlow.js)
 * 
 * Features:
 * - People/person detection for crowd counting
 * - Multiple object class detection (80 COCO classes)
 * - Confidence-based filtering
 * - Non-Maximum Suppression (NMS) for overlapping boxes
 * - Normalized coordinates for heatmap generation
 * 
 * Alternative: For better accuracy, consider using Python-based YOLOv8 service
 */

import * as tf from '@tensorflow/tfjs-node';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import cv from '@u4/opencv4nodejs';

interface YOLODetection {
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  normalized: { x: number; y: number };
  classId: number;
  className: string;
}

interface DetectionResult {
  detections: YOLODetection[];
  personCount: number;
}

class YOLODetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Auto-initialize on service creation
    this.initialize().catch((error) => {
      console.error('[YOLO] Failed to initialize:', error.message);
    });
  }

  /**
   * Initialize TensorFlow.js and load COCO-SSD model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('[YOLO] Initializing TensorFlow.js backend...');

      // Set backend to Node.js for better performance
      await tf.setBackend('tensorflow');
      await tf.ready();

      console.log(`[YOLO] TensorFlow.js backend: ${tf.getBackend()}`);
      console.log('[YOLO] Loading COCO-SSD model...');

      // Load COCO-SSD model (pre-trained on COCO dataset with 80 object classes)
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2', // Options: 'lite_mobilenet_v2', 'mobilenet_v1', 'mobilenet_v2'
      });

      this.isInitialized = true;
      console.log('✓ [YOLO] COCO-SSD model loaded successfully');
    } catch (error: any) {
      console.error('[YOLO] Initialization failed:', error.message);
      console.warn('[YOLO] Falling back to stub mode. Install @tensorflow/tfjs-node and @tensorflow-models/coco-ssd for detection.');
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Load model (alias for initialize for backward compatibility)
   */
  async loadModel(): Promise<void> {
    return this.initialize();
  }

  /**
   * Detect people in image for crowd counting
   */
  async detectPeople(imageData: Buffer): Promise<DetectionResult> {
    if (!this.isInitialized || !this.model) {
      console.warn('[YOLO] Model not initialized. Returning empty detections.');
      return { detections: [], personCount: 0 };
    }

    try {
      // Decode image using OpenCV
      const mat = cv.imdecode(imageData);
      const height = mat.rows;
      const width = mat.cols;

      // Convert OpenCV Mat to TensorFlow.js tensor
      // COCO-SSD expects RGB, OpenCV uses BGR
      const rgbMat = mat.cvtColor(cv.COLOR_BGR2RGB);
      const imageArray = new Uint8Array(rgbMat.getData());

      // Reshape to [height, width, 3]
      const tensor = tf.tensor3d(imageArray, [height, width, 3]);

      // Run detection
      const predictions = await this.model.detect(tensor as any);

      // Clean up tensor
      tensor.dispose();

      // Filter for people and convert to YOLODetection format
      const detections: YOLODetection[] = predictions
        .filter((pred) => pred.class === 'person')
        .map((pred, index) => {
          const [x, y, width, height] = pred.bbox;
          return {
            confidence: pred.score,
            bbox: { x, y, width, height },
            normalized: {
              x: (x + width / 2) / width,
              y: (y + height / 2) / height,
            },
            classId: 0, // Person class in COCO
            className: 'person',
          };
        });

      // Apply Non-Maximum Suppression to remove overlapping detections
      const filteredDetections = this.applyNMS(detections);

      console.log(`[YOLO] Detected ${filteredDetections.length} people (${predictions.length} total objects)`);

      return {
        detections: filteredDetections,
        personCount: filteredDetections.length,
      };
    } catch (error: any) {
      console.error('[YOLO] Detection error:', error.message);
      return { detections: [], personCount: 0 };
    }
  }

  /**
   * Detect all objects (not just people) for comprehensive scene analysis
   */
  async detectObjects(imageData: Buffer, classFilter?: string[]): Promise<YOLODetection[]> {
    if (!this.isInitialized || !this.model) {
      console.warn('[YOLO] Model not initialized. Returning empty detections.');
      return [];
    }

    try {
      // Decode image using OpenCV
      const mat = cv.imdecode(imageData);
      const height = mat.rows;
      const width = mat.cols;

      // Convert to RGB
      const rgbMat = mat.cvtColor(cv.COLOR_BGR2RGB);
      const imageArray = new Uint8Array(rgbMat.getData());

      const tensor = tf.tensor3d(imageArray, [height, width, 3]);

      // Run detection
      const predictions = await this.model.detect(tensor as any);
      tensor.dispose();

      // Convert and optionally filter
      const detections: YOLODetection[] = predictions
        .filter((pred) => !classFilter || classFilter.includes(pred.class))
        .map((pred) => {
          const [x, y, w, h] = pred.bbox;
          return {
            confidence: pred.score,
            bbox: { x, y, width: w, height: h },
            normalized: {
              x: (x + w / 2) / width,
              y: (y + h / 2) / height,
            },
            classId: this.getClassId(pred.class),
            className: pred.class,
          };
        });

      return this.applyNMS(detections);
    } catch (error: any) {
      console.error('[YOLO] Object detection error:', error.message);
      return [];
    }
  }

  /**
   * Apply Non-Maximum Suppression to remove overlapping detections
   */
  private applyNMS(detections: YOLODetection[], iouThreshold = 0.5): YOLODetection[] {
    if (detections.length === 0) return [];

    // Sort by confidence (descending)
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    const selected: YOLODetection[] = [];

    for (const detection of sorted) {
      let shouldKeep = true;

      for (const kept of selected) {
        const iou = this.calculateIoU(detection.bbox, kept.bbox);
        if (iou > iouThreshold) {
          shouldKeep = false;
          break;
        }
      }

      if (shouldKeep) {
        selected.push(detection);
      }
    }

    return selected;
  }

  /**
   * Calculate Intersection over Union (IoU) for two bounding boxes
   */
  private calculateIoU(
    box1: { x: number; y: number; width: number; height: number },
    box2: { x: number; y: number; width: number; height: number }
  ): number {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const box1Area = box1.width * box1.height;
    const box2Area = box2.width * box2.height;
    const unionArea = box1Area + box2Area - intersectionArea;

    return intersectionArea / unionArea;
  }

  /**
   * Get COCO class ID from class name (simplified mapping)
   */
  private getClassId(className: string): number {
    const classMap: Record<string, number> = {
      person: 0,
      bicycle: 1,
      car: 2,
      motorcycle: 3,
      airplane: 4,
      bus: 5,
      train: 6,
      truck: 7,
      boat: 8,
      'traffic light': 9,
      'fire hydrant': 10,
      'stop sign': 11,
      // Add more as needed...
    };
    return classMap[className] || 999;
  }

  /**
   * Get TensorFlow.js memory info for monitoring
   */
  getMemoryInfo(): any {
    return tf.memory();
  }

  /**
   * Dispose model and cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.model) {
      this.model = null;
    }
    this.isInitialized = false;
    console.log('[YOLO] Model disposed');
  }
}

export const yoloDetectionService = new YOLODetectionService();
export { YOLODetection, DetectionResult };
