/**
 * QW-2 — Rapport Mensuel Auto
 * GET /api/reports/monthly?month=2026-05  → rapport JSON pour l'user connecté
 * POST /api/reports/monthly               → envoyer par email (user connecté)
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get('month') // ex: '2026-05'

  const now = new Date()
  const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : now.getMonth() - 1

  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
  const monthLabel = startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  try {
    // ── 1. Trésorerie ───────────────────────────────────────────────────────
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: startDate, lte: endDate } },
      select: { type: true, amount: true, category: true },
    })

    const ca = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    const charges = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    const net = ca - charges

    // Top categories
    const categoryMap: Record<string, number> = {}
    for (const t of transactions.filter(t => t.type === 'EXPENSE')) {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount
    }
    const topExpenses = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => ({ category: cat, amount }))

    // ── 2. Pipeline ─────────────────────────────────────────────────────────
    const allProspects = await prisma.prospect.findMany({
      where: { userId: session.userId },
      select: { status: true, value: true, updatedAt: true },
    })

    const wonThisMonth = allProspects.filter(
      p => p.status === 'WON' && p.updatedAt >= startDate && p.updatedAt <= endDate
    )
    const activeProspects = allProspects.filter(
      p => !['WON', 'LOST'].includes(p.status)
    )
    const conversionRate = allProspects.length > 0
      ? Math.round((allProspects.filter(p => p.status === 'WON').length / allProspects.length) * 100)
      : 0
    const pipelineValue = activeProspects.reduce((sum, p) => sum + p.value, 0)
    const wonRevenue = wonThisMonth.reduce((sum, p) => sum + p.value, 0)

    // ── 3. Tâches ───────────────────────────────────────────────────────────
    const tasks = await prisma.task.findMany({
      where: { userId: session.userId },
      select: { completed: true, priority: true, createdAt: true },
    })
    const completedThisMonth = tasks.filter(
      t => t.completed && t.createdAt >= startDate && t.createdAt <= endDate
    ).length
    const totalTasks = tasks.filter(
      t => t.createdAt >= startDate && t.createdAt <= endDate
    ).length

    // ── 4. Focus streak ─────────────────────────────────────────────────────
    const focusDays = await prisma.dailyFocus.count({
      where: {
        userId: session.userId,
        date: { gte: startDate, lte: endDate },
      },
    })

    // ── 5. User info ────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, businessName: true, monthlyGoal: true },
    })

    const goalProgress = user?.monthlyGoal && user.monthlyGoal > 0
      ? Math.round((ca / user.monthlyGoal) * 100)
      : null

    return NextResponse.json({
      month: monthLabel,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      business: { name: user?.businessName ?? user?.name, goal: user?.monthlyGoal },
      finance: {
        ca: Math.round(ca),
        charges: Math.round(charges),
        net: Math.round(net),
        goalProgress,
        topExpenses,
        transactionCount: transactions.length,
      },
      pipeline: {
        totalProspects: allProspects.length,
        activeProspects: activeProspects.length,
        wonThisMonth: wonThisMonth.length,
        wonRevenue: Math.round(wonRevenue),
        pipelineValue: Math.round(pipelineValue),
        conversionRate,
      },
      tasks: {
        completed: completedThisMonth,
        total: totalTasks,
        completionRate: totalTasks > 0 ? Math.round((completedThisMonth / totalTasks) * 100) : 0,
      },
      focus: {
        activeDays: focusDays,
        daysInMonth: endDate.getDate(),
        engagementRate: Math.round((focusDays / endDate.getDate()) * 100),
      },
    })
  } catch (err) {
    console.error('[reports/monthly] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: send monthly report email to current user
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Reuse GET logic to get report data
  const reportReq = new NextRequest(new URL(`/api/reports/monthly?month=${new Date().getFullYear()}-${String(new Date().getMonth()).padStart(2, '0')}`, req.url), {
    headers: req.headers,
  })
  const reportResp = await GET(reportReq)
  const report = await reportResp.json()

  if (!reportResp.ok) {
    return NextResponse.json({ error: 'Impossible de générer le rapport' }, { status: 500 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { sendMonthlyReportEmail } = await import('@/lib/resend')
  await sendMonthlyReportEmail(user.email, user.name.split(' ')[0], report)

  return NextResponse.json({ success: true, sentTo: user.email })
}
