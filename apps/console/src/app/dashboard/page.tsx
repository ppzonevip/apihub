'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { FolderKanban, Key, Globe, TrendingUp, Zap, ArrowRight, Activity } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fetchDashboardData(orgId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { apiRoutes: true, apiKeys: true } },
    },
  })
  const keys = await prisma.apiKey.findMany({
    where: { project: { organizationId: orgId } },
    select: { id: true, lastUsedAt: true },
  })
  const totalLogs = await prisma.usageLog.count({
    where: { apiKey: { project: { organizationId: orgId } } },
  })
  return { projects, keys, totalLogs }
}

// Mock chart data
const chartData = [
  { date: '03-15', requests: 1200 },
  { date: '03-16', requests: 1900 },
  { date: '03-17', requests: 1500 },
  { date: '03-18', requests: 2300 },
  { date: '03-19', requests: 2800 },
  { date: '03-20', requests: 3200 },
  { date: '03-21', requests: 2900 },
]

const stats = [
  { label: '项目数', value: '—', icon: FolderKanban, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'API Keys', value: '—', icon: Key, color: 'text-green-400', bg: 'bg-green-500/10' },
  { label: '总请求量', value: '—', icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: '成功率', value: '—', icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const orgId = (session?.user as any)?.organizationId

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', orgId],
    queryFn: () => fetchDashboardData(orgId!),
    enabled: !!orgId,
  })

  const statsData = data ? [
    { ...stats[0], value: data.projects.length },
    { ...stats[1], value: data.keys.length },
    { ...stats[2], value: data.totalLogs.toLocaleString() },
    { ...stats[3], value: '99.2%' },
  ] : stats

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-1">控制台</h1>
        <p className="text-white/40">欢迎回来，{session?.user?.name || session?.user?.email} 👋</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-white/40">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold">请求趋势</h2>
            <p className="text-sm text-white/40">最近 7 天</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <TrendingUp className="w-4 h-4" />
            +18.3%
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorRequests)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Link href="/dashboard/projects" className="glass-card-hover p-6 group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">管理项目</h3>
              <p className="text-sm text-white/40">创建和配置你的 API 项目</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
        <Link href="/dashboard/keys" className="glass-card-hover p-6 group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">API Keys</h3>
              <p className="text-sm text-white/40">生成和管理 API 访问密钥</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </motion.div>

      {/* Recent projects */}
      {data?.projects && data.projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">最近项目</h2>
            <Link href="/dashboard/projects" className="text-sm text-primary-400 hover:text-primary-300">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {data.projects.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-white/30">{p._count.apiRoutes} 路由 · {p._count.apiKeys} Keys</p>
                  </div>
                </div>
                <span className="text-xs text-white/30">{new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
