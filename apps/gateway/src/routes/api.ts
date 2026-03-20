import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { GatewayService } from '../services/gateway'
import { AuthenticatedRequest } from '../middleware/auth'

const route = Router()

const createRouteSchema = z.object({
  projectId: z.string().min(1),
  path: z.string().min(1).startsWith('/'),
  upstreamUrl: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']).default('GET'),
  rateLimit: z.number().int().min(1).max(1000).default(1),
  monthlyLimit: z.number().int().min(1).default(10000),
  isActive: z.boolean().default(true),
})

const createApiKeySchema = z.object({
  projectId: z.string().min(1),
  routeId: z.string().optional(),
  name: z.string().min(1).max(100),
})

const createProjectSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1).max(100),
})

export function apiRoutes(gatewayService: GatewayService) {
  // ==================== 路由管理 ====================

  // List routes for a project
  route.get('/projects/:projectId/routes', async (req, res) => {
    try {
      const routes = await gatewayService.prisma.apiRoute.findMany({
        where: { projectId: req.params.projectId },
        orderBy: { createdAt: 'desc' },
      })
      res.json({ success: true, data: routes })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: 'Failed to fetch routes' })
    }
  })

  // Create route
  route.post('/routes', async (req, res) => {
    const parsed = createRouteSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message })
    }
    try {
      const route = await gatewayService.prisma.apiRoute.create({ data: parsed.data })
      res.json({ success: true, data: route })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: 'Failed to create route' })
    }
  })

  // Update route
  route.patch('/routes/:id', async (req, res) => {
    try {
      const route = await gatewayService.prisma.apiRoute.update({
        where: { id: req.params.id },
        data: req.body,
      })
      res.json({ success: true, data: route })
    } catch (err) {
      res.status(404).json({ success: false, error: 'Route not found' })
    }
  })

  // Delete route
  route.delete('/routes/:id', async (req, res) => {
    try {
      await gatewayService.prisma.apiRoute.delete({ where: { id: req.params.id } })
      res.json({ success: true })
    } catch {
      res.status(404).json({ success: false, error: 'Route not found' })
    }
  })

  // ==================== API Key 管理 ====================

  // List API keys
  route.get('/projects/:projectId/keys', async (req, res) => {
    try {
      const keys = await gatewayService.prisma.apiKey.findMany({
        where: { projectId: req.params.projectId },
        select: {
          id: true,
          key: true,
          name: true,
          projectId: true,
          routeId: true,
          isActive: true,
          lastUsedAt: true,
          createdAt: true,
        },
      })
      res.json({ success: true, data: keys })
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to fetch keys' })
    }
  })

  // Create API key
  route.post('/keys', async (req, res) => {
    const parsed = createApiKeySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message })
    }
    try {
      const key = uuidv4()
      const apiKey = await gatewayService.prisma.apiKey.create({
        data: {
          key,
          name: parsed.data.name,
          projectId: parsed.data.projectId,
          routeId: parsed.data.routeId || null,
        },
        select: {
          id: true,
          key: true,
          name: true,
          projectId: true,
          routeId: true,
          isActive: true,
          createdAt: true,
        },
      })
      res.json({ success: true, data: apiKey })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: 'Failed to create key' })
    }
  })

  // Toggle API key
  route.patch('/keys/:id/toggle', async (req, res) => {
    try {
      const current = await gatewayService.prisma.apiKey.findUnique({ where: { id: req.params.id } })
      if (!current) return res.status(404).json({ success: false, error: 'Key not found' })
      
      const updated = await gatewayService.prisma.apiKey.update({
        where: { id: req.params.id },
        data: { isActive: !current.isActive },
      })
      res.json({ success: true, data: updated })
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to toggle key' })
    }
  })

  // Delete API key
  route.delete('/keys/:id', async (req, res) => {
    try {
      await gatewayService.prisma.apiKey.delete({ where: { id: req.params.id } })
      res.json({ success: true })
    } catch {
      res.status(404).json({ success: false, error: 'Key not found' })
    }
  })

  // ==================== 项目管理 ====================

  route.get('/organizations/:orgId/projects', async (req, res) => {
    try {
      const projects = await gatewayService.prisma.project.findMany({
        where: { organizationId: req.params.orgId },
        include: {
          _count: { select: { apiRoutes: true, apiKeys: true } },
        },
      })
      res.json({ success: true, data: projects })
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to fetch projects' })
    }
  })

  route.post('/projects', async (req, res) => {
    const parsed = createProjectSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message })
    }
    try {
      const project = await gatewayService.prisma.project.create({ data: parsed.data })
      res.json({ success: true, data: project })
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to create project' })
    }
  })

  // ==================== 使用量统计 ====================

  route.get('/keys/:id/stats', async (req, res) => {
    try {
      const days = parseInt(req.query.days as string || '7', 10)
      const stats = await gatewayService.getUsageStats(req.params.id, days)
      res.json({ success: true, data: stats })
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to fetch stats' })
    }
  })

  return route
}
