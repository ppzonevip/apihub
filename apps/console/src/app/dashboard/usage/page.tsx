'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Activity, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const chartData = [
  { date: '03-15', requests: 1200, latency: 45 },
  { date: '03-16', requests: 1900, latency: 38 },
  { date: '03-17', requests: 1500, latency: 52 },
  { date: '03-18', requests: 2300, latency: 41 },
  { date: '03-19', requests: 2800, latency: 35 },
  { date: '03-20', requests: 3200, latency: 33 },
  { date: '03-21', requests: 2900, latency: 37 },
]

const topEndpoints = [
  { path: '/echo', method: 'GET', requests: 4521, p99: 48 },
  { path: '/users', method: 'POST', requests: 2103, p99: 92 },
  { path: '/auth/login', method: 'POST', requests: 1893, p99: 124 },
  { path: '/data', method: 'GET', requests: 1204, p99: 67 },
  { path: '/webhook', method: 'POST', requests: 892, p99: 203 },
]

const methodColors: Record<string, string> = {
  GET: 'text-green-400 bg-green-500/10',
  POST: 'text-blue-400 bg-blue-500/10',
  PUT: 'text-yellow-400 bg-yellow-500/10',
  DELETE: 'text-red-400 bg-red-500/10',
  PATCH: 'text-purple-400 bg-purple-500/10',
}

export default function UsagePage() {
  const { data: session } = useSession()
  const tier = (session?.user as any)?.tier || 'free'

  return (
    <div className="space-y-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-1">使用量统计</h1>
        <p className="text-white/40">实时监控 API 调用情况</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总请求量', value: '17,820', sub: '本月', icon: Activity, color: 'text-primary-400', bg: 'bg-primary-500/10' },
          { label: '成功率', value: '99.2%', sub: '过去 7 天', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: '平均延迟', value: '41ms', sub: 'P50', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'P99 延迟', value: '203ms', sub: '过去 7 天', icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5"
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-white/40">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Request chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold">请求量趋势</h2>
            <p className="text-sm text-white/40">最近 7 天</p>
          </div>
          <div className="text-sm text-green-400">↑ 18.3% vs 上周</div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} fill="url(#reqGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top endpoints */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="font-semibold mb-4">热门端点</h2>
        <div className="space-y-2">
          {topEndpoints.map((ep, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/20 w-4">{i + 1}</span>
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${methodColors[ep.method] || 'bg-white/10 text-white/60'}`}>
                  {ep.method}
                </span>
                <span className="text-sm font-mono">{ep.path}</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-white/40">
                <span>{ep.requests.toLocaleString()} 请求</span>
                <span className="text-yellow-400/60">P99 {ep.p99}ms</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
