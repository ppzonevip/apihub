import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const current = await prisma.apiKey.findUnique({ where: { id: params.id } })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = await prisma.apiKey.update({
      where: { id: params.id },
      data: { isActive: !current.isActive },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.apiKey.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
