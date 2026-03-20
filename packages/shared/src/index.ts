// ==================== 会员等级 & 限制 ====================

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface TierLimits {
  qps: number
  monthlyLimit: number
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: { qps: 1, monthlyLimit: 10_000 },
  pro: { qps: 10, monthlyLimit: 100_000 },
  enterprise: { qps: 100, monthlyLimit: Infinity },
}

// ==================== API 路由 ====================

export interface ApiRouteConfig {
  id: string
  projectId: string
  path: string
  upstreamUrl: string
  method: string
  rateLimit: number
  monthlyLimit: number
  isActive: boolean
}

// ==================== API Key ====================

export interface ApiKeyInfo {
  id: string
  key: string
  name: string
  projectId: string
  routeId: string | null
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

// ==================== 使用量统计 ====================

export interface UsageStats {
  totalRequests: number
  totalBytesIn: number
  totalBytesOut: number
  avgLatencyMs: number
  successRate: number
  periodStart: string
  periodEnd: string
}

export interface UsageLogEntry {
  id: string
  apiKeyId: string
  routeId: string | null
  statusCode: number
  latencyMs: number
  bytesIn: number
  bytesOut: number
  timestamp: string
}

// ==================== 项目 & 组织 ====================

export interface ProjectInfo {
  id: string
  name: string
  organizationId: string
  createdAt: string
}

export interface OrganizationInfo {
  id: string
  name: string
  ownerId: string
  createdAt: string
}

export interface SubscriptionInfo {
  id: string
  organizationId: string
  tier: SubscriptionTier
  expiresAt: string | null
  createdAt: string
}

// ==================== 网关请求上下文 ====================

export interface GatewayContext {
  apiKeyId: string
  routeId: string
  projectId: string
  organizationId: string
  tier: SubscriptionTier
  rateLimit: number
  monthlyLimit: number
}

// ==================== JWT Payload ====================

export interface JwtPayload {
  sub: string
  apiKeyId: string
  projectId: string
  routeId?: string
  iat: number
  exp: number
}

// ==================== API 响应格式 ====================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ==================== WebSocket 日志消息 ====================

export interface WsLogMessage {
  type: 'log' | 'stats' | 'error'
  data: UsageLogEntry | UsageStats | string
}
