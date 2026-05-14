'use client'
import { useState, useEffect } from 'react'

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

const SECTORS = [
  'SaaS / Tech', 'Conseil / Coaching', 'Freelance / Indépendant',
  'Commerce / E-commerce', 'Santé / Bien-être', 'Formation / Education',
  'Marketing / Communication', 'Immobilier', 'Finance / Comptabilité',
  'Design / Créatif', 'Juridique', 'Autre',
]

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

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Cal.com form state
  const [calcomWebhookSecret, setCalcomWebhookSecret] = useState('')
  const [calcomBookingUrl, setCalcomBookingUrl] = useState('')
  const [calcomSaving, setCalcomSaving] = useState(false)
  const [calcomMsg, setCalcomMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/profile')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return
        setProfile(user)
        setName(user.name || '')
        setBusinessName(user.businessName || '')
        setSector(user.sector || '')
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
  }, [])

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
          legalName, address, zipCode, city, siret, legalForm, vatNumber }),
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
      if (data.url) window.location.href = data.url
    } catch { /* ignore */ } finally {
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
            label="Nom de l'entreprise / Business"
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
                <option key={s} value={s}>{s}</option>
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
              <InputField label="Raison sociale" value={legalName} onChange={setLegalName} placeholder="Martin Consulting" />
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
    </div>
  )
}