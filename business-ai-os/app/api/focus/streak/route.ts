import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export type DayStatus = 'done' | 'partial' | 'empty' | 'future'

export interface StreakDay {
  date: string        // ISO YYYY-MM-DD
  status: DayStatus
  doneCount: number
  totalCount: number
}

export interface StreakData {
  currentStreak: number   // jours consécutifs avec ≥1 'done'
  longestStreak: number   // record historique
  totalDays: number       // total jours avec focus généré
  completionRate: number  // % actions 'done' sur 30 jours
  last14Days: StreakDay[] // 14 derniers jours pour heatmap
}

function toLocalDateStr(d: Date): string {
  // Returns YYYY-MM-DD in UTC
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setUTCDate(r.getUTCDate() + n)
  return r
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Fetch all focuses for this user, ordered by date desc
    const focuses = await prisma.dailyFocus.findMany({
      where: { userId: session.userId },
      orderBy: { date: 'asc' },
      select: { date: true, statuses: true, actions: true },
    })

    // Build a map date-string → { doneCount, totalCount }
    const focusMap = new Map<string, { doneCount: number; totalCount: number }>()
    for (const f of focuses) {
      const dateStr = toLocalDateStr(f.date)
      let statuses: string[] = []
      let actions: unknown[] = []
      try { statuses = JSON.parse(f.statuses) } catch { /* ignore */ }
      try { actions = JSON.parse(f.actions) } catch { /* ignore */ }
      const total = Math.max(statuses.length, actions.length)
      const done = statuses.filter((s: string) => s === 'done').length
      focusMap.set(dateStr, { doneCount: done, totalCount: total })
    }

    // ── Current streak (from today backwards) ────────────────────────────────
    const todayUTC = new Date()
    todayUTC.setUTCHours(0, 0, 0, 0)

    let currentStreak = 0
    let cursor = new Date(todayUTC)
    // Allow today to count even if not yet completed (don't break streak today)
    // Start checking from yesterday if today has no 'done' yet
    const todayStr = toLocalDateStr(todayUTC)
    const todayData = focusMap.get(todayStr)
    const todayHasDone = todayData && todayData.doneCount > 0

    if (todayHasDone) {
      currentStreak = 1
      cursor = addDays(cursor, -1)
    } else {
      cursor = addDays(cursor, -1)
    }
    // Walk backwards counting consecutive days with ≥1 done
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const s = toLocalDateStr(cursor)
      const d = focusMap.get(s)
      if (!d || d.doneCount === 0) break
      currentStreak++
      cursor = addDays(cursor, -1)
      if (currentStreak > 365) break // safety
    }

    // ── Longest streak ───────────────────────────────────────────────────────
    let longestStreak = 0
    let tempStreak = 0
    const sortedDates = Array.from(focusMap.keys()).sort()
    for (let i = 0; i < sortedDates.length; i++) {
      const d = focusMap.get(sortedDates[i])!
      if (d.doneCount > 0) {
        // Check if consecutive with previous
        if (i > 0) {
          const prev = new Date(sortedDates[i - 1])
          const curr = new Date(sortedDates[i])
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
          if (diffDays === 1) {
            tempStreak++
          } else {
            tempStreak = 1
          }
        } else {
          tempStreak = 1
        }
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak)

    // ── Completion rate (last 30 days) ───────────────────────────────────────
    const thirtyDaysAgo = addDays(todayUTC, -29)
    let totalActions30 = 0
    let doneActions30 = 0
    for (const [dateStr, data] of focusMap.entries()) {
      const d = new Date(dateStr)
      if (d >= thirtyDaysAgo && d <= todayUTC) {
        totalActions30 += data.totalCount
        doneActions30 += data.doneCount
      }
    }
    const completionRate = totalActions30 > 0
      ? Math.round((doneActions30 / totalActions30) * 100)
      : 0

    // ── Last 14 days for heatmap ─────────────────────────────────────────────
    const last14Days: StreakDay[] = []
    for (let i = 13; i >= 0; i--) {
      const day = addDays(todayUTC, -i)
      const dateStr = toLocalDateStr(day)
      const data = focusMap.get(dateStr)
      const isFuture = day > todayUTC
      let status: DayStatus
      if (isFuture) {
        status = 'future'
      } else if (!data || data.totalCount === 0) {
        status = 'empty'
      } else if (data.doneCount === data.totalCount) {
        status = 'done'
      } else if (data.doneCount > 0) {
        status = 'partial'
      } else {
        status = 'empty'
      }
      last14Days.push({
        date: dateStr,
        status,
        doneCount: data?.doneCount ?? 0,
        totalCount: data?.totalCount ?? 0,
      })
    }

    const streakData: StreakData = {
      currentStreak,
      longestStreak,
      totalDays: focusMap.size,
      completionRate,
      last14Days,
    }

    return NextResponse.json(streakData)
  } catch (error) {
    console.error('[focus/streak GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
