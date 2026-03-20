# APIHub — 中国版 Zuplo

专业的 API 管理与网关平台，支持动态路由、智能限流、实时监控，一行代码接入。

## 🏗️ 技术架构

```
apihub/
├── apps/
│   ├── console/          # Next.js 14 前端控制台
│   └── gateway/          # Node.js 网关引擎
├── packages/
│   └── shared/           # 共享类型定义 (@apihub/shared)
└── prisma/
    └── schema.prisma    # 数据库模型
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router), React 18, Tailwind CSS, Shadcn UI, Framer Motion, Recharts |
| 网关 | Node.js, Express.js, http-proxy, ioredis, JWT |
| 数据库 | PostgreSQL + Prisma ORM |
| 缓存/限流 | Redis (ioredis) |
| Monorepo | Turborepo + npm workspaces |

## 🚀 本地运行

### 前置条件

- Node.js >= 20
- PostgreSQL (或使用 Docker)
- Redis (可选，限流会优雅降级)

### 1. 安装依赖

```bash
cd apihub
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp apps/console/.env.example apps/console/.env.local
cp apps/gateway/.env.example apps/gateway/.env

# 编辑 .env.local 和 .env
```

**apps/console/.env.local**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/apihub"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

**apps/gateway/.env**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/apihub"
REDIS_URL="redis://localhost:6379"
PORT=4000
JWT_SECRET="your-jwt-secret"
CORS_ORIGIN="http://localhost:3000"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 推送 schema 到数据库
npm run db:push

# (可选) 打开 Prisma Studio 查看数据
npm run db:studio
```

### 4. 启动开发服务器

```bash
# 启动前端 (控制台)
npm run dev:console

# 启动网关
npm run dev:gateway
```

访问:
- 前端: http://localhost:3000
- 网关: http://localhost:4000
- 健康检查: http://localhost:4000/health

## 🧪 测试 API

网关运行后，使用 Demo API Key 测试：

```bash
# 自动 seeding 了演示数据，可通过日志查看 Demo Key
# 或注册账户后创建自己的 Key

# 测试网关代理
curl -X GET "http://localhost:4000/v1/echo" \
  -H "X-API-Key: <your-api-key>"
```

## 📊 会员方案

| 方案 | QPS | 月度请求 | 价格 |
|------|-----|---------|------|
| Free | 1 | 10,000 | 免费 |
| Pro | 10 | 100,000 | ¥99/月 |
| Enterprise | 100 | 无限制 | ¥999/月 |

## 🔐 认证

- NextAuth.js (credentials provider)
- JWT Session
- bcrypt 密码加密

## 📁 关键文件

```
apps/gateway/src/
├── index.ts              # 入口，Express 服务器
├── services/gateway.ts   # 核心网关服务（路由、限流、日志）
├── middleware/
│   ├── auth.ts           # JWT 验证中间件
│   └── rateLimit.ts      # 限流中间件
├── handlers/
│   ├── proxy.ts          # HTTP 反向代理
│   ├── health.ts         # 健康检查
│   └── websocket.ts      # 实时日志 WebSocket
└── routes/api.ts         # 管理 API（CRUD）

apps/console/src/
├── app/
│   ├── page.tsx                    # Landing Page
│   ├── (auth)/login/page.tsx       # 登录页
│   ├── (auth)/register/page.tsx   # 注册页
│   ├── dashboard/
│   │   ├── page.tsx               # Dashboard 概览
│   │   ├── projects/page.tsx     # 项目管理
│   │   ├── projects/[id]/page.tsx # API 编辑器
│   │   ├── keys/page.tsx          # API Key 管理
│   │   ├── usage/page.tsx         # 使用量统计
│   │   └── billing/page.tsx       # 订阅管理
│   └── api/
│       ├── auth/                  # NextAuth 路由
│       ├── projects/              # 项目 API
│       ├── keys/                  # Key API
│       └── routes/                # 路由 API
└── lib/
    └── payment_gateway_service.ts  # 支付网关预留
```

## 🔌 API 端点

### 管理 API (需 JWT 认证)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /projects/:id/routes | 获取项目路由列表 |
| POST | /routes | 创建路由 |
| PATCH | /routes/:id | 更新路由 |
| DELETE | /routes/:id | 删除路由 |
| GET | /projects/:id/keys | 获取 API Keys |
| POST | /keys | 创建 API Key |
| PATCH | /keys/:id/toggle | 启用/禁用 Key |
| DELETE | /keys/:id | 删除 Key |
| GET | /keys/:id/stats | 获取使用统计 |

### 代理 API (需 API Key)

```
GET/POST/PUT/DELETE /v1/{path}?api_key={key}
Header: X-API-Key: {key}
```

## 🛠️ 扩展指南

### 接入真实支付

编辑 `apps/console/src/lib/payment_gateway_service.ts`：
1. 安装支付宝 SDK: `npm install alipay-sdk`
2. 安装微信支付 SDK: `npm install wechatpay-node-sdk`
3. 填入商户凭证
4. 实现 `processAlipay()` 和 `processWechat()` 函数

### 添加新的中间件

在 `apps/gateway/src/middleware/` 创建文件：
```typescript
export function myMiddleware(req, res, next) {
  // 自定义逻辑
  next()
}
```

在 `apps/gateway/src/index.ts` 中注册：
```typescript
app.use('/v1', myMiddleware, ...existingHandlers)
```

## 📄 License

MIT
