# How to Get a Real FCM Token for Testing

## Why You Need This
The FCM test currently uses a mock token which will always fail. To properly test Firebase Cloud Messaging, you need a real device token.

## Quick Option: Get Token from Browser Console

1. **Open your DrishtiX frontend** (http://localhost:5173)

2. **Open Browser DevTools** (F12) → Console tab

3. **Run this code** in the console:
```javascript
// Request notification permission first
Notification.requestPermission().then(async (permission) => {
  if (permission === 'granted') {
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging();
    
    // You need to add your VAPID key here (from Firebase Console)
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE'
    });
    
    console.log('FCM Token:', token);
    console.log('Copy this token to setup_testing/.env as TEST_FCM_TOKEN');
  }
});
```

## Get VAPID Key from Firebase Console

1. Go to **Firebase Console** → https://console.firebase.google.com
2. Select project: **drishtix-479606**
3. Click **⚙️ Settings** → **Project settings**
4. Go to **Cloud Messaging** tab
5. Scroll down to **Web configuration**
6. Copy the **Web Push certificates** key (VAPID key)
7. Replace `YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE` in the code above

## Alternative: Get Token from Mobile App

### Android (Kotlin/Java):
```kotlin
import com.google.firebase.messaging.FirebaseMessaging

FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val token = task.result
        println("FCM Token: $token")
        // Copy this to .env
    }
}
```

### iOS (Swift):
```swift
import FirebaseMessaging

Messaging.messaging().token { token, error in
    if let token = token {
        print("FCM Token: \\(token)")
        // Copy this to .env
    }
}
```

## Add Token to Tests

1. Copy the token you received
2. Open `setup_testing/.env`
3. Add the token:
```env
TEST_FCM_TOKEN=your-long-fcm-token-here
```

4. Run tests again:
```bash
npx ts-node test-firebase.ts
```

## Test Behavior

- **With real token**: Notification will be sent to your device, test passes ✅
- **Without token (empty)**: Uses mock token, expected error, test still passes ✅
- **With invalid token**: Test fails with clear error message ❌

## Quick Test Command

After adding token, test just FCM:
```bash
cd setup_testing
npx ts-node test-firebase.ts
```

Look for: "✅ Notification sent successfully to real device"
