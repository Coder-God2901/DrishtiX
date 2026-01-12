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
 * Redis-based Failed Login Tracker Service
 * Production-ready with Redis persistence
 */

import Redis from 'ioredis'
import { auditLoggerService } from './audit-logger.service'
import { azureServiceBusMessagingService as pubSubService } from './azure-service-bus-messaging.service';

interface FailedLoginAttempt {
  count: number
  firstAttempt: number
  lastAttempt: number
}

class RedisFailedLoginTrackerService {
  private redis: Redis | null = null
  private readonly MAX_ATTEMPTS = parseInt(process.env.FAILED_LOGIN_ALERT_THRESHOLD || '5')
  private readonly WINDOW_MINUTES = 15
  private readonly KEY_PREFIX_IP = 'failed_login:ip:'
  private readonly KEY_PREFIX_USER = 'failed_login:user:'

  constructor() {
    this.initializeRedis()
  }

  private initializeRedis(): void {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('âš ï¸ Redis connection failed, falling back to in-memory tracking')
            return null // Stop retrying
          }
          return Math.min(times * 50, 2000)
        },
        maxRetriesPerRequest: 3,
      })

      this.redis.on('connect', () => {
        console.log('âœ… Redis connected for failed-login tracking')
      })

      this.redis.on('error', (err) => {
        console.error('âŒ Redis error:', err.message)
      })
    } catch (error) {
      console.warn('âš ï¸ Redis initialization failed, using fallback')
      this.redis = null
    }
  }

  /**
   * Record failed login attempt
   */
  async recordFailedLogin(
    identifier: string,
    type: 'ip' | 'userId',
    metadata?: {
      ipAddress?: string
      userAgent?: string
      userName?: string
    }
  ): Promise<void> {
    const key = type === 'ip'
      ? `${this.KEY_PREFIX_IP}${identifier}`
      : `${this.KEY_PREFIX_USER}${identifier}`

    const now = Date.now()
    let attempt: FailedLoginAttempt

    if (this.redis) {
      // Redis-based tracking
      const data = await this.redis.get(key)
      const windowStart = now - this.WINDOW_MINUTES * 60 * 1000

      if (!data) {
        attempt = {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
        }
      } else {
        const existing: FailedLoginAttempt = JSON.parse(data)
        if (existing.firstAttempt < windowStart) {
          // Window expired, reset
          attempt = {
            count: 1,
            firstAttempt: now,
            lastAttempt: now,
          }
        } else {
          // Increment within window
          attempt = {
            ...existing,
            count: existing.count + 1,
            lastAttempt: now,
          }
        }
      }

      // Store with TTL
      await this.redis.setex(
        key,
        this.WINDOW_MINUTES * 60,
        JSON.stringify(attempt)
      )
    } else {
      // Fallback: create attempt object for logging
      attempt = { count: 1, firstAttempt: now, lastAttempt: now }
    }

    // Log to audit
    await auditLoggerService.log({
      action: 'LOGIN_FAILED',
      entityType: type === 'ip' ? 'IPAddress' : 'User',
      entityId: identifier,
      userId: type === 'userId' ? identifier : undefined,
      userName: metadata?.userName,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      isSuspicious: attempt.count >= this.MAX_ATTEMPTS,
      suspicionReason:
        attempt.count >= this.MAX_ATTEMPTS
          ? `${attempt.count} failed login attempts in ${this.WINDOW_MINUTES} minutes`
          : undefined,
    })

    // Trigger alert if threshold exceeded
    if (attempt.count === this.MAX_ATTEMPTS) {
      await this.triggerAlert(identifier, type, attempt.count, metadata)
    }

    console.warn(
      `âš ï¸ Failed login attempt ${attempt.count}/${this.MAX_ATTEMPTS} for ${type}: ${identifier}`
    )
  }

  /**
   * Reset attempts on successful login
   */
  async resetAttempts(identifier: string, type: 'ip' | 'userId'): Promise<void> {
    if (!this.redis) return

    const key = type === 'ip'
      ? `${this.KEY_PREFIX_IP}${identifier}`
      : `${this.KEY_PREFIX_USER}${identifier}`

    await this.redis.del(key)
  }

  /**
   * Get current attempt count
   */
  async getAttemptCount(identifier: string, type: 'ip' | 'userId'): Promise<number> {
    if (!this.redis) return 0

    const key = type === 'ip'
      ? `${this.KEY_PREFIX_IP}${identifier}`
      : `${this.KEY_PREFIX_USER}${identifier}`

    const data = await this.redis.get(key)
    if (!data) return 0

    const attempt: FailedLoginAttempt = JSON.parse(data)
    const windowStart = Date.now() - this.WINDOW_MINUTES * 60 * 1000

    if (attempt.firstAttempt < windowStart) {
      await this.redis.del(key)
      return 0
    }

    return attempt.count
  }

  /**
   * Check if identifier is locked out
   */
  async isLockedOut(identifier: string, type: 'ip' | 'userId'): Promise<boolean> {
    const count = await this.getAttemptCount(identifier, type)
    return count >= this.MAX_ATTEMPTS
  }

  /**
   * Trigger security alert
   */
  private async triggerAlert(
    identifier: string,
    type: 'ip' | 'userId',
    attemptCount: number,
    metadata?: any
  ): Promise<void> {
    console.error(
      `ðŸš¨ SECURITY ALERT: ${attemptCount} failed login attempts from ${type}: ${identifier}`
    )

    // Publish to incident-alerts topic
    await pubSubService.publishMessage('incident-alerts', {
      type: 'SECURITY_BREACH_ATTEMPT',
      severity: 'HIGH',
      source: 'failed-login-tracker',
      identifier,
      identifierType: type,
      attemptCount,
      windowMinutes: this.WINDOW_MINUTES,
      metadata,
      timestamp: new Date().toISOString(),
    })

    // Log suspicious activity
    await auditLoggerService.logSuspicious({
      action: 'FAILED_LOGIN_THRESHOLD_EXCEEDED',
      entityType: type === 'ip' ? 'IPAddress' : 'User',
      entityId: identifier,
      userId: type === 'userId' ? identifier : undefined,
      suspicionReason: `${attemptCount} failed login attempts in ${this.WINDOW_MINUTES} minutes - possible brute force attack`,
      metadata: {
        attemptCount,
        windowMinutes: this.WINDOW_MINUTES,
        ...metadata,
      },
    })
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    redisConnected: boolean
    maxAttempts: number
    windowMinutes: number
  }> {
    return {
      redisConnected: this.redis?.status === 'ready',
      maxAttempts: this.MAX_ATTEMPTS,
      windowMinutes: this.WINDOW_MINUTES,
    }
  }

  /**
   * Cleanup (for graceful shutdown)
   */
  async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }
}

export const failedLoginTrackerService = new RedisFailedLoginTrackerService()
