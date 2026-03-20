'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, FolderKanban, Globe, Key, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fetchProjects(orgId: string) {
  const res = await fetch(`/api/projects?orgId=${orgId}`)
  return res.json()
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const orgId = (session?.user as any)?.organizationId
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['projects', orgId],
    queryFn: () => fetchProjects(orgId!),
    enabled: !!orgId,
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organizationId: orgId }),
      })
      if (!res.ok) throw new Error('创建失败')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] })
      setShowCreate(false)
      setNewName('')
      toast.success('项目创建成功')
    },
    onError: () => toast.error('创建失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] })
      toast.success('项目已删除')
    },
  })

  const projects = data?.data || []

  return (
    <div className="space-y-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-1">项目</h1>
          <p className="text-white/40">管理你的 API 项目</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </motion.div>

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
            <h2 className="text-lg font-semibold mb-4">新建项目</h2>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="项目名称"
              className="input-dark mb-4"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && newName && createMutation.mutate(newName)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">取消</button>
              <button 
                onClick={() => createMutation.mutate(newName)}
                disabled={!newName || createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Project list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card h-20 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">还没有项目</h3>
          <p className="text-sm text-white/40 mb-4">创建你的第一个 API 项目</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新建项目
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{p._count?.apiRoutes || 0} 路由</span>
                      <span className="flex items-center gap-1"><Key className="w-3 h-3" />{p._count?.apiKeys || 0} Keys</span>
                      <span>{new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteMutation.mutate(p.id)}
                    className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
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
