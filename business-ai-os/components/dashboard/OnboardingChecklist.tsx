'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Step {
  id: string
  label: string
  description: string
  href: string
  icon: string
  isPro: boolean
  isManual: boolean
}

const STEPS: Step[] = [
  { id: 'account',  label: 'Créer votre compte',           description: 'Compte activé',                      href: '/settings',       icon: '✅', isPro: false, isManual: false },
  { id: 'sector',   label: 'Renseigner votre secteur',     description: 'Complétez votre profil business',     href: '/settings',       icon: '🏢', isPro: false, isManual: false },
  { id: 'prospect', label: 'Ajouter votre 1er prospect',  description: 'Gérez vos opportunités commerciales', href: '/pipeline',       icon: '👥', isPro: false, isManual: false },
  { id: 'task',     label: 'Créer votre première tâche',  description: 'Organisez votre travail au quotidien', href: '/tasks',          icon: '📋', isPro: false, isManual: false },
  { id: 'focus',    label: 'Générer votre Daily Focus',   description: 'Votre journée guidée par l\'IA',        href: '/focus',          icon: '⚡', isPro: false, isManual: false },
  { id: 'enrich',   label: 'Enrichir votre profil',       description: 'Débloquez les agents IA avancés',      href: '/settings#enrich', icon: '✨', isPro: false, isManual: false },
  { id: 'chat',     label: 'Essayer le Chat IA',          description: 'Posez vos questions business à l\'IA',  href: '/chat',           icon: '🧠', isPro: true,  isManual: true  },
  { id: 'linkedin', label: 'Essayer le Générateur LinkedIn', description: 'Créez des posts LinkedIn avec l\'IA',   href: '/content',        icon: '💼', isPro: true,  isManual: true  },
  { id: 'agents',   label: 'Explorer les Agents IA',      description: 'Automatisez relances et contenus',     href: '/agents',         icon: '🤖', isPro: true,  isManual: true  },
  { id: 'calcom',   label: 'Connecter Cal.com',           description: 'Synchronisez vos rendez-vous',         href: '/settings#calcom', icon: '📅', isPro: false, isManual: false },
]

const DISMISS_KEY = 'brainlo_checklist_dismissed'
const SHOW_DAYS   = 30

export default function OnboardingChecklist({ plan }: { plan: string }) {
  const [completed, setCompleted]   = useState<string[]>([])
  const [dismissed, setDismissed]   = useState(true) // start hidden to avoid flash
  const [collapsed, setCollapsed]   = useState(false)
  const [loading, setLoading]       = useState(true)
  const [allDone, setAllDone]       = useState(false)

  const fetchProgress = useCallback(async () => {
    try {
      const res  = await fetch('/api/user/onboarding')
      if (!res.ok) return
      const data = await res.json()
      setCompleted(data.completed ?? [])

      // Hide permanently if all steps done or account older than SHOW_DAYS days
      const totalSteps = STEPS.length
      const done       = (data.completed ?? []).length >= totalSteps
      setAllDone(done)

      if (data.daysSinceCreation > SHOW_DAYS) {
        setDismissed(true)
        return
      }
      // Restore dismissed state from localStorage
      const storedDismiss = localStorage.getItem(DISMISS_KEY)
      setDismissed(storedDismiss === 'true' || done)
    } catch {
      // silently fail — don't break the dashboard
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProgress() }, [fetchProgress])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  const handleStepClick = async (step: Step) => {
    if (!step.isManual || completed.includes(step.id)) return
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step.id }),
      })
      setCompleted(prev => [...prev, step.id])
    } catch {
      // silently fail
    }
  }

  if (loading || allDone) return null

  if (dismissed) {
    const doneCountMini = STEPS.filter(s => completed.includes(s.id)).length
    return (
      <div className="mx-4 mt-4 mb-0">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(DISMISS_KEY)
            setDismissed(false)
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2a42] bg-[#13131f] hover:border-[#6366f1]/50 hover:bg-[#1a1a2e] transition-all text-xs text-[#818cf8] shadow"
        >
          <span>🚀</span>
          <span>Premiers pas</span>
          <span className="bg-[#6366f1]/20 text-[#818cf8] px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
            {doneCountMini}/{STEPS.length}
          </span>
        </button>
      </div>
    )
  }

  const doneCount = STEPS.filter(s => completed.includes(s.id)).length
  const pct       = Math.round((doneCount / STEPS.length) * 100)

  return (
    <div className="mx-4 mt-4 mb-0 rounded-xl border border-[#2a2a42] bg-[#13131f] overflow-hidden shadow-lg">
      {/* Header */}
      <button
        type="button"
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none w-full text-left"
        onClick={() => setCollapsed(c => !c)}
        aria-expanded={!collapsed}
        aria-controls="onboarding-steps"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🚀</span>
          <div>
            <p className="text-white font-semibold text-sm">Premiers pas avec Brainlo</p>
            <p className="text-[#818cf8] text-xs" aria-live="polite" aria-atomic="true">{doneCount}/{STEPS.length} étapes complétées</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar compact */}
          <div
            className="hidden sm:block w-32 h-1.5 bg-[#2a2a42] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression onboarding : ${pct}%`}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }}
            />
          </div>
          <span className="text-[#818cf8] text-xs font-medium w-8 text-right" aria-hidden="true">{pct}%</span>
          <svg
            className={`w-4 h-4 text-[#818cf8] transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Steps */}
      {!collapsed && (
        <div id="onboarding-steps" className="px-4 pb-4">
          {/* Full progress bar */}
          <div className="w-full h-1 bg-[#2a2a42] rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STEPS.map(step => {
              const done = completed.includes(step.id)
              const isProLocked = step.isPro && plan === 'FREE'
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  onClick={() => handleStepClick(step)}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 group',
                    done
                      ? 'border-[#22c55e]/30 bg-[#22c55e]/5'
                      : 'border-[#2a2a42] bg-[#0f0f1a] hover:border-[#6366f1]/50 hover:bg-[#1a1a2e]',
                  ].join(' ')}
                >
                  {/* Status icon */}
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {done ? (
                      <svg className="w-5 h-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-[#2a2a42] group-hover:border-[#6366f1] transition-colors" />
                    )}
                  </span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${done ? 'text-[#818cf8]' : 'text-white'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-[#4a4a6a] truncate">{step.description}</p>
                  </div>

                  {/* PRO badge or lock */}
                  {step.isPro && (
                    <span className={[
                      'flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                      isProLocked
                        ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30'
                        : 'bg-[#6366f1]/20 text-[#818cf8]',
                    ].join(' ')}>
                      {isProLocked ? '🔒 PRO' : 'PRO'}
                    </span>
                  )}

                  {/* Arrow */}
                  {!done && (
                    <svg className="w-3.5 h-3.5 text-[#4a4a6a] group-hover:text-[#818cf8] flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a42]">
            <p className="text-xs text-[#4a4a6a]">
              {doneCount < STEPS.length
                ? `Plus que ${STEPS.length - doneCount} étape${STEPS.length - doneCount > 1 ? 's' : ''} pour maîtriser Brainlo 🎯`
                : 'Vous maîtrisez Brainlo ! 🎉'}
            </p>
            <button
              onClick={handleDismiss}
              className="text-xs text-[#4a4a6a] hover:text-[#818cf8] transition-colors"
            >
              Masquer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
