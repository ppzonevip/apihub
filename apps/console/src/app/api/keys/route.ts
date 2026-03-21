import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })
  
  const keys = await prisma.apiKey.findMany({
    where: { project: { organizationId: orgId } },
    select: {
      id: true,
      key: true,
      name: true,
      projectId: true,
      routeId: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ success: true, data: keys })
}

export async function POST(req: NextRequest) {
  try {
    const { name, projectId, routeId } = await req.json()
    if (!name || !projectId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    
    const key = uuidv4()
    const apiKey = await prisma.apiKey.create({
      data: { key, name, projectId, routeId: routeId || null },
      select: {
        id: true,
        key: true,
        name: true,
        projectId: true,
        routeId: true,
        isActive: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ success: true, data: apiKey })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })
  }
}
