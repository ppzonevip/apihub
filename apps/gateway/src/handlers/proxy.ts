import { Request, Response } from 'express'
import httpProxy from 'http-proxy'
import { GatewayService } from '../services/gateway'
import { AuthenticatedRequest } from '../middleware/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proxy = httpProxy.createProxyServer({} as any)

proxy.on('error', ((err: Error, _req: Request, res: Response) => {
  console.error('[Proxy Error]', err.message)
  if (res && typeof res.status === 'function') {
    res.status(502).json({ success: false, error: 'Upstream error' })
  }
}) as any)

export function proxyHandler(gatewayService: GatewayService) {
  return async (req: Request, res: Response) => {
    const startTime = Date.now()
    const apiReq = req as AuthenticatedRequest

    // Extract API key
    const apiKey = (req.headers['x-api-key'] as string) || extractQueryApiKey(req.url)
    
    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'Missing API key' })
    }

    // Validate key
    const keyInfo = await gatewayService.validateApiKey(apiKey)
    if (!keyInfo.valid) {
      return res.status(401).json({ success: false, error: 'Invalid or inactive API key' })
    }

    // Extract path and method
    const path = req.path.substring(1)
    const method = req.method

    // Find route config
    const routeConfig = await gatewayService.getRouteConfig(keyInfo.projectId!, path, method)
    
    if (!routeConfig) {
      return res.status(404).json({ 
        success: false, 
        error: 'No route configured for this path',
        path,
        method,
      })
    }

    // Set gateway context for rate limit middleware
    apiReq.gatewayContext = {
      apiKeyId: keyInfo.apiKeyId!,
      routeId: routeConfig.id,
      projectId: keyInfo.projectId!,
      organizationId: keyInfo.organizationId!,
      rateLimit: keyInfo.rateLimit || routeConfig.rateLimit,
      monthlyLimit: keyInfo.monthlyLimit || routeConfig.monthlyLimit,
    }

    // Build upstream URL
    const upstreamPath = req.url!.replace(`/v1/${path}`, '')
    const upstreamUrl = `${routeConfig.upstreamUrl}${upstreamPath || ''}`

    // Track request size
    const bytesIn = parseInt(req.headers['content-length'] || '0', 10)
    let bytesOutTotal = 0

    // Intercept res.write to count bytes out
    const origWrite = res.write.bind(res)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.write = function(chunk: any, ...args: any[]): boolean {
      if (chunk) {
        bytesOutTotal += typeof chunk === 'string' 
          ? Buffer.byteLength(chunk) 
          : Buffer.isBuffer(chunk) ? chunk.length : 0
      }
      return origWrite(chunk, ...args)
    }

    // Proxy the request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proxy.web(req, res, { target: upstreamUrl, ignorePath: true }, (err: any, _req: any, res: any) => {
      const latencyMs = Date.now() - startTime
      const statusCode = res?.statusCode || 500
      
      // Record usage async
      gatewayService.recordUsage(
        keyInfo.apiKeyId!,
        routeConfig.id,
        statusCode,
        latencyMs,
        bytesIn,
        bytesOutTotal
      ).catch(() => {})
    })
  }
}

function extractQueryApiKey(url: string): string | undefined {
  try {
    const urlObj = new URL(url, 'http://localhost')
    return urlObj.searchParams.get('api_key') || undefined
  } catch {
    return undefined
  }
}
