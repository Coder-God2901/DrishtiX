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
 * Azure Container Apps ETL Worker Integration Service
 * Sends raw data to Azure Container Apps worker for processing
 * 
 * Replaces: Google Cloud Run ETL Worker
 */

import axios from 'axios';
import { azureConfig } from '../config/azure.config';
import { azureServiceBusService } from './azure-service-bus.service';

interface RawDataBatch {
  eventId: string;
  data: RawDataPoint[];
}

interface RawDataPoint {
  type: 'DRONE' | 'CCTV' | 'USER_GPS' | 'WEATHER' | 'SOCIAL';
  timestamp: Date;
  [key: string]: any;
}

interface ProcessedResponse {
  success: boolean;
  processed: number;
  eventId: string;
  timestamp: string;
}

class CloudRunETLService {
  private workerUrl: string;
  private batchSize: number = 100;
  private batchTimeout: number = 5000; // 5 seconds
  private batches: Map<string, RawDataPoint[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.workerUrl = process.env.ETL_WORKER_URL ||
      process.env.AZURE_CONTAINER_APPS_ETL_URL ||
      'https://etl-worker.azurecontainerapps.io';

    console.log(`Azure Container Apps ETL Worker URL: ${this.workerUrl}`);
  }

  /**
   * Send raw data point to ETL worker (batched)
   */
  async sendRawData(eventId: string, dataPoint: RawDataPoint): Promise<void> {
    try {
      // Add to batch
      if (!this.batches.has(eventId)) {
        this.batches.set(eventId, []);
      }

      const batch = this.batches.get(eventId)!;
      batch.push(dataPoint);

      // Auto-flush if batch size reached
      if (batch.length >= this.batchSize) {
        await this.flushBatch(eventId);
      } else {
        // Set timer to flush after timeout
        this.resetTimer(eventId);
      }
    } catch (error) {
      console.error('Error sending raw data to ETL worker:', error);
      // Don't throw - allow system to continue
    }
  }

  /**
   * Send drone heatmap data
   */
  async sendDroneData(eventId: string, droneData: any): Promise<void> {
    return this.sendRawData(eventId, {
      type: 'DRONE',
      timestamp: new Date(),
      ...droneData
    });
  }

  /**
   * Send CCTV camera data
   */
  async sendCCTVData(eventId: string, cctvData: any): Promise<void> {
    return this.sendRawData(eventId, {
      type: 'CCTV',
      timestamp: new Date(),
      ...cctvData
    });
  }

  /**
   * Send user GPS data
   */
  async sendUserGPSData(eventId: string, gpsData: any): Promise<void> {
    return this.sendRawData(eventId, {
      type: 'USER_GPS',
      timestamp: new Date(),
      ...gpsData
    });
  }

  /**
   * Update weather context in ETL worker
   */
  async updateWeatherContext(eventId: string, weatherData: any): Promise<void> {
    try {
      await axios.post(`${this.workerUrl}/update-weather`, {
        event_id: eventId,
        weather: {
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          heatIndex: weatherData.heatIndex,
          windSpeed: weatherData.windSpeed,
          humidity: weatherData.humidity
        }
      }, {
        timeout: 5000
      });

      console.log(`Updated weather context for event ${eventId}`);
    } catch (error) {
      console.error('Error updating weather context:', error);
    }
  }

  /**
   * Update social signals context in ETL worker
   */
  async updateSocialContext(eventId: string, socialData: any): Promise<void> {
    try {
      await axios.post(`${this.workerUrl}/update-social`, {
        event_id: eventId,
        social: {
          sentimentScore: socialData.sentimentScore,
          panicLevel: socialData.panicLevel,
          volumeSpike: socialData.volumeSpike,
          keywords: socialData.keywords
        }
      }, {
        timeout: 5000
      });

      console.log(`Updated social context for event ${eventId}`);
    } catch (error) {
      console.error('Error updating social context:', error);
    }
  }

  /**
   * Flush batch immediately
   */
  async flushBatch(eventId: string): Promise<void> {
    const batch = this.batches.get(eventId);

    if (!batch || batch.length === 0) {
      return;
    }

    try {
      console.log(`Flushing batch for event ${eventId}: ${batch.length} data points`);

      const response = await axios.post<ProcessedResponse>(
        `${this.workerUrl}/process`,
        {
          event_id: eventId,
          data: batch
        },
        {
          timeout: 30000, // 30 seconds
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`ETL processed ${response.data.processed} features for event ${eventId}`);

      // Clear batch
      this.batches.set(eventId, []);

      // Clear timer
      if (this.timers.has(eventId)) {
        clearTimeout(this.timers.get(eventId)!);
        this.timers.delete(eventId);
      }

    } catch (error: any) {
      console.error(`Error flushing batch for event ${eventId}:`, error.message);

      // On error, try to send individual points to Pub/Sub as fallback
      try {
        for (const point of batch) {
          await pubSubService.publishMessage('raw-data-stream', {
            eventId,
            ...point
          });
        }
        console.log(`Fallback: Sent ${batch.length} points to Pub/Sub`);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      // Clear batch anyway to prevent memory leak
      this.batches.set(eventId, []);
    }
  }

  /**
   * Flush all batches (on shutdown)
   */
  async flushAll(): Promise<void> {
    console.log('Flushing all ETL batches...');

    const promises = Array.from(this.batches.keys()).map(eventId =>
      this.flushBatch(eventId)
    );

    await Promise.all(promises);
    console.log('All ETL batches flushed');
  }

  /**
   * Clear cache for an event (when event ends)
   */
  async clearEventCache(eventId: string): Promise<void> {
    try {
      // Flush any remaining data
      await this.flushBatch(eventId);

      // Clear worker cache
      await axios.post(`${this.workerUrl}/clear-cache`, {
        event_id: eventId
      }, {
        timeout: 5000
      });

      console.log(`Cleared ETL cache for event ${eventId}`);
    } catch (error) {
      console.error('Error clearing event cache:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.workerUrl}/health`, {
        timeout: 5000
      });

      return response.data.status === 'healthy';
    } catch (error) {
      console.error('ETL worker health check failed:', error);
      return false;
    }
  }

  /**
   * Reset batch timer
   */
  private resetTimer(eventId: string): void {
    // Clear existing timer
    if (this.timers.has(eventId)) {
      clearTimeout(this.timers.get(eventId)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.flushBatch(eventId);
    }, this.batchTimeout);

    this.timers.set(eventId, timer);
  }

  /**
   * Get batch statistics
   */
  getBatchStats(): any {
    const stats: any = {};

    for (const [eventId, batch] of this.batches.entries()) {
      stats[eventId] = {
        size: batch.length,
        pending: batch.length > 0,
        maxSize: this.batchSize
      };
    }

    return stats;
  }
}

// Export singleton
export const cloudRunETLService = new CloudRunETLService();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, flushing ETL batches...');
  await cloudRunETLService.flushAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, flushing ETL batches...');
  await cloudRunETLService.flushAll();
  process.exit(0);
});

export default cloudRunETLService;
