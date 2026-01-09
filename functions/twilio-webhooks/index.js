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
 * Cloud Function: Twilio Webhooks
 *
 * Handles incoming Twilio webhook events (SMS, WhatsApp, voice).
 * Integrates with Gemini Pro for intelligent message categorization.
 *
 * Trigger: HTTP endpoint (publicly accessible for Twilio)
 *
 * Features:
 * - Processes incoming SMS and WhatsApp messages
 * - Validates Twilio webhook signatures
 * - Uses Gemini Pro for message categorization
 * - Routes emergency messages to incident alerts
 * - Handles ACK responses for alert acknowledgment
 * - Stores message history in Firestore
 * - Publishes categorized messages to Pub/Sub
 */

const functions = require('@google-cloud/functions-framework');
const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');
const twilio = require('twilio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize clients
const pubsub = new PubSub();
const firestore = new Firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Message categories
const MESSAGE_CATEGORIES = {
  EMERGENCY: 'emergency',
  INCIDENT_REPORT: 'incident_report',
  ACKNOWLEDGMENT: 'acknowledgment',
  QUESTION: 'question',
  FEEDBACK: 'feedback',
  SPAM: 'spam',
  OTHER: 'other',
};

/**
 * Main Cloud Function entry point
 * Handles HTTP POST requests from Twilio
 */
functions.http('handleTwilioWebhook', async (req, res) => {
  try {
    console.log('Twilio webhook received:', req.method, req.body);

    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Validate Twilio signature
    const isValid = validateTwilioSignature(req);
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.error('Invalid Twilio signature');
      res.status(403).send('Forbidden');
      return;
    }

    // Extract message data
    const messageData = extractMessageData(req.body);
    console.log('Extracted message data:', messageData);

    // Store message in Firestore
    const messageId = await storeMessage(messageData);

    // Categorize message using Gemini Pro
    const category = await categorizeMessage(messageData.body);
    console.log('Message categorized as:', category);

    // Update message with category
    await updateMessageCategory(messageId, category);

    // Route message based on category
    await routeMessage(messageData, category, messageId);

    // Generate response
    const response = await generateResponse(messageData, category);

    // Send TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(response);
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);

    // Send error response in TwiML format
    res.set('Content-Type', 'text/xml');
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, we encountered an error processing your message. Please try again later.</Message>
</Response>`);
  }
});

/**
 * Validate Twilio webhook signature
 */
function validateTwilioSignature(req) {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = req.headers['x-twilio-signature'];
    const url = `${process.env.WEBHOOK_BASE_URL}${req.path}`;

    return twilio.validateRequest(authToken, signature, url, req.body);
  } catch (error) {
    console.error('Error validating Twilio signature:', error);
    return false;
  }
}

/**
 * Extract message data from Twilio webhook
 */
function extractMessageData(body) {
  const messageType = body.From.startsWith('whatsapp:') ? 'whatsapp' : 'sms';

  return {
    type: messageType,
    from: body.From.replace('whatsapp:', ''),
    to: body.To.replace('whatsapp:', ''),
    body: body.Body || '',
    messageSid: body.MessageSid,
    accountSid: body.AccountSid,
    numMedia: parseInt(body.NumMedia) || 0,
    mediaUrls: extractMediaUrls(body),
    timestamp: new Date().toISOString(),
    rawData: body,
  };
}

/**
 * Extract media URLs from Twilio webhook
 */
function extractMediaUrls(body) {
  const urls = [];
  const numMedia = parseInt(body.NumMedia) || 0;

  for (let i = 0; i < numMedia; i++) {
    const url = body[`MediaUrl${i}`];
    const contentType = body[`MediaContentType${i}`];

    if (url) {
      urls.push({ url, contentType });
    }
  }

  return urls;
}

/**
 * Store message in Firestore
 */
async function storeMessage(messageData) {
  const messageDoc = {
    ...messageData,
    category: null,
    processed: false,
    createdAt: Firestore.Timestamp.now(),
    updatedAt: Firestore.Timestamp.now(),
  };

  const docRef = await firestore.collection('twilio_messages').add(messageDoc);
  console.log('Message stored in Firestore:', docRef.id);

  return docRef.id;
}

/**
 * Categorize message using Gemini Pro
 */
async function categorizeMessage(messageBody) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Categorize the following message from an event attendee into one of these categories:
- emergency: Immediate life-threatening situations (fire, medical emergency, violence)
- incident_report: Non-emergency safety concerns (overcrowding, hazards, suspicious activity)
- acknowledgment: ACK or confirmation responses to alerts
- question: Questions about the event
- feedback: General feedback or suggestions
- spam: Spam or irrelevant messages
- other: Anything else

Message: "${messageBody}"

Respond with ONLY the category name in lowercase, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim().toLowerCase();

    // Validate category
    if (Object.values(MESSAGE_CATEGORIES).includes(category)) {
      return category;
    }

    // Fallback categorization
    return fallbackCategorization(messageBody);
  } catch (error) {
    console.error('Error categorizing message with Gemini:', error);
    return fallbackCategorization(messageBody);
  }
}

/**
 * Fallback categorization using keywords
 */
function fallbackCategorization(messageBody) {
  const lowerBody = messageBody.toLowerCase();

  // Emergency keywords
  if (/\b(help|fire|medical|emergency|911|danger|attack|injured)\b/i.test(lowerBody)) {
    return MESSAGE_CATEGORIES.EMERGENCY;
  }

  // ACK responses
  if (/\b(ack|acknowledge|confirm|received|ok)\b/i.test(lowerBody)) {
    return MESSAGE_CATEGORIES.ACKNOWLEDGMENT;
  }

  // Incident keywords
  if (/\b(crowd|overcrowding|suspicious|hazard|concern|report)\b/i.test(lowerBody)) {
    return MESSAGE_CATEGORIES.INCIDENT_REPORT;
  }

  // Question indicators
  if (/\?|how|what|where|when|why|who/i.test(lowerBody)) {
    return MESSAGE_CATEGORIES.QUESTION;
  }

  return MESSAGE_CATEGORIES.OTHER;
}

/**
 * Update message category in Firestore
 */
async function updateMessageCategory(messageId, category) {
  await firestore.collection('twilio_messages').doc(messageId).update({
    category,
    updatedAt: Firestore.Timestamp.now(),
  });
}

/**
 * Route message based on category
 */
async function routeMessage(messageData, category, messageId) {
  try {
    switch (category) {
      case MESSAGE_CATEGORIES.EMERGENCY:
      case MESSAGE_CATEGORIES.INCIDENT_REPORT:
        await publishToIncidentAlerts(messageData, category, messageId);
        break;

      case MESSAGE_CATEGORIES.ACKNOWLEDGMENT:
        await handleAcknowledgment(messageData);
        break;

      case MESSAGE_CATEGORIES.QUESTION:
        // Future: Route to agent orchestration
        console.log('Question message - could route to agent');
        break;

      default:
        console.log('Message category does not require routing:', category);
    }
  } catch (error) {
    console.error('Error routing message:', error);
    // Don't throw - routing is optional
  }
}

/**
 * Publish message to incident-alerts Pub/Sub topic
 */
async function publishToIncidentAlerts(messageData, category, messageId) {
  const alertMessage = {
    incidentId: messageId,
    severity: category === MESSAGE_CATEGORIES.EMERGENCY ? 'critical' : 'medium',
    type: category === MESSAGE_CATEGORIES.EMERGENCY ? 'EMERGENCY_SMS' : 'INCIDENT_REPORT_SMS',
    location: {
      source: 'sms',
      phone: messageData.from,
    },
    description: messageData.body,
    metadata: {
      messageId,
      messageType: messageData.type,
      messageSid: messageData.messageSid,
      hasMedia: messageData.numMedia > 0,
      mediaUrls: messageData.mediaUrls,
    },
    timestamp: messageData.timestamp,
  };

  const messageBuffer = Buffer.from(JSON.stringify(alertMessage));
  await pubsub.topic('incident-alerts').publish(messageBuffer);

  console.log('Alert published to Pub/Sub:', messageId);
}

/**
 * Handle acknowledgment messages
 */
async function handleAcknowledgment(messageData) {
  try {
    // Find recent unacknowledged alerts for this phone number
    const alertsSnapshot = await firestore
      .collection('incident_alerts')
      .where('acknowledged', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (alertsSnapshot.empty) {
      console.log('No pending alerts to acknowledge for:', messageData.from);
      return;
    }

    const alertDoc = alertsSnapshot.docs[0];
    await alertDoc.ref.update({
      acknowledged: true,
      acknowledgedBy: messageData.from,
      acknowledgedAt: Firestore.Timestamp.now(),
      acknowledgedVia: messageData.type,
      updatedAt: Firestore.Timestamp.now(),
    });

    console.log('Alert acknowledged:', alertDoc.id);
  } catch (error) {
    console.error('Error handling acknowledgment:', error);
  }
}

/**
 * Generate TwiML response
 */
async function generateResponse(messageData, category) {
  let responseText = '';

  switch (category) {
    case MESSAGE_CATEGORIES.EMERGENCY:
      responseText = 'Emergency received! Help is being dispatched to your location. Stay safe.';
      break;

    case MESSAGE_CATEGORIES.INCIDENT_REPORT:
      responseText = 'Thank you for reporting. Our team will investigate immediately.';
      break;

    case MESSAGE_CATEGORIES.ACKNOWLEDGMENT:
      responseText = 'Acknowledgment received. Thank you.';
      break;

    case MESSAGE_CATEGORIES.QUESTION:
      responseText = 'We received your question. A team member will respond shortly.';
      break;

    case MESSAGE_CATEGORIES.FEEDBACK:
      responseText = 'Thank you for your feedback!';
      break;

    default:
      responseText = 'Message received. For emergencies, please include words like "help" or "emergency".';
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseText}</Message>
</Response>`;
}

/**
 * SMS status callback handler
 */
functions.http('handleSMSStatus', async (req, res) => {
  try {
    console.log('SMS status update:', req.body);

    const { MessageSid, MessageStatus, ErrorCode } = req.body;

    // Update message status in Firestore
    const messagesSnapshot = await firestore
      .collection('twilio_messages')
      .where('messageSid', '==', MessageSid)
      .limit(1)
      .get();

    if (!messagesSnapshot.empty) {
      const doc = messagesSnapshot.docs[0];
      await doc.ref.update({
        status: MessageStatus,
        errorCode: ErrorCode || null,
        updatedAt: Firestore.Timestamp.now(),
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling SMS status:', error);
    res.status(500).send('Error');
  }
});

/**
 * Health check endpoint
 */
functions.http('health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    function: 'twilio-webhooks',
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  handleTwilioWebhook: functions.http('handleTwilioWebhook'),
  handleSMSStatus: functions.http('handleSMSStatus'),
  health: functions.http('health'),
};
