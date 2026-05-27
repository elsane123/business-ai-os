import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { execSync } from 'child_process'
import path from 'path'

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi(req)
  if (guard) return guard

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalUsers, proUsers, newThisWeek, activeThirtyDays, aiUsageMonth, storageStats] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: 'PRO' } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } }),
      prisma.aIUsage.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { totalTokens: true, estimatedCostUsd: true },
        _count: true,
      }),
      prisma.knowledgeDocument.aggregate({
        _sum: { size: true },
        _count: true,
      }),
    ])

  // Disk usage from wiki-data/
  let wikiDiskBytes = 0
  try {
    const wikiPath = path.join(process.cwd(), 'wiki-data')
    const result = execSync(`du -sb "${wikiPath}" 2>/dev/null || echo 0`)
      .toString()
      .trim()
    wikiDiskBytes = parseInt(result.split('\t')[0] ?? '0', 10)
  } catch {
    wikiDiskBytes = 0
  }

  // Growth: users per day last 7 days
  const growthRaw = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
    FROM users
    WHERE "createdAt" >= ${sevenDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `

  return NextResponse.json({
    users: {
      total: totalUsers,
      pro: proUsers,
      free: totalUsers - proUsers,
      newThisWeek,
      activeThirtyDays,
    },
    aiUsage: {
      requestsThisMonth: aiUsageMonth._count,
      tokensThisMonth: aiUsageMonth._sum.totalTokens ?? 0,
      costThisMonthUsd: aiUsageMonth._sum.estimatedCostUsd ?? 0,
    },
    storage: {
      documentsCount: storageStats._count,
      documentsSizeBytes: storageStats._sum.size ?? 0,
      wikiDiskBytes,
    },
    growth: growthRaw.map((r) => ({ date: r.date, count: Number(r.count) })),
  })
}
