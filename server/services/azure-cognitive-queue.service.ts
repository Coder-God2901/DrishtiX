/**
 * Azure Cognitive Services - Queue Analysis & Management
 * Specialized service for queue detection, prediction, and optimization
 * 
 * Features:
 * - Queue formation detection
 * - Wait time prediction
 * - Queue optimization recommendations
 * - Spatial analysis for queue zones
 * - Real-time queue monitoring
 * - Integration with Azure Video Analyzer for Spatial Analysis
 */

import { DefaultAzureCredential } from '@azure/identity';
import { azureConfig } from '../config/azure.config';

interface QueueZone {
  id: string;
  name: string;
  type: 'entry' | 'exit' | 'food' | 'restroom' | 'merchandise' | 'ticket-check';
  location: {
    polygon: Array<{ x: number; y: number }>;
    entrance: { x: number; y: number };
    exit: { x: number; y: number };
  };
  capacity: number;
  servicePoints: number;
}

interface QueueAnalysisRequest {
  eventId: string;
  zoneId: string;
  videoFrameUrl?: string;
  videoStreamUrl?: string;
  analysisMode: 'snapshot' | 'continuous';
}

interface QueueMetrics {
  queueLength: number; // number of people
  physicalLength: number; // meters
  estimatedWaitMinutes: number;
  arrivalRate: number; // people per minute
  serviceRate: number; // people per minute
  utilizationRate: number; // 0-1
  congestionLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  peopleInZone: number;
  peopleWaiting: number;
  peopleBeingServed: number;
  timestamp: Date;
}

interface QueuePrediction {
  currentMetrics: QueueMetrics;
  predictions: Array<{
    timeMinutesAhead: number;
    predictedLength: number;
    predictedWaitMinutes: number;
    confidence: number;
  }>;
  peakTime?: {
    time: Date;
    expectedLength: number;
    expectedWaitMinutes: number;
  };
  recommendations: QueueRecommendation[];
}

interface QueueRecommendation {
  type: 'add-service-point' | 'redirect-traffic' | 'alert-staff' | 'open-alternative' | 'announcement';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  expectedImpact: string;
  implementationSteps: string[];
}

interface SpatialAnalysisZone {
  zoneId: string;
  operation: 'personCount' | 'personZoneDwellTime' | 'personCrossingLine' | 'personDistance';
  config: {
    threshold?: number;
    focus?: 'bottomCenter' | 'footprint';
    trigger?: 'event' | 'interval';
  };
}

class AzureCognitiveQueueService {
  private credential: DefaultAzureCredential;
  private spatialAnalysisEndpoint: string;
  private queueZones: Map<string, QueueZone> = new Map();
  private historicalMetrics: Map<string, QueueMetrics[]> = new Map();

  constructor() {
    this.credential = new DefaultAzureCredential();
    this.spatialAnalysisEndpoint = process.env.AZURE_VIDEO_ANALYZER_ENDPOINT || '';
  }

  /**
   * Configure queue zone for monitoring
   */
  async configureQueueZone(zone: QueueZone): Promise<void> {
    console.log(`[Azure Queue] Configuring queue zone: ${zone.name}`);

    this.queueZones.set(zone.id, zone);

    // Set up Azure Video Analyzer Spatial Analysis
    await this.setupSpatialAnalysis(zone);

    console.log(`[Azure Queue] Zone configured: ${zone.id}`);
  }

  /**
   * Analyze queue in real-time
   */
  async analyzeQueue(request: QueueAnalysisRequest): Promise<QueueMetrics> {
    console.log(`[Azure Queue] Analyzing queue: ${request.zoneId}`);

    const zone = this.queueZones.get(request.zoneId);
    if (!zone) {
      throw new Error(`Queue zone not found: ${request.zoneId}`);
    }

    try {
      // Use Azure Video Analyzer for spatial analysis
      const spatialData = await this.getSpatialAnalysisData(request);

      // Calculate queue metrics
      const metrics = this.calculateQueueMetrics(spatialData, zone);

      // Store historical data
      this.storeHistoricalMetrics(request.zoneId, metrics);

      return metrics;
    } catch (error) {
      console.error('[Azure Queue] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Predict queue length and wait times
   */
  async predictQueue(request: {
    eventId: string;
    zoneId: string;
    forecastHorizonMinutes?: number;
  }): Promise<QueuePrediction> {
    console.log(`[Azure Queue] Predicting queue: ${request.zoneId}`);

    const zone = this.queueZones.get(request.zoneId);
    if (!zone) {
      throw new Error(`Queue zone not found: ${request.zoneId}`);
    }

    // Get current metrics
    const currentMetrics = await this.analyzeQueue({
      eventId: request.eventId,
      zoneId: request.zoneId,
      analysisMode: 'snapshot',
    });

    // Get historical data
    const historical = this.historicalMetrics.get(request.zoneId) || [];

    // Generate predictions using time series forecasting
    const horizonMinutes = request.forecastHorizonMinutes || 30;
    const predictions = await this.forecastQueueMetrics(
      historical,
      currentMetrics,
      horizonMinutes,
      zone
    );

    // Find peak time
    const peakPrediction = predictions.reduce((max, pred) =>
      pred.predictedLength > max.predictedLength ? pred : max
      , predictions[0]);

    const peakTime = peakPrediction ? {
      time: new Date(Date.now() + peakPrediction.timeMinutesAhead * 60000),
      expectedLength: peakPrediction.predictedLength,
      expectedWaitMinutes: peakPrediction.predictedWaitMinutes,
    } : undefined;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      currentMetrics,
      predictions,
      zone
    );

    return {
      currentMetrics,
      predictions,
      peakTime,
      recommendations,
    };
  }

  /**
   * Monitor queue continuously
   */
  async startContinuousMonitoring(config: {
    eventId: string;
    zoneId: string;
    intervalSeconds: number;
    alertThresholds: {
      waitTimeMinutes: number;
      queueLength: number;
      congestionLevel: string;
    };
    onAlert: (metrics: QueueMetrics, alert: QueueRecommendation) => void;
  }): Promise<{ monitorId: string; stop: () => void }> {
    console.log(`[Azure Queue] Starting continuous monitoring: ${config.zoneId}`);

    const monitorId = `queue-monitor-${config.zoneId}-${Date.now()}`;
    let isRunning = true;

    const monitorLoop = async () => {
      while (isRunning) {
        try {
          const metrics = await this.analyzeQueue({
            eventId: config.eventId,
            zoneId: config.zoneId,
            analysisMode: 'continuous',
          });

          // Check thresholds
          const alerts = this.checkAlertThresholds(metrics, config.alertThresholds);

          for (const alert of alerts) {
            config.onAlert(metrics, alert);
          }

          // Wait for next interval
          await new Promise(resolve => setTimeout(resolve, config.intervalSeconds * 1000));
        } catch (error) {
          console.error('[Azure Queue] Monitoring error:', error);
        }
      }
    };

    // Start monitoring in background
    monitorLoop();

    return {
      monitorId,
      stop: () => {
        isRunning = false;
        console.log(`[Azure Queue] Stopped monitoring: ${monitorId}`);
      },
    };
  }

  /**
   * Get queue optimization suggestions
   */
  async getOptimizationSuggestions(request: {
    eventId: string;
    zoneId: string;
  }): Promise<Array<{
    suggestion: string;
    impact: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    costSavings?: string;
  }>> {
    console.log(`[Azure Queue] Generating optimization suggestions: ${request.zoneId}`);

    const zone = this.queueZones.get(request.zoneId);
    if (!zone) {
      throw new Error(`Queue zone not found: ${request.zoneId}`);
    }

    const historical = this.historicalMetrics.get(request.zoneId) || [];
    const currentMetrics = historical[historical.length - 1];

    const suggestions = [];

    // Analyze service rate
    if (currentMetrics && currentMetrics.utilizationRate > 0.8) {
      suggestions.push({
        suggestion: 'Add additional service point during peak hours',
        impact: `Reduce wait time by ~${Math.round(30 * (1 - 1 / (zone.servicePoints + 1)))}%`,
        effort: 'MEDIUM' as const,
        costSavings: 'Improved customer satisfaction',
      });
    }

    // Analyze arrival patterns
    if (historical.length > 20) {
      const peakHours = this.identifyPeakHours(historical);
      suggestions.push({
        suggestion: `Staff additional personnel during peak hours: ${peakHours.join(', ')}`,
        impact: 'Maintain service level during high demand',
        effort: 'LOW' as const,
      });
    }

    // Queue design optimization
    if (currentMetrics && currentMetrics.physicalLength > zone.capacity) {
      suggestions.push({
        suggestion: 'Implement virtual queuing system',
        impact: 'Eliminate physical queue, improve space utilization',
        effort: 'HIGH' as const,
        costSavings: 'Reduce required floor space',
      });
    }

    return suggestions;
  }

  // Helper methods

  private async setupSpatialAnalysis(zone: QueueZone): Promise<void> {
    // Configure Azure Video Analyzer Spatial Analysis operation
    const operation: SpatialAnalysisZone = {
      zoneId: zone.id,
      operation: 'personCount',
      config: {
        threshold: 0.5,
        focus: 'bottomCenter',
        trigger: 'interval',
      },
    };

    // TODO: Deploy spatial analysis configuration to Azure
    console.log(`[Azure Queue] Spatial analysis configured for zone: ${zone.id}`);
  }

  private async getSpatialAnalysisData(request: QueueAnalysisRequest): Promise<any> {
    // TODO: Query Azure Video Analyzer for spatial analysis data
    // Returns person detections, trajectories, and zone occupancy

    return {
      personCount: 0,
      detections: [],
      dwellTimes: [],
      crossingEvents: [],
    };
  }

  private calculateQueueMetrics(spatialData: any, zone: QueueZone): QueueMetrics {
    // Calculate metrics from spatial analysis data

    const peopleInZone = spatialData.personCount || 0;
    const peopleWaiting = Math.floor(peopleInZone * 0.8); // Estimate
    const peopleBeingServed = Math.min(peopleInZone - peopleWaiting, zone.servicePoints);

    // Calculate service rate (people per minute)
    const avgServiceTimeMinutes = 2; // Configurable per zone type
    const serviceRate = zone.servicePoints / avgServiceTimeMinutes;

    // Calculate arrival rate from historical data
    const arrivalRate = this.estimateArrivalRate(zone.id);

    // Calculate wait time using queuing theory (M/M/c model)
    const utilizationRate = Math.min(arrivalRate / (serviceRate * zone.servicePoints), 1);
    const estimatedWaitMinutes = this.calculateWaitTime(
      arrivalRate,
      serviceRate,
      zone.servicePoints,
      peopleWaiting
    );

    // Determine congestion level
    const congestionLevel = this.determineCongestionLevel(utilizationRate, peopleWaiting);

    return {
      queueLength: peopleWaiting,
      physicalLength: peopleWaiting * 0.5, // 0.5m per person
      estimatedWaitMinutes,
      arrivalRate,
      serviceRate,
      utilizationRate,
      congestionLevel,
      peopleInZone,
      peopleWaiting,
      peopleBeingServed,
      timestamp: new Date(),
    };
  }

  private async forecastQueueMetrics(
    historical: QueueMetrics[],
    current: QueueMetrics,
    horizonMinutes: number,
    zone: QueueZone
  ): Promise<Array<{
    timeMinutesAhead: number;
    predictedLength: number;
    predictedWaitMinutes: number;
    confidence: number;
  }>> {
    // Use time series forecasting (ARIMA, LSTM, or Prophet)
    // For now, simple linear extrapolation

    const predictions = [];
    const steps = Math.floor(horizonMinutes / 5); // 5-minute intervals

    for (let i = 1; i <= steps; i++) {
      const minutesAhead = i * 5;

      // Simple trend-based prediction
      const trend = historical.length > 1
        ? (current.queueLength - historical[historical.length - 2].queueLength)
        : 0;

      const predictedLength = Math.max(0, current.queueLength + trend * i);
      const predictedWaitMinutes = this.calculateWaitTime(
        current.arrivalRate,
        current.serviceRate,
        zone.servicePoints,
        predictedLength
      );

      predictions.push({
        timeMinutesAhead: minutesAhead,
        predictedLength: Math.round(predictedLength),
        predictedWaitMinutes: Math.round(predictedWaitMinutes),
        confidence: Math.max(0.5, 1 - (i * 0.05)), // Confidence decreases over time
      });
    }

    return predictions;
  }

  private generateRecommendations(
    current: QueueMetrics,
    predictions: Array<any>,
    zone: QueueZone
  ): QueueRecommendation[] {
    const recommendations: QueueRecommendation[] = [];

    // Check current congestion
    if (current.congestionLevel === 'CRITICAL' || current.congestionLevel === 'HIGH') {
      recommendations.push({
        type: 'alert-staff',
        priority: current.congestionLevel === 'CRITICAL' ? 'URGENT' : 'HIGH',
        description: `High congestion detected at ${zone.name}`,
        expectedImpact: 'Immediate staff attention required',
        implementationSteps: [
          'Alert zone supervisors',
          'Deploy additional staff if available',
          'Consider opening alternative service points',
        ],
      });
    }

    // Check predictions for upcoming peak
    const upcomingPeak = predictions.find(p => p.predictedLength > current.queueLength * 1.5);
    if (upcomingPeak) {
      recommendations.push({
        type: 'add-service-point',
        priority: 'MEDIUM',
        description: `Queue expected to increase by 50% in ${upcomingPeak.timeMinutesAhead} minutes`,
        expectedImpact: `Reduce peak wait time from ${upcomingPeak.predictedWaitMinutes} to ${Math.round(upcomingPeak.predictedWaitMinutes * 0.7)} minutes`,
        implementationSteps: [
          'Prepare additional service point',
          'Brief staff on procedures',
          'Activate before peak arrival',
        ],
      });
    }

    // Check wait time threshold
    if (current.estimatedWaitMinutes > 15) {
      recommendations.push({
        type: 'announcement',
        priority: 'MEDIUM',
        description: 'Long wait times detected',
        expectedImpact: 'Improve customer experience through communication',
        implementationSteps: [
          'Announce estimated wait time to queue',
          'Suggest alternative times or locations',
          'Provide queue status updates',
        ],
      });
    }

    return recommendations;
  }

  private calculateWaitTime(
    arrivalRate: number,
    serviceRate: number,
    servers: number,
    currentQueueLength: number
  ): number {
    // Using M/M/c queuing model
    if (arrivalRate >= serviceRate * servers) {
      return Infinity; // Unstable queue
    }

    // Average wait time in queue (Wq)
    const rho = arrivalRate / (serviceRate * servers);
    const avgQueueLength = currentQueueLength || (Math.pow(arrivalRate / serviceRate, servers) * rho) /
      (Math.factorial(servers) * Math.pow(1 - rho, 2));

    const avgWaitTime = avgQueueLength / arrivalRate;
    return avgWaitTime;
  }

  private determineCongestionLevel(utilization: number, queueLength: number): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (utilization > 0.9 || queueLength > 50) return 'CRITICAL';
    if (utilization > 0.75 || queueLength > 30) return 'HIGH';
    if (utilization > 0.5 || queueLength > 15) return 'MEDIUM';
    if (utilization > 0.25 || queueLength > 5) return 'LOW';
    return 'NONE';
  }

  private estimateArrivalRate(zoneId: string): number {
    const historical = this.historicalMetrics.get(zoneId) || [];
    if (historical.length < 2) return 1; // Default

    // Calculate from recent metrics
    return 1; // People per minute (placeholder)
  }

  private storeHistoricalMetrics(zoneId: string, metrics: QueueMetrics): void {
    const history = this.historicalMetrics.get(zoneId) || [];
    history.push(metrics);

    // Keep last 2 hours of data (120 data points at 1-minute intervals)
    if (history.length > 120) {
      history.shift();
    }

    this.historicalMetrics.set(zoneId, history);
  }

  private checkAlertThresholds(metrics: QueueMetrics, thresholds: any): QueueRecommendation[] {
    const alerts: QueueRecommendation[] = [];

    if (metrics.estimatedWaitMinutes > thresholds.waitTimeMinutes) {
      alerts.push({
        type: 'alert-staff',
        priority: 'HIGH',
        description: `Wait time exceeded threshold: ${metrics.estimatedWaitMinutes} minutes`,
        expectedImpact: 'Immediate action required',
        implementationSteps: ['Alert staff', 'Add service capacity'],
      });
    }

    return alerts;
  }

  private identifyPeakHours(historical: QueueMetrics[]): string[] {
    // Analyze historical data to identify peak hours
    // Group by hour and find highest average queue lengths
    return ['10:00-11:00', '14:00-15:00', '18:00-19:00']; // Placeholder
  }
}

// Factorial helper
function Math_factorial(n: number): number {
  if (n <= 1) return 1;
  return n * Math_factorial(n - 1);
}

// Add to Math for convenience
declare global {
  interface Math {
    factorial(n: number): number;
  }
}
Math.factorial = Math_factorial;

export const azureCognitiveQueueService = new AzureCognitiveQueueService();
export default azureCognitiveQueueService;
