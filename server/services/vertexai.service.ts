/**
 * Vertex AI Service Integration
 * Handles crowd density forecasting and predictive analytics
 */

import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { gcpConfig } from '../config/gcp.config';
import { drishtiXConfig } from '../config/drishtix.config';

export interface PredictionInput {
  eventId: string;
  timestamp: Date;
  gridData: GridCell[];
  historicalData?: HistoricalDensity[];
  weatherData?: WeatherData;
  socialSignals?: SocialSignals;
  mobilityData?: MobilityData;
}

export interface GridCell {
  gridId: string;
  lat: number;
  lon: number;
  density: number;
  count: number;
  timestamp: Date;
}

export interface HistoricalDensity {
  timestamp: Date;
  averageDensity: number;
  peakDensity: number;
  location: { lat: number; lon: number };
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  heatIndex?: number;
}

export interface SocialSignals {
  sentimentScore: number; // -1 to 1
  volumeSpike: boolean;
  keywords: string[];
  panicIndicators: number; // 0 to 1
}

export interface MobilityData {
  inflowRate: number;
  outflowRate: number;
  stagnationPoints: { lat: number; lon: number; severity: number }[];
}

export interface ForecastResult {
  forecastTime: Date;
  forecastHorizon: number; // minutes
  gridPredictions: GridPrediction[];
  hotspots: Hotspot[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  confidence: number;
  modelVersion: string;
}

export interface GridPrediction {
  gridId: string;
  lat: number;
  lon: number;
  predictedDensity: number;
  predictedCount: number;
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  confidence: number;
}

export interface Hotspot {
  location: { lat: number; lon: number };
  intensity: number; // 0 to 1
  radius: number; // meters
  type: 'BOTTLENECK' | 'SURGE' | 'STAGNATION' | 'CONVERGENCE';
  predictedTime: Date;
}

class VertexAIService {
  private client: PredictionServiceClient;
  private endpoint: string;

  constructor() {
    this.client = new PredictionServiceClient({
      apiEndpoint: gcpConfig.vertexAI.endpoint,
      keyFilename: gcpConfig.credentials,
    });

    this.endpoint = `projects/${gcpConfig.projectId}/locations/${gcpConfig.location}/endpoints/${gcpConfig.vertexAI.modelId}`;
  }

  /**
   * Generate crowd density forecast using Vertex AI
   */
  async generateForecast(input: PredictionInput): Promise<ForecastResult> {
    try {
      const forecastHorizon = drishtiXConfig.prediction.forecastHorizonMinutes;

      // Prepare features for the model
      const features = this.prepareFeatures(input);

      // Call Vertex AI Prediction endpoint
      const [response] = await this.client.predict({
        endpoint: this.endpoint,
        instances: [features],
      });

      // Parse predictions
      const predictions = this.parsePredictions(response, input, forecastHorizon);

      return predictions;
    } catch (error) {
      console.error('Vertex AI forecast error:', error);
      throw new Error(`Failed to generate forecast: ${error}`);
    }
  }

  /**
   * Prepare feature vectors for the model
   */
  private prepareFeatures(input: PredictionInput): any {
    const {
      gridData,
      historicalData = [],
      weatherData,
      socialSignals,
      mobilityData,
    } = input;

    // Create spatial-temporal feature grid
    const spatialFeatures = gridData.map(cell => ({
      lat: cell.lat,
      lon: cell.lon,
      density: cell.density,
      count: cell.count,
      timestamp: cell.timestamp.getTime(),
    }));

    // Historical patterns (last 24 hours, aggregated)
    const historicalFeatures = this.aggregateHistorical(historicalData);

    // Weather impact features
    const weatherFeatures = weatherData ? {
      temp: weatherData.temperature,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      heatIndex: weatherData.heatIndex || this.calculateHeatIndex(weatherData),
      condition: this.encodeWeatherCondition(weatherData.condition),
    } : null;

    // Social sentiment features
    const socialFeatures = socialSignals ? {
      sentiment: socialSignals.sentimentScore,
      volumeSpike: socialSignals.volumeSpike ? 1 : 0,
      panicLevel: socialSignals.panicIndicators,
      keywordCount: socialSignals.keywords.length,
    } : null;

    // Mobility features
    const mobilityFeatures = mobilityData ? {
      inflowRate: mobilityData.inflowRate,
      outflowRate: mobilityData.outflowRate,
      netFlow: mobilityData.inflowRate - mobilityData.outflowRate,
      stagnationCount: mobilityData.stagnationPoints.length,
    } : null;

    return {
      spatial: spatialFeatures,
      historical: historicalFeatures,
      weather: weatherFeatures,
      social: socialFeatures,
      mobility: mobilityFeatures,
      timestamp: input.timestamp.getTime(),
      eventId: input.eventId,
    };
  }

  /**
   * Parse model predictions into structured format
   */
  private parsePredictions(
    response: any,
    input: PredictionInput,
    forecastHorizon: number
  ): ForecastResult {
    const predictions = response.predictions?.[0] || {};

    const forecastTime = new Date(input.timestamp.getTime() + forecastHorizon * 60000);

    // Parse grid predictions
    const gridPredictions: GridPrediction[] = (predictions.gridPredictions || []).map(
      (pred: any) => ({
        gridId: pred.gridId,
        lat: pred.lat,
        lon: pred.lon,
        predictedDensity: pred.density,
        predictedCount: pred.count,
        densityLevel: this.classifyDensityLevel(pred.density),
        confidence: pred.confidence || 0.5,
      })
    );

    // Identify hotspots
    const hotspots = this.identifyHotspots(gridPredictions, forecastTime);

    // Calculate overall risk level
    const riskLevel = this.calculateRiskLevel(gridPredictions, hotspots);

    // Determine risk factors
    const riskFactors = this.identifyRiskFactors(input, gridPredictions, hotspots);

    return {
      forecastTime,
      forecastHorizon,
      gridPredictions,
      hotspots,
      riskLevel,
      riskFactors,
      confidence: predictions.confidence || 0.75,
      modelVersion: predictions.modelVersion || 'v1.0',
    };
  }

  /**
   * Aggregate historical data for model input
   */
  private aggregateHistorical(historical: HistoricalDensity[]): any {
    if (historical.length === 0) return null;

    const avgDensity = historical.reduce((sum, h) => sum + h.averageDensity, 0) / historical.length;
    const maxDensity = Math.max(...historical.map(h => h.peakDensity));
    const trend = this.calculateTrend(historical);

    return {
      avgDensity,
      maxDensity,
      trend,
      dataPoints: historical.length,
    };
  }

  /**
   * Calculate heat index from temperature and humidity
   */
  private calculateHeatIndex(weather: WeatherData): number {
    const T = weather.temperature;
    const RH = weather.humidity;

    // Simplified heat index formula (Fahrenheit)
    const HI = -42.379 + 2.04901523 * T + 10.14333127 * RH
      - 0.22475541 * T * RH - 6.83783e-3 * T * T
      - 5.481717e-2 * RH * RH + 1.22874e-3 * T * T * RH
      + 8.5282e-4 * T * RH * RH - 1.99e-6 * T * T * RH * RH;

    return HI;
  }

  /**
   * Encode weather condition as numeric value
   */
  private encodeWeatherCondition(condition: string): number {
    const mapping: Record<string, number> = {
      clear: 0,
      cloudy: 1,
      rain: 2,
      storm: 3,
      fog: 4,
    };
    return mapping[condition.toLowerCase()] || 0;
  }

  /**
   * Calculate trend from historical data
   */
  private calculateTrend(historical: HistoricalDensity[]): number {
    if (historical.length < 2) return 0;

    const recent = historical.slice(-5);
    const densities = recent.map(h => h.averageDensity);

    let trend = 0;
    for (let i = 1; i < densities.length; i++) {
      trend += densities[i] - densities[i - 1];
    }

    return trend / (densities.length - 1);
  }

  /**
   * Classify density level
   */
  private classifyDensityLevel(density: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (density < 0.3) return 'LOW';
    if (density < 0.6) return 'MEDIUM';
    if (density < 0.8) return 'HIGH';
    return 'VERY_HIGH';
  }

  /**
   * Identify hotspots from predictions
   */
  private identifyHotspots(predictions: GridPrediction[], forecastTime: Date): Hotspot[] {
    const threshold = drishtiXConfig.prediction.hotspotThreshold;
    const hotspots: Hotspot[] = [];

    // Find high-density cells
    const highDensityCells = predictions.filter(p => p.predictedDensity >= threshold);

    // Cluster nearby cells
    const clusters = this.clusterCells(highDensityCells);

    // Create hotspot objects
    for (const cluster of clusters) {
      const avgLat = cluster.reduce((sum, c) => sum + c.lat, 0) / cluster.length;
      const avgLon = cluster.reduce((sum, c) => sum + c.lon, 0) / cluster.length;
      const maxDensity = Math.max(...cluster.map(c => c.predictedDensity));

      hotspots.push({
        location: { lat: avgLat, lon: avgLon },
        intensity: maxDensity,
        radius: this.calculateClusterRadius(cluster),
        type: this.classifyHotspotType(cluster),
        predictedTime: forecastTime,
      });
    }

    return hotspots;
  }

  /**
   * Cluster nearby grid cells
   */
  private clusterCells(cells: GridPrediction[]): GridPrediction[][] {
    const clusters: GridPrediction[][] = [];
    const visited = new Set<string>();

    for (const cell of cells) {
      if (visited.has(cell.gridId)) continue;

      const cluster: GridPrediction[] = [cell];
      visited.add(cell.gridId);

      // Find nearby cells
      for (const other of cells) {
        if (visited.has(other.gridId)) continue;

        const distance = this.calculateDistance(cell.lat, cell.lon, other.lat, other.lon);
        if (distance < 100) { // 100 meters threshold
          cluster.push(other);
          visited.add(other.gridId);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate cluster radius
   */
  private calculateClusterRadius(cluster: GridPrediction[]): number {
    if (cluster.length === 1) return 50;

    const center = {
      lat: cluster.reduce((sum, c) => sum + c.lat, 0) / cluster.length,
      lon: cluster.reduce((sum, c) => sum + c.lon, 0) / cluster.length,
    };

    const maxDistance = Math.max(...cluster.map(c =>
      this.calculateDistance(center.lat, center.lon, c.lat, c.lon)
    ));

    return maxDistance;
  }

  /**
   * Classify hotspot type
   */
  private classifyHotspotType(cluster: GridPrediction[]): Hotspot['type'] {
    // Simple heuristic based on cluster shape and density
    if (cluster.length === 1) return 'STAGNATION';
    if (cluster.length > 10) return 'CONVERGENCE';

    const avgDensity = cluster.reduce((sum, c) => sum + c.predictedDensity, 0) / cluster.length;
    if (avgDensity > 0.9) return 'SURGE';

    return 'BOTTLENECK';
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(
    predictions: GridPrediction[],
    hotspots: Hotspot[]
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const avgDensity = predictions.reduce((sum, p) => sum + p.predictedDensity, 0) / predictions.length;
    const maxDensity = Math.max(...predictions.map(p => p.predictedDensity));
    const hotspotCount = hotspots.length;
    const criticalHotspots = hotspots.filter(h => h.intensity > 0.9).length;

    if (criticalHotspots > 0 || maxDensity > 0.95) return 'CRITICAL';
    if (hotspotCount > 3 || maxDensity > 0.85) return 'HIGH';
    if (hotspotCount > 0 || avgDensity > 0.6) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(
    input: PredictionInput,
    predictions: GridPrediction[],
    hotspots: Hotspot[]
  ): string[] {
    const factors: string[] = [];

    // High density
    const highDensityCount = predictions.filter(p => p.densityLevel === 'VERY_HIGH').length;
    if (highDensityCount > 0) {
      factors.push(`${highDensityCount} high-density zones detected`);
    }

    // Hotspots
    if (hotspots.length > 0) {
      factors.push(`${hotspots.length} hotspot(s) identified`);
    }

    // Weather
    if (input.weatherData) {
      const heatIndex = input.weatherData.heatIndex || this.calculateHeatIndex(input.weatherData);
      if (heatIndex > 90) {
        factors.push('Extreme heat stress conditions');
      }
    }

    // Social signals
    if (input.socialSignals) {
      if (input.socialSignals.panicIndicators > 0.5) {
        factors.push('Elevated social media panic indicators');
      }
      if (input.socialSignals.volumeSpike) {
        factors.push('Social media activity spike detected');
      }
    }

    // Mobility
    if (input.mobilityData) {
      const netFlow = input.mobilityData.inflowRate - input.mobilityData.outflowRate;
      if (netFlow > 0.7) {
        factors.push('High inflow rate with limited egress');
      }
    }

    return factors;
  }
}

export const vertexAIService = new VertexAIService();
export default vertexAIService;
