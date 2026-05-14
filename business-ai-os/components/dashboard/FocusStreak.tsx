'use client'

import { useEffect, useState } from 'react'
import type { StreakData, StreakDay } from '@/app/api/focus/streak/route'

// ─── Day dot ─────────────────────────────────────────────────────────────────

const DOT_STYLES = {
  done:    'bg-green-500 border-green-400',
  partial: 'bg-indigo-500/70 border-indigo-400',
  empty:   'bg-[#2a2a42] border-[#3a3a52]',
  future:  'bg-[#1a1a2e] border-[#2a2a42] opacity-40',
} satisfies Record<StreakDay['status'], string>

const DOT_TOOLTIPS = {
  done:    (d: StreakDay) => `${d.doneCount}/${d.totalCount} faites ✅`,
  partial: (d: StreakDay) => `${d.doneCount}/${d.totalCount} faites`,
  empty:   () => 'Pas de focus',
  future:  () => 'À venir',
} satisfies Record<StreakDay['status'], (d: StreakDay) => string>

function DayDot({ day }: { day: StreakDay }) {
  const [showTip, setShowTip] = useState(false)
  const label = day.date.slice(8) // DD
  const tip = DOT_TOOLTIPS[day.status](day)
  return (
    <div className="flex flex-col items-center gap-1 relative">
      <button
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className={[
          'w-6 h-6 rounded-full border transition-all duration-150 hover:scale-110',
          DOT_STYLES[day.status],
        ].join(' ')}
        aria-label={`${day.date}: ${tip}`}
      />
      {showTip && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1e1e32] border border-[#3a3a52] rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap z-20 shadow-xl pointer-events-none">
          <div className="font-semibold">{day.date.slice(5)}</div>
          <div className="text-[#818cf8]">{tip}</div>
        </div>
      )}
      <span className="text-[10px] text-[#4a4a6a]">{label}</span>
    </div>
  )
}

// ─── Streak fire icon ─────────────────────────────────────────────────────────

function FireIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${active ? 'text-orange-400' : 'text-[#4a4a6a]'}`} fill="currentColor">
      <path d="M12 2c0 0-3 3.5-3 7 0 1.66 1.34 3 3 3s3-1.34 3-3c0-.35-.07-.69-.18-1.01C16.4 9.5 18 12 18 14.5 18 18.09 15.31 21 12 21s-6-2.91-6-6.5c0-4.03 3.5-8.5 6-12.5z"/>
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FocusStreak() {
  const [data, setData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/focus/streak')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-[#2a2a42] rounded w-1/3 mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-[#2a2a42]" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const streakActive = data.currentStreak > 0

  return (
    <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Régularité</h3>
        <span className="text-xs text-[#6b7280]">{data.totalDays} jour{data.totalDays > 1 ? 's' : ''} avec focus</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Current streak */}
        <div className={`rounded-lg p-3 text-center border ${
          streakActive
            ? 'bg-orange-950/30 border-orange-900/40'
            : 'bg-[#0e0e1a] border-[#2a2a42]'
        }`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <FireIcon active={streakActive} />
            <span className={`text-xl font-bold ${
              streakActive ? 'text-orange-400' : 'text-[#4a4a6a]'
            }`}>{data.currentStreak}</span>
          </div>
          <div className="text-[10px] text-[#6b7280] uppercase tracking-wide">Série active</div>
        </div>

        {/* Longest streak */}
        <div className="rounded-lg p-3 text-center bg-[#0e0e1a] border border-[#2a2a42]">
          <div className="text-xl font-bold text-[#818cf8] mb-1">{data.longestStreak}</div>
          <div className="text-[10px] text-[#6b7280] uppercase tracking-wide">Record</div>
        </div>

        {/* Completion rate */}
        <div className="rounded-lg p-3 text-center bg-[#0e0e1a] border border-[#2a2a42]">
          <div className={`text-xl font-bold mb-1 ${
            data.completionRate >= 70 ? 'text-green-400'
            : data.completionRate >= 40 ? 'text-yellow-400'
            : 'text-[#4a4a6a]'
          }`}>{data.completionRate}%</div>
          <div className="text-[10px] text-[#6b7280] uppercase tracking-wide">Completion</div>
        </div>
      </div>

      {/* 14-day heatmap */}
      <div>
        <div className="text-[10px] text-[#4a4a6a] uppercase tracking-wide mb-2">14 derniers jours</div>
        <div className="flex gap-1.5 items-end">
          {data.last14Days.map(day => (
            <DayDot key={day.date} day={day} />
          ))}
        </div>
      </div>

      {/* Motivation message */}
      {streakActive && (
        <div className="text-xs text-orange-400/80 text-center pt-1 border-t border-[#2a2a42]">
          {data.currentStreak === 1 && '🔥 Belle reprise ! Continuez demain.'}
          {data.currentStreak === 2 && '🔥🔥 2 jours consécutifs — la machine est lancée !'}
          {data.currentStreak >= 3 && data.currentStreak < 7 && `🔥 ${data.currentStreak} jours de suite ! Ne brisez pas la chaîne.`}
          {data.currentStreak >= 7 && data.currentStreak < 30 && `🏆 ${data.currentStreak} jours — vous êtes en feu !`}
          {data.currentStreak >= 30 && `🚀 ${data.currentStreak} jours consécutifs — discipline légendaire !`}
        </div>
      )}
      {!streakActive && data.totalDays > 0 && (
        <div className="text-xs text-[#4a4a6a] text-center pt-1 border-t border-[#2a2a42]">
          Complétez une action aujourd&apos;hui pour relancer votre série 💪
        </div>
      )}
    </div>
  )
}
