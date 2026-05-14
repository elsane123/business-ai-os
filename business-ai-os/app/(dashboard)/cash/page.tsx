'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Transaction {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  description: string
  date: string
  createdAt: string
}

interface RunwayScenario {
  months: number
  date: string
}

interface RunwayData {
  currentBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyGoal: number
  fixedCharges: number
  goalProgress: number
  runway: {
    pessimistic: RunwayScenario
    realistic: RunwayScenario
    optimistic: RunwayScenario
  }
}

const CATEGORIES = [
  'Facture client',
  'Freelances',
  'Logiciels & SaaS',
  'Marketing',
  'Loyer/Hébergement',
  'Comptabilité',
  'Formation',
  'Salaires',
  'Autre',
]

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function fmtRunwayDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ─── Brief Transaction IA ─────────────────────────────────────────────────────

type BriefTransaction = {
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  description: string
  date: string
}

function CashBriefModal({ onClose, onParsed }: {
  onClose: () => void
  onParsed: (data: BriefTransaction) => void
}) {
  const [brief, setBrief] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brief.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cash/parse-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      onParsed(data.transaction)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#151524] border border-[#2a2a42] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a42]">
          <div>
            <h2 className="text-lg font-semibold text-white">✍️ Transaction depuis un brief</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">L&apos;IA analyse votre texte et pré-remplit la transaction</p>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#6b7280] mb-2">Décrivez la transaction en langage naturel</label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={5}
              autoFocus
              placeholder="Ex : Reçu 3500€ de TechCorp pour la facture de novembre. Ou : Payé abonnement Notion 16€ hier. Ou : Achat matériel bureautique 240€ TTC lundi."
              className="w-full bg-[#1a1a2e] border border-[#2a2a42] rounded-xl px-4 py-3 text-white placeholder:text-[#3a3a5c] focus:outline-none focus:border-indigo-500 text-sm resize-none leading-relaxed"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              ⚠️ {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a42] text-[#6b7280] hover:text-white transition-colors text-sm"
            >Annuler</button>
            <button type="submit" disabled={loading || !brief.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> Analyse en cours...</>
              ) : (
                <><span>✨</span> Analyser &amp; pré-remplir</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CashPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [runway, setRunway] = useState<RunwayData | null>(null)
  const [loadingTx, setLoadingTx] = useState(true)
  const [loadingRunway, setLoadingRunway] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBriefModal, setShowBriefModal] = useState(false)

  // Form state
  const [formAmount, setFormAmount] = useState('')
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState('')

  // OCR état
  const [ocrLoading, setOcrLoading] = useState(false)
  const ocrInputRef = useRef<HTMLInputElement>(null)

  // URSSAF + TVA état
  const [urssaf, setUrssaf] = useState<{
    activityType: string; urssafRate: number; urssafPeriodicity: string
    tvaThreshold: number; tvaTolerance: number; annualCA: number
    tvaPercent: number; tvaStatus: string; pendingCount: number; currentYear: number
    months: Array<{
      period: string; month: number; label: string; ca: number
      cotisations: number; status: string; declaredAt: string | null
      isPast: boolean; isCurrent: boolean; hasCA: boolean
    }>
  } | null>(null)
  const [urssafLoading, setUrssafLoading] = useState(false)
  const [showUrssaf, setShowUrssaf] = useState(false)

  // Auto-catégorisation
  const [categorySuggestion, setCategorySuggestion] = useState<string | null>(null)
  const categorizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Récurrences détectées
  const [recurrences, setRecurrences] = useState<Array<{
    description: string; category: string; type: 'INCOME' | 'EXPENSE'
    avgAmount: number; occurrences: number; lastDate: string; label: string
  }>>([])
  const [dismissedRecurrences, setDismissedRecurrences] = useState<Set<string>>(new Set())

  // Hydration-safe current date display
  const [todayLabel, setTodayLabel] = useState('')

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    )
    setFormDate(new Date().toISOString().split('T')[0])
  }, [])

  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true)
    try {
      const res = await fetch('/api/cash/transactions')
      if (!res.ok) throw new Error('Erreur chargement transactions')
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (e) {
      console.error('[cash/page fetchTransactions]', e)
    } finally {
      setLoadingTx(false)
    }
  }, [])

  const fetchRunway = useCallback(async () => {
    setLoadingRunway(true)
    try {
      const res = await fetch('/api/cash/runway')
      if (!res.ok) throw new Error('Erreur chargement runway')
      const data = await res.json()
      setRunway(data)
    } catch (e) {
      console.error('[cash/page fetchRunway]', e)
    } finally {
      setLoadingRunway(false)
    }
  }, [])
  // ─── Récurrences ──────────────────────────────────────────────────────────────
  const fetchRecurrences = useCallback(async () => {
    try {
      const res = await fetch('/api/cash/recurrences')
      if (res.ok) {
        const data = await res.json()
        setRecurrences(data.suggestions || [])
      }
    } catch { /* ignore */ }
  }, [])

  // ─── URSSAF + TVA ─────────────────────────────────────────────────────────────
  const fetchUrssaf = useCallback(async () => {
    setUrssafLoading(true)
    try {
      const res = await fetch('/api/cash/urssaf')
      if (res.ok) {
        const data = await res.json()
        setUrssaf(data)
      }
    } catch { /* ignore */ } finally {
      setUrssafLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
    fetchRunway()
    fetchRecurrences()
    fetchUrssaf()
  }, [fetchTransactions, fetchRunway, fetchRecurrences, fetchUrssaf])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/cash/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(formAmount),
          type: formType,
          category: formCategory,
          description: formDescription,
          date: formDate,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur lors de la création')
      }
      setShowForm(false)
      setFormAmount('')
      setFormCategory('')
      setFormDescription('')
      await fetchTransactions()
      await fetchRunway()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      console.error('[cash/page handleSubmit]', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/cash/transactions?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      setTransactions(prev => prev.filter(t => t.id !== id))
      await fetchRunway()
    } catch (e) {
      console.error('[cash/page handleDelete]', e)
    } finally {
      setDeletingId(null)
    }
  }

  // ─── OCR Ticket ──────────────────────────────────────────────────────────────
  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    setShowForm(true)
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
      const res = await fetch('/api/cash/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur OCR')
      setFormAmount(String(data.amount))
      setFormType(data.type)
      setFormCategory(data.category)
      setFormDescription(data.description)
      setFormDate(data.date)
      setCategorySuggestion(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible d\'analyser le ticket')
    } finally {
      setOcrLoading(false)
      if (ocrInputRef.current) ocrInputRef.current.value = ''
    }
  }

  // ─── Auto-catégorisation ──────────────────────────────────────────────────────
  const handleDescriptionChange = (value: string) => {
    setFormDescription(value)
    setCategorySuggestion(null)
    if (categorizeTimeoutRef.current) clearTimeout(categorizeTimeoutRef.current)
    if (value.trim().length < 4) return
    categorizeTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/cash/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: value, type: formType }),
        })
        const data = await res.json()
        if (data.category && data.category !== formCategory) {
          setCategorySuggestion(data.category)
        }
      } catch { /* ignore */ }
    }, 700)
  }

  const handleBriefParsed = (data: BriefTransaction) => {
    setShowBriefModal(false)
    setFormAmount(String(data.amount))
    setFormType(data.type)
    setFormCategory(data.category)
    setFormDescription(data.description)
    setFormDate(data.date)
    setError(null)
    setShowForm(true)
  }

  const pessimisticAlert = runway && runway.runway.pessimistic.months < 2

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Alerte runway critique */}
      {pessimisticAlert && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6">
          <span className="text-xl">🚨</span>
          <div>
            <p className="text-sm font-semibold text-red-400">Alerte trésorerie critique</p>
            <p className="text-xs text-red-300/80 mt-0.5">
              Scénario pessimiste : seulement {runway.runway.pessimistic.months} mois de runway.
              Prenez des mesures immédiatement.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Trésorerie 💰</h1>
          <p className="text-sm text-[#6b7280] mt-1 capitalize">{todayLabel}</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError(null) }}
          className="flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors whitespace-nowrap"
        >
          {showForm ? '✕ Annuler' : '+ Ajouter une transaction'}
        </button>
        <button
          onClick={() => setShowBriefModal(true)}
          className="flex items-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors whitespace-nowrap"
        >
          ✍️ Brief
        </button>
        {/* OCR Ticket */}
        <button
          onClick={() => ocrInputRef.current?.click()}
          disabled={ocrLoading}
          className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {ocrLoading ? '⏳ Analyse...' : '📸 Scanner ticket'}
        </button>
        <input
          ref={ocrInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleOCR}
        />
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Solde */}
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Solde total</p>
          {loadingRunway ? (
            <div className="h-8 bg-[#2a2a42] rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold ${
              (runway?.currentBalance ?? 0) >= 0 ? 'text-white' : 'text-red-400'
            }`}>
              {fmt(runway?.currentBalance ?? 0)} €
            </p>
          )}
          <p className="text-xs text-[#4b5563] mt-1">Cumul toutes périodes</p>
        </div>
        {/* CA mois */}
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">CA du mois</p>
          {loadingRunway ? (
            <div className="h-8 bg-[#2a2a42] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-green-400">
              +{fmt(runway?.monthlyIncome ?? 0)} €
            </p>
          )}
          <p className="text-xs text-[#4b5563] mt-1">Revenus mois en cours</p>
        </div>
        {/* Charges mois */}
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Charges mois</p>
          {loadingRunway ? (
            <div className="h-8 bg-[#2a2a42] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-red-400">
              -{fmt(runway?.monthlyExpenses ?? 0)} €
            </p>
          )}
          <p className="text-xs text-[#4b5563] mt-1">Dépenses mois en cours</p>
        </div>
        {/* Objectif */}
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Objectif mensuel</p>
          {loadingRunway ? (
            <div className="h-8 bg-[#2a2a42] rounded animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-white">
                {runway?.goalProgress ?? 0}%
              </p>
              <div className="mt-2 h-1.5 bg-[#2a2a42] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4f46e5] rounded-full transition-all"
                  style={{ width: `${Math.min(runway?.goalProgress ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#4b5563] mt-1">
                {fmt(runway?.monthlyIncome ?? 0)} / {fmt(runway?.monthlyGoal ?? 0)} €
              </p>
            </>
          )}
        </div>
      </div>

      {/* Runway Section */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-white mb-4">⏳ Runway de trésorerie</h2>
        {loadingRunway ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 bg-[#151524] border border-[#2a2a42] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : runway ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pessimiste */}
            <div className="bg-[#151524] border border-red-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔴</span>
                <span className="text-sm font-semibold text-red-400">Scénario pessimiste</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {runway.runway.pessimistic.months} <span className="text-lg font-normal text-[#6b7280]">mois</span>
              </p>
              <p className="text-xs text-[#6b7280]">
                Jusqu&apos;en {fmtRunwayDate(runway.runway.pessimistic.date)}
              </p>
              <p className="text-xs text-red-400/70 mt-2">Charges maximales projetées</p>
            </div>
            {/* Réaliste */}
            <div className="bg-[#151524] border border-yellow-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🟡</span>
                <span className="text-sm font-semibold text-yellow-400">Scénario réaliste</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {runway.runway.realistic.months} <span className="text-lg font-normal text-[#6b7280]">mois</span>
              </p>
              <p className="text-xs text-[#6b7280]">
                Jusqu&apos;en {fmtRunwayDate(runway.runway.realistic.date)}
              </p>
              <p className="text-xs text-yellow-400/70 mt-2">Projection tendance actuelle</p>
            </div>
            {/* Optimiste */}
            <div className="bg-[#151524] border border-green-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🟢</span>
                <span className="text-sm font-semibold text-green-400">Scénario optimiste</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {runway.runway.optimistic.months} <span className="text-lg font-normal text-[#6b7280]">mois</span>
              </p>
              <p className="text-xs text-[#6b7280]">
                Jusqu&apos;en {fmtRunwayDate(runway.runway.optimistic.date)}
              </p>
              <p className="text-xs text-green-400/70 mt-2">Charges minimales projetées</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6b7280]">Aucune donnée de trésorerie disponible.</p>
        )}
      </div>

      {/* ─── Obligations Légales ─────────────────────────────────────────── */}
      <div className="bg-[#151524] border border-[#2a2a42] rounded-xl mb-6 overflow-hidden">
        <button
          onClick={() => { setShowUrssaf(v => !v); if (!urssaf) fetchUrssaf() }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1a1a2e] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Obligations légales</p>
              <p className="text-xs text-[#6b7280]">
                {urssaf ? (
                  <span className={urssaf.tvaStatus === 'OK' ? 'text-green-400' : urssaf.tvaStatus === 'WARNING' ? 'text-yellow-400' : 'text-red-400'}>
                    TVA {fmt(urssaf.annualCA)} / {fmt(urssaf.tvaThreshold)} €
                    {urssaf.pendingCount > 0 && <span className="ml-2 text-amber-400">· {urssaf.pendingCount} décl. URSSAF en attente</span>}
                  </span>
                ) : 'URSSAF · TVA · Déclarations mensuelles'}
              </p>
            </div>
          </div>
          <span className="text-[#6b7280]">{showUrssaf ? '▲' : '▼'}</span>
        </button>

        {showUrssaf && (
          <div className="border-t border-[#2a2a42] p-6 space-y-6">

            {urssafLoading ? (
              <div className="space-y-3">
                <div className="h-16 bg-[#1e1e30] rounded-xl animate-pulse" />
                <div className="h-32 bg-[#1e1e30] rounded-xl animate-pulse" />
              </div>
            ) : urssaf ? (
              <>
                {/* TVA Tracker */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">🏦 Franchise TVA en base</h3>
                      <p className="text-xs text-[#6b7280] mt-0.5">
                        Seuil {urssaf.activityType === 'COMMERCE' ? 'commerce' : 'services'} — {fmt(urssaf.tvaThreshold)} € / an
                        <span className="ml-2 text-[#4b5563]">(tolérance {fmt(urssaf.tvaTolerance)} €)</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        urssaf.tvaStatus === 'EXCEEDED' ? 'text-red-400'
                          : urssaf.tvaStatus === 'TOLERANCE' ? 'text-orange-400'
                          : urssaf.tvaStatus === 'WARNING' ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}>{urssaf.tvaPercent}%</p>
                      <p className="text-xs text-[#6b7280]">{fmt(urssaf.annualCA)} € CA {urssaf.currentYear}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="relative h-3 bg-[#1e1e30] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        urssaf.tvaStatus === 'EXCEEDED' ? 'bg-red-500'
                          : urssaf.tvaStatus === 'TOLERANCE' ? 'bg-orange-500'
                          : urssaf.tvaStatus === 'WARNING' ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(urssaf.tvaPercent, 100)}%` }}
                    />
                    {/* 80% marker */}
                    <div className="absolute top-0 h-full border-l border-yellow-400/40" style={{ left: '80%' }} />
                  </div>
                  {urssaf.tvaStatus === 'EXCEEDED' && (
                    <p className="text-xs text-red-400 mt-2 font-medium">⚠️ Seuil de tolérance dépassé — vous devez demander un numéro de TVA</p>
                  )}
                  {urssaf.tvaStatus === 'TOLERANCE' && (
                    <p className="text-xs text-orange-400 mt-2">⚠️ Entre seuil et tolérance — régularisation TVA à prévoir</p>
                  )}
                  {urssaf.tvaStatus === 'WARNING' && (
                    <p className="text-xs text-yellow-400 mt-2">⚡ Vous approchez du seuil de franchise TVA</p>
                  )}
                  {urssaf.tvaStatus === 'OK' && urssaf.tvaPercent < 50 && (
                    <p className="text-xs text-green-400 mt-2">✅ En franchise de TVA — restant : {fmt(urssaf.tvaThreshold - urssaf.annualCA)} €</p>
                  )}
                </div>

                {/* Activity type selector */}
                <div className="flex items-center gap-4 pt-2 border-t border-[#2a2a42]">
                  <label className="text-xs text-[#818cf8] font-medium whitespace-nowrap">Type d&apos;activité :</label>
                  <select
                    value={urssaf.activityType}
                    onChange={async e => {
                      await fetch('/api/cash/urssaf', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ activityType: e.target.value }),
                      })
                      fetchUrssaf()
                    }}
                    className="bg-[#1e1e30] border border-[#2a2a42] text-white text-xs rounded px-2 py-1.5 outline-none"
                  >
                    <option value="SERVICE_BNC">Prestation services BNC (22%) — seuil 36 800€</option>
                    <option value="SERVICE_BIC">Prestation services BIC (22.9%) — seuil 36 800€</option>
                    <option value="COMMERCE">Vente marchandises / hébergement (12.3%) — seuil 91 900€</option>
                    <option value="LIBERAL">Libéral réglementé CIPAV (22.2%) — seuil 36 800€</option>
                  </select>
                </div>

                {/* URSSAF monthly declarations */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">🏛️ Déclarations URSSAF {urssaf.currentYear}</h3>
                    <span className="text-xs text-[#818cf8]">Taux : {urssaf.urssafRate}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {urssaf.months.map(month => (
                      <div
                        key={month.period}
                        className={`rounded-lg p-3 border ${
                          month.status === 'DECLARED'
                            ? 'bg-green-500/5 border-green-500/20'
                            : month.isPast && month.hasCA
                              ? 'bg-amber-500/5 border-amber-500/30'
                              : 'bg-[#1e1e30] border-[#2a2a42]'
                        }`}
                      >
                        <p className="text-[11px] text-[#818cf8] font-medium capitalize truncate">{month.label.split(' ')[0]}</p>
                        <p className="text-sm font-bold text-white mt-0.5">{fmt(month.ca)} €</p>
                        <p className="text-[10px] text-[#6b7280] mt-0.5">Cotis. : {fmt(month.cotisations)} €</p>
                        {month.status === 'DECLARED' ? (
                          <p className="text-[10px] text-green-400 mt-1.5 font-medium">✅ Déclaré</p>
                        ) : month.isPast && month.hasCA ? (
                          <button
                            onClick={async () => {
                              await fetch('/api/cash/urssaf', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ period: month.period, ca: month.ca, cotisations: month.cotisations }),
                              })
                              fetchUrssaf()
                            }}
                            className="mt-1.5 w-full text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded px-1 py-1 transition-colors"
                          >
                            Marquer déclaré
                          </button>
                        ) : month.isCurrent ? (
                          <p className="text-[10px] text-indigo-400 mt-1.5">⏳ En cours</p>
                        ) : (
                          <p className="text-[10px] text-[#4b5563] mt-1.5">— CA nul</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {urssaf.pendingCount > 0 && (
                    <p className="text-xs text-amber-400 mt-3">
                      ⚠️ {urssaf.pendingCount} mois à déclarer — n&apos;oubliez pas votre déclaration URSSAF sur <a href="https://www.autoentrepreneur.urssaf.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">autoentrepreneur.urssaf.fr</a>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-[#6b7280]">Chargement des données fiscales...</p>
            )}
          </div>
        )}
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-6 mb-8">
          <h2 className="text-base font-semibold text-white mb-4">Nouvelle transaction</h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#818cf8] mb-1 block font-medium">Montant (€)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#818cf8] mb-1 block font-medium">Type</label>
                <div className="flex rounded-lg overflow-hidden border border-[#2a2a42]">
                  <button
                    type="button"
                    onClick={() => setFormType('INCOME')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      formType === 'INCOME'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-[#1e1e30] text-[#6b7280] hover:text-white'
                    }`}
                  >
                    📈 Revenu
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('EXPENSE')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      formType === 'EXPENSE'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-[#1e1e30] text-[#6b7280] hover:text-white'
                    }`}
                  >
                    📉 Dépense
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#818cf8] mb-1 block font-medium">Catégorie</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  required
                  className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors"
                >
                  <option value="" disabled>Choisir une catégorie</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-[#818cf8] mb-1 block font-medium">
                  Description
                  {categorySuggestion && (
                    <span className="ml-2 text-[10px] text-indigo-400">Catégorie suggérée :</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={e => handleDescriptionChange(e.target.value)}
                  placeholder="Description de la transaction"
                  className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors"
                />
                {categorySuggestion && (
                  <button
                    type="button"
                    onClick={() => { setFormCategory(categorySuggestion); setCategorySuggestion(null) }}
                    className="mt-1.5 flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    🏷️ Appliquer : <strong>{categorySuggestion}</strong>
                    <span className="text-indigo-500 ml-1">✓</span>
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs text-[#818cf8] mb-1 block font-medium">Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-60 text-white font-medium rounded-lg px-6 py-2.5 text-sm transition-colors"
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer la transaction'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Récurrences détectées */}
      {recurrences.filter(r => !dismissedRecurrences.has(r.description)).length > 0 && (
        <div className="mb-6 bg-[#151524] border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400">🔁</span>
            <h3 className="text-sm font-semibold text-amber-400">Récurrences détectées</h3>
            <span className="text-xs text-[#6b7280]">— Transactions répétées dans vos données</span>
          </div>
          <div className="space-y-2">
            {recurrences
              .filter(r => !dismissedRecurrences.has(r.description))
              .map((r) => (
                <div key={r.description} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#1e1e30] border border-[#2a2a42] rounded-lg px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium ${
                        r.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {r.type === 'INCOME' ? '📈' : '📉'} {r.type === 'INCOME' ? '+' : '-'}{fmt(r.avgAmount)} €
                      </span>
                      <span className="text-xs text-amber-300/70 bg-amber-500/10 rounded px-1.5 py-0.5">{r.label}</span>
                      <span className="text-xs text-[#818cf8]">{r.category}</span>
                    </div>
                    <p className="text-xs text-[#6b7280] truncate mt-0.5">{r.description} · {r.occurrences}× détecté(s)</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setFormAmount(String(r.avgAmount))
                        setFormType(r.type)
                        setFormCategory(r.category)
                        setFormDescription(r.description)
                        setFormDate(new Date().toISOString().split('T')[0])
                        setShowForm(true)
                        setDismissedRecurrences(prev => new Set([...prev, r.description]))
                      }}
                      className="text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded px-2.5 py-1.5 transition-colors whitespace-nowrap"
                    >
                      + Ajouter
                    </button>
                    <button
                      onClick={() => setDismissedRecurrences(prev => new Set([...prev, r.description]))}
                      className="text-xs text-[#4b5563] hover:text-[#6b7280] rounded px-1.5 py-1.5 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-[#151524] rounded-xl overflow-hidden border border-[#2a2a42]">
        <div className="px-6 py-4 border-b border-[#2a2a42] flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Transactions récentes</h2>
          <span className="text-xs text-[#6b7280]">{transactions.length} enregistrements</span>
        </div>

        {loadingTx ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-[#1e1e30] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-sm text-[#6b7280]">Aucune transaction enregistrée</p>
            <p className="text-xs text-[#4b5563] mt-1">Ajoutez votre première transaction ci-dessus</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1e1e30]">
                  {['Date', 'Description', 'Catégorie', 'Montant', ''].map((col, i) => (
                    <th
                      key={i}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#818cf8]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map(tx => (
                  <tr
                    key={tx.id}
                    className="border-b border-[#2a2a42] hover:bg-[#1e1e30] transition-colors last:border-0 group"
                  >
                    <td className="px-4 py-3 text-xs text-[#9ca3af] whitespace-nowrap">
                      {fmtDate(tx.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white max-w-xs truncate">
                      {tx.description || <span className="text-[#4b5563] italic">Sans description</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-[#2a2a42] text-[#818cf8] px-2 py-1 rounded-md whitespace-nowrap">
                        {tx.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${
                      tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)} €
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        title="Supprimer"
                        className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-red-400 disabled:opacity-50 transition-all text-sm"
                      >
                        {deletingId === tx.id ? '⏳' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showBriefModal && (
        <CashBriefModal
          onClose={() => setShowBriefModal(false)}
          onParsed={handleBriefParsed}
        />
      )}
    </div>
  )
}
