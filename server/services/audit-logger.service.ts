import { prisma } from '../index'
import type { Request } from 'express'

export interface AuditLogEntry {
  action: string
  entityType: string
  entityId: string
  userId?: string
  userName?: string
  userRole?: string
  changes?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
  isSuspicious?: boolean
  suspicionReason?: string
}

class AuditLoggerService {
  /**
   * Log admin action to AuditLog table
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          userId: entry.userId,
          userName: entry.userName,
          userRole: entry.userRole,
          changes: entry.changes,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          isSuspicious: entry.isSuspicious || false,
          suspicionReason: entry.suspicionReason,
        },
      })
    } catch (error) {
      console.error('❌ Audit log write failed:', error)
      // Don't throw - audit failure shouldn't block main operation
    }
  }

  /**
   * Log from Express request context
   */
  async logFromRequest(
    req: Request,
    action: string,
    entityType: string,
    entityId: string,
    changes?: any,
    metadata?: any
  ): Promise<void> {
    const user = (req as any).user

    await this.log({
      action,
      entityType,
      entityId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      changes,
      metadata,
      ipAddress: this.extractIp(req),
      userAgent: req.headers['user-agent'],
    })
  }

  /**
   * Log suspicious activity
   */
  async logSuspicious(
    entry: Omit<AuditLogEntry, 'isSuspicious'> & { suspicionReason: string }
  ): Promise<void> {
    await this.log({
      ...entry,
      isSuspicious: true,
    })

    // Emit alert for suspicious activity
    console.warn('⚠️ Suspicious activity detected:', {
      action: entry.action,
      userId: entry.userId,
      reason: entry.suspicionReason,
    })
  }

  /**
   * Extract IP address from request
   */
  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    return req.ip || req.socket.remoteAddress || 'unknown'
  }

  /**
   * Query audit logs with filters
   */
  async query(filters: {
    userId?: string
    entityType?: string
    entityId?: string
    isSuspicious?: boolean
    startDate?: Date
    endDate?: Date
    limit?: number
  }) {
    return prisma.auditLog.findMany({
      where: {
        userId: filters.userId,
        entityType: filters.entityType,
        entityId: filters.entityId,
        isSuspicious: filters.isSuspicious,
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    })
  }

  /**
   * Get suspicious activity count for user
   */
  async getSuspiciousActivityCount(userId: string, hours: number = 24): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    return prisma.auditLog.count({
      where: {
        userId,
        isSuspicious: true,
        createdAt: { gte: since },
      },
    })
  }

  /**
   * Get failed login attempts for IP/user
   */
  async getFailedLoginAttempts(
    identifier: string,
    type: 'ip' | 'userId',
    minutes: number = 15
  ): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000)
    return prisma.auditLog.count({
      where: {
        action: 'LOGIN_FAILED',
        ...(type === 'ip' ? { ipAddress: identifier } : { userId: identifier }),
        createdAt: { gte: since },
      },
    })
  }

  /**
   * Log authentication events (login, logout, MFA, OAuth)
   */
  async logAuthEvent(event: {
    userId: string
    action: string
    outcome: 'success' | 'failure'
    ipAddress: string
    userAgent: string
    metadata?: any
  }): Promise<void> {
    const actionMap: Record<string, string> = {
      login: event.outcome === 'success' ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      logout: 'LOGOUT',
      mfa_setup: 'MFA_SETUP',
      mfa_enable: event.outcome === 'success' ? 'MFA_ENABLED' : 'MFA_ENABLE_FAILED',
      mfa_disable: event.outcome === 'success' ? 'MFA_DISABLED' : 'MFA_DISABLE_FAILED',
      mfa_verify: event.outcome === 'success' ? 'MFA_VERIFIED' : 'MFA_VERIFY_FAILED',
      oauth_login: event.outcome === 'success' ? 'OAUTH_LOGIN_SUCCESS' : 'OAUTH_LOGIN_FAILED',
      password_reset: event.outcome === 'success' ? 'PASSWORD_RESET_SUCCESS' : 'PASSWORD_RESET_FAILED',
    }

    const mappedAction = actionMap[event.action] || event.action.toUpperCase()
    const isSuspicious = event.outcome === 'failure'

    await this.log({
      action: mappedAction,
      entityType: 'User',
      entityId: event.userId,
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: {
        ...event.metadata,
        outcome: event.outcome,
      },
      isSuspicious,
      suspicionReason: isSuspicious ? `Failed ${event.action} attempt` : undefined,
    })
  }
}

export const auditLoggerService = new AuditLoggerService()
