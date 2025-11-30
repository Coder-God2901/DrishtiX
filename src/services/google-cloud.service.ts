/**
 * Google Cloud Platform Integration Service
 * Centralized service for GCP APIs: BigQuery, Cloud Storage, Vertex AI
 */

import { Storage } from '@google-cloud/storage';
import { BigQuery } from '@google-cloud/bigquery';
import aiplatform from '@google-cloud/aiplatform';

export interface VertexAIPredictionRequest {
  instances: any[];
  parameters?: Record<string, any>;
}

export interface VertexAIPredictionResponse {
  predictions: any[];
  deployedModelId?: string;
  model?: string;
}

export interface BigQueryInsertOptions {
  dataset: string;
  table: string;
  rows: any[];
}

class GoogleCloudService {
  private storage: Storage | null = null;
  private bigQuery: BigQuery | null = null;
  private projectId: string = '';
  private credentials: any = null;

  /**
   * Initialize Google Cloud services
   */
  async initialize(config?: {
    projectId?: string;
    credentials?: any;
  }): Promise<void> {
    try {
      this.projectId = config?.projectId || import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || '';
      this.credentials = config?.credentials;

      if (!this.projectId) {
        console.warn('⚠️ Google Cloud Project ID not configured');
        return;
      }

      // Initialize Cloud Storage
      this.storage = new Storage({
        projectId: this.projectId,
        credentials: this.credentials,
      });

      // Initialize BigQuery
      this.bigQuery = new BigQuery({
        projectId: this.projectId,
        credentials: this.credentials,
      });

      console.log('✅ Google Cloud Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Cloud Service:', error);
      throw error;
    }
  }

  /**
   * Predict with Vertex AI deployed model
   */
  async predictWithVertexAI(
    endpoint: string,
    instances: any[]
  ): Promise<VertexAIPredictionResponse> {
    try {
      if (!endpoint) {
        throw new Error('Vertex AI endpoint not configured');
      }

      // Extract project, location, and endpoint ID from full endpoint path
      // Format: projects/PROJECT_ID/locations/LOCATION/endpoints/ENDPOINT_ID
      const match = endpoint.match(/projects\/([^/]+)\/locations\/([^/]+)\/endpoints\/([^/]+)/);

      if (!match) {
        throw new Error('Invalid Vertex AI endpoint format');
      }

      const [, projectId, location, endpointId] = match;

      const predictionServiceClient = new aiplatform.v1.PredictionServiceClient({
        apiEndpoint: `${location}-aiplatform.googleapis.com`,
        credentials: this.credentials,
      });

      const [response] = await predictionServiceClient.predict({
        endpoint: `projects/${projectId}/locations/${location}/endpoints/${endpointId}`,
        instances: instances as any[], // Simplified - in production, use proper struct conversion
      });

      return {
        predictions: response.predictions || [],
        deployedModelId: response.deployedModelId || undefined,
        model: response.model || undefined,
      };
    } catch (error) {
      console.error('❌ Vertex AI prediction failed:', error);
      throw error;
    }
  }

  /**
   * Get crowd density prediction from Vertex AI Forecasting
   */
  async getCrowdDensityPrediction(params: {
    eventId: string;
    timestamp: string;
    historicalData: any[];
  }): Promise<any> {
    try {
      const endpoint = import.meta.env.VITE_VERTEX_AI_FORECASTING_ENDPOINT;

      if (!endpoint) {
        console.warn('⚠️ Vertex AI Forecasting endpoint not configured, using fallback');
        return this.getFallbackPrediction(params);
      }

      const instances = [{
        eventId: params.eventId,
        timestamp: params.timestamp,
        historicalData: params.historicalData,
      }];

      const response = await this.predictWithVertexAI(endpoint, instances);
      return response.predictions[0];
    } catch (error) {
      console.error('❌ Crowd density prediction failed:', error);
      return this.getFallbackPrediction(params);
    }
  }

  /**
   * Fallback prediction when Vertex AI is unavailable
   */
  private getFallbackPrediction(params: any): any {
    // Simple moving average fallback
    const recentData = params.historicalData.slice(-10);
    const avgDensity = recentData.reduce((sum: number, d: any) => sum + d.density, 0) / recentData.length;

    return {
      predictedDensity: avgDensity * 1.1, // Assume 10% growth
      confidence: 0.6,
      horizon: 15,
      usedFallback: true,
    };
  }

  /**
   * Insert data into BigQuery
   */
  async insertIntoBigQuery(options: BigQueryInsertOptions): Promise<void> {
    try {
      if (!this.bigQuery) {
        console.warn('⚠️ BigQuery not initialized');
        return;
      }

      const dataset = this.bigQuery.dataset(options.dataset);
      const table = dataset.table(options.table);

      await table.insert(options.rows);
      console.log(`✅ Inserted ${options.rows.length} rows into ${options.dataset}.${options.table}`);
    } catch (error) {
      console.error('❌ BigQuery insert failed:', error);
      throw error;
    }
  }

  /**
   * Upload file to Google Cloud Storage
   */
  async uploadToGCS(
    bucketName: string,
    filePath: string,
    destination: string
  ): Promise<string> {
    try {
      if (!this.storage) {
        throw new Error('Cloud Storage not initialized');
      }

      const bucket = this.storage.bucket(bucketName);
      await bucket.upload(filePath, {
        destination,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
      console.log(`✅ Uploaded to GCS: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('❌ GCS upload failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.storage !== null && this.bigQuery !== null;
  }
}

export const googleCloudService = new GoogleCloudService();
export default googleCloudService;
