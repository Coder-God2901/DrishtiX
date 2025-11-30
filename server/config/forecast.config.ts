import dotenv from 'dotenv'
dotenv.config()

export interface ForecastConfig {
  registryPath: string
  defaultMode: string
  allowedModes: string[]
  bufferSize: number
}

export const forecastConfig: ForecastConfig = {
  registryPath: process.env.MODEL_REGISTRY_PATH || './weights',
  defaultMode: process.env.FORECAST_DEFAULT_MODE || 'GENERAL',
  allowedModes: (process.env.FORECAST_ALLOWED_MODES || 'GENERAL,SPORTS,CONCERT,ENTRY_EXIT').split(',').map(s => s.trim()),
  bufferSize: parseInt(process.env.FORECAST_BUFFER_SIZE || '10'),
}

export function validateForecastConfig() {
  const errors: string[] = []
  if (!forecastConfig.registryPath) errors.push('MODEL_REGISTRY_PATH missing')
  if (forecastConfig.bufferSize < 5) errors.push('FORECAST_BUFFER_SIZE should be >= 5')
  return { valid: errors.length === 0, errors }
}
