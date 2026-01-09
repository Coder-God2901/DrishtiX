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
 * Storage Routes
 * Handles file uploads to Google Cloud Storage
 */

import { Router, Request, Response } from 'express';
import { Storage } from '@google-cloud/storage';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = Router();

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY
});

const bucketName = process.env.GCS_BUCKET_NAME || 'drishtix-uploads';
const bucket = storage.bucket(bucketName);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos only
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'));
    }
  }
});

/**
 * POST /api/storage/upload
 * Upload file to Google Cloud Storage
 */
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { category = 'general', eventId, metadata } = req.body;

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${category}/${uuidv4()}${fileExtension}`;

    // Create file in bucket
    const file = bucket.file(fileName);

    // Upload file buffer
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: req.user?.id || 'anonymous',
          originalName: req.file.originalname,
          category,
          eventId: eventId || null,
          ...(metadata ? JSON.parse(metadata) : {})
        }
      },
      public: false
    });

    // Generate signed URL (valid for 1 hour)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    res.status(201).json({
      success: true,
      data: {
        fileId: fileName,
        fileName: req.file.originalname,
        url: publicUrl,
        signedUrl: url,
        size: req.file.size,
        mimeType: req.file.mimetype,
        category
      },
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/storage/upload-multiple
 * Upload multiple files
 */
router.post('/upload-multiple', authenticate, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const { category = 'general', eventId } = req.body;

    const uploadedFiles = await Promise.all(
      req.files.map(async (file) => {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${category}/${uuidv4()}${fileExtension}`;

        const gcsFile = bucket.file(fileName);

        await gcsFile.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
            metadata: {
              uploadedBy: req.user?.id || 'anonymous',
              originalName: file.originalname,
              category,
              eventId: eventId || null
            }
          },
          public: false
        });

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

        return {
          fileId: fileName,
          fileName: file.originalname,
          url: publicUrl,
          size: file.size,
          mimeType: file.mimetype
        };
      })
    );

    res.status(201).json({
      success: true,
      data: uploadedFiles,
      count: uploadedFiles.length,
      message: 'Files uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/storage/:fileId
 * Get file signed URL
 */
router.get('/:fileId(*)', authenticate, async (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId;

    const file = bucket.file(fileId);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Generate signed URL (valid for 1 hour)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        fileId,
        url
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/storage/:fileId
 * Delete file from storage
 */
router.delete('/:fileId(*)', authenticate, async (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId;

    const file = bucket.file(fileId);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    await file.delete();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/storage/list/:category
 * List files by category
 */
router.get('/list/:category', authenticate, async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { limit = 100 } = req.query;

    const [files] = await bucket.getFiles({
      prefix: `${category}/`,
      maxResults: Number(limit)
    });

    const fileList = files.map(file => ({
      fileId: file.name,
      name: path.basename(file.name),
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      created: file.metadata.timeCreated,
      updated: file.metadata.updated
    }));

    res.json({
      success: true,
      data: fileList,
      count: fileList.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
