/**
 * Cloud Function: Alert Triggers
 *
 * Automatically triggers alerts when proof validation events occur.
 * Integrates with Pub/Sub, Firestore, and Twilio for multi-channel alerting.
 *
 * Trigger: Pub/Sub topic "incident-alerts"
 *
 * Features:
 * - Processes incident alerts from Pub/Sub
 * - Validates alert severity and proof data
 * - Sends SMS alerts via Twilio for critical incidents
 * - Stores alert history in Firestore
 * - Triggers escalation for unacknowledged alerts
 * - Integrates with agent orchestration for automated dispatch
 */

const functions = require('@google-cloud/functions-framework');
const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');
const twilio = require('twilio');

// Initialize clients
const pubsub = new PubSub();
const firestore = new Firestore();
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Constants
const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const ESCALATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const ALERT_COLLECTION = 'incident_alerts';
const ESCALATION_TOPIC = 'alert-escalation';

/**
 * Main Cloud Function entry point
 * Triggered by Pub/Sub message on "incident-alerts" topic
 */
functions.cloudEvent('handleAlertTrigger', async (cloudEvent) => {
  try {
    console.log('Alert trigger received:', cloudEvent);

    // Decode Pub/Sub message
    const message = cloudEvent.data.message;
    const data = message.data ? JSON.parse(Buffer.from(message.data, 'base64').toString()) : null;

    if (!data) {
      console.error('No data in Pub/Sub message');
      return;
    }

    console.log('Processing alert:', data);

    // Validate alert data
    const validationResult = validateAlertData(data);
    if (!validationResult.valid) {
      console.error('Invalid alert data:', validationResult.errors);
      return;
    }

    // Process the alert
    const alertId = await processAlert(data);
    console.log('Alert processed successfully:', alertId);

    // Send notifications based on severity
    if (shouldSendSMS(data.severity)) {
      await sendSMSNotifications(data, alertId);
    }

    // Schedule escalation check for critical alerts
    if (data.severity === ALERT_SEVERITY.CRITICAL) {
      await scheduleEscalation(alertId, data);
    }

    console.log('Alert trigger completed successfully');
  } catch (error) {
    console.error('Error processing alert trigger:', error);
    throw error; // Pub/Sub will retry
  }
});

/**
 * Validate alert data structure and required fields
 */
function validateAlertData(data) {
  const errors = [];

  if (!data.incidentId) {
    errors.push('Missing incidentId');
  }

  if (!data.severity || !Object.values(ALERT_SEVERITY).includes(data.severity)) {
    errors.push('Invalid or missing severity');
  }

  if (!data.type) {
    errors.push('Missing alert type');
  }

  if (!data.location) {
    errors.push('Missing location data');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Process and store alert in Firestore
 */
async function processAlert(data) {
  const alertDoc = {
    incidentId: data.incidentId,
    severity: data.severity,
    type: data.type,
    location: data.location,
    description: data.description || '',
    metadata: data.metadata || {},
    proofData: data.proofData || null,
    timestamp: Firestore.Timestamp.now(),
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    escalated: false,
    escalatedAt: null,
    notifications: {
      sms: false,
      email: false,
      push: false,
    },
    createdAt: Firestore.Timestamp.now(),
    updatedAt: Firestore.Timestamp.now(),
  };

  // Store in Firestore
  const docRef = await firestore.collection(ALERT_COLLECTION).add(alertDoc);

  console.log('Alert stored in Firestore:', docRef.id);

  return docRef.id;
}

/**
 * Determine if SMS should be sent based on severity
 */
function shouldSendSMS(severity) {
  return severity === ALERT_SEVERITY.HIGH || severity === ALERT_SEVERITY.CRITICAL;
}

/**
 * Send SMS notifications via Twilio
 */
async function sendSMSNotifications(data, alertId) {
  try {
    // Get on-call responders from Firestore
    const respondersSnapshot = await firestore
      .collection('responders')
      .where('onCall', '==', true)
      .where('severityLevel', '<=', getSeverityLevel(data.severity))
      .get();

    if (respondersSnapshot.empty) {
      console.warn('No on-call responders found for severity:', data.severity);
      return;
    }

    const smsPromises = [];

    respondersSnapshot.forEach((doc) => {
      const responder = doc.data();
      if (responder.phone) {
        const smsPromise = sendSMS(responder.phone, formatAlertMessage(data, alertId), alertId);
        smsPromises.push(smsPromise);
      }
    });

    const results = await Promise.allSettled(smsPromises);

    // Log results
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`SMS notifications sent: ${successful} successful, ${failed} failed`);

    // Update alert document
    await firestore.collection(ALERT_COLLECTION).doc(alertId).update({
      'notifications.sms': true,
      'notifications.smsCount': successful,
      updatedAt: Firestore.Timestamp.now(),
    });
  } catch (error) {
    console.error('Error sending SMS notifications:', error);
    throw error;
  }
}

/**
 * Send individual SMS via Twilio
 */
async function sendSMS(to, body, alertId) {
  try {
    const message = await twilioClient.messages.create({
      body,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      statusCallback: `${process.env.API_BASE_URL}/webhooks/sms-status/${alertId}`,
    });

    console.log('SMS sent:', message.sid);
    return message;
  } catch (error) {
    console.error('Error sending SMS to', to, error);
    throw error;
  }
}

/**
 * Format alert message for SMS
 */
function formatAlertMessage(data, alertId) {
  const severityEmoji = {
    [ALERT_SEVERITY.LOW]: '🔵',
    [ALERT_SEVERITY.MEDIUM]: '🟡',
    [ALERT_SEVERITY.HIGH]: '🟠',
    [ALERT_SEVERITY.CRITICAL]: '🔴',
  };

  return `${severityEmoji[data.severity]} ALERT: ${data.type}
Location: ${data.location.name || data.location.coordinates}
${data.description || ''}
Alert ID: ${alertId}
Time: ${new Date().toLocaleTimeString()}

Reply ACK to acknowledge.`;
}

/**
 * Get numeric severity level
 */
function getSeverityLevel(severity) {
  const levels = {
    [ALERT_SEVERITY.LOW]: 1,
    [ALERT_SEVERITY.MEDIUM]: 2,
    [ALERT_SEVERITY.HIGH]: 3,
    [ALERT_SEVERITY.CRITICAL]: 4,
  };
  return levels[severity] || 1;
}

/**
 * Schedule escalation check for critical alerts
 */
async function scheduleEscalation(alertId, data) {
  try {
    // Store escalation task in Firestore
    await firestore.collection('escalation_tasks').add({
      alertId,
      incidentId: data.incidentId,
      scheduledFor: Firestore.Timestamp.fromMillis(Date.now() + ESCALATION_TIMEOUT),
      executed: false,
      createdAt: Firestore.Timestamp.now(),
    });

    // Publish to escalation topic for Cloud Scheduler processing
    const escalationMessage = {
      alertId,
      incidentId: data.incidentId,
      severity: data.severity,
      checkAt: Date.now() + ESCALATION_TIMEOUT,
    };

    const messageBuffer = Buffer.from(JSON.stringify(escalationMessage));
    await pubsub.topic(ESCALATION_TOPIC).publish(messageBuffer);

    console.log('Escalation scheduled for alert:', alertId);
  } catch (error) {
    console.error('Error scheduling escalation:', error);
    // Don't throw - escalation is optional
  }
}

/**
 * Health check endpoint
 */
functions.http('health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    function: 'alert-triggers',
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  handleAlertTrigger: functions.cloudEvent('handleAlertTrigger'),
  health: functions.http('health'),
};
