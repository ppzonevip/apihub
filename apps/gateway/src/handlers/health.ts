import { Request, Response } from 'express'
import { prisma, redis } from '../index'

export async function healthHandler(_req: Request, res: Response) {
  const checks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  }

  // Check DB
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'connected'
  } catch {
    checks.database = 'disconnected'
  }

  // Check Redis
  if (redis.status === 'ready') {
    try {
      await redis.ping()
      checks.redis = 'connected'
    } catch {
      checks.redis = 'disconnected'
    }
  } else {
    checks.redis = 'disconnected'
  }

  const allHealthy = Object.values(checks).every(v => 
    v === 'ok' || v === 'connected' || v.startsWith(`${Math.floor(process.uptime())}s`) || v.includes('T')
  )

  res.status(allHealthy ? 200 : 503).json({
    ...checks,
    healthy: allHealthy,
  })
}
