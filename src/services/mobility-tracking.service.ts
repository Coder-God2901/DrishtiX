/**
 * Mobility Tracking Service
 * Integrates with Google Mobility Trends for crowd movement analysis
 */

import axios from 'axios';
import Papa from 'papaparse';

interface MobilityData {
  date: string;
  region: string;
  retailRecreation: number;
  groceryPharmacy: number;
  parks: number;
  transitStations: number;
  workplaces: number;
  residential: number;
}

interface MobilityTrend {
  timestamp: string;
  eventId: string;
  inflowRate: number;
  outflowRate: number;
  currentOccupancy: number;
  predictedOccupancy: number;
  bottleneckRisk: number;
}

class MobilityTrackingService {
  private baseUrl: string;
  private cache: Map<string, MobilityData[]> = new Map();
  private cacheTTL: number = 3600000; // 1 hour

  constructor() {
    this.baseUrl =
      process.env.GOOGLE_MOBILITY_DATA_URL ||
      'https://www.gstatic.com/covid19/mobility/Global_Mobility_Report.csv';
  }

  /**
   * Fetch Google Mobility Trends data
   */
  async fetchMobilityData(
    region: string,
    startDate: Date,
    endDate: Date
  ): Promise<MobilityData[]> {
    const cacheKey = `${region}_${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log('[Mobility] Using cached data');
      return this.cache.get(cacheKey)!;
    }

    try {
      console.log('[Mobility] Fetching data from Google Mobility Reports');
      const response = await axios.get(this.baseUrl);

      // Parse CSV
      const parsed = await new Promise<any[]>((resolve, reject) => {
        Papa.parse(response.data, {
          header: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error),
        });
      });

      // Filter and transform data
      const mobilityData: MobilityData[] = parsed
        .filter((row: any) => {
          const rowDate = new Date(row.date);
          return (
            row.sub_region_1 === region &&
            rowDate >= startDate &&
            rowDate <= endDate
          );
        })
        .map((row: any) => ({
          date: row.date,
          region: row.sub_region_1,
          retailRecreation: parseFloat(
            row.retail_and_recreation_percent_change_from_baseline
          ) || 0,
          groceryPharmacy: parseFloat(
            row.grocery_and_pharmacy_percent_change_from_baseline
          ) || 0,
          parks: parseFloat(row.parks_percent_change_from_baseline) || 0,
          transitStations: parseFloat(
            row.transit_stations_percent_change_from_baseline
          ) || 0,
          workplaces: parseFloat(row.workplaces_percent_change_from_baseline) || 0,
          residential: parseFloat(
            row.residential_percent_change_from_baseline
          ) || 0,
        }));

      // Cache the results
      this.cache.set(cacheKey, mobilityData);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);

      return mobilityData;
    } catch (error) {
      console.error('[Mobility] Failed to fetch data:', error);
      throw error;
    }
  }

  /**
   * Get real-time crowd flow estimation
   */
  async getCrowdFlowEstimation(
    eventId: string,
    venueLocation: { lat: number; lon: number },
    _radius: number = 1000 // meters
  ): Promise<MobilityTrend> {
    try {
      // In production, this would integrate with real transit APIs
      // For PoC, we'll use mobility trends + synthetic data

      const now = new Date();
      const region = await this.getRegionFromCoordinates(
        venueLocation.lat,
        venueLocation.lon
      );

      const mobilityData = await this.fetchMobilityData(
        region,
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        now
      );

      // Calculate flow metrics
      const latestData = mobilityData[mobilityData.length - 1];
      const inflowRate = this.calculateInflowRate(latestData);
      const outflowRate = this.calculateOutflowRate(latestData);
      const currentOccupancy = this.estimateCurrentOccupancy(
        inflowRate,
        outflowRate
      );
      const predictedOccupancy = this.predictFutureOccupancy(
        mobilityData,
        15 // 15 minutes ahead
      );
      const bottleneckRisk = this.assessBottleneckRisk(
        currentOccupancy,
        predictedOccupancy
      );

      return {
        timestamp: now.toISOString(),
        eventId,
        inflowRate,
        outflowRate,
        currentOccupancy,
        predictedOccupancy,
        bottleneckRisk,
      };
    } catch (error) {
      console.error('[Mobility] Flow estimation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate inflow rate based on mobility trends
   */
  private calculateInflowRate(data: MobilityData): number {
    // Weighted combination of parks, transit, and retail
    const inflowScore =
      data.parks * 0.4 +
      data.transitStations * 0.3 +
      data.retailRecreation * 0.3;

    // Convert percentage change to absolute flow rate (people/minute)
    // Base rate: 100 people/min, scaled by mobility change
    return Math.max(0, 100 * (1 + inflowScore / 100));
  }

  /**
   * Calculate outflow rate
   */
  private calculateOutflowRate(data: MobilityData): number {
    // Outflow is typically lower during events
    const outflowScore =
      data.transitStations * 0.5 + data.residential * 0.5;

    return Math.max(0, 60 * (1 + outflowScore / 100));
  }

  /**
   * Estimate current venue occupancy
   */
  private estimateCurrentOccupancy(
    inflowRate: number,
    outflowRate: number
  ): number {
    // Simplified occupancy model
    // In production, this would use historical baselines
    const netFlow = inflowRate - outflowRate;
    const timeWindow = 60; // minutes
    return Math.max(0, netFlow * timeWindow);
  }

  /**
   * Predict future occupancy (15-20 min ahead)
   */
  private predictFutureOccupancy(
    historicalData: MobilityData[],
    minutesAhead: number
  ): number {
    if (historicalData.length < 2) {
      return 0;
    }

    // Simple linear trend extrapolation
    const recent = historicalData.slice(-5); // Last 5 data points
    const avgInflowChange =
      recent.reduce((sum, d) => sum + d.transitStations, 0) / recent.length;

    // Predict based on trend
    const currentOccupancy = this.estimateCurrentOccupancy(
      this.calculateInflowRate(recent[recent.length - 1]),
      this.calculateOutflowRate(recent[recent.length - 1])
    );

    const trendMultiplier = 1 + (avgInflowChange / 100) * (minutesAhead / 60);
    return currentOccupancy * trendMultiplier;
  }

  /**
   * Assess bottleneck risk
   */
  private assessBottleneckRisk(
    currentOccupancy: number,
    predictedOccupancy: number
  ): number {
    const capacityThreshold = 10000; // Example venue capacity
    const currentRatio = currentOccupancy / capacityThreshold;
    const predictedRatio = predictedOccupancy / capacityThreshold;

    // Risk increases exponentially above 70% capacity
    const currentRisk = currentRatio > 0.7 ? Math.pow(currentRatio - 0.7, 2) : 0;
    const predictedRisk =
      predictedRatio > 0.7 ? Math.pow(predictedRatio - 0.7, 2) : 0;

    return Math.min(1, (currentRisk + predictedRisk) / 2);
  }

  /**
   * Get region name from coordinates
   */
  private async getRegionFromCoordinates(
    lat: number,
    lon: number
  ): Promise<string> {
    // In production, use Google Geocoding API
    // For PoC, return simplified region based on coordinates

    // US states approximation
    if (lat > 32 && lat < 42 && lon > -124 && lon < -114) {
      return 'California';
    }
    if (lat > 40 && lat < 45 && lon > -79 && lon < -71) {
      return 'New York';
    }

    return 'Unknown';
  }

  /**
   * Get mobility trends time series
   */
  async getMobilityTimeSeries(
    region: string,
    days: number = 30
  ): Promise<Array<{ date: string; score: number }>> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const data = await this.fetchMobilityData(region, startDate, endDate);

    return data.map((d) => ({
      date: d.date,
      score: (d.parks + d.transitStations + d.retailRecreation) / 3,
    }));
  }

  /**
   * Detect anomalies in mobility patterns
   */
  detectAnomalies(
    timeSeries: Array<{ date: string; score: number }>
  ): Array<{ date: string; anomalyScore: number }> {
    const anomalies: Array<{ date: string; anomalyScore: number }> = [];

    // Calculate moving average and standard deviation
    const windowSize = 7;
    for (let i = windowSize; i < timeSeries.length; i++) {
      const window = timeSeries.slice(i - windowSize, i);
      const mean = window.reduce((sum, d) => sum + d.score, 0) / windowSize;
      const stdDev = Math.sqrt(
        window.reduce((sum, d) => sum + Math.pow(d.score - mean, 2), 0) /
        windowSize
      );

      const currentScore = timeSeries[i].score;
      const zScore = (currentScore - mean) / (stdDev || 1);

      if (Math.abs(zScore) > 2) {
        // 2 standard deviations
        anomalies.push({
          date: timeSeries[i].date,
          anomalyScore: Math.abs(zScore),
        });
      }
    }

    return anomalies;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.head(this.baseUrl, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const mobilityTrackingService = new MobilityTrackingService();
export default mobilityTrackingService;
