import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码必填' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 })
    }

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user + org + subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: name || email.split('@')[0], passwordHash },
      })

      const org = await tx.organization.create({
        data: { name: `${user.name || user.email} 的组织`, ownerId: user.id },
      })

      await tx.subscription.create({
        data: { organizationId: org.id, tier: 'free' },
      })

      return { userId: user.id, organizationId: org.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: '注册成功',
      data: { userId: result.userId, organizationId: result.organizationId }
    })
  } catch (err) {
    console.error('[Register Error]', err)
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 })
  }
}
