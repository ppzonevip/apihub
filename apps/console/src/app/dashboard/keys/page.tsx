'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Key, Copy, Trash2, ToggleLeft, ToggleRight, Check, Globe, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

async function fetchKeys(orgId: string) {
  const res = await fetch(`/api/keys?orgId=${orgId}`)
  return res.json()
}

async function createKey(data: { projectId: string; name: string; routeId?: string }) {
  const res = await fetch('/api/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

async function toggleKey(id: string) {
  const res = await fetch(`/api/keys/${id}/toggle`, { method: 'PATCH' })
  return res.json()
}

async function deleteKey(id: string) {
  await fetch(`/api/keys/${id}`, { method: 'DELETE' })
}

export default function KeysPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const orgId = (session?.user as any)?.organizationId
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['keys', orgId],
    queryFn: () => fetchKeys(orgId!),
    enabled: !!orgId,
  })

  const createMutation = useMutation({
    mutationFn: createKey,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['keys', orgId] })
      setShowCreate(false)
      setNewName('')
      if (data.data?.key) {
        setRevealedKey(data.data.key)
        toast.success('API Key 创建成功，请立即复制保存！')
      }
    },
    onError: () => toast.error('创建失败'),
  })

  const toggleMutation = useMutation({
    mutationFn: toggleKey,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['keys', orgId] })
      toast.success(data.data?.isActive ? 'Key 已启用' : 'Key 已禁用')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys', orgId] })
      toast.success('Key 已删除')
    },
  })

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
    toast.success('已复制到剪贴板')
  }

  const keys = data?.data || []

  return (
    <div className="space-y-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-1">API Keys</h1>
          <p className="text-white/40">管理 API 访问密钥</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 生成 Key
        </button>
      </motion.div>

      {/* Revealed key */}
      {revealedKey && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-5 border-primary-500/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-400">新 Key 已生成，请立即复制保存！</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono bg-white/5 px-4 py-2 rounded-lg truncate">
              {revealedKey}
            </code>
            <button onClick={() => copyKey(revealedKey)} className="btn-ghost py-2 px-3">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => setRevealedKey(null)} className="text-sm text-white/40 hover:text-white">
              关闭
            </button>
          </div>
        </motion.div>
      )}

      {/* Create modal */}
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
            className="glass-card p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-lg font-semibold mb-4">生成新 Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Key 名称</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如：生产环境 Key"
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">关联项目 ID</label>
                <input
                  type="text"
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  placeholder="项目 ID"
                  className="input-dark"
                />
                <p className="text-xs text-white/30 mt-1">可以在项目页面找到项目 ID</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">取消</button>
              <button
                onClick={() => createMutation.mutate({ name: newName, projectId: selectedProject })}
                disabled={!newName || !selectedProject || createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? '生成中...' : '生成'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Keys list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="glass-card h-16 animate-pulse" />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Key className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">还没有 API Key</h3>
          <p className="text-sm text-white/40 mb-4">生成一个 Key 来开始使用 APIHub</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> 生成 Key
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k: any, i: number) => (
            <motion.div
              key={k.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    k.isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'
                  }`}>
                    <Key className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{k.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        k.isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'
                      }`}>
                        {k.isActive ? '活跃' : '禁用'}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 font-mono truncate max-w-xs">{k.key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyKey(k.key)}
                    className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="复制"
                  >
                    {copiedKey === k.key ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate(k.id)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    title={k.isActive ? '禁用' : '启用'}
                  >
                    {k.isActive 
                      ? <ToggleRight className="w-5 h-5 text-green-400" />
                      : <ToggleLeft className="w-5 h-5 text-white/30" />
                    }
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(k.id)}
                    className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
