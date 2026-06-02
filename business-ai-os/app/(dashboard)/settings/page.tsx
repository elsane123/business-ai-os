'use client'
import { useState, useEffect, Suspense, type Dispatch, type SetStateAction } from 'react'
import { SECTORS, normalizeSector } from '@/lib/utils'
import { useSearchParams, useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  email: string
  name: string
  businessName?: string
  sector?: string
  monthlyGoal: number
  fixedCharges: number
  linkedinUrl?: string
  plan: string
  createdAt: string
  calcomWebhookSecret?: string
  calcomBookingUrl?: string
}



function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  if (!message) return null
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
      type === 'success'
        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
        : 'bg-red-500/10 border border-red-500/30 text-red-400'
    }`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span>{message}</span>
    </div>
  )
}

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

function InputField({ label, type = 'text', value, onChange, placeholder, hint }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#4f46e5]/60 focus:ring-1 focus:ring-[#4f46e5]/30 transition-colors"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ── Stripe return detection in a separate component to satisfy Suspense requirement ──
type StripeReturnHandlerProps = {
  setProfile: Dispatch<SetStateAction<UserProfile | null>>
  setSubMsg: Dispatch<SetStateAction<{ type: 'success' | 'error'; text: string } | null>>
  router: ReturnType<typeof useRouter>
}

function StripeReturnHandler({ setProfile, setSubMsg, router }: StripeReturnHandlerProps) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    const sessionId = searchParams.get('session_id')
    if (upgrade === 'success' && sessionId) {
      fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.plan === 'PRO') {
            setProfile((prev) => prev ? { ...prev, plan: 'PRO' } : prev)
            setSubMsg({ type: 'success', text: '🎉 Bienvenue dans Solo Pro ! Votre abonnement est actif.' })
            setTimeout(() => setSubMsg(null), 8000)
            router.refresh()
          }
        })
        .catch(() => null)
      window.history.replaceState({}, '', '/settings')
    } else if (upgrade === 'cancel') {
      setSubMsg({ type: 'error', text: 'Paiement annulé. Votre plan reste inchangé.' })
      setTimeout(() => setSubMsg(null), 5000)
      window.history.replaceState({}, '', '/settings')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Cal.com form state
  const [calcomWebhookSecret, setCalcomWebhookSecret] = useState('')
  const [calcomBookingUrl, setCalcomBookingUrl] = useState('')
  const [calcomSaving, setCalcomSaving] = useState(false)
  const [calcomMsg, setCalcomMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Stripe Personal integration state
  const [stripeConnect, setStripeConnect] = useState<{ connected: boolean; maskedKey: string | null; importedCount: number } | null>(null)
  const [stripeApiKeyInput, setStripeApiKeyInput] = useState('')
  const [stripeSaving, setStripeSaving] = useState(false)
  const [stripeSyncing, setStripeSyncing] = useState(false)
  const [stripeMsg, setStripeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stripeSyncResult, setStripeSyncResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)

  // LinkedIn token state
  const [linkedinTokenConfigured, setLinkedinTokenConfigured] = useState(false)
  const [linkedinTokenInput, setLinkedinTokenInput] = useState('')
  const [linkedinTokenSaving, setLinkedinTokenSaving] = useState(false)
  const [linkedinTokenMsg, setLinkedinTokenMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile form state
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [sector, setSector] = useState('')
  const [monthlyGoal, setMonthlyGoal] = useState('')
  const [fixedCharges, setFixedCharges] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  // Champs légaux
  const [legalName, setLegalName] = useState('')
  const [address, setAddress] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [city, setCity] = useState('')
  const [siret, setSiret] = useState('')
  const [legalForm, setLegalForm] = useState('Auto-entrepreneur')
  const [vatNumber, setVatNumber] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password form state
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Subscription state
  const [subLoading, setSubLoading] = useState(false)
  const [subMsg, setSubMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Enrichissement profil
  const [enrichScore, setEnrichScore] = useState(0)
  const [enrichOpen, setEnrichOpen] = useState<Record<string, boolean>>({ offers: false, icp: false, location: false, brief: false })
  const [enrichSaving, setEnrichSaving] = useState<Record<string, boolean>>({})
  const [enrichMsg, setEnrichMsg] = useState<Record<string, { type: 'success' | 'error'; text: string } | null>>({})
  // Offres
  const [offerType, setOfferType] = useState('')
  const [offerDescription, setOfferDescription] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [typicalDuration, setTypicalDuration] = useState('')
  // ICP & Strategie
  const [targetClient, setTargetClient] = useState('')
  const [clientPainPoint, setClientPainPoint] = useState('')
  const [valueProposition, setValueProposition] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [differentiator, setDifferentiator] = useState('')
  // Localisation
  const [targetGeography, setTargetGeography] = useState('')
  const [workLanguages, setWorkLanguages] = useState('')
  // Brief
  const [briefContent, setBriefContent] = useState('')

  // ── Load enrichment ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/enrichment')
      .then(r => r.json())
      .then(({ data, score }) => {
        if (!data) return
        setEnrichScore(score ?? 0)
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
      setEnrichMsg(prev => ({ ...prev, [section]: { type: 'success', text: 'Enregistré avec succès !' } }))
      setTimeout(() => setEnrichMsg(prev => ({ ...prev, [section]: null })), 3000)
    } catch {
      setEnrichMsg(prev => ({ ...prev, [section]: { type: 'error', text: 'Erreur lors de la sauvegarde.' } }))
    } finally {
      setEnrichSaving(prev => ({ ...prev, [section]: false }))
    }
  }

  // ── Load Stripe connect status ──────────────────────────────────────────────
  async function loadStripeConnect() {
    try {
      const res = await fetch('/api/stripe/connect')
      if (res.ok) setStripeConnect(await res.json())
    } catch { /* silent */ }
  }

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/profile')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return
        setProfile(user)
        setName(user.name || '')
        setBusinessName(user.businessName || '')
        setSector(normalizeSector(user.sector || ''))
        setMonthlyGoal(String(user.monthlyGoal || 0))
        setFixedCharges(String(user.fixedCharges || 0))
        setLinkedinUrl(user.linkedinUrl || '')
        setLegalName(user.legalName || '')
        setAddress(user.address || '')
        setZipCode(user.zipCode || '')
        setCity(user.city || '')
        setSiret(user.siret || '')
        setLegalForm(user.legalForm || 'Auto-entrepreneur')
        setVatNumber(user.vatNumber || '')
        setCalcomWebhookSecret(user.calcomWebhookSecret || '')
        setCalcomBookingUrl(user.calcomBookingUrl || '')
      })
      .finally(() => setLoading(false))
    loadStripeConnect()
    loadLinkedinToken()
  }, [])

  // ── LinkedIn token ────────────────────────────────────────────────────────────
  async function loadLinkedinToken() {
    try {
      const res = await fetch('/api/user/linkedin-token')
      if (res.ok) {
        const data = await res.json()
        setLinkedinTokenConfigured(data.configured ?? false)
      }
    } catch { /* silent */ }
  }

  async function handleSaveLinkedinToken(e: React.FormEvent) {
    e.preventDefault()
    if (!linkedinTokenInput.trim()) return
    setLinkedinTokenSaving(true)
    setLinkedinTokenMsg(null)
    try {
      const res = await fetch('/api/user/linkedin-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: linkedinTokenInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setLinkedinTokenInput('')
      setLinkedinTokenConfigured(true)
      setLinkedinTokenMsg({ type: 'success', text: '✅ Token LinkedIn enregistré' })
    } catch (err: unknown) {
      setLinkedinTokenMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setLinkedinTokenSaving(false)
      setTimeout(() => setLinkedinTokenMsg(null), 5000)
    }
  }

  async function handleDisconnectLinkedin() {
    if (!confirm('Supprimer le token LinkedIn ?')) return
    try {
      await fetch('/api/user/linkedin-token', { method: 'DELETE' })
      setLinkedinTokenConfigured(false)
      setLinkedinTokenMsg({ type: 'success', text: 'Token LinkedIn supprimé' })
    } catch { /* silent */ }
  }

  // ── Save Stripe personal API key ─────────────────────────────────────────────
  async function handleSaveStripeKey(e: React.FormEvent) {
    e.preventDefault()
    if (!stripeApiKeyInput.trim()) return
    setStripeSaving(true)
    setStripeMsg(null)
    try {
      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: stripeApiKeyInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setStripeApiKeyInput('')
      setStripeMsg({ type: 'success', text: '✅ Clé Stripe connectée avec succès !' })
      await loadStripeConnect()
    } catch (err: unknown) {
      setStripeMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setStripeSaving(false)
      setTimeout(() => setStripeMsg(null), 5000)
    }
  }

  // ── Sync Stripe invoices as Cash transactions ────────────────────────────────
  async function handleStripeSync() {
    setStripeSyncing(true)
    setStripeMsg(null)
    setStripeSyncResult(null)
    try {
      const res = await fetch('/api/stripe/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur synchronisation')
      setStripeSyncResult({ imported: data.imported, skipped: data.skipped, total: data.total })
      setStripeMsg({ type: 'success', text: `✅ Sync terminée — ${data.imported} nouvelle(s) transaction(s) importée(s)` })
      await loadStripeConnect()
    } catch (err: unknown) {
      setStripeMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setStripeSyncing(false)
      setTimeout(() => setStripeMsg(null), 6000)
    }
  }

  // ── Disconnect Stripe ────────────────────────────────────────────────────────
  async function handleDisconnectStripe() {
    if (!confirm('Déconnecter votre compte Stripe ? Les transactions déjà importées seront conservées.')) return
    try {
      await fetch('/api/stripe/connect', { method: 'DELETE' })
      setStripeConnect({ connected: false, maskedKey: null, importedCount: 0 })
      setStripeSyncResult(null)
    } catch { /* silent */ }
  }

  // ── Save profile ────────────────────────────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, businessName, sector, monthlyGoal, fixedCharges, linkedinUrl,
          legalName: businessName, address, zipCode, city, siret, legalForm, vatNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setProfile((prev) => prev ? { ...prev, ...data.user } : data.user)
      setProfileMsg({ type: 'success', text: 'Profil mis à jour avec succès !' })
    } catch (err: unknown) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setProfileSaving(false)
      setTimeout(() => setProfileMsg(null), 4000)
    }
  }

  // ── Change password ─────────────────────────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }
    if (newPwd.length < 8) {
      setPwdMsg({ type: 'error', text: 'Le mot de passe doit faire au moins 8 caractères' })
      return
    }
    setPwdSaving(true)
    setPwdMsg(null)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setPwdMsg({ type: 'success', text: 'Mot de passe mis à jour !' })
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err: unknown) {
      setPwdMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setPwdSaving(false)
      setTimeout(() => setPwdMsg(null), 4000)
    }
  }

  // ── Upgrade / Manage subscription ──────────────────────────────────────────
  async function handleUpgrade() {
    setSubLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à niveau')
      if (data.url && data.url.startsWith('http')) {
        // Redirection vers Stripe
        window.location.href = data.url
      } else {
        // Mode test : upgrade direct, recharger le profil
        const profileRes = await fetch('/api/auth/profile')
        const profileData = await profileRes.json()
        if (profileData.user) setProfile(profileData.user)
        if (profile?.plan !== 'PRO' && profileData.user?.plan === 'PRO') {
          setSubMsg({ type: 'success', text: '🎉 Bienvenue dans Solo Pro ! Votre plan a été activé avec succès.' })
          setTimeout(() => setSubMsg(null), 6000)
        }
      }
    } catch (err: unknown) {
      setSubMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur lors de la mise à niveau' })
      setTimeout(() => setSubMsg(null), 5000)
    } finally {
      setSubLoading(false)
    }
  }

  // ── Save Cal.com settings ───────────────────────────────────────────────
  async function handleSaveCalcom(e: React.FormEvent) {
    e.preventDefault()
    setCalcomSaving(true)
    setCalcomMsg(null)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calcomWebhookSecret, calcomBookingUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setCalcomMsg({ type: 'success', text: 'Paramètres Cal.com enregistrés !' })
    } catch (err: unknown) {
      setCalcomMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setCalcomSaving(false)
      setTimeout(() => setCalcomMsg(null), 4000)
    }
  }

  async function handleManageSubscription() {
    setSubLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'no_customer') {
        setSubMsg({ type: 'error', text: '⚠️ Aucun abonnement Stripe actif détecté. Veuillez contacter le support ou souscrire à nouveau.' })
        setTimeout(() => setSubMsg(null), 8000)
      } else {
        setSubMsg({ type: 'error', text: data.message || 'Impossible d\'accéder au portail de gestion.' })
        setTimeout(() => setSubMsg(null), 6000)
      }
    } catch {
      setSubMsg({ type: 'error', text: 'Erreur de connexion. Veuillez réessayer.' })
      setTimeout(() => setSubMsg(null), 5000)
    } finally {
      setSubLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isPro = profile?.plan === 'PRO'
  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(profile.createdAt))
    : ''

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Suspense fallback={null}>
        <StripeReturnHandler setProfile={setProfile} setSubMsg={setSubMsg} router={router} />
      </Suspense>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 mt-1 text-sm">Gérez votre profil, sécurité et abonnement</p>
      </div>

      {/* ── Section 1 : Profil ────────────────────────────────────────────── */}
      <SectionCard title="Profil" icon="👤">
        {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nom complet" value={name} onChange={setName} placeholder="Jean Dupont" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full bg-[#0a0a1a] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-600 mt-1">Non modifiable</p>
            </div>
          </div>

          <InputField
            label="Nom de l'entreprise / Raison sociale"
            value={businessName}
            onChange={setBusinessName}
            placeholder="Ma Super Boîte"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Secteur d&apos;activité</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4f46e5]/60 transition-colors"
            >
              <option value="">Choisir un secteur...</option>
              {SECTORS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Objectif CA mensuel (€)"
              type="number"
              value={monthlyGoal}
              onChange={setMonthlyGoal}
              placeholder="5000"
              hint="Utilisé pour les alertes et le runway"
            />
            <InputField
              label="Charges fixes mensuelles (€)"
              type="number"
              value={fixedCharges}
              onChange={setFixedCharges}
              placeholder="2000"
              hint="Loyer, abonnements, salaires..."
            />
          </div>

          <InputField
            label="URL LinkedIn"
            value={linkedinUrl}
            onChange={setLinkedinUrl}
            placeholder="https://linkedin.com/in/votre-profil"
          />

          {/* Informations légales */}
          <div className="pt-4 border-t border-[#2a2a42]">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🏢 Informations légales (devis & factures)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <InputField label="Forme juridique" value={legalForm} onChange={setLegalForm} placeholder="Auto-entrepreneur" />
              <InputField label="Adresse" value={address} onChange={setAddress} placeholder="12 rue de la Paix" />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Code postal" value={zipCode} onChange={setZipCode} placeholder="75001" />
                <InputField label="Ville" value={city} onChange={setCity} placeholder="Paris" />
              </div>
              <InputField label="N° SIRET" value={siret} onChange={setSiret} placeholder="83812345600012" />
              <InputField label="N° TVA intracommunautaire" value={vatNumber} onChange={setVatNumber} placeholder="FR12838123456 (optionnel)" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2 bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {profileSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Lien enrichissement ──────────────────────────────────────────── */}
      <div className="-mt-3 mb-6 flex justify-end">
        <a
          href="#enrich"
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>🧬</span>
          <span>Enrichir mon profil</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>

      {/* ── Section 2 : Sécurité ─────────────────────────────────────────── */}
      <SectionCard title="Sécurité" icon="🔒">
        {pwdMsg && <Alert type={pwdMsg.type} message={pwdMsg.text} />}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <InputField
            label="Mot de passe actuel"
            type="password"
            value={currentPwd}
            onChange={setCurrentPwd}
            placeholder="••••••••"
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Nouveau mot de passe"
              type="password"
              value={newPwd}
              onChange={setNewPwd}
              placeholder="••••••••"
              hint="Minimum 8 caractères"
            />
            <InputField
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPwd}
              onChange={setConfirmPwd}
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwdSaving}
              className="px-6 py-2 bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {pwdSaving ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Section Cal.com — Intégration RDV ──────────────────────────── */}
      <div id="calcom" className="scroll-mt-4">
      <SectionCard title="Intégration Cal.com" icon="📅">
        {calcomMsg && <Alert type={calcomMsg.type} message={calcomMsg.text} />}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 mb-4">
          <p className="font-semibold mb-1">📖 Comment configurer ?</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-200">
            <li>Dans Cal.com, allez dans <strong>Settings → Developer → Webhooks</strong></li>
            <li>Créez un webhook avec l&apos;URL + <code className="bg-[#0a0a1a] px-1 rounded text-indigo-300">/api/calcom/webhook?secret=VOTRE_SECRET</code></li>
            <li>Activez : <strong>BOOKING_CREATED</strong>, <strong>BOOKING_CANCELLED</strong>, <strong>BOOKING_RESCHEDULED</strong></li>
            <li>Renseignez ce même secret ci-dessous</li>
          </ol>
        </div>
        <form onSubmit={handleSaveCalcom} className="space-y-4">
          <InputField
            label="Secret Webhook Cal.com"
            type="password"
            value={calcomWebhookSecret}
            onChange={setCalcomWebhookSecret}
            placeholder="mon-secret-webhook-calcom"
            hint="Utilisé pour identifier et sécuriser vos webhooks Cal.com"
          />
          <InputField
            label="URL de prise de RDV Cal.com"
            value={calcomBookingUrl}
            onChange={setCalcomBookingUrl}
            placeholder="https://cal.com/votre-username"
            hint="Inclus automatiquement dans vos relances et messages prospects"
          />
          {calcomBookingUrl && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#151524] border border-[#2a2a42]">
              <span>✅</span>
              <div>
                <p className="text-xs text-gray-300 font-medium">Lien de réservation actif</p>
                <a href={calcomBookingUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline break-all">
                  {calcomBookingUrl}
                </a>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={calcomSaving}
              className="px-6 py-2 bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {calcomSaving ? 'Enregistrement...' : 'Enregistrer Cal.com'}
            </button>
          </div>
        </form>
      </SectionCard>
      </div>

      {/* ── Section Stripe Personnel — Import Transactions ───────────────── */}
      <div id="stripe-perso">
      <SectionCard title="Intégration Stripe — Import Transactions" icon="💳">
        {stripeMsg && <Alert type={stripeMsg.type} message={stripeMsg.text} />}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 mb-4">
          <p className="font-semibold mb-1">💡 À quoi ça sert ?</p>
          <p className="text-blue-200">Connectez votre compte Stripe personnel pour importer automatiquement vos factures payées comme transactions INCOME dans votre trésorerie. Fonctionne avec les ventes ponctuelles <strong>et</strong> les abonnements récurrents.</p>
        </div>

        {stripeConnect?.connected ? (
          <div className="space-y-4">
            {/* Connected status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <p className="text-sm font-medium text-green-300">Compte Stripe connecté</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">Clé : {stripeConnect.maskedKey} · {stripeConnect.importedCount} transaction(s) importée(s)</p>
                </div>
              </div>
              <button
                onClick={handleDisconnectStripe}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/20 rounded-lg transition-colors"
              >
                Déconnecter
              </button>
            </div>

            {/* Sync button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleStripeSync}
                disabled={stripeSyncing}
                className="flex-1 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {stripeSyncing ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Synchronisation en cours...</>
                ) : (
                  <>🔄 Synchroniser les factures Stripe</>
                )}
              </button>
            </div>

            {/* Sync result */}
            {stripeSyncResult && (
              <div className="p-3 rounded-lg bg-[#151524] border border-[#2a2a42] text-xs">
                <p className="font-semibold text-white mb-1">📊 Résultat de la synchronisation</p>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="text-center"><p className="text-2xl font-bold text-green-400">{stripeSyncResult.imported}</p><p className="text-[#6b7280] mt-0.5">Importées</p></div>
                  <div className="text-center"><p className="text-2xl font-bold text-[#818cf8]">{stripeSyncResult.skipped}</p><p className="text-[#6b7280] mt-0.5">Déjà présentes</p></div>
                  <div className="text-center"><p className="text-2xl font-bold text-white">{stripeSyncResult.total}</p><p className="text-[#6b7280] mt-0.5">Total Stripe</p></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveStripeKey} className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-2">
              <p className="font-semibold mb-1">🔑 Comment obtenir votre clé ?</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-200">
                <li>Dans Stripe, allez dans <strong>Développeurs → Clés API</strong></li>
                <li>Créez une <strong>clé restreinte</strong> avec accès lecture sur <strong>Invoices</strong></li>
                <li>Copiez la clé (<code className="bg-[#0a0a1a] px-1 rounded text-indigo-300">rk_live_...</code>) ci-dessous</li>
              </ol>
            </div>
            <InputField
              label="Clé API Stripe restreinte"
              type="password"
              value={stripeApiKeyInput}
              onChange={setStripeApiKeyInput}
              placeholder="rk_live_... ou sk_live_..."
              hint="Utilisée uniquement côté serveur pour lire vos factures payées"
            />
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={stripeSaving || !stripeApiKeyInput.trim()}
                className="px-6 py-2 bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {stripeSaving ? 'Validation...' : 'Connecter Stripe'}
              </button>
            </div>
          </form>
        )}

        {/* ── LinkedIn Token ───────────────────────────────────────────────── */}
        <div className="mt-6 pt-6 border-t border-[#2a2a42]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-200">🔗 Token LinkedIn</p>
              <p className="text-xs text-gray-400 mt-0.5">Requis pour publier via l&apos;Agent CMO</p>
            </div>
            {linkedinTokenConfigured && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                ✅ Configuré
              </span>
            )}
          </div>
          {linkedinTokenMsg && <Alert type={linkedinTokenMsg.type} message={linkedinTokenMsg.text} />}
          {linkedinTokenConfigured ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#151524] border border-[#2a2a42]">
              <p className="text-xs text-gray-400">Token enregistré — masqué pour votre sécurité</p>
              <button
                onClick={handleDisconnectLinkedin}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Supprimer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveLinkedinToken} className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <p className="font-semibold mb-1">🔑 Comment obtenir votre token ?</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-200">
                  <li>Créez une app sur <strong>LinkedIn Developers</strong></li>
                  <li>Générez un token OAuth avec les scopes <code className="bg-[#0a0a1a] px-1 rounded text-indigo-300">w_member_social</code></li>
                  <li>Copiez le token d&apos;accès ci-dessous</li>
                </ol>
              </div>
              <InputField
                label="Token d'accès LinkedIn"
                type="password"
                value={linkedinTokenInput}
                onChange={setLinkedinTokenInput}
                placeholder="AQV..."
                hint="Utilisé uniquement pour publier vos posts via l'Agent CMO"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={linkedinTokenSaving || !linkedinTokenInput.trim()}
                  className="px-6 py-2 bg-[#f472b6] hover:bg-[#ec4899] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {linkedinTokenSaving ? 'Enregistrement...' : 'Connecter LinkedIn'}
                </button>
              </div>
            </form>
          )}
        </div>
      </SectionCard>
      </div>

      {/* ── Section 3 : Abonnement ───────────────────────────────────────── */}
      <SectionCard title="Abonnement" icon="💳">
        <div className="space-y-4">
          {subMsg && <Alert type={subMsg.type} message={subMsg.text} />}
          {/* Plan actuel */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#151524] border border-[#2a2a42]">
            <div>
              <p className="text-sm font-medium text-gray-300">Plan actuel</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-lg font-bold ${ isPro ? 'text-[#818cf8]' : 'text-gray-400' }`}>
                  {isPro ? '⚡ Solo Pro' : '🆓 Solo Free'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isPro
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {isPro ? '29€/mois' : 'Gratuit'}
                </span>
              </div>
              {memberSince && (
                <p className="text-xs text-gray-600 mt-1">Membre depuis {memberSince}</p>
              )}
            </div>
            {isPro ? (
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xl">
                ⚡
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center text-xl">
                🆓
              </div>
            )}
          </div>

          {/* CTA Upgrade ou Gérer */}
          {!isPro ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
              <p className="text-sm font-semibold text-white mb-1">Passez au plan Solo Pro</p>
              <p className="text-xs text-gray-400 mb-4">
                Daily Focus IA, relances intelligentes, Business Brain complet, pipeline illimité.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-300">
                {['✅ Daily Focus à 8h', '✅ Relances IA illimitées', '✅ Chat Business Brain', '✅ Pipeline illimité'].map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
              <button
                onClick={handleUpgrade}
                disabled={subLoading}
                className="w-full py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {subLoading ? 'Redirection...' : '🚀 Passer à Solo Pro — 29€/mois'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  '✅ Daily Focus IA chaque matin',
                  '✅ Chat Business Brain',
                  '✅ Relances IA illimitées',
                  '✅ Pipeline illimité',
                  '✅ Générateur LinkedIn',
                  '✅ LLM Wiki mémoire',
                ].map((f) => (
                  <span key={f} className="text-xs text-gray-300">{f}</span>
                ))}
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={subLoading}
                className="w-full py-2.5 bg-[#151524] hover:bg-[#1e1e3f] border border-[#2a2a42] hover:border-[#4f46e5]/50 disabled:opacity-50 text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                {subLoading ? 'Redirection...' : '⚙️ Gérer mon abonnement'}
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Section : Enrichir mon profil ──────────────────────────────────── */}
      <div id="enrich" className="scroll-mt-4">
      <SectionCard title="Enrichir mon profil" icon="🧬">
        {/* Score de complétude */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300 font-medium">Complétude de votre Business Brain</span>
            <span className="text-sm font-bold text-indigo-400">{enrichScore}%</span>
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

        {/* Accordion sections */}
        {([
          {
            key: 'offers',
            title: 'Offres & Pricing',
            icon: '📦',
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
            key: 'icp',
            title: 'ICP & Stratégie',
            icon: '🎯',
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
            key: 'location',
            title: 'Localisation & Marché',
            icon: '🌍',
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
            key: 'brief',
            title: 'Brief Commercial',
            icon: '📄',
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
          <div key={section.key} className="border border-[#2a2a42] rounded-xl mb-3 overflow-hidden">
            {/* Accordion header */}
            <button
              onClick={() => setEnrichOpen(prev => ({ ...prev, [section.key]: !prev[section.key] }))}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a2e] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{section.icon}</span>
                <span className="text-sm font-semibold text-white">{section.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Unlock chips */}
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

            {/* Accordion body */}
            {enrichOpen[section.key] && (
              <div className="px-4 pb-4 border-t border-[#2a2a42]">
                <div className="pt-4">
                  {/* Unlock callout */}
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
    </div>
  )
}
