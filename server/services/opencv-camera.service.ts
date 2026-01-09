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
 * OpenCV Camera Stream Service
 * Real-time RTSP/WebRTC camera stream capture and frame extraction
 * 
 * Features:
 * - Multi-camera RTSP stream ingestion
 * - Frame extraction at 5 fps for video analytics
 * - WebRTC streaming to frontend (VideoFeedGrid.tsx)
 * - Integration with video-analytics.service.ts for ML inference
 * - Support for IP cameras, drones, CCTV systems
 * 
 * INSTALLATION REQUIRED:
 * 1. Install OpenCV: npm install @u4/opencv4nodejs
 * 2. Install FFmpeg: https://ffmpeg.org/download.html
 * 3. Optional: Create video-analytics.service.ts for ML analysis
 * 
 * NOTE: This service requires opencv4nodejs and FFmpeg to be installed.
 * Uncomment the imports and implementation code after installation.
 * For development, you can use the FFmpeg-only approach (extractFrame method).
 */

import cv from '@u4/opencv4nodejs';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { videoAnalyticsService } from './video-analytics.service';
import { pubSubService } from './pubsub.service';

interface CameraConfig {
  cameraId: string;
  streamUrl: string; // RTSP URL (e.g., rtsp://username:password@192.168.1.100:554/stream)
  type: 'CCTV' | 'DRONE' | 'IP_CAMERA' | 'WEBCAM';
  location: { lat: number; lon: number };
  eventId: string;
  fps?: number; // Frames per second to extract (default: 5)
  resolution?: { width: number; height: number }; // Target resolution
}

interface CameraFrame {
  cameraId: string;
  timestamp: Date;
  frameNumber: number;
  imageData: Buffer; // JPEG encoded frame
  width: number;
  height: number;
}

interface CameraStatus {
  cameraId: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PROCESSING';
  fps: number;
  framesProcessed: number;
  lastFrame: Date | null;
  error?: string;
}

class OpenCVCameraService extends EventEmitter {
  private cameras: Map<string, CameraStream> = new Map();
  private ffmpegProcesses: Map<string, ChildProcess> = new Map();

  constructor() {
    super();
    console.log('[OpenCV Camera Service] Initialized');
  }

  /**
   * Start camera stream capture
   */
  async startCamera(config: CameraConfig): Promise<void> {
    try {
      console.log(`[Camera] Starting stream for ${config.cameraId} (${config.type})`);

      // Check if camera already exists
      if (this.cameras.has(config.cameraId)) {
        console.warn(`[Camera] ${config.cameraId} already streaming`);
        return;
      }

      // Create camera stream instance
      const cameraStream = new CameraStream(config, this);
      this.cameras.set(config.cameraId, cameraStream);

      // Start streaming
      await cameraStream.start();

      console.log(`[Camera] ${config.cameraId} started successfully`);
    } catch (error) {
      console.error(`[Camera] Error starting ${config.cameraId}:`, error);
      throw error;
    }
  }

  /**
   * Stop camera stream
   */
  async stopCamera(cameraId: string): Promise<void> {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      console.warn(`[Camera] ${cameraId} not found`);
      return;
    }

    await camera.stop();
    this.cameras.delete(cameraId);
    console.log(`[Camera] ${cameraId} stopped`);
  }

  /**
   * Stop all cameras
   */
  async stopAll(): Promise<void> {
    console.log(`[Camera] Stopping all ${this.cameras.size} cameras`);
    for (const [cameraId, camera] of this.cameras) {
      await camera.stop();
    }
    this.cameras.clear();
  }

  /**
   * Get camera status
   */
  getCameraStatus(cameraId: string): CameraStatus | null {
    const camera = this.cameras.get(cameraId);
    return camera ? camera.getStatus() : null;
  }

  /**
   * Get all camera statuses
   */
  getAllCameraStatuses(): CameraStatus[] {
    return Array.from(this.cameras.values()).map((camera) => camera.getStatus());
  }

  /**
   * Get latest frame from camera
   */
  getLatestFrame(cameraId: string): CameraFrame | null {
    const camera = this.cameras.get(cameraId);
    return camera ? camera.getLatestFrame() : null;
  }
}

/**
 * Individual camera stream handler
 */
class CameraStream {
  private config: CameraConfig;
  private service: OpenCVCameraService;
  public capture?: any; // Use 'any' to avoid TS property errors for OpenCV
  private frameCount: number = 0;
  private isRunning: boolean = false;
  private latestFrame: CameraFrame | null = null;
  private status: CameraStatus;
  private frameInterval?: NodeJS.Timeout;
  private targetFps: number;

  constructor(config: CameraConfig, service: OpenCVCameraService) {
    this.config = config;
    this.service = service;
    this.targetFps = config.fps || 5;

    this.status = {
      cameraId: config.cameraId,
      status: 'DISCONNECTED',
      fps: 0,
      framesProcessed: 0,
      lastFrame: null,
    };
  }

  /**
   * Start camera capture
   */
  async start(): Promise<void> {
    try {
      this.isRunning = true;
      this.status.status = 'CONNECTED';

      // Use FFmpeg for RTSP streams (more reliable than OpenCV for RTSP)
      if (this.config.streamUrl.startsWith('rtsp://')) {
        await this.startRTSPStream();
      } else {
        // Use OpenCV for webcams, video files
        await this.startOpenCVCapture();
      }
    } catch (error: any) {
      this.status.status = 'ERROR';
      this.status.error = error.message;
      throw error;
    }
  }

  /**
   * Start RTSP stream using FFmpeg
   */
  private async startRTSPStream(): Promise<void> {
    const frameIntervalMs = 1000 / this.targetFps; // Extract frames at target FPS

    // Use FFmpeg to capture RTSP stream and output JPEG frames
    const ffmpegArgs = [
      '-rtsp_transport', 'tcp', // Use TCP for better reliability
      '-i', this.config.streamUrl,
      '-vf', `fps=${this.targetFps}`, // Extract at target FPS
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-'
    ];

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
    let frameBuffer = Buffer.alloc(0);

    ffmpegProcess.stdout.on('data', (data: Buffer) => {
      frameBuffer = Buffer.concat([frameBuffer, data]);

      // JPEG marker: FF D8 (start), FF D9 (end)
      const jpegStart = frameBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
      const jpegEnd = frameBuffer.indexOf(Buffer.from([0xFF, 0xD9]));

      if (jpegStart !== -1 && jpegEnd !== -1 && jpegEnd > jpegStart) {
        const jpegFrame = frameBuffer.slice(jpegStart, jpegEnd + 2);
        frameBuffer = frameBuffer.slice(jpegEnd + 2);

        // Process frame
        this.processFrame(jpegFrame);
      }
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.log(`[Camera ${this.config.cameraId}] FFmpeg: ${data.toString()}`);
    });

    ffmpegProcess.on('error', (error) => {
      console.error(`[Camera ${this.config.cameraId}] FFmpeg error:`, error);
      this.status.status = 'ERROR';
      this.status.error = error.message;
    });

    ffmpegProcess.on('exit', (code) => {
      console.log(`[Camera ${this.config.cameraId}] FFmpeg exited with code ${code}`);
      if (this.isRunning) {
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          if (this.isRunning) {
            console.log(`[Camera ${this.config.cameraId}] Reconnecting...`);
            this.startRTSPStream();
          }
        }, 5000);
      }
    });

    console.log(`[Camera ${this.config.cameraId}] RTSP stream started via FFmpeg`);
  }

  /**
   * Start OpenCV capture (for webcams, video files)
   */
  private async startOpenCVCapture(): Promise<void> {
    const frameIntervalMs = 1000 / this.targetFps;
    this.capture = new cv.VideoCapture(this.config.streamUrl);
    this.frameInterval = setInterval(() => {
      if (!this.capture || !this.isRunning) return;
      try {
        const frame = this.capture.read();
        if (frame.empty) {
          console.warn(`[Camera ${this.config.cameraId}] Empty frame received`);
          return;
        }
        const jpegBuffer = cv.imencode('.jpg', frame);
        this.processFrame(jpegBuffer);
      } catch (error) {
        console.error(`[Camera ${this.config.cameraId}] Frame capture error:`, error);
      }
    }, frameIntervalMs);
    console.log(`[Camera ${this.config.cameraId}] OpenCV capture started`);
  }

  /**
   * Process captured frame
   */
  private async processFrame(jpegBuffer: Buffer): Promise<void> {
    this.frameCount++;
    this.status.framesProcessed = this.frameCount;
    this.status.lastFrame = new Date();
    this.status.status = 'PROCESSING';

    // Decode JPEG to get dimensions (requires opencv4nodejs)
    let width = 1920;
    let height = 1080;
    try {
      const img = cv.imdecode(jpegBuffer);
      width = img.cols;
      height = img.rows;
    } catch (error) {
      console.warn(`[Camera ${this.config.cameraId}] Could not decode frame dimensions`);
    }

    const cameraFrame: CameraFrame = {
      cameraId: this.config.cameraId,
      timestamp: new Date(),
      frameNumber: this.frameCount,
      imageData: jpegBuffer,
      width,
      height,
    };

    this.latestFrame = cameraFrame;

    // Emit frame event for real-time streaming
    this.service.emit('frame', cameraFrame);

    // Send to video analytics service (every 5th frame to avoid overload)
    if (this.frameCount % 5 === 0) {
      this.sendToVideoAnalytics(cameraFrame);
    }

    // Publish frame metadata to Pub/Sub
    this.publishFrameMetadata(cameraFrame);

    this.status.status = 'CONNECTED';
  }

  /**
   * Send frame to video analytics service for ML inference
   */
  private async sendToVideoAnalytics(frame: CameraFrame): Promise<void> {
    try {
      const analysis = await videoAnalyticsService.analyzeFrame({
        eventId: this.config.eventId,
        cameraId: frame.cameraId,
        timestamp: frame.timestamp,
        imageData: frame.imageData,
        location: this.config.location,
      });
      console.log(`[Camera ${this.config.cameraId}] Analytics: ${analysis.peopleCount} people detected`);
    } catch (error) {
      console.error(`[Camera ${this.config.cameraId}] Analytics error:`, error);
    }
  }

  /**
   * Publish frame metadata to Pub/Sub
   */
  private publishFrameMetadata(frame: CameraFrame): void {
    pubSubService.publishVideoAnalytics({
      eventId: this.config.eventId,
      cameraId: frame.cameraId,
      timestamp: frame.timestamp.toISOString(),
      frameNumber: frame.frameNumber,
      dimensions: { width: frame.width, height: frame.height },
      type: this.config.type,
      location: this.config.location,
    });
  }

  /**
   * Stop camera stream
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = undefined;
    }

    if (this.capture) {
      this.capture.release();
      this.capture = undefined;
    }

    this.status.status = 'DISCONNECTED';
    console.log(`[Camera ${this.config.cameraId}] Stopped`);
  }

  /**
   * Get camera status
   */
  getStatus(): CameraStatus {
    return { ...this.status };
  }

  /**
   * Get latest frame
   */
  getLatestFrame(): CameraFrame | null {
    return this.latestFrame;
  }
}

export const openCVCameraService = new OpenCVCameraService();
export { OpenCVCameraService, CameraConfig, CameraFrame, CameraStatus };
