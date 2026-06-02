/**
 * QW-1 — Cron: Notification email Daily Focus à 8h UTC
 * Protected by x-cron-secret header
 * Called daily: 0 8 * * * curl -H 'x-cron-secret: ...' http://localhost:50082/api/cron/daily-focus
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBusinessContext } from '@/lib/wiki/reader'
import { sendDailyFocusEmail } from '@/lib/resend'

const PYTHON_API = process.env.PYTHON_AGENT_URL ?? 'http://localhost:8000'
const CRON_SECRET = process.env.CRON_SECRET

interface PythonFocusAction {
  priority: number
  action: string
  context: string
  why: string
  estimated_minutes: number
}

export async function POST(req: NextRequest) {
  // ── Auth: CRON_SECRET ────────────────────────────────────────────────────
  const secret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const results = { sent: 0, skipped: 0, errors: 0, users: [] as string[] }

  try {
    // ── Get all PRO users with email ─────────────────────────────────────
    const proUsers = await prisma.user.findMany({
      where: { plan: 'PRO' },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        sector: true,
        monthlyGoal: true,
      },
    })

    for (const user of proUsers) {
      try {
        // ── Check if focus already sent today ──────────────────────────
        const existingFocus = await prisma.dailyFocus.findFirst({
          where: {
            userId: user.id,
            date: { gte: new Date(todayStr), lt: new Date(new Date(todayStr).getTime() + 86400000) },
          },
          select: { id: true, actions: true },
        })

        let actions: string[]

        if (existingFocus) {
          // Use existing focus actions
          try {
            const parsed = JSON.parse(existingFocus.actions)
            actions = Array.isArray(parsed)
              ? parsed.map((a: { action?: string }) => a.action ?? String(a)).filter(Boolean)
              : []
          } catch {
            actions = []
          }
          results.skipped++
        } else {
          // ── Generate focus via Python API ──────────────────────────
          let wikiContext = ''
          try { wikiContext = getBusinessContext(user.id) } catch { wikiContext = '' }

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 20000)

          let pythonActions: PythonFocusAction[] = []
          try {
            const resp = await fetch(`${PYTHON_API}/focus/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                business_name: user.businessName ?? user.name,
                sector: user.sector ?? '',
                monthly_goal: user.monthlyGoal ?? 0,
                fixed_charges: 0,
                wiki_context: wikiContext,
                high_priority_tasks: [],
                skip_patterns: [],
              }),
              signal: controller.signal,
            })
            clearTimeout(timeout)
            if (resp.ok) {
              const data = await resp.json()
              pythonActions = data.actions ?? []
            }
          } catch {
            clearTimeout(timeout)
          }

          actions = pythonActions.length > 0
            ? pythonActions.map((a) => `${a.action} (${a.estimated_minutes} min)`)
            : [
                'Relancer les 3 prospects en attente depuis +7 jours',
                'Publier un post LinkedIn sur votre expertise',
                'Mettre à jour vos prévisions de trésorerie',
              ]
        }

        if (actions.length === 0) {
          results.skipped++
          continue
        }

        // ── Send email ─────────────────────────────────────────────────
        await sendDailyFocusEmail(user.email, user.name.split(' ')[0], actions)
        results.sent++
        results.users.push(user.email)
      } catch (err) {
        results.errors++
        console.error(`[cron/daily-focus] Error for user ${user.email}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      date: todayStr,
      totalPro: proUsers.length,
      ...results,
    })
  } catch (err) {
    console.error('[cron/daily-focus] Fatal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Allow GET for health check
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ status: 'ok', cron: 'daily-focus', schedule: '0 8 * * *' })
}
