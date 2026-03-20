'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  Zap, LayoutDashboard, FolderKanban, Key, Settings, 
  LogOut, ChevronRight, Menu, X, Globe, CreditCard
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: '概览' },
  { href: '/dashboard/projects', icon: FolderKanban, label: '项目' },
  { href: '/dashboard/keys', icon: Key, label: 'API Keys' },
  { href: '/dashboard/usage', icon: Globe, label: '使用量' },
  { href: '/dashboard/billing', icon: CreditCard, label: '订阅' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const tier = (session.user as any)?.tier || 'free'

  return (
    <div className="min-h-screen flex">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 glass-card"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 glass-card border-0 lg:border-r lg:border-white/5
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 border-b border-white/5">
            <Link href="/" className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary-500" />
              <span className="font-bold text-lg">APIHub</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${active 
                      ? 'bg-primary-500/10 text-primary-400' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                </Link>
              )
            })}
          </nav>

          {/* Tier badge */}
          <div className="p-4 border-t border-white/5">
            <div className="glass-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40">当前方案</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  tier === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' :
                  tier === 'pro' ? 'bg-primary-500/20 text-primary-400' :
                  'bg-white/10 text-white/60'
                }`}>
                  {tier.toUpperCase()}
                </span>
              </div>
              <Link href="/dashboard/billing" className="text-xs text-primary-400 hover:text-primary-300">
                升级方案 →
              </Link>
            </div>
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-semibold">
                {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user?.name || session.user?.email}</p>
                <p className="text-xs text-white/30 truncate">{session.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full mt-2 flex items-center gap-2 px-4 py-2 text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </aside>
      </AnimatePresence>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6 lg:p-10 pt-20 lg:pt-10">
        {children}
      </main>
    </div>
  )
}
