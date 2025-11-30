/**
 * Local ML Service Client - Replaces Vertex AI
 * Calls local Docker ML service for inference (cost: $10/month vs $100/month)
 */

export interface AutoencoderRequest {
  frame: number[][]
  threshold?: number
}

export interface AutoencoderResponse {
  is_anomaly: boolean
  reconstruction_error: number
  anomaly_type: string | null
  confidence: number
  processing_time_ms: number
}

export interface ForecastRequest {
  frames: Array<{
    width: number
    height: number
    data: number[][]
    timestamp: string
  }>
  mode: string
  forecast_horizon_minutes: number
}

export interface ForecastResponse {
  predicted_frames: Array<{
    width: number
    height: number
    data: number[][]
    timestamp: string
  }>
  confidence: number
  model_used: string
  processing_time_ms: number
  risk_level: string
  peak_density: number
}

export interface RiskPredictionRequest {
  current_density: number
  predicted_density: number
  weather_condition?: string
  event_capacity: number
  historical_features?: Record<string, number>
}

export interface RiskPredictionResponse {
  risk_score: number
  risk_level: string
  factors: Record<string, number>
  recommendations: string[]
}

class LocalMLService {
  private endpoint: string
  private timeout: number = 30000 // 30 seconds

  constructor() {
    // Use ML_SERVICE_ENDPOINT env var or default to localhost
    this.endpoint = process.env.ML_SERVICE_ENDPOINT || 'http://ml-service:8000'
    console.log(`[LocalML] Initialized with endpoint: ${this.endpoint}`)
  }

  /**
   * Detect anomalies using local Autoencoder (replaces Vertex AI)
   */
  async detectAnomaly(frame: number[][], threshold: number = 0.15): Promise<AutoencoderResponse> {
    const url = `${this.endpoint}/api/detect-anomaly`

    const body: AutoencoderRequest = {
      frame,
      threshold
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`Local ML inference failed: ${resp.status} ${text}`)
      }

      const result = (await resp.json()) as AutoencoderResponse
      return result
    } catch (error: any) {
      console.error('[LocalML] Anomaly detection error:', error.message)
      throw new Error(`Local ML service unavailable: ${error.message}`)
    }
  }

  /**
   * Forecast crowd density 5-30 minutes ahead (replaces Vertex AI ConvLSTM)
   */
  async forecastCrowdDensity(request: ForecastRequest): Promise<ForecastResponse> {
    const url = `${this.endpoint}/api/forecast`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`Forecast failed: ${resp.status} ${text}`)
      }

      const result = (await resp.json()) as ForecastResponse
      return result
    } catch (error: any) {
      console.error('[LocalML] Forecast error:', error.message)
      throw new Error(`Forecast service unavailable: ${error.message}`)
    }
  }

  /**
   * Predict risk level based on crowd metrics
   */
  async predictRisk(request: RiskPredictionRequest): Promise<RiskPredictionResponse> {
    const url = `${this.endpoint}/api/predict-risk`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`Risk prediction failed: ${resp.status} ${text}`)
      }

      const result = (await resp.json()) as RiskPredictionResponse
      return result
    } catch (error: any) {
      console.error('[LocalML] Risk prediction error:', error.message)
      throw new Error(`Risk prediction unavailable: ${error.message}`)
    }
  }

  /**
   * Check health of ML service
   */
  async healthCheck(): Promise<boolean> {
    const url = `${this.endpoint}/health`

    try {
      const resp = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (resp.ok) {
        const health = await resp.json()
        console.log('[LocalML] Health check:', health)
        return health.status === 'healthy'
      }
      return false
    } catch (error: any) {
      console.error('[LocalML] Health check failed:', error.message)
      return false
    }
  }
}

export const localMLService = new LocalMLService()
