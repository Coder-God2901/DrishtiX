# Firebase Authentication Setup Guide

## Overview

This guide covers the complete setup and integration of Firebase Authentication in DrishtiX, including role-based access control (RBAC), OAuth providers, and multi-factor authentication (MFA).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Console Setup](#firebase-console-setup)
3. [Environment Configuration](#environment-configuration)
4. [Backend Integration](#backend-integration)
5. [Frontend Integration](#frontend-integration)
6. [Role-Based Access Control](#role-based-access-control)
7. [OAuth Providers Setup](#oauth-providers-setup)
8. [Multi-Factor Authentication](#multi-factor-authentication)
9. [Testing & Verification](#testing--verification)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Google Cloud Platform (GCP) project created
- Firebase project linked to GCP project
- Node.js 18+ and pnpm installed
- PostgreSQL database running

---

## Firebase Console Setup

### 1. Create Firebase Project

```bash
# Navigate to Firebase Console
https://console.firebase.google.com/

# Click "Add project" or select existing GCP project
# Enable Google Analytics (optional)
```

### 2. Enable Authentication Methods

1. Go to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - ✅ **Email/Password** (Primary)
   - ✅ **Google** (OAuth)
   - ✅ **Facebook** (OAuth - optional)
   - ✅ **GitHub** (OAuth - optional)

### 3. Configure OAuth Providers

#### Google Sign-In

```
1. Click on "Google" provider
2. Enable the provider
3. Add support email
4. Add authorized domains:
   - localhost (for development)
   - your-production-domain.com
5. Save configuration
```

#### Facebook Sign-In (Optional)

```
1. Create Facebook App at https://developers.facebook.com/
2. Get App ID and App Secret
3. Add to Firebase Authentication > Facebook
4. Add OAuth redirect URI to Facebook App settings:
   https://your-project.firebaseapp.com/__/auth/handler
```

#### GitHub Sign-In (Optional)

```
1. Create GitHub OAuth App at https://github.com/settings/developers
2. Get Client ID and Client Secret
3. Add to Firebase Authentication > GitHub
4. Set Authorization callback URL:
   https://your-project.firebaseapp.com/__/auth/handler
```

### 4. Get Firebase Configuration

Go to **Project Settings** > **General** > **Your apps**

Click **Web app** (</>) and copy configuration:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

### 5. Generate Service Account Key

1. Go to **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. Save as `config/gcp-service-account-key.json`
4. **IMPORTANT**: Add to `.gitignore`

---

## Environment Configuration

### Frontend (.env)

```bash
# Firebase Client SDK Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Enable Firebase features
VITE_ENABLE_FIREBASE_AUTH=true
VITE_ENABLE_GOOGLE_SIGNIN=true
VITE_ENABLE_FACEBOOK_SIGNIN=false
VITE_ENABLE_GITHUB_SIGNIN=false
```

### Backend (server/.env)

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Firebase Authentication
ENABLE_FIREBASE_AUTH=true
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com

# Service Account
GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-service-account-key.json
```

---

## Backend Integration

### 1. Initialize Firebase Admin SDK

File: `server/services/firebase-admin.service.ts`

```typescript
import * as admin from 'firebase-admin';

const serviceAccount = require('../../config/gcp-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

export const auth = admin.auth();
export const db = admin.firestore();
export const messaging = admin.messaging();
```

### 2. Verify ID Tokens

File: `server/middleware/auth.middleware.ts`

```typescript
import { auth } from '../services/firebase-admin.service';

export async function verifyFirebaseToken(req, res, next) {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 3. Create/Sync User on Authentication

File: `server/routes/auth.routes.ts`

```typescript
router.post('/oauth/google', async (req, res) => {
  const { idToken } = req.body;

  // Verify with Firebase
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { email, name, picture, uid } = decodedToken;

  // Find or create user in PostgreSQL
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        avatar: picture,
        firebaseUid: uid,
        role: 'ATTENDEE', // Default role
        roles: ['ATTENDEE'],
        permissions: ['read:events', 'write:profile'],
        authProvider: 'google',
        emailVerified: true,
      },
    });
  }

  // Generate JWT token
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);

  res.json({ success: true, data: { user, token } });
});
```

---

## Frontend Integration

### 1. Initialize Firebase Client SDK

File: `src/services/firebase.service.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 2. Implement Google Sign-In

File: `src/components/auth/GoogleSignInButton.tsx`

```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/services/firebase.service';
import { authService } from '@/services/auth.service';

export function GoogleSignInButton() {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Get ID token
      const idToken = await result.user.getIdToken();

      // Send to backend
      const response = await authService.loginWithGoogle(idToken);

      if (response.success) {
        console.log('Logged in successfully:', response.data.user);
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  );
}
```

### 3. Email/Password Authentication

```typescript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Sign up
async function signUp(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();

  // Send to backend to create user record
  await authService.register({ email, password, idToken });
}

// Sign in
async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();

  // Send to backend
  await authService.login(email, password, idToken);
}
```

---

## Role-Based Access Control

### 1. Define User Roles

File: `prisma/schema.prisma`

```prisma
enum UserRole {
  ADMIN       // Full system access
  ORGANIZER   // Event management
  SECURITY    // Security operations
  LOGISTICS   // Logistics coordination
  MEDICAL     // Medical response
  ATTENDEE    // Event attendee
  VOLUNTEER   // Volunteer staff
  VIEWER      // Read-only access
}

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String
  role            UserRole
  roles           String[] @default(["ATTENDEE"])
  permissions     String[]
  firebaseUid     String?  @unique
  // ... other fields
}
```

### 2. Set Custom Claims (Backend)

```typescript
import { auth } from '../services/firebase-admin.service';

async function setUserRole(uid: string, role: string) {
  await auth.setCustomUserClaims(uid, {
    role,
    roles: [role],
    permissions: getRolePermissions(role),
  });
}

function getRolePermissions(role: string): string[] {
  const permissionMap = {
    ADMIN: ['*'],
    ORGANIZER: ['read:*', 'write:events', 'write:teams', 'delete:incidents'],
    SECURITY: ['read:incidents', 'write:incidents', 'dispatch:responders'],
    LOGISTICS: ['read:events', 'write:logistics', 'manage:resources'],
    MEDICAL: ['read:incidents', 'write:medical', 'dispatch:medical'],
    ATTENDEE: ['read:events', 'write:profile', 'submit:reports'],
    VOLUNTEER: ['read:events', 'assist:operations'],
    VIEWER: ['read:events', 'read:public'],
  };

  return permissionMap[role] || [];
}
```

### 3. Protect Routes (Frontend)

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

// Usage in routes
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### 4. Middleware for API Routes (Backend)

```typescript
export function requireRoles(roles: string[]) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasRole = user.roles?.some((r) => roles.includes(r));

    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Usage
router.post('/events', authenticate, requireRoles(['ADMIN', 'ORGANIZER']), createEvent);
router.get('/incidents', authenticate, requireRoles(['ADMIN', 'SECURITY', 'MEDICAL']), getIncidents);
```

---

## OAuth Providers Setup

### Google OAuth

**Frontend:**

```typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

const result = await signInWithPopup(auth, provider);
const idToken = await result.user.getIdToken();
```

**Backend:**

```typescript
router.post('/oauth/google', async (req, res) => {
  const { idToken } = req.body;
  const decodedToken = await admin.auth().verifyIdToken(idToken);

  // Create/update user
  // Return JWT token
});
```

### Facebook OAuth

**Frontend:**

```typescript
import { FacebookAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new FacebookAuthProvider();
provider.addScope('public_profile');
provider.addScope('email');

const result = await signInWithPopup(auth, provider);
```

### GitHub OAuth

**Frontend:**

```typescript
import { GithubAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GithubAuthProvider();
provider.addScope('user:email');

const result = await signInWithPopup(auth, provider);
```

---

## Multi-Factor Authentication

### 1. Enable TOTP MFA

**Backend:**

```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generate MFA secret
router.post('/mfa/setup', authenticate, async (req, res) => {
  const user = req.user;

  const secret = speakeasy.generateSecret({
    name: `DrishtiX (${user.email})`,
    issuer: 'DrishtiX',
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Save secret to database
  await prisma.user.update({
    where: { id: user.id },
    data: { mfaSecret: secret.base32 },
  });

  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCodeUrl,
    },
  });
});

// Verify MFA code
router.post('/mfa/verify', authenticate, async (req, res) => {
  const { code } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: code,
    window: 2,
  });

  if (verified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true },
    });

    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid code' });
  }
});
```

**Frontend:**

```typescript
// Display QR code for user to scan with authenticator app
const setupMFA = async () => {
  const response = await authService.setupMFA();
  setQRCode(response.data.qrCodeUrl);
};

// Verify code
const verifyMFA = async (code: string) => {
  await authService.enableMFA(code);
};
```

---

## Testing & Verification

### 1. Test Authentication Flow

```bash
# Start backend
cd server
pnpm dev

# Start frontend
cd ..
pnpm dev
```

**Test Checklist:**

- ✅ Email/Password signup
- ✅ Email/Password login
- ✅ Google OAuth login
- ✅ Token verification
- ✅ Role-based access
- ✅ MFA setup and verification
- ✅ Logout functionality

### 2. Verify Custom Claims

```typescript
// Backend - Check user claims
const user = await admin.auth().getUser(uid);
console.log(user.customClaims);
// Output: { role: 'ADMIN', roles: ['ADMIN'], permissions: ['*'] }
```

### 3. Test Protected Routes

```bash
# Without authentication
curl http://localhost:3000/api/admin/users
# Expected: 401 Unauthorized

# With valid token
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/users
# Expected: 200 OK with data

# With insufficient role
curl -H "Authorization: Bearer <attendee-token>" http://localhost:3000/api/admin/users
# Expected: 403 Forbidden
```

---

## Troubleshooting

### Common Issues

#### 1. "Firebase not initialized"

```typescript
// Solution: Ensure Firebase is initialized before use
firebaseService.initialize();
await firebaseService.signIn(email, password);
```

#### 2. "Invalid ID token"

```bash
# Check token expiration
# Ensure service account key is correct
# Verify FIREBASE_PROJECT_ID matches
```

#### 3. "Popup blocked"

```typescript
// Solution: Use redirect instead
await signInWithRedirect(auth, provider);

// Handle redirect result
const result = await getRedirectResult(auth);
```

#### 4. "Custom claims not updating"

```typescript
// Solution: Force token refresh
await user.getIdToken(true);
```

### Debug Mode

Enable debug logging:

```bash
# Frontend
localStorage.debug = 'firebase:*'

# Backend
FIREBASE_DEBUG=true
```

---

## Best Practices

1. **Security**
   - Never expose Firebase API keys in public repositories
   - Use environment variables for all credentials
   - Implement rate limiting for authentication endpoints
   - Enable App Check for mobile apps

2. **Performance**
   - Cache user tokens locally
   - Implement token refresh before expiration
   - Use Firebase Auth emulator for development

3. **User Experience**
   - Provide clear error messages
   - Implement loading states
   - Handle network failures gracefully
   - Support remember me functionality

4. **Monitoring**
   - Log authentication events
   - Track failed login attempts
   - Monitor token verification failures
   - Set up alerts for suspicious activity

---

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Custom Claims Guide](https://firebase.google.com/docs/auth/admin/custom-claims)
- [OAuth Provider Setup](https://firebase.google.com/docs/auth/web/google-signin)

---

## Summary

✅ **Firebase Authentication configured**  
✅ **Role-based access control implemented**  
✅ **OAuth providers (Google, Facebook, GitHub) integrated**  
✅ **Multi-factor authentication enabled**  
✅ **Frontend and backend fully connected**  
✅ **Security best practices applied**

Your Firebase Authentication system is now production-ready!
