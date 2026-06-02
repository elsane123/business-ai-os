'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────
interface QuoteLine {
  title: string
  description?: string
  qty: number
  unitPrice: number
  vatRate: number
  unit?: string
}

interface Prospect {
  id: string
  name: string
  company?: string
}

interface Quote {
  id: string
  number: string
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  lines: string
  subtotalHT: number
  totalVAT: number
  totalTTC: number
  validUntil?: string
  notes?: string
  sentAt?: string
  acceptedAt?: string
  invoiceId?: string
  prospect?: Prospect
  createdAt: string
  clientInfo?: string
}

interface Invoice {
  id: string
  number: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  lines: string
  subtotalHT: number
  totalVAT: number
  totalTTC: number
  dueDate?: string
  notes?: string
  sentAt?: string
  paidAt?: string
  transactionId?: string
  prospect?: Prospect
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const QUOTE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Brouillon', color: 'text-gray-400',   bg: 'bg-gray-400/10' },
  SENT:     { label: 'Envoyé',    color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  ACCEPTED: { label: 'Accepté',  color: 'text-green-400',  bg: 'bg-green-400/10' },
  DECLINED: { label: 'Refusé',   color: 'text-red-400',    bg: 'bg-red-400/10' },
  EXPIRED:  { label: 'Expiré',   color: 'text-orange-400', bg: 'bg-orange-400/10' },
}

const INVOICE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'Brouillon', color: 'text-gray-400',   bg: 'bg-gray-400/10' },
  SENT:      { label: 'Envoyée',   color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  PAID:      { label: 'Payée',     color: 'text-green-400',  bg: 'bg-green-400/10' },
  OVERDUE:   { label: 'En retard', color: 'text-red-400',    bg: 'bg-red-400/10' },
  CANCELLED: { label: 'Annulée',  color: 'text-gray-500',   bg: 'bg-gray-500/10' },
}

const VAT_RATES = [0, 10, 20]
const EMPTY_LINE: QuoteLine = { title: '', qty: 1, unitPrice: 0, vatRate: 20 }

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

// ─── Line Editor Component ────────────────────────────────────────────────────
function LineEditor({ lines, onChange }: { lines: QuoteLine[]; onChange: (l: QuoteLine[]) => void }) {
  const [rawPrices, setRawPrices] = useState<string[]>(() => lines.map(l => l.unitPrice ? String(l.unitPrice) : ''))

  const update = (i: number, field: keyof QuoteLine, value: string | number) => {
    const next = lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l)
    onChange(next)
  }
  const addLine = () => {
    onChange([...lines, { ...EMPTY_LINE }])
    setRawPrices(prev => [...prev, ''])
  }
  const removeLine = (i: number) => {
    onChange(lines.filter((_, idx) => idx !== i))
    setRawPrices(prev => prev.filter((_, idx) => idx !== i))
  }

  const handlePriceChange = (i: number, raw: string) => {
    const next = [...rawPrices]
    next[i] = raw
    setRawPrices(next)
    const parsed = parseFloat(raw.replace(',', '.')) || 0
    update(i, 'unitPrice', parsed)
  }

  const subtotalHT = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const totalVAT = lines.reduce((s, l) => s + l.qty * l.unitPrice * (l.vatRate / 100), 0)
  const totalTTC = subtotalHT + totalVAT

  return (
    <div className="space-y-3">
      <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-[#6b7280] px-2">
        <span className="col-span-4">Prestation</span>
        <span className="col-span-2">Qté</span>
        <span className="col-span-2">Prix HT</span>
        <span className="col-span-2">TVA %</span>
        <span className="col-span-1">Total HT</span>
        <span className="col-span-1"></span>
      </div>
      {lines.map((line, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-[#1a1a2e] rounded-lg p-2">
          <input className="col-span-4 bg-transparent text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-0.5" placeholder="Titre de la prestation" value={line.title} onChange={e => update(i, 'title', e.target.value)} />
          <input type="number" min="0.01" step="0.01" className="col-span-2 bg-transparent text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-0.5" value={line.qty} onChange={e => update(i, 'qty', parseFloat(e.target.value) || 0)} />
          <input type="text" inputMode="decimal" className="col-span-2 bg-transparent text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-0.5" placeholder="0.00" value={rawPrices[i] ?? (line.unitPrice || '')} onChange={e => handlePriceChange(i, e.target.value)} />
          <select className="col-span-2 bg-[#1a1a2e] text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-0.5" value={line.vatRate} onChange={e => update(i, 'vatRate', parseInt(e.target.value))}>
            {VAT_RATES.map(r => <option key={r} value={r}>{r === 0 ? 'Exonéré' : `${r}%`}</option>)}
          </select>
          <span className="col-span-1 text-xs text-[#818cf8]">{fmt(line.qty * line.unitPrice)}</span>
          <button onClick={() => removeLine(i)} className="col-span-1 text-red-400 hover:text-red-300 text-center text-lg leading-none">×</button>
        </div>
      ))}
      <button onClick={addLine} className="text-sm text-[#818cf8] hover:text-white flex items-center gap-1 px-2">+ Ajouter une ligne</button>
      <div className="border-t border-[#2a2a42] pt-3 space-y-1 text-sm">
        <div className="flex justify-between text-[#9ca3af]"><span>Sous-total HT</span><span>{fmt(subtotalHT)}</span></div>
        <div className="flex justify-between text-[#9ca3af]"><span>TVA</span><span>{fmt(totalVAT)}</span></div>
        <div className="flex justify-between text-white font-semibold text-base border-t border-[#2a2a42] pt-2"><span>Total TTC</span><span className="text-[#818cf8]">{fmt(totalTTC)}</span></div>
        {subtotalHT === 0 && <p className="text-xs text-orange-400 mt-1">TVA non applicable, article 293B du CGI</p>}
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, type }: { status: string; type: 'quote' | 'invoice' }) {
  const map = type === 'quote' ? QUOTE_STATUS : INVOICE_STATUS
  const s = map[status] || { label: status, color: 'text-gray-400', bg: 'bg-gray-400/10' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color} ${s.bg}`}>{s.label}</span>
}

// ─── Brief Devis IA ───────────────────────────────────────────────────────────

type BriefQuote = {
  clientName: string; clientAddress: string; clientZip: string
  clientCity: string; clientSiret: string; clientEmail: string
  validDays: number; notes: string; lines: QuoteLine[]
}

function QuoteBriefModal({ onClose, onParsed }: {
  onClose: () => void
  onParsed: (data: BriefQuote) => void
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
      const res = await fetch('/api/quotes/parse-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      onParsed(data.quote)
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
            <h2 className="text-lg font-semibold text-white">✍️ Devis depuis un brief</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">L&apos;IA analyse votre texte et pré-remplit le devis</p>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#6b7280] mb-2">Décrivez le devis en langage naturel</label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={6}
              autoFocus
              placeholder="Ex : Devis pour Acme Corp (acme@corp.fr), 3 jours de consulting en architecture cloud à 800€/jour HT + 1 journée de formation à 1200€ HT. TVA 20%. Valide 30 jours."
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const [tab, setTab] = useState<'quotes' | 'invoices'>('quotes')
  const searchParams = useSearchParams()
  const router = useRouter()
  // Client info (pour devis)
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientZip, setClientZip] = useState('')
  const [clientCity, setClientCity] = useState('')
  const [clientSiret, setClientSiret] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [enrichResults, setEnrichResults] = useState<{name:string;siret:string;city:string;postalCode:string;address:string}[]>([])
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [showEnrichDropdown, setShowEnrichDropdown] = useState(false)
  const enrichTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'quote' | 'invoice'>('quote')
  const [lines, setLines] = useState<QuoteLine[]>([{ ...EMPTY_LINE }])
  const [notes, setNotes] = useState('')
  const [validDays, setValidDays] = useState(30)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [sellerMissing, setSellerMissing] = useState(false)

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ user }) => {
        if (!user) return
        const hasName = !!(user.legalName || user.businessName)
        const hasAddress = !!user.address
        setSellerMissing(!hasName || !hasAddress)
      })
      .catch(() => null)
  }, [])

  const handleClientNameSearch = (value: string) => {
    setClientName(value)
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

  const applyClientEnrichment = (r: {name:string;siret:string;city:string;postalCode:string;address:string}) => {
    setClientName(r.name)
    setClientSiret(r.siret)
    setClientCity(r.city)
    setClientZip(r.postalCode)
    setClientAddress(r.address)
    setShowEnrichDropdown(false)
    setEnrichResults([])
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const [qRes, iRes] = await Promise.all([
      fetch('/api/quotes'),
      fetch('/api/invoices')
    ])
    if (qRes.ok) setQuotes(await qRes.json())
    if (iRes.ok) setInvoices(await iRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Pré-remplir depuis Pipeline (?new=quote&name=xxx&company=xxx&siret=xxx&city=xxx...)
  useEffect(() => {
    if (searchParams.get('new') === 'quote') {
      const pName    = decodeURIComponent(searchParams.get('name')     || '')
      const pCompany = decodeURIComponent(searchParams.get('company')  || '')
      const pEmail   = decodeURIComponent(searchParams.get('email')    || '')
      const pSiret   = decodeURIComponent(searchParams.get('siret')    || '')
      const pCity    = decodeURIComponent(searchParams.get('city')     || '')
      const pPhone   = decodeURIComponent(searchParams.get('phone')    || '')
      const pPos     = decodeURIComponent(searchParams.get('position') || '')

      const pAddress = decodeURIComponent(searchParams.get('address') || '')
      const pZip     = decodeURIComponent(searchParams.get('zip')     || '')

      // clientName = société si disponible, sinon nom du contact
      setClientName(pCompany || pName)
      setClientEmail(pEmail)
      setClientSiret(pSiret)
      setClientCity(pCity)
      setClientAddress(pAddress)
      setClientZip(pZip)

      // Pré-remplir les notes avec le contexte du contact
      const noteLines = []
      if (pCompany && pName)  noteLines.push(`Contact : ${pName}${pPos ? ` (${pPos})` : ''}`)
      if (pPhone)             noteLines.push(`Tél : ${pPhone}`)
      setNotes(noteLines.join('\n'))

      setModalType('quote')
      setLines([{ ...EMPTY_LINE }])
      setValidDays(30)
      setShowModal(true)
      router.replace('/invoices')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openModal = (type: 'quote' | 'invoice') => {
    setModalType(type)
    setLines([{ ...EMPTY_LINE }])
    setNotes('')
    setValidDays(30)
    setClientName('')
    setClientAddress('')
    setClientZip('')
    setClientCity('')
    setClientSiret('')
    setClientEmail('')
    setEditingQuoteId(null)
    setShowModal(true)
  }

  const handleBriefParsed = (data: BriefQuote) => {
    setShowBriefModal(false)
    setModalType('quote')
    setClientName(data.clientName)
    setClientAddress(data.clientAddress)
    setClientZip(data.clientZip)
    setClientCity(data.clientCity)
    setClientSiret(data.clientSiret)
    setClientEmail(data.clientEmail)
    setLines(data.lines.length > 0 ? data.lines : [{ ...EMPTY_LINE }])
    setNotes(data.notes)
    setValidDays(data.validDays)
    setEditingQuoteId(null)
    setShowModal(true)
  }

  const openEditModal = (q: Quote) => {
    const ci = q.clientInfo ? JSON.parse(q.clientInfo) : {}
    setClientName(ci.name || '')
    setClientAddress(ci.address || '')
    setClientZip(ci.zipCode || '')
    setClientCity(ci.city || '')
    setClientSiret(ci.siret || '')
    setClientEmail(ci.email || '')
    setLines(JSON.parse(q.lines))
    setNotes(q.notes || '')
    setValidDays(30)
    setModalType('quote')
    setEditingQuoteId(q.id)
    setShowModal(true)
  }

  const [createError, setCreateError] = useState('')
  const [isUpgradeError, setIsUpgradeError] = useState(false)

  const handleCreate = async () => {
    // Validation champs client obligatoires
    if (!clientName.trim()) {
      setCreateError('Le nom du client ou de la société est obligatoire.')
      return
    }
    if (!clientAddress.trim()) {
      setCreateError('L\'adresse du client est obligatoire pour la facturation légale.')
      return
    }
    setSaving(true)
    setCreateError('')
    setIsUpgradeError(false)
    const url = modalType === 'quote' ? '/api/quotes' : '/api/invoices'
    const clientInfo = { name: clientName, address: clientAddress, zipCode: clientZip, city: clientCity, siret: clientSiret, email: clientEmail }
    const method = editingQuoteId ? 'PATCH' : 'POST'
    const body = editingQuoteId
      ? { id: editingQuoteId, lines, notes, validDays, clientInfo }
      : modalType === 'quote' ? { lines, notes, validDays, clientInfo } : { lines, notes }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      setShowModal(false)
      loadData()
    } else {
      const data = await res.json().catch(() => ({}))
      setCreateError(data.error || `Erreur ${res.status}`)
      setIsUpgradeError(!!data.upgradeRequired)
    }
    setSaving(false)
  }

  const updateQuoteStatus = async (id: string, status: string) => {
    setActionLoading(id)
    await fetch('/api/quotes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    loadData()
    setActionLoading(null)
  }

  const updateInvoiceStatus = async (id: string, status: string) => {
    setActionLoading(id)
    await fetch('/api/invoices', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    loadData()
    setActionLoading(null)
  }

  const convertToInvoice = async (quoteId: string) => {
    setActionLoading(quoteId)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromQuoteId: quoteId })
    })
    if (res.ok) {
      setTab('invoices')
      loadData()
    }
    setActionLoading(null)
  }

  const deleteDoc = async (id: string, type: 'quote' | 'invoice') => {
    if (!confirm('Supprimer ce document ?')) return
    setActionLoading(id)
    await fetch(`/api/${type === 'quote' ? 'quotes' : 'invoices'}?id=${id}`, { method: 'DELETE' })
    loadData()
    setActionLoading(null)
  }
  const totalQuotesPending = quotes.filter(q => q.status === 'SENT').reduce((s, q) => s + q.totalTTC, 0)
  const totalInvoicesDue = invoices.filter(i => ['SENT','OVERDUE'].includes(i.status)).reduce((s, i) => s + i.totalTTC, 0)
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalTTC, 0)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📄 Devis & Factures</h1>
          <p className="text-sm text-[#6b7280] mt-1">Gérez vos devis et factures clients</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal('quote')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">+ Nouveau devis</button>
          <button onClick={() => setShowBriefModal(true)} className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">✍️ Brief</button>
          <button onClick={() => openModal('invoice')} className="px-4 py-2 bg-[#1e1e30] hover:bg-[#2a2a42] border border-[#2a2a42] text-white rounded-lg text-sm font-medium transition-colors">+ Nouvelle facture</button>
        </div>
      </div>

      {/* Banner infos légales manquantes */}
      {sellerMissing && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4">
          <span className="text-amber-400 text-lg flex-shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">Vos informations légales sont incomplètes</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Le nom de votre société et votre adresse sont requis pour générer des factures conformes.
            </p>
          </div>
          <a
            href="/settings"
            className="flex-shrink-0 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Compléter dans Paramètres →
          </a>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1">Devis en attente</p>
          <p className="text-xl font-bold text-blue-400">{fmt(totalQuotesPending)}</p>
          <p className="text-xs text-[#6b7280] mt-1">{quotes.filter(q => q.status === 'SENT').length} envoyés</p>
        </div>
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1">A encaisser</p>
          <p className="text-xl font-bold text-orange-400">{fmt(totalInvoicesDue)}</p>
          <p className="text-xs text-[#6b7280] mt-1">{invoices.filter(i => ['SENT','OVERDUE'].includes(i.status)).length} factures émises</p>
        </div>
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-1">Encaissé total</p>
          <p className="text-xl font-bold text-green-400">{fmt(totalPaid)}</p>
          <p className="text-xs text-[#6b7280] mt-1">{invoices.filter(i => i.status === 'PAID').length} payées</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-[#151524] border border-[#2a2a42] rounded-lg p-1 w-fit">
        <button onClick={() => setTab('quotes')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'quotes' ? 'bg-indigo-600 text-white' : 'text-[#6b7280] hover:text-white'}`}>📋 Devis ({quotes.filter(q => !q.invoiceId).length})</button>
        <button onClick={() => setTab('invoices')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'invoices' ? 'bg-indigo-600 text-white' : 'text-[#6b7280] hover:text-white'}`}>🧾 Factures ({invoices.length})</button>
      </div>

      {loading && <div className="text-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>}

      {!loading && tab === 'quotes' && (
        <div className="space-y-3">
          {quotes.length === 0 && (
            <div className="bg-[#151524] border border-[#2a2a42] border-dashed rounded-xl p-12 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-white font-medium">Aucun devis</p>
              <p className="text-sm text-[#6b7280] mt-1">Créez votre premier devis</p>
              <button onClick={() => openModal('quote')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ Nouveau devis</button>
            </div>
          )}
          {quotes.filter(q => !q.invoiceId).map(quote => (
            <div key={quote.id} className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-[#818cf8]">{quote.number}</span>
                    <StatusBadge status={quote.status} type="quote" />
                    {quote.invoiceId && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Facturé</span>}
                  </div>
                  {quote.prospect && <p className="text-sm text-white mt-0.5">{quote.prospect.name}{quote.prospect.company ? ` — ${quote.prospect.company}` : ''}</p>}
                  <p className="text-xs text-[#6b7280] mt-0.5">Créé le {fmtDate(quote.createdAt)}{quote.validUntil ? ` · Valide jusqu'au ${fmtDate(quote.validUntil)}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-white">{fmt(quote.totalTTC)}</p>
                    <p className="text-xs text-[#6b7280]">HT: {fmt(quote.subtotalHT)}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {quote.status === 'DRAFT' && <button disabled={actionLoading === quote.id} onClick={() => updateQuoteStatus(quote.id, 'SENT')} className="text-xs px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded">Envoyer</button>}
                    {quote.status === 'SENT' && <>
                      <button disabled={actionLoading === quote.id} onClick={() => updateQuoteStatus(quote.id, 'ACCEPTED')} className="text-xs px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded">Accepté</button>
                      <button disabled={actionLoading === quote.id} onClick={() => updateQuoteStatus(quote.id, 'DECLINED')} className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded">Refusé</button>
                    </>}
                    {quote.status === 'ACCEPTED' && !quote.invoiceId && <button disabled={actionLoading === quote.id} onClick={() => convertToInvoice(quote.id)} className="text-xs px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded font-medium">→ Facturer</button>}
                    {quote.status === 'DRAFT' && <button disabled={actionLoading === quote.id} onClick={() => deleteDoc(quote.id, 'quote')} className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded">Sup.</button>}
                    {!['ACCEPTED', 'DECLINED'].includes(quote.status) && <button onClick={() => openEditModal(quote)} className="text-xs px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded">✏️ Modifier</button>}
                    <button onClick={() => window.open(`/print/quote/${quote.id}`, '_blank')} className="text-xs px-2 py-1 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded">🖨️ PDF</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'invoices' && (
        <div className="space-y-3">
          {invoices.length === 0 && (
            <div className="bg-[#151524] border border-[#2a2a42] border-dashed rounded-xl p-12 text-center">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-white font-medium">Aucune facture</p>
              <p className="text-sm text-[#6b7280] mt-1">Convertissez un devis accepté ou créez directement</p>
              <button onClick={() => openModal('invoice')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ Nouvelle facture</button>
            </div>
          )}
          {invoices.map(invoice => (
            <div key={invoice.id} className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-[#818cf8]">{invoice.number}</span>
                    <StatusBadge status={invoice.status} type="invoice" />
                    {invoice.transactionId && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Cash mis à jour</span>}
                  </div>
                  {invoice.prospect && <p className="text-sm text-white mt-0.5">{invoice.prospect.name}{invoice.prospect.company ? ` — ${invoice.prospect.company}` : ''}</p>}
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    Créée le {fmtDate(invoice.createdAt)}
                    {invoice.dueDate ? ` · Echéance: ${fmtDate(invoice.dueDate)}` : ''}
                    {invoice.paidAt ? ` · Payée le ${fmtDate(invoice.paidAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-white">{fmt(invoice.totalTTC)}</p>
                    <p className="text-xs text-[#6b7280]">HT: {fmt(invoice.subtotalHT)}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {invoice.status === 'DRAFT' && <button disabled={actionLoading === invoice.id} onClick={() => updateInvoiceStatus(invoice.id, 'SENT')} className="text-xs px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded">Envoyer</button>}
                    {['SENT','OVERDUE'].includes(invoice.status) && <button disabled={actionLoading === invoice.id} onClick={() => updateInvoiceStatus(invoice.id, 'PAID')} className="text-xs px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded font-medium">✓ Payée</button>}
                    {invoice.status === 'DRAFT' && <button disabled={actionLoading === invoice.id} onClick={() => deleteDoc(invoice.id, 'invoice')} className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded">Sup.</button>}
                    <button onClick={() => window.open(`/print/invoice/${invoice.id}`, '_blank')} className="text-xs px-2 py-1 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded">🖨️ PDF</button>
                    <a href={`/api/invoices/${invoice.id}/facturx`} download className="text-xs px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded inline-flex items-center gap-1">⬇️ Factur-X</a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-[#151524] border border-[#2a2a42] rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{modalType === 'quote' ? '📋 Nouveau devis' : '🧾 Nouvelle facture'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#6b7280] hover:text-white text-2xl leading-none">×</button>
            </div>
            {modalType === 'quote' && (
              <div className="mb-4 p-3 bg-[#1a1a2e] rounded-xl border border-[#2a2a42]">
                <p className="text-xs text-[#6b7280] mb-3 font-medium uppercase tracking-wide">Informations client</p>
                <div className="grid grid-cols-2 gap-2">
                   <div className="col-span-2 relative">
                     <div className="flex items-center gap-2">
                       <input value={clientName} onChange={e => handleClientNameSearch(e.target.value)} onBlur={() => setTimeout(() => setShowEnrichDropdown(false), 200)} className="w-full bg-transparent text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-1" placeholder="Nom du client ou société *" />
                       {enrichLoading && <span className="text-[10px] text-indigo-400 animate-pulse">⏳</span>}
                       {clientSiret && !enrichLoading && <span className="text-[10px] text-green-400">✓ SIRET</span>}
                     </div>
                     {showEnrichDropdown && enrichResults.length > 0 && (
                       <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1a1a2e] border border-[#2a2a42] rounded-lg shadow-2xl overflow-hidden">
                         {enrichResults.map((r, i) => (
                           <button key={i} type="button" onMouseDown={() => applyClientEnrichment(r)} className="w-full text-left px-3 py-2 hover:bg-[#2a2a42] transition-colors border-b border-[#2a2a42] last:border-0">
                             <div className="text-sm text-white font-medium truncate">{r.name}</div>
                             <div className="flex gap-2 mt-0.5">
                               {r.city && <span className="text-[10px] text-[#818cf8]">📍 {r.city}</span>}
                               {r.siret && <span className="text-[10px] text-gray-400">SIRET {r.siret.slice(0,9)}...</span>}
                             </div>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                  <div className="col-span-2">
                    <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="w-full bg-transparent text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-1" placeholder="Adresse" />
                  </div>
                  <input value={clientZip} onChange={e => setClientZip(e.target.value)} className="w-full bg-transparent text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-1" placeholder="Code postal" />
                  <input value={clientCity} onChange={e => setClientCity(e.target.value)} className="w-full bg-transparent text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-1" placeholder="Ville" />
                  <div className="col-span-2">
                    <input value={clientSiret} onChange={e => setClientSiret(e.target.value)} className="w-full bg-transparent text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-1" placeholder="SIRET (optionnel)" />
                  </div>
                  <div className="col-span-2">
                    <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} type="email" className="w-full bg-transparent text-white text-sm outline-none border-b border-[#2a2a42] focus:border-[#4f46e5] px-1 py-1" placeholder="Email client (optionnel)" />
                  </div>
                </div>
              </div>
            )}
            <LineEditor lines={lines} onChange={setLines} />
            {modalType === 'quote' && (
              <div className="mt-4">
                <label className="text-xs text-[#6b7280] mb-1 block">Validité (jours)</label>
                <select value={validDays}

 onChange={e => setValidDays(parseInt(e.target.value))} className="mt-1 w-full bg-[#1a1a2e] border border-[#2a2a42] text-white rounded-lg px-3 py-2 text-sm">
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={45}>45 jours</option>
                  <option value={60}>60 jours</option>
                </select>
              </div>
            )}
            <div className="mt-4">
              <label className="text-xs text-[#6b7280] mb-1 block">Notes (optionnel)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-[#1a1a2e] border border-[#2a2a42] text-white rounded-lg px-3 py-2 text-sm resize-none" placeholder="Conditions particulières, mentions..." />
            </div>
            {createError && (
              <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                <p>⚠️ {createError}</p>
                {isUpgradeError && (
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
                      const data = await res.json()
                      if (data.url) window.location.href = data.url
                    }}
                    className="mt-3 w-full px-4 py-2 text-sm font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg transition-colors"
                  >
                    🚀 Upgrader maintenant — 29€/mois
                  </button>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[#6b7280] hover:text-white text-sm transition-colors">Annuler</button>
              <button onClick={handleCreate} disabled={saving || lines.every(l => !l.title)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? 'Création...' : modalType === 'quote' ? 'Créer le devis' : 'Créer la facture'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showBriefModal && (
        <QuoteBriefModal
          onClose={() => setShowBriefModal(false)}
          onParsed={handleBriefParsed}
        />
      )}
    </div>
  )
}
