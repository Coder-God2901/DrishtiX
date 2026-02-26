# AWS Cognito Authentication Setup Guide

> **Replaces:** Firebase Auth  
> **Service:** Amazon Cognito User Pools + Identity Pools  
> **Cost:** Free for first 50,000 MAUs/month

---

## Prerequisites

- AWS Account with credits configured
- AWS CLI v2 installed and configured (`aws configure`)
- Node.js 18+ for SDK usage
- IAM permissions: `cognito-idp:*`, `cognito-identity:*`

---

## Step 1 — Create a Cognito User Pool

### Via AWS Console

1. Go to **AWS Console → Amazon Cognito → User Pools → Create user pool**
2. Configure sign-in options:
   - Email (primary)
   - Phone number (optional, for OTP)
3. Password policy: minimum 8 chars, uppercase + lowercase + number
4. MFA: **Optional** (TOTP + SMS)
5. Email → use **Amazon SES** for production (configure SES sender first)
6. App client name: `drishtix-web-client`
7. Allow: **ALLOW_USER_PASSWORD_AUTH**, **ALLOW_REFRESH_TOKEN_AUTH**, **ALLOW_USER_SRP_AUTH**
8. Note the **User Pool ID** and **App Client ID**

### Via AWS CLI

```bash
# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name drishtix-users \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --mfa-configuration OPTIONAL \
  --auto-verified-attributes email \
  --username-attributes email \
  --region ap-south-1

# Create App Client (no secret for SPA)
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name drishtix-web-client \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
  --region ap-south-1
```

---

## Step 2 — Configure Social Login (Google OAuth)

1. **AWS Console → Cognito → User Pool → Sign-in experience → Federated identity providers → Add Google**
2. Enter your Google OAuth 2.0 Client ID and Secret (from Google Cloud Console)
3. Authorised scopes: `profile email openid`
4. Map Google attributes:
   - `email` → `email`
   - `name` → `name`
   - `sub` → `username`
5. Configure **Cognito Hosted UI domain:**
   ```
   https://drishtix.auth.ap-south-1.amazoncognito.com
   ```
6. Add callback URLs:
   - `http://localhost:5173/auth/callback` (dev)
   - `https://yourdomain.com/auth/callback` (prod)

---

## Step 3 — Create Identity Pool (for AWS Service Access)

```bash
aws cognito-identity create-identity-pool \
  --identity-pool-name drishtix_identity_pool \
  --allow-unauthenticated-identities false \
  --cognito-identity-providers \
    ProviderName=cognito-idp.ap-south-1.amazonaws.com/YOUR_USER_POOL_ID,ClientId=YOUR_APP_CLIENT_ID \
  --region ap-south-1
```

Attach IAM roles to the Identity Pool:
- **Authenticated role:** `drishtix-cognito-authenticated` — grants access to DynamoDB, S3, etc.
- **Unauthenticated role:** `drishtix-cognito-unauthenticated` — read-only public data

---

## Step 4 — User Groups (Role-Based Access Control)

```bash
# Create user groups
aws cognito-idp create-group \
  --group-name organizers \
  --user-pool-id YOUR_USER_POOL_ID \
  --description "Event organizers with full event management access" \
  --region ap-south-1

aws cognito-idp create-group \
  --group-name attendees \
  --user-pool-id YOUR_USER_POOL_ID \
  --description "Event attendees with read-only access" \
  --region ap-south-1

aws cognito-idp create-group \
  --group-name admins \
  --user-pool-id YOUR_USER_POOL_ID \
  --description "System administrators" \
  --region ap-south-1
```

---

## Step 5 — Frontend Integration (React)

### Install AWS Amplify SDK

```bash
npm install aws-amplify @aws-amplify/ui-react
```

### Configure Amplify (`src/aws-config.ts`)

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [import.meta.env.VITE_REDIRECT_SIGN_IN],
          redirectSignOut: [import.meta.env.VITE_REDIRECT_SIGN_OUT],
          responseType: 'code'
        },
        email: true,
        phone: false
      }
    }
  }
});
```

### Environment Variables (`.env`)

```env
VITE_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_IDENTITY_POOL_ID=ap-south-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_COGNITO_DOMAIN=drishtix.auth.ap-south-1.amazoncognito.com
VITE_REDIRECT_SIGN_IN=http://localhost:5173/auth/callback
VITE_REDIRECT_SIGN_OUT=http://localhost:5173
```

### Sign-In / Sign-Up Usage

```typescript
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

// Sign up
await signUp({
  username: email,
  password,
  options: { userAttributes: { email, name } }
});

// Confirm signup (OTP)
await confirmSignUp({ username: email, confirmationCode: otp });

// Sign in
await signIn({ username: email, password });

// Get current user
const user = await getCurrentUser();

// Get JWT tokens
const session = await fetchAuthSession();
const idToken = session.tokens?.idToken?.toString();

// Sign out
await signOut();
```

---

## Step 6 — Backend Token Verification

### Node.js (Express API)

```bash
npm install aws-jwt-verify
```

```typescript
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID!,
});

// Middleware
export async function cognitoAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const payload = await verifier.verify(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Step 7 — Amazon SES for Transactional Emails

1. Verify your sender domain in AWS SES
2. Request production access (exit sandbox)
3. Configure Cognito to use SES:
   ```bash
   aws cognito-idp update-user-pool \
     --user-pool-id YOUR_USER_POOL_ID \
     --email-configuration '{
       "SourceArn": "arn:aws:ses:ap-south-1:ACCOUNT_ID:identity/noreply@yourdomain.com",
       "EmailSendingAccount": "DEVELOPER"
     }' \
     --region ap-south-1
   ```

---

## Testing the Setup

```bash
# Create a test user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --temporary-password Temp@1234 \
  --region ap-south-1

# Initiate auth
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=test@example.com,PASSWORD=Temp@1234 \
  --client-id YOUR_APP_CLIENT_ID \
  --region ap-south-1
```

---

## Security Best Practices

- Never expose User Pool ID or Client Secret in frontend code
- Use short-lived access tokens (default 1 hour)
- Enable Cognito Advanced Security Features (adaptive authentication) in production
- Configure CloudWatch alarms for unusual sign-in patterns
- Use AWS WAF with Cognito for brute-force protection

---

## Related Documentation

- [DynamoDB Setup](@guides/AWS_DYNAMODB_SETUP_GUIDE.md)
- [SQS/SNS Setup](@guides/AWS_SQS_SNS_SETUP_GUIDE.md)
- [AWS Solution Architecture](../AWS_SOLUTION_ARCHITECTURE.md)
