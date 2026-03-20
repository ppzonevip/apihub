# APIHub 系统架构

## 🗺️ 整体架构图

```
                          ┌─────────────────────────────────────┐
                          │            用户浏览器                  │
                          │         (Next.js 控制台)               │
                          └──────────────┬────────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
    HTTPS (3000)               HTTPS (3000)               HTTPS (3000)
              │                          │                          │
              ▼                          ▼                          ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│     Landing Page        │  │      Dashboard         │  │      Auth (NextAuth)    │
│  (静态/SSR混合)         │  │   (App Router, SPA)    │  │   (Credentials JWT)    │
└────────────┬────────────┘  └────────────┬────────────┘  └────────────┬────────────┘
             │                            │                            │
             │  REST API                  │  REST API                  │  OAuth Flow
             │  /api/projects            │  /api/routes               │
             │  /api/keys                │  /api/keys                 │
             │  /api/routes              │  /admin/...                │
             │                            │                            │
             └────────────────────────────┼────────────────────────────┘
                                          │
                                          ▼
                          ┌──────────────────────────────┐
                          │       Next.js Server          │
                          │   (API Routes / Prisma)       │
                          └─────────────────┬──────────────┘
                                            │
                                            │ Prisma ORM
                                            ▼
                          ┌──────────────────────────────┐
                          │       PostgreSQL               │
                          │  ┌──────────────────────────┐  │
                          │  │ User, Organization,      │  │
                          │  │ Project, ApiRoute,       │  │
                          │  │ ApiKey, UsageLog,        │  │
                          │  │ Subscription            │  │
                          │  └──────────────────────────┘  │
                          └──────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════

                          ┌──────────────────────────────┐
                          │     第三方调用者 / 客户端       │
                          │  curl / SDK / Postman         │
                          └──────────────┬───────────────┘
                                         │ HTTPS (4000)
                                         ▼
                          ┌──────────────────────────────┐
                          │      API Gateway Engine       │
                          │      (Express.js)             │
                          │                              │
                          │  ┌────────────────────────┐   │
                          │  │  JWT Auth Middleware   │   │
                          │  │  Rate Limit Middleware │   │
                          │  │  (Redis Sliding Window)│   │
                          │  │  Proxy Handler         │   │
                          │  │  (http-proxy)          │   │
                          │  │  Usage Logger          │   │
                          │  │  CORS Handler          │   │
                          │  └────────────────────────┘   │
                          └─────────────┬────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              │  Read Route Config      │  Record Usage Log       │
              ▼                         ▼                         ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│       Redis             │  │     PostgreSQL           │  │    Upstream Services     │
│  (Rate Limit Counter)   │  │  (UsageLog, ApiKey,     │  │  (你的后端服务)          │
│  (Sliding Window)       │  │   Route Config Cache)   │  │                         │
│  (Session Cache)        │  └─────────────────────────┘  └─────────────────────────┘
└─────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════

                          ┌──────────────────────────────┐
                          │   WebSocket (ws)             │
                          │   /ws?apiKeyId=xxx           │
                          │                              │
                          │   → 实时日志推送               │
                          │   → 使用量统计推送              │
                          └──────────────────────────────┘
```

## 📊 数据流说明

### 1. 用户注册/登录流程

```
用户 → POST /api/auth/register
  → Prisma: 创建 User + Organization + Subscription
  → bcrypt: 密码加密存储
  → NextAuth: 返回 JWT Session Token

用户 → POST /api/auth/signin
  → NextAuth credentials provider
  → bcrypt: 验证密码
  → JWT: 签发 Session Token
  → 前端: 存储在 cookie
```

### 2. API 调用流程 (代理请求)

```
1. 客户端请求: GET /v1/echo?api_key=xxx
              ↓
2. 网关接收请求，提取 X-API-Key header
              ↓
3. Prisma: 验证 API Key (isActive, 关联项目)
              ↓
4. Prisma: 查询路由配置 (path → upstreamUrl)
              ↓
5. Rate Limit Check (Redis Sliding Window):
   - ZREMRANGEBYSCORE: 移除窗口外记录
   - ZCARD: 计数当前窗口
   - 超过限额 → 429 Response
              ↓
6. Monthly Quota Check (PostgreSQL COUNT):
   - 当月 UsageLog 数量 < monthlyLimit
   - 超过限额 → 429 Response
              ↓
7. HTTP Proxy (http-proxy):
   - target: upstreamUrl
   - 改写 Host, Path, Headers
   - 透传 Body
              ↓
8. 响应回传，记录日志 (异步):
   - statusCode, latencyMs, bytesIn/Out
   - Prisma UsageLog.create()
              ↓
9. 返回响应给客户端 (附加 Rate Limit Headers)
```

### 3. 实时日志流

```
客户端 (Dashboard) 
    ↕ WebSocket (/ws?apiKeyId=xxx)
Gateway (轮询 + WebSocket 广播)
    ↕ Polling (每 3s)
PostgreSQL (UsageLog 表)
```

### 4. 限流算法 (Redis Sliding Window)

```
Key: ratelimit:qps:{apiKeyId}

时间窗口: 1 秒

ZREMRANGEBYSCORE ratelimit:qps:xxx 0 {now - 1000}
ZCARD ratelimit:qps:xxx
  → count >= limit → 拒绝
  → count < limit → 继续
ZADD ratelimit:qps:xxx {now} {now}-{randomId}
EXPIRE ratelimit:qps:xxx 2
```

## 🗃️ 数据库模型关系

```
User (1) ────────────── (N) Organization
                            │
                            │ (1)
                            ├──────── (N) Project
                            │              │
                            │              ├─ (N) ApiRoute
                            │              └─ (N) ApiKey ────── (N) UsageLog
                            │                    ↑
                            │                    │
                            └─ (N) Subscription  │
                                                │
                                          (N) UsageLog ← (from ApiKey)
```

## 🔐 安全模型

```
认证层:
  - 前端: NextAuth JWT Session (httpOnly cookie)
  - 网关: API Key (X-API-Key header)
  - 管理: JWT Bearer Token (用于 /admin 路由)

授权层:
  - API Key 绑定到 Project + 特定 Route
  - 会员等级决定 QPS 上限和月度限额

限流层:
  - Per-Key QPS (Redis)
  - Per-Key Monthly Quota (PostgreSQL)
  - Per-Org Total (可选)

数据隔离:
  - 每个 Organization 只能访问自己的数据
  - API Key 无法跨项目访问
```

## 📁 Monorepo 依赖关系

```
packages/shared (无依赖)
    ↑ 被以下引用
apps/gateway (imports @apihub/shared)
apps/console  (imports @apihub/shared)
```

## 🔄 开发工作流

```
1. 修改 prisma/schema.prisma
2. npm run db:push          # 同步 schema
3. npm run db:generate      # 重新生成 Client
4. 修改 apps/gateway/       # 网关逻辑
5. 修改 apps/console/       # 前端逻辑
6. npm run dev              # 启动所有服务
```

## 🚢 生产部署建议

```
前端 (Vercel):
  - next.config.js 设置 NEXT_PUBLIC_GATEWAY_URL
  - 环境变量: DATABASE_URL, NEXTAUTH_SECRET

网关 (Railway/Render/Docker):
  - 多实例部署 (无状态)
  - Redis: 使用 Upstash 或 AWS ElastiCache
  - PostgreSQL: 使用 Supabase 或 AWS RDS
  - 负载均衡: Nginx 或 云 LB
```

## ⚡ 性能目标

| 指标 | 目标 |
|------|------|
| 网关 P50 延迟 | < 10ms |
| 网关 P99 延迟 | < 50ms |
| 单实例 QPS | 5,000 - 15,000 |
| 前端 TTFB | < 200ms |
| Redis 限流精度 | 滑动窗口 ±5ms |
