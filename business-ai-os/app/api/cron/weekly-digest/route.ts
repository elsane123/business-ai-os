/**
 * Cron: Digest hebdomadaire tous les lundis à 8h UTC
 * Protected by x-cron-secret header
 * Schedule: 0 8 * * 1 curl -X POST -H 'x-cron-secret: ...' http://localhost:50082/api/cron/weekly-digest
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWeeklyDigestEmail } from '@/lib/resend'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const ghost14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const weekLabel = weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
    ' – ' + now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const results = { sent: 0, errors: 0, users: [] as string[] }

  try {
    const proUsers = await prisma.user.findMany({
      where: { plan: 'PRO' },
      select: { id: true, email: true, name: true, businessName: true, monthlyGoal: true },
    })

    for (const user of proUsers) {
      try {
        // CA current month (INCOME only)
        const caAgg = await prisma.transaction.aggregate({
          where: { userId: user.id, type: 'INCOME', date: { gte: monthStart } },
          _sum: { amount: true },
        })
        const caThisMonth = Math.round((caAgg._sum.amount ?? 0) * 100) / 100
        const monthlyGoal = user.monthlyGoal ?? 0
        const goalProgress = monthlyGoal > 0
          ? Math.min(Math.round((caThisMonth / monthlyGoal) * 100), 100)
          : 0

        // Pipeline — active prospects
        const prospects = await prisma.prospect.findMany({
          where: { userId: user.id, status: { notIn: ['WON', 'LOST'] } },
          select: { value: true, lastContactDate: true },
        })
        const pipelineValue = Math.round(prospects.reduce((s, p) => s + p.value, 0))
        const activeProspects = prospects.length
        const ghostProspects = prospects.filter(p =>
          !p.lastContactDate || p.lastContactDate < ghost14
        ).length

        // Tasks — completed last 7 days and open total
        const [tasksCompletedLastWeek, tasksOpenTotal] = await Promise.all([
          prisma.task.count({
            where: { userId: user.id, completedAt: { not: null }, updatedAt: { gte: weekStart } },
          }),
          prisma.task.count({
            where: { userId: user.id, completedAt: null },
          }),
        ])

        await sendWeeklyDigestEmail(user.email, user.name, {
          businessName: user.businessName,
          caThisMonth,
          monthlyGoal,
          goalProgress,
          pipelineValue,
          activeProspects,
          ghostProspects,
          tasksCompletedLastWeek,
          tasksOpenTotal,
          weekLabel,
        })

        results.sent++
        results.users.push(user.email)
      } catch (err) {
        console.error(`[weekly-digest] Error for ${user.email}:`, err)
        results.errors++
      }
    }

    return NextResponse.json({ success: true, week: weekLabel, ...results })
  } catch (error) {
    console.error('[cron/weekly-digest]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
