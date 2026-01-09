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
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  sub: string
  roles: string[]
  mfa: boolean
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const REQUIRE_MFA_FOR_ADMINS = (process.env.REQUIRE_MFA_FOR_ADMINS || 'true') === 'true'

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : ''
    if (!token) return res.status(401).json({ success: false, error: 'Missing token' })

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    if (!decoded || !decoded.sub) return res.status(401).json({ success: false, error: 'Invalid token' })

    if (REQUIRE_MFA_FOR_ADMINS && decoded.roles?.includes('ADMIN') && !decoded.mfa) {
      return res.status(403).json({ success: false, error: 'MFA required for admin actions' })
    }

    req.user = decoded
    next()
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }
}

export function requireRoles(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' })
    const allowed = user.roles?.some(r => roles.includes(r))
    if (!allowed) return res.status(403).json({ success: false, error: 'Forbidden' })
    next()
  }
}

// Alias for backward compatibility
export const authorize = requireRoles
