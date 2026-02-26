# AWS SNS Push Notifications Setup Guide

> **Replaces:** Firebase Cloud Messaging (FCM)  
> **Services:** Amazon SNS (Mobile Push) + Amazon Pinpoint  
> **Cost:** First 1M SNS mobile push notifications/month free

---

## Overview

DrishtiX uses **Amazon SNS** for real-time push notifications (crowd alerts, safety warnings) and **Amazon Pinpoint** for targeted campaign messaging and attendee engagement.

| Firebase FCM Concept | AWS Equivalent |
|---|---|
| FCM Project | SNS Platform Application |
| FCM Registration Token | SNS Endpoint ARN |
| FCM Topic | SNS Topic |
| FCM send to device | SNS publish to endpoint |
| FCM Data message | SNS + SQS (background processing) |
| FCM Notification message | SNS Platform Push |
| Firebase Analytics | Amazon Pinpoint Analytics |

---

## Prerequisites

- AWS CLI v2 configured
- IAM permissions: `sns:*`, `mobiletargeting:*`
- FCM Server Key (from Google Firebase Console — needed to configure SNS for Android)
- APNs certificate/key (for iOS push via APNs)
- Region: `ap-south-1` (Mumbai)

---

## Step 1 — Create SNS Platform Applications

### Android (FCM/GCM)

```bash
aws sns create-platform-application \
  --name drishtix-android \
  --platform GCM \
  --attributes PlatformCredential=YOUR_FCM_SERVER_KEY \
  --region ap-south-1
```

### iOS (APNs)

```bash
aws sns create-platform-application \
  --name drishtix-ios \
  --platform APNS \
  --attributes \
    PlatformCredential=PATH_TO_APNS_PRIVATE_KEY.p8,\
    PlatformPrincipal=YOUR_KEY_ID,\
    ApplePlatformTeamID=YOUR_TEAM_ID,\
    ApplePlatformBundleID=com.drishtix.app \
  --region ap-south-1
```

Note the **PlatformApplicationArn** returned for each platform.

---

## Step 2 — Register Device Tokens (Backend)

When a user installs the app and requests notification permission, the device pushtoken must be registered with SNS to get an **Endpoint ARN**.

### Node.js SDK

```bash
npm install @aws-sdk/client-sns
```

```typescript
import { SNSClient, CreatePlatformEndpointCommand, SetEndpointAttributesCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({ region: 'ap-south-1' });

export async function registerDeviceToken(
  deviceToken: string,
  platform: 'android' | 'ios',
  userId: string
): Promise<string> {
  const platformArn = platform === 'android'
    ? process.env.SNS_ANDROID_PLATFORM_ARN
    : process.env.SNS_IOS_PLATFORM_ARN;

  const { EndpointArn } = await sns.send(new CreatePlatformEndpointCommand({
    PlatformApplicationArn: platformArn,
    Token: deviceToken,
    CustomUserData: userId,  // Store userId for lookup
    Attributes: { Enabled: 'true' }
  }));

  // Store EndpointArn in DynamoDB against userId
  await saveEndpointArn(userId, EndpointArn!);
  
  return EndpointArn!;
}
```

---

## Step 3 — Send Push Notifications

### Send to a Single Device

```typescript
import { PublishCommand } from '@aws-sdk/client-sns';

// Android payload
const androidPayload = JSON.stringify({
  GCM: JSON.stringify({
    notification: {
      title: '⚠️ Crowd Alert',
      body: 'Zone C approaching maximum capacity',
      sound: 'default',
      priority: 'high'
    },
    data: {
      alertType: 'CROWD_WARNING',
      zoneId: 'z-003',
      eventId: 'evt-001'
    }
  })
});

await sns.send(new PublishCommand({
  TargetArn: userEndpointArn,  // From DynamoDB
  Message: androidPayload,
  MessageStructure: 'json'
}));
```

### Broadcast to All Attendees of an Event (Topic-Based)

```bash
# Create per-event SNS topic for attendees
aws sns create-topic \
  --name drishtix-event-evt001-attendees \
  --region ap-south-1
```

```typescript
// Subscribe user's endpoint to event topic
await sns.send(new SubscribeCommand({
  TopicArn: eventTopicArn,
  Protocol: 'application',
  Endpoint: userEndpointArn  // SNS platform endpoint ARN
}));

// Broadcast to all attendees of an event
await sns.send(new PublishCommand({
  TopicArn: eventTopicArn,
  Message: JSON.stringify({
    default: 'Event update: Zone A now open',
    GCM: JSON.stringify({
      notification: { title: 'Event Update', body: 'Zone A is now open' },
      data: { type: 'ZONE_UPDATE', zoneId: 'z-001' }
    })
  }),
  MessageStructure: 'json'
}));
```

---

## Step 4 — Amazon Pinpoint (Advanced Messaging)

Amazon Pinpoint extends SNS with analytics, segmentation, and multi-channel campaigns.

### Create Pinpoint Project

```bash
aws pinpoint create-app \
  --create-application-request Name=drishtix \
  --region ap-south-1
```

Note the **ApplicationId**.

### Configure Channels

```bash
# Enable push notifications channel
aws pinpoint update-apns-channel \
  --application-id YOUR_PINPOINT_APP_ID \
  --apns-channel-request Enabled=true,BundleId=com.drishtix.app,TeamId=TEAM_ID,TokenKey=KEY_CONTENT,TokenKeyId=KEY_ID \
  --region ap-south-1

aws pinpoint update-gcm-channel \
  --application-id YOUR_PINPOINT_APP_ID \
  --gcm-channel-request Enabled=true,ApiKey=YOUR_FCM_SERVER_KEY \
  --region ap-south-1
```

### Register Endpoint (User Device)

```typescript
import { PinpointClient, UpdateEndpointCommand } from '@aws-sdk/client-pinpoint';

const pinpoint = new PinpointClient({ region: 'ap-south-1' });

await pinpoint.send(new UpdateEndpointCommand({
  ApplicationId: process.env.PINPOINT_APP_ID,
  EndpointId: userId,  // Use Cognito sub as endpoint ID
  EndpointRequest: {
    Address: deviceToken,         // FCM token or APNs token
    ChannelType: 'GCM',           // or APNS
    Demographic: { Platform: 'Android' },
    User: { UserId: userId },
    Attributes: {
      EventId: [currentEventId],
      Role: [userRole]
    },
    OptOut: 'NONE',
    RequestId: new Date().toISOString()
  }
}));
```

### Send Targeted Push via Pinpoint

```typescript
await pinpoint.send(new SendMessagesCommand({
  ApplicationId: process.env.PINPOINT_APP_ID,
  MessageRequest: {
    Endpoints: { [userId]: {} },
    MessageConfiguration: {
      GCMMessage: {
        Action: 'OPEN_APP',
        Title: '🚨 Emergency Alert',
        Body: 'Please proceed to the nearest exit',
        Data: { alertType: 'EVACUATION', severity: 'HIGH' },
        Priority: 'high'
      }
    }
  }
}));
```

---

## Step 5 — Frontend — Request Notification Permission

### Web Push (PWA) with Amazon Pinpoint

```bash
npm install @aws-amplify/notifications
```

```typescript
import { Notifications } from '@aws-amplify/notifications';
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Notifications: {
    Push: {
      AWSPinpoint: {
        appId: import.meta.env.VITE_PINPOINT_APP_ID,
        region: 'ap-south-1'
      }
    }
  }
});

// Request permission and register token
await Notifications.Push.enable();

// Listen for alerts
Notifications.Push.onNotificationReceived((notification) => {
  const { title, body, data } = notification;
  if (data?.alertType === 'CROWD_WARNING') {
    showCrowdAlert(data);
  }
});
```

---

## Step 6 — Alert Trigger Lambda

When a DynamoDB Stream or SQS message indicates a threshold breach:

```typescript
export async function triggerCrowdAlert(event: {
  zoneId: string;
  eventId: string;
  currentCount: number;
  maxCapacity: number;
}) {
  const ratio = event.currentCount / event.maxCapacity;
  
  let severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  if (ratio >= 0.95) severity = 'EMERGENCY';
  else if (ratio >= 0.85) severity = 'CRITICAL';
  else severity = 'WARNING';

  const message = {
    default: `Zone ${event.zoneId}: ${severity} — capacity at ${Math.round(ratio * 100)}%`,
    GCM: JSON.stringify({
      notification: {
        title: severity === 'EMERGENCY' ? '🚨 Emergency' : '⚠️ Crowd Alert',
        body: `Zone capacity at ${Math.round(ratio * 100)}%. Please divert crowd flow.`,
        sound: 'default'
      },
      data: { alertType: `CROWD_${severity}`, ...event }
    })
  };

  // Broadcast to event topic
  await sns.send(new PublishCommand({
    TopicArn: `arn:aws:sns:ap-south-1:${process.env.AWS_ACCOUNT_ID}:drishtix-event-${event.eventId}-attendees`,
    Message: JSON.stringify(message),
    MessageStructure: 'json'
  }));
}
```

---

## Environment Variables

```env
# SNS Platform ARNs
SNS_ANDROID_PLATFORM_ARN=arn:aws:sns:ap-south-1:ACCOUNT_ID:app/GCM/drishtix-android
SNS_IOS_PLATFORM_ARN=arn:aws:sns:ap-south-1:ACCOUNT_ID:app/APNS/drishtix-ios

# Pinpoint
VITE_PINPOINT_APP_ID=your-pinpoint-app-id
PINPOINT_APP_ID=your-pinpoint-app-id
```

---

## Verification

```bash
# List platform applications
aws sns list-platform-applications --region ap-south-1

# Test send to a device endpoint
aws sns publish \
  --target-arn YOUR_ENDPOINT_ARN \
  --message '{"GCM": "{\"notification\":{\"title\":\"Test\",\"body\":\"DrishtiX push works!\"}}"}' \
  --message-structure json \
  --region ap-south-1
```

---

## Related Documentation

- [SQS/SNS/Location Setup](@guides/AWS_SQS_SNS_SETUP_GUIDE.md)
- [Cognito Auth Setup](@guides/AWS_COGNITO_AUTH_SETUP_GUIDE.md)
- [AWS Solution Architecture](../AWS_SOLUTION_ARCHITECTURE.md)
