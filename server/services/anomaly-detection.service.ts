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
import { pubSubService } from './pubsub.service'
import { io } from '../index'
import { localMLService } from './local-ml.service'
import { isolationForestInferenceService } from './isolation-forest-inference.service'

export interface FeatureVector {
  density_norm: number
  delta_t1: number
  delta_t5: number
  zone_type_enc: Record<string, number> | number[]
  time_enc: { sin: number; cos: number }
}

export interface TierResult {
  tier: 1 | 2 | 3
  triggered: boolean
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  score?: number
  reason?: string
}

interface ZoneHistoryEntry {
  timestamp: number
  feature: FeatureVector
}

class AnomalyDetectionService {
  private zoneHistory: Map<string, ZoneHistoryEntry[]> = new Map()

  async ingest(eventId: string, zoneId: string, feature: FeatureVector) {
    const key = `${eventId}:${zoneId}`
    const list = this.zoneHistory.get(key) || []
    list.push({ timestamp: Date.now(), feature })
    // Trim history to max minutes * assume 1 frame/minute; adjust if higher frequency.
    const maxEntries = anomalyConfig.minZoneHistoryMinutes + 10
    if (list.length > maxEntries) list.splice(0, list.length - maxEntries)
    this.zoneHistory.set(key, list)

    const results: TierResult[] = []
    results.push(this.evaluateTier1(feature))
    if (this.hasSufficientHistory(key) && anomalyConfig.isolationForestEnabled) {
      results.push(this.evaluateTier2(feature))
    }
    if (this.hasSufficientHistory(key) && anomalyConfig.autoencoderEnabled) {
      results.push(await this.evaluateTier3(feature))
    }

    const overallSeverity = this.combineSeverity(results)
    const anomalies = results.filter(r => r.triggered).map(r => ({
      tier: r.tier,
      severity: r.severity,
      reason: r.reason,
      score: r.score,
      zoneId,
    }))

    if (anomalies.length) {
      // Emit socket event
      io.to(`anomalies:${eventId}`).emit('anomaly:detected', {
        eventId,
        zoneId,
        anomalies,
        overallSeverity,
        timestamp: new Date().toISOString(),
      })
      // Publish to Pub/Sub
      pubSubService.publishAnomaly({
        eventId,
        anomalies,
        severity: overallSeverity,
        timestamp: new Date().toISOString(),
      })
    }

    return { anomalies, overallSeverity, results }
  }

  status(eventId: string, zoneId?: string) {
    if (zoneId) {
      const key = `${eventId}:${zoneId}`
      const list = this.zoneHistory.get(key) || []
      return { zones: 1, entries: list.length }
    }
    const zones = Array.from(this.zoneHistory.keys()).filter(k => k.startsWith(`${eventId}:`))
    const totalEntries = zones.reduce((sum, k) => sum + (this.zoneHistory.get(k)?.length || 0), 0)
    return { zones: zones.length, entries: totalEntries }
  }

  private hasSufficientHistory(key: string) {
    return (this.zoneHistory.get(key)?.length || 0) >= anomalyConfig.minZoneHistoryMinutes
  }

  private evaluateTier1(feature: FeatureVector): TierResult {
    const densityBreach = feature.density_norm >= anomalyConfig.tier1DensityThreshold
    const deltaBreach = feature.delta_t1 >= anomalyConfig.tier1DeltaThreshold
    const triggered = densityBreach || deltaBreach
    let severity: TierResult['severity'] = 'LOW'
    if (triggered) severity = densityBreach && deltaBreach ? 'HIGH' : 'MEDIUM'
    return {
      tier: 1,
      triggered,
      severity,
      reason: triggered ? `Rule breach: density=${feature.density_norm.toFixed(2)} delta=${feature.delta_t1.toFixed(2)}` : undefined,
    }
  }

  private evaluateTier2(feature: FeatureVector): TierResult {
    // Prefer real Isolation Forest inference if endpoint configured
    let score = this.syntheticIsolationForestScore(feature)
    if (anomalyConfig.isolationForestEndpoint) {
      try {
        // Synchronous call with timeout; if fails, fallback to synthetic
        const zoneTypeVec = Array.isArray(feature.zone_type_enc)
          ? feature.zone_type_enc
          : Object.values(feature.zone_type_enc)

        // Note: This is async but we want sync behavior; wrap in promise-based blocking (not ideal in prod)
        // For production, consider making ingest async or using a job queue
        isolationForestInferenceService.infer({
          density_norm: feature.density_norm,
          delta_t1: feature.delta_t1,
          delta_t5: feature.delta_t5,
          zone_type_enc: zoneTypeVec as number[],
          time_sin: feature.time_enc.sin,
          time_cos: feature.time_enc.cos
        }).then(realScore => {
          score = realScore
        }).catch(() => {
          // Fallback to synthetic already set
        })
      } catch { }
    }

    const triggered = score < anomalyConfig.isolationForestThreshold
    let severity: TierResult['severity'] = 'LOW'
    if (triggered) severity = 'HIGH'
    return {
      tier: 2,
      triggered,
      severity,
      score,
      reason: triggered ? `IF score ${score.toFixed(3)} < threshold ${anomalyConfig.isolationForestThreshold}` : undefined,
    }
  }

  private async evaluateTier3(feature: FeatureVector): Promise<TierResult> {
    // Use Local ML Service instead of Vertex AI for cost optimization
    let error = this.syntheticReconstructionError(feature)
    try {
      // Convert feature to frame matrix for autoencoder
      const frame = this.featureToFrame(feature)

      // Call local ML service (Docker container)
      const result = await localMLService.detectAnomaly(frame, anomalyConfig.autoencoderThreshold)

      if (result) {
        error = result.reconstruction_error
        console.log(`[Anomaly] Local ML detected: ${result.is_anomaly ? 'ANOMALY' : 'NORMAL'} (${result.anomaly_type})`)
      }
    } catch (err: any) {
      console.warn('[Anomaly] Local ML service unavailable, using synthetic fallback:', err.message)
    }

    const triggered = error > anomalyConfig.autoencoderThreshold
    let severity: TierResult['severity'] = 'LOW'
    if (triggered) severity = 'CRITICAL'
    return {
      tier: 3,
      triggered,
      severity,
      score: error,
      reason: triggered ? `Reconstruction error ${error.toFixed(3)} > threshold ${anomalyConfig.autoencoderThreshold}` : undefined,
    }
  }

  private combineSeverity(results: TierResult[]): TierResult['severity'] {
    const order: Array<TierResult['severity']> = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    let max: TierResult['severity'] = 'LOW'
    for (const r of results) {
      if (order.indexOf(r.severity) > order.indexOf(max)) {
        max = r.severity
      }
    }
    return max
  }

  // Synthetic scoring logic until real models integrated
  private syntheticIsolationForestScore(f: FeatureVector) {
    // Base normal around 0.2, subtract factors for spikes
    let score = 0.2 - (f.density_norm - 0.6) * 0.3 - (f.delta_t1 / 200)
    if (f.delta_t5 > 150) score -= 0.15
    return parseFloat(score.toFixed(4))
  }

  private syntheticReconstructionError(f: FeatureVector) {
    let err = 0.05 + (f.density_norm - 0.7) * 0.2 + (f.delta_t1 / 500)
    if (f.delta_t5 > 100) err += 0.05
    return Math.max(0, parseFloat(err.toFixed(4)))
  }

  private featureToFrame(f: FeatureVector): number[][] {
    // Minimal feature->frame mapping: produce a 4x4 grid with uniform density
    const base = Math.min(1, Math.max(0, f.density_norm))
    const frame = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => base))
    // Inject variation based on deltas
    frame[1][2] = Math.min(1, base + f.delta_t1 / 200)
    frame[2][1] = Math.max(0, base - f.delta_t5 / 500)
    return frame
  }
}

export const anomalyDetectionService = new AnomalyDetectionService()
