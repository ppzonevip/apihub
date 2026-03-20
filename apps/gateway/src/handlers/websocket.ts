import { WebSocketServer, WebSocket } from 'ws'
import { URL } from 'url'
import { GatewayService } from '../services/gateway'
import { verifyJwt } from '../middleware/auth'

export function wsHandler(wss: WebSocketServer, gatewayService: GatewayService) {
  wss.on('connection', async (ws, req) => {
    // Parse query params for auth
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')
    const apiKeyId = url.searchParams.get('apiKeyId')

    // Authenticate
    if (!token && !apiKeyId) {
      ws.close(4001, 'Authentication required')
      return
    }

    let subscribedApiKeyId: string | null = null

    if (token) {
      const payload = verifyJwt(token)
      if (!payload) {
        ws.close(4002, 'Invalid token')
        return
      }
      subscribedApiKeyId = payload.apiKeyId
    } else if (apiKeyId) {
      subscribedApiKeyId = apiKeyId
    }

    if (!subscribedApiKeyId) {
      ws.close(4003, 'No API key ID')
      return
    }

    // Send initial stats
    const stats = await gatewayService.getUsageStats(subscribedApiKeyId, 7)
    ws.send(JSON.stringify({ type: 'stats', data: stats }))

    // Subscribe to new logs via polling (in production, use Redis pub/sub)
    const pollInterval = setInterval(async () => {
      if (ws.readyState !== WebSocket.OPEN) return
      
      try {
        const recentLogs = await gatewayService.prisma.usageLog.findMany({
          where: { apiKeyId: subscribedApiKeyId! },
          orderBy: { timestamp: 'desc' },
          take: 10,
        })

        for (const log of recentLogs.reverse()) {
          ws.send(JSON.stringify({
            type: 'log',
            data: {
              id: log.id,
              apiKeyId: log.apiKeyId,
              routeId: log.routeId,
              statusCode: log.statusCode,
              latencyMs: log.latencyMs,
              bytesIn: log.bytesIn,
              bytesOut: log.bytesOut,
              timestamp: log.timestamp.toISOString(),
            },
          }))
        }
      } catch (err) {
        console.error('[WS] Poll error:', err)
      }
    }, 3000)

    ws.on('close', () => {
      clearInterval(pollInterval)
    })

    ws.on('error', (err) => {
      console.error('[WS] Error:', err)
      clearInterval(pollInterval)
    })
  })
}
