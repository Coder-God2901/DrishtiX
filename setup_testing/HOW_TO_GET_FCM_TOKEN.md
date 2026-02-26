# How to Get a Real Amazon SNS Push Token for Testing

## Why You Need This
The Amazon SNS Push test currently uses a mock token which will always fail. To properly test Amazon SNS Push, you need a real device token.

## Quick Option: Get Token from Browser Console

1. **Open your DrishtiX frontend** (http://localhost:5173)

2. **Open Browser DevTools** (F12) → Console tab

3. **Run this code** in the console:
```javascript
// Request notification permission first
Notification.requestPermission().then(async (permission) => {
  if (permission === 'granted') {
    const { getMessaging, getToken } = await import('Amazon Cognito+S3/messaging');
    const messaging = getMessaging();
    
    // You need to add your VAPID key here (from Amazon Cognito+S3 Console)
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY_FROM_Amazon Cognito+S3_CONSOLE'
    });
    
    console.log('Amazon SNS Push Token:', token);
    console.log('Copy this token to setup_testing/.env as TEST_Amazon SNS Push_TOKEN');
  }
});
```

## Get VAPID Key from Amazon Cognito+S3 Console

1. Go to **Amazon Cognito+S3 Console** → https://console.Amazon Cognito+S3.google.com
2. Select project: **YOUR_AWS_ACCOUNT_ID**
3. Click **⚙️ Settings** → **Project settings**
4. Go to **Cloud Messaging** tab
5. Scroll down to **Web configuration**
6. Copy the **Web Push certificates** key (VAPID key)
7. Replace `YOUR_VAPID_KEY_FROM_Amazon Cognito+S3_CONSOLE` in the code above

## Alternative: Get Token from Mobile App

### Android (Kotlin/Java):
```kotlin
import com.google.Amazon Cognito+S3.messaging.Amazon Cognito+S3Messaging

Amazon Cognito+S3Messaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val token = task.result
        println("Amazon SNS Push Token: $token")
        // Copy this to .env
    }
}
```

### iOS (Swift):
```swift
import Amazon Cognito+S3Messaging

Messaging.messaging().token { token, error in
    if let token = token {
        print("Amazon SNS Push Token: \\(token)")
        // Copy this to .env
    }
}
```

## Add Token to Tests

1. Copy the token you received
2. Open `setup_testing/.env`
3. Add the token:
```env
TEST_Amazon SNS Push_TOKEN=your-long-Amazon SNS Push-token-here
```

4. Run tests again:
```bash
npx ts-node test-Amazon Cognito+S3.ts
```

## Test Behavior

- **With real token**: Notification will be sent to your device, test passes ✅
- **Without token (empty)**: Uses mock token, expected error, test still passes ✅
- **With invalid token**: Test fails with clear error message ❌

## Quick Test Command

After adding token, test just Amazon SNS Push:
```bash
cd setup_testing
npx ts-node test-Amazon Cognito+S3.ts
```

Look for: "✅ Notification sent successfully to real device"
