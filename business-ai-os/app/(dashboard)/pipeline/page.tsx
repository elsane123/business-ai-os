'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Relance {
  id: string
  message: string
  sentAt: string
}

interface Prospect {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  value: number
  status: string
  lastContactDate: string | null
  notes: string | null
  relances: Relance[]
  // Enrichissement
  siret?: string | null
  linkedinUrl?: string | null
  position?: string | null
  enrichCity?: string | null
  enrichAddress?: string | null
  enrichZip?: string | null
  employeeRange?: string | null
  nafCode?: string | null
}

interface EnrichResult {
  name: string
  siren: string
  siret: string
  city: string
  postalCode: string
  address: string
  nafCode: string
  employeeRange: string
  linkedinSearchUrl: string
}

type ProspectStatus = 'IDENTIFIED' | 'CONTACTED' | 'INTERESTED' | 'PROPOSAL' | 'WON' | 'LOST'

const ACTIVE_COLUMNS: ProspectStatus[] = ['IDENTIFIED', 'CONTACTED', 'INTERESTED', 'PROPOSAL', 'WON']

const COLUMN_META: Record<ProspectStatus, { label: string; icon: string; borderColor: string; headerColor: string }> = {
  IDENTIFIED: { label: 'Identifié', icon: '📬', borderColor: 'border-t-[#4f46e5]', headerColor: 'text-[#818cf8]' },
  CONTACTED:  { label: 'Contacté',  icon: '📞', borderColor: 'border-t-blue-400',   headerColor: 'text-blue-400' },
  INTERESTED: { label: 'Intéressé', icon: '💡', borderColor: 'border-t-yellow-400', headerColor: 'text-yellow-400' },
  PROPOSAL:   { label: 'Devis',     icon: '📄', borderColor: 'border-t-orange-400', headerColor: 'text-orange-400' },
  WON:        { label: 'Gagné',     icon: '✅', borderColor: 'border-t-green-500',  headerColor: 'text-green-400' },
  LOST:       { label: 'Perdu',     icon: '❌', borderColor: 'border-t-red-500',    headerColor: 'text-red-400' },
}

const STATUS_ORDER: ProspectStatus[] = ['IDENTIFIED', 'CONTACTED', 'INTERESTED', 'PROPOSAL', 'WON', 'LOST']

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function heatBadge(dateStr: string | null): { emoji: string; label: string; color: string } {
  const days = daysSince(dateStr)
  if (days === null || days > 7) return { emoji: '🧊', label: 'Froid', color: 'text-blue-300 bg-blue-500/10' }
  if (days <= 3) return { emoji: '🔥', label: 'Chaud', color: 'text-orange-400 bg-orange-500/10' }
  return { emoji: '⚡', label: 'Tiède', color: 'text-yellow-400 bg-yellow-500/10' }
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Lead Scoring ─────────────────────────────────────────────────────────────
const STATUS_WEIGHT: Record<string, number> = {
  IDENTIFIED: 1, CONTACTED: 2, INTERESTED: 3, PROPOSAL: 4, WON: 5, LOST: 0,
}

function calcLeadScore(
  prospect: { value: number; status: string; lastContactDate: string | null },
  maxValue: number
): number {
  const statusScore = (STATUS_WEIGHT[prospect.status] ?? 0) / 4 // 0-1
  const valueScore = maxValue > 0 ? Math.min(prospect.value / maxValue, 1) : 0
  const days = daysSince(prospect.lastContactDate)
  // Urgency: drops from 1 at 0 days to 0 at 30+ days; null = cold (0)
  const urgency = days === null ? 0 : Math.max(0, 1 - days / 30)
  // Weighted composite
  const raw = statusScore * 0.35 + valueScore * 0.40 + urgency * 0.25
  return Math.round(raw * 100)
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Score</span>
        <span className={`text-[10px] font-bold ${
          score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
        }`}>{score}</span>
      </div>
      <div className="w-full h-1 bg-[#2a2a42] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function daysLabel(dateStr: string | null): string {
  const days = daysSince(dateStr)
  if (days === null) return 'Jamais contacté'
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return `Il y a ${days}j`
}

// ─── BriefModal Pipeline ──────────────────────────────────────────────────────

type BriefProspect = {
  name: string; company: string; email: string; phone: string;
  value: number; status: ProspectStatus; notes: string;
}

function PipelineBriefModal({ onClose, onParsed }: {
  onClose: () => void
  onParsed: (data: BriefProspect) => void
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
      const res = await fetch('/api/pipeline/parse-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      onParsed(data.prospect)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1d2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">✍️ Prospect depuis un brief</h2>
            <p className="text-xs text-slate-400 mt-0.5">L&apos;IA analyse votre texte et pré-remplit la fiche prospect</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Décrivez le prospect en langage naturel</label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={5}
              autoFocus
              placeholder="Ex : Sophie Martin, DRH chez TechCorp (sophie@techcorp.fr), intéressée par notre offre de formation à 8000€. On s'est parlé la semaine dernière, elle attend un devis."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none leading-relaxed"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              ⚠️ {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors text-sm"
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

export default function PipelinePage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showLost, setShowLost] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)

  // Add prospect modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addCompany, setAddCompany] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addValue, setAddValue] = useState('')
  const [addStatus, setAddStatus] = useState<ProspectStatus>('IDENTIFIED')
  const [addNotes, setAddNotes] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [showBriefModal, setShowBriefModal] = useState(false)
  // Enrichissement prospect
  const [addPosition, setAddPosition] = useState('')
  const [addSiret, setAddSiret] = useState('')
  const [addLinkedinUrl, setAddLinkedinUrl] = useState('')
  const [addEnrichCity, setAddEnrichCity] = useState('')
  const [addEnrichAddress, setAddEnrichAddress] = useState('')
  const [addEnrichZip, setAddEnrichZip] = useState('')
  const [addEmployeeRange, setAddEmployeeRange] = useState('')
  const [addNafCode, setAddNafCode] = useState('')
  const [enrichResults, setEnrichResults] = useState<EnrichResult[]>([])
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [showEnrichDropdown, setShowEnrichDropdown] = useState(false)
  const enrichTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Relance modal
  // Edit prospect modal
  const [editProspect, setEditProspect] = useState<Prospect | null>(null)
  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editValue, setEditValue] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [relanceProspect, setRelanceProspect] = useState<Prospect | null>(null)
  const [relanceTone, setRelanceTone] = useState<'professionnel' | 'decontracte' | 'expert'>('professionnel')
  const [relanceChannel, setRelanceChannel] = useState<'email' | 'linkedin'>('email')
  const [relanceLoading, setRelanceLoading] = useState(false)
  const [relanceResult, setRelanceResult] = useState<{ subject: string; message: string; hook: string; channel: string } | null>(null)
  const [relanceError, setRelanceError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Cal.com integration
  const [calcomBookingUrl, setCalcomBookingUrl] = useState<string | null>(null)
  const [prospectEvents, setProspectEvents] = useState<Array<{
    id: string; title: string; startTime: string; endTime: string;
    attendeeName?: string; status: string; meetingUrl?: string;
  }>>([]
  )
  const [eventsLoading, setEventsLoading] = useState(false)


  // Hydration-safe date
  const [todayLabel, setTodayLabel] = useState('')
  useEffect(() => {
    setTodayLabel(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))
  }, [])

  // Load Cal.com booking URL from profile
  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.json())
      .then(({ user }) => {
        if (user?.calcomBookingUrl) setCalcomBookingUrl(user.calcomBookingUrl)
      })
      .catch(() => {})
  }, [])


  const fetchProspects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pipeline/prospects')
      if (!res.ok) throw new Error('Erreur chargement prospects')
      const data = await res.json()
      setProspects(data.prospects || [])
    } catch (e) {
      console.error('[pipeline/page fetchProspects]', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProspects() }, [fetchProspects])

  // KPIs
  const activeProspects = prospects.filter(p => p.status !== 'LOST' && p.status !== 'WON')
  const totalPipelineValue = activeProspects.reduce((s, p) => s + p.value, 0)
  const wonThisMonth = prospects.filter(p => {
    if (p.status !== 'WON' || !p.lastContactDate) return false
    const d = new Date(p.lastContactDate)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const maxDealValue = Math.max(...activeProspects.map(p => p.value), 1)
  const avgDealValue = activeProspects.length > 0
    ? Math.round(activeProspects.reduce((s, p) => s + p.value, 0) / activeProspects.length)
    : 0
  // Top prospects by lead score
  const topProspects = [...activeProspects]
    .map(p => ({ ...p, score: calcLeadScore(p, maxDealValue) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  const wonThisMonthValue = wonThisMonth.reduce((s, p) => s + p.value, 0)
  const totalDeals = prospects.filter(p => ['WON', 'LOST'].includes(p.status)).length
  const conversionRate = totalDeals > 0
    ? Math.round((prospects.filter(p => p.status === 'WON').length / totalDeals) * 100)
    : 0

  // Move status
  const handleMoveStatus = async (prospect: Prospect, newStatus: ProspectStatus) => {
    setMovingId(prospect.id)
    setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, status: newStatus } : p))
    try {
      await fetch('/api/pipeline/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospect.id, status: newStatus }),
      })
    } catch (e) {
      console.error('[pipeline/page handleMoveStatus]', e)
      // Revert on error
      setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, status: prospect.status } : p))
    } finally {
      setMovingId(null)
    }
  }

  // Delete prospect
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce prospect ?')) return
    setProspects(prev => prev.filter(p => p.id !== id))
    try {
      await fetch(`/api/pipeline/prospects?id=${id}`, { method: 'DELETE' })
    } catch (e) {
      console.error('[pipeline/page handleDelete]', e)
      fetchProspects()
    }
  }

  // Add prospect
  // Edit prospect
  const openEditModal = (p: Prospect) => {
    setEditProspect(p)
    setEditName(p.name)
    setEditCompany(p.company || '')
    setEditEmail(p.email || '')
    setEditPhone((p as Prospect & { phone?: string }).phone || '')
    setEditValue(String(p.value))
    setEditNotes(p.notes || '')
    setEditError(null)
  }

  const handleEditSave = async () => {
    if (!editProspect) return
    if (!editName.trim()) { setEditError('Le nom est requis'); return }
    setEditLoading(true)
    setEditError(null)
    try {
      const res = await fetch('/api/pipeline/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editProspect.id,
          name: editName.trim(),
          company: editCompany.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          value: parseFloat(editValue) || 0,
          notes: editNotes.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error || 'Erreur'); return }
      setProspects(prev => prev.map(p => p.id === editProspect.id ? { ...p, ...data.prospect } : p))
      setEditProspect(null)
    } catch {
      setEditError('Erreur réseau')
    } finally {
      setEditLoading(false)
    }
  }

  // Debounced company enrichment search
  const handleCompanySearch = (value: string) => {
    setAddCompany(value)
    setShowEnrichDropdown(false)
    if (enrichTimeoutRef.current) clearTimeout(enrichTimeoutRef.current)
    if (value.length < 2) { setEnrichResults([]); return }
    enrichTimeoutRef.current = setTimeout(async () => {
      setEnrichLoading(true)
      try {
        const res = await fetch(`/api/pipeline/enrich?q=${encodeURIComponent(value)}`)
        if (res.ok) {
          const data = await res.json()
          setEnrichResults(data.results || [])
          setShowEnrichDropdown((data.results || []).length > 0)
        }
      } catch { /* ignore */ } finally {
        setEnrichLoading(false)
      }
    }, 500)
  }

  const applyEnrichment = (result: EnrichResult) => {
    setAddCompany(result.name)
    setAddSiret(result.siret)
    setAddEnrichCity(result.city)
    setAddEnrichAddress(result.address)
    setAddEnrichZip(result.postalCode)
    setAddEmployeeRange(result.employeeRange)
    setAddNafCode(result.nafCode)
    setAddLinkedinUrl(result.linkedinSearchUrl)
    setShowEnrichDropdown(false)
    setEnrichResults([])
  }

  const resetEnrichment = () => {
    setAddPosition(''); setAddSiret(''); setAddLinkedinUrl('')
    setAddEnrichCity(''); setAddEnrichAddress(''); setAddEnrichZip('')
    setAddEmployeeRange(''); setAddNafCode('')
    setEnrichResults([]); setShowEnrichDropdown(false)
  }

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    setAddLoading(true)
    try {
      const res = await fetch('/api/pipeline/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          company: addCompany,
          email: addEmail,
          phone: addPhone,
          value: parseFloat(addValue) || 0,
          status: addStatus,
          notes: addNotes,
          // Enrichissement
          siret: addSiret || null,
          linkedinUrl: addLinkedinUrl || null,
          position: addPosition || null,
          enrichCity: addEnrichCity || null,
          enrichAddress: addEnrichAddress || null,
          enrichZip: addEnrichZip || null,
          employeeRange: addEmployeeRange || null,
          nafCode: addNafCode || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur création')
      }
      const { prospect } = await res.json()
      setProspects(prev => [{ ...prospect, relances: [] }, ...prev])
      setShowAddModal(false)
      setAddName(''); setAddCompany(''); setAddEmail(''); setAddPhone('')
      setAddValue(''); setAddNotes(''); setAddStatus('IDENTIFIED')
      resetEnrichment()
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Erreur inconnue')
      console.error('[pipeline/page handleAddProspect]', e)
    } finally {
      setAddLoading(false)
    }
  }

  const handleBriefParsed = (data: BriefProspect) => {
    setShowBriefModal(false)
    setAddName(data.name)
    setAddCompany(data.company)
    setAddEmail(data.email)
    setAddPhone(data.phone)
    setAddValue(data.value > 0 ? String(data.value) : '')
    setAddStatus(data.status)
    setAddNotes(data.notes)
    setAddError(null)
    setShowAddModal(true)
  }

  // Generate relance
  const handleGenerateRelance = async () => {
    if (!relanceProspect) return
    setRelanceLoading(true)
    setRelanceError(null)
    setRelanceResult(null)
    try {
      const res = await fetch('/api/pipeline/relance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: relanceProspect.id,
          tone: relanceTone,
          channel: relanceChannel,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        if (d.upgradeRequired) {
          setShowUpgradeModal(true)
          return
        }
        throw new Error(d.error || 'Erreur génération')
      }
      const data = await res.json()
      setRelanceResult({
        subject: data.subject,
        message: data.message,
        hook: data.hook,
        channel: data.channel,
      })
      // Update last contact date optimistically
      setProspects(prev => prev.map(p =>
        p.id === relanceProspect.id
          ? { ...p, lastContactDate: new Date().toISOString() }
          : p
      ))
    } catch (e: unknown) {
      setRelanceError(e instanceof Error ? e.message : 'Erreur inconnue')
      console.error('[pipeline/page handleGenerateRelance]', e)
    } finally {
      setRelanceLoading(false)
    }
  }

  const handleCopy = () => {
    if (!relanceResult) return
    const text = relanceChannel === 'email'
      ? `Objet : ${relanceResult.subject}\n\n${relanceResult.message}`
      : relanceResult.message
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const openRelanceModal = (p: Prospect) => {
    setRelanceProspect(p)
    setRelanceTone('professionnel')
    setRelanceChannel('email')
    setRelanceResult(null)
    setRelanceError(null)
    setCopied(false)
    // Load Cal.com events for this prospect
    setProspectEvents([])
    if (p.id) {
      setEventsLoading(true)
      fetch(`/api/calcom/events?prospectId=${p.id}`)
        .then(r => r.json())
        .then(data => setProspectEvents(data.events || []))
        .catch(() => {})
        .finally(() => setEventsLoading(false))
    }
  }
  const columnsToShow = showLost ? [...ACTIVE_COLUMNS, 'LOST' as ProspectStatus] : ACTIVE_COLUMNS

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto overflow-x-hidden pb-24 sm:pb-6">
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151524] border border-[#2a2a42] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-white mb-2">Fonctionnalité Solo Pro</h2>
            <p className="text-[#818cf8] text-sm mb-6">
              La génération de relances IA est réservée aux abonnés <span className="text-white font-semibold">Solo Pro</span>.
              Débloquez des messages personnalisés pour chaque prospect avec l&apos;IA.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 text-sm text-[#818cf8] hover:text-white border border-[#2a2a42] hover:border-[#4f46e5]/50 rounded-lg transition-all"
              >
                Plus tard
              </button>
              <button
                onClick={async () => {
                  const res = await fetch('/api/stripe/checkout', { method: 'POST' })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                }}
                className="px-5 py-2 text-sm font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg transition-colors"
              >
                Upgrader maintenant — 29€/mois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline Commercial 👥</h1>
          <p className="text-sm text-[#6b7280] mt-1 capitalize">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLost(v => !v)}
            className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
              showLost
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-[#1e1e30] border-[#2a2a42] text-[#6b7280] hover:text-white'
            }`}
          >
            {showLost ? '🙈 Masquer perdus' : '👁 Voir perdus'}
          </button>
          <button
            onClick={() => { setShowAddModal(true); setAddError(null) }}
            className="flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors whitespace-nowrap"
          >
            + Nouveau prospect
          </button>
          <button
            onClick={() => setShowBriefModal(true)}
            className="flex items-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors whitespace-nowrap"
          >
            ✍️ Brief
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Prospects actifs</p>
          <p className="text-2xl font-bold text-white">{activeProspects.length}</p>
          <p className="text-xs text-[#4b5563] mt-1">Hors gagnés et perdus</p>
        </div>
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Valeur pipeline</p>
          <p className="text-2xl font-bold text-[#818cf8]">{fmt(totalPipelineValue)} €</p>
          <p className="text-xs text-[#4b5563] mt-1">Total deals actifs</p>
        </div>
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Gagnés ce mois</p>
          <p className="text-2xl font-bold text-green-400">{wonThisMonth.length}</p>
          <p className="text-xs text-[#4b5563] mt-1">{fmt(wonThisMonthValue)} € signés</p>
        </div>
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Taux conversion</p>
          <p className="text-2xl font-bold text-white">{conversionRate}%</p>
          <p className="text-xs text-[#4b5563] mt-1">{totalDeals} deals clôturés</p>
        </div>
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1 uppercase tracking-wider">Valeur moyenne</p>
          <p className="text-2xl font-bold text-[#f59e0b]">{fmt(avgDealValue)} €</p>
          <p className="text-xs text-[#4b5563] mt-1">Par deal actif</p>
        </div>
      </div>

      {/* Top Prospects Lead Score */}
      {topProspects.length > 0 && (
        <div className="mb-6 bg-[#0f0f1f] border border-[#2a2a42] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">🎯 Top prospects à prioriser</h3>
          <div className="grid grid-cols-3 gap-3">
            {topProspects.map((p, i) => (
              <div key={p.id} className="bg-[#151524] border border-[#2a2a42] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-500">#{i + 1}</span>
                  <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                </div>
                {p.company && <p className="text-[10px] text-[#6b7280] truncate mb-1">{p.company}</p>}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#818cf8]">{fmt(p.value)} €</span>
                  <span className="text-[10px] text-gray-500">{COLUMN_META[p.status as ProspectStatus]?.label}</span>
                </div>
                <ScoreBar score={p.score} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {ACTIVE_COLUMNS.map(col => (
            <div key={col} className="flex-shrink-0 w-64 space-y-2">
              <div className="h-12 bg-[#151524] border border-[#2a2a42] rounded-xl animate-pulse" />
              {[1, 2].map(i => <div key={i} className="h-24 bg-[#151524] border border-[#2a2a42] rounded-xl animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-6 -mx-2 px-2">
          {columnsToShow.map(col => {
            const meta = COLUMN_META[col]
            const colProspects = prospects.filter(p => p.status === col)
            const colValue = colProspects.reduce((s, p) => s + p.value, 0)
            const idx = STATUS_ORDER.indexOf(col)
            const nextStatus = idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : undefined
            const prevStatus = idx > 0 ? STATUS_ORDER[idx - 1] : undefined
            return (
              <div key={col} className={`flex-shrink-0 w-64 bg-[#151524] border border-[#2a2a42] border-t-4 ${meta.borderColor} rounded-xl flex flex-col`}>
                <div className="px-3 py-3 border-b border-[#2a2a42] flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${meta.headerColor}`}>{meta.icon} {meta.label}</span>
                    <span className="text-xs bg-[#2a2a42] text-[#818cf8] px-2 py-0.5 rounded-full">{colProspects.length}</span>
                  </div>
                  {colValue > 0 && <p className="text-xs text-[#6b7280] mt-1">{fmt(colValue)} €</p>}
                </div>
                <div className="flex flex-col gap-2 p-2">
                  {colProspects.length === 0 ? (
                    <div className="py-10 text-center"><p className="text-xs text-[#3a3a5c]">Aucun prospect</p></div>
                  ) : colProspects.map(prospect => {
                     const heat = heatBadge(prospect.lastContactDate)
                     const score = calcLeadScore(prospect, maxDealValue)
                     return (
                      <div key={prospect.id} className="bg-[#1e1e30] border border-[#2a2a42] hover:border-[#4f46e5]/40 rounded-lg p-3 transition-all group">
                         <div className="mb-2">
                           <p className="text-sm font-semibold text-white truncate">{prospect.name}</p>
                           {prospect.position && <p className="text-[10px] text-indigo-400 truncate">{prospect.position}</p>}
                           {prospect.company && <p className="text-xs text-[#6b7280] truncate">{prospect.company}</p>}
                           {(prospect.enrichCity || prospect.employeeRange || prospect.linkedinUrl) && (
                             <div className="flex flex-wrap gap-1 mt-1">
                               {prospect.enrichCity && (
                                 <span className="text-[9px] bg-[#1a1a2e] border border-[#2a2a42] text-[#818cf8] rounded px-1 py-0.5">📍 {prospect.enrichCity}</span>
                               )}
                               {prospect.employeeRange && (
                                 <span className="text-[9px] bg-[#1a1a2e] border border-[#2a2a42] text-[#818cf8] rounded px-1 py-0.5">👥 {prospect.employeeRange.split(' ')[0]}</span>
                               )}
                               {prospect.linkedinUrl && (
                                 <a href={prospect.linkedinUrl} target="_blank" rel="noopener noreferrer"
                                   className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded px-1 py-0.5 hover:bg-blue-500/20 transition-colors"
                                   onClick={e => e.stopPropagation()}>in</a>
                               )}
                             </div>
                           )}
                         </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[#818cf8] bg-[#4f46e5]/10 px-2 py-0.5 rounded">{fmt(prospect.value)} €</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${heat.color}`}>{heat.emoji} {heat.label}</span>
                        </div>
                         <p className="text-xs text-[#4b5563] mb-2">{daysLabel(prospect.lastContactDate)}</p>
                         <ScoreBar score={score} />
                        <div className="flex gap-1.5">
                          {col !== 'LOST' && (
                            <button onClick={() => openRelanceModal(prospect)} title="Relance IA" className="flex-1 text-xs bg-[#4f46e5]/10 hover:bg-[#4f46e5]/20 text-[#818cf8] rounded px-2 py-1.5 transition-colors">✉ Relancer</button>
                          )}
                          {nextStatus && col !== 'WON' && (
                            <button onClick={() => handleMoveStatus(prospect, nextStatus as ProspectStatus)} disabled={movingId === prospect.id} title={`→ ${COLUMN_META[nextStatus as ProspectStatus]?.label}`} className="text-xs bg-[#2a2a42] hover:bg-[#3a3a5c] text-[#6b7280] hover:text-white rounded px-2 py-1.5 transition-colors disabled:opacity-50">▶</button>
                          )}
                          {prevStatus && col !== 'IDENTIFIED' && col !== 'LOST' && (
                            <button onClick={() => handleMoveStatus(prospect, prevStatus as ProspectStatus)} disabled={movingId === prospect.id} title={`← ${COLUMN_META[prevStatus as ProspectStatus]?.label}`} className="text-xs bg-[#2a2a42] hover:bg-[#3a3a5c] text-[#6b7280] hover:text-white rounded px-2 py-1.5 transition-colors disabled:opacity-50">◀</button>
                          )}
                          {col === 'PROPOSAL' && (
                            <button onClick={() => {
                              const params = new URLSearchParams({ new: 'quote', name: prospect.name })
                              if (prospect.company) params.set('company', prospect.company)
                              if (prospect.email) params.set('email', prospect.email)
                              if (prospect.phone) params.set('phone', prospect.phone)
                              if (prospect.siret) params.set('siret', prospect.siret)
                              if (prospect.enrichCity) params.set('city', prospect.enrichCity)
                              if (prospect.enrichAddress) params.set('address', prospect.enrichAddress)
                              if (prospect.enrichZip) params.set('zip', prospect.enrichZip)
                              if (prospect.position) params.set('position', prospect.position)
                              router.push(`/invoices?${params.toString()}`)
                            }} title="Créer un devis" className="opacity-0 group-hover:opacity-100 text-xs text-[#6b7280] hover:text-orange-400 rounded px-1.5 py-1.5 transition-all">📄</button>
                          )}
                          <button onClick={() => openEditModal(prospect)} title="Modifier" className="opacity-0 group-hover:opacity-100 text-xs text-[#6b7280] hover:text-indigo-400 rounded px-1.5 py-1.5 transition-all">✏️</button>
                          <button onClick={() => handleDelete(prospect.id)} title="Supprimer" className="opacity-0 group-hover:opacity-100 text-xs text-[#6b7280] hover:text-red-400 rounded px-1.5 py-1.5 transition-all">🗑</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Prospect Modal */}
      {editProspect && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setEditProspect(null)}>
          <div className="bg-[#151524] border border-[#2a2a42] rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">✏️ Modifier le prospect</h2>
              <button onClick={() => setEditProspect(null)} className="text-[#6b7280] hover:text-white transition-colors text-xl">✕</button>
            </div>
            {editError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-red-400">{editError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#6b7280] mb-1">Nom *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="Prénom Nom" />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Société</label>
                <input value={editCompany} onChange={e => setEditCompany(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="Nom de la société" />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Valeur (€)</label>
                <input type="number" min="0" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="email@exemple.com" />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Téléphone</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="+33 6 00 00 00 00" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#6b7280] mb-1">Notes</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} className="w-full bg-[#1a1a2e] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none" placeholder="Contexte, objections, prochaine étape..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditProspect(null)} className="px-4 py-2 text-[#6b7280] hover:text-white text-sm transition-colors">Annuler</button>
              <button onClick={handleEditSave} disabled={editLoading || !editName.trim()} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {editLoading ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prospect Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151524] border border-[#2a2a42] rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Nouveau prospect</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#6b7280] hover:text-white transition-colors text-xl">✕</button>
            </div>
            {addError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-red-400">{addError}</p>
              </div>
            )}
            <form onSubmit={handleAddProspect}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#818cf8] mb-1 block font-medium">Nom complet *</label>
                  <input type="text" required value={addName} onChange={e => setAddName(e.target.value)} placeholder="Sophie Martin" className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors" />
                </div>
                {/* Company with enrichment autocomplete */}
                <div className="relative">
                  <label className="text-xs text-[#818cf8] mb-1 block font-medium">
                    Entreprise
                    {enrichLoading && <span className="ml-2 text-[10px] text-indigo-400 animate-pulse">⏳ Recherche...</span>}
                    {addSiret && <span className="ml-2 text-[10px] text-green-400">✓ Enrichie</span>}
                  </label>
                  <input
                    type="text"
                    value={addCompany}
                    onChange={e => handleCompanySearch(e.target.value)}
                    onBlur={() => setTimeout(() => setShowEnrichDropdown(false), 200)}
                    placeholder="Tapez un nom d'entreprise..."
                    className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors"
                  />
                  {/* Enrichment dropdown */}
                  {showEnrichDropdown && enrichResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1a1a2e] border border-[#2a2a42] rounded-lg shadow-2xl overflow-hidden">
                      {enrichResults.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={() => applyEnrichment(r)}
                          className="w-full text-left px-3 py-2.5 hover:bg-[#2a2a42] transition-colors border-b border-[#2a2a42] last:border-0"
                        >
                          <div className="text-sm text-white font-medium truncate">{r.name}</div>
                          <div className="flex gap-2 mt-0.5 flex-wrap">
                            {r.city && <span className="text-[10px] text-[#818cf8]">📍 {r.city}</span>}
                            {r.siret && <span className="text-[10px] text-gray-400">SIRET {r.siret.slice(0,9)}...</span>}
                            {r.employeeRange && <span className="text-[10px] text-gray-400">👥 {r.employeeRange}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Enrichment chips */}
                  {addSiret && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {addEnrichCity && <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded px-2 py-0.5">📍 {addEnrichCity}</span>}
                      {addEmployeeRange && <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded px-2 py-0.5">👥 {addEmployeeRange}</span>}
                      {addSiret && <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded px-2 py-0.5">🏢 {addSiret.slice(0,9)}</span>}
                      <button type="button" onClick={resetEnrichment} className="text-[10px] text-red-400 hover:text-red-300 ml-1">✕ effacer</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-[#818cf8] mb-1 block font-medium">Poste / Fonction</label>
                  <input type="text" value={addPosition} onChange={e => setAddPosition(e.target.value)} placeholder="CEO, Directeur Marketing..." className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-[#818cf8] mb-1 block font-medium">Email</label>
                  <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="sophie@acme.com" className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-[#818cf8] mb-1 block font-medium">Téléphone</label>
                  <input type="tel" value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="+33 6 00 00 00 00" className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-[#818cf8] mb-1 block font-medium">Valeur du deal (€)</label>
                  <input type="number" min="0" step="100" value={addValue} onChange={e => setAddValue(e.target.value)} placeholder="5000" className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-[#818cf8] mb-1 block font-medium">Statut initial</label>
                  <select value={addStatus} onChange={e => setAddStatus(e.target.value as ProspectStatus)} className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors">
                    {ACTIVE_COLUMNS.map(s => <option key={s} value={s}>{COLUMN_META[s].icon} {COLUMN_META[s].label}</option>)}
                  </select>
                </div>
                {/* LinkedIn URL */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-[#818cf8] mb-1 block font-medium">LinkedIn</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={addLinkedinUrl}
                      onChange={e => setAddLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm flex-1 outline-none transition-colors"
                    />
                    {addLinkedinUrl && (
                      <a href={addLinkedinUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 rounded-lg px-3 py-2 text-xs transition-colors whitespace-nowrap">
                        🔗 Ouvrir
                      </a>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-[#818cf8] mb-1 block font-medium">Notes</label>
                  <textarea value={addNotes} onChange={e => setAddNotes(e.target.value)} placeholder="Contexte, besoins, objections..." rows={3} className="bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm w-full outline-none transition-colors resize-none" />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm text-[#6b7280] hover:text-white transition-colors">Annuler</button>
                <button type="submit" disabled={addLoading} className="bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-60 text-white font-medium rounded-lg px-6 py-2.5 text-sm transition-colors">
                  {addLoading ? 'Création...' : 'Créer le prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relance IA Modal */}
      {relanceProspect && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151524] border border-[#2a2a42] rounded-2xl p-6 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-white">✉ Relance IA</h2>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  {relanceProspect.name}
                  {relanceProspect.company ? ` — ${relanceProspect.company}` : ''}
                </p>
              </div>
              <button
                onClick={() => setRelanceProspect(null)}
                className="text-[#6b7280] hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Cal.com — RDV avec ce prospect */}
            {(eventsLoading || prospectEvents.length > 0) && (
              <div className="mb-4 p-3 rounded-lg bg-[#0f0f1f] border border-[#2a2a42]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">📅</span>
                  <p className="text-xs font-semibold text-[#818cf8]">Historique RDV</p>
                  {prospectEvents.length > 0 && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full px-1.5 py-0.5">{prospectEvents.length}</span>
                  )}
                </div>
                {eventsLoading ? (
                  <p className="text-xs text-gray-500">Chargement...</p>
                ) : (
                  <div className="space-y-1.5">
                    {prospectEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(ev.startTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-xs text-gray-300 truncate max-w-[160px]">{ev.title}</span>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          ev.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-300' :
                          ev.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {ev.status === 'CONFIRMED' ? '✅' : ev.status === 'CANCELLED' ? '❌' : '🔄'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cal.com — Bouton planifier */}
            {calcomBookingUrl && (
              <div className="mb-4">
                <a
                  href={`${calcomBookingUrl}?name=${encodeURIComponent(relanceProspect?.name || '')}&email=${encodeURIComponent(relanceProspect?.email || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                >
                  📅 Planifier un RDV Cal.com avec ce prospect
                </a>
              </div>
            )}

            {/* Tone selector */}
            <div className="mb-4">
              <label className="text-xs text-[#818cf8] mb-2 block font-medium">Ton du message</label>
              <div className="flex gap-2">
                {(['professionnel', 'decontracte', 'expert'] as const).map(tone => (
                  <button
                    key={tone}
                    onClick={() => { setRelanceTone(tone); setRelanceResult(null) }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors capitalize ${
                      relanceTone === tone
                        ? 'bg-[#4f46e5]/20 border-[#4f46e5] text-[#818cf8]'
                        : 'bg-[#1e1e30] border-[#2a2a42] text-[#6b7280] hover:text-white'
                    }`}
                  >
                    {tone === 'professionnel' ? '🤝 Pro' : tone === 'decontracte' ? '😊 Décontracté' : '🎓 Expert'}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel selector */}
            <div className="mb-5">
              <label className="text-xs text-[#818cf8] mb-2 block font-medium">Canal</label>
              <div className="flex gap-2">
                {(['email', 'linkedin'] as const).map(channel => (
                  <button
                    key={channel}
                    onClick={() => { setRelanceChannel(channel); setRelanceResult(null) }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      relanceChannel === channel
                        ? 'bg-[#4f46e5]/20 border-[#4f46e5] text-[#818cf8]'
                        : 'bg-[#1e1e30] border-[#2a2a42] text-[#6b7280] hover:text-white'
                    }`}
                  >
                    {channel === 'email' ? '📧 Email' : '💼 LinkedIn'}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            {!relanceResult && (
              <button
                onClick={handleGenerateRelance}
                disabled={relanceLoading}
                className="w-full bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-60 text-white font-medium rounded-lg px-6 py-3 text-sm transition-colors mb-4"
              >
                {relanceLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Génération en cours...
                  </span>
                ) : '✨ Générer le message'}
              </button>
            )}

            {/* Error */}
            {relanceError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-red-400">{relanceError}</p>
              </div>
            )}

            {/* Result */}
            {relanceResult && (
              <div className="space-y-3">
                {relanceChannel === 'email' && (
                  <div className="bg-[#1e1e30] border border-[#2a2a42] rounded-lg p-3">
                    <p className="text-xs text-[#818cf8] mb-1 font-medium">Objet</p>
                    <p className="text-sm text-white">{relanceResult.subject}</p>
                  </div>
                )}
                <div className="bg-[#1e1e30] border border-[#2a2a42] rounded-lg p-3">
                  <p className="text-xs text-[#818cf8] mb-2 font-medium">Message</p>
                  <p className="text-sm text-[#d1d5db] whitespace-pre-wrap leading-relaxed">{relanceResult.message}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                      copied
                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                        : 'bg-[#2a2a42] border-[#3a3a5c] text-white hover:bg-[#3a3a5c]'
                    }`}
                  >
                    {copied ? '✓ Copié !' : '📋 Copier'}
                  </button>
                  <button
                    onClick={() => { setRelanceResult(null) }}
                    className="px-4 py-2.5 text-sm text-[#6b7280] hover:text-white border border-[#2a2a42] rounded-lg transition-colors"
                  >
                    Régénérer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* FAB Mobile — Nouveau prospect */}
      <button
        onClick={() => { setShowAddModal(true); setAddError(null) }}
        className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-[#4f46e5] hover:bg-[#4338ca] active:scale-95 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center text-3xl font-light transition-all"
        aria-label="Nouveau prospect"
      >
        +
      </button>

      {showBriefModal && (
        <PipelineBriefModal
          onClose={() => setShowBriefModal(false)}
          onParsed={handleBriefParsed}
        />
      )}

    </div>
  )
}
