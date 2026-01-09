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
 * MFA (Multi-Factor Authentication) Service
 * TOTP-based 2FA using speakeasy
 */

import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { prisma } from '../index'

export interface MFASetupResult {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface MFAVerifyResult {
  valid: boolean
  error?: string
}

class MFAService {
  /**
   * Generate TOTP secret and QR code for user
   */
  async setupTOTP(userId: string, userName: string): Promise<MFASetupResult> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `DrishtiX (${userName})`,
      issuer: 'DrishtiX',
      length: 32,
    })

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8)

    // Store secret and backup codes in database
    // Note: In production, encrypt these before storing!
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaMethod: 'totp',
        mfaSecret: secret.base32,
        backupCodes: backupCodes,
      },
    })

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    }
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTP(userId: string, token: string): Promise<MFAVerifyResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user || user.mfaMethod !== 'totp') {
        return { valid: false, error: 'MFA not enabled for user' }
      }

      // Get stored secret (in production, decrypt this)
      // Placeholder: retrieve from secure storage
      const secret = await this.getUserTOTPSecret(userId)

      if (!secret) {
        return { valid: false, error: 'MFA secret not found' }
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time-steps before/after for clock drift
      })

      return { valid: verified }
    } catch (error) {
      console.error('TOTP verification error:', error)
      return { valid: false, error: 'Verification failed' }
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<MFAVerifyResult> {
    try {
      // Get user's backup codes
      const backupCodes = await this.getUserBackupCodes(userId)

      if (!backupCodes || !backupCodes.includes(code)) {
        return { valid: false, error: 'Invalid backup code' }
      }

      // Remove used backup code
      await this.removeBackupCode(userId, code)

      return { valid: true }
    } catch (error) {
      console.error('Backup code verification error:', error)
      return { valid: false, error: 'Verification failed' }
    }
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string, method: 'totp' | 'sms'): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaMethod: method,
      },
    })
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaMethod: null,
      },
    })

    // Clear stored secrets and backup codes
    await this.clearUserMFAData(userId)
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  /**
   * Get user's TOTP secret from database
   */
  private async getUserTOTPSecret(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    })

    return user?.mfaSecret || null
  }

  /**
   * Get user's backup codes from database
   */
  private async getUserBackupCodes(userId: string): Promise<string[] | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    })

    return user?.backupCodes || null
  }

  /**
   * Remove used backup code
   */
  private async removeBackupCode(userId: string, code: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    })

    if (user?.backupCodes) {
      const updatedCodes = user.backupCodes.filter((c: string) => c !== code)
      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: updatedCodes },
      })
    }
  }

  /**
   * Clear user's MFA data
   */
  private async clearUserMFAData(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: null,
        backupCodes: [],
      },
    })
  }  /**
   * Send SMS code (placeholder for SMS MFA)
   */
  async sendSMSCode(userId: string, phoneNumber: string): Promise<void> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Store code with expiry (5 minutes)
    // TODO: Store in Redis with TTL

    // Send via Twilio or similar
    // TODO: Integrate SMS provider
    console.log(`SMS code for ${phoneNumber}: ${code}`)
  }

  /**
   * Verify SMS code (placeholder)
   */
  async verifySMSCode(userId: string, code: string): Promise<MFAVerifyResult> {
    // TODO: Implement SMS code verification from Redis/cache
    return { valid: code.length === 6 && /^\d+$/.test(code) }
  }
}

export const mfaService = new MFAService()
