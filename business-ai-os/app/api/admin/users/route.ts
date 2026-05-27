import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi(req)
  if (guard) return guard

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const plan = searchParams.get('plan') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = 20

  const where = {
    ...(search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
        { businessName: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(plan ? { plan } : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
        stripeCustomerId: true,
        _count: {
          select: {
            transactions: true,
            prospects: true,
            tasks: true,
            knowledgeDocs: true,
            aiUsages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  // Per-user AI token totals
  const userIds = users.map((u) => u.id)
  const tokenSums = await prisma.aIUsage.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _sum: { totalTokens: true, estimatedCostUsd: true },
  })
  const tokenMap = Object.fromEntries(
    tokenSums.map((t) => [t.userId, { tokens: t._sum.totalTokens ?? 0, costUsd: t._sum.estimatedCostUsd ?? 0 }])
  )

  // Per-user storage
  const storageSums = await prisma.knowledgeDocument.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _sum: { size: true },
    _count: true,
  })
  const storageMap = Object.fromEntries(
    storageSums.map((s) => [s.userId, { bytes: s._sum.size ?? 0, count: s._count }])
  )

  const enriched = users.map((u) => ({
    ...u,
    aiTokens: tokenMap[u.id]?.tokens ?? 0,
    aiCostUsd: tokenMap[u.id]?.costUsd ?? 0,
    storageBytes: storageMap[u.id]?.bytes ?? 0,
    storageDocCount: storageMap[u.id]?.count ?? 0,
  }))

  return NextResponse.json({
    users: enriched,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
