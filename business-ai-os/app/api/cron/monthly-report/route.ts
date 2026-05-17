/**
 * QW-2 — Cron: Rapport mensuel auto le 1er de chaque mois à 9h UTC
 * Protected by x-cron-secret header
 * Schedule: 0 9 1 * * curl -X POST -H 'x-cron-secret: ...' http://localhost:50082/api/cron/monthly-report
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendMonthlyReportEmail } from '@/lib/resend'

const CRON_SECRET = process.env.CRON_SECRET

interface Transaction { type: string; amount: number; category: string }
interface Prospect { status: string; value: number; updatedAt: Date }
interface Task { completed: boolean; priority: string; createdAt: Date }

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Previous month
  const now = new Date()
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
  const monthLabel = startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const results = { sent: 0, errors: 0, users: [] as string[] }

  try {
    const proUsers = await prisma.user.findMany({
      where: { plan: 'PRO' },
      select: { id: true, email: true, name: true, businessName: true, monthlyGoal: true },
    })

    for (const user of proUsers) {
      try {
        const transactions: Transaction[] = await prisma.transaction.findMany({
          where: { userId: user.id, date: { gte: startDate, lte: endDate } },
          select: { type: true, amount: true, category: true },
        })

        const ca = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
        const charges = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

        const categoryMap: Record<string, number> = {}
        for (const t of transactions.filter(t => t.type === 'EXPENSE')) {
          categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount
        }
        const topExpenses = Object.entries(categoryMap)
          .sort((a, b) => b[1] - a[1]).slice(0, 5)
          .map(([category, amount]) => ({ category, amount }))

        const allProspects: Prospect[] = await prisma.prospect.findMany({
          where: { userId: user.id },
          select: { status: true, value: true, updatedAt: true },
        })
        const wonThisMonth = allProspects.filter(
          p => p.status === 'WON' && p.updatedAt >= startDate && p.updatedAt <= endDate
        )
        const activeProspects = allProspects.filter(p => !['WON', 'LOST'].includes(p.status))
        const conversionRate = allProspects.length > 0
          ? Math.round((allProspects.filter(p => p.status === 'WON').length / allProspects.length) * 100)
          : 0

        // BUG-TS fix: use inferred type from select (not full Task model)
        const tasks = await prisma.task.findMany({
          where: { userId: user.id },
          select: { completedAt: true, priority: true, createdAt: true },
        })
        // BUG-TS fix: Task model uses completedAt (Date|null), not completed (boolean)
        const completedThisMonth = tasks.filter(t => t.completedAt !== null && t.createdAt >= startDate && t.createdAt <= endDate).length
        const totalTasks = tasks.filter(t => t.createdAt >= startDate && t.createdAt <= endDate).length

        const focusDays = await prisma.dailyFocus.count({
          where: { userId: user.id, date: { gte: startDate, lte: endDate } },
        })

        const goalProgress = user.monthlyGoal && user.monthlyGoal > 0
          ? Math.round((ca / user.monthlyGoal) * 100)
          : null

        const report = {
          month: monthLabel,
          period: { start: startDate.toISOString(), end: endDate.toISOString() },
          business: { name: user.businessName ?? user.name, goal: user.monthlyGoal },
          finance: { ca: Math.round(ca), charges: Math.round(charges), net: Math.round(ca - charges), goalProgress, topExpenses, transactionCount: transactions.length },
          pipeline: {
            totalProspects: allProspects.length,
            activeProspects: activeProspects.length,
            wonThisMonth: wonThisMonth.length,
            wonRevenue: Math.round(wonThisMonth.reduce((s, p) => s + p.value, 0)),
            pipelineValue: Math.round(activeProspects.reduce((s, p) => s + p.value, 0)),
            conversionRate,
          },
          tasks: { completed: completedThisMonth, total: totalTasks, completionRate: totalTasks > 0 ? Math.round((completedThisMonth / totalTasks) * 100) : 0 },
          focus: { activeDays: focusDays, daysInMonth: endDate.getDate(), engagementRate: Math.round((focusDays / endDate.getDate()) * 100) },
        }

        await sendMonthlyReportEmail(user.email, user.name.split(' ')[0], report)
        results.sent++
        results.users.push(user.email)
      } catch (err) {
        results.errors++
        console.error(`[cron/monthly-report] Error for ${user.email}:`, err)
      }
    }

    return NextResponse.json({ success: true, month: monthLabel, totalPro: proUsers.length, ...results })
  } catch (err) {
    console.error('[cron/monthly-report] Fatal:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ status: 'ok', cron: 'monthly-report', schedule: '0 9 1 * *' })
}
