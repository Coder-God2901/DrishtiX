/**
 * Azure Monitor & Application Insights Service
 * Comprehensive logging, monitoring, and alerting for security and performance
 * 
 * Purpose:
 * - Track admin actions and suspicious activities
 * - Monitor system performance and errors
 * - Alert on unusual API calls or intrusions
 * - Provide audit trails for compliance
 */

import { azureConfig } from '../config/azure.config';

interface LogEntry {
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  resource?: string;
  labels?: Record<string, string>;
  metadata?: any;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

interface SecurityEvent {
  type: 'LOGIN_FAILED' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH' | 'INTRUSION_ATTEMPT';
  userId?: string;
  ipAddress: string;
  resource: string;
  details: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface PerformanceMetric {
  metricName: string;
  value: number;
  unit: string;
  labels?: Record<string, string>;
  timestamp?: Date;
}

interface Alert {
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  affectedResources: string[];
  actionRequired?: string;
}

class CloudLoggingMonitoringService {
  private initialized: boolean = false;

  // Security monitoring
  private failedLoginAttempts: Map<string, number> = new Map();
  private suspiciousIPs: Set<string> = new Set();

  // Performance monitoring
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    this.initializeLogging();
  }

  /**
   * Initialize Azure Monitor / Application Insights
   */
  private initializeLogging(): void {
    try {
      // Note: Azure Monitor SDK integration needed
      // Use @azure/monitor-opentelemetry or Application Insights SDK
      this.initialized = true;

      console.log('✓ Azure Monitor initialized (SDK integration pending)');

      // Start periodic monitoring
      this.startPeriodicMonitoring();
    } catch (error) {
      console.error('Error initializing Azure Monitor:', error);
      console.warn('⚠️ Azure Monitor not available - falling back to console');
    }
  }

  // ==================== LOGGING ====================

  /**
   * Write log entry to Cloud Logging
   */
  async writeLog(entry: LogEntry): Promise<void> {
    try {
      const metadata = {
        severity: entry.severity,
        resource: {
          type: 'global',
          labels: entry.labels || {},
        },
        timestamp: entry.timestamp || new Date(),
      };

      const logEntry = this.log.entry(metadata, {
        message: entry.message,
        resource: entry.resource,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        ...entry.metadata,
      });

      if (this.initialized) {
        await this.log.write(logEntry);
      } else {
        // Fallback to console
        console.log(`[${entry.severity}] ${entry.message}`, entry.metadata);
      }
    } catch (error) {
      console.error('Error writing log:', error);
      // Don't throw - logging failure shouldn't break the app
    }
  }

  /**
   * Log informational message
   */
  async info(message: string, metadata?: any): Promise<void> {
    await this.writeLog({
      severity: 'INFO',
      message,
      metadata,
    });
  }

  /**
   * Log warning
   */
  async warn(message: string, metadata?: any): Promise<void> {
    await this.writeLog({
      severity: 'WARNING',
      message,
      metadata,
    });
  }

  /**
   * Log error
   */
  async error(message: string, error?: Error, metadata?: any): Promise<void> {
    await this.writeLog({
      severity: 'ERROR',
      message,
      metadata: {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      },
    });
  }

  /**
   * Log critical error
   */
  async critical(message: string, error?: Error, metadata?: any): Promise<void> {
    await this.writeLog({
      severity: 'CRITICAL',
      message,
      metadata: {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      },
    });

    // Send alert for critical errors
    await this.sendAlert({
      title: 'Critical Error',
      description: message,
      severity: 'CRITICAL',
      affectedResources: [metadata?.resource || 'system'],
      actionRequired: 'Immediate investigation required',
    });
  }

  // ==================== SECURITY MONITORING ====================

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.writeLog({
      severity: event.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      message: `Security Event: ${event.type}`,
      resource: event.resource,
      userId: event.userId,
      ipAddress: event.ipAddress,
      metadata: {
        eventType: event.type,
        details: event.details,
      },
    });

    // Track suspicious activity
    if (event.type === 'LOGIN_FAILED') {
      this.trackFailedLogin(event.ipAddress);
    }

    if (event.type === 'UNAUTHORIZED_ACCESS') {
      this.suspiciousIPs.add(event.ipAddress);
    }

    // Send alert for high severity events
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      await this.sendAlert({
        title: `Security Alert: ${event.type}`,
        description: `Security event detected from IP ${event.ipAddress}`,
        severity: event.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        affectedResources: [event.resource],
        actionRequired: 'Review and investigate immediately',
      });
    }
  }

  /**
   * Track failed login attempts
   */
  private trackFailedLogin(ipAddress: string): void {
    const current = this.failedLoginAttempts.get(ipAddress) || 0;
    this.failedLoginAttempts.set(ipAddress, current + 1);

    // Block IP after 5 failed attempts
    if (current + 1 >= 5) {
      this.suspiciousIPs.add(ipAddress);
      this.sendAlert({
        title: 'Brute Force Attack Detected',
        description: `IP ${ipAddress} has ${current + 1} failed login attempts`,
        severity: 'CRITICAL',
        affectedResources: ['authentication'],
        actionRequired: 'Block IP address immediately',
      });
    }
  }

  /**
   * Check if IP is suspicious
   */
  isSuspiciousIP(ipAddress: string): boolean {
    return this.suspiciousIPs.has(ipAddress);
  }

  /**
   * Reset failed login count (after successful login)
   */
  resetFailedLogins(ipAddress: string): void {
    this.failedLoginAttempts.delete(ipAddress);
  }

  // ==================== PERFORMANCE MONITORING ====================

  /**
   * Log performance metric
   */
  async logMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const metricName = metric.metricName;

      // Store in local cache
      if (!this.performanceMetrics.has(metricName)) {
        this.performanceMetrics.set(metricName, []);
      }
      this.performanceMetrics.get(metricName)!.push(metric.value);

      // Keep only last 100 values
      const values = this.performanceMetrics.get(metricName)!;
      if (values.length > 100) {
        values.shift();
      }

      // Log to Cloud Logging
      await this.writeLog({
        severity: 'INFO',
        message: `Performance Metric: ${metricName}`,
        metadata: {
          metricName,
          value: metric.value,
          unit: metric.unit,
          labels: metric.labels,
        },
      });

      // Check for anomalies
      this.checkMetricAnomaly(metricName, metric.value);
    } catch (error) {
      console.error('Error logging metric:', error);
    }
  }

  /**
   * Check for metric anomalies
   */
  private checkMetricAnomaly(metricName: string, value: number): void {
    const values = this.performanceMetrics.get(metricName);
    if (!values || values.length < 10) return;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / values.length
    );

    // Alert if value is 3 standard deviations from mean
    if (Math.abs(value - avg) > 3 * stdDev) {
      this.sendAlert({
        title: 'Performance Anomaly Detected',
        description: `Metric ${metricName} is ${Math.round(Math.abs(value - avg) / stdDev)} std devs from normal`,
        severity: 'WARNING',
        affectedResources: ['system'],
        actionRequired: 'Monitor system performance',
      });
    }
  }

  /**
   * Log API request
   */
  async logAPIRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    ipAddress?: string
  ): Promise<void> {
    const severity = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARNING' : 'INFO';

    await this.writeLog({
      severity,
      message: `API Request: ${method} ${path}`,
      userId,
      ipAddress,
      metadata: {
        method,
        path,
        statusCode,
        duration,
      },
    });

    // Track slow requests
    if (duration > 5000) {
      await this.sendAlert({
        title: 'Slow API Request',
        description: `${method} ${path} took ${duration}ms`,
        severity: 'WARNING',
        affectedResources: ['api'],
        actionRequired: 'Investigate performance issue',
      });
    }
  }

  /**
   * Log database query
   */
  async logDatabaseQuery(query: string, duration: number, error?: Error): Promise<void> {
    const severity = error ? 'ERROR' : duration > 1000 ? 'WARNING' : 'DEBUG';

    await this.writeLog({
      severity,
      message: `Database Query: ${query.substring(0, 100)}...`,
      metadata: {
        query,
        duration,
        error: error ? error.message : undefined,
      },
    });
  }

  // ==================== ADMIN ACTIVITY TRACKING ====================

  /**
   * Log admin action
   */
  async logAdminAction(
    action: string,
    userId: string,
    resource: string,
    details: any,
    ipAddress?: string
  ): Promise<void> {
    await this.writeLog({
      severity: 'INFO',
      message: `Admin Action: ${action}`,
      resource,
      userId,
      ipAddress,
      metadata: {
        action,
        details,
      },
      labels: {
        category: 'admin',
      },
    });
  }

  // ==================== ALERTING ====================

  /**
   * Send alert (would integrate with Pub/Sub or Cloud Monitoring)
   */
  private async sendAlert(alert: Alert): Promise<void> {
    try {
      // Log the alert
      await this.writeLog({
        severity: alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        message: `ALERT: ${alert.title}`,
        metadata: {
          description: alert.description,
          affectedResources: alert.affectedResources,
          actionRequired: alert.actionRequired,
        },
        labels: {
          category: 'alert',
        },
      });

      // In production, integrate with:
      // - Cloud Monitoring Alerting
      // - Pub/Sub for notification system
      // - PagerDuty/OpsGenie for on-call
      console.log(`🚨 ALERT: ${alert.title} - ${alert.description}`);
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }

  // ==================== MONITORING JOBS ====================

  /**
   * Start periodic monitoring tasks
   */
  private startPeriodicMonitoring(): void {
    // Reset failed login counts every hour
    setInterval(() => {
      this.failedLoginAttempts.clear();
    }, 60 * 60 * 1000);

    // Clear old metrics every 5 minutes
    setInterval(() => {
      for (const [key, values] of this.performanceMetrics.entries()) {
        if (values.length > 100) {
          this.performanceMetrics.set(key, values.slice(-100));
        }
      }
    }, 5 * 60 * 1000);

    // Health check every minute
    setInterval(async () => {
      await this.info('Health check', {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    }, 60 * 1000);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    const summary: any = {};

    for (const [metric, values] of this.performanceMetrics.entries()) {
      if (values.length === 0) continue;

      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      summary[metric] = { avg, min, max, count: values.length };
    }

    return summary;
  }

  /**
   * Get security summary
   */
  getSecuritySummary(): any {
    return {
      failedLoginAttempts: Array.from(this.failedLoginAttempts.entries()),
      suspiciousIPs: Array.from(this.suspiciousIPs),
    };
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const cloudLoggingMonitoring = new CloudLoggingMonitoringService();
export default cloudLoggingMonitoring;
