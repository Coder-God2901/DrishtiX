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
import { anomalyConfig } from '../config/anomaly.config'

export interface IsolationForestRequest {
  features: {
    density_norm: number
    delta_t1: number
    delta_t5: number
    zone_type_enc: number[]
    time_sin: number
    time_cos: number
  }
}

export interface IsolationForestResponse {
  score: number
}

class IsolationForestInferenceService {
  private endpoint?: string
  private timeout = 3000 // 3s max wait

  constructor() {
    this.endpoint = anomalyConfig.isolationForestEndpoint
  }

  async infer(features: IsolationForestRequest['features']): Promise<number> {
    if (!this.endpoint) {
      throw new Error('ANOMALY_IF_ENDPOINT not configured')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const resp = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!resp.ok) {
        throw new Error(`IF service returned ${resp.status}`)
      }

      const json = (await resp.json()) as IsolationForestResponse
      if (typeof json.score !== 'number') {
        throw new Error('Invalid IF response: missing score')
      }
      return json.score
    } catch (e: any) {
      clearTimeout(timeoutId)
      if (e.name === 'AbortError') {
        throw new Error('IF inference timeout')
      }
      throw e
    }
  }
}

export const isolationForestInferenceService = new IsolationForestInferenceService()
