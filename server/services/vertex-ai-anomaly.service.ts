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
import { googleAuth, gcpConfig } from '../config/gcp.config'

export interface AutoencoderRequest {
  instances: Array<{ frame: number[][] }>
}

export interface AutoencoderResponse {
  predictions: Array<{ reconstruction_error: number }>
}

class VertexAIAnomalyService {
  private endpoint: string

  constructor() {
    this.endpoint = gcpConfig.vertexAI.endpoint
  }

  async inferReconstructionError(frame: number[][]): Promise<number> {
    if (!gcpConfig.vertexAI.modelId) {
      throw new Error('VERTEX_AI_MODEL_ID not configured for anomaly autoencoder')
    }
    const token = await googleAuth.getAccessToken()
    const url = `https://${this.endpoint}/v1/projects/${gcpConfig.projectId}/locations/${gcpConfig.location}/endpoints/${gcpConfig.vertexAI.modelId}:predict`

    const body: AutoencoderRequest = { instances: [{ frame }] }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Vertex AI inference failed: ${resp.status} ${text}`)
    }

    const json = (await resp.json()) as AutoencoderResponse
    const err = json.predictions?.[0]?.reconstruction_error
    if (typeof err !== 'number') {
      throw new Error('Invalid Vertex AI response: missing reconstruction_error')
    }
    return err
  }
}

export const vertexAIAnomalyService = new VertexAIAnomalyService()
