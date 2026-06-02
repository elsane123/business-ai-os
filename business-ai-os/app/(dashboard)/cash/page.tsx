'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Transaction {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  description: string
  date: string
  tvaRate: number
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

const TVA_OPTIONS = [
  { value: 0, label: '0% (franchise / exonéré)' },
  { value: 5.5, label: '5,5% (taux réduit)' },
  { value: 10, label: '10% (taux intermédiaire)' },
  { value: 20, label: '20% (taux normal)' },
]

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDec(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

function calcHT(ttc: number, tvaRate: number): number {
  if (!tvaRate) return ttc
  return ttc / (1 + tvaRate / 100)
}

// ─── Transaction Modal (Create + Edit) ───────────────────────────────────────

type TransactionFormData = {
  amount: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  description: string
  date: string
  tvaRate: number
}

function TransactionModal({
  initial,
  editId,
  onClose,
  onSuccess,
}: {
  initial?: Partial<TransactionFormData>
  editId?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState(initial?.amount ?? '')
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(initial?.type ?? 'INCOME')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split('T')[0])
  const [tvaRate, setTvaRate] = useState<number>(initial?.tvaRate ?? 0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categorySuggestion, setCategorySuggestion] = useState<string | null>(null)
  const categorizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isEdit = !!editId

  const amountNum = parseFloat(amount) || 0
  const htAmount = calcHT(amountNum, tvaRate)
  const tvaAmount = amountNum - htAmount

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    setCategorySuggestion(null)
    if (categorizeTimeoutRef.current) clearTimeout(categorizeTimeoutRef.current)
    if (value.trim().length < 4) return
    categorizeTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/cash/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: value, type }),
        })
        const data = await res.json()
        if (data.category && data.category !== category) {
          setCategorySuggestion(data.category)
        }
      } catch { /* ignore */ }
    }, 700)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        amount: parseFloat(amount),
        type,
        category,
        description,
        date,
        tvaRate,
      }
      const res = isEdit
        ? await fetch(`/api/cash/transactions/${editId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/cash/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur')
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#151524] border border-[#2a2a42] rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a42] sticky top-0 bg-[#151524] z-10">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? '✏️ Modifier la transaction' : '➕ Nouvelle transaction'}
            </h2>
            <p className="text-xs text-[#6b7280] mt-0.5">Tous les montants sont saisis en TTC</p>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a42] transition-colors">&times;</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-xs text-red-400">⚠️ {error}</p>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="text-xs text-[#818cf8] mb-2 block font-medium uppercase tracking-wider">Type</label>
            <div className="flex rounded-xl overflow-hidden border border-[#2a2a42]">
              <button type="button" onClick={() => setType('INCOME')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  type === 'INCOME' ? 'bg-green-500/20 text-green-400' : 'bg-[#1e1e30] text-[#6b7280] hover:text-white'
                }`}>
                📈 Revenu
              </button>
              <button type="button" onClick={() => setType('EXPENSE')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  type === 'EXPENSE' ? 'bg-red-500/20 text-red-400' : 'bg-[#1e1e30] text-[#6b7280] hover:text-white'
                }`}>
                📉 Dépense
              </button>
            </div>
          </div>

          {/* Montant TTC + TVA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#818cf8] mb-1.5 block font-medium">
                Montant <span className="text-[#4f46e5] font-semibold">TTC</span> (€)
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-xl px-3 py-2.5 text-sm w-full outline-none transition-colors"
              />
              {amountNum > 0 && tvaRate > 0 && (
                <div className="mt-1.5 text-xs text-[#6b7280] space-y-0.5">
                  <p>HT : <span className="text-white font-medium">{fmtDec(htAmount)} €</span></p>
                  <p>TVA {tvaRate}% : <span className="text-amber-400 font-medium">{fmtDec(tvaAmount)} €</span></p>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-[#818cf8] mb-1.5 block font-medium">Taux TVA</label>
              <select
                value={tvaRate}
                onChange={e => setTvaRate(parseFloat(e.target.value))}
                className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-xl px-3 py-2.5 text-sm w-full outline-none transition-colors"
              >
                {TVA_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[#818cf8] mb-1.5 block font-medium">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => handleDescriptionChange(e.target.value)}
              placeholder="Description de la transaction"
              className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-xl px-3 py-2.5 text-sm w-full outline-none transition-colors"
            />
            {categorySuggestion && (
              <button
                type="button"
                onClick={() => { setCategory(categorySuggestion); setCategorySuggestion(null) }}
                className="mt-1.5 flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
              >
                🏷️ Catégorie suggérée : <strong>{categorySuggestion}</strong> <span className="text-indigo-500 ml-1">✓ Appliquer</span>
              </button>
            )}
          </div>

          {/* Catégorie + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#818cf8] mb-1.5 block font-medium">Catégorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
                className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-xl px-3 py-2.5 text-sm w-full outline-none transition-colors"
              >
                <option value="" disabled>Choisir...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#818cf8] mb-1.5 block font-medium">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-xl px-3 py-2.5 text-sm w-full outline-none transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a42] text-[#6b7280] hover:text-white transition-colors text-sm">
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2">
              {submitting ? (
                <><span className="animate-spin inline-block">⏳</span> Enregistrement...</>
              ) : (
                isEdit ? '✏️ Modifier' : '✅ Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
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
  const [parsed, setParsed] = useState<BriefTransaction | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brief.trim()) return
    setLoading(true)
    setError('')
    setParsed(null)
    try {
      const res = await fetch('/api/cash/parse-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setParsed(data.transaction)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse")
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    if (parsed) onParsed(parsed)
  }

  const typeLabel = parsed?.type === 'INCOME' ? 'Revenu' : 'Dépense'
  const typeIcon = parsed?.type === 'INCOME' ? '📈' : '📉'
  const typeColor = parsed?.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
  const sign = parsed?.type === 'INCOME' ? '+' : '-'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#151524] border border-[#2a2a42] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a42]">
          <div>
            <h2 className="text-lg font-semibold text-white">✍️ Transaction depuis un brief</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">L&apos;IA analyse votre texte et pré-remplit la transaction</p>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a42] transition-colors">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {!parsed ? (
            <form onSubmit={handleSubmit} className="space-y-4">
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
          ) : (
            <div className="space-y-4">
              {/* Résumé phrase */}
              <div className="bg-[#1a1a2e] border border-indigo-500/20 rounded-xl px-4 py-4">
                <p className="text-xs text-indigo-400 font-medium mb-2 uppercase tracking-wider">✨ Transaction détectée</p>
                <p className="text-sm text-white leading-relaxed">
                  {typeIcon} <span className={`font-semibold ${typeColor}`}>{typeLabel}</span> de{' '}
                  <span className={`font-bold text-base ${typeColor}`}>{sign}{fmtDec(parsed.amount)} €</span>
                  {' '}— <span className="text-[#818cf8]">{parsed.category}</span>
                  {' '}— <span className="text-[#9ca3af]">{parsed.description}</span>
                  {' '}le <span className="text-white font-medium">{fmtDate(parsed.date)}</span>
                </p>
              </div>

              {/* Champs résumé */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1e1e30] rounded-xl px-3 py-2.5">
                  <p className="text-xs text-[#6b7280] mb-0.5">Montant TTC</p>
                  <p className={`text-sm font-bold ${typeColor}`}>{sign}{fmtDec(parsed.amount)} €</p>
                </div>
                <div className="bg-[#1e1e30] rounded-xl px-3 py-2.5">
                  <p className="text-xs text-[#6b7280] mb-0.5">Type</p>
                  <p className="text-sm font-medium text-white">{typeIcon} {typeLabel}</p>
                </div>
                <div className="bg-[#1e1e30] rounded-xl px-3 py-2.5">
                  <p className="text-xs text-[#6b7280] mb-0.5">Catégorie</p>
                  <p className="text-sm font-medium text-[#818cf8]">{parsed.category}</p>
                </div>
                <div className="bg-[#1e1e30] rounded-xl px-3 py-2.5">
                  <p className="text-xs text-[#6b7280] mb-0.5">Date</p>
                  <p className="text-sm font-medium text-white">{fmtDate(parsed.date)}</p>
                </div>
              </div>
              <div className="bg-[#1e1e30] rounded-xl px-3 py-2.5">
                <p className="text-xs text-[#6b7280] mb-0.5">Description</p>
                <p className="text-sm text-white">{parsed.description}</p>
              </div>

              <p className="text-xs text-[#6b7280] text-center">Vous pourrez ajuster les champs dans le formulaire</p>

              <div className="flex gap-3">
                <button type="button" onClick={() => setParsed(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2a2a42] text-[#6b7280] hover:text-white transition-colors text-sm"
                >← Réécrire</button>
                <button type="button" onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium text-sm transition-colors"
                >✅ Confirmer &amp; éditer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CashPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [runway, setRunway] = useState<RunwayData | null>(null)
  const [loadingTx, setLoadingTx] = useState(true)
  const [loadingRunway, setLoadingRunway] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showBriefModal, setShowBriefModal] = useState(false)

  // Modal state: null = closed, 'create' = new, or Transaction for edit
  const [modalMode, setModalMode] = useState<null | 'create' | Transaction>(null)

  // OCR état
  const [ocrLoading, setOcrLoading] = useState(false)
  const ocrInputRef = useRef<HTMLInputElement>(null)

  // URSSAF + TVA état
  const [urssaf, setUrssaf] = useState<{
    activityType: string; urssafRate: number; cfpRate: number; vflRate: number
    versementLiberatoire: boolean; urssafPeriodicity: string
    tvaThreshold: number; tvaTolerance: number; annualCA: number
    tvaPercent: number; tvaStatus: string
    caCeiling: number; caPercent: number; caStatus: string
    pendingCount: number; currentYear: number
    months: Array<{
      period: string; month: number; label: string; ca: number
      cotisations: number; cfp: number; vfl: number; totalCharges: number
      status: string; declaredAt: string | null
      isPast: boolean; isCurrent: boolean; hasCA: boolean
    }>
  } | null>(null)
  const [urssafLoading, setUrssafLoading] = useState(false)
  const [showUrssaf, setShowUrssaf] = useState(false)

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
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    )
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

  const fetchRecurrences = useCallback(async () => {
    try {
      const res = await fetch('/api/cash/recurrences')
      if (res.ok) {
        const data = await res.json()
        setRecurrences(data.suggestions || [])
      }
    } catch { /* ignore */ }
  }, [])

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

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/cash/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      setTransactions(prev => prev.filter(t => t.id !== id))
      await fetchRunway()
    } catch (e) {
      console.error('[cash/page handleDelete]', e)
    } finally {
      setDeletingId(null)
    }
  }

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
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
      setModalMode({
        id: '', amount: data.amount, type: data.type, category: data.category,
        description: data.description, date: data.date, tvaRate: 0, createdAt: '',
      })
    } catch (err: unknown) {
      console.error('[cash/page OCR]', err)
    } finally {
      setOcrLoading(false)
      if (ocrInputRef.current) ocrInputRef.current.value = ''
    }
  }

  const handleBriefParsed = (data: BriefTransaction) => {
    setShowBriefModal(false)
    setModalMode({
      id: '', amount: data.amount, type: data.type, category: data.category,
      description: data.description, date: data.date, tvaRate: 0, createdAt: '',
    })
  }

  const pessimisticAlert = runway && runway.runway.pessimistic.months < 2
  const goalAlert = runway &&
    runway.monthlyGoal > 0 &&
    runway.goalProgress < 60 &&
    new Date().getDate() >= 20

  const modalInitial = modalMode && modalMode !== 'create' ? {
    amount: String(modalMode.amount),
    type: modalMode.type,
    category: modalMode.category,
    description: modalMode.description || '',
    date: modalMode.date ? new Date(modalMode.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    tvaRate: modalMode.tvaRate || 0,
  } : undefined

  const modalEditId = modalMode && modalMode !== 'create' && modalMode.id ? modalMode.id : undefined

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Transaction Modal */}
      {modalMode !== null && (
        <TransactionModal
          initial={modalInitial}
          editId={modalEditId}
          onClose={() => setModalMode(null)}
          onSuccess={async () => { await fetchTransactions(); await fetchRunway() }}
        />
      )}

      {/* Brief Modal */}
      {showBriefModal && (
        <CashBriefModal
          onClose={() => setShowBriefModal(false)}
          onParsed={handleBriefParsed}
        />
      )}

      {/* Alerte runway critique */}
      {pessimisticAlert && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
          <span className="text-xl">🚨</span>
          <div>
            <p className="text-sm font-semibold text-red-400">Alerte trésorerie critique</p>
            <p className="text-xs text-red-300/80 mt-0.5">
              Scénario pessimiste : seulement {runway.runway.pessimistic.months} mois de runway. Prenez des mesures immédiatement.
            </p>
          </div>
        </div>
      )}

      {/* Alerte objectif mensuel à risque */}
      {goalAlert && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-6">
          <span className="text-xl">⚡</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-400">Objectif mensuel à risque</p>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Vous êtes à {runway?.goalProgress ?? 0}% de votre objectif et il reste peu de jours ce mois-ci.
              Il manque <span className="font-semibold">{new Intl.NumberFormat('fr-FR').format(Math.max(0, Math.round(((runway?.monthlyGoal ?? 0) - (runway?.monthlyIncome ?? 0)) * 100) / 100))} €</span> pour atteindre {new Intl.NumberFormat('fr-FR').format(runway?.monthlyGoal ?? 0)} €.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Trésorerie 💰</h1>
          <p className="text-sm text-[#6b7280] mt-1 capitalize">{todayLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setModalMode('create')}
            className="flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors whitespace-nowrap"
          >
            ➕ Ajouter une transaction
          </button>
          <button
            onClick={() => setShowBriefModal(true)}
            className="flex items-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors whitespace-nowrap"
          >
            ✍️ Brief IA
          </button>
          <button
            onClick={() => ocrInputRef.current?.click()}
            disabled={ocrLoading}
            className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {ocrLoading ? '⏳ Analyse...' : '📸 Scanner ticket'}
          </button>
          <input ref={ocrInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleOCR} />
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Solde total</p>
          {loadingRunway ? <div className="h-8 bg-[#2a2a42] rounded animate-pulse" /> : (
            <p className={`text-2xl font-bold ${(runway?.currentBalance ?? 0) >= 0 ? 'text-white' : 'text-red-400'}`}>
              {fmt(runway?.currentBalance ?? 0)} €
            </p>
          )}
          <p className="text-xs text-[#4b5563] mt-1">Cumul toutes périodes</p>
        </div>
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">CA du mois</p>
          {loadingRunway ? <div className="h-8 bg-[#2a2a42] rounded animate-pulse" /> : (
            <p className="text-2xl font-bold text-green-400">+{fmt(runway?.monthlyIncome ?? 0)} €</p>
          )}
          <p className="text-xs text-[#4b5563] mt-1">Revenus mois en cours</p>
        </div>
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Charges mois</p>
          {loadingRunway ? <div className="h-8 bg-[#2a2a42] rounded animate-pulse" /> : (
            <p className="text-2xl font-bold text-red-400">-{fmt(runway?.monthlyExpenses ?? 0)} €</p>
          )}
          <p className="text-xs text-[#4b5563] mt-1">Dépenses mois en cours</p>
        </div>
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Objectif mensuel</p>
          {loadingRunway ? <div className="h-8 bg-[#2a2a42] rounded animate-pulse" /> : (
            <>
              <p className="text-2xl font-bold text-white">{runway?.goalProgress ?? 0}%</p>
              <div className="mt-2 h-1.5 bg-[#2a2a42] rounded-full overflow-hidden">
                <div className="h-full bg-[#4f46e5] rounded-full transition-all" style={{ width: `${Math.min(runway?.goalProgress ?? 0, 100)}%` }} />
              </div>
              <p className="text-xs text-[#4b5563] mt-1">{fmt(runway?.monthlyIncome ?? 0)} / {fmt(runway?.monthlyGoal ?? 0)} €</p>
            </>
          )}
        </div>
      </div>

      {/* Runway */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-white mb-4">⏳ Runway de trésorerie</h2>
        {loadingRunway ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-36 bg-[#151524] border border-[#2a2a42] rounded-xl animate-pulse" />)}
          </div>
        ) : runway ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#151524] border border-red-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3"><span className="text-xl">🔴</span><span className="text-sm font-semibold text-red-400">Scénario pessimiste</span></div>
              <p className="text-3xl font-bold text-white mb-1">{runway.runway.pessimistic.months} <span className="text-lg font-normal text-[#6b7280]">mois</span></p>
              <p className="text-xs text-[#6b7280]">Jusqu&apos;en {fmtRunwayDate(runway.runway.pessimistic.date)}</p>
              <p className="text-xs text-red-400/70 mt-2">Charges maximales projetées</p>
            </div>
            <div className="bg-[#151524] border border-yellow-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3"><span className="text-xl">🟡</span><span className="text-sm font-semibold text-yellow-400">Scénario réaliste</span></div>
              <p className="text-3xl font-bold text-white mb-1">{runway.runway.realistic.months} <span className="text-lg font-normal text-[#6b7280]">mois</span></p>
              <p className="text-xs text-[#6b7280]">Jusqu&apos;en {fmtRunwayDate(runway.runway.realistic.date)}</p>
              <p className="text-xs text-yellow-400/70 mt-2">Projection tendance actuelle</p>
            </div>
            <div className="bg-[#151524] border border-green-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3"><span className="text-xl">🟢</span><span className="text-sm font-semibold text-green-400">Scénario optimiste</span></div>
              <p className="text-3xl font-bold text-white mb-1">{runway.runway.optimistic.months} <span className="text-lg font-normal text-[#6b7280]">mois</span></p>
              <p className="text-xs text-[#6b7280]">Jusqu&apos;en {fmtRunwayDate(runway.runway.optimistic.date)}</p>
              <p className="text-xs text-green-400/70 mt-2">Charges minimales projetées</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6b7280]">Aucune donnée de trésorerie disponible.</p>
        )}
      </div>

      {/* Obligations Légales */}
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
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">🏦 Franchise TVA en base</h3>
                      <p className="text-xs text-[#6b7280] mt-0.5">Seuil {urssaf.activityType === 'COMMERCE' ? 'commerce' : 'services'} — {fmt(urssaf.tvaThreshold)} € / an <span className="ml-2 text-[#4b5563]">(tolérance {fmt(urssaf.tvaTolerance)} €)</span></p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${urssaf.tvaStatus === 'EXCEEDED' ? 'text-red-400' : urssaf.tvaStatus === 'TOLERANCE' ? 'text-orange-400' : urssaf.tvaStatus === 'WARNING' ? 'text-yellow-400' : 'text-green-400'}`}>{urssaf.tvaPercent}%</p>
                      <p className="text-xs text-[#6b7280]">{fmt(urssaf.annualCA)} € CA {urssaf.currentYear}</p>
                    </div>
                  </div>
                  <div className="relative h-3 bg-[#1e1e30] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${urssaf.tvaStatus === 'EXCEEDED' ? 'bg-red-500' : urssaf.tvaStatus === 'TOLERANCE' ? 'bg-orange-500' : urssaf.tvaStatus === 'WARNING' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(urssaf.tvaPercent, 100)}%` }} />
                    <div className="absolute top-0 h-full border-l border-yellow-400/40" style={{ left: '80%' }} />
                  </div>
                  {urssaf.tvaStatus === 'EXCEEDED' && <p className="text-xs text-red-400 mt-2 font-medium">⚠️ Seuil de tolérance dépassé — vous devez demander un numéro de TVA</p>}
                  {urssaf.tvaStatus === 'TOLERANCE' && <p className="text-xs text-orange-400 mt-2">⚠️ Entre seuil et tolérance — régularisation TVA à prévoir</p>}
                  {urssaf.tvaStatus === 'WARNING' && <p className="text-xs text-yellow-400 mt-2">⚡ Vous approchez du seuil de franchise TVA</p>}
                  {urssaf.tvaStatus === 'OK' && urssaf.tvaPercent < 50 && <p className="text-xs text-green-400 mt-2">✅ En franchise de TVA — restant : {fmt(urssaf.tvaThreshold - urssaf.annualCA)} €</p>}
                </div>

                {/* Plafond CA régime micro-entrepreneur */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">🏢 Plafond CA micro-entrepreneur</h3>
                      <p className="text-xs text-[#6b7280] mt-0.5">Seuil {urssaf.activityType === 'COMMERCE' ? 'commerce' : 'services'} — {fmt(urssaf.caCeiling)} € / an</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${urssaf.caStatus === 'EXCEEDED' ? 'text-red-400' : urssaf.caStatus === 'WARNING' ? 'text-orange-400' : urssaf.caStatus === 'WATCH' ? 'text-yellow-400' : 'text-green-400'}`}>{urssaf.caPercent}%</p>
                      <p className="text-xs text-[#6b7280]">{fmt(urssaf.annualCA)} € CA {urssaf.currentYear}</p>
                    </div>
                  </div>
                  <div className="relative h-3 bg-[#1e1e30] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${urssaf.caStatus === 'EXCEEDED' ? 'bg-red-500' : urssaf.caStatus === 'WARNING' ? 'bg-orange-500' : urssaf.caStatus === 'WATCH' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(urssaf.caPercent, 100)}%` }} />
                    <div className="absolute top-0 h-full border-l border-yellow-400/40" style={{ left: '70%' }} />
                    <div className="absolute top-0 h-full border-l border-orange-400/40" style={{ left: '90%' }} />
                  </div>
                  {urssaf.caStatus === 'EXCEEDED' && <p className="text-xs text-red-400 mt-2 font-medium">🚨 Plafond dépassé — vous sortez du régime micro-entrepreneur à partir de l&apos;année prochaine</p>}
                  {urssaf.caStatus === 'WARNING' && <p className="text-xs text-orange-400 mt-2">⚠️ Vous approchez du plafond — anticipez le passage au régime réel</p>}
                  {urssaf.caStatus === 'WATCH' && <p className="text-xs text-yellow-400 mt-2">⚡ Restant : {fmt(urssaf.caCeiling - urssaf.annualCA)} € avant sortie du régime micro</p>}
                  {urssaf.caStatus === 'OK' && <p className="text-xs text-green-400 mt-2">✅ Dans les limites du régime micro — restant : {fmt(urssaf.caCeiling - urssaf.annualCA)} €</p>}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#2a2a42]">
                  <label className="text-xs text-[#818cf8] font-medium whitespace-nowrap">Type d&apos;activité :</label>
                  <select value={urssaf.activityType} onChange={async e => { await fetch('/api/cash/urssaf', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activityType: e.target.value }) }); fetchUrssaf() }} className="bg-[#1e1e30] border border-[#2a2a42] text-white text-xs rounded px-2 py-1.5 outline-none">
                    <option value="SERVICE_BNC">Prestation services BNC (22%) — seuil 36 800€</option>
                    <option value="SERVICE_BIC">Prestation services BIC (22.9%) — seuil 36 800€</option>
                    <option value="COMMERCE">Vente marchandises / hébergement (12.3%) — seuil 91 900€</option>
                    <option value="LIBERAL">Libéral réglementé CIPAV (22.2%) — seuil 36 800€</option>
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer ml-auto">
                    <input
                      type="checkbox"
                      checked={urssaf.versementLiberatoire}
                      onChange={async e => { await fetch('/api/cash/urssaf', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ versementLiberatoire: e.target.checked }) }); fetchUrssaf() }}
                      className="w-3.5 h-3.5 accent-indigo-500"
                    />
                    <span className="text-xs text-[#818cf8]">Versement libératoire IR ({urssaf.vflRate}%)</span>
                  </label>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">🏛️ Déclarations URSSAF {urssaf.currentYear}</h3>
                    <span className="text-xs text-[#818cf8]">Taux : {urssaf.urssafRate}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {urssaf.months.map(month => (
                      <div key={month.period} className={`rounded-lg p-3 border ${month.status === 'DECLARED' ? 'bg-green-500/5 border-green-500/20' : month.isPast && month.hasCA ? 'bg-amber-500/5 border-amber-500/30' : 'bg-[#1e1e30] border-[#2a2a42]'}`}>
                        <p className="text-[11px] text-[#818cf8] font-medium capitalize truncate">{month.label.split(' ')[0]}</p>
                        <p className="text-sm font-bold text-white mt-0.5">{fmt(month.ca)} €</p>
                        <p className="text-[10px] text-[#6b7280] mt-0.5">Cotis. : {fmt(month.cotisations)} €</p>
                        {month.cfp > 0 && <p className="text-[10px] text-[#6b7280]">CFP : {fmt(month.cfp)} €</p>}
                        {month.vfl > 0 && <p className="text-[10px] text-indigo-400">VFL : {fmt(month.vfl)} €</p>}
                        {(month.cfp > 0 || month.vfl > 0) && <p className="text-[10px] text-white font-semibold border-t border-[#2a2a42] mt-0.5 pt-0.5">Total : {fmt(month.totalCharges)} €</p>}
                        {month.status === 'DECLARED' ? (
                          <p className="text-[10px] text-green-400 mt-1.5 font-medium">✅ Déclaré</p>
                        ) : month.isPast && month.hasCA ? (
                          <button onClick={async () => { await fetch('/api/cash/urssaf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period: month.period, ca: month.ca, cotisations: month.cotisations }) }); fetchUrssaf() }} className="mt-1.5 w-full text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded px-1 py-1 transition-colors">Marquer déclaré</button>
                        ) : month.isCurrent ? (
                          <p className="text-[10px] text-indigo-400 mt-1.5">⏳ En cours</p>
                        ) : (
                          <p className="text-[10px] text-[#4b5563] mt-1.5">— CA nul</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {urssaf.pendingCount > 0 && (
                    <p className="text-xs text-amber-400 mt-3">⚠️ {urssaf.pendingCount} mois à déclarer — n&apos;oubliez pas votre déclaration URSSAF sur <a href="https://www.autoentrepreneur.urssaf.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">autoentrepreneur.urssaf.fr</a></p>
                  )}
                </div>
              </>
            ) : <p className="text-sm text-[#6b7280]">Chargement des données fiscales...</p>}
          </div>
        )}
      </div>

      {/* Récurrences */}
      {recurrences.filter(r => !dismissedRecurrences.has(r.description)).length > 0 && (
        <div className="mb-6 bg-[#151524] border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400">🔁</span>
            <h3 className="text-sm font-semibold text-amber-400">Récurrences détectées</h3>
            <span className="text-xs text-[#6b7280]">— Transactions répétées dans vos données</span>
          </div>
          <div className="space-y-2">
            {recurrences.filter(r => !dismissedRecurrences.has(r.description)).map((r) => (
              <div key={r.description} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#1e1e30] border border-[#2a2a42] rounded-lg px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium ${r.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                      {r.type === 'INCOME' ? '📈' : '📉'} {r.type === 'INCOME' ? '+' : '-'}{fmt(r.avgAmount)} €
                    </span>
                    <span className="text-xs text-amber-300/70 bg-amber-500/10 rounded px-1.5 py-0.5">{r.label}</span>
                    <span className="text-xs text-[#818cf8]">{r.category}</span>
                  </div>
                  <p className="text-xs text-[#6b7280] truncate mt-0.5">{r.description} · {r.occurrences}× détecté(s)</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setModalMode({ id: '', amount: r.avgAmount, type: r.type, category: r.category, description: r.description, date: new Date().toISOString().split('T')[0], tvaRate: 0, createdAt: '' }); setDismissedRecurrences(prev => new Set([...prev, r.description])) }}
                    className="text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded px-2.5 py-1.5 transition-colors whitespace-nowrap">+ Ajouter</button>
                  <button onClick={() => setDismissedRecurrences(prev => new Set([...prev, r.description]))} className="text-xs text-[#4b5563] hover:text-[#6b7280] rounded px-1.5 py-1.5 transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-[#151524] rounded-xl overflow-hidden border border-[#2a2a42]">
        <div className="px-6 py-4 border-b border-[#2a2a42] flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Transactions récentes</h2>
          <span className="text-xs text-[#6b7280]">{transactions.length} enregistrements</span>
        </div>
        {loadingTx ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[#1e1e30] rounded-lg animate-pulse" />)}
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
                  {['Date', 'Description', 'Catégorie', 'Montant TTC', 'TVA', ''].map((col, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#818cf8]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map(tx => (
                  <tr key={tx.id} className="border-b border-[#2a2a42] hover:bg-[#1e1e30] transition-colors last:border-0 group">
                    <td className="px-4 py-3 text-xs text-[#9ca3af] whitespace-nowrap">{fmtDate(tx.date)}</td>
                    <td className="px-4 py-3 text-sm text-white max-w-xs truncate">
                      {tx.description || <span className="text-[#4b5563] italic">Sans description</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-[#2a2a42] text-[#818cf8] px-2 py-1 rounded-md whitespace-nowrap">{tx.category}</span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)} €
                      {tx.tvaRate > 0 && (
                        <span className="block text-[10px] text-[#6b7280] font-normal">HT : {fmtDec(calcHT(tx.amount, tx.tvaRate))} €</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6b7280] whitespace-nowrap">
                      {tx.tvaRate > 0 ? (
                        <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-medium">{tx.tvaRate}%</span>
                      ) : (
                        <span className="text-[#3a3a5c]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setModalMode(tx)}
                          title="Modifier"
                          className="text-[#6b7280] hover:text-indigo-400 transition-colors text-sm px-1"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          title="Supprimer"
                          className="text-[#6b7280] hover:text-red-400 disabled:opacity-50 transition-colors text-sm px-1"
                        >
                          {deletingId === tx.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}