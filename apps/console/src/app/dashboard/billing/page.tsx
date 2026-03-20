'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const tiers = [
  {
    name: 'Free',
    price: '¥0',
    tier: 'free',
    features: ['1 QPS', '10,000 次/月', '3 个 API Key', '基础统计', '社区支持'],
    color: 'from-white/5 to-white/5',
    cta: '当前方案',
    current: true,
  },
  {
    name: 'Pro',
    price: '¥99',
    tier: 'pro',
    features: ['10 QPS', '100,000 次/月', '无限 API Key', '实时日志', '优先支持', '支付宝/微信支付'],
    color: 'from-primary-500/20 to-primary-500/5',
    cta: '升级 Pro',
    current: false,
  },
  {
    name: 'Enterprise',
    price: '¥999',
    tier: 'enterprise',
    features: ['100 QPS', '无限制', '私有化部署', 'SLA 保障', '专属技术支持', '定制功能开发'],
    color: 'from-yellow-500/10 to-yellow-500/5',
    cta: '联系销售',
    current: false,
  },
]

export default function BillingPage() {
  const { data: session } = useSession()
  const currentTier = (session?.user as any)?.tier || 'free'

  const handleUpgrade = (tier: string) => {
    if (tier === 'pro') {
      // 调用支付服务
      processAlipay(99, 'Pro 套餐升级')
        .then(() => toast.success('支付成功！'))
        .catch(() => toast.error('支付失败，请稍后重试'))
    } else if (tier === 'enterprise') {
      toast.success('我们的销售团队会尽快与您联系')
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-1">订阅方案</h1>
        <p className="text-white/40">选择适合你的方案，随时升级或降级</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-6 relative bg-gradient-to-br ${tier.color} ${
              currentTier === tier.tier ? 'ring-1 ring-primary-500/50' : ''
            }`}
          >
            {currentTier === tier.tier && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" /> 当前方案
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{tier.price}</span>
                <span className="text-white/40">/月</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {tier.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(tier.tier)}
              disabled={currentTier === tier.tier}
              className={`w-full py-2.5 rounded-xl font-semibold transition-all ${
                currentTier === tier.tier
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : tier.tier === 'pro'
                  ? 'btn-primary'
                  : 'btn-ghost'
              }`}
            >
              {currentTier === tier.tier ? '当前方案' : tier.cta}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Payment info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="font-semibold mb-4">支付方式</h2>
        <div className="grid grid-cols-2 gap-4">
          {['支付宝', '微信支付', '银行卡转账', '企业发票'].map(method => (
            <div key={method} className="flex items-center gap-3 p-4 rounded-xl bg-white/3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <span className="text-sm font-semibold">支</span>
              </div>
              <span className="text-sm">{method}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// 支付网关服务 (预留)
async function processAlipay(amount: number, description: string): Promise<void> {
  // TODO: 接入支付宝当面付 / Alipay API
  // 1. 生成预订单
  // 2. 返回支付二维码
  // 3. 轮询支付状态
  // 4. 成功后升级订阅
  console.log(`[Payment] Processing Alipay: ¥${amount} - ${description}`)
  return new Promise((resolve) => setTimeout(resolve, 1500))
}

async function processWechat(amount: number, description: string): Promise<void> {
  // TODO: 接入微信支付
  console.log(`[Payment] Processing Wechat Pay: ¥${amount} - ${description}`)
  return new Promise((resolve) => setTimeout(resolve, 1500))
}
