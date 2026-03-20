'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Zap, Shield, BarChart3, Globe, Key, Rocket, 
  ArrowRight, Check, Terminal, Code2, Layers3
} from 'lucide-react'

const features = [
  {
    icon: <Rocket className="w-5 h-5" />,
    title: '极速网关引擎',
    desc: '基于 Node.js 的高性能反向代理，支持动态路由热更新，单实例可达 10k+ QPS',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: '智能限流',
    desc: 'Redis 滑动窗口算法，支持按 API Key、路由、会员等级多维度限流，防止滥用',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: '实时分析',
    desc: '毫秒级延迟监控，WebSocket 实时推送，支持每日/每周/每月使用量统计',
  },
  {
    icon: <Key className="w-5 h-5" />,
    title: 'API Key 管理',
    desc: '一键生成 UUID 格式密钥，支持按项目/路由精细化授权，即开即用',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: '全协议支持',
    desc: 'RESTful 完全支持，WebSocket 实时通信，gRPC 代理预留接口',
  },
  {
    icon: <Layers3 className="w-5 h-5" />,
    title: '插件体系',
    desc: 'Header 改写、CORS 智能处理、熔断降级、请求日志，开箱即用',
  },
]

const tiers = [
  {
    name: 'Free',
    price: '¥0',
    period: '/月',
    desc: '适合个人开发者和学习',
    features: ['1 QPS', '10,000 次/月', '3 个 API Key', '基础统计', '社区支持'],
    cta: '开始使用',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '¥99',
    period: '/月',
    desc: '适合成长中的 SaaS 产品',
    features: ['10 QPS', '100,000 次/月', '无限 API Key', '实时日志', '优先支持', '支付宝/微信'],
    cta: '升级 Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '¥999',
    period: '/月',
    desc: '适合大规模商业部署',
    features: ['100 QPS', '无限制', '私有化部署', 'SLA 保障', '专属技术支持', '定制功能'],
    cta: '联系我们',
    highlight: false,
  },
]

const codeExample = `// 调用你的 API
curl -X GET "https://api.yours.com/echo" \\
  -H "X-API-Key: ${`your-api-key-here`}"

// 响应示例
{
  "success": true,
  "data": {
    "path": "/echo",
    "method": "GET",
    "timestamp": "2026-03-21T01:57:00Z"
  }
}`

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-0 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-lg">APIHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
              登录
            </Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">
              立即开始
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 glass-card px-4 py-1.5 text-sm text-white/60 mb-8">
            <Terminal className="w-3.5 h-3.5 text-primary-400" />
            <span>3 分钟接入，永久免费额度</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent animate-gradient">
              API 管理
            </span>
            <br />
            <span className="text-white">从未如此简单</span>
          </h1>
          
          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            专业的 API 网关平台，支持动态路由、智能限流、实时监控，
            一行代码接入，让你的后端服务即刻拥有企业级 API 管理能力。
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="btn-primary flex items-center gap-2 text-lg px-8 py-3">
              免费开始 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-ghost flex items-center gap-2">
              <Code2 className="w-4 h-4" /> 查看文档
            </Link>
          </div>
        </motion.div>

        {/* Code preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-2xl mx-auto mt-16"
        >
          <div className="glass-card p-6 text-left">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-white/30">终端</span>
            </div>
            <pre className="text-sm text-white/70 font-mono overflow-x-auto">
              <code>{codeExample}</code>
            </pre>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">为什么选择 APIHub？</h2>
            <p className="text-white/50 text-lg">开箱即用，无需运维，按需扩展</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding" id="pricing">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">简单透明的定价</h2>
            <p className="text-white/50 text-lg">按需选择，无需绑定，随时升级或降级</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-8 relative ${
                  tier.highlight ? 'ring-1 ring-primary-500/50' : ''
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    推荐
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{tier.price}</span>
                    <span className="text-white/40">{tier.period}</span>
                  </div>
                  <p className="text-sm text-white/40 mt-1">{tier.desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={tier.highlight ? 'btn-primary w-full' : 'btn-ghost w-full'}>
                  {tier.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass-card p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
            <p className="text-white/50 mb-8">免费注册，即刻拥有你的第一个 API Gateway</p>
            <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-3">
              立即免费注册 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-white/30">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary-500" />
            <span>APIHub</span>
          </div>
          <span>© 2026 APIHub. Build in China.</span>
        </div>
      </footer>
    </div>
  )
}
