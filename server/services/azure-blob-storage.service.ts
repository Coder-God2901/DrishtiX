/**
 * Azure Blob Storage Service
 * Cloud object storage for files, videos, and ML models
 * 
 * Features:
 * - Upload and download files
 * - Blob management and listing
 * - Signed URLs for secure access
 * - Blob metadata and properties
 * - Lifecycle management
 * 
 * Replaces: Google Cloud Storage
 */

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  ContainerClient,
  BlobClient,
  BlockBlobClient,
} from '@azure/storage-blob';
import { azureConfig } from '../config/azure.config';
import { Readable } from 'stream';

interface UploadOptions {
  container: string;
  blobName: string;
  data: Buffer | Readable | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

interface DownloadOptions {
  container: string;
  blobName: string;
}

interface ListBlobsOptions {
  container: string;
  prefix?: string;
  maxResults?: number;
}

interface SignedUrlOptions {
  container: string;
  blobName: string;
  expiresIn?: number; // minutes
  permissions?: 'r' | 'w' | 'rw';
}

class AzureBlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containers: Map<string, ContainerClient> = new Map();

  constructor() {
    const credential = new StorageSharedKeyCredential(
      azureConfig.storage.accountName,
      azureConfig.storage.accountKey
    );

    this.blobServiceClient = new BlobServiceClient(
      `https://${azureConfig.storage.accountName}.blob.core.windows.net`,
      credential
    );

    console.log('[Azure Blob Storage Service] Initialized');
    this.initializeContainers();
  }

  /**
   * Initialize default containers
   */
  private async initializeContainers(): Promise<void> {
    try {
      const containerNames = [
        azureConfig.storage.containers.simulations,
        azureConfig.storage.containers.models,
        azureConfig.storage.containers.videos,
      ];

      for (const containerName of containerNames) {
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({ access: 'private' });
        this.containers.set(containerName, containerClient);
      }

      console.log('[Blob Storage] Containers initialized');
    } catch (error) {
      console.error('[Blob Storage] Error initializing containers:', error);
    }
  }

  /**
   * Get container client
   */
  private getContainerClient(containerName: string): ContainerClient {
    if (!this.containers.has(containerName)) {
      const client = this.blobServiceClient.getContainerClient(containerName);
      this.containers.set(containerName, client);
    }
    return this.containers.get(containerName)!;
  }

  /**
   * Upload file to blob storage
   */
  async upload(options: UploadOptions): Promise<string> {
    try {
      const containerClient = this.getContainerClient(options.container);
      const blockBlobClient = containerClient.getBlockBlobClient(options.blobName);

      const uploadOptions: any = {
        blobHTTPHeaders: {
          blobContentType: options.contentType || 'application/octet-stream',
        },
        metadata: options.metadata || {},
      };

      if (Buffer.isBuffer(options.data)) {
        await blockBlobClient.upload(options.data, options.data.length, uploadOptions);
      } else if (typeof options.data === 'string') {
        const buffer = Buffer.from(options.data);
        await blockBlobClient.upload(buffer, buffer.length, uploadOptions);
      } else {
        // Stream
        await blockBlobClient.uploadStream(
          options.data as Readable,
          4 * 1024 * 1024, // 4MB buffer size
          5, // Max concurrency
          uploadOptions
        );
      }

      const url = blockBlobClient.url;
      console.log(`[Blob Storage] Uploaded: ${options.blobName}`);
      return url;
    } catch (error) {
      console.error('[Blob Storage] Upload error:', error);
      throw error;
    }
  }

  /**
   * Download file from blob storage
   */
  async download(options: DownloadOptions): Promise<Buffer> {
    try {
      const containerClient = this.getContainerClient(options.container);
      const blobClient = containerClient.getBlobClient(options.blobName);

      const downloadResponse = await blobClient.download();
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error('No readable stream available');
      }

      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      console.log(`[Blob Storage] Downloaded: ${options.blobName}`);
      return buffer;
    } catch (error) {
      console.error('[Blob Storage] Download error:', error);
      throw error;
    }
  }

  /**
   * Delete blob
   */
  async delete(container: string, blobName: string): Promise<void> {
    try {
      const containerClient = this.getContainerClient(container);
      const blobClient = containerClient.getBlobClient(blobName);
      await blobClient.delete();
      console.log(`[Blob Storage] Deleted: ${blobName}`);
    } catch (error) {
      console.error('[Blob Storage] Delete error:', error);
      throw error;
    }
  }

  /**
   * List blobs in container
   */
  async list(options: ListBlobsOptions): Promise<string[]> {
    try {
      const containerClient = this.getContainerClient(options.container);
      const blobs: string[] = [];

      const listOptions: any = {
        prefix: options.prefix,
      };

      const iterator = containerClient.listBlobsFlat(listOptions);
      
      let count = 0;
      for await (const blob of iterator) {
        blobs.push(blob.name);
        count++;
        if (options.maxResults && count >= options.maxResults) {
          break;
        }
      }

      return blobs;
    } catch (error) {
      console.error('[Blob Storage] List error:', error);
      throw error;
    }
  }

  /**
   * Check if blob exists
   */
  async exists(container: string, blobName: string): Promise<boolean> {
    try {
      const containerClient = this.getContainerClient(container);
      const blobClient = containerClient.getBlobClient(blobName);
      return await blobClient.exists();
    } catch (error) {
      console.error('[Blob Storage] Exists check error:', error);
      return false;
    }
  }

  /**
   * Get blob metadata
   */
  async getMetadata(container: string, blobName: string): Promise<Record<string, string>> {
    try {
      const containerClient = this.getContainerClient(container);
      const blobClient = containerClient.getBlobClient(blobName);
      const properties = await blobClient.getProperties();
      return properties.metadata || {};
    } catch (error) {
      console.error('[Blob Storage] Get metadata error:', error);
      throw error;
    }
  }

  /**
   * Set blob metadata
   */
  async setMetadata(
    container: string,
    blobName: string,
    metadata: Record<string, string>
  ): Promise<void> {
    try {
      const containerClient = this.getContainerClient(container);
      const blobClient = containerClient.getBlobClient(blobName);
      await blobClient.setMetadata(metadata);
      console.log(`[Blob Storage] Set metadata for: ${blobName}`);
    } catch (error) {
      console.error('[Blob Storage] Set metadata error:', error);
      throw error;
    }
  }

  /**
   * Generate signed URL for temporary access
   */
  async getSignedUrl(options: SignedUrlOptions): Promise<string> {
    try {
      const containerClient = this.getContainerClient(options.container);
      const blobClient = containerClient.getBlobClient(options.blobName);

      // Generate SAS token
      const expiresOn = new Date();
      expiresOn.setMinutes(expiresOn.getMinutes() + (options.expiresIn || 60));

      const permissions = options.permissions || 'r';
      const sasUrl = await blobClient.generateSasUrl({
        permissions: {
          read: permissions.includes('r'),
          write: permissions.includes('w'),
        },
        expiresOn,
      });

      return sasUrl;
    } catch (error) {
      console.error('[Blob Storage] Generate signed URL error:', error);
      throw error;
    }
  }

  /**
   * Upload video file
   */
  async uploadVideo(
    eventId: string,
    videoName: string,
    data: Buffer | Readable
  ): Promise<string> {
    const blobName = `${eventId}/${videoName}`;
    return await this.upload({
      container: azureConfig.storage.containers.videos,
      blobName,
      data,
      contentType: 'video/mp4',
      metadata: {
        eventId,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Upload ML model
   */
  async uploadModel(
    modelName: string,
    version: string,
    data: Buffer
  ): Promise<string> {
    const blobName = `${modelName}/${version}/model.pkl`;
    return await this.upload({
      container: azureConfig.storage.containers.models,
      blobName,
      data,
      contentType: 'application/octet-stream',
      metadata: {
        modelName,
        version,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Download ML model
   */
  async downloadModel(modelName: string, version: string): Promise<Buffer> {
    const blobName = `${modelName}/${version}/model.pkl`;
    return await this.download({
      container: azureConfig.storage.containers.models,
      blobName,
    });
  }

  /**
   * Upload simulation data
   */
  async uploadSimulation(
    eventId: string,
    simulationId: string,
    data: any
  ): Promise<string> {
    const blobName = `${eventId}/${simulationId}.json`;
    return await this.upload({
      container: azureConfig.storage.containers.simulations,
      blobName,
      data: JSON.stringify(data),
      contentType: 'application/json',
      metadata: {
        eventId,
        simulationId,
        createdAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // List containers as a health check
      const iterator = this.blobServiceClient.listContainers();
      await iterator.next();
      return true;
    } catch (error) {
      console.error('[Blob Storage] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const azureBlobStorageService = new AzureBlobStorageService();
export default azureBlobStorageService;
