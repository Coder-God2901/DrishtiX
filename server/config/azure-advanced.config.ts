/**
 * Google Cloud Platform Configuration
 * Centralized configuration for all GCP services
 */

import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

export interface GCPConfig {
  projectId: string;
  location: string;
  credentials: string;
  vertexAI: {
    endpoint: string;
    modelId: string;
    agentId: string;
  };
  gemini: {
    apiKey: string;
    model: string;
    visionModel: string;
  };
  pubsub: {
    topics: {
      crowdData: string;
      predictions: string;
      anomalies: string;
      alerts: string;
      dispatch: string;
      riskEngine: string;
    };
    subscriptions: {
      crowdData: string;
      predictions: string;
      anomalies: string;
      riskEngine: string;
    };
  };
  bigquery: {
    dataset: string;
    tables: {
      predictions: string;
      incidents: string;
      analytics: string;
    };
  };
  cloudRun: {
    etlWorkerUrl: string;
  };
  storage: {
    buckets: {
      simulations: string;
      models: string;
      videos: string;
    };
  };
  dlp: {
    enabled: boolean;
    templateId: string;
  };
  maps: {
    apiKey: string;
    routesApiKey: string;
    placesApiKey: string;
  };
  earthEngine: {
    enabled: boolean;
    project: string;
  };
}

export const gcpConfig: GCPConfig = {
  projectId: process.env.GCP_PROJECT_ID || '',
  location: process.env.GCP_LOCATION || 'us-central1',
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',

  vertexAI: {
    endpoint: process.env.VERTEX_AI_ENDPOINT || 'us-central1-aiplatform.googleapis.com',
    modelId: process.env.VERTEX_AI_MODEL_ID || '',
    agentId: process.env.VERTEX_AI_AGENT_ID || '',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    visionModel: process.env.GEMINI_VISION_MODEL || 'gemini-1.5-flash',
  },

  pubsub: {
    topics: {
      crowdData: process.env.PUBSUB_TOPIC_CROWD_DATA || 'crowd-density-updates',
      predictions: process.env.PUBSUB_TOPIC_PREDICTIONS || 'prediction-results',
      anomalies: process.env.PUBSUB_TOPIC_ANOMALIES || 'anomaly-detections',
      alerts: process.env.PUBSUB_TOPIC_ALERTS || 'emergency-alerts',
      dispatch: process.env.PUBSUB_TOPIC_DISPATCH || 'responder-dispatch',
      riskEngine: process.env.PUBSUB_TOPIC_RISK_ENGINE || 'risk-engine',
    },
    subscriptions: {
      crowdData: process.env.PUBSUB_SUBSCRIPTION_CROWD || 'crowd-density-sub',
      predictions: process.env.PUBSUB_SUBSCRIPTION_PREDICTIONS || 'prediction-results-sub',
      anomalies: process.env.PUBSUB_SUBSCRIPTION_ANOMALIES || 'anomaly-detections-sub',
      riskEngine: process.env.PUBSUB_SUBSCRIPTION_RISK_ENGINE || 'risk-engine-sub',
    },
  },

  bigquery: {
    dataset: process.env.BIGQUERY_DATASET || 'drishtix_analytics',
    tables: {
      predictions: process.env.BIGQUERY_TABLE_PREDICTIONS || 'crowd_predictions',
      incidents: process.env.BIGQUERY_TABLE_INCIDENTS || 'incident_logs',
      analytics: process.env.BIGQUERY_TABLE_ANALYTICS || 'event_analytics',
    },
  },

  cloudRun: {
    etlWorkerUrl: process.env.ETL_WORKER_URL || 'https://etl-worker-xxxxx-uc.a.run.app',
  },

  storage: {
    buckets: {
      simulations: process.env.GCS_BUCKET_SIMULATIONS || 'drishtix-simulations',
      models: process.env.GCS_BUCKET_MODELS || 'drishtix-models',
      videos: process.env.GCS_BUCKET_VIDEOS || 'drishtix-video-feeds',
    },
  },

  dlp: {
    enabled: process.env.DLP_ENABLED === 'true',
    templateId: process.env.DLP_TEMPLATE_ID || '',
  },

  maps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    routesApiKey: process.env.GOOGLE_MAPS_ROUTES_API_KEY || process.env.GOOGLE_ROUTES_API_KEY || '',
    placesApiKey: process.env.GOOGLE_MAPS_PLACES_API_KEY || '',
  },

  earthEngine: {
    enabled: process.env.EARTH_ENGINE_ENABLED === 'true',
    project: process.env.EARTH_ENGINE_PROJECT || '',
  },
};

// Initialize Google Auth
export const googleAuth = new GoogleAuth({
  keyFilename: gcpConfig.credentials,
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/pubsub',
    'https://www.googleapis.com/auth/bigquery',
    'https://www.googleapis.com/auth/devstorage.full_control',
    'https://www.googleapis.com/auth/earthengine',
  ],
});

// Validate configuration
export function validateGCPConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!gcpConfig.projectId) {
    errors.push('GCP_PROJECT_ID is required');
  }

  if (!gcpConfig.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  if (!gcpConfig.maps.apiKey) {
    errors.push('GOOGLE_MAPS_API_KEY is required');
  }

  if (!gcpConfig.credentials) {
    errors.push('GOOGLE_APPLICATION_CREDENTIALS path is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default gcpConfig;
