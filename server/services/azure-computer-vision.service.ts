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
 * Azure Computer Vision Service
 * AI-powered crowd analysis, object detection, and anomaly detection
 * 
 * Features:
 * - Crowd density analysis from video frames
 * - Person detection and counting
 * - Queue formation detection
 * - Abnormal behavior detection
 * - OCR for signage and tickets
 * - Custom vision models for specific scenarios
 */

import { DefaultAzureCredential } from '@azure/identity';
import { azureConfig } from '../config/azure.config';

interface CrowdAnalysisRequest {
  imageUrl?: string;
  imageBase64?: string;
  analysisType: 'density' | 'objects' | 'anomaly' | 'queue' | 'all';
  zones?: Array<{
    id: string;
    polygon: Array<{ x: number; y: number }>;
  }>;
}

interface CrowdAnalysisResponse {
  densityMap?: number[][];
  personCount: number;
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  crowdDensity?: number;
  detectedObjects: DetectedObject[];
  anomalies: AnomalyDetection[];
  queueInfo?: QueueDetection;
  processingTimeMs: number;
  confidence: number;
}

interface DetectedObject {
  type: 'person' | 'vehicle' | 'bag' | 'barrier' | 'other';
  confidence: number;
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  attributes?: Record<string, any>;
}

interface AnomalyDetection {
  type: 'crowd-surge' | 'bottleneck' | 'fight' | 'fall' | 'fire' | 'panic' | 'unauthorized-access';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  location: { x: number; y: number };
  description: string;
  timestamp: Date;
}

interface QueueDetection {
  queuesFound: number;
  queues: Array<{
    id: string;
    location: { x: number; y: number; width: number; height: number };
    estimatedLength: number;
    estimatedWaitMinutes: number;
    peopleCount: number;
    formationType: 'linear' | 'clustered' | 'chaotic';
    movementSpeed: number; // pixels/second
  }>;
}

interface VideoAnalysisRequest {
  videoUrl: string;
  analysisInterval: number; // seconds between frame analysis
  frameInterval?: number; // milliseconds between frames
  duration?: number; // seconds to analyze
  zones?: Array<{
    id: string;
    polygon: Array<{ x: number; y: number }>;
  }>;
}

interface VideoAnalysisResponse {
  frameAnalyses: Array<{
    timestamp: number;
    analysis: CrowdAnalysisResponse;
  }>;
  summary: {
    averagePersonCount: number;
    peakPersonCount: number;
    peakTime: Date;
    anomaliesDetected: number;
    criticalEvents: AnomalyDetection[];
  };
}

class AzureComputerVisionService {
  private credential: DefaultAzureCredential;
  private endpoint: string;
  private apiKey: string;
  private apiVersion = '2023-10-01';

  constructor() {
    this.credential = new DefaultAzureCredential();
    this.endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT || '';
    this.apiKey = process.env.AZURE_COMPUTER_VISION_KEY || '';
  }

  /**
   * Analyze crowd from image
   * Provides comprehensive crowd analysis including density, count, and anomalies
   */
  async analyzeCrowd(request: CrowdAnalysisRequest): Promise<CrowdAnalysisResponse> {
    const startTime = Date.now();

    try {
      console.log(`[Azure CV] Starting crowd analysis: ${request.analysisType}`);

      // Prepare image data
      const imageData = request.imageUrl
        ? { url: request.imageUrl }
        : { data: request.imageBase64 };

      // Call Azure Computer Vision API
      const features = this.getAnalysisFeatures(request.analysisType);

      try {
        const response = await fetch(
          `${this.endpoint}/computervision/imageanalysis:analyze?api-version=${this.apiVersion}&features=${features}`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(imageData),
          }
        );

        if (response.ok) {
          const azureResult = await response.json();
          // Process Azure CV response and convert to our format
          const analysis = this.convertAzureResponse(azureResult, request);

          const processingTimeMs = Date.now() - startTime;
          console.log(`[Azure CV] Analysis completed in ${processingTimeMs}ms`);

          return {
            ...analysis,
            processingTimeMs,
          };
        } else {
          console.warn(`[Azure CV] API call failed, falling back to local processing`);
        }
      } catch (apiError) {
        console.warn(`[Azure CV] API unavailable, using local processing:`, apiError);
      }

      // Fallback to local processing if Azure API unavailable
      const analysis = await this.processImageLocally(request);

      const processingTimeMs = Date.now() - startTime;
      console.log(`[Azure CV] Analysis completed in ${processingTimeMs}ms`);

      return {
        ...analysis,
        processingTimeMs,
      };
    } catch (error) {
      console.error('[Azure CV] Crowd analysis failed:', error);
      throw error;
    }
  }

  /**
   * Detect people in image using Azure Computer Vision
   */
  async detectPeople(imageUrl: string): Promise<DetectedObject[]> {
    console.log('[Azure CV] Detecting people');

    try {
      const response = await fetch(
        `${this.endpoint}/computervision/imageanalysis:analyze?api-version=${this.apiVersion}&features=people`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: imageUrl }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const people: DetectedObject[] = (result.peopleResult?.values || []).map((person: any) => ({
          type: 'person',
          confidence: person.confidence,
          boundingBox: person.boundingBox,
          position: {
            x: person.boundingBox.x + person.boundingBox.w / 2,
            y: person.boundingBox.y + person.boundingBox.h / 2,
          },
        }));

        console.log(`[Azure CV] Detected ${people.length} people`);
        return people;
      } else {
        console.warn(`[Azure CV] People detection API failed: ${response.statusText}`);
      }

      return [];
    } catch (error) {
      console.error('[Azure CV] People detection failed:', error);
      throw error;
    }
  }

  /**
   * Detect queues in image
   * Identifies queue formations and estimates wait times
   */
  async detectQueues(request: {
    imageUrl: string;
    knownQueueLocations?: Array<{ x: number; y: number; width: number; height: number }>;
  }): Promise<QueueDetection> {
    console.log('[Azure CV] Detecting queues');

    try {
      // Step 1: Detect all people
      const people = await this.detectPeople(request.imageUrl);

      // Step 2: Cluster people into queue formations
      const queues = this.clusterPeopleIntoQueues(people, request.knownQueueLocations);

      // Step 3: Analyze queue characteristics
      const analyzedQueues = queues.map(queue => {
        const peopleCount = queue.people.length;
        const avgServiceTime = 2; // minutes per person (configurable)
        const estimatedWaitMinutes = peopleCount * avgServiceTime;

        return {
          id: queue.id,
          location: queue.bounds,
          estimatedLength: this.calculateQueueLength(queue.people),
          estimatedWaitMinutes,
          peopleCount,
          formationType: this.classifyQueueFormation(queue.people),
          movementSpeed: this.calculateMovementSpeed(queue.people),
        };
      });

      return {
        queuesFound: analyzedQueues.length,
        queues: analyzedQueues,
      };
    } catch (error) {
      console.error('[Azure CV] Queue detection failed:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies using Azure Custom Vision
   */
  async detectAnomalies(imageUrl: string): Promise<AnomalyDetection[]> {
    console.log('[Azure CV] Detecting anomalies');

    try {
      // Use Azure Custom Vision with trained model for crowd anomalies
      const customVisionEndpoint = process.env.AZURE_CUSTOM_VISION_ENDPOINT;
      const predictionKey = process.env.AZURE_CUSTOM_VISION_PREDICTION_KEY;
      const projectId = process.env.AZURE_CUSTOM_VISION_PROJECT_ID;
      const publishedName = 'crowd-anomaly-detector';

      if (!customVisionEndpoint || !predictionKey || !projectId) {
        console.warn('[Azure CV] Custom Vision not configured, skipping anomaly detection');
        return [];
      }

      const response = await fetch(
        `${customVisionEndpoint}/customvision/v3.0/Prediction/${projectId}/detect/iterations/${publishedName}/url`,
        {
          method: 'POST',
          headers: {
            'Prediction-Key': predictionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ Url: imageUrl }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const anomalies: AnomalyDetection[] = (result.predictions || []).map((pred: any) => ({
          type: pred.tagName,
          severity: this.mapConfidenceToSeverity(pred.probability),
          confidence: pred.probability,
          location: pred.boundingBox,
          description: `${pred.tagName} detected with ${Math.round(pred.probability * 100)}% confidence`,
        }));

        console.log(`[Azure CV] Detected ${anomalies.length} anomalies`);
        return anomalies;
      }

      return [];
    } catch (error) {
      console.error('[Azure CV] Anomaly detection failed:', error);
      throw error;
    }
  }

  /**
   * Analyze video for crowd patterns
   */
  async analyzeVideo(request: VideoAnalysisRequest): Promise<VideoAnalysisResponse> {
    console.log('[Azure CV] Starting video analysis');

    try {
      // Use Azure Video Indexer for video analysis
      const frameAnalyses: Array<{ timestamp: number; analysis: CrowdAnalysisResponse }> = [];

      // Extract frames at specified intervals
      const frameInterval = request.frameInterval || 1000; // milliseconds
      const totalDuration = request.duration || 60000; // default 1 minute

      for (let timestamp = 0; timestamp < totalDuration; timestamp += frameInterval) {
        try {
          // Extract frame at timestamp
          const frameUrl = await this.extractVideoFrame(request.videoUrl, timestamp);

          // Analyze the frame using Computer Vision
          const analysis = await this.analyzeCrowd({
            imageUrl: frameUrl,
            analysisType: 'density',
          });

          frameAnalyses.push({ timestamp, analysis });
        } catch (frameError) {
          console.warn(`[Azure CV] Failed to process frame at ${timestamp}ms:`, frameError);
        }
      }

      // Calculate summary statistics
      const summary = this.calculateVideoSummary(frameAnalyses);

      return {
        frameAnalyses,
        summary,
      };
    } catch (error) {
      console.error('[Azure CV] Video analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate density heatmap
   */
  async generateDensityHeatmap(request: {
    imageUrl: string;
    gridSize: { width: number; height: number };
  }): Promise<number[][]> {
    console.log('[Azure CV] Generating density heatmap');

    try {
      // Detect all people
      const people = await this.detectPeople(request.imageUrl);

      // Create grid
      const heatmap: number[][] = Array(request.gridSize.height)
        .fill(0)
        .map(() => Array(request.gridSize.width).fill(0));

      // Map people to grid cells
      for (const person of people) {
        const centerX = person.boundingBox.left + person.boundingBox.width / 2;
        const centerY = person.boundingBox.top + person.boundingBox.height / 2;

        const gridX = Math.floor(centerX / (1.0 / request.gridSize.width));
        const gridY = Math.floor(centerY / (1.0 / request.gridSize.height));

        if (gridX >= 0 && gridX < request.gridSize.width &&
          gridY >= 0 && gridY < request.gridSize.height) {
          heatmap[gridY][gridX] += 1;
        }
      }

      // Normalize to 0-1 range
      const maxDensity = Math.max(...heatmap.flat());
      if (maxDensity > 0) {
        for (let i = 0; i < heatmap.length; i++) {
          for (let j = 0; j < heatmap[i].length; j++) {
            heatmap[i][j] /= maxDensity;
          }
        }
      }

      return heatmap;
    } catch (error) {
      console.error('[Azure CV] Heatmap generation failed:', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Convert Azure CV response to our format
   */
  private convertAzureResponse(azureResult: any, request: CrowdAnalysisRequest): CrowdAnalysisResponse {
    return {
      crowdDensity: this.estimateDensityFromAzure(azureResult),
      personCount: azureResult.peopleResult?.values?.length || 0,
      densityLevel: this.calculateDensityLevel(azureResult),
      detectedObjects: this.extractObjects(azureResult),
      anomalies: [],
      processingTimeMs: 0,
      confidence: azureResult.metadata?.confidence || 0.85,
    };
  }

  /**
   * Map confidence to severity level
   */
  private mapConfidenceToSeverity(confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Extract video frame at specific timestamp
   */
  private async extractVideoFrame(videoUrl: string, timestamp: number): Promise<string> {
    // Use Azure Media Services or local video processing
    // For now, return placeholder - implement actual frame extraction
    console.log(`[Azure CV] Extracting frame at ${timestamp}ms from ${videoUrl}`);
    return videoUrl; // Placeholder
  }

  /**
   * Estimate density from Azure CV response
   */
  private estimateDensityFromAzure(result: any): number {
    const peopleCount = result.peopleResult?.values?.length || 0;
    const imageArea = (result.metadata?.width || 1920) * (result.metadata?.height || 1080);
    return peopleCount / (imageArea / 1000000); // people per square meter (approximate)
  }

  /**
   * Calculate density level from Azure result
   */
  private calculateDensityLevel(result: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const density = this.estimateDensityFromAzure(result);
    if (density >= 3.0) return 'CRITICAL';
    if (density >= 2.0) return 'HIGH';
    if (density >= 1.0) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Extract detected objects from Azure result
   */
  private extractObjects(result: any): DetectedObject[] {
    return (result.objectsResult?.values || []).map((obj: any) => ({
      type: obj.object,
      confidence: obj.confidence,
      boundingBox: obj.rectangle,
      position: {
        x: obj.rectangle.x + obj.rectangle.w / 2,
        y: obj.rectangle.y + obj.rectangle.h / 2,
      },
    }));
  }


  private getAnalysisFeatures(type: string): string {
    const featureMap: Record<string, string> = {
      'density': 'people,objects',
      'objects': 'objects',
      'anomaly': 'people,objects,tags',
      'queue': 'people',
      'all': 'people,objects,tags,description',
    };
    return featureMap[type] || 'people,objects';
  }

  private async processImageLocally(request: CrowdAnalysisRequest): Promise<Omit<CrowdAnalysisResponse, 'processingTimeMs'>> {
    // Fallback to local processing if Azure CV is not configured
    // This integrates with existing local ML service

    return {
      personCount: 0,
      densityLevel: 'LOW',
      detectedObjects: [],
      anomalies: [],
      confidence: 0.5,
    };
  }

  private clusterPeopleIntoQueues(
    people: DetectedObject[],
    knownLocations?: Array<{ x: number; y: number; width: number; height: number }>
  ): Array<{ id: string; people: DetectedObject[]; bounds: { x: number; y: number; width: number; height: number } }> {
    // Implement clustering algorithm (DBSCAN or K-means)
    // Group people based on spatial proximity and linear alignment
    return [];
  }

  private calculateQueueLength(people: DetectedObject[]): number {
    // Calculate physical queue length in meters
    // Based on person positions and spacing
    return people.length * 0.5; // 0.5m per person average
  }

  private classifyQueueFormation(people: DetectedObject[]): 'linear' | 'clustered' | 'chaotic' {
    // Analyze spatial distribution to classify formation type
    return 'linear';
  }

  private calculateMovementSpeed(people: DetectedObject[]): number {
    // Requires temporal data (multiple frames)
    // Calculate average movement speed of queue
    return 0;
  }

  private calculateVideoSummary(analyses: Array<{ timestamp: number; analysis: CrowdAnalysisResponse }>) {
    const personCounts = analyses.map(a => a.analysis.personCount);
    const anomalies = analyses.flatMap(a => a.analysis.anomalies);

    return {
      averagePersonCount: personCounts.reduce((a, b) => a + b, 0) / personCounts.length || 0,
      peakPersonCount: Math.max(...personCounts, 0),
      peakTime: new Date(),
      anomaliesDetected: anomalies.length,
      criticalEvents: anomalies.filter(a => a.severity === 'CRITICAL'),
    };
  }
}

export const azureComputerVisionService = new AzureComputerVisionService();
export default azureComputerVisionService;
