/**
 * BigQuery Service
 * 
 * Data warehouse integration for EventSphere analytics
 * Implements streaming inserts, batch processing, and dashboard queries
 * 
 * Features:
 * - Dataset and table management
 * - Streaming inserts from Pub/Sub
 * - Real-time analytics queries
 * - Prediction history tracking
 * - Incident analytics
 * - Performance dashboards
 */

import { BigQuery, Dataset, Table } from '@google-cloud/bigquery';

export interface PredictionRecord {
  prediction_id: string;
  event_id: string;
  timestamp: string;
  prediction_time: string;
  location_id: string;
  predicted_count: number;
  confidence_score: number;
  risk_level: string;
  model_version: string;
  actual_count?: number;
  accuracy?: number;
}

export interface IncidentRecord {
  incident_id: string;
  event_id: string;
  timestamp: string;
  incident_type: string;
  severity: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  description: string;
  response_time_seconds?: number;
  resolved: boolean;
  resolved_at?: string;
}

export interface AnalyticsRecord {
  event_id: string;
  timestamp: string;
  metric_name: string;
  metric_value: number;
  dimension_1?: string;
  dimension_2?: string;
}

export class BigQueryService {
  private bigquery: BigQuery;
  private datasetId: string;
  private projectId: string;

  // Table names
  private readonly TABLES = {
    PREDICTIONS: 'crowd_predictions',
    INCIDENTS: 'incidents',
    ANALYTICS: 'event_analytics',
    VIDEO_ANALYTICS: 'video_analytics',
    SOCIAL_SIGNALS: 'social_signals',
    GPS_TRACKING: 'gps_tracking'
  };

  constructor() {
    this.projectId = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || '';
    this.datasetId = import.meta.env.BIGQUERY_DATASET || 'drishtix_analytics';

    this.bigquery = new BigQuery({
      projectId: this.projectId
    });
  }

  /**
   * Initialize BigQuery dataset and tables
   */
  async initialize(): Promise<void> {
    try {
      // Create dataset if not exists
      await this.createDataset();

      // Create all tables
      await Promise.all([
        this.createPredictionsTable(),
        this.createIncidentsTable(),
        this.createAnalyticsTable(),
        this.createVideoAnalyticsTable(),
        this.createSocialSignalsTable(),
        this.createGPSTrackingTable()
      ]);

      console.log('BigQuery initialization complete');

    } catch (error) {
      console.error('Error initializing BigQuery:', error);
      throw error;
    }
  }

  /**
   * Create dataset
   */
  private async createDataset(): Promise<void> {
    try {
      const [dataset] = await this.bigquery.dataset(this.datasetId).get({ autoCreate: true });
      console.log(`Dataset ${this.datasetId} ready`);
    } catch (error) {
      console.error('Error creating dataset:', error);
      throw error;
    }
  }

  /**
   * Create crowd predictions table
   */
  private async createPredictionsTable(): Promise<void> {
    const schema = [
      { name: 'prediction_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'prediction_time', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'location_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'predicted_count', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'confidence_score', type: 'FLOAT', mode: 'REQUIRED' },
      { name: 'risk_level', type: 'STRING', mode: 'REQUIRED' },
      { name: 'model_version', type: 'STRING', mode: 'REQUIRED' },
      { name: 'actual_count', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'accuracy', type: 'FLOAT', mode: 'NULLABLE' }
    ];

    await this.createTableIfNotExists(this.TABLES.PREDICTIONS, schema, {
      timePartitioning: {
        type: 'DAY',
        field: 'timestamp'
      },
      clustering: {
        fields: ['event_id', 'location_id']
      }
    });
  }

  /**
   * Create incidents table
   */
  private async createIncidentsTable(): Promise<void> {
    const schema = [
      { name: 'incident_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'incident_type', type: 'STRING', mode: 'REQUIRED' },
      { name: 'severity', type: 'STRING', mode: 'REQUIRED' },
      { name: 'location_lat', type: 'FLOAT', mode: 'REQUIRED' },
      { name: 'location_lng', type: 'FLOAT', mode: 'REQUIRED' },
      { name: 'location_name', type: 'STRING', mode: 'NULLABLE' },
      { name: 'description', type: 'STRING', mode: 'NULLABLE' },
      { name: 'response_time_seconds', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'resolved', type: 'BOOLEAN', mode: 'REQUIRED' },
      { name: 'resolved_at', type: 'TIMESTAMP', mode: 'NULLABLE' }
    ];

    await this.createTableIfNotExists(this.TABLES.INCIDENTS, schema, {
      timePartitioning: {
        type: 'DAY',
        field: 'timestamp'
      },
      clustering: {
        fields: ['event_id', 'severity', 'incident_type']
      }
    });
  }

  /**
   * Create analytics table
   */
  private async createAnalyticsTable(): Promise<void> {
    const schema = [
      { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'metric_name', type: 'STRING', mode: 'REQUIRED' },
      { name: 'metric_value', type: 'FLOAT', mode: 'REQUIRED' },
      { name: 'dimension_1', type: 'STRING', mode: 'NULLABLE' },
      { name: 'dimension_2', type: 'STRING', mode: 'NULLABLE' }
    ];

    await this.createTableIfNotExists(this.TABLES.ANALYTICS, schema, {
      timePartitioning: {
        type: 'DAY',
        field: 'timestamp'
      }
    });
  }

  /**
   * Create video analytics table
   */
  private async createVideoAnalyticsTable(): Promise<void> {
    const schema = [
      { name: 'analysis_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'camera_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'people_count', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'crowd_density', type: 'FLOAT', mode: 'REQUIRED' },
      { name: 'anomalies_detected', type: 'STRING', mode: 'REPEATED' },
      { name: 'confidence_score', type: 'FLOAT', mode: 'REQUIRED' }
    ];

    await this.createTableIfNotExists(this.TABLES.VIDEO_ANALYTICS, schema, {
      timePartitioning: {
        type: 'HOUR',
        field: 'timestamp'
      }
    });
  }

  /**
   * Create social signals table
   */
  private async createSocialSignalsTable(): Promise<void> {
    const schema = [
      { name: 'signal_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'event_id', type: 'STRING', mode: 'NULLABLE' },
      { name: 'source', type: 'STRING', mode: 'REQUIRED' },
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'sentiment', type: 'STRING', mode: 'REQUIRED' },
      { name: 'panic_level', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'urgency', type: 'STRING', mode: 'REQUIRED' },
      { name: 'text', type: 'STRING', mode: 'NULLABLE' }
    ];

    await this.createTableIfNotExists(this.TABLES.SOCIAL_SIGNALS, schema, {
      timePartitioning: {
        type: 'DAY',
        field: 'timestamp'
      }
    });
  }

  /**
   * Create GPS tracking table
   */
  private async createGPSTrackingTable(): Promise<void> {
    const schema = [
      { name: 'tracking_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'team_member_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'latitude', type: 'FLOAT', mode: 'REQUIRED' },
      { name: 'longitude', type: 'FLOAT', mode: 'REQUIRED' },
      { name: 'accuracy_meters', type: 'FLOAT', mode: 'NULLABLE' },
      { name: 'speed_mps', type: 'FLOAT', mode: 'NULLABLE' }
    ];

    await this.createTableIfNotExists(this.TABLES.GPS_TRACKING, schema, {
      timePartitioning: {
        type: 'DAY',
        field: 'timestamp'
      }
    });
  }

  /**
   * Generic table creation
   */
  private async createTableIfNotExists(
    tableId: string,
    schema: any[],
    options: any = {}
  ): Promise<void> {
    try {
      const table = this.bigquery.dataset(this.datasetId).table(tableId);
      const [exists] = await table.exists();

      if (!exists) {
        await this.bigquery.dataset(this.datasetId).createTable(tableId, {
          schema,
          ...options
        });
        console.log(`Table ${tableId} created`);
      } else {
        console.log(`Table ${tableId} already exists`);
      }
    } catch (error) {
      console.error(`Error creating table ${tableId}:`, error);
      throw error;
    }
  }

  /**
   * Insert prediction record
   */
  async insertPrediction(prediction: PredictionRecord): Promise<void> {
    await this.insert(this.TABLES.PREDICTIONS, [prediction]);
  }

  /**
   * Insert incident record
   */
  async insertIncident(incident: IncidentRecord): Promise<void> {
    const row = {
      ...incident,
      location_lat: incident.location.lat,
      location_lng: incident.location.lng,
      location_name: incident.location.name
    };

    await this.insert(this.TABLES.INCIDENTS, [row]);
  }

  /**
   * Insert analytics record
   */
  async insertAnalytics(analytics: AnalyticsRecord): Promise<void> {
    await this.insert(this.TABLES.ANALYTICS, [analytics]);
  }

  /**
   * Generic insert method with streaming
   */
  private async insert(tableId: string, rows: any[]): Promise<void> {
    try {
      await this.bigquery
        .dataset(this.datasetId)
        .table(tableId)
        .insert(rows, {
          skipInvalidRows: false,
          ignoreUnknownValues: false
        });

      console.log(`Inserted ${rows.length} row(s) into ${tableId}`);

    } catch (error: any) {
      if (error.name === 'PartialFailureError') {
        console.error('Some rows failed to insert:');
        error.errors.forEach((err: any) => {
          console.error(err.errors);
        });
      } else {
        console.error('Error inserting rows:', error);
      }
      throw error;
    }
  }

  /**
   * Query prediction accuracy
   */
  async queryPredictionAccuracy(eventId: string): Promise<any[]> {
    const query = `
      SELECT 
        DATE(timestamp) as date,
        AVG(accuracy) as avg_accuracy,
        COUNT(*) as total_predictions,
        AVG(ABS(predicted_count - actual_count)) as avg_error
      FROM \`${this.projectId}.${this.datasetId}.${this.TABLES.PREDICTIONS}\`
      WHERE event_id = @eventId
        AND actual_count IS NOT NULL
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30
    `;

    const options = {
      query,
      params: { eventId }
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }

  /**
   * Query incident statistics
   */
  async queryIncidentStats(eventId: string): Promise<any> {
    const query = `
      SELECT 
        incident_type,
        severity,
        COUNT(*) as count,
        AVG(response_time_seconds) as avg_response_time,
        SUM(CASE WHEN resolved THEN 1 ELSE 0 END) as resolved_count
      FROM \`${this.projectId}.${this.datasetId}.${this.TABLES.INCIDENTS}\`
      WHERE event_id = @eventId
      GROUP BY incident_type, severity
      ORDER BY count DESC
    `;

    const options = {
      query,
      params: { eventId }
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }

  /**
   * Query real-time crowd density
   */
  async queryCurrentCrowdDensity(eventId: string): Promise<any[]> {
    const query = `
      SELECT 
        location_id,
        predicted_count,
        confidence_score,
        risk_level,
        prediction_time
      FROM \`${this.projectId}.${this.datasetId}.${this.TABLES.PREDICTIONS}\`
      WHERE event_id = @eventId
        AND prediction_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 15 MINUTE)
      ORDER BY prediction_time DESC
    `;

    const options = {
      query,
      params: { eventId }
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }

  /**
   * Query sentiment trends
   */
  async querySentimentTrends(eventId: string, hours: number = 24): Promise<any[]> {
    const query = `
      SELECT 
        TIMESTAMP_TRUNC(timestamp, HOUR) as hour,
        AVG(panic_level) as avg_panic_level,
        COUNT(*) as signal_count,
        SUM(CASE WHEN urgency = 'critical' THEN 1 ELSE 0 END) as critical_count
      FROM \`${this.projectId}.${this.datasetId}.${this.TABLES.SOCIAL_SIGNALS}\`
      WHERE event_id = @eventId
        AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @hours HOUR)
      GROUP BY hour
      ORDER BY hour DESC
    `;

    const options = {
      query,
      params: { eventId, hours }
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }

  /**
   * Export data to Cloud Storage
   */
  async exportToGCS(
    tableId: string,
    destinationUri: string,
    format: 'CSV' | 'JSON' | 'AVRO' = 'JSON'
  ): Promise<void> {
    const table = this.bigquery.dataset(this.datasetId).table(tableId);

    const [job] = await table.extract(destinationUri, {
      format,
      gzip: true
    });

    console.log(`Export job ${job.id} started`);
    await job.promise();
    console.log(`Export to ${destinationUri} complete`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      const [dataset] = await this.bigquery.dataset(this.datasetId).get();
      return {
        healthy: true,
        message: `BigQuery dataset ${this.datasetId} is accessible`
      };
    } catch (error) {
      return {
        healthy: false,
        message: `BigQuery health check failed: ${error}`
      };
    }
  }
}

export default BigQueryService;
