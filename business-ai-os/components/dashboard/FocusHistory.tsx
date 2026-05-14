'use client'

import { useEffect, useState } from 'react'
import type { HistoryEntry } from '@/app/api/focus/history/route'
import type { ActionStatus } from '@/app/api/focus/route'

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ActionStatus, { icon: string; color: string }> = {
  done:    { icon: '✅', color: 'text-green-400' },
  skipped: { icon: '❌', color: 'text-gray-500' },
  snoozed: { icon: '🔄', color: 'text-purple-400' },
  pending: { icon: '⏳', color: 'text-gray-600' },
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? 'bg-green-900/40 text-green-400 border-green-800/40' :
    score >= 70 ? 'bg-indigo-900/40 text-indigo-400 border-indigo-800/40' :
    score >= 40 ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/40' :
    score > 0   ? 'bg-orange-900/40 text-orange-400 border-orange-800/40' :
                  'bg-[#1a1a2e] text-gray-600 border-[#2a2a42]'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}pts
    </span>
  )
}

function CompletionBar({ pct }: { pct: number }) {
  const color =
    pct === 100 ? 'bg-green-500' :
    pct >= 66   ? 'bg-indigo-500' :
    pct >= 33   ? 'bg-yellow-500' :
                  'bg-[#2a2a42]'
  return (
    <div className="flex-1 h-1.5 bg-[#2a2a42] rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Entry row ────────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-[#2a2a42] rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#0e0e1a] hover:bg-[#151524] transition-colors text-left"
      >
        {/* Date */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white capitalize">{entry.dateLabel}</span>
        </div>

        {/* Progress bar + count */}
        <div className="flex items-center gap-2 w-32">
          <CompletionBar pct={entry.completionPct} />
          <span className="text-xs text-[#818cf8] whitespace-nowrap">
            {entry.doneCount}/{entry.totalCount}
          </span>
        </div>

        {/* Score badge */}
        <ScoreBadge score={entry.score} />

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-[#4a4a6a] transition-transform duration-200 flex-shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded actions */}
      {open && (
        <div className="bg-[#151524] border-t border-[#2a2a42] divide-y divide-[#2a2a42]">
          {entry.actions.map((action, i) => {
            const status = entry.statuses[i] ?? 'pending'
            const cfg = STATUS_CONFIG[status]
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="text-base mt-0.5 flex-shrink-0">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${
                    status === 'done' ? 'text-gray-400 line-through' :
                    status === 'skipped' ? 'text-gray-600 line-through' :
                    'text-white'
                  }`}>
                    {action.action}
                  </p>
                  <p className="text-xs text-[#4a4a6a] mt-0.5">{action.estimatedTime}</p>
                </div>
                <span className={`text-xs font-medium ${cfg.color} flex-shrink-0`}>
                  {status === 'done' ? 'Fait' :
                   status === 'skipped' ? 'Ignoré' :
                   status === 'snoozed' ? 'Reporté' :
                   'Non traité'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FocusHistoryProps {
  /** Refresh trigger — pass a counter that increments on status change */
  refreshKey?: number
}

export default function FocusHistory({ refreshKey = 0 }: FocusHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [skipPatterns, setSkipPatterns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/focus/history?days=${days}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setHistory(d.history ?? [])
          setSkipPatterns(d.skipPatterns ?? [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, refreshKey])

  // Past entries = exclude today
  const todayStr = new Date().toISOString().slice(0, 10)
  const pastEntries = history.filter(e => e.date !== todayStr)

  if (loading) {
    return (
      <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 animate-pulse space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-12 bg-[#2a2a42] rounded-xl" />
        ))}
      </div>
    )
  }

  if (pastEntries.length === 0) {
    return null
  }

  return (
    <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Historique Focus</h3>
        <div className="flex gap-1">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                days === d
                  ? 'bg-[#4f46e5] text-white'
                  : 'text-[#6b7280] hover:text-white border border-[#2a2a42] hover:border-[#4f46e5]/50'
              }`}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>

      {/* Skip patterns insight */}
      {skipPatterns.length > 0 && (
        <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg px-3 py-2">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-sm flex-shrink-0">🧠</span>
            <div>
              <p className="text-xs font-medium text-yellow-400">Pattern détecté</p>
              <p className="text-xs text-yellow-400/70 mt-0.5">
                Ces types d&apos;actions sont souvent ignorées : {skipPatterns.join(', ')}.
                L&apos;IA les ajustera dans votre prochain Focus.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History entries */}
      <div className="space-y-2">
        {pastEntries.map(entry => (
          <HistoryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
