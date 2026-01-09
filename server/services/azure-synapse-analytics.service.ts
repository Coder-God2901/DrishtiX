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
 * Azure Synapse Analytics Service
 * Historical analytics and insights from video analytics data
 * 
 * Features:
 * - Historical crowd trends analysis
 * - Event performance metrics
 * - Anomaly pattern detection
 * - Predictive insights
 * - Custom analytics queries
 * 
 * Replaces: BigQuery Analytics Service
 */

import sql from 'mssql';
import { azureConfig } from '../config/azure.config';

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

class AzureSynapseAnalyticsService {
  private pool: sql.ConnectionPool | null = null;
  private readonly connectionConfig: sql.config;

  constructor() {
    // Azure Synapse SQL Connection Configuration
    this.connectionConfig = {
      server: azureConfig.synapse.sqlEndpoint,
      database: azureConfig.synapse.dedicatedSqlPoolName,
      authentication: {
        type: 'default',
        options: {
          userName: process.env.AZURE_SYNAPSE_USERNAME || '',
          password: process.env.AZURE_SYNAPSE_PASSWORD || '',
        },
      },
      options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
      },
    };
    console.log('[Azure Synapse Analytics Service] Initialized');
  }

  /**
   * Get SQL connection pool
   */
  private async getPool(): Promise<sql.ConnectionPool> {
    if (!this.pool || !this.pool.connected) {
      this.pool = await sql.connect(this.connectionConfig);
    }
    return this.pool;
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
    const intervalMinutes = {
      '5min': 5,
      '15min': 15,
      '1hour': 60,
    };

    const pool = await this.getPool();
    const request = pool.request();

    let query = `
      WITH time_series AS (
        SELECT 
          DATEADD(MINUTE, 
            DATEDIFF(MINUTE, 0, timestamp) / ${intervalMinutes[interval]} * ${intervalMinutes[interval]}, 
            0
          ) as ts_bucket,
          zone_id,
          people_count,
          density_value
        FROM ${azureConfig.synapse.datasets.analytics}.video_analytics
        WHERE event_id = @eventId
          AND timestamp BETWEEN @startTime AND @endTime
    `;

    request.input('eventId', sql.VarChar, eventId);
    request.input('startTime', sql.DateTime, startTime);
    request.input('endTime', sql.DateTime, endTime);

    if (zoneId) {
      query += ` AND zone_id = @zoneId`;
      request.input('zoneId', sql.VarChar, zoneId);
    }

    query += `
      )
      SELECT 
        ts_bucket as timestamp,
        AVG(density_value) as averageDensity,
        MAX(density_value) as peakDensity,
        SUM(people_count) as totalPeople,
        ${zoneId ? '@zoneId' : 'zone_id'} as zoneId
      FROM time_series
      GROUP BY ts_bucket ${zoneId ? '' : ', zone_id'}
      ORDER BY ts_bucket ASC
    `;

    const result = await request.query(query);

    return result.recordset.map((row: any) => ({
      timestamp: row.timestamp.toISOString(),
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
    const pool = await this.getPool();
    const request = pool.request();

    let query = `
      WITH anomaly_data AS (
        SELECT 
          anomaly_type,
          confidence,
          zone_id,
          DATEPART(HOUR, timestamp) as hour
        FROM ${azureConfig.synapse.datasets.analytics}.video_analytics
        CROSS APPLY OPENJSON(anomalies) 
        WITH (
          type NVARCHAR(100) '$.type',
          confidence FLOAT '$.confidence'
        ) AS anomaly_type
        WHERE event_id = @eventId
    `;

    request.input('eventId', sql.VarChar, eventId);

    if (startTime) {
      query += ` AND timestamp >= @startTime`;
      request.input('startTime', sql.DateTime, startTime);
    }

    if (endTime) {
      query += ` AND timestamp <= @endTime`;
      request.input('endTime', sql.DateTime, endTime);
    }

    query += `
      ),
      hourly_counts AS (
        SELECT 
          anomaly_type as anomalyType,
          hour,
          COUNT(*) as count
        FROM anomaly_data
        GROUP BY anomaly_type, hour
      )
      SELECT 
        ad.anomaly_type as anomalyType,
        COUNT(*) as occurrences,
        AVG(ad.confidence) as averageConfidence,
        STRING_AGG(DISTINCT ad.zone_id, ',') as zones,
        (
          SELECT hc.hour, hc.count
          FROM hourly_counts hc
          WHERE hc.anomalyType = ad.anomaly_type
          FOR JSON PATH
        ) as timePattern
      FROM anomaly_data ad
      GROUP BY ad.anomaly_type
      ORDER BY COUNT(*) DESC
    `;

    const result = await request.query(query);

    return result.recordset.map((row: any) => ({
      anomalyType: row.anomalyType,
      occurrences: parseInt(row.occurrences),
      averageConfidence: parseFloat(row.averageConfidence),
      zones: row.zones ? row.zones.split(',') : [],
      timePattern: row.timePattern ? JSON.parse(row.timePattern) : [],
    }));
  }

  /**
   * Get comprehensive event metrics
   */
  async getEventMetrics(eventId: string): Promise<EventMetrics> {
    const pool = await this.getPool();
    const request = pool.request();

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
        FROM ${azureConfig.synapse.datasets.analytics}.video_analytics
        WHERE event_id = @eventId
        GROUP BY event_id
      ),
      anomaly_stats AS (
        SELECT 
          event_id,
          COUNT(*) as total_anomalies,
          SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_anomalies
        FROM ${azureConfig.synapse.datasets.analytics}.video_analytics
        CROSS APPLY OPENJSON(anomalies)
        WITH (severity NVARCHAR(50) '$.severity') AS anomaly
        WHERE event_id = @eventId
        GROUP BY event_id
      ),
      alert_stats AS (
        SELECT 
          event_id,
          COUNT(*) as total_alerts,
          AVG(DATEDIFF(SECOND, created_at, response_time)) as avg_response_time
        FROM ${azureConfig.synapse.datasets.analytics}.alerts
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
        ISNULL(ans.total_anomalies, 0) as totalAnomalies,
        ISNULL(ans.critical_anomalies, 0) as criticalAnomalies,
        ISNULL(als.total_alerts, 0) as totalAlerts,
        ISNULL(als.avg_response_time, 0) as responseTimeAvg,
        ed.zones_count as zonesAnalyzed,
        ed.cameras_count as camerasActive
      FROM event_data ed
      LEFT JOIN anomaly_stats ans ON ed.event_id = ans.event_id
      LEFT JOIN alert_stats als ON ed.event_id = als.event_id
    `;

    request.input('eventId', sql.VarChar, eventId);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      throw new Error(`No metrics found for event ${eventId}`);
    }

    const row = result.recordset[0];
    return {
      eventId: row.eventId,
      eventName: row.eventName,
      startTime: new Date(row.startTime),
      endTime: new Date(row.endTime),
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
    const pool = await this.getPool();
    const request = pool.request();

    let query = `
      WITH zone_data AS (
        SELECT 
          zone_id,
          zone_name,
          AVG(density_value) as avg_density,
          MAX(density_value) as peak_density,
          timestamp as peak_time,
          SUM(people_count) as total_people,
          AVG(dwell_time_minutes) as dwell_avg
        FROM ${azureConfig.synapse.datasets.analytics}.video_analytics
        WHERE event_id = @eventId
    `;

    request.input('eventId', sql.VarChar, eventId);

    if (zoneId) {
      query += ` AND zone_id = @zoneId`;
      request.input('zoneId', sql.VarChar, zoneId);
    }

    query += `
        GROUP BY zone_id, zone_name, timestamp
      ),
      anomaly_counts AS (
        SELECT 
          zone_id,
          COUNT(*) as anomaly_count
        FROM ${azureConfig.synapse.datasets.analytics}.video_analytics
        CROSS APPLY OPENJSON(anomalies) AS anomaly
        WHERE event_id = @eventId
    `;

    if (zoneId) {
      query += ` AND zone_id = @zoneId`;
    }

    query += `
        GROUP BY zone_id
      )
      SELECT 
        zd.zone_id as zoneId,
        zd.zone_name as zoneName,
        AVG(zd.avg_density) as averageDensity,
        MAX(zd.peak_density) as peakDensity,
        (SELECT TOP 1 peak_time FROM zone_data WHERE peak_density = MAX(zd.peak_density)) as peakTime,
        SUM(zd.total_people) as totalPeople,
        AVG(zd.dwell_avg) as dwellTimeAvg,
        ISNULL(ac.anomaly_count, 0) as anomalyCount,
        100.0 - (ISNULL(ac.anomaly_count, 0) * 10.0) as safetyScore
      FROM zone_data zd
      LEFT JOIN anomaly_counts ac ON zd.zone_id = ac.zone_id
      GROUP BY zd.zone_id, zd.zone_name, ac.anomaly_count
      ORDER BY safetyScore DESC
    `;

    const result = await request.query(query);

    return result.recordset.map((row: any) => ({
      zoneId: row.zoneId,
      zoneName: row.zoneName,
      averageDensity: parseFloat(row.averageDensity),
      peakDensity: parseFloat(row.peakDensity),
      peakTime: new Date(row.peakTime),
      totalPeople: parseInt(row.totalPeople),
      dwellTimeAvg: parseFloat(row.dwellTimeAvg),
      anomalyCount: parseInt(row.anomalyCount),
      safetyScore: parseFloat(row.safetyScore),
    }));
  }

  /**
   * Stream video analytics data to Synapse
   */
  async streamVideoAnalytics(data: any): Promise<void> {
    try {
      const pool = await this.getPool();
      const request = pool.request();

      const query = `
        INSERT INTO ${azureConfig.synapse.datasets.analytics}.video_analytics
        (event_id, camera_id, zone_id, zone_name, timestamp, people_count, density_value, anomalies, metadata)
        VALUES (@eventId, @cameraId, @zoneId, @zoneName, @timestamp, @peopleCount, @densityValue, @anomalies, @metadata)
      `;

      request.input('eventId', sql.VarChar, data.eventId);
      request.input('cameraId', sql.VarChar, data.cameraId);
      request.input('zoneId', sql.VarChar, data.zoneId);
      request.input('zoneName', sql.VarChar, data.zoneName);
      request.input('timestamp', sql.DateTime, new Date(data.timestamp));
      request.input('peopleCount', sql.Int, data.peopleCount);
      request.input('densityValue', sql.Float, data.densityValue);
      request.input('anomalies', sql.NVarChar, JSON.stringify(data.anomalies || []));
      request.input('metadata', sql.NVarChar, JSON.stringify(data.metadata || {}));

      await request.query(query);
      console.log('[Synapse] Streamed video analytics data');
    } catch (error) {
      console.error('[Synapse] Error streaming video analytics:', error);
      throw error;
    }
  }

  /**
   * Stream weather data to Synapse
   */
  async streamWeatherData(data: any): Promise<void> {
    try {
      const pool = await this.getPool();
      const request = pool.request();

      const query = `
        INSERT INTO ${azureConfig.synapse.datasets.analytics}.weather_data
        (event_id, timestamp, temperature, humidity, wind_speed, conditions, metadata)
        VALUES (@eventId, @timestamp, @temperature, @humidity, @windSpeed, @conditions, @metadata)
      `;

      request.input('eventId', sql.VarChar, data.eventId);
      request.input('timestamp', sql.DateTime, new Date(data.timestamp));
      request.input('temperature', sql.Float, data.temperature);
      request.input('humidity', sql.Float, data.humidity);
      request.input('windSpeed', sql.Float, data.windSpeed);
      request.input('conditions', sql.VarChar, data.conditions);
      request.input('metadata', sql.NVarChar, JSON.stringify(data.metadata || {}));

      await request.query(query);
      console.log('[Synapse] Streamed weather data');
    } catch (error) {
      console.error('[Synapse] Error streaming weather data:', error);
      throw error;
    }
  }

  /**
   * Get predictive insights based on historical patterns
   */
  async getPredictiveInsights(eventId: string): Promise<PredictiveInsight[]> {
    const pool = await this.getPool();
    const request = pool.request();

    // Simplified predictive analysis using historical patterns
    const query = `
      WITH recent_trends AS (
        SELECT 
          zone_id,
          AVG(density_value) as avg_density,
          MAX(density_value) as max_density,
          STDEV(density_value) as density_std
        FROM ${azureConfig.synapse.datasets.analytics}.video_analytics
        WHERE event_id = @eventId
          AND timestamp >= DATEADD(MINUTE, -30, GETDATE())
        GROUP BY zone_id
      )
      SELECT 
        CASE 
          WHEN max_density > avg_density + (2 * density_std) THEN 'CROWD_SURGE'
          WHEN avg_density > 0.8 THEN 'CAPACITY_WARNING'
          ELSE 'ANOMALY_RISK'
        END as type,
        (max_density - avg_density) / NULLIF(density_std, 0) as confidence,
        zone_id as zoneId,
        DATEADD(MINUTE, 15, GETDATE()) as predictedTime,
        'Predicted based on recent density patterns' as description
      FROM recent_trends
      WHERE max_density > avg_density + density_std
      ORDER BY confidence DESC
    `;

    request.input('eventId', sql.VarChar, eventId);
    const result = await request.query(query);

    return result.recordset.map((row: any) => ({
      type: row.type as PredictiveInsight['type'],
      confidence: Math.min(parseFloat(row.confidence) / 10, 1),
      zoneId: row.zoneId,
      predictedTime: new Date(row.predictedTime),
      description: row.description,
      basedOn: ['historical_density', 'recent_trends'],
    }));
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log('[Synapse] Connection pool closed');
    }
  }
}

// Export singleton instance
export const azureSynapseAnalyticsService = new AzureSynapseAnalyticsService();
export default azureSynapseAnalyticsService;
