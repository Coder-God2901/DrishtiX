/**
 * Cloud Dataflow Pipeline Service
 * 
 * Manages Apache Beam pipelines for multi-source data fusion
 * Combines GPS, video analytics, and social signals for real-time insights
 * 
 * Features:
 * - Real-time streaming transformations
 * - Multi-source data fusion
 * - Windowing and aggregation
 * - BigQuery output
 * - Pub/Sub integration
 */

import { PubSub } from '@google-cloud/pubsub';
import { BigQuery } from '@google-cloud/bigquery';

export interface DataFlowPipeline {
  name: string;
  region: string;
  status: 'running' | 'stopped' | 'failed';
  inputTopics: string[];
  outputTable: string;
  transformations: string[];
}

export interface FusedDataRecord {
  event_id: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    zone: string;
  };
  crowd_metrics: {
    predicted_count?: number;
    actual_count?: number;
    density_level?: string;
  };
  sentiment_metrics: {
    avg_panic_level?: number;
    signal_count?: number;
    dominant_sentiment?: string;
  };
  gps_metrics: {
    team_members_present?: number;
    response_time_avg?: number;
  };
  video_metrics: {
    people_detected?: number;
    anomalies?: string[];
  };
  risk_score: number;
  alerts_triggered: string[];
}

export class DataFlowPipelineService {
  private pubsubClient: PubSub;
  private bigqueryClient: BigQuery;
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.pubsubClient = new PubSub({ projectId });
    this.bigqueryClient = new BigQuery({ projectId });
  }

  /**
   * Create Pub/Sub to BigQuery subscriptions for each data source
   * This replaces the need for complex Dataflow jobs for simple streaming
   */
  async setupStreamingPipelines(): Promise<void> {
    const pipelines = [
      {
        topic: 'video-analytics',
        subscription: 'video-analytics-to-bigquery',
        table: 'drishtix_analytics.video_analytics'
      },
      {
        topic: 'social-signals',
        subscription: 'social-signals-to-bigquery',
        table: 'drishtix_analytics.social_signals'
      },
      {
        topic: 'gps-tracking',
        subscription: 'gps-tracking-to-bigquery',
        table: 'drishtix_analytics.gps_tracking'
      },
      {
        topic: 'crowd-predictions',
        subscription: 'predictions-to-bigquery',
        table: 'drishtix_analytics.crowd_predictions'
      },
      {
        topic: 'incident-alerts',
        subscription: 'incidents-to-bigquery',
        table: 'drishtix_analytics.incidents'
      }
    ];

    for (const pipeline of pipelines) {
      await this.createBigQuerySubscription(
        pipeline.topic,
        pipeline.subscription,
        pipeline.table
      );
    }

    console.log('All streaming pipelines configured');
  }

  /**
   * Create a Pub/Sub subscription that writes directly to BigQuery
   */
  private async createBigQuerySubscription(
    topicName: string,
    subscriptionName: string,
    tableId: string
  ): Promise<void> {
    try {
      const topic = this.pubsubClient.topic(topicName);

      // Check if subscription already exists
      const [subscriptions] = await topic.getSubscriptions();
      const exists = subscriptions.some(sub => sub.name.endsWith(subscriptionName));

      if (exists) {
        console.log(`Subscription ${subscriptionName} already exists`);
        return;
      }

      // Create BigQuery subscription
      const [subscription] = await topic.createSubscription(subscriptionName, {
        bigqueryConfig: {
          table: tableId,
          writeMetadata: true
        },
        deadLetterPolicy: {
          deadLetterTopic: `projects/${this.projectId}/topics/dead-letter`,
          maxDeliveryAttempts: 5
        },
        retryPolicy: {
          minimumBackoff: { seconds: 10 },
          maximumBackoff: { seconds: 600 }
        }
      });

      console.log(`Created BigQuery subscription: ${subscription.name}`);

    } catch (error) {
      console.error(`Error creating subscription ${subscriptionName}:`, error);
      throw error;
    }
  }

  /**
   * Fuse data from multiple sources using time-based windowing
   * This aggregates data from different sources for the same time period and location
   */
  async fuseMultiSourceData(
    eventId: string,
    timeWindowMinutes: number = 5
  ): Promise<FusedDataRecord[]> {
    const query = `
      WITH time_windows AS (
        SELECT
          TIMESTAMP_TRUNC(timestamp, MINUTE, 5) as window_start,
          location_id
        FROM \`${this.projectId}.drishtix_analytics.crowd_predictions\`
        WHERE event_id = @eventId
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
        GROUP BY window_start, location_id
      ),
      
      crowd_data AS (
        SELECT
          TIMESTAMP_TRUNC(timestamp, MINUTE, 5) as window_start,
          location_id,
          AVG(predicted_count) as avg_predicted_count,
          AVG(confidence_score) as avg_confidence,
          MAX(risk_level) as max_risk_level
        FROM \`${this.projectId}.drishtix_analytics.crowd_predictions\`
        WHERE event_id = @eventId
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
        GROUP BY window_start, location_id
      ),
      
      sentiment_data AS (
        SELECT
          TIMESTAMP_TRUNC(timestamp, MINUTE, 5) as window_start,
          AVG(panic_level) as avg_panic_level,
          COUNT(*) as signal_count,
          APPROX_TOP_COUNT(sentiment, 1)[OFFSET(0)].value as dominant_sentiment
        FROM \`${this.projectId}.drishtix_analytics.social_signals\`
        WHERE event_id = @eventId
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
        GROUP BY window_start
      ),
      
      video_data AS (
        SELECT
          TIMESTAMP_TRUNC(timestamp, MINUTE, 5) as window_start,
          camera_id,
          AVG(people_count) as avg_people_count,
          MAX(density_level) as max_density,
          ARRAY_AGG(DISTINCT anomaly) as anomalies
        FROM \`${this.projectId}.drishtix_analytics.video_analytics\`,
        UNNEST(anomalies) as anomaly
        WHERE event_id = @eventId
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
        GROUP BY window_start, camera_id
      ),
      
      gps_data AS (
        SELECT
          TIMESTAMP_TRUNC(timestamp, MINUTE, 5) as window_start,
          COUNT(DISTINCT user_id) as team_members_count
        FROM \`${this.projectId}.drishtix_analytics.gps_tracking\`
        WHERE event_id = @eventId
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
        GROUP BY window_start
      )
      
      SELECT
        @eventId as event_id,
        tw.window_start as timestamp,
        tw.location_id,
        STRUCT(
          CAST(cd.avg_predicted_count AS INT64) as predicted_count,
          cd.max_risk_level as risk_level
        ) as crowd_metrics,
        STRUCT(
          CAST(sd.avg_panic_level AS INT64) as avg_panic_level,
          CAST(sd.signal_count AS INT64) as signal_count,
          sd.dominant_sentiment as dominant_sentiment
        ) as sentiment_metrics,
        STRUCT(
          CAST(gd.team_members_count AS INT64) as team_members_present
        ) as gps_metrics,
        STRUCT(
          CAST(vd.avg_people_count AS INT64) as people_detected,
          vd.anomalies as anomalies
        ) as video_metrics,
        -- Calculate composite risk score
        CASE
          WHEN cd.max_risk_level = 'critical' THEN 90
          WHEN cd.max_risk_level = 'high' THEN 70
          WHEN cd.max_risk_level = 'medium' THEN 50
          ELSE 30
        END +
        CASE
          WHEN sd.avg_panic_level > 70 THEN 10
          WHEN sd.avg_panic_level > 40 THEN 5
          ELSE 0
        END as risk_score
      FROM time_windows tw
      LEFT JOIN crowd_data cd ON tw.window_start = cd.window_start AND tw.location_id = cd.location_id
      LEFT JOIN sentiment_data sd ON tw.window_start = sd.window_start
      LEFT JOIN video_data vd ON tw.window_start = vd.window_start
      LEFT JOIN gps_data gd ON tw.window_start = gd.window_start
      ORDER BY tw.window_start DESC
      LIMIT 100
    `;

    try {
      const options = {
        query,
        params: { eventId },
        location: 'US'
      };

      const [rows] = await this.bigqueryClient.query(options);
      return rows as FusedDataRecord[];

    } catch (error) {
      console.error('Data fusion query error:', error);
      return [];
    }
  }

  /**
   * Calculate real-time risk scores by combining multiple data sources
   */
  async calculateRiskScores(eventId: string): Promise<{ location_id: string; risk_score: number; factors: string[] }[]> {
    const query = `
      WITH latest_data AS (
        -- Get most recent 15 minutes of data
        SELECT
          location_id,
          AVG(predicted_count) as crowd_count,
          AVG(confidence_score) as confidence,
          MAX(CASE WHEN risk_level = 'critical' THEN 4 WHEN risk_level = 'high' THEN 3 WHEN risk_level = 'medium' THEN 2 ELSE 1 END) as risk_level
        FROM \`${this.projectId}.drishtix_analytics.crowd_predictions\`
        WHERE event_id = @eventId
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 15 MINUTE)
        GROUP BY location_id
      ),
      
      recent_incidents AS (
        SELECT
          location.name as location_id,
          COUNT(*) as incident_count,
          MAX(CASE WHEN severity = 'critical' THEN 4 WHEN severity = 'high' THEN 3 WHEN severity = 'medium' THEN 2 ELSE 1 END) as max_severity
        FROM \`${this.projectId}.drishtix_analytics.incidents\`
        WHERE event_id = @eventId
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE)
          AND resolved = false
        GROUP BY location.name
      ),
      
      sentiment_data AS (
        SELECT
          AVG(panic_level) as avg_panic
        FROM \`${this.projectId}.drishtix_analytics.social_signals\`
        WHERE event_id = @eventId
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 15 MINUTE)
      )
      
      SELECT
        ld.location_id,
        -- Composite risk score (0-100)
        LEAST(100, GREATEST(0,
          (ld.risk_level * 20) +                    -- Base risk: 0-80
          (COALESCE(ri.incident_count, 0) * 10) +   -- Incidents: 0-40
          (COALESCE(ri.max_severity, 0) * 5) +      -- Severity: 0-20
          (COALESCE(sd.avg_panic, 0) / 5)           -- Sentiment: 0-20
        )) as risk_score,
        ARRAY_CONCAT(
          CASE WHEN ld.risk_level >= 3 THEN ['high_crowd_density'] ELSE [] END,
          CASE WHEN COALESCE(ri.incident_count, 0) > 0 THEN ['active_incidents'] ELSE [] END,
          CASE WHEN COALESCE(sd.avg_panic, 0) > 50 THEN ['high_panic_level'] ELSE [] END
        ) as risk_factors
      FROM latest_data ld
      LEFT JOIN recent_incidents ri ON ld.location_id = ri.location_id
      CROSS JOIN sentiment_data sd
      ORDER BY risk_score DESC
    `;

    try {
      const options = {
        query,
        params: { eventId },
        location: 'US'
      };

      const [rows] = await this.bigqueryClient.query(options);
      return rows as any[];

    } catch (error) {
      console.error('Risk score calculation error:', error);
      return [];
    }
  }

  /**
   * Create materialized view for faster dashboard queries
   */
  async createMaterializedViews(): Promise<void> {
    const views = [
      {
        name: 'latest_crowd_metrics',
        query: `
          SELECT
            event_id,
            location_id,
            timestamp,
            predicted_count,
            risk_level,
            confidence_score
          FROM \`${this.projectId}.drishtix_analytics.crowd_predictions\`
          WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
        `
      },
      {
        name: 'active_incidents_summary',
        query: `
          SELECT
            event_id,
            COUNT(*) as total_incidents,
            SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
            SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_count,
            AVG(response_time_seconds) as avg_response_time
          FROM \`${this.projectId}.drishtix_analytics.incidents\`
          WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
          GROUP BY event_id
        `
      }
    ];

    for (const view of views) {
      try {
        const dataset = this.bigqueryClient.dataset('drishtix_analytics');
        const [table] = await dataset.createTable(view.name, {
          view: { query: view.query, useLegacySql: false }
        });

        console.log(`Created view: ${table.id}`);

      } catch (error: any) {
        if (error.code === 409) {
          console.log(`View ${view.name} already exists`);
        } else {
          console.error(`Error creating view ${view.name}:`, error);
        }
      }
    }
  }

  /**
   * Monitor pipeline health and performance
   */
  async getPipelineMetrics(): Promise<{
    subscriptions: { name: string; messageCount: number; oldestMessage: string }[];
    bigqueryTables: { table: string; rowCount: number; sizeGB: number }[];
  }> {
    const metrics = {
      subscriptions: [] as any[],
      bigqueryTables: [] as any[]
    };

    // Get Pub/Sub subscription metrics
    const [subscriptions] = await this.pubsubClient.getSubscriptions();
    for (const sub of subscriptions) {
      try {
        const [metadata] = await sub.getMetadata();
        metrics.subscriptions.push({
          name: sub.name.split('/').pop(),
          messageCount: metadata.numUndeliveredMessages || 0,
          oldestMessage: metadata.oldestUnackedMessageAge || '0s'
        });
      } catch (error) {
        console.error(`Error getting metrics for ${sub.name}:`, error);
      }
    }

    // Get BigQuery table metrics
    const tables = [
      'crowd_predictions',
      'incidents',
      'event_analytics',
      'video_analytics',
      'social_signals',
      'gps_tracking'
    ];

    for (const tableName of tables) {
      try {
        const table = this.bigqueryClient.dataset('drishtix_analytics').table(tableName);
        const [metadata] = await table.getMetadata();

        metrics.bigqueryTables.push({
          table: tableName,
          rowCount: parseInt(metadata.numRows) || 0,
          sizeGB: parseFloat((parseInt(metadata.numBytes) / 1e9).toFixed(3))
        });
      } catch (error) {
        console.error(`Error getting metrics for table ${tableName}:`, error);
      }
    }

    return metrics;
  }

  /**
   * Health check for data pipeline
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check Pub/Sub connection
      await this.pubsubClient.getTopics();

      // Check BigQuery connection
      await this.bigqueryClient.getDatasets();

      return true;
    } catch (error) {
      console.error('Pipeline health check failed:', error);
      return false;
    }
  }
}

export default DataFlowPipelineService;
