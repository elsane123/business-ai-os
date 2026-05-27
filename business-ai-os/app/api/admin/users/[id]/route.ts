import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { execSync } from 'child_process'
import path from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi(req)
  if (guard) return guard

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      businessName: true,
      sector: true,
      plan: true,
      isAdmin: true,
      isSuspended: true,
      lastActiveAt: true,
      createdAt: true,
      updatedAt: true,
      stripeCustomerId: true,
      linkedinUrl: true,
      legalName: true,
      city: true,
      country: true,
      activityType: true,
      _count: {
        select: {
          transactions: true,
          prospects: true,
          tasks: true,
          invoices: true,
          quotes: true,
          posts: true,
          knowledgeDocs: true,
          aiUsages: true,
          chatMessages: true,
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // AI usage breakdown by feature
  const aiByFeature = await prisma.aIUsage.groupBy({
    by: ['feature'],
    where: { userId: id },
    _sum: { totalTokens: true, estimatedCostUsd: true },
    _count: true,
  })

  // AI usage over last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const aiRecentTotal = await prisma.aIUsage.aggregate({
    where: { userId: id, createdAt: { gte: thirtyDaysAgo } },
    _sum: { totalTokens: true, estimatedCostUsd: true },
  })

  // Storage from DB
  const storageStat = await prisma.knowledgeDocument.aggregate({
    where: { userId: id },
    _sum: { size: true },
    _count: true,
  })

  // Disk usage from wiki-data
  let wikiDiskBytes = 0
  try {
    const wikiPath = path.join(process.cwd(), 'wiki-data', id)
    const result = execSync(`du -sb "${wikiPath}" 2>/dev/null || echo 0`)
      .toString().trim()
    wikiDiskBytes = parseInt(result.split('\t')[0] ?? '0', 10)
  } catch { wikiDiskBytes = 0 }

  return NextResponse.json({
    user,
    aiUsage: {
      byFeature: aiByFeature,
      last30Days: {
        tokens: aiRecentTotal._sum.totalTokens ?? 0,
        costUsd: aiRecentTotal._sum.estimatedCostUsd ?? 0,
      },
    },
    storage: {
      documentsBytes: storageStat._sum.size ?? 0,
      documentsCount: storageStat._count,
      wikiDiskBytes,
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi(req)
  if (guard) return guard

  const { id } = await params
  const body = await req.json()

  const allowed = ['plan', 'isSuspended', 'isAdmin']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, plan: true, isAdmin: true, isSuspended: true },
  })

  return NextResponse.json({ user: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi(req)
  if (guard) return guard

  const { id } = await params

  // Prevent self-deletion
  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Delete wiki-data folder
  try {
    const wikiPath = path.join(process.cwd(), 'wiki-data', id)
    execSync(`rm -rf "${wikiPath}"`)
  } catch { /* ignore */ }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
