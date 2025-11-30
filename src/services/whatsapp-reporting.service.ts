/**
 * DrishtiX - WhatsApp Incident Reporting Service
 * 
 * Attendee incident reporting via WhatsApp using:
 * - Twilio WhatsApp Business API
 * - Cloud Functions for webhook handling
 * - Firestore for incident storage
 * - Gemini API for message analysis & categorization
 * 
 * GCP Integration:
 * - Cloud Functions (Twilio webhooks)
 * - Firestore (incident database)
 * - Gemini API (NLP for message understanding)
 * - Cloud Storage (media attachments)
 */

import axios from 'axios';
import { getFirestore, collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { proofValidationService } from './proof-validation.service';
import { locationBasedAlertService } from './location-based-alert.service';

interface WhatsAppMessage {
  from: string; // Phone number
  body: string;
  mediaUrls?: string[];
  timestamp: number;
}

interface IncidentReport {
  reportId: string;
  reporterPhone: string;
  reporterName?: string;
  eventId: string;
  category: 'medical' | 'security' | 'safety' | 'lost_found' | 'facility' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: {
    lat?: number;
    lng?: number;
    description: string;
  };
  mediaUrls: string[];
  timestamp: number;
  status: 'pending' | 'proof_validation' | 'validated' | 'acknowledged' | 'dispatched' | 'resolved' | 'rejected';
  confidence: number; // AI categorization confidence
  aiSummary: string;
  priority: number; // 1-10
  proofValidation?: {
    validated: boolean;
    confidence: number;
    validatedAt: number;
    validationMethod: 'gcp-vision' | 'tensorflow-js' | 'manual';
    anomalies: string[];
  };
  alertGenerated?: boolean;
  alertId?: string;
}

interface WhatsAppConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsAppNumber: string;
  webhookUrl: string;
}

class WhatsAppReportingService {
  private config: WhatsAppConfig | null = null;
  private firestore: any = null;
  private genAI: GoogleGenerativeAI | null = null;
  private initialized = false;

  /**
   * Initialize WhatsApp reporting service
   */
  async initialize(config?: Partial<WhatsAppConfig>) {
    if (this.initialized) {
      console.warn('WhatsAppReportingService already initialized');
      return;
    }

    try {
      this.config = {
        twilioAccountSid: config?.twilioAccountSid || import.meta.env.VITE_TWILIO_ACCOUNT_SID,
        twilioAuthToken: config?.twilioAuthToken || import.meta.env.VITE_TWILIO_AUTH_TOKEN,
        twilioWhatsAppNumber: config?.twilioWhatsAppNumber || import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER,
        webhookUrl: config?.webhookUrl || import.meta.env.VITE_WHATSAPP_WEBHOOK_URL,
      };

      this.firestore = getFirestore();
      this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

      this.initialized = true;
      console.log('✅ WhatsAppReportingService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize WhatsAppReportingService:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message (confirmation/response)
   */
  async sendMessage(options: {
    to: string; // Phone number in E.164 format
    message: string;
    mediaUrl?: string;
  }): Promise<void> {
    if (!this.config) {
      throw new Error('Service not initialized');
    }

    try {
      const { to, message, mediaUrl } = options;

      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.twilioAccountSid}/Messages.json`,
        new URLSearchParams({
          From: `whatsapp:${this.config.twilioWhatsAppNumber}`,
          To: `whatsapp:${to}`,
          Body: message,
          ...(mediaUrl && { MediaUrl: mediaUrl }),
        }),
        {
          auth: {
            username: this.config.twilioAccountSid,
            password: this.config.twilioAuthToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log(`✅ WhatsApp message sent to ${to}`);
    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Process incoming WhatsApp message (called from Cloud Function webhook)
   */
  async processIncomingMessage(message: WhatsAppMessage, eventId: string): Promise<IncidentReport> {
    if (!this.genAI || !this.firestore) {
      throw new Error('Service not initialized');
    }

    try {
      // Step 1: Analyze message with Gemini AI
      const analysis = await this.analyzeIncidentMessage(message.body, message.mediaUrls);

      // Step 2: Create incident report (reportId will be set to Firestore doc ID after creation)
      const reportData: Omit<IncidentReport, 'reportId'> & { reportId?: string } = {
        reporterPhone: message.from,
        eventId,
        category: analysis.category,
        severity: analysis.severity,
        description: message.body,
        location: analysis.location,
        mediaUrls: message.mediaUrls || [],
        timestamp: message.timestamp,
        status: 'pending',
        confidence: analysis.confidence,
        aiSummary: analysis.summary,
        priority: analysis.priority,
      };

      // Step 3: Save to Firestore
      const reportsRef = collection(this.firestore, 'incident_reports');
      const reportDoc = await addDoc(reportsRef, {
        ...reportData,
        timestamp: Timestamp.fromMillis(message.timestamp),
      });
      // Set Firestore doc ID as reportId
      await updateDoc(reportDoc, { reportId: reportDoc.id });
      const report: IncidentReport = { ...reportData, reportId: reportDoc.id } as IncidentReport;

      // Step 4: Validate proof media if present
      if (message.mediaUrls && message.mediaUrls.length > 0) {
        report.status = 'proof_validation';
        await this.validateProofs(report, eventId);
      }

      // Step 5: Send acknowledgment to reporter
      await this.sendAcknowledgment(message.from, report);

      // Step 6: Trigger alert if critical and validated
      if (report.severity === 'critical' && report.proofValidation?.validated) {
        await this.triggerCriticalAlert(report, eventId);
      }

      console.log(`✅ Incident report created: ${report.reportId} (${report.category})`);
      return report;
    } catch (error) {
      console.error('❌ Failed to process WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Analyze incident message using Gemini AI
   */
  private async analyzeIncidentMessage(
    messageBody: string,
    _mediaUrls?: string[]
  ): Promise<{
    category: IncidentReport['category'];
    severity: IncidentReport['severity'];
    location?: { description: string };
    confidence: number;
    summary: string;
    priority: number;
  }> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Analyze this incident report from an event attendee and categorize it.

Message: "${messageBody}"

Provide a JSON response with:
{
  "category": "medical" | "security" | "safety" | "lost_found" | "facility" | "other",
  "severity": "critical" | "high" | "medium" | "low",
  "location": { "description": "extracted location if mentioned" } or null,
  "confidence": 0.0 to 1.0,
  "summary": "brief 1-sentence summary",
  "priority": 1-10 (10 = most urgent),
  "keywords": ["extracted", "key", "terms"]
}

Guidelines:
- "critical" severity: Life-threatening situations, violence, major fires, stampedes
- "high" severity: Injuries, fights, significant safety hazards
- "medium" severity: Minor injuries, lost persons, facility issues
- "low" severity: General inquiries, minor complaints

Extract location hints like "near main stage", "gate 3", "food court", etc.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Invalid response from Gemini');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze message:', error);
      // Fallback categorization
      return {
        category: 'other',
        severity: 'medium',
        confidence: 0.3,
        summary: messageBody.substring(0, 100),
        priority: 5,
      };
    }
  }

  /**
   * Send acknowledgment message to reporter
   */
  private async sendAcknowledgment(phone: string, report: IncidentReport): Promise<void> {
    const severityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '📋',
      low: 'ℹ️',
    };

    const message = `${severityEmoji[report.severity]} *Incident Report Received*

Thank you for reporting! Your incident has been logged.

📍 *Report ID:* ${report.reportId}
📂 *Category:* ${report.category.replace('_', ' ').toUpperCase()}
⚡ *Priority:* ${report.severity.toUpperCase()}

${report.severity === 'critical' ? '🚑 Emergency response teams have been alerted!\n' : ''}${report.severity === 'high' ? '👮 Our team will respond shortly.\n' : ''}
We'll keep you updated via WhatsApp.

Stay safe! 🙏`;

    await this.sendMessage({ to: phone, message });
  }

  /**
   * Trigger critical alert (integrate with existing alert system)
   */
  private async triggerCriticalAlert(report: IncidentReport, eventId: string): Promise<void> {
    console.warn(`🚨 CRITICAL ALERT: ${report.aiSummary}`);
    console.warn(`   Category: ${report.category}`);
    console.warn(`   Reporter: ${report.reporterPhone}`);

    // Generate location-based alert to nearby attendees
    if (report.location && (report.location.lat !== undefined || report.location.lng !== undefined)) {
      try {
        const alert = await locationBasedAlertService.generateAlert({
          reportId: report.reportId,
          eventId,
          incidentCategory: report.category,
          incidentLocation: {
            lat: report.location.lat || 0,
            lng: report.location.lng || 0,
            description: report.location.description,
          },
          severity: report.severity,
          title: `${report.category.toUpperCase()}: ${report.aiSummary}`,
          message: report.description,
          channels: ['fcm', 'whatsapp'],
        });

        // Update report with alert ID
        if (this.firestore && report.reportId) {
          const reportRef = doc(this.firestore, 'incident_reports', report.reportId);
          await updateDoc(reportRef, {
            alertGenerated: true,
            alertId: alert.id,
          });
        }

        console.log(`✅ Location-based alert generated: ${alert.id}`);
      } catch (error) {
        console.error('❌ Failed to generate location-based alert:', error);
      }
    }
  }

  /**
   * Validate incident proofs using AI
   */
  private async validateProofs(report: IncidentReport, eventId: string): Promise<void> {
    if (!report.mediaUrls || report.mediaUrls.length === 0) {
      return;
    }

    try {
      console.log(`🔍 Validating ${report.mediaUrls.length} proofs for report ${report.reportId}...`);

      // Convert media URLs to File objects (simplified - in production use proper blob handling)
      for (const mediaUrl of report.mediaUrls) {
        // Fetch media from URL
        const response = await fetch(mediaUrl);
        const blob = await response.blob();
        const filename = mediaUrl.split('/').pop() || 'proof.jpg';
        let file: File;
        try {
          file = new File([blob], filename, { type: blob.type });
        } catch (e) {
          // Fallback for environments where File constructor is not available
          // @ts-ignore
          file = blob;
        }

        // Validate with AI
        const { validation } = await proofValidationService.uploadAndValidate({
          reportId: report.reportId,
          file,
          uploadedBy: report.reporterPhone,
          incidentCategory: report.category,
          eventId,
        });

        // Update report with validation results
        report.proofValidation = {
          validated: validation.isValid,
          confidence: validation.confidence,
          validatedAt: validation.processedAt,
          validationMethod: validation.validationMethod,
          anomalies: validation.anomalies,
        };

        // Update status based on validation
        if (validation.isValid && validation.confidence >= 0.75) {
          report.status = 'validated';
          console.log(`✅ Proof validated (confidence: ${validation.confidence.toFixed(2)})`);
        } else if (validation.anomalies && validation.anomalies.length > 0) {
          report.status = 'pending'; // Requires manual review
          console.warn(`⚠️ Proof validation flagged anomalies: ${validation.anomalies.join(', ')}`);

          // Notify reporter about manual review
          await this.sendMessage({
            to: report.reporterPhone,
            message: `📋 Your incident proof is being reviewed by our team.\n\n` +
              `Validation detected: ${validation.anomalies[0]}\n` +
              `We'll update you shortly. Thank you for your patience!`,
          });
        } else {
          report.status = 'validated';
        }

        // Update Firestore
        if (this.firestore && report.reportId) {
          const reportRef = doc(this.firestore, 'incident_reports', report.reportId);
          await updateDoc(reportRef, {
            status: report.status,
            proofValidation: report.proofValidation,
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to validate proofs:', error);
      report.status = 'pending'; // Fallback to manual review
    }
  }

  /**
   * Update incident status and notify reporter
   */
  async updateIncidentStatus(
    reportId: string,
    _eventId: string,
    status: IncidentReport['status'],
    message?: string
  ): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    // Get report to find reporter's phone
    // In production, you'd query by reportId

    const statusMessages = {
      acknowledged: '✅ Your report has been acknowledged by our team.',
      dispatched: '🚀 Response team has been dispatched to your location.',
      resolved: '✨ Your reported incident has been resolved. Thank you for helping keep everyone safe!',
    };

    const updateMessage = message || statusMessages[status as keyof typeof statusMessages];

    if (updateMessage) {
      // Send status update (phone number would come from Firestore)
      console.log(`📱 Status update for ${reportId}: ${status}`);
    }
  }

  /**
   * Get incident statistics
   */
  async getIncidentStats(_eventId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    averageResponseTime: number;
  }> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    // In production, query Firestore for aggregated stats
    return {
      total: 0,
      byCategory: {},
      bySeverity: {},
      byStatus: {},
      averageResponseTime: 0,
    };
  }

  /**
   * Send bulk update to all reporters (e.g., event-wide safety message)
   */
  async broadcastMessage(options: {
    eventId: string;
    message: string;
    recipientFilter?: 'all' | 'active_reporters' | 'critical_reporters';
  }): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const { message } = options;

    // In production, fetch phone numbers from Firestore based on filter
    const phoneNumbers: string[] = []; // Placeholder

    for (const phone of phoneNumbers) {
      await this.sendMessage({ to: phone, message });
    }

    console.log(`📢 Broadcast sent to ${phoneNumbers.length} recipients`);
  }

  /**
   * Example incident report templates (for testing)
   */
  readonly EXAMPLE_REPORTS = {
    MEDICAL_EMERGENCY: {
      body: "Someone collapsed near the main stage! Need medical help urgently!",
      category: 'medical' as const,
      severity: 'critical' as const,
    },
    SECURITY_ISSUE: {
      body: "There's a fight happening at Gate 3. Please send security!",
      category: 'security' as const,
      severity: 'high' as const,
    },
    LOST_CHILD: {
      body: "I lost my 7-year-old daughter. She's wearing a pink dress. Last seen near food court.",
      category: 'lost_found' as const,
      severity: 'high' as const,
    },
    FACILITY_ISSUE: {
      body: "The restroom near VIP area is flooded and unusable.",
      category: 'facility' as const,
      severity: 'medium' as const,
    },
  };
}

// Export singleton instance
export const whatsappReportingService = new WhatsAppReportingService();

// Export types
export type {
  WhatsAppMessage,
  IncidentReport,
  WhatsAppConfig,
};
