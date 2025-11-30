/**
 * Cloud Storage Service
 * Google Cloud Storage integration for media uploads
 */

import { Storage } from '@google-cloud/storage';

export class CloudStorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage();
    this.bucketName = import.meta.env.GCS_BUCKET_NAME || 'drishtix-data-storage';
  }

  async uploadFile(file: File, path: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(path);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await blob.save(buffer, {
      metadata: { contentType: file.type }
    });

    return `gs://${this.bucketName}/${path}`;
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(path)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000
      });

    return url;
  }

  async deleteFile(path: string): Promise<void> {
    await this.storage.bucket(this.bucketName).file(path).delete();
  }
}

export default CloudStorageService;
