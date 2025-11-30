/**
 * BigQuery Analytics Service
 * Historical analytics and insights from video analytics data
 * 
 * Features:
 * - Historical crowd trends analysis
 * - Event performance metrics
 * - Anomaly pattern detection
 * - Predictive insights
 * - Custom analytics queries
 */

import { BigQuery } from '@google-cloud/bigquery';
import { gcpConfig } from '../config/gcp.config';

export interface CrowdTrend {
  timestamp: string;
  averageDensity: number;
  peakDensity: number;
  totalPeople: number;
  zoneId?: string;
}

export interface AnomalyPattern {
  anomalyType: string;
  occurrences: number;
  averageConfidence: number;
  zones: string[];
  timePattern: {
    hour: number;
    count: number;
  }[];
}

export interface EventMetrics {
  eventId: string;
  eventName: string;
  startTime: Date;
  endTime: Date;
  totalAttendees: number;
  peakCrowdDensity: number;
  averageCrowdDensity: number;
  totalAnomalies: number;
  criticalAnomalies: number;
  totalAlerts: number;
  responseTimeAvg: number; // seconds
  zonesAnalyzed: number;
  camerasActive: number;
}

export interface ZoneAnalytics {
  zoneId: string;
  zoneName: string;
  averageDensity: number;
  peakDensity: number;
  peakTime: Date;
  totalPeople: number;
  dwellTimeAvg: number; // minutes
  anomalyCount: number;
  safetyScore: number; // 0-100
}

export interface PredictiveInsight {
  type: 'CROWD_SURGE' | 'BOTTLENECK' | 'ANOMALY_RISK' | 'CAPACITY_WARNING';
  confidence: number;
  zoneId: string;
  predictedTime: Date;
  description: string;
  basedOn: string[];
}

class BigQueryAnalyticsService {
  private bigquery: BigQuery;
  private readonly dataset: string;

  constructor() {
    this.bigquery = new BigQuery({
      projectId: gcpConfig.projectId,
      keyFilename: gcpConfig.credentials,
    });
    this.dataset = gcpConfig.bigquery.dataset;
    console.log('[BigQuery Analytics Service] Initialized');
  }

  /**
   * Get crowd trends over time
   */
  async getCrowdTrends(
    eventId: string,
    startTime: Date,
    endTime: Date,
    interval: '5min' | '15min' | '1hour' = '15min',
    zoneId?: string
  ): Promise<CrowdTrend[]> {
    const intervalMap = {
      '5min': 5,
      '15min': 15,
      '1hour': 60,
    };

    let query = `
      WITH time_series AS (
        SELECT 
          TIMESTAMP_TRUNC(timestamp, MINUTE, 'UTC') as minute_ts,
          zone_id,
          people_count,
          density_value
        FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`
        WHERE event_id = @eventId
          AND timestamp BETWEEN @startTime AND @endTime
    `;

    if (zoneId) {
      query += ` AND zone_id = @zoneId`;
    }

    query += `
      ),
      aggregated AS (
        SELECT 
          TIMESTAMP_TRUNC(minute_ts, MINUTE, 'UTC') as ts_bucket,
          zone_id,
          AVG(density_value) as avg_density,
          MAX(density_value) as peak_density,
          SUM(people_count) as total_people
        FROM time_series
        WHERE MOD(EXTRACT(MINUTE FROM minute_ts), ${intervalMap[interval]}) = 0
        GROUP BY ts_bucket, zone_id
      )
      SELECT 
        ts_bucket as timestamp,
        AVG(avg_density) as averageDensity,
        MAX(peak_density) as peakDensity,
        SUM(total_people) as totalPeople,
        ${zoneId ? `'${zoneId}'` : 'zone_id'} as zoneId
      FROM aggregated
      GROUP BY ts_bucket ${zoneId ? '' : ', zone_id'}
      ORDER BY ts_bucket ASC
    `;

    const [rows] = await this.bigquery.query({
      query,
      params: {
        eventId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        ...(zoneId && { zoneId }),
      },
    });

    return rows.map((row: any) => ({
      timestamp: row.timestamp.value,
      averageDensity: parseFloat(row.averageDensity),
      peakDensity: parseFloat(row.peakDensity),
      totalPeople: parseInt(row.totalPeople),
      zoneId: row.zoneId,
    }));
  }

  /**
   * Analyze anomaly patterns
   */
  async getAnomalyPatterns(
    eventId: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<AnomalyPattern[]> {
    let query = `
      WITH anomaly_data AS (
        SELECT 
          anomaly.type as anomaly_type,
          anomaly.confidence,
          zone_id,
          EXTRACT(HOUR FROM timestamp) as hour
        FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`,
        UNNEST(anomalies) as anomaly
        WHERE event_id = @eventId
    `;

    if (startTime) {
      query += ` AND timestamp >= @startTime`;
    }

    if (endTime) {
      query += ` AND timestamp <= @endTime`;
    }

    query += `
      )
      SELECT 
        anomaly_type as anomalyType,
        COUNT(*) as occurrences,
        AVG(confidence) as averageConfidence,
        ARRAY_AGG(DISTINCT zone_id) as zones,
        ARRAY_AGG(STRUCT(hour, COUNT(*) as count) ORDER BY hour) as timePattern
      FROM anomaly_data
      GROUP BY anomaly_type
      ORDER BY occurrences DESC
    `;

    const params: any = { eventId };
    if (startTime) params.startTime = startTime.toISOString();
    if (endTime) params.endTime = endTime.toISOString();

    const [rows] = await this.bigquery.query({ query, params });

    return rows.map((row: any) => ({
      anomalyType: row.anomalyType,
      occurrences: parseInt(row.occurrences),
      averageConfidence: parseFloat(row.averageConfidence),
      zones: row.zones,
      timePattern: row.timePattern,
    }));
  }

  /**
   * Get comprehensive event metrics
   */
  async getEventMetrics(eventId: string): Promise<EventMetrics> {
    const query = `
      WITH event_data AS (
        SELECT 
          event_id,
          MIN(timestamp) as start_time,
          MAX(timestamp) as end_time,
          MAX(people_count) as peak_people,
          AVG(density_value) as avg_density,
          MAX(density_value) as peak_density,
          COUNT(DISTINCT zone_id) as zones_count,
          COUNT(DISTINCT camera_id) as cameras_count
        FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`
        WHERE event_id = @eventId
        GROUP BY event_id
      ),
      anomaly_stats AS (
        SELECT 
          event_id,
          COUNT(*) as total_anomalies,
          COUNTIF(anomaly.severity = 'CRITICAL') as critical_anomalies
        FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`,
        UNNEST(anomalies) as anomaly
        WHERE event_id = @eventId
        GROUP BY event_id
      ),
      alert_stats AS (
        SELECT 
          event_id,
          COUNT(*) as total_alerts,
          AVG(TIMESTAMP_DIFF(response_time, created_at, SECOND)) as avg_response_time
        FROM \`${gcpConfig.projectId}.${this.dataset}.alerts\`
        WHERE event_id = @eventId
        GROUP BY event_id
      )
      SELECT 
        ed.event_id as eventId,
        'Event' as eventName,
        ed.start_time as startTime,
        ed.end_time as endTime,
        ed.peak_people as totalAttendees,
        ed.peak_density as peakCrowdDensity,
        ed.avg_density as averageCrowdDensity,
        COALESCE(ans.total_anomalies, 0) as totalAnomalies,
        COALESCE(ans.critical_anomalies, 0) as criticalAnomalies,
        COALESCE(als.total_alerts, 0) as totalAlerts,
        COALESCE(als.avg_response_time, 0) as responseTimeAvg,
        ed.zones_count as zonesAnalyzed,
        ed.cameras_count as camerasActive
      FROM event_data ed
      LEFT JOIN anomaly_stats ans ON ed.event_id = ans.event_id
      LEFT JOIN alert_stats als ON ed.event_id = als.event_id
    `;

    const [rows] = await this.bigquery.query({
      query,
      params: { eventId },
    });

    if (rows.length === 0) {
      throw new Error(`No metrics found for event ${eventId}`);
    }

    const row = rows[0];
    return {
      eventId: row.eventId,
      eventName: row.eventName,
      startTime: new Date(row.startTime.value),
      endTime: new Date(row.endTime.value),
      totalAttendees: parseInt(row.totalAttendees),
      peakCrowdDensity: parseFloat(row.peakCrowdDensity),
      averageCrowdDensity: parseFloat(row.averageCrowdDensity),
      totalAnomalies: parseInt(row.totalAnomalies),
      criticalAnomalies: parseInt(row.criticalAnomalies),
      totalAlerts: parseInt(row.totalAlerts),
      responseTimeAvg: parseFloat(row.responseTimeAvg),
      zonesAnalyzed: parseInt(row.zonesAnalyzed),
      camerasActive: parseInt(row.camerasActive),
    };
  }

  /**
   * Get zone-specific analytics
   */
  async getZoneAnalytics(eventId: string, zoneId?: string): Promise<ZoneAnalytics[]> {
    let query = `
      WITH zone_data AS (
        SELECT 
          zone_id,
          AVG(density_value) as avg_density,
          MAX(density_value) as peak_density,
          SUM(people_count) as total_people,
          COUNT(DISTINCT TIMESTAMP_TRUNC(timestamp, HOUR)) as hours_tracked
        FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`
        WHERE event_id = @eventId
    `;

    if (zoneId) {
      query += ` AND zone_id = @zoneId`;
    }

    query += `
        GROUP BY zone_id
      ),
      peak_times AS (
        SELECT 
          zone_id,
          timestamp as peak_time,
          density_value,
          ROW_NUMBER() OVER (PARTITION BY zone_id ORDER BY density_value DESC) as rn
        FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`
        WHERE event_id = @eventId
      ),
      anomaly_counts AS (
        SELECT 
          zone_id,
          COUNT(*) as anomaly_count
        FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`,
        UNNEST(anomalies) as anomaly
        WHERE event_id = @eventId
        GROUP BY zone_id
      )
      SELECT 
        zd.zone_id as zoneId,
        zd.zone_id as zoneName,
        zd.avg_density as averageDensity,
        zd.peak_density as peakDensity,
        pt.peak_time as peakTime,
        zd.total_people as totalPeople,
        CAST(zd.hours_tracked * 60 / GREATEST(zd.total_people, 1) as FLOAT64) as dwellTimeAvg,
        COALESCE(ac.anomaly_count, 0) as anomalyCount,
        CAST((100 - (zd.peak_density * 100)) as FLOAT64) as safetyScore
      FROM zone_data zd
      LEFT JOIN peak_times pt ON zd.zone_id = pt.zone_id AND pt.rn = 1
      LEFT JOIN anomaly_counts ac ON zd.zone_id = ac.zone_id
      ORDER BY zd.peak_density DESC
    `;

    const params: any = { eventId };
    if (zoneId) params.zoneId = zoneId;

    const [rows] = await this.bigquery.query({ query, params });

    return rows.map((row: any) => ({
      zoneId: row.zoneId,
      zoneName: row.zoneName,
      averageDensity: parseFloat(row.averageDensity),
      peakDensity: parseFloat(row.peakDensity),
      peakTime: new Date(row.peakTime.value),
      totalPeople: parseInt(row.totalPeople),
      dwellTimeAvg: parseFloat(row.dwellTimeAvg),
      anomalyCount: parseInt(row.anomalyCount),
      safetyScore: parseFloat(row.safetyScore),
    }));
  }

  /**
   * Generate predictive insights using ML
   */
  async getPredictiveInsights(eventId: string): Promise<PredictiveInsight[]> {
    // Query historical patterns
    const query = `
      WITH recent_trends AS (
        SELECT 
          zone_id,
          timestamp,
          density_value,
          LAG(density_value) OVER (PARTITION BY zone_id ORDER BY timestamp) as prev_density,
          LEAD(density_value) OVER (PARTITION BY zone_id ORDER BY timestamp) as next_density
        FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`
        WHERE event_id = @eventId
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE)
      ),
      surge_predictions AS (
        SELECT 
          zone_id,
          timestamp,
          density_value,
          prev_density,
          CASE 
            WHEN density_value > prev_density * 1.3 THEN 'SURGE_DETECTED'
            WHEN density_value > 0.7 THEN 'CAPACITY_WARNING'
            ELSE NULL
          END as prediction_type,
          density_value / NULLIF(prev_density, 0) as growth_rate
        FROM recent_trends
        WHERE prev_density IS NOT NULL
      )
      SELECT 
        zone_id as zoneId,
        prediction_type as type,
        MAX(growth_rate) as confidence,
        MAX(timestamp) as predictedTime,
        CONCAT('Zone ', zone_id, ' showing ', prediction_type) as description
      FROM surge_predictions
      WHERE prediction_type IS NOT NULL
      GROUP BY zone_id, prediction_type
      ORDER BY confidence DESC
      LIMIT 10
    `;

    const [rows] = await this.bigquery.query({
      query,
      params: { eventId },
    });

    return rows.map((row: any) => ({
      type: row.type as any,
      confidence: Math.min(parseFloat(row.confidence), 1),
      zoneId: row.zoneId,
      predictedTime: new Date(row.predictedTime.value),
      description: row.description,
      basedOn: ['Historical patterns', 'Recent trends', 'Crowd density analysis'],
    }));
  }

  /**
   * Compare events performance
   */
  async compareEvents(eventIds: string[]): Promise<any[]> {
    const query = `
      SELECT 
        event_id as eventId,
        COUNT(*) as frameCount,
        AVG(people_count) as avgPeopleCount,
        MAX(people_count) as peakPeopleCount,
        AVG(density_value) as avgDensity,
        MAX(density_value) as peakDensity,
        COUNT(DISTINCT zone_id) as zonesCount,
        SUM(ARRAY_LENGTH(anomalies)) as totalAnomalies
      FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`
      WHERE event_id IN UNNEST(@eventIds)
      GROUP BY event_id
      ORDER BY peakPeopleCount DESC
    `;

    const [rows] = await this.bigquery.query({
      query,
      params: { eventIds },
    });

    return rows;
  }

  /**
   * Get real-time analytics (last 5 minutes)
   */
  async getRealtimeAnalytics(eventId: string): Promise<any> {
    const query = `
      SELECT 
        zone_id as zoneId,
        AVG(density_value) as currentDensity,
        AVG(people_count) as currentPeopleCount,
        COUNT(*) as frameCount,
        MAX(timestamp) as lastUpdate
      FROM \`${gcpConfig.projectId}.${this.dataset}.video_analytics\`
      WHERE event_id = @eventId
        AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE)
      GROUP BY zone_id
    `;

    const [rows] = await this.bigquery.query({
      query,
      params: { eventId },
    });

    return rows;
  }

  // ========================================
  // STREAMING INSERT METHODS
  // ========================================

  /**
   * Stream video analytics data (crowd density, people count, anomalies)
   */
  async streamVideoAnalytics(data: {
    eventId: string;
    cameraId: string;
    zoneId?: string;
    timestamp: Date;
    peopleCount: number;
    densityValue: number;
    heatmapData?: any;
    anomalies?: Array<{ type: string; confidence: number; location?: any }>;
  }): Promise<void> {
    try {
      const table = this.bigquery.dataset(this.dataset).table('video_analytics');

      const row = {
        insertId: `${data.eventId}_${data.cameraId}_${data.timestamp.getTime()}`,
        json: {
          event_id: data.eventId,
          camera_id: data.cameraId,
          zone_id: data.zoneId || 'unknown',
          timestamp: data.timestamp.toISOString(),
          people_count: data.peopleCount,
          density_value: data.densityValue,
          heatmap_data: data.heatmapData ? JSON.stringify(data.heatmapData) : null,
          anomalies: data.anomalies || [],
          processed_at: new Date().toISOString(),
        },
      };

      await table.insert([row], { raw: true });
      console.log(`Streamed video analytics for event ${data.eventId}, camera ${data.cameraId}`);
    } catch (error: any) {
      console.error('Error streaming video analytics to BigQuery:', error.message);
      // Don't throw - allow app to continue even if BigQuery streaming fails
    }
  }

  /**
   * Stream weather data
   */
  async streamWeatherData(data: {
    eventId: string;
    timestamp: Date;
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherCondition: string;
    heatIndex?: number;
    heatStressLevel?: string;
  }): Promise<void> {
    try {
      const table = this.bigquery.dataset(this.dataset).table('weather_data');

      const row = {
        insertId: `${data.eventId}_${data.timestamp.getTime()}`,
        json: {
          event_id: data.eventId,
          timestamp: data.timestamp.toISOString(),
          temperature: data.temperature,
          feels_like: data.feelsLike,
          humidity: data.humidity,
          wind_speed: data.windSpeed,
          weather_condition: data.weatherCondition,
          heat_index: data.heatIndex,
          heat_stress_level: data.heatStressLevel,
          recorded_at: new Date().toISOString(),
        },
      };

      await table.insert([row], { raw: true });
      console.log(`Streamed weather data for event ${data.eventId}`);
    } catch (error: any) {
      console.error('Error streaming weather data to BigQuery:', error.message);
    }
  }

  /**
   * Stream social media sentiment data
   */
  async streamSocialMediaData(data: {
    eventId: string;
    platform: string;
    postId: string;
    timestamp: Date;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
    panicLevel?: number;
    keywords?: string[];
  }): Promise<void> {
    try {
      const table = this.bigquery.dataset(this.dataset).table('social_media_sentiment');

      const row = {
        insertId: `${data.platform}_${data.postId}`,
        json: {
          event_id: data.eventId,
          platform: data.platform,
          post_id: data.postId,
          timestamp: data.timestamp.toISOString(),
          content: data.content,
          sentiment: data.sentiment,
          sentiment_score: data.sentimentScore,
          panic_level: data.panicLevel || 0,
          keywords: data.keywords || [],
          analyzed_at: new Date().toISOString(),
        },
      };

      await table.insert([row], { raw: true });
      console.log(`Streamed social media data: ${data.platform} post ${data.postId}`);
    } catch (error: any) {
      console.error('Error streaming social media data to BigQuery:', error.message);
    }
  }

  /**
   * Stream traffic/mobility incident data
   */
  async streamTrafficIncident(data: {
    eventId: string;
    incidentId: string;
    timestamp: Date;
    source: string; // 'waze' | 'google_maps'
    type: string;
    severity: string;
    location: { lat: number; lon: number };
    description?: string;
    mobilityImpact?: number;
  }): Promise<void> {
    try {
      const table = this.bigquery.dataset(this.dataset).table('traffic_incidents');

      const row = {
        insertId: data.incidentId,
        json: {
          event_id: data.eventId,
          incident_id: data.incidentId,
          timestamp: data.timestamp.toISOString(),
          source: data.source,
          type: data.type,
          severity: data.severity,
          latitude: data.location.lat,
          longitude: data.location.lon,
          description: data.description || '',
          mobility_impact: data.mobilityImpact || 0,
          recorded_at: new Date().toISOString(),
        },
      };

      await table.insert([row], { raw: true });
      console.log(`Streamed traffic incident: ${data.incidentId}`);
    } catch (error: any) {
      console.error('Error streaming traffic incident to BigQuery:', error.message);
    }
  }

  /**
   * Stream prediction results
   */
  async streamPrediction(data: {
    eventId: string;
    predictionId: string;
    timestamp: Date;
    predictionType: string;
    predictedValue: number;
    confidence: number;
    riskLevel: string;
    zoneId?: string;
    timeHorizon?: number; // minutes
  }): Promise<void> {
    try {
      const table = this.bigquery.dataset(this.dataset).table('predictions');

      const row = {
        insertId: data.predictionId,
        json: {
          event_id: data.eventId,
          prediction_id: data.predictionId,
          timestamp: data.timestamp.toISOString(),
          prediction_type: data.predictionType,
          predicted_value: data.predictedValue,
          confidence: data.confidence,
          risk_level: data.riskLevel,
          zone_id: data.zoneId || 'global',
          time_horizon_minutes: data.timeHorizon || 15,
          created_at: new Date().toISOString(),
        },
      };

      await table.insert([row], { raw: true });
      console.log(`Streamed prediction: ${data.predictionId}`);
    } catch (error: any) {
      console.error('Error streaming prediction to BigQuery:', error.message);
    }
  }

  /**
   * Stream alert data
   */
  async streamAlert(data: {
    eventId: string;
    alertId: string;
    timestamp: Date;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    zoneId?: string;
    triggeredBy?: string;
    resolved?: boolean;
    resolvedAt?: Date;
  }): Promise<void> {
    try {
      const table = this.bigquery.dataset(this.dataset).table('alerts');

      const row = {
        insertId: data.alertId,
        json: {
          event_id: data.eventId,
          alert_id: data.alertId,
          timestamp: data.timestamp.toISOString(),
          type: data.type,
          severity: data.severity,
          title: data.title,
          description: data.description,
          zone_id: data.zoneId || 'global',
          triggered_by: data.triggeredBy || 'system',
          resolved: data.resolved || false,
          resolved_at: data.resolvedAt?.toISOString() || null,
          created_at: new Date().toISOString(),
        },
      };

      await table.insert([row], { raw: true });
      console.log(`Streamed alert: ${data.alertId} (${data.severity})`);
    } catch (error: any) {
      console.error('Error streaming alert to BigQuery:', error.message);
    }
  }

  /**
   * Batch stream multiple records (more efficient than individual inserts)
   */
  async batchStreamVideoAnalytics(dataArray: Array<{
    eventId: string;
    cameraId: string;
    zoneId?: string;
    timestamp: Date;
    peopleCount: number;
    densityValue: number;
    heatmapData?: any;
    anomalies?: Array<{ type: string; confidence: number; location?: any }>;
  }>): Promise<void> {
    if (dataArray.length === 0) return;

    try {
      const table = this.bigquery.dataset(this.dataset).table('video_analytics');

      const rows = dataArray.map(data => ({
        insertId: `${data.eventId}_${data.cameraId}_${data.timestamp.getTime()}`,
        json: {
          event_id: data.eventId,
          camera_id: data.cameraId,
          zone_id: data.zoneId || 'unknown',
          timestamp: data.timestamp.toISOString(),
          people_count: data.peopleCount,
          density_value: data.densityValue,
          heatmap_data: data.heatmapData ? JSON.stringify(data.heatmapData) : null,
          anomalies: data.anomalies || [],
          processed_at: new Date().toISOString(),
        },
      }));

      await table.insert(rows, { raw: true });
      console.log(`Batch streamed ${dataArray.length} video analytics records`);
    } catch (error: any) {
      console.error('Error batch streaming video analytics to BigQuery:', error.message);
    }
  }

  /**
   * Create streaming buffer status check
   */
  async getStreamingBufferStatus(tableName: string): Promise<any> {
    try {
      const table = this.bigquery.dataset(this.dataset).table(tableName);
      const [metadata] = await table.getMetadata();

      return {
        streamingBuffer: metadata.streamingBuffer || null,
        numBytes: metadata.numBytes,
        numRows: metadata.numRows,
      };
    } catch (error: any) {
      console.error(`Error getting streaming buffer status for ${tableName}:`, error.message);
      return null;
    }
  }
}

export const bigQueryAnalyticsService = new BigQueryAnalyticsService();
export { BigQueryAnalyticsService };
