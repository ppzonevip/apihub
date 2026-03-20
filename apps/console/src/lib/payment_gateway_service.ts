/**
 * 支付网关服务 (Payment Gateway Service)
 * 
 * 此文件预留支付接口，实际接入时请替换为真实的支付宝/微信支付 SDK
 */

export interface PaymentResult {
  success: boolean
  orderId?: string
  qrCode?: string // 支付宝/微信支付二维码 URL
  message?: string
}

export interface AlipayOptions {
  amount: number       // 金额（人民币，元）
  subject: string      // 订单标题
  outTradeNo?: string  // 商户订单号，不传则自动生成
  notifyUrl?: string   // 异步通知回调地址
}

export interface WechatPayOptions {
  amount: number       // 金额（人民币，分）
  subject: string      // 商品描述
  outTradeNo?: string  // 商户订单号
  notifyUrl?: string   // 回调地址
  // 微信支付金额单位是分，所以会自动乘以 100
}

/**
 * 支付宝当面付 / 手机网站支付
 * 
 * 接入步骤:
 * 1. 在支付宝开放平台创建应用: https://open.alipay.com
 * 2. 签约当面付产品
 * 3. 安装 alipay-sdk: npm install alipay-sdk
 * 
 * 示例代码:
 * ```typescript
 * import Alipay from 'alipay-sdk'
 * 
 * const alipay = new Alipay({
 *   appId: process.env.ALIPAY_APP_ID,
 *   privateKey: process.env.ALIPAY_PRIVATE_KEY,
 *   gateway: 'https://openapi.alipaydev.com/gateway.do', // 测试环境
 * })
 * 
 * const result = await alipay.exec('alipay.trade.precreate', {
 *   subject: options.subject,
 *   totalAmount: options.amount,
 *   outTradeNo: options.outTradeNo,
 * })
 * ```
 */
export async function processAlipay(options: AlipayOptions): Promise<PaymentResult> {
  // TODO: 接入真实支付宝 SDK
  console.log(`[Payment] Alipay: ¥${options.amount} - ${options.subject}`)
  
  // 模拟返回
  return {
    success: true,
    orderId: `AL${Date.now()}`,
    qrCode: `https://qr.alipay.com/demo/${Date.now()}`,
    message: '支付链接已生成',
  }
}

/**
 * 微信支付 (Native / JSAPI)
 * 
 * 接入步骤:
 * 1. 在微信支付商户平台申请: https://pay.weixin.qq.com
 * 2. 安装 wechatpay-node-sdk: npm install wechatpay-node-sdk
 * 
 * 示例代码:
 * ```typescript
 * import { WechatPay, WechatPayV3Type } from 'wechatpay-node-sdk'
 * 
 * const wxPay = new WechatPay({
 *   mchid: process.env.WX_MCHID,
 *   serial: process.env.WX_SERIAL_NO,
 *   privateKey: process.env.WX_PRIVATE_KEY,
 *   certs: {}, // 从微信平台获取
 * })
 * 
 * const result = await wxPay.v3.pay.transactions.native({
 *   amount: { total: options.amount * 100 },
 *   description: options.subject,
 *   out_trade_no: options.outTradeNo,
 * })
 * ```
 */
export async function processWechat(options: WechatPayOptions): Promise<PaymentResult> {
  // TODO: 接入真实微信支付 SDK
  console.log(`[Payment] Wechat Pay: ¥${options.amount / 100} - ${options.subject}`)
  
  // 模拟返回
  return {
    success: true,
    orderId: `WX${Date.now()}`,
    qrCode: `weixin://wxpay/bizpayurl?pr=demo${Date.now()}`,
    message: '微信支付二维码已生成',
  }
}

/**
 * 查询订单状态
 */
export async function queryOrder(orderId: string, channel: 'alipay' | 'wechat'): Promise<{
  paid: boolean
  status: string
}> {
  // TODO: 接入真实查询接口
  return { paid: false, status: 'pending' }
}

/**
 * 退款接口
 */
export async function refund(orderId: string, amount: number, reason: string): Promise<PaymentResult> {
  // TODO: 接入退款接口
  console.log(`[Payment] Refund: ${orderId} - ¥${amount} - ${reason}`)
  return { success: true, message: '退款申请已提交' }
}
