'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import DailyFocus, { type ActionStatus, type FocusAction } from '@/components/dashboard/DailyFocus'
import CalendarWidget from '@/components/dashboard/CalendarWidget'
import FocusStreak from '@/components/dashboard/FocusStreak'
import FocusHistory from '@/components/dashboard/FocusHistory'
import FocusScore from '@/components/dashboard/FocusScore'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FocusRecord {
  id: string
  actions: FocusAction[]
  statuses: ActionStatus[]
}

interface WikiLog {
  icon: string
  text: string
  time: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  {
    icon: '💰',
    title: 'Saisissez vos premières transactions',
    description: "Ajoutez vos revenus et charges pour que l'IA calcule votre runway.",
    href: '/cash',
    cta: 'Aller à la Trésorerie',
  },
  {
    icon: '👥',
    title: 'Ajoutez vos premiers prospects',
    description: "Renseignez vos contacts clients pour que l'IA priorise vos relances.",
    href: '/pipeline',
    cta: 'Aller au Pipeline',
  },
  {
    icon: '🧠',
    title: 'Générez votre premier Focus IA',
    description: 'Une fois vos données ajoutées, générez 3 actions prioritaires personnalisées.',
    href: null,
    cta: null,
  },
]

function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ─── Completion Score ─────────────────────────────────────────────────────────

function CompletionScore({ statuses }: { statuses: ActionStatus[] }) {
  const done = statuses.filter(s => s === 'done').length
  const total = statuses.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const color =
    pct === 100 ? 'bg-green-500' :
    pct >= 66   ? 'bg-indigo-500' :
    pct >= 33   ? 'bg-yellow-500' :
                  'bg-[#2a2a42]'
  return (
    <div className="flex items-center gap-3 mt-3 max-w-xs">
      <div className="flex-1 h-2 bg-[#2a2a42] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[#818cf8] whitespace-nowrap">
        {done}/{total} fait{done > 1 ? 's' : ''}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FocusPage() {
  const [focus, setFocus] = useState<FocusRecord | null>(null)
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [wikiLogs, setWikiLogs] = useState<WikiLog[]>([])
  const [today, setToday] = useState('')
  const [loading, setLoading] = useState(false)
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [upgradeToast, setUpgradeToast] = useState(false)

  // ── Détection upgrade=success dans l'URL ─────────────────────────────────
  useEffect(() => {
    if (searchParams.get('upgrade') === 'success') {
      setUpgradeToast(true)
      // Nettoyer l'URL sans recharger la page
      window.history.replaceState({}, '', '/focus')
      setTimeout(() => setUpgradeToast(false), 8000)
    }
  }, [searchParams])

  // ── Date client-only (avoid hydration mismatch) ──────────────────────────────
  useEffect(() => { setToday(formatDateFR(new Date())) }, [])

  // ── Initial data load ────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const focusRes = await fetch('/api/focus')
        if (focusRes.ok) {
          const data = await focusRes.json()
          if (data.focus) setFocus(data.focus)
        }
        const [prospectsRes, transactionsRes] = await Promise.all([
          fetch('/api/pipeline/prospects'),
          fetch('/api/cash/transactions'),
        ])
        let count = 0
        if (prospectsRes.ok) { const d = await prospectsRes.json(); count += (d.prospects ?? d ?? []).length }
        if (transactionsRes.ok) { const d = await transactionsRes.json(); count += (d.transactions ?? d ?? []).length }
        setHasData(count > 0)
        const logsRes = await fetch('/api/wiki/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'recent activity', limit: 5 }),
        }).catch(() => null)
        if (logsRes?.ok) {
          const d = await logsRes.json()
          if (Array.isArray(d.results) && d.results.length > 0) setWikiLogs(d.results.slice(0, 5))
        }
      } catch {
        setHasData(false)
      } finally {
        setInitialLoading(false)
      }
    }
    init()
  }, [])

  // ── Generate focus ────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/focus', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.focus) setFocus(data.focus)
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.upgradeRequired) setShowUpgradeModal(true)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  // ── Update action status (optimistic) ────────────────────────────────────────
  const handleStatusChange = useCallback(async (actionIndex: number, status: ActionStatus) => {
    if (!focus || updatingIndex !== null) return
    setUpdatingIndex(actionIndex)
    const prevStatuses = [...focus.statuses]
    // Optimistic update
    setFocus(f => f ? { ...f, statuses: f.statuses.map((s, i) => i === actionIndex ? status : s) } : f)
    try {
      const res = await fetch('/api/focus', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionIndex, status }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.focus) setFocus(data.focus)
        setRefreshKey(k => k + 1) // refresh score, streak, history
      } else {
        setFocus(f => f ? { ...f, statuses: prevStatuses } : f) // rollback
      }
    } catch {
      setFocus(f => f ? { ...f, statuses: prevStatuses } : f) // rollback
    } finally {
      setUpdatingIndex(null)
    }
  }, [focus, updatingIndex])

  // ── Derived state ─────────────────────────────────────────────────────────────
  const allResolved = focus?.statuses.every(s => s !== 'pending') ?? false
  const doneCount = focus?.statuses.filter(s => s === 'done').length ?? 0

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-[#4f46e5]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[#818cf8] text-sm">Chargement de votre espace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Toast Bienvenue Solo Pro ─────────────────────────────────────── */}
      {upgradeToast && (
        <div className="fixed top-6 right-6 z-50 flex items-start gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 rounded-xl shadow-2xl border border-indigo-400/30 max-w-sm animate-fade-in">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-sm">Bienvenue dans Solo Pro !</p>
            <p className="text-white/80 text-xs mt-0.5">Toutes les fonctionnalités sont maintenant débloquées. Générez votre premier Focus IA !</p>
          </div>
          <button onClick={() => setUpgradeToast(false)} className="text-white/60 hover:text-white text-lg leading-none ml-2">×</button>
        </div>
      )}

      {/* ── Upgrade Modal ────────────────────────────────────────────────────── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151524] border border-[#2a2a42] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-white mb-2">Fonctionnalité Solo Pro</h2>
            <p className="text-[#818cf8] text-sm mb-6">
              La génération de Focus IA est réservée aux abonnés{' '}
              <span className="text-white font-semibold">Solo Pro</span>.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 text-sm text-[#818cf8] hover:text-white border border-[#2a2a42] hover:border-[#4f46e5]/50 rounded-lg transition-all">
                Plus tard
              </button>
              <button onClick={async () => {
                  const res = await fetch('/api/stripe/checkout', { method: 'POST' })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                }}
                className="px-5 py-2 text-sm font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg transition-colors">
                Upgrader — 29€/mois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Bonjour 👋, votre focus du jour</h1>
          <p className="text-sm text-[#6b7280] mt-1 capitalize">{today}</p>
          {focus && <CompletionScore statuses={focus.statuses} />}
        </div>
        {(hasData || focus) && (
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors whitespace-nowrap">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>Génération...</>
            ) : focus ? 'Regénérer ✨' : 'Générer mon focus ✨'}
          </button>
        )}
      </div>

      {/* ── RDV du jour Cal.com ──────────────────────────────────────────────── */}
      <CalendarWidget />

      {/* ── State 1: No data — onboarding steps ──────────────────────────────── */}
      {!hasData && !focus && (
        <div className="mb-8">
          <div className="bg-[#151524] border border-[#4f46e5]/30 rounded-2xl p-8 mb-6 text-center">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-xl font-bold text-white mb-2">Bienvenue dans votre Daily Focus !</h2>
            <p className="text-[#818cf8] text-sm max-w-md mx-auto">
              Votre Focus IA s&apos;appuie sur vos données réelles pour vous proposer
              3 actions prioritaires chaque matin. Commencez par renseigner vos données.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ONBOARDING_STEPS.map((step, i) => (
              <div key={i} className="bg-[#151524] border border-[#2a2a42] rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider">Étape {i + 1}</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-[#818cf8]">{step.description}</p>
                </div>
                {step.href ? (
                  <button
                    onClick={() => router.push(step.href!)}
                    className="mt-auto w-full text-sm font-medium bg-[#4f46e5]/20 hover:bg-[#4f46e5]/40 text-[#818cf8] hover:text-white border border-[#4f46e5]/30 rounded-lg px-4 py-2 transition-all"
                  >
                    {step.cta} →
                  </button>
                ) : (
                  <div className="mt-auto w-full text-sm text-center text-[#4a4a6a] border border-dashed border-[#2a2a42] rounded-lg px-4 py-2">
                    Disponible après les étapes 1 & 2
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── State 2: Has data, no focus yet ──────────────────────────────────────── */}
      {hasData && !focus && (
        <div className="mb-8">
          <div className="bg-[#151524] border border-[#4f46e5]/30 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h2 className="text-xl font-bold text-white mb-2">Prêt à générer votre focus !</h2>
            <p className="text-[#818cf8] text-sm mb-6 max-w-md mx-auto">
              Vous avez des données dans votre espace. Cliquez ci-dessous pour générer
              vos 3 actions prioritaires du jour basées sur votre situation réelle.
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-60 text-white font-semibold rounded-lg px-6 py-3 text-sm transition-colors"
            >
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Génération en cours...</>
              ) : (
                <>⚡ Générer mon Focus du jour</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── State 3: All done ───────────────────────────────────────────────────────── */}
      {focus && allResolved && (
        <div className="bg-gradient-to-r from-green-900/20 to-indigo-900/20 border border-green-800/30 rounded-2xl p-6 mb-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-lg font-bold text-white mb-1">
            {doneCount === focus.actions.length
              ? `Bravo ! ${doneCount} action${doneCount > 1 ? "s" : ""} accomplie${doneCount > 1 ? "s" : ""} aujourd&apos;hui 🎯`
              : "Focus du jour traité — beau travail !"
            }
          </h2>
          <p className="text-[#818cf8] text-sm">Votre business avance. À demain pour un nouveau focus.</p>
        </div>
      )}

      {/* ── State 4: Focus cards + sidebar ─────────────────────────────────────── */}
      {focus && (
        <div className="flex flex-col xl:flex-row gap-6 mb-8">
          {/* Left: Focus action cards */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3 gap-4">
              {focus.actions.map((action, index) => (
                <DailyFocus
                  key={index}
                  index={index + 1}
                  action={action}
                  status={focus.statuses[index] ?? 'pending'}
                  onStatusChange={(status) => handleStatusChange(index, status)}
                  disabled={updatingIndex !== null}
                />
              ))}
            </div>
          </div>

          {/* Right: Score + Streak sidebar */}
          <div className="xl:w-72 flex flex-col gap-4">
            <FocusScore refreshKey={refreshKey} />
            <FocusStreak />
          </div>
        </div>
      )}

      {/* ── History (past days) ──────────────────────────────────────────────────── */}
      {focus && (
        <div className="mb-8">
          <FocusHistory refreshKey={refreshKey} />
        </div>
      )}

      {/* ── Quote ─────────────────────────────────────────────────────────────────── */}
      {focus && !allResolved && (
        <div className="bg-white/5 backdrop-blur border border-[#2a2a42] rounded-xl p-6 mb-8 text-center">
          <p className="text-[#818cf8] italic text-base">
            &ldquo;Chaque grande réussite commence par une seule action bien choisie.&rdquo;
          </p>
        </div>
      )}

      {/* ── Recent Activity ─────────────────────────────────────────────────────── */}
      {wikiLogs.length > 0 && (
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Activité récente</h2>
          <div className="space-y-3">
            {wikiLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#2a2a42] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{log.icon}</span>
                  <span className="text-sm text-[#d1d5db]">{log.text}</span>
                </div>
                <span className="text-xs text-[#6b7280] whitespace-nowrap ml-4">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
