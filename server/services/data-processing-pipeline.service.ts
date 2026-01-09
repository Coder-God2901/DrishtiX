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
 * Data Processing Pipeline Service (Dataflow Alternative)
 * Real-time ETL pipeline to merge and process data from multiple sources
 * 
 * Purpose:
 * - Merge data from drones, CCTV, user GPS, weather, social media
 * - Convert GPS coordinates to grid cells
 * - Add contextual signals (weather, schedule, social sentiment)
 * - Prepare features for ML models
 * - Send processed data to BigQuery and Pub/Sub
 * 
 * Note: This is a Python/Docker-based alternative to GCP Dataflow
 * For production, consider migrating to Apache Beam + Dataflow
 */

import { pubSubService } from './pubsub.service';
import { bigQueryFeatureService } from './bigquery-feature.service';
import { gcpConfig } from '../config/gcp.config';

interface DataSource {
  type: 'DRONE' | 'CCTV' | 'USER_GPS' | 'WEATHER' | 'SOCIAL' | 'SCHEDULE';
  timestamp: Date;
  data: any;
}

interface DroneData {
  droneId: string;
  location: { lat: number; lon: number };
  heatmap: number[][];
  peopleCount: number;
  altitude: number;
}

interface CCTVData {
  cameraId: string;
  location: { lat: number; lon: number };
  peopleCount: number;
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomalies: any[];
}

interface UserGPSData {
  userId: string;
  location: { lat: number; lon: number };
  speed: number;
  accuracy: number;
}

interface WeatherData {
  timestamp: Date;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  heatIndex: number;
}

interface SocialData {
  platform: string;
  timestamp: Date;
  sentimentScore: number; // -1 to 1
  volumeSpike: boolean;
  keywords: string[];
  panicLevel: number; // 0 to 1
}

interface ProcessedFeatures {
  eventId: string;
  gridId: string;
  timestamp: Date;
  location: { lat: number; lon: number };

  // Crowd metrics
  density: number;
  count: number;
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // Temporal features
  deltaT1: number; // change over 1 minute
  deltaT5: number; // change over 5 minutes
  deltaT15: number; // change over 15 minutes

  // Contextual signals
  weather: WeatherData;
  socialSentiment: number;
  panicIndicators: number;

  // Source attribution
  sources: string[];
  confidence: number;
}

interface GridCell {
  gridId: string;
  lat: number;
  lon: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

class DataProcessingPipelineService {
  private gridSize: number = 50; // meters
  private gridCache: Map<string, GridCell> = new Map();
  private historicalData: Map<string, ProcessedFeatures[]> = new Map();
  private processingBuffer: Map<string, DataSource[]> = new Map();

  constructor() {
    console.log('âœ“ Data Processing Pipeline initialized');
    this.startPeriodicProcessing();
  }

  // ==================== DATA INGESTION ====================

  /**
   * Ingest data from various sources
   */
  async ingestData(eventId: string, source: DataSource): Promise<void> {
    try {
      // Add to processing buffer
      const key = `${eventId}_${source.type}`;
      if (!this.processingBuffer.has(key)) {
        this.processingBuffer.set(key, []);
      }
      this.processingBuffer.get(key)!.push(source);

      console.log(`Ingested ${source.type} data for event ${eventId}`);
    } catch (error) {
      console.error('Error ingesting data:', error);
      throw error;
    }
  }

  /**
   * Process drone heatmap data
   */
  async processDroneData(eventId: string, data: DroneData): Promise<ProcessedFeatures[]> {
    try {
      const features: ProcessedFeatures[] = [];

      // Convert heatmap to grid cells
      const gridCells = this.heatmapToGridCells(data.location, data.heatmap);

      for (const cell of gridCells) {
        const feature = await this.createFeature(eventId, {
          gridId: cell.gridId,
          location: { lat: cell.lat, lon: cell.lon },
          density: cell.density,
          count: cell.count,
          sources: ['DRONE'],
        });

        features.push(feature);
      }

      return features;
    } catch (error) {
      console.error('Error processing drone data:', error);
      throw error;
    }
  }

  /**
   * Process CCTV camera data
   */
  async processCCTVData(eventId: string, data: CCTVData): Promise<ProcessedFeatures> {
    try {
      const grid = this.locationToGrid(data.location);

      const feature = await this.createFeature(eventId, {
        gridId: grid.gridId,
        location: data.location,
        density: this.densityLevelToValue(data.densityLevel),
        count: data.peopleCount,
        sources: ['CCTV'],
      });

      return feature;
    } catch (error) {
      console.error('Error processing CCTV data:', error);
      throw error;
    }
  }

  /**
   * Process user GPS data (aggregate multiple users)
   */
  async processUserGPSData(eventId: string, users: UserGPSData[]): Promise<ProcessedFeatures[]> {
    try {
      // Group users by grid cell
      const gridGroups = new Map<string, UserGPSData[]>();

      users.forEach(user => {
        const grid = this.locationToGrid(user.location);
        if (!gridGroups.has(grid.gridId)) {
          gridGroups.set(grid.gridId, []);
        }
        gridGroups.get(grid.gridId)!.push(user);
      });

      // Create features for each grid
      const features: ProcessedFeatures[] = [];
      for (const [gridId, gridUsers] of gridGroups.entries()) {
        const avgLocation = this.calculateCentroid(gridUsers.map(u => u.location));
        const count = gridUsers.length;
        const density = count / (this.gridSize * this.gridSize / 4); // Assume 4 sq m per person

        const feature = await this.createFeature(eventId, {
          gridId,
          location: avgLocation,
          density: Math.min(1, density),
          count,
          sources: ['USER_GPS'],
        });

        features.push(feature);
      }

      return features;
    } catch (error) {
      console.error('Error processing user GPS data:', error);
      throw error;
    }
  }

  // ==================== DATA MERGING ====================

  /**
   * Merge data from multiple sources for a single grid cell
   */
  async mergeGridData(eventId: string, gridId: string, sources: ProcessedFeatures[]): Promise<ProcessedFeatures> {
    try {
      if (sources.length === 0) {
        throw new Error('No sources to merge');
      }

      // Weighted average based on source reliability
      const weights = {
        DRONE: 0.4,
        CCTV: 0.35,
        USER_GPS: 0.25,
      };

      let totalDensity = 0;
      let totalCount = 0;
      let totalWeight = 0;
      const allSources: string[] = [];

      sources.forEach(source => {
        source.sources.forEach(srcType => {
          const weight = weights[srcType as keyof typeof weights] || 0.2;
          totalDensity += source.density * weight;
          totalCount += source.count * weight;
          totalWeight += weight;
          if (!allSources.includes(srcType)) {
            allSources.push(srcType);
          }
        });
      });

      const mergedDensity = totalDensity / totalWeight;
      const mergedCount = Math.round(totalCount / totalWeight);

      // Get latest contextual data
      const weather = await this.getWeatherData(eventId);
      const social = await this.getSocialData(eventId);

      // Calculate temporal deltas
      const historical = this.getHistoricalData(eventId, gridId);
      const deltaT1 = this.calculateDelta(mergedDensity, historical, 1);
      const deltaT5 = this.calculateDelta(mergedDensity, historical, 5);
      const deltaT15 = this.calculateDelta(mergedDensity, historical, 15);

      const merged: ProcessedFeatures = {
        eventId,
        gridId,
        timestamp: new Date(),
        location: sources[0].location,
        density: mergedDensity,
        count: mergedCount,
        densityLevel: this.valueToDensityLevel(mergedDensity),
        deltaT1,
        deltaT5,
        deltaT15,
        weather,
        socialSentiment: social.sentimentScore,
        panicIndicators: social.panicLevel,
        sources: allSources,
        confidence: totalWeight / Object.values(weights).reduce((a, b) => a + b, 0),
      };

      // Store in historical data
      this.storeHistoricalData(eventId, gridId, merged);

      return merged;
    } catch (error) {
      console.error('Error merging grid data:', error);
      throw error;
    }
  }

  // ==================== FEATURE ENGINEERING ====================

  /**
   * Create processed feature set
   */
  private async createFeature(
    eventId: string,
    partial: Partial<ProcessedFeatures>
  ): Promise<ProcessedFeatures> {
    const weather = await this.getWeatherData(eventId);
    const social = await this.getSocialData(eventId);

    const historical = this.getHistoricalData(eventId, partial.gridId!);
    const deltaT1 = this.calculateDelta(partial.density || 0, historical, 1);
    const deltaT5 = this.calculateDelta(partial.density || 0, historical, 5);
    const deltaT15 = this.calculateDelta(partial.density || 0, historical, 15);

    return {
      eventId,
      gridId: partial.gridId || '',
      timestamp: new Date(),
      location: partial.location || { lat: 0, lon: 0 },
      density: partial.density || 0,
      count: partial.count || 0,
      densityLevel: this.valueToDensityLevel(partial.density || 0),
      deltaT1,
      deltaT5,
      deltaT15,
      weather,
      socialSentiment: social.sentimentScore,
      panicIndicators: social.panicLevel,
      sources: partial.sources || [],
      confidence: 0.8,
    };
  }

  // ==================== OUTPUT ====================

  /**
   * Publish processed features to Pub/Sub and BigQuery
   */
  async publishFeatures(features: ProcessedFeatures[]): Promise<void> {
    try {
      // Send to Pub/Sub for real-time ML inference
      for (const feature of features) {
        // Publish to risk engine topic via Pub/Sub
        const message = {
          eventId: feature.eventId,
          data: feature,
          gridId: feature.gridId,
          densityLevel: feature.densityLevel,
        };

        // Note: Using pubSubService would require exposing a public method
        // For now, this is a placeholder - risk engine will pull from BigQuery
        console.log('[DataPipeline] Feature ready for risk engine:', message);
      }

      // Send to BigQuery for historical training data
      const bigQueryRows = features.map(f => ({
        event_id: f.eventId,
        zone_id: f.gridId,
        timestamp: f.timestamp.toISOString(),
        density_norm: f.density,
        delta_t1: f.deltaT1,
        delta_t5: f.deltaT5,
        zone_type: 'GRID',
        time_sin: Math.sin((f.timestamp.getHours() * 60 + f.timestamp.getMinutes()) * Math.PI / 720),
        time_cos: Math.cos((f.timestamp.getHours() * 60 + f.timestamp.getMinutes()) * Math.PI / 720),
      }));

      await bigQueryFeatureService.insertFeatures(bigQueryRows);

      console.log(`Published ${features.length} processed features`);
    } catch (error) {
      console.error('Error publishing features:', error);
      throw error;
    }
  }

  // ==================== GRID MANAGEMENT ====================

  /**
   * Convert GPS location to grid cell
   */
  private locationToGrid(location: { lat: number; lon: number }): GridCell {
    const latIndex = Math.floor(location.lat / (this.gridSize / 111000));
    const lonIndex = Math.floor(location.lon / (this.gridSize / (111000 * Math.cos(location.lat * Math.PI / 180))));

    const gridId = `grid_${latIndex}_${lonIndex}`;

    if (this.gridCache.has(gridId)) {
      return this.gridCache.get(gridId)!;
    }

    const latStep = this.gridSize / 111000;
    const lonStep = this.gridSize / (111000 * Math.cos(location.lat * Math.PI / 180));

    const cell: GridCell = {
      gridId,
      lat: latIndex * latStep + latStep / 2,
      lon: lonIndex * lonStep + lonStep / 2,
      bounds: {
        north: (latIndex + 1) * latStep,
        south: latIndex * latStep,
        east: (lonIndex + 1) * lonStep,
        west: lonIndex * lonStep,
      },
    };

    this.gridCache.set(gridId, cell);
    return cell;
  }

  /**
   * Convert heatmap to grid cells
   */
  private heatmapToGridCells(center: { lat: number; lon: number }, heatmap: number[][]): any[] {
    const cells = [];
    const rows = heatmap.length;
    const cols = heatmap[0].length;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const offsetLat = (i - rows / 2) * (this.gridSize / 111000);
        const offsetLon = (j - cols / 2) * (this.gridSize / (111000 * Math.cos(center.lat * Math.PI / 180)));

        const lat = center.lat + offsetLat;
        const lon = center.lon + offsetLon;

        cells.push({
          gridId: `grid_${i}_${j}`,
          lat,
          lon,
          density: Math.min(1, heatmap[i][j]),
          count: Math.round(heatmap[i][j] * this.gridSize * this.gridSize / 4),
        });
      }
    }

    return cells;
  }

  // ==================== UTILITIES ====================

  private calculateCentroid(locations: { lat: number; lon: number }[]): { lat: number; lon: number } {
    const sum = locations.reduce(
      (acc, loc) => ({ lat: acc.lat + loc.lat, lon: acc.lon + loc.lon }),
      { lat: 0, lon: 0 }
    );
    return { lat: sum.lat / locations.length, lon: sum.lon / locations.length };
  }

  private densityLevelToValue(level: string): number {
    const map = { LOW: 0.25, MEDIUM: 0.5, HIGH: 0.75, CRITICAL: 1.0 };
    return map[level as keyof typeof map] || 0.25;
  }

  private valueToDensityLevel(value: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (value >= 0.8) return 'CRITICAL';
    if (value >= 0.6) return 'HIGH';
    if (value >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  private async getWeatherData(eventId: string): Promise<WeatherData> {
    // Integrate with Weather Service
    try {
      // Import WeatherService dynamically to avoid circular dependencies
      const { weatherService } = await import('./weather.service');

      // Get event location from cache or database
      // For now, using a default location - should be replaced with actual event location
      const defaultLocation = { lat: 37.7749, lon: -122.4194, name: 'Event Location' };

      const currentWeather = await weatherService.getCurrentWeather(
        defaultLocation.lat,
        defaultLocation.lon,
        defaultLocation.name
      );

      // Calculate heat stress index from weather data
      const heatStress = weatherService.calculateHeatStressIndex(currentWeather);

      return {
        timestamp: new Date(currentWeather.timestamp),
        temperature: currentWeather.temperature,
        humidity: currentWeather.humidity,
        windSpeed: currentWeather.windSpeed,
        condition: currentWeather.condition,
        heatIndex: heatStress.value,
      };
    } catch (error) {
      console.warn('Weather data unavailable, using defaults:', error);
      // Fallback to mock data if weather service fails
      return {
        timestamp: new Date(),
        temperature: 25,
        humidity: 60,
        windSpeed: 10,
        condition: 'clear',
        heatIndex: 0.4,
      };
    }
  }

  private async getSocialData(eventId: string): Promise<SocialData> {
    // Mock - integrate with social monitoring
    return {
      platform: 'twitter',
      timestamp: new Date(),
      sentimentScore: 0.7,
      volumeSpike: false,
      keywords: [],
      panicLevel: 0.1,
    };
  }

  private getHistoricalData(eventId: string, gridId: string): ProcessedFeatures[] {
    const key = `${eventId}_${gridId}`;
    return this.historicalData.get(key) || [];
  }

  private storeHistoricalData(eventId: string, gridId: string, feature: ProcessedFeatures): void {
    const key = `${eventId}_${gridId}`;
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, []);
    }

    const history = this.historicalData.get(key)!;
    history.push(feature);

    // Keep only last 60 minutes of data
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    this.historicalData.set(
      key,
      history.filter(f => f.timestamp > cutoff)
    );
  }

  private calculateDelta(currentDensity: number, historical: ProcessedFeatures[], minutes: number): number {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const past = historical.filter(f => f.timestamp >= cutoff);

    if (past.length === 0) return 0;

    const pastDensity = past[past.length - 1].density;
    return currentDensity - pastDensity;
  }

  private startPeriodicProcessing(): void {
    // Process buffered data every 10 seconds
    setInterval(async () => {
      for (const [key, sources] of this.processingBuffer.entries()) {
        if (sources.length > 0) {
          const [eventId] = key.split('_');
          // Process and clear buffer
          this.processingBuffer.set(key, []);
        }
      }
    }, 10000);
  }
}

export const dataProcessingPipeline = new DataProcessingPipelineService();
export default dataProcessingPipeline;
