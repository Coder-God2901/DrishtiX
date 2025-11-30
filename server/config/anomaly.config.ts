import dotenv from 'dotenv'
dotenv.config()

export interface AnomalyConfig {
  tier1DensityThreshold: number
  tier1DeltaThreshold: number
  isolationForestEnabled: boolean
  isolationForestThreshold: number
  isolationForestEndpoint?: string
  autoencoderEnabled: boolean
  autoencoderEndpoint?: string
  autoencoderThreshold: number
  minZoneHistoryMinutes: number
  pubsubTopics: {
    anomaly: string
    heatgrid: string
    riskEngine: string
  }
  featureVectors: {
    table: string
    dataset: string
  }
}

export const anomalyConfig: AnomalyConfig = {
  tier1DensityThreshold: parseFloat(process.env.ANOMALY_TIER1_DENSITY_THRESHOLD || '0.95'),
  tier1DeltaThreshold: parseFloat(process.env.ANOMALY_TIER1_DELTA_THRESHOLD || '50'),
  isolationForestEnabled: (process.env.ANOMALY_ISOLATION_FOREST_ENABLED || 'true') === 'true',
  isolationForestThreshold: parseFloat(process.env.ANOMALY_IF_THRESHOLD || '-0.2'),
  isolationForestEndpoint: process.env.ANOMALY_IF_ENDPOINT,
  autoencoderEnabled: (process.env.ANOMALY_AUTOENCODER_ENABLED || 'true') === 'true',
  autoencoderEndpoint: process.env.ANOMALY_AUTOENCODER_ENDPOINT,
  autoencoderThreshold: parseFloat(process.env.ANOMALY_AUTOENCODER_THRESHOLD || '0.15'),
  minZoneHistoryMinutes: parseInt(process.env.ANOMALY_MIN_ZONE_HISTORY_MINUTES || '30', 10),
  pubsubTopics: {
    anomaly: process.env.ANOMALY_PUBSUB_TOPIC || 'anomaly-events',
    heatgrid: process.env.HEATGRID_PUBSUB_TOPIC || 'heatgrid-stream',
    riskEngine: process.env.RISK_ENGINE_PUBSUB_TOPIC || 'risk-engine'
  },
  featureVectors: {
    table: process.env.FEATURE_VECTOR_TABLE || 'event_feature_vectors',
    dataset: process.env.FEATURE_VECTOR_DATASET || 'drishtix_analytics'
  }
}

export function validateAnomalyConfig() {
  const errors: string[] = []
  if (anomalyConfig.tier1DensityThreshold <= 0 || anomalyConfig.tier1DensityThreshold > 1.5) {
    errors.push('ANOMALY_TIER1_DENSITY_THRESHOLD should be between 0 and 1.5 (allowing slight over-capacity)')
  }
  if (anomalyConfig.tier1DeltaThreshold < 1) {
    errors.push('ANOMALY_TIER1_DELTA_THRESHOLD should be >= 1')
  }
  if (anomalyConfig.autoencoderEnabled && !anomalyConfig.autoencoderEndpoint) {
    errors.push('ANOMALY_AUTOENCODER_ENDPOINT required when ANOMALY_AUTOENCODER_ENABLED=true')
  }
  if (anomalyConfig.minZoneHistoryMinutes < 5) {
    errors.push('ANOMALY_MIN_ZONE_HISTORY_MINUTES should be at least 5 to reduce false positives')
  }
  return { valid: errors.length === 0, errors }
}
