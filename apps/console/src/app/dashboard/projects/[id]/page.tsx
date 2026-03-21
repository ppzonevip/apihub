'use client'

export const dynamicParams = true

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, Plus, Globe, Zap, Trash2, Save, Activity,
  Copy, Check, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface RouteConfig {
  id: string
  path: string
  upstreamUrl: string
  method: string
  rateLimit: number
  monthlyLimit: number
  isActive: boolean
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient()
  const [editingRoute, setEditingRoute] = useState<RouteConfig | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [liveLogs, setLiveLogs] = useState<any[]>([])

  // Fetch routes
  const { data: routesData, isLoading } = useQuery({
    queryKey: ['routes', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/routes?projectId=${params.id}`)
      return res.json()
    },
    refetchInterval: 10000,
  })

  const routes: RouteConfig[] = routesData?.data || []

  // Create route
  const createMutation = useMutation({
    mutationFn: async (data: Partial<RouteConfig>) => {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId: params.id }),
      })
      if (!res.ok) throw new Error('创建失败')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', params.id] })
      setShowCreate(false)
      toast.success('路由创建成功')
    },
    onError: () => toast.error('创建失败'),
  })

  // Delete route
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/routes/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', params.id] })
      toast.success('路由已删除')
    },
  })

  const copyRouteId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回项目列表
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">API 编辑器</h1>
            <p className="text-white/40">项目 ID: {params.id}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 添加路由
          </button>
        </div>
      </motion.div>

      {/* Route list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="glass-card h-24 animate-pulse" />)}
        </div>
      ) : routes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Globe className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">还没有配置路由</h3>
          <p className="text-sm text-white/40 mb-4">添加你的第一个 API 路由</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> 添加路由
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route, i) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded ${
                    route.method === 'GET' ? 'bg-green-500/10 text-green-400' :
                    route.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                    route.method === 'PUT' ? 'bg-yellow-500/10 text-yellow-400' :
                    route.method === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {route.method}
                  </span>
                  <span className="font-mono text-sm">{route.path}</span>
                  <span className={`w-2 h-2 rounded-full ${route.isActive ? 'bg-green-400' : 'bg-white/20'}`} />
                </div>
                <button
                  onClick={() => deleteMutation.mutate(route.id)}
                  className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-white/30 text-xs mb-1">上游地址</p>
                  <p className="font-mono text-white/60 truncate">{route.upstreamUrl}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs mb-1">QPS 限流</p>
                  <p className="flex items-center gap-1 text-white/60">
                    <Zap className="w-3 h-3" /> {route.rateLimit} /秒
                  </p>
                </div>
                <div>
                  <p className="text-white/30 text-xs mb-1">月度限额</p>
                  <p className="text-white/60">{route.monthlyLimit.toLocaleString()} 次/月</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4">
                <button
                  onClick={() => copyRouteId(route.id)}
                  className="text-xs text-white/30 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedId === route.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  Route ID
                </button>
                <span className="text-xs text-white/20 font-mono">ID: {route.id.substring(0, 16)}...</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create route modal */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCreate(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="glass-card p-6 w-full max-w-lg mx-4"
          >
            <h2 className="text-lg font-semibold mb-5">添加 API 路由</h2>
            <form
              onSubmit={e => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                createMutation.mutate({
                  path: fd.get('path') as string,
                  upstreamUrl: fd.get('upstreamUrl') as string,
                  method: fd.get('method') as string,
                  rateLimit: parseInt(fd.get('rateLimit') as string) || 1,
                  monthlyLimit: parseInt(fd.get('monthlyLimit') as string) || 10000,
                })
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-4 gap-3">
                <select name="method" className="input-dark col-span-1" defaultValue="GET">
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input name="path" required placeholder="/api/your-route" className="input-dark col-span-3" />
              </div>
              <input name="upstreamUrl" required placeholder="https://your-upstream.com" className="input-dark" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">QPS 限流</label>
                  <input name="rateLimit" type="number" min="1" max="1000" defaultValue="1" className="input-dark" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">月度请求上限</label>
                  <input name="monthlyLimit" type="number" min="1" defaultValue="10000" className="input-dark" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1">取消</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {createMutation.isPending ? '保存中...' : '保存路由'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Live logs panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-400" />
            <h2 className="font-semibold">实时日志</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-white/20'}`} />
            {wsConnected ? '已连接' : '未连接'}
          </div>
        </div>
        {liveLogs.length === 0 ? (
          <div className="text-center py-8 text-sm text-white/30">
            <p>暂无日志，等待请求...</p>
            <p className="text-xs mt-1">使用你的 API Key 发送请求，日志将实时显示在这里</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {liveLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-mono p-2 rounded bg-white/3">
                <span className={`${
                  log.statusCode < 400 ? 'text-green-400' : 'text-red-400'
                }`}>{log.statusCode}</span>
                <span className="text-white/40">{log.method} {log.path}</span>
                <span className="text-white/20 ml-auto">{log.latencyMs}ms</span>
                <span className="text-white/20">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
