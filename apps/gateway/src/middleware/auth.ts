import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '@apihub/shared'

const JWT_SECRET = process.env.JWT_SECRET || 'apihub-dev-secret-change-in-production'

export interface AuthenticatedRequest extends Request {
  gatewayContext?: {
    apiKeyId: string
    routeId: string
    projectId: string
    organizationId: string
    rateLimit: number
    monthlyLimit: number
  }
  user?: {
    id: string
    email: string
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For gateway requests, we expect API key auth
    // Admin routes use JWT
    const apiKey = req.headers['x-api-key'] as string
    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'Missing authorization' })
    }
    // API key auth handled in proxy handler
    return next()
  }

  const token = authHeader.substring(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    ;(req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: '',
    }
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

export function generateJwt(userId: string, expiresIn = '7d'): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] })
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}
