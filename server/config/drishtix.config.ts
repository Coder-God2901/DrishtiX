/**
 * DrishtiX Application Configuration
 * Main configuration for prediction, anomaly detection, and emergency response
 */

import dotenv from 'dotenv';

dotenv.config();

export interface DrishtiXConfig {
  prediction: {
    enabled: boolean;
    intervalMs: number;
    forecastHorizonMinutes: number;
    confidenceThreshold: number;
    hotspotThreshold: number;
    riskEscalationThreshold: number;
  };
  anomalyDetection: {
    enabled: boolean;
    checkIntervalMs: number;
    thresholds: {
      panic: number;
      fire: number;
      violence: number;
      surge: number;
    };
  };
  emergencyResponse: {
    autoDispatchEnabled: boolean;
    humanValidationRequired: boolean;
    responseTimeTargetMinutes: number;
  };
  simulation: {
    enabled: boolean;
    feedFps: number;
  };
  privacy: {
    piiScrubbingEnabled: boolean;
    auditLogsEnabled: boolean;
    dataRetentionDays: number;
  };
  realtime: {
    websocketEnabled: boolean;
  };
  multiLanguage: {
    defaultLanguage: string;
    supportedLanguages: string[];
  };
}

export const drishtiXConfig: DrishtiXConfig = {
  prediction: {
    enabled: true,
    intervalMs: parseInt(process.env.PREDICTION_INTERVAL_MS || '60000'),
    forecastHorizonMinutes: parseInt(process.env.FORECAST_HORIZON_MINUTES || '20'),
    confidenceThreshold: parseFloat(process.env.PREDICTION_CONFIDENCE_THRESHOLD || '0.75'),
    hotspotThreshold: parseFloat(process.env.HOTSPOT_THRESHOLD || '0.80'),
    riskEscalationThreshold: parseFloat(process.env.RISK_ESCALATION_THRESHOLD || '0.85'),
  },

  anomalyDetection: {
    enabled: true,
    checkIntervalMs: parseInt(process.env.ANOMALY_CHECK_INTERVAL_MS || '5000'),
    thresholds: {
      panic: parseFloat(process.env.PANIC_DETECTION_THRESHOLD || '0.70'),
      fire: parseFloat(process.env.FIRE_DETECTION_THRESHOLD || '0.80'),
      violence: parseFloat(process.env.VIOLENCE_DETECTION_THRESHOLD || '0.75'),
      surge: parseFloat(process.env.SURGE_DETECTION_THRESHOLD || '0.80'),
    },
  },

  emergencyResponse: {
    autoDispatchEnabled: process.env.AUTO_DISPATCH_ENABLED === 'true',
    humanValidationRequired: process.env.HUMAN_VALIDATION_REQUIRED !== 'false',
    responseTimeTargetMinutes: parseInt(process.env.RESPONSE_TIME_TARGET_MINUTES || '5'),
  },

  simulation: {
    enabled: process.env.SIMULATION_MODE === 'true',
    feedFps: parseInt(process.env.SIMULATION_FEED_FPS || '30'),
  },

  privacy: {
    piiScrubbingEnabled: process.env.PII_SCRUBBING_ENABLED !== 'false',
    auditLogsEnabled: process.env.AUDIT_LOGS_ENABLED !== 'false',
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '90'),
  },

  realtime: {
    websocketEnabled: process.env.WEBSOCKET_ENABLED !== 'false',
  },

  multiLanguage: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,hi,es,fr,ar').split(','),
  },
};

export default drishtiXConfig;
