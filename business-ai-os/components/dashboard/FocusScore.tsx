'use client'

import { useEffect, useState } from 'react'
import type { DailyScore } from '@/app/api/focus/score/route'

// ─── SVG Ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 36
  const stroke = 6
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const offset = circumference - (score / 100) * circumference

  const ringColor =
    score >= 90 ? '#4ade80' :  // green-400
    score >= 70 ? '#818cf8' :  // indigo-400
    score >= 40 ? '#facc15' :  // yellow-400
    score > 0   ? '#fb923c' :  // orange-400
                  '#2a2a42'    // dark

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={radius} cy={radius} r={normalizedRadius}
          fill="none" stroke="#1a1a2e" strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx={radius} cy={radius} r={normalizedRadius}
          fill="none" stroke={ringColor} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      {/* Score number in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold ${color}`}>{score}</span>
      </div>
    </div>
  )
}

// ─── Score breakdown row ──────────────────────────────────────────────────────

function BreakdownRow({ icon, label, points, max }: { icon: string; label: string; points: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-[#818cf8]">{label}</span>
          <span className="text-xs font-semibold text-white">{points}<span className="text-[#4a4a6a]">/{max}</span></span>
        </div>
        <div className="h-1 bg-[#2a2a42] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4f46e5] rounded-full transition-all duration-700"
            style={{ width: `${(points / max) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FocusScoreProps {
  refreshKey?: number
}

export default function FocusScore({ refreshKey = 0 }: FocusScoreProps) {
  const [score, setScore] = useState<DailyScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/focus/score')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setScore(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  if (loading) {
    return (
      <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 animate-pulse">
        <div className="flex gap-4 items-center">
          <div className="w-18 h-18 rounded-full bg-[#2a2a42]" style={{ width: 72, height: 72 }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#2a2a42] rounded w-2/3" />
            <div className="h-3 bg-[#2a2a42] rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!score) return null

  return (
    <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Score du jour</h3>
        <span className={`text-xs font-semibold ${score.color}`}>{score.label}</span>
      </div>

      {/* Ring + breakdown */}
      <div className="flex items-center gap-4">
        <ScoreRing score={score.total} color={score.color} />

        {/* Breakdown */}
        <div className="flex-1 space-y-2.5">
          <BreakdownRow
            icon="✅"
            label="Actions complétées"
            points={score.completionPoints}
            max={70}
          />
          <BreakdownRow
            icon="🏆"
            label="Bonus tout complété"
            points={score.perfectBonus}
            max={20}
          />
          <BreakdownRow
            icon="💰"
            label="Revenu saisi aujourd'hui"
            points={score.revenueBonus}
            max={10}
          />
        </div>
      </div>

      {/* Revenue hint */}
      {score.todayRevenue > 0 && (
        <div className="mt-3 pt-3 border-t border-[#2a2a42] text-center">
          <span className="text-xs text-green-400">
            +{score.todayRevenue.toLocaleString('fr-FR')}€ de revenu saisi aujourd&apos;hui 💶
          </span>
        </div>
      )}
      {score.todayRevenue === 0 && score.total > 0 && (
        <div className="mt-3 pt-3 border-t border-[#2a2a42] text-center">
          <span className="text-xs text-[#4a4a6a]">
            Saisissez un revenu pour +10 pts bonus 💡
          </span>
        </div>
      )}
    </div>
  )
}
