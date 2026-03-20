import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { authMiddleware } from './middleware/auth'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { proxyHandler } from './handlers/proxy'
import { healthHandler } from './handlers/health'
import { wsHandler } from './handlers/websocket'
import { apiRoutes } from './routes/api'
import { GatewayService } from './services/gateway'

config()

const app = express()
const server = createServer(app)

// Prisma
export const prisma = new PrismaClient()

// Redis
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
export const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true })

// Gateway Service
const gatewayService = new GatewayService(prisma, redis)

// WebSocket
const wss = new WebSocketServer({ server, path: '/ws' })
wsHandler(wss, gatewayService)

// Middleware
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check (public)
app.get('/health', healthHandler)

// API Routes (protected by JWT)
app.use('/v1', authMiddleware, rateLimitMiddleware(gatewayService), proxyHandler(gatewayService))

// API management routes (internal or admin)
app.use('/admin', authMiddleware, apiRoutes(gatewayService))

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Gateway Error]', err)
  res.status(500).json({ success: false, error: 'Internal gateway error' })
})

const PORT = parseInt(process.env.PORT || '4000', 10)

async function main() {
  try {
    // Connect Redis
    await redis.connect().catch(() => {
      console.warn('[Redis] Connection failed, continuing without Redis cache')
    })
    
    // Seed some demo routes if empty (dev mode)
    if (process.env.NODE_ENV !== 'production') {
      await gatewayService.seedDemoData().catch(console.error)
    }

    server.listen(PORT, () => {
      console.log(`🚀 APIHub Gateway running on http://localhost:${PORT}`)
      console.log(`   Health: http://localhost:${PORT}/health`)
      console.log(`   WebSocket: ws://localhost:${PORT}/ws`)
    })
  } catch (err) {
    console.error('Failed to start gateway:', err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  await prisma.$disconnect()
  await redis.quit()
  server.close()
  process.exit(0)
})

main()
