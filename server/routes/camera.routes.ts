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
 * Camera Stream API Routes
 * Endpoints for managing video camera streams
 */

import express, { Request, Response } from 'express';
import { openCVCameraService, CameraConfig } from '../services/opencv-camera.service';
import { io } from '../index';

const router = express.Router();

/**
 * POST /api/cameras/start
 * Start a camera stream
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const config: CameraConfig = req.body;

    if (!config.cameraId || !config.streamUrl || !config.eventId) {
      return res.status(400).json({
        error: 'Missing required fields: cameraId, streamUrl, eventId',
      });
    }

    await openCVCameraService.startCamera(config);

    res.json({
      success: true,
      message: `Camera ${config.cameraId} started`,
      data: {
        cameraId: config.cameraId,
        status: 'CONNECTED',
      },
    });
  } catch (error: any) {
    console.error('Error starting camera:', error);
    res.status(500).json({
      error: 'Failed to start camera',
      message: error.message,
    });
  }
});

/**
 * POST /api/cameras/stop/:cameraId
 * Stop a camera stream
 */
router.post('/stop/:cameraId', async (req: Request, res: Response) => {
  try {
    const { cameraId } = req.params;

    await openCVCameraService.stopCamera(cameraId);

    res.json({
      success: true,
      message: `Camera ${cameraId} stopped`,
    });
  } catch (error: any) {
    console.error('Error stopping camera:', error);
    res.status(500).json({
      error: 'Failed to stop camera',
      message: error.message,
    });
  }
});

/**
 * GET /api/cameras/status
 * Get all camera statuses
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const statuses = openCVCameraService.getAllCameraStatuses();

    res.json({
      success: true,
      data: statuses,
    });
  } catch (error: any) {
    console.error('Error getting camera statuses:', error);
    res.status(500).json({
      error: 'Failed to get camera statuses',
      message: error.message,
    });
  }
});

/**
 * GET /api/cameras/status/:cameraId
 * Get specific camera status
 */
router.get('/status/:cameraId', (req: Request, res: Response) => {
  try {
    const { cameraId } = req.params;
    const status = openCVCameraService.getCameraStatus(cameraId);

    if (!status) {
      return res.status(404).json({
        error: 'Camera not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Error getting camera status:', error);
    res.status(500).json({
      error: 'Failed to get camera status',
      message: error.message,
    });
  }
});

/**
 * GET /api/cameras/frame/:cameraId
 * Get latest frame from camera (JPEG)
 */
router.get('/frame/:cameraId', (req: Request, res: Response) => {
  try {
    const { cameraId } = req.params;
    const frame = openCVCameraService.getLatestFrame(cameraId);

    if (!frame) {
      return res.status(404).json({
        error: 'No frame available',
      });
    }

    // Return JPEG image
    res.set('Content-Type', 'image/jpeg');
    res.send(frame.imageData);
  } catch (error: any) {
    console.error('Error getting camera frame:', error);
    res.status(500).json({
      error: 'Failed to get camera frame',
      message: error.message,
    });
  }
});

/**
 * POST /api/cameras/stop-all
 * Stop all camera streams
 */
router.post('/stop-all', async (req: Request, res: Response) => {
  try {
    await openCVCameraService.stopAll();

    res.json({
      success: true,
      message: 'All cameras stopped',
    });
  } catch (error: any) {
    console.error('Error stopping all cameras:', error);
    res.status(500).json({
      error: 'Failed to stop all cameras',
      message: error.message,
    });
  }
});

// ===== SOCKET.IO REAL-TIME FRAME STREAMING =====

/**
 * Stream camera frames via Socket.IO
 * Clients can subscribe to 'camera:stream:cameraId' to receive frames
 */
openCVCameraService.on('frame', (frame) => {
  // Emit frame to subscribed clients via Socket.IO
  if (io) {
    io.to(`camera:${frame.cameraId}`).emit('camera:frame', {
      cameraId: frame.cameraId,
      timestamp: frame.timestamp,
      frameNumber: frame.frameNumber,
      imageDataBase64: frame.imageData.toString('base64'),
      width: frame.width,
      height: frame.height,
    });
  }
});

export default router;
