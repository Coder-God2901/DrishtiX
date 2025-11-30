# OAuth Integration Setup Guide

## Overview

EventSphere now supports advanced OAuth authentication with Google, Facebook, and GitHub. This provides a seamless, secure login experience for users.

## Features Implemented

### ✅ Frontend

- **Advanced OAuth UI Components**
  - Modern, branded OAuth buttons (Google, Facebook, GitHub)
  - Responsive button layouts (vertical, horizontal, grid)
  - Loading states and error handling
  - Elegant dividers and visual hierarchy

- **Enhanced Login Page**
  - OAuth login options above traditional form
  - Password visibility toggle
  - Remember me functionality
  - Security badges and notices
  - Gradient design with animations
  - Demo credentials display

- **Firebase Integration**
  - Google Sign-In with popup/redirect support
  - Facebook Sign-In
  - GitHub Sign-In
  - Comprehensive error handling
  - Redirect result handling

### ✅ Backend

- **OAuth Routes** (`/api/auth/oauth/*`)
  - `/oauth/google` - Google authentication
  - `/oauth/facebook` - Facebook authentication
  - `/oauth/github` - GitHub authentication

- **User Management**
  - Auto-create users from OAuth
  - Link OAuth to existing accounts
  - Profile picture sync
  - Email verification via OAuth

### ✅ Database

- **Enhanced User Model**
  - `authProvider` - OAuth provider name
  - `authProviderId` - Provider user ID
  - `emailVerified` - Email verification status
  - `avatar` - Profile picture URL
  - `roles` - Multiple roles support

## Setup Instructions

### 1. Firebase Console Configuration

#### Enable Authentication Providers

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**

#### Google Sign-In

```
✓ Enable Google provider
✓ Add authorized domains (localhost, your-domain.com)
✓ Copy Web SDK configuration
```

#### Facebook Sign-In

```
1. Create Facebook App at developers.facebook.com
2. Enable Facebook Login product
3. Copy App ID and App Secret
4. Add to Firebase Console
5. Configure OAuth redirect URI:
   https://YOUR-PROJECT.firebaseapp.com/__/auth/handler
```

#### GitHub Sign-In

```
1. Create OAuth App at github.com/settings/developers
2. Copy Client ID and Client Secret
3. Add to Firebase Console
4. Configure callback URL:
   https://YOUR-PROJECT.firebaseapp.com/__/auth/handler
```

### 2. Environment Variables

Update your `.env` file:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Backend
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

### 3. Database Migration

Run the Prisma migration to update the User model:

```bash
npx prisma migrate dev --name add_oauth_support
```

### 4. Restart Services

```bash
# Backend
cd server
npm run dev

# Frontend
cd ..
npm run dev
```

## User Flow

### New User OAuth Sign-In

```
1. User clicks "Continue with Google"
2. Google OAuth popup/redirect
3. User authorizes EventSphere
4. Backend receives ID token
5. Verify token with Firebase Admin
6. Create new user in database
7. Generate JWT tokens
8. Return user + tokens to frontend
9. User logged in → redirect to dashboard
```

### Existing User OAuth Link

```
1. User signs in with OAuth
2. Email matches existing account
3. Link OAuth provider to account
4. Update user profile (avatar, verified)
5. Login successful
```

## Security Features

### Token Verification

- All OAuth tokens verified server-side
- Firebase Admin SDK validation
- JWT token generation for API access

### Error Handling

- Popup blocked detection
- Account exists warnings
- Network error recovery
- User-friendly error messages

### Audit Logging

- OAuth login events tracked
- Provider information stored
- IP address and user agent logged

## UI/UX Enhancements

### Login Page Features

1. **Visual Hierarchy**
   - OAuth buttons prominently displayed
   - Gradient backgrounds
   - Animated elements

2. **Loading States**
   - Button-level loading indicators
   - Disabled state during auth
   - Progress feedback

3. **Error Display**
   - Toast notifications
   - Inline error messages
   - Retry mechanisms

4. **Mobile Responsive**
   - Touch-optimized buttons
   - Adaptive layouts
   - Mobile-friendly popups

### OAuth Button Component

```tsx
<OAuthButtonGroup
  onGoogleClick={handleGoogleLogin}
  onFacebookClick={handleFacebookLogin}
  onGithubClick={handleGithubLogin}
  providers={['google', 'github', 'facebook']}
  layout="vertical"
  size="default"
/>
```

## Advanced Features

### Popup vs Redirect

```typescript
// Popup (recommended for desktop)
const user = await firebaseService.signInWithGoogle(false);

// Redirect (recommended for mobile)
await firebaseService.signInWithGoogle(true);

// Handle redirect result
useEffect(() => {
  const result = await firebaseService.handleRedirectResult();
  if (result?.user) {
    // Process login
  }
}, []);
```

### Custom Scopes

```typescript
// Request additional permissions
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/contacts');
```

### Account Linking

Users can link multiple providers to one account:

```
user@example.com
  ↳ Password auth
  ↳ Google OAuth
  ↳ GitHub OAuth
```

## Testing

### Test Accounts

Use Firebase Test Users for development:

```javascript
// Firebase Console → Authentication → Users → Add test user
email: test@example.com
provider: Google
```

### Local Testing

1. Add `localhost` to Firebase authorized domains
2. Test popup and redirect flows
3. Verify token exchange
4. Check database user creation

## Troubleshooting

### "Pop-up blocked" Error

```typescript
// Fallback to redirect
if (error.code === 'auth/popup-blocked') {
  await firebaseService.signInWithGoogle(true);
}
```

### "Account exists" Error

```typescript
// Inform user to use existing provider
if (error.code === 'auth/account-exists-with-different-credential') {
  toast.error('Please sign in with your original provider');
}
```

### Token Verification Failed

```
1. Check Firebase service account credentials
2. Verify FIREBASE_PROJECT_ID matches
3. Ensure private key is properly formatted
4. Check token expiration
```

## Performance Optimization

### Lazy Loading

```typescript
// Load Firebase only when needed
const { firebaseService } = await import('@/services/firebase.service');
```

### Prefetching

```typescript
// Warm up OAuth provider on hover
<OAuthButton
  onMouseEnter={() => {
    const provider = new GoogleAuthProvider();
    // Prefetch provider config
  }}
/>
```

### Caching

```typescript
// Cache user profile data
localStorage.setItem('user_avatar', user.photoURL);
```

## Production Checklist

- [ ] Firebase project in production mode
- [ ] OAuth providers configured
- [ ] Authorized domains added
- [ ] Environment variables set
- [ ] Database migrated
- [ ] SSL/HTTPS enabled
- [ ] Error tracking configured
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] CORS configured
- [ ] CSP headers set
- [ ] Privacy policy linked

## Monitoring

### Key Metrics

- OAuth success rate
- Provider distribution
- Average login time
- Error rates by provider
- New user signups via OAuth

### Analytics Events

```typescript
// Track OAuth events
analytics.logEvent('oauth_login', {
  provider: 'google',
  success: true,
  duration: 1200,
});
```

## Future Enhancements

### Planned Features

1. ✅ Google OAuth
2. ✅ Facebook OAuth
3. ✅ GitHub OAuth
4. ⏳ Microsoft OAuth
5. ⏳ Apple Sign-In
6. ⏳ Twitter OAuth
7. ⏳ LinkedIn OAuth

### Advanced Features

- [ ] Social profile sync
- [ ] Friend imports
- [ ] Social sharing
- [ ] OAuth token refresh
- [ ] Provider unlinking
- [ ] Account merging

## Support

For issues or questions:

- Check Firebase Console logs
- Review backend API logs
- Test with curl/Postman
- Verify environment variables
- Check network requests in DevTools

## Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
