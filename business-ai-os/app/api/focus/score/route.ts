import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export interface DailyScore {
  total: number           // 0–100
  completionPoints: number // 0–70 (actions done)
  perfectBonus: number    // 0–20 (all done)
  revenueBonus: number    // 0–10 (revenue logged today)
  label: string           // 'Excellent' | 'Bon' | 'Moyen' | 'Faible'
  color: string           // CSS color class
  doneCount: number
  totalCount: number
  todayRevenue: number
}

function todayUTC() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function tomorrowUTC() {
  const d = todayUTC()
  d.setUTCDate(d.getUTCDate() + 1)
  return d
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const today = todayUTC()
    const tomorrow = tomorrowUTC()

    // ── Fetch today's focus ──────────────────────────────────────────────────
    const focus = await prisma.dailyFocus.findUnique({
      where: { userId_date: { userId: session.userId, date: today } },
      select: { actions: true, statuses: true },
    })

    let doneCount = 0
    let totalCount = 0
    if (focus) {
      try {
        const actions = JSON.parse(focus.actions)
        const statuses = JSON.parse(focus.statuses) as string[]
        totalCount = Array.isArray(actions) ? actions.length : 0
        doneCount = statuses.filter(s => s === 'done').length
      } catch { /* ignore */ }
    }

    // ── Fetch today's revenue ────────────────────────────────────────────────
    const revenueAgg = await prisma.transaction.aggregate({
      where: {
        userId: session.userId,
        type: 'INCOME',
        date: { gte: today, lt: tomorrow },
      },
      _sum: { amount: true },
    })
    const todayRevenue = revenueAgg._sum.amount ?? 0

    // ── Score calculation ────────────────────────────────────────────────────
    // 70 pts: completion ratio
    const completionPoints = totalCount > 0
      ? Math.round((doneCount / totalCount) * 70)
      : 0
    // 20 pts: all actions done bonus
    const perfectBonus = (totalCount > 0 && doneCount === totalCount) ? 20 : 0
    // 10 pts: logged revenue today
    const revenueBonus = todayRevenue > 0 ? 10 : 0

    const total = Math.min(100, completionPoints + perfectBonus + revenueBonus)

    // ── Label & color ────────────────────────────────────────────────────────
    let label: string
    let color: string
    if (total >= 90) { label = 'Excellent 🏆'; color = 'text-green-400' }
    else if (total >= 70) { label = 'Très bien 🎯'; color = 'text-indigo-400' }
    else if (total >= 40) { label = 'Bien 👍'; color = 'text-yellow-400' }
    else if (total > 0) { label = 'En cours ⚡'; color = 'text-orange-400' }
    else { label = 'Non démarré'; color = 'text-gray-500' }

    const score: DailyScore = {
      total,
      completionPoints,
      perfectBonus,
      revenueBonus,
      label,
      color,
      doneCount,
      totalCount,
      todayRevenue,
    }

    return NextResponse.json(score)
  } catch (error) {
    console.error('[focus/score GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
