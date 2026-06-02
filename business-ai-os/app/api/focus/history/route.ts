import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { ActionStatus, FocusAction } from '@/app/api/focus/route'
import { computeSkipPatterns } from '@/lib/focus-patterns'

export interface HistoryEntry {
  id: string
  date: string          // YYYY-MM-DD
  dateLabel: string     // "Lundi 12 mai"
  actions: FocusAction[]
  statuses: ActionStatus[]
  doneCount: number
  totalCount: number
  completionPct: number
  score: number         // 0-100
}

const FALLBACK_ACTIONS: FocusAction[] = []

function parseActions(raw: string): FocusAction[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : FALLBACK_ACTIONS
  } catch { return FALLBACK_ACTIONS }
}

function parseStatuses(raw: string, count: number): ActionStatus[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const result = parsed as ActionStatus[]
      while (result.length < count) result.push('pending')
      return result
    }
  } catch { /* ignore */ }
  return Array(count).fill('pending')
}

function formatDateFR(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function computeScore(doneCount: number, totalCount: number, skippedCount: number): number {
  if (totalCount === 0) return 0
  // 70 pts from completion, 20 pts bonus for 100%, -5 pts per skip
  const completionScore = Math.round((doneCount / totalCount) * 70)
  const perfectBonus = doneCount === totalCount ? 20 : 0
  const skipPenalty = Math.min(skippedCount * 5, 20)
  return Math.max(0, Math.min(100, completionScore + perfectBonus - skipPenalty))
}

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const days = Math.min(parseInt(searchParams.get('days') ?? '7', 10), 30)

    const since = new Date()
    since.setUTCHours(0, 0, 0, 0)
    since.setUTCDate(since.getUTCDate() - (days - 1))

    const records = await prisma.dailyFocus.findMany({
      where: { userId: session.userId, date: { gte: since } },
      orderBy: { date: 'desc' },
    })

    const history: HistoryEntry[] = records.map(r => {
      const actions = parseActions(r.actions)
      const statuses = parseStatuses(r.statuses, actions.length)
      const doneCount = statuses.filter(s => s === 'done').length
      const skippedCount = statuses.filter(s => s === 'skipped').length
      const totalCount = actions.length
      const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
      const score = computeScore(doneCount, totalCount, skippedCount)
      const dateObj = new Date(r.date)

      return {
        id: r.id,
        date: dateObj.toISOString().slice(0, 10),
        dateLabel: formatDateFR(dateObj),
        actions,
        statuses,
        doneCount,
        totalCount,
        completionPct,
        score,
      }
    })

    // Compute skip patterns from last 30 days (for pattern learning)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0)
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29)

    const allRecords = await prisma.dailyFocus.findMany({
      where: { userId: session.userId, date: { gte: thirtyDaysAgo } },
      select: { actions: true, statuses: true },
    })

    const skipPatterns = computeSkipPatterns(allRecords)

    return NextResponse.json({ history, skipPatterns })
  } catch (error) {
    console.error('[focus/history GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
