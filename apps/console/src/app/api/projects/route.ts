import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })
  
  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: { _count: { select: { apiRoutes: true, apiKeys: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ success: true, data: projects })
}

export async function POST(req: NextRequest) {
  try {
    const { name, organizationId } = await req.json()
    if (!name || !organizationId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const project = await prisma.project.create({ data: { name, organizationId } })
    return NextResponse.json({ success: true, data: project })
  } catch {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
