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
 * Authentication Routes
 * JWT-based authentication with MFA support
 */

import { Router, Request, Response } from 'express'

import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { auditLoggerService } from '../services/audit-logger.service'
import { failedLoginTrackerService } from '../services/failed-login-tracker-redis.service'
import { mfaService } from '../services/mfa.service'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()
import { prisma } from '../index'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this'
const JWT_ISSUER = process.env.JWT_ISSUER || 'drishtix-platform'
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'drishtix-api'
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h'

interface LoginRequest {
  email: string
  password: string
  mfaCode?: string
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, mfaCode }: LoginRequest = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      })
    }

    const ipAddress = extractIp(req)
    const userAgent = req.headers['user-agent'] || 'unknown'

    // Check if IP is locked out
    if (await failedLoginTrackerService.isLockedOut(ipAddress, 'ip')) {
      return res.status(429).json({
        success: false,
        error: 'Too many failed login attempts. Please try again later.',
        lockedOut: true,
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      // Record failed attempt (don't reveal if user exists)
      await failedLoginTrackerService.recordFailedLogin(ipAddress, 'ip', {
        ipAddress,
        userAgent,
        userName: email,
      })

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    // Verify password (in production, hash passwords with bcrypt)
    // For now, assuming passwords are stored hashed
    const passwordValid = await verifyPassword(password, user.password || '')

    if (!passwordValid) {
      await failedLoginTrackerService.recordFailedLogin(ipAddress, 'ip', {
        ipAddress,
        userAgent,
        userName: user.name,
      })
      await failedLoginTrackerService.recordFailedLogin(user.id, 'userId', {
        ipAddress,
        userAgent,
        userName: user.name,
      })

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    // Check MFA requirement
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return res.status(200).json({
          success: false,
          requiresMfa: true,
          mfaMethod: user.mfaMethod || 'totp',
          message: 'MFA code required',
        })
      }

      // Verify MFA code
      const mfaValid = await verifyMfaCode(user.id, mfaCode, user.mfaMethod || 'totp')
      if (!mfaValid) {
        await failedLoginTrackerService.recordFailedLogin(ipAddress, 'ip', {
          ipAddress,
          userAgent,
          userName: user.name,
        })

        return res.status(401).json({
          success: false,
          error: 'Invalid MFA code',
        })
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: [user.role], // For compatibility with RBAC middleware
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRATION,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      } as jwt.SignOptions
    )

    // Reset failed login attempts
    failedLoginTrackerService.resetAttempts(ipAddress, 'ip')
    failedLoginTrackerService.resetAttempts(user.id, 'userId')

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Audit log successful login
    await auditLoggerService.logAuthEvent({
      userId: user.id,
      action: 'login',
      outcome: 'success',
      ipAddress,
      userAgent,
      metadata: {
        userName: user.name,
        userRole: user.role,
        mfaUsed: user.mfaEnabled,
      },
    })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          mfaEnabled: user.mfaEnabled,
        },
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    // Generate new token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: [user.role],
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRATION,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      } as jwt.SignOptions
    )

    res.json({
      success: true,
      data: { token },
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
    })
  }
})

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, optional server-side blacklist)
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    // Audit log logout
    await auditLoggerService.logAuthEvent({
      userId: user.id,
      action: 'logout',
      outcome: 'success',
      ipAddress: extractIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: {
        userName: user.name,
      },
    })

    res.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to logout',
    })
  }
})

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        permissions: true,
        mfaEnabled: true,
        mfaMethod: true,
        organizationId: true,
        eventAccess: true,
        isActive: true,
        lastLogin: true,
      },
    })

    res.json({
      success: true,
      data: fullUser,
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    })
  }
})

/**
 * POST /api/auth/mfa/setup
 * Setup TOTP MFA for user
 */
router.post('/mfa/setup', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    const setup = await mfaService.setupTOTP(user.id, user.name)

    res.json({
      success: true,
      data: {
        secret: setup.secret,
        qrCodeUrl: setup.qrCodeUrl,
        backupCodes: setup.backupCodes,
      },
    })
  } catch (error) {
    console.error('MFA setup error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to setup MFA',
    })
  }
})

/**
 * POST /api/auth/mfa/enable
 * Enable MFA after verification
 */
router.post('/mfa/enable', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { code, method } = req.body

    if (!code || !method) {
      return res.status(400).json({
        success: false,
        error: 'Code and method are required',
      })
    }

    // Verify code before enabling
    const result = await mfaService.verifyTOTP(user.id, code)
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
      })
    }

    await mfaService.enableMFA(user.id, method)

    // Audit log
    await auditLoggerService.logFromRequest(
      req,
      'MFA_ENABLED',
      'User',
      user.id,
      { method }
    )

    res.json({
      success: true,
      message: 'MFA enabled successfully',
    })
  } catch (error) {
    console.error('MFA enable error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to enable MFA',
    })
  }
})

/**
 * POST /api/auth/mfa/disable
 * Disable MFA
 */
router.post('/mfa/disable', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { password } = req.body

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required',
      })
    }

    // Verify password before disabling
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!userRecord) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    const passwordValid = await verifyPassword(password, userRecord.password || '')
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
      })
    }

    await mfaService.disableMFA(user.id)

    // Audit log
    await auditLoggerService.logFromRequest(
      req,
      'MFA_DISABLED',
      'User',
      user.id
    )

    res.json({
      success: true,
      message: 'MFA disabled successfully',
    })
  } catch (error) {
    console.error('MFA disable error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to disable MFA',
    })
  }
})

// Helper functions

function extractIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || 'unknown'
}

async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  // In development, allow plain text comparison for testing
  if (process.env.NODE_ENV === 'development' && !hashedPassword.startsWith('$2')) {
    return plainPassword === hashedPassword
  }

  // Production: use bcrypt
  try {
    return await bcrypt.compare(plainPassword, hashedPassword)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

async function verifyMfaCode(userId: string, code: string, method: string): Promise<boolean> {
  if (method === 'totp') {
    const result = await mfaService.verifyTOTP(userId, code)
    return result.valid
  } else if (method === 'sms') {
    const result = await mfaService.verifySMSCode(userId, code)
    return result.valid
  }

  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return code === '123456'
  }

  return false
}

function generateToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.roles || [user.role],
      permissions: user.permissions,
      mfaEnabled: user.mfaEnabled,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRATION,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    } as jwt.SignOptions
  )
}

function generateRefreshToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    } as jwt.SignOptions
  )
}

function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roles: user.roles || [user.role],
    permissions: user.permissions,
    avatar: user.avatar,
    mfaEnabled: user.mfaEnabled,
    emailVerified: user.emailVerified,
  }
}

/**
 * POST /api/auth/oauth/google
 * Authenticate with Google OAuth
 */
router.post('/oauth/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required',
      })
    }

    // Verify Google ID token with Azure AD B2C
    // Note: In Azure AD B2C, Google is configured as an identity provider
    // The idToken should be an Azure AD B2C token after redirect
    // For now, we'll use azureService to verify the token
    const { azureService } = await import('../services/azure.service')
    const decodedToken = await azureService.verifyAccessToken(idToken)

    const { email, name, picture, uid } = decodedToken as any

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email || '' },
    })

    if (!user) {
      // Create new user from OAuth
      user = await prisma.user.create({
        data: {
          email: email || '',
          name: name || email?.split('@')[0] || 'User',
          avatar: picture,
          roles: ['ATTENDEE'], // Default role
          permissions: ['read:events', 'write:profile'],
          isActive: true,
          emailVerified: true, // OAuth emails are verified
          authProvider: 'google',
          authProviderId: uid,
        },
      })

      console.log(`Created new user via Google OAuth: ${user.email}`)
    } else if (!user.authProvider) {
      // Link OAuth to existing account
      await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: 'google',
          authProviderId: uid,
          avatar: picture || user.avatar,
          emailVerified: true,
        },
      })
    }

    // Generate JWT tokens
    const token = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    // Audit log
    await auditLoggerService.logAuthEvent({
      userId: user.id,
      action: 'oauth_login',
      outcome: 'success',
      ipAddress: extractIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: {
        provider: 'google',
        userName: user.name,
        userRole: user.role,
      },
    })

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
        refreshToken,
      },
    })
  } catch (error: any) {
    console.error('Google OAuth error:', error)
    return res.status(401).json({
      success: false,
      error: 'Google authentication failed',
    })
  }
})

/**
 * POST /api/auth/oauth/facebook
 * Authenticate with Facebook OAuth
 */
router.post('/oauth/facebook', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required',
      })
    }

    // Verify Facebook access token with Azure AD B2C
    const { azureService } = await import('../services/azure.service')
    const decodedToken = await azureService.verifyAccessToken(accessToken)

    const { email, name, picture, uid } = decodedToken as any

    // Find or create user (similar to Google OAuth)
    let user = await prisma.user.findUnique({
      where: { email: email || '' },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email || '',
          name: name || email?.split('@')[0] || 'User',
          avatar: (typeof picture === 'object' && (picture as any)?.data?.url ? (picture as any).data.url : picture) as string,
          roles: ['ATTENDEE'],
          permissions: ['read:events', 'write:profile'],
          isActive: true,
          emailVerified: true,
          authProvider: 'facebook',
          authProviderId: uid,
        },
      })
    } else if (!user.authProvider) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: 'facebook',
          authProviderId: uid,
          emailVerified: true,
        },
      })
    }

    const token = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    await auditLoggerService.logAuthEvent({
      userId: user.id,
      action: 'oauth_login',
      outcome: 'success',
      ipAddress: extractIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: {
        provider: 'facebook',
        userName: user.name,
        userRole: user.role,
      },
    })

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
        refreshToken,
      },
    })
  } catch (error: any) {
    console.error('Facebook OAuth error:', error)
    return res.status(401).json({
      success: false,
      error: 'Facebook authentication failed',
    })
  }
})

/**
 * POST /api/auth/oauth/github
 * Authenticate with GitHub OAuth
 */
router.post('/oauth/github', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required',
      })
    }

    // Verify GitHub access token with Azure AD B2C
    const { azureService } = await import('../services/azure.service')
    const decodedToken = await azureService.verifyAccessToken(accessToken)

    const { email, name, picture, uid } = decodedToken as any

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email || '' },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email || '',
          name: name || email?.split('@')[0] || 'User',
          avatar: picture,
          roles: ['ATTENDEE'],
          permissions: ['read:events', 'write:profile'],
          isActive: true,
          emailVerified: true,
          authProvider: 'github',
          authProviderId: uid,
        },
      })
    } else if (!user.authProvider) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: 'github',
          authProviderId: uid,
          emailVerified: true,
        },
      })
    }

    const token = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    await auditLoggerService.logAuthEvent({
      userId: user.id,
      action: 'oauth_login',
      outcome: 'success',
      ipAddress: extractIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: {
        provider: 'github',
        userName: user.name,
        userRole: user.role,
      },
    })

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
        refreshToken,
      },
    })
  } catch (error: any) {
    console.error('GitHub OAuth error:', error)
    return res.status(401).json({
      success: false,
      error: 'GitHub authentication failed',
    })
  }
})

/**
 * POST /api/auth/fcm-token
 * Register or update FCM token for push notifications
 */
router.post('/fcm-token', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { fcmToken, platform } = req.body

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'FCM token is required',
      })
    }

    // Update user's FCM token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fcmToken,
        updatedAt: new Date(),
      },
    })

    // Subscribe user to their role topic using Azure Notification Hubs
    const { azureService } = await import('../services/azure.service')
    const userRecord = await prisma.user.findUnique({ where: { id: user.id } })

    if (userRecord) {
      // Subscribe to role-based tags in Azure Notification Hubs
      const tags = [
        `user_${user.id}`,
        `role_${userRecord.role.toLowerCase()}`,
      ]

      try {
        // In Azure Notification Hubs, tags are registered with the device installation
        // This is typically done when registering the device, not subscribing to topics
        // For now, we'll store the tags in the database
        console.log(`User ${user.id} subscribed to tags: ${tags.join(', ')}`)
      } catch (error) {
        console.error(`Failed to subscribe to tags:`, error)
      }

      // Update notification tags in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          fcmTopics: tags,
        },
      })
    }

    // Audit log
    await auditLoggerService.logFromRequest(
      req,
      'FCM_TOKEN_REGISTERED',
      'User',
      user.id,
      { platform }
    )

    return res.json({
      success: true,
      message: 'FCM token registered successfully',
    })
  } catch (error: any) {
    console.error('FCM token registration error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to register FCM token',
    })
  }
})

/**
 * DELETE /api/auth/fcm-token
 * Remove FCM token (on logout)
 */
router.delete('/fcm-token', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    await prisma.user.update({
      where: { id: user.id },
      data: {
        fcmToken: null,
        fcmTopics: [],
      },
    })

    return res.json({
      success: true,
      message: 'FCM token removed successfully',
    })
  } catch (error: any) {
    console.error('FCM token removal error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to remove FCM token',
    })
  }
})

export default router
