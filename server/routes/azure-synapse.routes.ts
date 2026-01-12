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
 * BigQuery Analytics API Routes
 * Dedicated routes for BigQuery data retrieval and analytics
 */

import { Router, Request, Response } from 'express';
import { azureSynapseAnalyticsService } from '../services/azure-synapse-analytics.service';

const router = Router();

/**
 * GET /api/bigquery/predictions
 * Get crowd predictions from BigQuery
 */
router.get('/predictions', async (req: Request, res: Response) => {
  try {
    const { eventId, timeRange = '7d', limit = 100 } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required'
      });
    }

    // Calculate time range
    const endTime = new Date();
    const startTime = new Date();

    switch (timeRange) {
      case '24h':
        startTime.setHours(startTime.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
      case '90d':
        startTime.setDate(startTime.getDate() - 90);
        break;
      default:
        startTime.setDate(startTime.getDate() - 7);
    }

    // Query BigQuery (implement in service)
    const query = `
      SELECT 
        timestamp,
        grid_id,
        predicted_count,
        predicted_density,
        confidence,
        risk_level
      FROM \`${process.env.GCP_PROJECT_ID}.drishtix_analytics.crowd_predictions\`
      WHERE event_id = @eventId
        AND timestamp >= @startTime
        AND timestamp <= @endTime
      ORDER BY timestamp DESC
      LIMIT @limit
    `;

    const rows = await bigQueryAnalyticsService['bigquery'].query({
      query,
      params: {
        eventId: eventId as string,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        limit: parseInt(limit as string)
      }
    });

    res.json({
      success: true,
      rows: rows[0],
      count: rows[0].length,
      timeRange,
      query: {
        eventId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error fetching predictions from BigQuery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch predictions',
      message: error.message
    });
  }
});

/**
 * GET /api/bigquery/incidents
 * Get incident logs from BigQuery
 */
router.get('/incidents', async (req: Request, res: Response) => {
  try {
    const { eventId, timeRange = '7d', limit = 100 } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required'
      });
    }

    const endTime = new Date();
    const startTime = new Date();

    switch (timeRange) {
      case '24h':
        startTime.setHours(startTime.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
      case '90d':
        startTime.setDate(startTime.getDate() - 90);
        break;
      default:
        startTime.setDate(startTime.getDate() - 7);
    }

    const query = `
      SELECT 
        timestamp,
        type,
        severity,
        zone_id,
        alert_fired,
        response_time_seconds,
        source,
        confidence
      FROM \`${process.env.GCP_PROJECT_ID}.drishtix_analytics.incident_logs\`
      WHERE event_id = @eventId
        AND timestamp >= @startTime
        AND timestamp <= @endTime
      ORDER BY timestamp DESC
      LIMIT @limit
    `;

    const rows = await bigQueryAnalyticsService['bigquery'].query({
      query,
      params: {
        eventId: eventId as string,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        limit: parseInt(limit as string)
      }
    });

    res.json({
      success: true,
      rows: rows[0],
      count: rows[0].length,
      timeRange
    });

  } catch (error: any) {
    console.error('Error fetching incidents from BigQuery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch incidents',
      message: error.message
    });
  }
});

/**
 * GET /api/bigquery/crowd-density
 * Get crowd density trends from BigQuery
 */
router.get('/crowd-density', async (req: Request, res: Response) => {
  try {
    const { eventId, timeRange = '7d', limit = 100, interval = '15min' } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required'
      });
    }

    const endTime = new Date();
    const startTime = new Date();

    switch (timeRange) {
      case '24h':
        startTime.setHours(startTime.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
      case '90d':
        startTime.setDate(startTime.getDate() - 90);
        break;
      default:
        startTime.setDate(startTime.getDate() - 7);
    }

    // Use service method
    const trends = await bigQueryAnalyticsService.getCrowdTrends(
      eventId as string,
      startTime,
      endTime,
      interval as '5min' | '15min' | '1hour'
    );

    res.json({
      success: true,
      rows: trends,
      count: trends.length,
      timeRange,
      interval
    });

  } catch (error: any) {
    console.error('Error fetching crowd density from BigQuery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crowd density',
      message: error.message
    });
  }
});

/**
 * GET /api/bigquery/anomaly-patterns
 * Get anomaly patterns from BigQuery
 */
router.get('/anomaly-patterns', async (req: Request, res: Response) => {
  try {
    const { eventId, timeRange = '7d' } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required'
      });
    }

    const endTime = new Date();
    const startTime = new Date();

    switch (timeRange) {
      case '24h':
        startTime.setHours(startTime.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
      case '90d':
        startTime.setDate(startTime.getDate() - 90);
        break;
      default:
        startTime.setDate(startTime.getDate() - 7);
    }

    const patterns = await bigQueryAnalyticsService.getAnomalyPatterns(
      eventId as string,
      startTime,
      endTime
    );

    res.json({
      success: true,
      patterns,
      count: patterns.length,
      timeRange
    });

  } catch (error: any) {
    console.error('Error fetching anomaly patterns from BigQuery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch anomaly patterns',
      message: error.message
    });
  }
});

/**
 * GET /api/bigquery/event-metrics
 * Get comprehensive event metrics from BigQuery
 */
router.get('/event-metrics', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required'
      });
    }

    const metrics = await bigQueryAnalyticsService.getEventMetrics(eventId as string);

    res.json({
      success: true,
      metrics
    });

  } catch (error: any) {
    console.error('Error fetching event metrics from BigQuery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/bigquery/zone-analytics
 * Get zone-level analytics from BigQuery
 */
router.get('/zone-analytics', async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required'
      });
    }

    const query = `
      SELECT 
        zone_id,
        AVG(people_count) as avg_count,
        MAX(people_count) as peak_count,
        AVG(density_value) as avg_density,
        MAX(density_value) as peak_density,
        COUNT(*) as total_readings
      FROM \`${process.env.GCP_PROJECT_ID}.drishtix_analytics.video_analytics\`
      WHERE event_id = @eventId
        ${zoneId ? 'AND zone_id = @zoneId' : ''}
      GROUP BY zone_id
      ORDER BY peak_count DESC
    `;

    const params: any = { eventId: eventId as string };
    if (zoneId) {
      params.zoneId = zoneId as string;
    }

    const rows = await bigQueryAnalyticsService['bigquery'].query({
      query,
      params
    });

    res.json({
      success: true,
      zones: rows[0],
      count: rows[0].length
    });

  } catch (error: any) {
    console.error('Error fetching zone analytics from BigQuery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zone analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/bigquery/weather-correlation
 * Get weather correlation with crowd density
 */
router.get('/weather-correlation', async (req: Request, res: Response) => {
  try {
    const { eventId, timeRange = '7d' } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required'
      });
    }

    const endTime = new Date();
    const startTime = new Date();

    switch (timeRange) {
      case '24h':
        startTime.setHours(startTime.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
      default:
        startTime.setDate(startTime.getDate() - 7);
    }

    const query = `
      SELECT 
        w.heat_stress_level,
        w.temperature,
        AVG(c.people_count) as avg_crowd,
        STDDEV(c.people_count) as crowd_variance,
        COUNT(*) as readings
      FROM \`${process.env.GCP_PROJECT_ID}.drishtix_analytics.crowd_analytics\` c
      JOIN \`${process.env.GCP_PROJECT_ID}.drishtix_analytics.weather_data\` w
        ON c.event_id = w.event_id
        AND TIMESTAMP_TRUNC(c.timestamp, MINUTE) = TIMESTAMP_TRUNC(w.timestamp, MINUTE)
      WHERE c.event_id = @eventId
        AND c.timestamp >= @startTime
        AND c.timestamp <= @endTime
      GROUP BY w.heat_stress_level, w.temperature
      ORDER BY w.temperature DESC
    `;

    const rows = await bigQueryAnalyticsService['bigquery'].query({
      query,
      params: {
        eventId: eventId as string,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      }
    });

    res.json({
      success: true,
      correlations: rows[0],
      count: rows[0].length,
      timeRange
    });

  } catch (error: any) {
    console.error('Error fetching weather correlation from BigQuery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather correlation',
      message: error.message
    });
  }
});

/**
 * POST /api/bigquery/custom-query
 * Execute custom SQL query (admin only)
 */
router.post('/custom-query', async (req: Request, res: Response) => {
  try {
    const { query, params } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required'
      });
    }

    // Security: Only allow SELECT queries
    if (!query.trim().toUpperCase().startsWith('SELECT')) {
      return res.status(403).json({
        success: false,
        error: 'Only SELECT queries are allowed'
      });
    }

    const rows = await bigQueryAnalyticsService['bigquery'].query({
      query,
      params: params || {}
    });

    res.json({
      success: true,
      rows: rows[0],
      count: rows[0].length
    });

  } catch (error: any) {
    console.error('Error executing custom query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute query',
      message: error.message
    });
  }
});

/**
 * GET /api/bigquery/health
 * BigQuery service health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Simple query to test BigQuery connectivity
    const query = `SELECT 1 as health_check`;

    const rows = await bigQueryAnalyticsService['bigquery'].query({ query });

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      dataset: process.env.BIGQUERY_DATASET || 'drishtix_analytics'
    });

  } catch (error: any) {
    console.error('BigQuery health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
