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
import { auditLoggerService } from './audit-logger.service'
import { azureServiceBusMessagingService as pubSubService } from './azure-service-bus-messaging.service';

interface FailedLoginAttempt {
  count: number
  firstAttempt: number
  lastAttempt: number
}

class FailedLoginTrackerService {
  // In-memory store (use Redis in production)
  private ipAttempts: Map<string, FailedLoginAttempt> = new Map()
  private userAttempts: Map<string, FailedLoginAttempt> = new Map()

  private readonly MAX_ATTEMPTS = parseInt(
    process.env.FAILED_LOGIN_ALERT_THRESHOLD || '5'
  )
  private readonly WINDOW_MINUTES = 15
  private readonly CLEANUP_INTERVAL = 60 * 1000 // 1 minute

  constructor() {
    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL)
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
    const store = type === 'ip' ? this.ipAttempts : this.userAttempts
    const now = Date.now()
    const windowStart = now - this.WINDOW_MINUTES * 60 * 1000

    let attempt = store.get(identifier)
    if (!attempt || attempt.firstAttempt < windowStart) {
      // New window
      attempt = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      }
    } else {
      // Within window
      attempt.count++
      attempt.lastAttempt = now
    }

    store.set(identifier, attempt)

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

    console.warn(`âš ï¸ Failed login attempt ${attempt.count}/${this.MAX_ATTEMPTS} for ${type}: ${identifier}`)
  }

  /**
   * Reset attempts on successful login
   */
  resetAttempts(identifier: string, type: 'ip' | 'userId'): void {
    const store = type === 'ip' ? this.ipAttempts : this.userAttempts
    store.delete(identifier)
  }

  /**
   * Get current attempt count
   */
  getAttemptCount(identifier: string, type: 'ip' | 'userId'): number {
    const store = type === 'ip' ? this.ipAttempts : this.userAttempts
    const attempt = store.get(identifier)
    if (!attempt) return 0

    const windowStart = Date.now() - this.WINDOW_MINUTES * 60 * 1000
    if (attempt.firstAttempt < windowStart) {
      store.delete(identifier)
      return 0
    }

    return attempt.count
  }

  /**
   * Check if identifier is locked out
   */
  isLockedOut(identifier: string, type: 'ip' | 'userId'): boolean {
    return this.getAttemptCount(identifier, type) >= this.MAX_ATTEMPTS
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
    console.error(`ðŸš¨ SECURITY ALERT: ${attemptCount} failed login attempts from ${type}: ${identifier}`)

    // Publish to incident-alerts topic
    await (pubSubService as any).publish('incident-alerts', {
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
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.WINDOW_MINUTES * 60 * 1000

    // Cleanup IP attempts
    for (const [ip, attempt] of this.ipAttempts.entries()) {
      if (attempt.lastAttempt < windowStart) {
        this.ipAttempts.delete(ip)
      }
    }

    // Cleanup user attempts
    for (const [userId, attempt] of this.userAttempts.entries()) {
      if (attempt.lastAttempt < windowStart) {
        this.userAttempts.delete(userId)
      }
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ipAttempts: this.ipAttempts.size,
      userAttempts: this.userAttempts.size,
      maxAttempts: this.MAX_ATTEMPTS,
      windowMinutes: this.WINDOW_MINUTES,
    }
  }
}

export const failedLoginTrackerService = new FailedLoginTrackerService()
