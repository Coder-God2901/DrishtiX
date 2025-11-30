/**
 * Cloud Function: Reward Automation
 *
 * Automatically triggers gamification rewards based on attendee actions.
 * Integrates with Firebase for real-time notifications and Firestore for tracking.
 *
 * Trigger: Pub/Sub topic "reward-events"
 *
 * Features:
 * - Processes reward events from Pub/Sub
 * - Calculates reward points based on action type
 * - Updates attendee scores in Firestore
 * - Sends push notifications via FCM
 * - Tracks reward history and leaderboards
 * - Implements achievement unlocks
 */

const functions = require('@google-cloud/functions-framework');
const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize clients
const pubsub = new PubSub();
const firestore = new Firestore();
const messaging = admin.messaging();

// Reward points configuration
const REWARD_POINTS = {
  PROOF_SUBMISSION: 50,
  ACCURATE_REPORT: 100,
  EMERGENCY_ALERT: 150,
  SAFE_NAVIGATION: 25,
  HELP_PERSON: 200,
  ROUTE_FOLLOW: 30,
  EARLY_ARRIVAL: 20,
  FEEDBACK_SUBMIT: 15,
  SHARE_EVENT: 10,
  COMPLETE_PROFILE: 40,
};

// Achievement thresholds
const ACHIEVEMENTS = {
  FIRST_REPORT: { threshold: 1, title: 'First Reporter', points: 25 },
  VETERAN_REPORTER: { threshold: 10, title: 'Veteran Reporter', points: 100 },
  SAFETY_HERO: { threshold: 5, title: 'Safety Hero', points: 150 },
  COMMUNITY_HELPER: { threshold: 20, title: 'Community Helper', points: 200 },
  ELITE_GUARDIAN: { threshold: 50, title: 'Elite Guardian', points: 500 },
};

/**
 * Main Cloud Function entry point
 * Triggered by Pub/Sub message on "reward-events" topic
 */
functions.cloudEvent('handleRewardTrigger', async (cloudEvent) => {
  try {
    console.log('Reward trigger received:', cloudEvent);

    // Decode Pub/Sub message
    const message = cloudEvent.data.message;
    const data = message.data ? JSON.parse(Buffer.from(message.data, 'base64').toString()) : null;

    if (!data) {
      console.error('No data in Pub/Sub message');
      return;
    }

    console.log('Processing reward event:', data);

    // Validate reward data
    const validationResult = validateRewardData(data);
    if (!validationResult.valid) {
      console.error('Invalid reward data:', validationResult.errors);
      return;
    }

    // Process the reward
    const result = await processReward(data);
    console.log('Reward processed successfully:', result);

    // Send push notification
    if (result.notification) {
      await sendPushNotification(data.attendeeId, result.notification);
    }

    // Check for achievement unlocks
    await checkAchievements(data.attendeeId, data.actionType);

    console.log('Reward trigger completed successfully');
  } catch (error) {
    console.error('Error processing reward trigger:', error);
    throw error; // Pub/Sub will retry
  }
});

/**
 * Validate reward data structure
 */
function validateRewardData(data) {
  const errors = [];

  if (!data.attendeeId) {
    errors.push('Missing attendeeId');
  }

  if (!data.actionType || !REWARD_POINTS[data.actionType]) {
    errors.push('Invalid or missing actionType');
  }

  if (!data.eventId) {
    errors.push('Missing eventId');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Process reward and update attendee score
 */
async function processReward(data) {
  const points = calculatePoints(data.actionType, data.metadata);

  // Get attendee document
  const attendeeRef = firestore.collection('attendees').doc(data.attendeeId);

  const attendeeDoc = await attendeeRef.get();

  if (!attendeeDoc.exists) {
    throw new Error(`Attendee not found: ${data.attendeeId}`);
  }

  const attendee = attendeeDoc.data();
  const currentPoints = attendee.gamificationScore || 0;
  const newPoints = currentPoints + points;

  // Update attendee score
  await attendeeRef.update({
    gamificationScore: newPoints,
    lastRewardAt: Firestore.Timestamp.now(),
    updatedAt: Firestore.Timestamp.now(),
  });

  // Record reward history
  await firestore.collection('reward_history').add({
    attendeeId: data.attendeeId,
    eventId: data.eventId,
    actionType: data.actionType,
    points,
    previousScore: currentPoints,
    newScore: newPoints,
    metadata: data.metadata || {},
    timestamp: Firestore.Timestamp.now(),
  });

  // Update leaderboard
  await updateLeaderboard(data.eventId, data.attendeeId, newPoints);

  console.log(`Rewarded ${points} points to attendee ${data.attendeeId}`);

  return {
    points,
    totalPoints: newPoints,
    notification: {
      title: '🎉 Reward Earned!',
      body: `You earned ${points} points for ${formatActionType(data.actionType)}!`,
      data: {
        type: 'reward',
        points: points.toString(),
        totalPoints: newPoints.toString(),
      },
    },
  };
}

/**
 * Calculate reward points based on action type and metadata
 */
function calculatePoints(actionType, metadata = {}) {
  let basePoints = REWARD_POINTS[actionType] || 0;

  // Apply multipliers based on metadata
  if (metadata.accuracy && metadata.accuracy > 0.9) {
    basePoints *= 1.5; // 50% bonus for high accuracy
  }

  if (metadata.responseTime && metadata.responseTime < 60) {
    basePoints *= 1.2; // 20% bonus for quick response
  }

  return Math.round(basePoints);
}

/**
 * Format action type for display
 */
function formatActionType(actionType) {
  return actionType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Update event leaderboard
 */
async function updateLeaderboard(eventId, attendeeId, totalPoints) {
  try {
    const leaderboardRef = firestore.collection('events').doc(eventId).collection('leaderboard').doc(attendeeId);

    await leaderboardRef.set(
      {
        attendeeId,
        totalPoints,
        lastUpdated: Firestore.Timestamp.now(),
      },
      { merge: true }
    );

    console.log('Leaderboard updated for attendee:', attendeeId);
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    // Don't throw - leaderboard is optional
  }
}

/**
 * Check and unlock achievements
 */
async function checkAchievements(attendeeId, actionType) {
  try {
    // Get attendee's action count
    const historySnapshot = await firestore
      .collection('reward_history')
      .where('attendeeId', '==', attendeeId)
      .where('actionType', '==', actionType)
      .get();

    const actionCount = historySnapshot.size;

    // Check each achievement
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (actionCount === achievement.threshold) {
        await unlockAchievement(attendeeId, key, achievement);
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
    // Don't throw - achievements are optional
  }
}

/**
 * Unlock achievement and award bonus points
 */
async function unlockAchievement(attendeeId, achievementKey, achievement) {
  try {
    // Check if already unlocked
    const existingAchievement = await firestore
      .collection('attendees')
      .doc(attendeeId)
      .collection('achievements')
      .doc(achievementKey)
      .get();

    if (existingAchievement.exists) {
      return; // Already unlocked
    }

    // Record achievement
    await firestore.collection('attendees').doc(attendeeId).collection('achievements').doc(achievementKey).set({
      title: achievement.title,
      points: achievement.points,
      unlockedAt: Firestore.Timestamp.now(),
    });

    // Award bonus points
    const attendeeRef = firestore.collection('attendees').doc(attendeeId);
    await attendeeRef.update({
      gamificationScore: admin.firestore.FieldValue.increment(achievement.points),
      updatedAt: Firestore.Timestamp.now(),
    });

    // Send achievement notification
    await sendPushNotification(attendeeId, {
      title: '🏆 Achievement Unlocked!',
      body: `${achievement.title} - ${achievement.points} bonus points!`,
      data: {
        type: 'achievement',
        achievementKey,
        points: achievement.points.toString(),
      },
    });

    console.log(`Achievement unlocked: ${achievement.title} for ${attendeeId}`);
  } catch (error) {
    console.error('Error unlocking achievement:', error);
  }
}

/**
 * Send push notification via FCM
 */
async function sendPushNotification(attendeeId, notification) {
  try {
    // Get attendee's FCM token
    const attendeeDoc = await firestore.collection('attendees').doc(attendeeId).get();

    if (!attendeeDoc.exists) {
      console.warn('Attendee not found:', attendeeId);
      return;
    }

    const attendee = attendeeDoc.data();
    const fcmToken = attendee.fcmToken;

    if (!fcmToken) {
      console.warn('No FCM token for attendee:', attendeeId);
      return;
    }

    // Send notification
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      token: fcmToken,
    };

    const response = await messaging.send(message);
    console.log('Push notification sent:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Don't throw - notification is optional
  }
}

/**
 * Health check endpoint
 */
functions.http('health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    function: 'reward-automation',
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  handleRewardTrigger: functions.cloudEvent('handleRewardTrigger'),
  health: functions.http('health'),
};
