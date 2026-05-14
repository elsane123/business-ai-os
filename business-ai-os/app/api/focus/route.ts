import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getBusinessContext } from '@/lib/wiki/reader'
import { appendToLog, appendToWikiPage } from '@/lib/wiki/writer'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActionStatus = 'pending' | 'done' | 'skipped' | 'snoozed'

export interface FocusAction {
  priority: 'high' | 'medium' | 'low'
  action: string
  context: string
  why: string
  estimatedTime: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FALLBACK_ACTIONS: FocusAction[] = [
  {
    priority: 'high',
    action: 'Relancer les 3 prospects en attente depuis +7 jours',
    context: 'Pipeline commercial',
    why: 'Maintenir la dynamique commerciale',
    estimatedTime: '30 min',
  },
  {
    priority: 'medium',
    action: 'Publier un post LinkedIn sur votre expertise',
    context: 'Visibilité professionnelle',
    why: 'Construire votre audience cible',
    estimatedTime: '20 min',
  },
  {
    priority: 'low',
    action: 'Mettre à jour vos prévisions de trésorerie',
    context: 'Finance',
    why: 'Anticiper les besoins de liquidité',
    estimatedTime: '15 min',
  },
]

function mapPythonActions(
  actions: { priority: number; action: string; context: string; why: string; estimated_minutes: number }[]
): FocusAction[] {
  const priorityMap: Record<number, FocusAction['priority']> = { 1: 'high', 2: 'medium', 3: 'low' }
  return actions.map(a => ({
    priority: priorityMap[a.priority] ?? 'medium',
    action: a.action,
    context: a.context,
    why: a.why,
    estimatedTime: `${a.estimated_minutes} min`,
  }))
}

function parseRecord(record: {
  id: string
  userId: string
  date: Date
  actions: string
  statuses: string
  generatedAt: Date
}) {
  let actions: FocusAction[] = FALLBACK_ACTIONS
  let statuses: ActionStatus[] = []
  try {
    const parsed = JSON.parse(record.actions)
    if (Array.isArray(parsed) && parsed.length > 0) actions = parsed as FocusAction[]
  } catch { /* keep fallback */ }
  try {
    const parsed = JSON.parse(record.statuses)
    if (Array.isArray(parsed)) statuses = parsed as ActionStatus[]
  } catch { /* keep empty */ }
  // Pad statuses to match actions length
  while (statuses.length < actions.length) statuses.push('pending')
  return { ...record, actions, statuses }
}

function todayMidnight() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── GET — charger le focus du jour ──────────────────────────────────────────

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const record = await prisma.dailyFocus.findUnique({
      where: { userId_date: { userId: session.userId, date: todayMidnight() } },
    })

    if (!record) return NextResponse.json({ focus: null })
    return NextResponse.json({ focus: parseRecord(record) })
  } catch (error) {
    console.error('[focus GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// ─── POST — générer le focus du jour ─────────────────────────────────────────

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true, businessName: true, sector: true, monthlyGoal: true, fixedCharges: true },
    })
    if (user?.plan === 'FREE') {
      return NextResponse.json({ error: 'Fonctionnalité Solo Pro', upgradeRequired: true }, { status: 403 })
    }

    const userId = session.userId
    let actions: FocusAction[] = FALLBACK_ACTIONS

    try {
      const wikiContext = getBusinessContext(userId)
      const pythonUrl = process.env.PYTHON_AGENT_URL ?? 'http://localhost:8000'

      // Récupérer les tâches HIGH priority pour enrichir le Focus
      const highPriorityTasks = await prisma.task.findMany({
        where: { userId, priority: 'HIGH', status: { in: ['TODO', 'IN_PROGRESS'] } },
        orderBy: { aiPriorityScore: 'desc' },
        take: 3,
        select: {
          id: true, title: true, category: true,
          aiReason: true, estimatedMinutes: true, dueDate: true
        }
      })

      // ── Compute skip patterns from last 30 days ───────────────────────────
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setUTCHours(0, 0, 0, 0)
      thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29)

      const pastFocuses = await prisma.dailyFocus.findMany({
        where: { userId, date: { gte: thirtyDaysAgo } },
        select: { actions: true, statuses: true },
      })

      const keywordSkip: Record<string, number> = {}
      const keywordTotal: Record<string, number> = {}
      const STOP = new Set(['le','la','les','de','du','des','un','une','et','en','au','aux','ce','se','sa','son','ses','mon','ma','mes','votre','vos','sur','par','pour','avec','dans','est','ou','qui','que'])

      for (const pf of pastFocuses) {
        let pActs: { action: string }[] = []
        let pStats: string[] = []
        try { pActs = JSON.parse(pf.actions) } catch { /* ignore */ }
        try { pStats = JSON.parse(pf.statuses) } catch { /* ignore */ }
        pActs.forEach((a, i) => {
          const words = a.action.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3 && !STOP.has(w))
          const key = words.slice(0, 3).join('_')
          if (key) {
            keywordTotal[key] = (keywordTotal[key] ?? 0) + 1
            if (pStats[i] === 'skipped') keywordSkip[key] = (keywordSkip[key] ?? 0) + 1
          }
        })
      }

      const skipPatterns = Object.entries(keywordSkip)
        .filter(([k, count]) => (keywordTotal[k] ?? 0) >= 2 && count / (keywordTotal[k] ?? 1) > 0.6)
        .map(([k]) => k.replace(/_/g, ' '))
        .slice(0, 5)

      const res = await fetch(`${pythonUrl}/focus/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          business_name: user?.businessName ?? 'Mon Entreprise',
          sector: user?.sector ?? null,
          monthly_goal: user?.monthlyGoal ?? 0,
          fixed_charges: user?.fixedCharges ?? 0,
          wiki_context: wikiContext,
          skip_patterns: skipPatterns,
          high_priority_tasks: highPriorityTasks.map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            ai_reason: t.aiReason,
            estimated_minutes: t.estimatedMinutes,
            due_date: t.dueDate?.toISOString() ?? null,
          })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
          actions = mapPythonActions(data.actions)
        }
      } else {
        console.error('[focus POST] Python error:', res.status, await res.text())
      }
    } catch (e) {
      console.error('[focus POST] Python service unavailable:', e)
    }

    // Reset statuses on regeneration
    const statuses: ActionStatus[] = actions.map(() => 'pending')

    const record = await prisma.dailyFocus.upsert({
      where: { userId_date: { userId, date: todayMidnight() } },
      update: { actions: JSON.stringify(actions), statuses: JSON.stringify(statuses) },
      create: { userId, date: todayMidnight(), actions: JSON.stringify(actions), statuses: JSON.stringify(statuses) },
    })

    return NextResponse.json({ focus: parseRecord(record) })
  } catch (error) {
    console.error('[focus POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// ─── PATCH — mettre à jour le statut d'une action ────────────────────────────

export async function PATCH(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { actionIndex, status } = await req.json() as { actionIndex: number; status: ActionStatus }
    const validStatuses: ActionStatus[] = ['pending', 'done', 'skipped', 'snoozed']
    if (typeof actionIndex !== 'number' || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    const record = await prisma.dailyFocus.findUnique({
      where: { userId_date: { userId: session.userId, date: todayMidnight() } },
    })
    if (!record) return NextResponse.json({ error: 'Focus non trouvé' }, { status: 404 })

    const parsed = parseRecord(record)
    const newStatuses = [...parsed.statuses]
    if (actionIndex < 0 || actionIndex >= newStatuses.length) {
      return NextResponse.json({ error: 'Index invalide' }, { status: 400 })
    }
    newStatuses[actionIndex] = status

    // ── Wiki ingest on action status change ───────────────────────────────────
    try {
      const action = parsed.actions[actionIndex]
      const dateStr = new Date().toLocaleDateString('fr-FR')
      if (status === 'done' && action) {
        // Log completed action → feeds pattern learning
        appendToLog(
          session.userId,
          'focus_action_done',
          `✅ Action complétée [${dateStr}] : ${action.action} (${action.estimatedTime ?? '?'})`
        )
        // Append to business/patterns.md → IA learns what gets done
        appendToWikiPage(
          session.userId,
          'business/patterns',
          `\n### [${dateStr}] Action réalisée\n> ${action.action}\n_Contexte : ${action.context}_\n`
        )
      } else if (status === 'skipped' && action) {
        appendToLog(
          session.userId,
          'focus_action_skipped',
          `❌ Action ignorée [${dateStr}] : ${action.action}`
        )
      } else if (status === 'snoozed' && action) {
        appendToLog(
          session.userId,
          'focus_action_snoozed',
          `🔄 Action reportée [${dateStr}] : ${action.action}`
        )
      }
    } catch (wikiErr) {
      // Non-blocking — wiki errors must not break the status update
      console.warn('[focus PATCH] wiki ingest error:', wikiErr)
    }

    // Use Prisma ORM directly (PostgreSQL compatible)
    const updated = await prisma.dailyFocus.update({
      where: { userId_date: { userId: session.userId, date: todayMidnight() } },
      data: { statuses: JSON.stringify(newStatuses) },
    })
    return NextResponse.json({ focus: parseRecord(updated) })
  } catch (error) {
    console.error('[focus PATCH]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
