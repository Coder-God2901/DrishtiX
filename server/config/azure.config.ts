/**
 * Microsoft Azure Configuration
 * Centralized configuration for all Azure services
 */

import { DefaultAzureCredential } from '@azure/identity';
import dotenv from 'dotenv';

dotenv.config();

export interface AzureConfig {
  tenantId: string;
  subscriptionId: string;
  resourceGroup: string;
  location: string;

  // Authentication & Identity
  auth: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    authority: string;
    b2c: {
      tenantName: string;
      clientId: string;
      policyName: string;
      authority: string;
    };
  };

  // Azure Cosmos DB (replaces Firestore)
  cosmosDb: {
    endpoint: string;
    key: string;
    databaseId: string;
    containers: {
      users: string;
      events: string;
      analytics: string;
      sessions: string;
    };
  };

  // Azure Notification Hubs (replaces FCM)
  notificationHubs: {
    connectionString: string;
    hubName: string;
  };

  // Azure Synapse Analytics (replaces BigQuery)
  synapse: {
    workspaceName: string;
    sqlEndpoint: string;
    sparkPoolName: string;
    dedicatedSqlPoolName: string;
    datasets: {
      predictions: string;
      incidents: string;
      analytics: string;
    };
  };

  // Azure Service Bus (replaces Pub/Sub)
  serviceBus: {
    connectionString: string;
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

  // Azure Blob Storage (replaces Cloud Storage)
  storage: {
    accountName: string;
    accountKey: string;
    connectionString: string;
    containers: {
      simulations: string;
      models: string;
      videos: string;
    };
  };

  // Azure OpenAI Service (replaces Gemini)
  openai: {
    endpoint: string;
    apiKey: string;
    deployment: {
      chat: string;
      embedding: string;
      vision: string;
    };
    apiVersion: string;
  };

  // Azure Maps (replaces Google Maps)
  maps: {
    subscriptionKey: string;
    clientId: string;
  };

  // Azure Planetary Computer (replaces Earth Engine)
  planetaryComputer: {
    enabled: boolean;
    apiKey: string;
    endpoint: string;
  };

  // Azure Speech Services (replaces Cloud Speech)
  speech: {
    subscriptionKey: string;
    region: string;
  };

  // Azure Monitor (replaces Cloud Logging/Monitoring)
  monitor: {
    workspaceId: string;
    instrumentationKey: string;
    connectionString: string;
  };

  // Azure Machine Learning (replaces Vertex AI)
  machineLearning: {
    workspaceName: string;
    endpoint: string;
    apiKey: string;
    resourceGroup: string;
    computeTargets: {
      cpu: string;
      gpu: string;
    };
  };

  // Azure Computer Vision
  computerVision: {
    endpoint: string;
    apiKey: string;
    customVision: {
      endpoint: string;
      predictionKey: string;
      projectId: string;
    };
  };

  // Azure Video Analyzer (for queue detection)
  videoAnalyzer: {
    endpoint: string;
    accountId: string;
  };

  // Azure Cognitive Services
  cognitiveServices: {
    endpoint: string;
    apiKey: string;
  };

  // Azure Stream Analytics
  streamAnalytics: {
    resourceGroup: string;
    jobs: {
      crowdAggregation: string;
      anomalyDetection: string;
      queueMetrics: string;
      predictiveAnalytics: string;
    };
  };

  // Azure Purview (replaces Cloud DLP)
  purview: {
    enabled: boolean;
    accountName: string;
    endpoint: string;
  };

  // Azure App Service / Container Apps
  appService: {
    name: string;
    resourceGroup: string;
  };
}

export const azureConfig: AzureConfig = {
  tenantId: process.env.AZURE_TENANT_ID || '',
  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
  resourceGroup: process.env.AZURE_RESOURCE_GROUP || 'drishtix-rg',
  location: process.env.AZURE_LOCATION || 'eastus',

  auth: {
    tenantId: process.env.AZURE_AD_TENANT_ID || process.env.AZURE_TENANT_ID || '',
    clientId: process.env.AZURE_AD_CLIENT_ID || '',
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
    authority: process.env.AZURE_AD_AUTHORITY || '',
    b2c: {
      tenantName: process.env.AZURE_AD_B2C_TENANT_NAME || '',
      clientId: process.env.AZURE_AD_B2C_CLIENT_ID || '',
      policyName: process.env.AZURE_AD_B2C_POLICY_NAME || 'B2C_1_signupsignin',
      authority: process.env.AZURE_AD_B2C_AUTHORITY || '',
    },
  },

  cosmosDb: {
    endpoint: process.env.AZURE_COSMOS_ENDPOINT || '',
    key: process.env.AZURE_COSMOS_KEY || '',
    databaseId: process.env.AZURE_COSMOS_DATABASE_ID || 'drishtix-db',
    containers: {
      users: process.env.AZURE_COSMOS_CONTAINER_USERS || 'users',
      events: process.env.AZURE_COSMOS_CONTAINER_EVENTS || 'events',
      analytics: process.env.AZURE_COSMOS_CONTAINER_ANALYTICS || 'analytics',
      sessions: process.env.AZURE_COSMOS_CONTAINER_SESSIONS || 'sessions',
    },
  },

  notificationHubs: {
    connectionString: process.env.AZURE_NOTIFICATION_HUBS_CONNECTION_STRING || '',
    hubName: process.env.AZURE_NOTIFICATION_HUBS_NAME || 'drishtix-notifications',
  },

  synapse: {
    workspaceName: process.env.AZURE_SYNAPSE_WORKSPACE_NAME || 'drishtix-synapse',
    sqlEndpoint: process.env.AZURE_SYNAPSE_SQL_ENDPOINT || '',
    sparkPoolName: process.env.AZURE_SYNAPSE_SPARK_POOL || 'drishtixspark',
    dedicatedSqlPoolName: process.env.AZURE_SYNAPSE_SQL_POOL || 'drishtixsql',
    datasets: {
      predictions: process.env.AZURE_SYNAPSE_DATASET_PREDICTIONS || 'crowd_predictions',
      incidents: process.env.AZURE_SYNAPSE_DATASET_INCIDENTS || 'incident_logs',
      analytics: process.env.AZURE_SYNAPSE_DATASET_ANALYTICS || 'event_analytics',
    },
  },

  serviceBus: {
    connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING || '',
    topics: {
      crowdData: process.env.AZURE_SERVICE_BUS_TOPIC_CROWD_DATA || 'crowd-density-updates',
      predictions: process.env.AZURE_SERVICE_BUS_TOPIC_PREDICTIONS || 'prediction-results',
      anomalies: process.env.AZURE_SERVICE_BUS_TOPIC_ANOMALIES || 'anomaly-detections',
      alerts: process.env.AZURE_SERVICE_BUS_TOPIC_ALERTS || 'emergency-alerts',
      dispatch: process.env.AZURE_SERVICE_BUS_TOPIC_DISPATCH || 'responder-dispatch',
      riskEngine: process.env.AZURE_SERVICE_BUS_TOPIC_RISK_ENGINE || 'risk-engine',
    },
    subscriptions: {
      crowdData: process.env.AZURE_SERVICE_BUS_SUBSCRIPTION_CROWD || 'crowd-density-sub',
      predictions: process.env.AZURE_SERVICE_BUS_SUBSCRIPTION_PREDICTIONS || 'prediction-results-sub',
      anomalies: process.env.AZURE_SERVICE_BUS_SUBSCRIPTION_ANOMALIES || 'anomaly-detections-sub',
      riskEngine: process.env.AZURE_SERVICE_BUS_SUBSCRIPTION_RISK_ENGINE || 'risk-engine-sub',
    },
  },

  storage: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    containers: {
      simulations: process.env.AZURE_STORAGE_CONTAINER_SIMULATIONS || 'simulations',
      models: process.env.AZURE_STORAGE_CONTAINER_MODELS || 'models',
      videos: process.env.AZURE_STORAGE_CONTAINER_VIDEOS || 'video-feeds',
    },
  },

  openai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    deployment: {
      chat: process.env.AZURE_OPENAI_DEPLOYMENT_CHAT || 'gpt-4',
      embedding: process.env.AZURE_OPENAI_DEPLOYMENT_EMBEDDING || 'text-embedding-ada-002',
      vision: process.env.AZURE_OPENAI_DEPLOYMENT_VISION || 'gpt-4-vision',
    },
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  },

  maps: {
    subscriptionKey: process.env.AZURE_MAPS_SUBSCRIPTION_KEY || '',
    clientId: process.env.AZURE_MAPS_CLIENT_ID || '',
  },

  planetaryComputer: {
    enabled: process.env.AZURE_PLANETARY_COMPUTER_ENABLED === 'true',
    apiKey: process.env.AZURE_PLANETARY_COMPUTER_API_KEY || '',
    endpoint: process.env.AZURE_PLANETARY_COMPUTER_ENDPOINT || 'https://planetarycomputer.microsoft.com/api/stac/v1',
  },

  speech: {
    subscriptionKey: process.env.AZURE_SPEECH_SUBSCRIPTION_KEY || '',
    region: process.env.AZURE_SPEECH_REGION || 'eastus',
  },

  monitor: {
    workspaceId: process.env.AZURE_MONITOR_WORKSPACE_ID || '',
    instrumentationKey: process.env.AZURE_MONITOR_INSTRUMENTATION_KEY || '',
    connectionString: process.env.AZURE_MONITOR_CONNECTION_STRING || '',
  },

  machineLearning: {
    workspaceName: process.env.AZURE_ML_WORKSPACE_NAME || 'drishtix-ml',
    endpoint: process.env.AZURE_ML_ENDPOINT || '',
    apiKey: process.env.AZURE_ML_API_KEY || '',
    resourceGroup: process.env.AZURE_ML_RESOURCE_GROUP || process.env.AZURE_RESOURCE_GROUP || 'drishtix-rg',
    computeTargets: {
      cpu: process.env.AZURE_ML_COMPUTE_CPU || 'cpu-cluster',
      gpu: process.env.AZURE_ML_COMPUTE_GPU || 'gpu-cluster',
    },
  },

  computerVision: {
    endpoint: process.env.AZURE_COMPUTER_VISION_ENDPOINT || '',
    apiKey: process.env.AZURE_COMPUTER_VISION_KEY || '',
    customVision: {
      endpoint: process.env.AZURE_CUSTOM_VISION_ENDPOINT || '',
      predictionKey: process.env.AZURE_CUSTOM_VISION_PREDICTION_KEY || '',
      projectId: process.env.AZURE_CUSTOM_VISION_PROJECT_ID || '',
    },
  },

  videoAnalyzer: {
    endpoint: process.env.AZURE_VIDEO_ANALYZER_ENDPOINT || '',
    accountId: process.env.AZURE_VIDEO_ANALYZER_ACCOUNT_ID || '',
  },

  cognitiveServices: {
    endpoint: process.env.AZURE_COGNITIVE_SERVICES_ENDPOINT || '',
    apiKey: process.env.AZURE_COGNITIVE_SERVICES_KEY || '',
  },

  streamAnalytics: {
    resourceGroup: process.env.AZURE_STREAM_ANALYTICS_RESOURCE_GROUP || process.env.AZURE_RESOURCE_GROUP || 'drishtix-rg',
    jobs: {
      crowdAggregation: process.env.AZURE_STREAM_ANALYTICS_JOB_CROWD || 'crowd-density-aggregation',
      anomalyDetection: process.env.AZURE_STREAM_ANALYTICS_JOB_ANOMALY || 'anomaly-detection-stream',
      queueMetrics: process.env.AZURE_STREAM_ANALYTICS_JOB_QUEUE || 'queue-metrics-computation',
      predictiveAnalytics: process.env.AZURE_STREAM_ANALYTICS_JOB_PREDICT || 'predictive-analytics-stream',
    },
  },

  purview: {
    enabled: process.env.AZURE_PURVIEW_ENABLED === 'true',
    accountName: process.env.AZURE_PURVIEW_ACCOUNT_NAME || '',
    endpoint: process.env.AZURE_PURVIEW_ENDPOINT || '',
  },

  appService: {
    name: process.env.AZURE_APP_SERVICE_NAME || 'drishtix-app',
    resourceGroup: process.env.AZURE_APP_SERVICE_RESOURCE_GROUP || process.env.AZURE_RESOURCE_GROUP || 'drishtix-rg',
  },
};

// Initialize Azure Default Credential
export const azureCredential = new DefaultAzureCredential();

// Validation function to ensure critical config is set
export function validateAzureConfig(): void {
  const required = [
    'AZURE_TENANT_ID',
    'AZURE_SUBSCRIPTION_ID',
    'AZURE_COSMOS_ENDPOINT',
    'AZURE_COSMOS_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️ Missing Azure configuration: ${missing.join(', ')}`);
    console.warn('Some Azure services may not function correctly.');
  }
}

// Auto-validate on import
validateAzureConfig();

export default azureConfig;
