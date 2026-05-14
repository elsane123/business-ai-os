'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type AgentCapability = { label: string; description: string }

type Agent = {
  id: string
  name: string
  shortName: string
  icon: string
  domain: string
  domainLabel: string
  tagline: string
  description: string
  capabilities: AgentCapability[]
  exampleQuestions: string[]
  requiredPlan: string
  color: string
  isActive: boolean
  activatedAt: string | null
}

type AgentsData = {
  agents: Agent[]
  userPlan: string
  maxSlots: number
  activeCount: number
}

const DOMAIN_FILTERS = [
  { key: 'all', label: 'Tous les agents' },
  { key: 'finance', label: '🧮 Finance' },
  { key: 'commercial', label: '📈 Commercial' },
  { key: 'marketing', label: '📣 Marketing' },
  { key: 'juridique', label: '⚖️ Juridique' },
  { key: 'rh', label: '👥 RH' },
  { key: 'operations', label: '⚙️ Opérations' },
  { key: 'strategie', label: '🎯 Stratégie' },
]

const COLOR_STYLES: Record<string, { border: string; badge: string; btn: string; icon: string }> = {
  emerald: {
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    badge: 'bg-emerald-500/20 text-emerald-300',
    btn: 'bg-emerald-600 hover:bg-emerald-500',
    icon: 'bg-emerald-500/20 text-emerald-300',
  },
  blue: {
    border: 'border-blue-500/30 hover:border-blue-500/60',
    badge: 'bg-blue-500/20 text-blue-300',
    btn: 'bg-blue-600 hover:bg-blue-500',
    icon: 'bg-blue-500/20 text-blue-300',
  },
  purple: {
    border: 'border-purple-500/30 hover:border-purple-500/60',
    badge: 'bg-purple-500/20 text-purple-300',
    btn: 'bg-purple-600 hover:bg-purple-500',
    icon: 'bg-purple-500/20 text-purple-300',
  },
  amber: {
    border: 'border-amber-500/30 hover:border-amber-500/60',
    badge: 'bg-amber-500/20 text-amber-300',
    btn: 'bg-amber-600 hover:bg-amber-500',
    icon: 'bg-amber-500/20 text-amber-300',
  },
  rose: {
    border: 'border-rose-500/30 hover:border-rose-500/60',
    badge: 'bg-rose-500/20 text-rose-300',
    btn: 'bg-rose-600 hover:bg-rose-500',
    icon: 'bg-rose-500/20 text-rose-300',
  },
  cyan: {
    border: 'border-cyan-500/30 hover:border-cyan-500/60',
    badge: 'bg-cyan-500/20 text-cyan-300',
    btn: 'bg-cyan-600 hover:bg-cyan-500',
    icon: 'bg-cyan-500/20 text-cyan-300',
  },
  indigo: {
    border: 'border-indigo-500/30 hover:border-indigo-500/60',
    badge: 'bg-indigo-500/20 text-indigo-300',
    btn: 'bg-indigo-600 hover:bg-indigo-500',
    icon: 'bg-indigo-500/20 text-indigo-300',
  },
}

function getStyles(color: string) {
  return COLOR_STYLES[color] ?? COLOR_STYLES['indigo']
}

export default function AgentsPage() {
  const [data, setData] = useState<AgentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function loadAgents() {
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Impossible de charger les agents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAgents() }, [])

  async function toggleAgent(agent: Agent) {
    if (toggling) return
    setToggling(agent.id)
    setError('')
    try {
      if (agent.isActive) {
        const res = await fetch(`/api/agents/${agent.id}/activate`, { method: 'DELETE' })
        if (!res.ok) {
          const j = await res.json()
          setError(j.error ?? 'Erreur désactivation')
        }
      } else {
        const res = await fetch(`/api/agents/${agent.id}/activate`, { method: 'POST' })
        if (!res.ok) {
          const j = await res.json()
          setError(j.error ?? 'Erreur activation')
        }
      }
      await loadAgents()
    } catch {
      setError('Erreur réseau')
    } finally {
      setToggling(null)
    }
  }

  const filtered = data?.agents.filter(
    (a) => filter === 'all' || a.domain === filter
  ) ?? []

  const planLabel: Record<string, string> = {
    FREE: 'Solo Free',
    PRO: 'Solo Pro',
    STARTER_PME: 'Starter PME',
    PME_GROWTH: 'PME Growth',
    PME_SCALE: 'PME Scale',
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🤖</span>
          <h1 className="text-2xl font-bold text-white">Agents IA Spécialisés</h1>
        </div>
        <p className="text-[#818cf8] text-sm">
          Activez les agents experts dont votre business a besoin. Chaque agent est un directeur IA dédié à son domaine.
        </p>
      </div>

      {/* Plan + slots */}
      {data && (
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-[#1e1e30] rounded-xl px-4 py-2 border border-[#2a2a42]">
            <span className="text-xs text-[#818cf8]">Plan actuel</span>
            <span className="text-sm font-semibold text-white">{planLabel[data.userPlan] ?? data.userPlan}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1e1e30] rounded-xl px-4 py-2 border border-[#2a2a42]">
            <span className="text-xs text-[#818cf8]">Agents actifs</span>
            <span className="text-sm font-semibold text-white">
              {data.maxSlots === 999 ? `${data.activeCount} / ∞` : `${data.activeCount} / ${data.maxSlots}`}
            </span>
            <div className="flex gap-1 ml-1">
              {Array.from({ length: Math.min(data.maxSlots, 10) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < data.activeCount ? 'bg-[#4f46e5]' : 'bg-[#2a2a42]'}`}
                />
              ))}
              {data.maxSlots === 999 && <span className="text-xs text-[#818cf8] ml-1">∞</span>}
            </div>
          </div>
          {data.maxSlots === 0 && (
            <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-2">
              <span className="text-amber-400 text-xs">⚡ Passez en Solo Pro pour activer des agents</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Domain filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {DOMAIN_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f.key
                ? 'bg-[#4f46e5] text-white'
                : 'bg-[#1e1e30] text-[#818cf8] hover:text-white hover:bg-[#2a2a42] border border-[#2a2a42]',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Agents grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((agent) => {
            const styles = getStyles(agent.color)
            const isToggling = toggling === agent.id
            const canActivate = data ? (data.activeCount < data.maxSlots || agent.isActive) : false
            const slotsExhausted = data ? (data.activeCount >= data.maxSlots && !agent.isActive && data.maxSlots > 0) : false

            return (
              <div
                key={agent.id}
                className={[
                  'relative bg-[#13131f] rounded-2xl border-2 p-5 transition-all duration-200',
                  agent.isActive ? `border-[#4f46e5]/60 ring-1 ring-[#4f46e5]/20` : styles.border,
                ].join(' ')}
              >
                {/* Active badge */}
                {agent.isActive && (
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 bg-[#4f46e5]/20 text-[#818cf8] text-[10px] font-medium px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-[#4f46e5] rounded-full animate-pulse" />
                      Actif
                    </span>
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${styles.icon}`}>
                    {agent.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{agent.name}</h3>
                    <p className="text-[#818cf8] text-xs">{agent.tagline}</p>
                  </div>
                </div>

                {/* Domain badge */}
                <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-3 ${styles.badge}`}>
                  {agent.domainLabel}
                </span>

                {/* Description */}
                <p className="text-[#9ca3af] text-xs leading-relaxed mb-4">
                  {agent.description}
                </p>

                {/* Capabilities */}
                <div className="space-y-1.5 mb-4">
                  {agent.capabilities.map((cap) => (
                    <div key={cap.label} className="flex items-start gap-2">
                      <span className="text-[#4f46e5] mt-0.5 flex-shrink-0">✓</span>
                      <div>
                        <span className="text-white text-xs font-medium">{cap.label}</span>
                        <span className="text-[#6b7280] text-xs"> — {cap.description}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Example questions */}
                {agent.isActive && (
                  <div className="mb-4 p-2.5 bg-[#0f0f1a] rounded-lg border border-[#2a2a42]">
                    <p className="text-[#818cf8] text-[10px] font-medium mb-1.5">💬 Questions exemples</p>
                    <ul className="space-y-1">
                      {agent.exampleQuestions.slice(0, 2).map((q, i) => (
                        <li key={i} className="text-[#6b7280] text-[10px] truncate">→ {q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Slot exhausted warning */}
                {slotsExhausted && (
                  <div className="mb-3 p-2 bg-amber-900/20 border border-amber-500/20 rounded-lg">
                    <p className="text-amber-400 text-[10px]">
                      ⚡ Limite atteinte — désactivez un agent ou upgradez votre plan
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-auto pt-2">
                  {agent.isActive ? (
                    <>
                      <Link
                        href={`/agents/${agent.id}`}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all ${styles.btn}`}
                      >
                        <span>💬</span> Ouvrir le chat
                      </Link>
                      <button
                        onClick={() => toggleAgent(agent)}
                        disabled={isToggling}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-[#818cf8] hover:text-red-400 hover:bg-red-900/20 border border-[#2a2a42] transition-all disabled:opacity-50"
                        title="Désactiver cet agent"
                      >
                        {isToggling ? '⏳' : '✕'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleAgent(agent)}
                      disabled={isToggling || slotsExhausted || data?.maxSlots === 0}
                      className={[
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all',
                        slotsExhausted || data?.maxSlots === 0
                          ? 'bg-[#2a2a42] text-[#818cf8] cursor-not-allowed opacity-60'
                          : `${styles.btn} disabled:opacity-50`,
                      ].join(' ')}
                    >
                      {isToggling ? '⏳ Activation...' : data?.maxSlots === 0 ? '🔒 Plan requis' : '+ Activer'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-[#818cf8] text-sm">Aucun agent dans cette catégorie</p>
        </div>
      )}
    </div>
  )
}
