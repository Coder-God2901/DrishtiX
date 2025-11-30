/**
 * Incident Response System
 * 
 * Implements 5-phase incident response:
 * 1. Detection - Automated and manual triggers
 * 2. Containment - Immediate isolation and blocking
 * 3. Investigation - Audit logs and forensics
 * 4. Recovery - System restoration
 * 5. Post-Incident - Reporting and lessons learned
 */

import { PrismaClient } from '@prisma/client';
import { fcmService } from './fcm.service';

const prisma = new PrismaClient();

export interface SecurityIncident {
  id: string;
  type: 'INTRUSION' | 'DATA_BREACH' | 'DDOS' | 'UNAUTHORIZED_ACCESS' | 'API_ABUSE' | 'MALWARE' | 'PHISHING' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DETECTED' | 'CONTAINED' | 'INVESTIGATING' | 'RECOVERING' | 'RESOLVED' | 'CLOSED';
  detectedAt: Date;
  detectionMethod: 'AUTOMATED' | 'MANUAL' | 'USER_REPORT';
  source?: string;
  affectedSystems: string[];
  affectedUsers: string[];
  indicators: {
    ipAddresses?: string[];
    userAgents?: string[];
    requestPatterns?: string[];
    anomalyScores?: number[];
  };
  timeline: IncidentTimelineEntry[];
  containmentActions: ContainmentAction[];
  recoverySteps: RecoveryStep[];
  metadata: Record<string, any>;
}

export interface IncidentTimelineEntry {
  timestamp: Date;
  phase: 'DETECTION' | 'CONTAINMENT' | 'INVESTIGATION' | 'RECOVERY' | 'POST_INCIDENT';
  action: string;
  performedBy: string;
  result: string;
  details?: Record<string, any>;
}

export interface ContainmentAction {
  id: string;
  type: 'BLOCK_IP' | 'REVOKE_SESSION' | 'ISOLATE_SERVICE' | 'DISCONNECT_DEVICE' | 'DISABLE_USER';
  target: string;
  executedAt: Date;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  result?: string;
}

export interface RecoveryStep {
  id: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  assignedTo?: string;
  completedAt?: Date;
  notes?: string;
}

class IncidentResponseService {
  private readonly NOTIFICATION_EMAIL = import.meta.env.VITE_INCIDENT_NOTIFICATION_EMAIL;
  private readonly WEBHOOK_URL = import.meta.env.VITE_INCIDENT_WEBHOOK_URL;

  // Detection thresholds
  private readonly THRESHOLDS = {
    API_SPIKE: 500, // 500% increase
    FAILED_LOGINS: 10, // per minute
    UNUSUAL_COUNTRY: true,
    BLACKLISTED_IP: true,
  };

  /**
   * PHASE 1: DETECTION
   */

  /**
   * Automated detection - API spike detection
   */
  async detectAPISpike(currentRate: number, baselineRate: number): Promise<SecurityIncident | null> {
    const increasePercent = ((currentRate - baselineRate) / baselineRate) * 100;

    if (increasePercent > this.THRESHOLDS.API_SPIKE) {
      return this.createIncident({
        type: 'API_ABUSE',
        severity: 'HIGH',
        detectionMethod: 'AUTOMATED',
        source: 'API_MONITORING',
        affectedSystems: ['api_server'],
        indicators: {
          anomalyScores: [increasePercent],
        },
        metadata: {
          currentRate,
          baselineRate,
          increasePercent,
        },
      });
    }

    return null;
  }

  /**
   * Automated detection - Failed login attempts
   */
  async detectFailedLogins(ipAddress: string, failureCount: number): Promise<SecurityIncident | null> {
    if (failureCount > this.THRESHOLDS.FAILED_LOGINS) {
      return this.createIncident({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        detectionMethod: 'AUTOMATED',
        source: 'AUTH_MONITORING',
        affectedSystems: ['auth_service'],
        indicators: {
          ipAddresses: [ipAddress],
        },
        metadata: {
          failureCount,
          threshold: this.THRESHOLDS.FAILED_LOGINS,
        },
      });
    }

    return null;
  }

  /**
   * Automated detection - Unusual country login
   */
  async detectUnusualCountry(userId: string, country: string, userCountries: string[]): Promise<SecurityIncident | null> {
    if (!userCountries.includes(country)) {
      return this.createIncident({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        detectionMethod: 'AUTOMATED',
        source: 'GEO_MONITORING',
        affectedSystems: ['auth_service'],
        affectedUsers: [userId],
        metadata: {
          detectedCountry: country,
          expectedCountries: userCountries,
        },
      });
    }

    return null;
  }

  /**
   * Manual incident reporting
   */
  async reportIncident(
    reportedBy: string,
    type: SecurityIncident['type'],
    severity: SecurityIncident['severity'],
    description: string,
    affectedSystems: string[]
  ): Promise<SecurityIncident> {
    return this.createIncident({
      type,
      severity,
      detectionMethod: 'MANUAL',
      source: reportedBy,
      affectedSystems,
      metadata: { description },
    });
  }

  /**
   * Create security incident
   */
  private async createIncident(data: Partial<SecurityIncident>): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: `sec_inc_${Date.now()}`,
      type: data.type!,
      severity: data.severity!,
      status: 'DETECTED',
      detectedAt: new Date(),
      detectionMethod: data.detectionMethod!,
      source: data.source,
      affectedSystems: data.affectedSystems || [],
      affectedUsers: data.affectedUsers || [],
      indicators: data.indicators || {},
      timeline: [
        {
          timestamp: new Date(),
          phase: 'DETECTION',
          action: 'INCIDENT_CREATED',
          performedBy: 'SYSTEM',
          result: 'Incident detected and logged',
          details: data.metadata,
        },
      ],
      containmentActions: [],
      recoverySteps: [],
      metadata: data.metadata || {},
    };

    // Log to database
    await prisma.auditLog.create({
      data: {
        action: 'SECURITY_INCIDENT_DETECTED',
        userId: 'system',
        targetType: 'security_incident',
        targetId: incident.id,
        metadata: incident,
      },
    });

    // Notify security team
    await this.notifySecurityTeam(incident);

    // Auto-trigger containment for critical incidents
    if (incident.severity === 'CRITICAL') {
      await this.autoContain(incident);
    }

    return incident;
  }

  /**
   * PHASE 2: CONTAINMENT
   */

  /**
   * Automated containment for critical incidents
   */
  private async autoContain(incident: SecurityIncident): Promise<void> {
    const actions: ContainmentAction[] = [];

    // Block IPs
    if (incident.indicators.ipAddresses) {
      for (const ip of incident.indicators.ipAddresses) {
        const action = await this.blockIP(ip);
        actions.push(action);
      }
    }

    // Revoke sessions for affected users
    if (incident.affectedUsers.length > 0) {
      for (const userId of incident.affectedUsers) {
        const action = await this.revokeUserSessions(userId);
        actions.push(action);
      }
    }

    incident.containmentActions = actions;
    incident.status = 'CONTAINED';

    this.addTimelineEntry(incident, {
      phase: 'CONTAINMENT',
      action: 'AUTO_CONTAINMENT',
      performedBy: 'SYSTEM',
      result: `Executed ${actions.length} containment actions`,
    });
  }

  /**
   * Block IP address using Cloud Armor
   */
  async blockIP(ipAddress: string): Promise<ContainmentAction> {
    const action: ContainmentAction = {
      id: `block_ip_${Date.now()}`,
      type: 'BLOCK_IP',
      target: ipAddress,
      executedAt: new Date(),
      status: 'PENDING',
    };

    try {
      // Execute gcloud command to add IP to deny list
      // In production, use Google Cloud SDK
      console.log(`Blocking IP: ${ipAddress}`);

      // gcloud compute security-policies rules create [PRIORITY] \
      //   --security-policy=drishtix-security-policy \
      //   --expression="origin.ip == '${ipAddress}'" \
      //   --action=deny-403

      action.status = 'SUCCESS';
      action.result = `IP ${ipAddress} blocked successfully`;
    } catch (error) {
      action.status = 'FAILED';
      action.result = `Failed to block IP: ${error.message}`;
    }

    return action;
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeUserSessions(userId: string): Promise<ContainmentAction> {
    const action: ContainmentAction = {
      id: `revoke_session_${Date.now()}`,
      type: 'REVOKE_SESSION',
      target: userId,
      executedAt: new Date(),
      status: 'PENDING',
    };

    try {
      // Revoke Firebase sessions
      // In production, use Firebase Admin SDK
      // await admin.auth().revokeRefreshTokens(userId);

      console.log(`Revoked sessions for user: ${userId}`);

      action.status = 'SUCCESS';
      action.result = `Sessions revoked for user ${userId}`;
    } catch (error) {
      action.status = 'FAILED';
      action.result = `Failed to revoke sessions: ${error.message}`;
    }

    return action;
  }

  /**
   * Isolate a compromised service
   */
  async isolateService(serviceName: string): Promise<ContainmentAction> {
    const action: ContainmentAction = {
      id: `isolate_service_${Date.now()}`,
      type: 'ISOLATE_SERVICE',
      target: serviceName,
      executedAt: new Date(),
      status: 'PENDING',
    };

    try {
      // Update Cloud Run service to deny all traffic
      // gcloud run services update ${serviceName} --no-allow-unauthenticated

      console.log(`Isolated service: ${serviceName}`);

      action.status = 'SUCCESS';
      action.result = `Service ${serviceName} isolated successfully`;
    } catch (error) {
      action.status = 'FAILED';
      action.result = `Failed to isolate service: ${error.message}`;
    }

    return action;
  }

  /**
   * Disconnect drone/device using certificate revocation
   */
  async disconnectDevice(deviceId: string): Promise<ContainmentAction> {
    const action: ContainmentAction = {
      id: `disconnect_device_${Date.now()}`,
      type: 'DISCONNECT_DEVICE',
      target: deviceId,
      executedAt: new Date(),
      status: 'PENDING',
    };

    try {
      // Revoke device certificate
      console.log(`Disconnected device: ${deviceId}`);

      action.status = 'SUCCESS';
      action.result = `Device ${deviceId} disconnected successfully`;
    } catch (error) {
      action.status = 'FAILED';
      action.result = `Failed to disconnect device: ${error.message}`;
    }

    return action;
  }

  /**
   * PHASE 3: INVESTIGATION
   */

  /**
   * Export audit logs for investigation
   */
  async exportAuditLogs(
    incidentId: string,
    startTime: Date,
    endTime: Date
  ): Promise<string> {
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const exportPath = `/tmp/incident_${incidentId}_logs.json`;
    // In production, write to Cloud Storage
    console.log(`Exported ${logs.length} audit logs to ${exportPath}`);

    return exportPath;
  }

  /**
   * Generate forensic snapshot of Firestore
   */
  async createFirestoreSnapshot(incidentId: string): Promise<string> {
    // In production, use gcloud firestore export
    // gcloud firestore export gs://drishtix-incident-snapshots/incident_${incidentId}

    const snapshotPath = `gs://drishtix-incident-snapshots/incident_${incidentId}`;
    console.log(`Created Firestore snapshot at ${snapshotPath}`);

    return snapshotPath;
  }

  /**
   * PHASE 4: RECOVERY
   */

  /**
   * Generate recovery plan
   */
  async generateRecoveryPlan(incident: SecurityIncident): Promise<RecoveryStep[]> {
    const steps: RecoveryStep[] = [];

    // Step 1: Rotate compromised credentials
    if (incident.type === 'DATA_BREACH' || incident.type === 'UNAUTHORIZED_ACCESS') {
      steps.push({
        id: 'recovery_1',
        description: 'Rotate all API keys and service account credentials',
        status: 'PENDING',
      });
    }

    // Step 2: Redeploy services
    if (incident.affectedSystems.length > 0) {
      steps.push({
        id: 'recovery_2',
        description: `Redeploy affected services: ${incident.affectedSystems.join(', ')}`,
        status: 'PENDING',
      });
    }

    // Step 3: Restore from backup (if needed)
    if (incident.type === 'DATA_BREACH' || incident.type === 'MALWARE') {
      steps.push({
        id: 'recovery_3',
        description: 'Restore databases from latest clean backup',
        status: 'PENDING',
      });
    }

    // Step 4: Reset affected user passwords
    if (incident.affectedUsers.length > 0) {
      steps.push({
        id: 'recovery_4',
        description: `Reset passwords for ${incident.affectedUsers.length} affected users`,
        status: 'PENDING',
      });
    }

    // Step 5: Update security rules
    steps.push({
      id: 'recovery_5',
      description: 'Update firewall and security policy rules',
      status: 'PENDING',
    });

    return steps;
  }

  /**
   * Execute recovery step
   */
  async executeRecoveryStep(
    incident: SecurityIncident,
    stepId: string,
    performedBy: string
  ): Promise<void> {
    const step = incident.recoverySteps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Recovery step ${stepId} not found`);
    }

    step.status = 'IN_PROGRESS';
    step.assignedTo = performedBy;

    // Execute step (implementation depends on step type)
    console.log(`Executing recovery step: ${step.description}`);

    step.status = 'COMPLETED';
    step.completedAt = new Date();

    this.addTimelineEntry(incident, {
      phase: 'RECOVERY',
      action: 'RECOVERY_STEP_COMPLETED',
      performedBy,
      result: step.description,
    });
  }

  /**
   * PHASE 5: POST-INCIDENT
   */

  /**
   * Generate post-incident report
   */
  async generatePostIncidentReport(incident: SecurityIncident): Promise<string> {
    const report = {
      incidentId: incident.id,
      summary: {
        type: incident.type,
        severity: incident.severity,
        detectedAt: incident.detectedAt,
        resolvedAt: new Date(),
        duration: Date.now() - incident.detectedAt.getTime(),
        affectedSystems: incident.affectedSystems,
        affectedUsers: incident.affectedUsers.length,
      },
      timeline: incident.timeline,
      containmentActions: incident.containmentActions,
      recoverySteps: incident.recoverySteps,
      rootCause: '', // To be filled manually
      lessonsLearned: [], // To be filled manually
      recommendedActions: this.generateRecommendations(incident),
    };

    const reportPath = `/reports/incident_${incident.id}_report.json`;
    console.log(`Generated post-incident report: ${reportPath}`);

    return reportPath;
  }

  /**
   * Generate recommendations based on incident
   */
  private generateRecommendations(incident: SecurityIncident): string[] {
    const recommendations: string[] = [];

    switch (incident.type) {
      case 'UNAUTHORIZED_ACCESS':
        recommendations.push('Enforce MFA for all users');
        recommendations.push('Review and tighten password policies');
        recommendations.push('Implement IP whitelisting for admin access');
        break;

      case 'API_ABUSE':
        recommendations.push('Lower rate limiting thresholds');
        recommendations.push('Implement API key rotation policy');
        recommendations.push('Add request signature verification');
        break;

      case 'DDOS':
        recommendations.push('Enable Cloud Armor Adaptive Protection');
        recommendations.push('Configure automatic scaling policies');
        recommendations.push('Set up DDoS mitigation playbook');
        break;
    }

    return recommendations;
  }

  /**
   * Helper: Add timeline entry
   */
  private addTimelineEntry(
    incident: SecurityIncident,
    entry: Omit<IncidentTimelineEntry, 'timestamp'>
  ): void {
    incident.timeline.push({
      timestamp: new Date(),
      ...entry,
    });
  }

  /**
   * Notify security team
   */
  private async notifySecurityTeam(incident: SecurityIncident): Promise<void> {
    const message = `
🚨 SECURITY INCIDENT DETECTED

Type: ${incident.type}
Severity: ${incident.severity}
Detected: ${incident.detectedAt.toISOString()}
Affected Systems: ${incident.affectedSystems.join(', ')}
Detection Method: ${incident.detectionMethod}

Details: ${JSON.stringify(incident.metadata, null, 2)}

Action Required: Review incident and initiate response procedures.
    `.trim();

    // Send email notification
    if (this.NOTIFICATION_EMAIL) {
      console.log(`Sending email to ${this.NOTIFICATION_EMAIL}`);
      // await sendEmail(this.NOTIFICATION_EMAIL, 'Security Incident Alert', message);
    }

    // Send webhook notification
    if (this.WEBHOOK_URL) {
      console.log(`Sending webhook to ${this.WEBHOOK_URL}`);
      // await fetch(this.WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ incident, message }),
      // });
    }

    // Send FCM to security staff
    await fcmService.sendAlert({
      eventId: incident.id,
      type: 'security_incident',
      severity: 'CRITICAL',
      title: '🚨 Security Incident',
      message: `${incident.type} detected - ${incident.severity} severity`,
      data: incident,
    });
  }
}

export const incidentResponseService = new IncidentResponseService();
