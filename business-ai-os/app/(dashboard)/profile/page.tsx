'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BrainWizard } from '@/components/ui/BrainWizard'

// ─── Types ───────────────────────────────────────────────────────────────────

interface KBDoc {
  id: string
  name: string
  fileName: string
  fileType: string
  category: string
  size: number
  status: string
  pageCount?: number
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAIN_LEVELS = [
  { min: 76, label: 'Brain expert',    color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  { min: 51, label: 'Brain puissant', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { min: 26, label: 'Brain actif',    color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { min: 0,  label: 'Brain basique',  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
] as const

const CATEGORIES = ['Général', 'Offres & Tarifs', 'Produits & Services', 'Commercial', 'Appels d\'offre', 'Références', 'Admin & Légal']
const FILE_ICONS: Record<string, string> = { pdf: '📄', docx: '📝', pptx: '📊', txt: '📃', md: '📋' }
const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  PROCESSING: { dot: 'bg-yellow-400 animate-pulse', label: 'Indexation...' },
  INDEXED:    { dot: 'bg-green-400', label: 'Indexé' },
  ERROR:      { dot: 'bg-red-400', label: 'Erreur' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBrainLevel(score: number) {
  return BRAIN_LEVELS.find(l => score >= l.min) ?? BRAIN_LEVELS[BRAIN_LEVELS.length - 1]
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0f0f1f] border border-[#2a2a42] rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  )
}

function InputField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#4f46e5]/60 focus:ring-1 focus:ring-[#4f46e5]/30 transition-colors"
      />
    </div>
  )
}

// ─── Tab: Profil Business ─────────────────────────────────────────────────────

function ProfilTab() {
  const [enrichScore, setEnrichScore] = useState(0)
  const [enrichOpen, setEnrichOpen] = useState<Record<string, boolean>>({ offers: false, icp: false, location: false, brief: false })
  const [enrichSaving, setEnrichSaving] = useState<Record<string, boolean>>({})
  const [enrichMsg, setEnrichMsg] = useState<Record<string, { type: 'success' | 'error'; text: string } | null>>({})
  const [milestoneToast, setMilestoneToast] = useState<string | null>(null)
  const prevScoreRef = useRef(0)

  const [offerType, setOfferType] = useState('')
  const [offerDescription, setOfferDescription] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [typicalDuration, setTypicalDuration] = useState('')
  const [targetClient, setTargetClient] = useState('')
  const [clientPainPoint, setClientPainPoint] = useState('')
  const [valueProposition, setValueProposition] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [differentiator, setDifferentiator] = useState('')
  const [targetGeography, setTargetGeography] = useState('')
  const [workLanguages, setWorkLanguages] = useState('')
  const [briefContent, setBriefContent] = useState('')

  useEffect(() => {
    fetch('/api/user/enrichment')
      .then(r => r.json())
      .then(({ data, score }) => {
        if (!data) return
        const s = score ?? 0
        setEnrichScore(s)
        prevScoreRef.current = s
        setOfferType(data.offerType || '')
        setOfferDescription(data.offerDescription || '')
        setPriceRange(data.priceRange || '')
        setTypicalDuration(data.typicalDuration || '')
        setTargetClient(data.targetClient || '')
        setClientPainPoint(data.clientPainPoint || '')
        setValueProposition(data.valueProposition || '')
        setCompetitors(data.competitors || '')
        setDifferentiator(data.differentiator || '')
        setTargetGeography(data.targetGeography || '')
        setWorkLanguages(data.workLanguages || '')
        setBriefContent(data.briefContent || '')
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    const prev = prevScoreRef.current
    const milestones: Record<number, string> = {
      25: '⚡ 25% atteint — ton Focus IA est maintenant personnalisé !',
      50: '📩 50% atteint — les relances IA connaissent ton business !',
      75: '🤖 75% atteint — tes agents sont maintenant calibrés !',
      100: '🧠 100% — Business Brain complet ! Tu as tout débloqué.',
    }
    for (const [pct, msg] of Object.entries(milestones)) {
      const p = parseInt(pct)
      if (prev < p && enrichScore >= p) {
        setMilestoneToast(msg)
        const t = setTimeout(() => setMilestoneToast(null), 4000)
        prevScoreRef.current = enrichScore
        return () => clearTimeout(t)
      }
    }
    prevScoreRef.current = enrichScore
  }, [enrichScore])

  async function saveEnrichSection(section: string, fields: Record<string, string>) {
    setEnrichSaving(prev => ({ ...prev, [section]: true }))
    setEnrichMsg(prev => ({ ...prev, [section]: null }))
    try {
      const res = await fetch('/api/user/enrichment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEnrichScore(data.score ?? enrichScore)
      setEnrichMsg(prev => ({ ...prev, [section]: { type: 'success', text: 'Enregistré !' } }))
      setTimeout(() => setEnrichMsg(prev => ({ ...prev, [section]: null })), 3000)
    } catch {
      setEnrichMsg(prev => ({ ...prev, [section]: { type: 'error', text: 'Erreur lors de la sauvegarde.' } }))
    } finally {
      setEnrichSaving(prev => ({ ...prev, [section]: false }))
    }
  }

  const SUGGESTIONS = [
    { field: valueProposition, label: 'Proposition de valeur', section: 'icp',    impact: 'tes agents seront 3x plus précis', icon: '💡' },
    { field: briefContent,     label: 'Brief commercial',      section: 'brief',   impact: 'le chat Brain sera ultra-personnalisé', icon: '📄' },
    { field: offerType,        label: 'Type d\'offre',          section: 'offers',  impact: 'tes devis et relances IA seront personnalisés', icon: '📦' },
    { field: targetClient,     label: 'Client idéal (ICP)',     section: 'icp',    impact: 'le scoring prospects et contenu LinkedIn seront ciblés', icon: '🎯' },
    { field: differentiator,   label: 'Différenciateur',       section: 'icp',    impact: 'tes posts et pitchs IA seront uniques', icon: '⭐' },
  ]
  const topSuggestion = SUGGESTIONS.find(s => !s.field)

  function openSection(key: string) {
    setEnrichOpen(prev => ({ ...prev, [key]: true }))
    setTimeout(() => {
      document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const level = getBrainLevel(enrichScore)

  return (
    <div className="max-w-2xl mx-auto">
      {milestoneToast && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in flex items-center gap-2">
          {milestoneToast}
        </div>
      )}

      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <p className="text-gray-400 text-sm">
          Plus votre profil est complet, plus votre Business Brain est puissant et personnalisé.
        </p>
        {enrichScore < 80 && (
          <BrainWizard onComplete={(score) => setEnrichScore(score)} />
        )}
      </div>

      <SectionCard title="Complétude de votre Business Brain" icon="🧬">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300 font-medium">Brain Power</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${level.color} ${level.bg} ${level.border}`}>
                {level.label}
              </span>
              <span className="text-sm font-bold text-indigo-400">{enrichScore}%</span>
            </div>
          </div>
          <div className="relative h-2 bg-[#1e1e30] rounded-full overflow-visible mb-1">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${enrichScore}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }}
            />
            {[25, 50, 75, 100].map(m => (
              <div key={m} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${m}%` }}>
                <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                  enrichScore >= m ? 'bg-indigo-400 border-indigo-400' : 'bg-[#1e1e30] border-[#4a4a6a]'
                }`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3">
            {[
              { pct: 25, label: 'Focus IA', icon: '⚡' },
              { pct: 50, label: 'Relances IA', icon: '📩' },
              { pct: 75, label: 'Agents calibrés', icon: '🤖' },
              { pct: 100, label: 'Brain complet', icon: '🧠' },
            ].map(({ pct, label, icon }) => (
              <div key={pct} className="flex flex-col items-center gap-1">
                <span className={`text-xs font-medium ${ enrichScore >= pct ? 'text-indigo-400' : 'text-gray-600' }`}>{icon}</span>
                <span className={`text-[10px] ${ enrichScore >= pct ? 'text-gray-300' : 'text-gray-600' }`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {enrichScore < 100 ? (
          topSuggestion ? (
            <button
              onClick={() => openSection(topSuggestion.section)}
              className="w-full text-left mb-6 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{topSuggestion.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors">Prochaine action recommandée</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ajoute <span className="text-white font-medium">{topSuggestion.label}</span> → {topSuggestion.impact}</p>
                </div>
                <svg className="w-4 h-4 text-indigo-400 ml-auto mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          ) : null
        ) : (
          <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/5 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <div>
              <p className="text-sm font-semibold text-green-300">Business Brain complet !</p>
              <p className="text-xs text-gray-400 mt-0.5">Tous tes agents et outils IA utilisent maintenant ton profil complet.</p>
            </div>
          </div>
        )}

        {([
          {
            key: 'offers', title: 'Offres & Pricing', icon: '📦',
            unlocks: ['Devis IA personnalisés', 'Relances pricing', 'Propositions commerciales'],
            fields: (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Type d&apos;offre</label>
                  <select value={offerType} onChange={e => setOfferType(e.target.value)} className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4f46e5]/60 transition-colors">
                    <option value="">Sélectionner...</option>
                    <option value="mission">Mission / Projet</option>
                    <option value="retainer">Forfait mensuel</option>
                    <option value="product">Produit / SaaS</option>
                    <option value="formation">Formation</option>
                    <option value="mixed">Mixte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Description de votre offre principale</label>
                  <textarea value={offerDescription} onChange={e => setOfferDescription(e.target.value)} rows={3} maxLength={300} placeholder="Ex: Accompagnement 3 mois pour structurer la stratégie commerciale..." className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#4f46e5]/60 resize-none transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Panier moyen</label>
                    <select value={priceRange} onChange={e => setPriceRange(e.target.value)} className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4f46e5]/60 transition-colors">
                      <option value="">Sélectionner...</option>
                      <option value="<1k">&lt; 1 000€</option>
                      <option value="1k-5k">1 000 – 5 000€</option>
                      <option value="5k-15k">5 000 – 15 000€</option>
                      <option value="15k+">15 000€ +</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Durée typique</label>
                    <select value={typicalDuration} onChange={e => setTypicalDuration(e.target.value)} className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4f46e5]/60 transition-colors">
                      <option value="">Sélectionner...</option>
                      <option value="day">1 journée</option>
                      <option value="week">1 semaine</option>
                      <option value="month">1 mois</option>
                      <option value="months">3 mois +</option>
                    </select>
                  </div>
                </div>
              </div>
            ),
            onSave: () => saveEnrichSection('offers', { offerType, offerDescription, priceRange, typicalDuration }),
          },
          {
            key: 'icp', title: 'ICP & Stratégie', icon: '🎯',
            unlocks: ['Agents IA relance', 'Posts LinkedIn ciblés', 'Scoring prospects'],
            fields: (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Profil client idéal (ICP)</label>
                  <textarea value={targetClient} onChange={e => setTargetClient(e.target.value)} rows={3} maxLength={250} placeholder="Ex: Directeurs commerciaux PME tech 20-100 salariés, budget 5-15k..." className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#4f46e5]/60 resize-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Problème principal que vous résolvez</label>
                  <textarea value={clientPainPoint} onChange={e => setClientPainPoint(e.target.value)} rows={2} maxLength={200} placeholder="Ex: Ils perdent des deals faute de relances structurées..." className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#4f46e5]/60 resize-none transition-colors" />
                </div>
                <InputField label="Proposition de valeur en 1 phrase" value={valueProposition} onChange={setValueProposition} placeholder="Ex: Je transforme votre pipeline en machine à revenus prévisibles en 90 jours" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Concurrents principaux" value={competitors} onChange={setCompetitors} placeholder="Ex: Pipedrive, HubSpot" />
                  <InputField label="Votre différenciateur" value={differentiator} onChange={setDifferentiator} placeholder="Ex: Spécialisé SaaS B2B" />
                </div>
              </div>
            ),
            onSave: () => saveEnrichSection('icp', { targetClient, clientPainPoint, valueProposition, competitors, differentiator }),
          },
          {
            key: 'location', title: 'Localisation & Marché', icon: '🌍',
            unlocks: ['Prospection géolocalisée', 'Contenu localisé', 'Marché cible'],
            fields: (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Zone de prospection</label>
                  <select value={targetGeography} onChange={e => setTargetGeography(e.target.value)} className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4f46e5]/60 transition-colors">
                    <option value="">Sélectionner...</option>
                    <option value="local">Local / Région</option>
                    <option value="national">France entière</option>
                    <option value="europe">Europe</option>
                    <option value="international">International</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Langues de travail</label>
                  <select value={workLanguages} onChange={e => setWorkLanguages(e.target.value)} className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4f46e5]/60 transition-colors">
                    <option value="">Sélectionner...</option>
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="fr+en">Bilingue FR/EN</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
            ),
            onSave: () => saveEnrichSection('location', { targetGeography, workLanguages }),
          },
          {
            key: 'brief', title: 'Brief Commercial', icon: '📄',
            unlocks: ['Business Brain enrichi', 'Chat IA contextualisé', 'Agents ultra-personnalisés'],
            fields: (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Pitch, brief ou présentation (max 5000 caractères)</label>
                <textarea value={briefContent} onChange={e => setBriefContent(e.target.value)} rows={8} maxLength={5000} placeholder="Collez ici votre pitch deck, brief commercial, cas clients, FAQ commerciale..." className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#4f46e5]/60 resize-y transition-colors" />
                <p className="text-xs text-gray-500 text-right mt-1">{briefContent.length}/5000</p>
              </div>
            ),
            onSave: () => saveEnrichSection('brief', { briefContent }),
          },
        ] as const).map(section => (
          <div key={section.key} id={`section-${section.key}`} className="border border-[#2a2a42] rounded-xl mb-3 overflow-hidden">
            <button
              onClick={() => setEnrichOpen(prev => ({ ...prev, [section.key]: !prev[section.key] }))}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a2e] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{section.icon}</span>
                <span className="text-sm font-semibold text-white">{section.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex gap-1.5">
                  {section.unlocks.map(u => (
                    <span key={u} className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">{u}</span>
                  ))}
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${enrichOpen[section.key] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {enrichOpen[section.key] && (
              <div className="px-4 pb-4 border-t border-[#2a2a42]">
                <div className="pt-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {section.unlocks.map(u => (
                      <span key={u} className="flex items-center gap-1.5 text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-full">
                        <span>✨</span><span>{u}</span>
                      </span>
                    ))}
                  </div>
                  {section.fields}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={section.onSave}
                      disabled={enrichSaving[section.key]}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {enrichSaving[section.key] ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    {enrichMsg[section.key] && (
                      <span className={`text-sm ${enrichMsg[section.key]?.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {enrichMsg[section.key]?.type === 'success' ? '✅' : '❌'} {enrichMsg[section.key]?.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </SectionCard>
    </div>
  )
}

// ─── Tab: Base de connaissance ────────────────────────────────────────────────

function KBTab() {
  const [docs, setDocs] = useState<KBDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filterCat, setFilterCat] = useState('Tous')
  const [file, setFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [category, setCategory] = useState('Général')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadDocs() }, [])

  async function loadDocs() {
    setLoading(true)
    try {
      const res = await fetch('/api/knowledge')
      if (res.ok) setDocs(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', docName || file.name.replace(/\.[^.]+$/, ''))
      fd.append('category', category)
      const res = await fetch('/api/knowledge', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur upload')
      setUploadMsg({ type: 'success', text: `✅ "${data.name}" indexé avec succès (${data.pageCount ?? 1} page${(data.pageCount ?? 1) > 1 ? 's' : ''})` })
      setDocs(prev => [data, ...prev])
      setFile(null); setDocName(''); setCategory('Général')
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => { setShowModal(false); setUploadMsg(null) }, 2000)
    } catch (err) {
      setUploadMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce document de la Knowledge Base ?')) return
    const res = await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' })
    if (res.ok) setDocs(prev => prev.filter(d => d.id !== id))
  }

  const filtered = filterCat === 'Tous' ? docs : docs.filter(d => d.category === filterCat)
  const indexedCount = docs.filter(d => d.status === 'INDEXED').length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-400">
            {indexedCount} document{indexedCount !== 1 ? 's' : ''} indexé{indexedCount !== 1 ? 's' : ''} — utilisés par le Business Brain Chat
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >+ Ajouter un document</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total documents', value: docs.length, color: 'text-white' },
          { label: 'Indexés', value: indexedCount, color: 'text-green-400' },
          { label: 'En cours', value: docs.filter(d => d.status === 'PROCESSING').length, color: 'text-yellow-400' },
          { label: 'Erreurs', value: docs.filter(d => d.status === 'ERROR').length, color: 'text-red-400' },
        ].map(k => (
          <div key={k.label} className="bg-[#13131f] border border-[#2a2a42] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-6 flex gap-3">
        <span className="text-2xl">🧠</span>
        <div>
          <p className="text-sm font-semibold text-indigo-300">Comment ça fonctionne ?</p>
          <p className="text-xs text-gray-400 mt-1">
            Les documents uploadés sont automatiquement lus et indexés. Le <strong className="text-white">Business Brain Chat</strong> les utilise pour répondre avec le contexte exact de votre activité — tarifs, offres, références clients, appels d&apos;offre...
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['Tous', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterCat === cat ? 'bg-indigo-600 text-white' : 'bg-[#1e1e30] text-gray-400 hover:text-white'
            }`}
          >{cat}</button>
        ))}
      </div>

      {/* Liste documents */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#13131f] border border-[#2a2a42] rounded-xl">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-gray-400 font-medium">Aucun document</p>
          <p className="text-xs text-gray-600 mt-1">Uploadez vos plaquettes, tarifs, présentations...</p>
          <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ Ajouter un document</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const st = STATUS_STYLES[doc.status] ?? STATUS_STYLES.ERROR
            return (
              <div
                key={doc.id}
                className="bg-[#13131f] border border-[#2a2a42] hover:border-[#4f46e5]/40 rounded-xl p-4 flex items-center gap-4 transition-colors cursor-pointer"
                onClick={() => window.open(`/api/knowledge/file?id=${doc.id}`, '_blank')}
              >
                <div className="text-3xl w-10 text-center shrink-0">{FILE_ICONS[doc.fileType] ?? '📎'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm truncate">{doc.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2a42] text-gray-400">{doc.category}</span>
                    <span className="flex items-center gap-1 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      <span className="text-gray-400">{st.label}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.fileName} · {fmtSize(doc.size)}
                    {doc.pageCount ? ` · ${doc.pageCount} page${doc.pageCount > 1 ? 's' : ''}` : ''}
                    · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.status === 'INDEXED' && (
                    <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded hidden sm:inline">👁 Ouvrir</span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(doc.id) }}
                    className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                  >🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-2xl z-40 active:scale-95 transition-transform"
      >+</button>

      {/* Modal upload */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13131f] border border-[#2a2a42] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">📤 Ajouter un document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-[#4f46e5]/40 rounded-xl p-6 text-center cursor-pointer hover:border-[#4f46e5] transition-colors">
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.pptx,.txt,.md"
                  onChange={e => { const f = e.target.files?.[0] ?? null; setFile(f); if (f && !docName) setDocName(f.name.replace(/\.[^.]+$/, '')) }}
                />
                {file ? <p className="text-sm text-indigo-300 font-medium">{file.name} ({fmtSize(file.size)})</p> : <>
                  <p className="text-gray-400 text-sm">Cliquer pour sélectionner un fichier</p>
                  <p className="text-xs text-gray-600 mt-1">PDF, DOCX, PPTX, TXT, MD · max 10Mo</p>
                </>}
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nom du document</label>
                <input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Plaquette commerciale 2026"
                  className="w-full bg-[#0d0d1a] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Catégorie</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#0d0d1a] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {uploadMsg && (
                <div className={`p-3 rounded-lg text-sm ${uploadMsg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{uploadMsg.text}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setUploadMsg(null); setFile(null); setDocName('') }}
                  className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-[#2a2a42] rounded-lg transition-colors">Annuler</button>
                <button type="submit" disabled={uploading || !file}
                  className="flex-1 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-lg transition-all">
                  {uploading ? '⏳ Indexation...' : '📤 Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page principale avec onglets ─────────────────────────────────────────────

function ProfilePageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = searchParams.get('tab') === 'kb' ? 'kb' : 'profil'

  function setTab(t: 'profil' | 'kb') {
    const params = new URLSearchParams(searchParams.toString())
    if (t === 'profil') params.delete('tab')
    else params.set('tab', 'kb')
    router.replace(`/profile${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white p-4 sm:p-6 pb-24 sm:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🧠 Mon Profil Business</h1>
        <p className="text-sm text-gray-400 mt-1">Votre identité business — profil IA et base documentaire</p>
      </div>
      <div className="flex gap-1 bg-[#13131f] border border-[#2a2a42] rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab('profil')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'profil' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'
          }`}>👤 Profil Business</button>
        <button onClick={() => setTab('kb')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'kb' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'
          }`}>📚 Base de connaissance</button>
      </div>
      {tab === 'profil' ? <ProfilTab /> : <KBTab />}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center text-gray-400">Chargement...</div>}>
      <ProfilePageInner />
    </Suspense>
  )
}
