import { Request, Response, NextFunction } from 'express'
import { GatewayService } from '../services/gateway'
import { AuthenticatedRequest } from './auth'
import { TIER_LIMITS, SubscriptionTier } from '@apihub/shared'

interface RateLimitInfo {
  allowed: boolean
  remaining: number
  resetMs: number
  total: number
}

export function rateLimitMiddleware(gatewayService: GatewayService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const apiReq = req as AuthenticatedRequest
    
    if (!apiReq.gatewayContext) {
      return next()
    }

    const { apiKeyId, rateLimit, monthlyLimit } = apiReq.gatewayContext

    const now = Date.now()
    const windowSec = 1 // 1-second window for QPS

    // Multi-pronged rate limit check:
    // 1. Per-key QPS (sliding window)
    // 2. Monthly quota

    const [qpsResult, monthlyResult] = await Promise.all([
      gatewayService.checkRateLimit(apiKeyId, rateLimit, windowSec),
      gatewayService.checkMonthlyLimit(apiKeyId, monthlyLimit),
    ])

    if (!qpsResult.allowed) {
      res.setHeader('X-RateLimit-Limit', String(rateLimit))
      res.setHeader('X-RateLimit-Remaining', '0')
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(qpsResult.resetMs / 1000)))
      res.setHeader('Retry-After', String(Math.ceil(qpsResult.resetMs / 1000)))
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(qpsResult.resetMs / 1000),
      })
    }

    if (!monthlyResult.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Monthly quota exceeded',
        limit: monthlyLimit,
      })
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(rateLimit))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, qpsResult.remaining)))
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(qpsResult.resetMs / 1000)))

    next()
  }
}
