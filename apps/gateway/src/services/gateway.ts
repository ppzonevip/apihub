import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import { ApiRouteConfig, TierLimits } from '@apihub/shared'
import { v4 as uuidv4 } from 'uuid'

export class GatewayService {
  prisma: PrismaClient
  private redis: Redis
  private routeCache: Map<string, { config: ApiRouteConfig; ttl: number }> = new Map()
  private cacheTtl = 30_000 // 30 seconds

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma
    this.redis = redis
  }

  // ==================== 路由配置 ====================

  async getRouteConfig(projectId: string, path: string, method: string): Promise<ApiRouteConfig | null> {
    const cacheKey = `${projectId}:${path}:${method}`
    const cached = this.routeCache.get(cacheKey)
    
    if (cached && cached.ttl > Date.now()) {
      return cached.config
    }

    try {
      const route = await this.prisma.apiRoute.findFirst({
        where: {
          projectId,
          path,
          method: method.toUpperCase(),
          isActive: true,
        },
      })

      if (route) {
        const config: ApiRouteConfig = {
          id: route.id,
          projectId: route.projectId,
          path: route.path,
          upstreamUrl: route.upstreamUrl,
          method: route.method,
          rateLimit: route.rateLimit,
          monthlyLimit: route.monthlyLimit,
          isActive: route.isActive,
        }
        this.routeCache.set(cacheKey, { config, ttl: Date.now() + this.cacheTtl })
        return config
      }
    } catch (err) {
      console.error('[GatewayService] Failed to fetch route config:', err)
    }

    return null
  }

  async getRouteConfigById(routeId: string): Promise<ApiRouteConfig | null> {
    const route = await this.prisma.apiRoute.findUnique({ where: { id: routeId } })
    if (!route) return null
    return {
      id: route.id,
      projectId: route.projectId,
      path: route.path,
      upstreamUrl: route.upstreamUrl,
      method: route.method,
      rateLimit: route.rateLimit,
      monthlyLimit: route.monthlyLimit,
      isActive: route.isActive,
    }
  }

  // ==================== API Key 验证 ====================

  async validateApiKey(key: string): Promise<{
    valid: boolean
    apiKeyId?: string
    projectId?: string
    routeId?: string
    organizationId?: string
    tier?: string
    rateLimit?: number
    monthlyLimit?: number
  }> {
    const apiKeyRecord = await this.prisma.apiKey.findUnique({
      where: { key },
      include: {
        project: {
          include: {
            organization: {
              include: {
                subscriptions: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        route: true,
      },
    })

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return { valid: false }
    }

    const sub = apiKeyRecord.project.organization.subscriptions[0]
    const tier = sub?.tier || 'free'

    // Update lastUsedAt (fire and forget)
    this.prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {})

    return {
      valid: true,
      apiKeyId: apiKeyRecord.id,
      projectId: apiKeyRecord.projectId,
      routeId: apiKeyRecord.routeId || undefined,
      organizationId: apiKeyRecord.project.organizationId,
      tier,
      rateLimit: apiKeyRecord.route?.rateLimit || 1,
      monthlyLimit: apiKeyRecord.route?.monthlyLimit || 10000,
    }
  }

  // ==================== 限流 ====================

  async checkRateLimit(apiKeyId: string, limit: number, windowSec: number): Promise<{
    allowed: boolean
    remaining: number
    resetMs: number
  }> {
    const key = `ratelimit:qps:${apiKeyId}`
    const now = Date.now()
    const windowMs = windowSec * 1000
    const windowStart = now - windowMs

    try {
      // Use Redis sliding window
      const redisAvailable = this.redis.status === 'ready'
      
      if (redisAvailable) {
        // Remove old entries outside window
        await this.redis.zremrangebyscore(key, 0, windowStart)
        // Count current window
        const count = await this.redis.zcard(key)
        
        if (count >= limit) {
          // Get oldest entry to calculate reset time
          const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES')
          const resetMs = oldest.length >= 2 
            ? Math.max(0, parseInt(oldest[1]) + windowMs - now)
            : windowMs
          
          return { allowed: false, remaining: 0, resetMs }
        }
        
        // Add current request
        await this.redis.zadd(key, now, `${now}-${Math.random()}`)
        await this.redis.expire(key, windowSec + 1)
        
        return { allowed: true, remaining: limit - count - 1, resetMs: windowMs }
      }
    } catch (err) {
      console.error('[RateLimit] Redis error, falling back to in-memory:', err)
    }

    // Fallback: simple in-memory counter
    return this.inMemoryRateLimit(apiKeyId, limit, windowMs)
  }

  private inMemoryRateLimitMap = new Map<string, { count: number; resetAt: number }>()

  private inMemoryRateLimit(apiKeyId: string, limit: number, windowMs: number) {
    const now = Date.now()
    const record = this.inMemoryRateLimitMap.get(apiKeyId)

    if (!record || record.resetAt <= now) {
      this.inMemoryRateLimitMap.set(apiKeyId, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: limit - 1, resetMs: windowMs }
    }

    if (record.count >= limit) {
      return { allowed: false, remaining: 0, resetMs: record.resetAt - now }
    }

    record.count++
    return { allowed: true, remaining: limit - record.count, resetMs: record.resetAt - now }
  }

  // ==================== 月度限额 ====================

  async checkMonthlyLimit(apiKeyId: string, monthlyLimit: number): Promise<{ allowed: boolean }> {
    if (monthlyLimit === Infinity) return { allowed: true }

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    try {
      const count = await this.prisma.usageLog.count({
        where: {
          apiKeyId,
          timestamp: { gte: monthStart },
        },
      })

      return { allowed: count < monthlyLimit }
    } catch {
      return { allowed: true } // Fail open on errors
    }
  }

  // ==================== 日志记录 ====================

  async recordUsage(apiKeyId: string, routeId: string | undefined, statusCode: number, latencyMs: number, bytesIn: number, bytesOut: number) {
    try {
      await this.prisma.usageLog.create({
        data: {
          apiKeyId,
          routeId: routeId || null,
          statusCode,
          latencyMs,
          bytesIn,
          bytesOut,
        },
      })
    } catch (err) {
      console.error('[GatewayService] Failed to record usage log:', err)
    }
  }

  async getUsageStats(apiKeyId: string, days = 7): Promise<{
    totalRequests: number
    avgLatency: number
    successRate: number
    dailyStats: { date: string; requests: number }[]
  }> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const logs = await this.prisma.usageLog.findMany({
      where: { apiKeyId, timestamp: { gte: since } },
      select: { statusCode: true, latencyMs: true, timestamp: true },
      orderBy: { timestamp: 'asc' },
    })

    if (logs.length === 0) {
      return { totalRequests: 0, avgLatency: 0, successRate: 0, dailyStats: [] }
    }

    const totalRequests = logs.length
    const avgLatency = Math.round(logs.reduce((s, l) => s + l.latencyMs, 0) / totalRequests)
    const successCount = logs.filter(l => l.statusCode >= 200 && l.statusCode < 400).length
    const successRate = Math.round((successCount / totalRequests) * 100)

    // Group by day
    const dailyMap = new Map<string, number>()
    for (const log of logs) {
      const date = log.timestamp.toISOString().substring(0, 10)
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
    }
    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, requests]) => ({ date, requests }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return { totalRequests, avgLatency, successRate, dailyStats }
  }

  // ==================== 开发者数据 ====================

  async seedDemoData() {
    const count = await this.prisma.user.count()
    if (count > 0) return

    console.log('[Gateway] Seeding demo data...')

    // Create demo user
    const user = await this.prisma.user.create({
      data: {
        email: 'demo@apihub.dev',
        passwordHash: '$2b$10$demohashpassword', // Placeholder
        name: 'Demo User',
      },
    })

    // Create org
    const org = await this.prisma.organization.create({
      data: { name: 'Demo Organization', ownerId: user.id },
    })

    // Create subscription
    await this.prisma.subscription.create({
      data: { organizationId: org.id, tier: 'pro', expiresAt: new Date('2027-01-01') },
    })

    // Create project
    const project = await this.prisma.project.create({
      data: { name: 'My First Project', organizationId: org.id },
    })

    // Create API route
    const route = await this.prisma.apiRoute.create({
      data: {
        projectId: project.id,
        path: '/echo',
        upstreamUrl: 'https://httpbin.org',
        method: 'GET',
        rateLimit: 10,
        monthlyLimit: 100000,
        isActive: true,
      },
    })

    // Create API key
    const apiKey = uuidv4()
    await this.prisma.apiKey.create({
      data: {
        key: apiKey,
        name: 'Demo API Key',
        projectId: project.id,
        routeId: route.id,
        isActive: true,
      },
    })

    console.log(`[Gateway] Demo data seeded. API Key: ${apiKey}`)
  }
}
