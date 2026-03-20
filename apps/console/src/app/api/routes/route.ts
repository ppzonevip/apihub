import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  
  const routes = await prisma.apiRoute.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ success: true, data: routes })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, path, upstreamUrl, method, rateLimit, monthlyLimit, isActive } = body
    
    if (!projectId || !path || !upstreamUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const route = await prisma.apiRoute.create({
      data: {
        projectId,
        path,
        upstreamUrl,
        method: method || 'GET',
        rateLimit: rateLimit || 1,
        monthlyLimit: monthlyLimit || 10000,
        isActive: isActive !== false,
      },
    })
    return NextResponse.json({ success: true, data: route })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 })
  }
}
