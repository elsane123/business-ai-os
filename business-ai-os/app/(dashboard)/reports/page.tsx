'use client'
import { useState, useEffect } from 'react'

interface ReportData {
  month: string
  business: { name?: string; goal?: number }
  finance: {
    ca: number; charges: number; net: number
    goalProgress: number | null
    topExpenses: { category: string; amount: number }[]
  }
  pipeline: {
    totalProspects: number; activeProspects: number
    wonThisMonth: number; wonRevenue: number
    pipelineValue: number; conversionRate: number
  }
  tasks: { completed: number; total: number; completionRate: number }
  focus: { activeDays: number; daysInMonth: number; engagementRate: number }
}

function KpiCard({ label, value, sub, color = 'indigo' }: {
  label: string; value: string; sub?: string; color?: 'green' | 'red' | 'indigo' | 'amber' | 'blue'
}) {
  const colors = {
    green:  'text-green-400  bg-green-500/10  border-green-500/20',
    red:    'text-red-400    bg-red-500/10    border-red-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    amber:  'text-amber-400  bg-amber-500/10  border-amber-500/20',
    blue:   'text-blue-400   bg-blue-500/10   border-blue-500/20',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

function ProgressBar({ value, max, color = '#6366f1' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(Math.round(value / max * 100), 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-[#1e1e30] rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-gray-400 w-9 text-right">{pct}%</span>
    </div>
  )
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' €'
}

function getMonthParam(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ReportsPage() {
  const [month, setMonth] = useState(getMonthParam(-1)) // default: last month
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`/api/reports/monthly?month=${month}`)
      .then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error) }))
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [month])

  const netColor = data && data.finance.net >= 0 ? 'green' : 'red'

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 Rapports Mensuels</h1>
          <p className="text-gray-400 mt-1 text-sm">Vue consolidée de votre activité business.</p>
        </div>
        {/* Month selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const [y, m] = month.split('-').map(Number)
              const d = new Date(y, m - 2)
              setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
            }}
            className="p-2 rounded-lg bg-[#1e1e30] border border-[#2a2a42] text-gray-400 hover:text-white transition-colors"
          >←</button>
          <span className="text-sm font-medium text-white px-3 py-2 bg-[#0f0f1f] border border-[#2a2a42] rounded-lg min-w-[120px] text-center">
            {data?.month ?? month}
          </span>
          <button
            onClick={() => {
              const [y, m] = month.split('-').map(Number)
              const d = new Date(y, m)
              setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
            }}
            className="p-2 rounded-lg bg-[#1e1e30] border border-[#2a2a42] text-gray-400 hover:text-white transition-colors"
          >→</button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Finance */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-green-400 mb-3">💰 Trésorerie</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <KpiCard label="Chiffre d'affaires" value={fmt(data.finance.ca)} color="green" />
              <KpiCard label="Charges" value={fmt(data.finance.charges)} color="red" />
              <KpiCard label="Net" value={fmt(data.finance.net)} color={netColor} />
            </div>
            {data.finance.goalProgress !== null && (
              <div className="bg-[#0f0f1f] border border-[#2a2a42] rounded-xl p-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Progression objectif mensuel</span>
                  <span>{data.finance.goalProgress}%</span>
                </div>
                <ProgressBar value={data.finance.goalProgress} max={100} />
              </div>
            )}
            {data.finance.topExpenses.length > 0 && (
              <div className="mt-3 bg-[#0f0f1f] border border-[#2a2a42] rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Top dépenses</p>
                <div className="space-y-2">
                  {data.finance.topExpenses.map((e, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-300">{e.category}</span>
                      <span className="text-red-400 font-medium">{fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Pipeline */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3">🎯 Pipeline commercial</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <KpiCard label="Prospects actifs" value={String(data.pipeline.activeProspects)} color="indigo" />
              <KpiCard label="Deals gagnés" value={`${data.pipeline.wonThisMonth} (${fmt(data.pipeline.wonRevenue)})`} color="green" />
              <KpiCard label="Valeur pipeline" value={fmt(data.pipeline.pipelineValue)} color="indigo" />
              <KpiCard label="Taux conversion" value={`${data.pipeline.conversionRate}%`} color="amber" />
            </div>
          </section>

          {/* Tasks + Focus */}
          <div className="grid grid-cols-2 gap-4">
            <section className="bg-[#0f0f1f] border border-[#2a2a42] rounded-xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-3">📋 Tâches</h2>
              <p className="text-3xl font-bold text-amber-400">{data.tasks.completionRate}%</p>
              <p className="text-xs text-gray-400 mt-1">{data.tasks.completed}/{data.tasks.total} complétées</p>
              <div className="mt-3">
                <ProgressBar value={data.tasks.completed} max={data.tasks.total} color="#f59e0b" />
              </div>
            </section>
            <section className="bg-[#0f0f1f] border border-[#2a2a42] rounded-xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-3">⚡ Focus streak</h2>
              <p className="text-3xl font-bold text-blue-400">{data.focus.engagementRate}%</p>
              <p className="text-xs text-gray-400 mt-1">{data.focus.activeDays}/{data.focus.daysInMonth} jours actifs</p>
              <div className="mt-3">
                <ProgressBar value={data.focus.activeDays} max={data.focus.daysInMonth} color="#3b82f6" />
              </div>
            </section>
          </div>

          {/* Send report by email */}
          <div className="text-center pt-2">
            <button
              onClick={async () => {
                const r = await fetch('/api/reports/monthly', { method: 'POST' })
                if (r.ok) alert('📧 Rapport envoyé par email !')
                else alert('Erreur lors de l\'envoi')
              }}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              📧 Envoyer ce rapport par email
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
