'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 — Identity
  name: string
  email: string
  password: string
  businessName: string
  // Step 2 — Business Profile
  sector: string
  monthlyGoal: string
  fixedCharges: string
  description: string
  // Step 3 — Produits & Offres
  offerType: string
  offerDescription: string
  priceRange: string
  typicalDuration: string
  // Step 4 — Stratégie & ICP
  targetClient: string
  clientPainPoint: string
  valueProposition: string
  competitors: string
  differentiator: string
  // Step 5 — Localisation & Marché
  city: string
  country: string
  targetGeography: string
  workLanguages: string
  // Step 6 — Documentation commerciale
  briefContent: string
}

interface Particle {
  id: number
  left: string
  top: string
  size: string
  duration: string
  delay: string
  opacity: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTORS = [
  { id: 'consulting', label: 'Consulting',  emoji: '🧠' },
  { id: 'tech',       label: 'Tech / SaaS', emoji: '💻' },
  { id: 'commerce',  label: 'Commerce',     emoji: '🛒' },
  { id: 'services',  label: 'Services',     emoji: '⚙️' },
  { id: 'creative',  label: 'Créatif',      emoji: '🎨' },
  { id: 'other',     label: 'Autre',        emoji: '✨' },
]

const OFFER_TYPES = [
  { id: 'mission',   label: 'Mission / Projet', emoji: '🎯' },
  { id: 'retainer',  label: 'Forfait mensuel',   emoji: '📅' },
  { id: 'product',   label: 'Produit / SaaS',   emoji: '📦' },
  { id: 'formation', label: 'Formation',         emoji: '🎓' },
  { id: 'mixed',     label: 'Mixte',             emoji: '🔀' },
]

const PRICE_RANGES = [
  { id: '<1k',    label: '< 1 000€' },
  { id: '1k-5k',  label: '1 000 – 5 000€' },
  { id: '5k-15k', label: '5 000 – 15 000€' },
  { id: '15k+',   label: '15 000€ +' },
]

const DURATIONS = [
  { id: 'day',    label: '1 journée' },
  { id: 'week',   label: '1 semaine' },
  { id: 'month',  label: '1 mois' },
  { id: 'months', label: '3 mois +' },
]

const GEOGRAPHIES = [
  { id: 'local',         label: 'Local / Région' },
  { id: 'national',      label: 'France entière' },
  { id: 'europe',        label: 'Europe' },
  { id: 'international', label: 'International' },
]

const LANGUAGES = [
  { id: 'fr',    label: '🇫🇷 Français' },
  { id: 'en',    label: '🇬🇧 Anglais' },
  { id: 'fr+en', label: '🇫🇷🇬🇧 Bilingue' },
  { id: 'other', label: 'Autre' },
]

const ACTIVATION_MESSAGES = [
  'Analyse de votre profil business...',
  'Construction de votre Business Brain...',
  'Enrichissement de la base de connaissance...',
  'Configuration de vos agents IA...',
  'Calibration de votre ICP...',
  'Activation du Daily Focus...',
  'Votre OS est prêt.',
]

const TOTAL_STEPS = 7 // 0 = welcome, 1-6 = form, 7 = activation

// Deterministic particles
const PARTICLES: Particle[] = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  left:     `${(i * 37 + 7)  % 97}%`,
  top:      `${(i * 53 + 13) % 95}%`,
  size:     `${(i % 3) + 1}px`,
  duration: `${6 + (i % 8)}s`,
  delay:    `${(i * 0.7) % 6}s`,
  opacity:  0.2 + (i % 5) * 0.1,
}))

// ─── Hook: Typewriter ─────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!text) return
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(timer); setDone(true) }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])
  return { displayed, done }
}

// ─── Component: AI Orb ───────────────────────────────────────────────────────

function AIOrb({ active = false, small = false }: { active?: boolean; small?: boolean }) {
  const size      = small ? 80  : 160
  const ringSize  = small ? 120 : 240
  const outerSize = small ? 160 : 320
  return (
    <div style={{ position: 'relative', width: outerSize, height: outerSize, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: outerSize, height: outerSize, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)', animation: active ? 'orb-activate 2s ease-in-out infinite' : 'orb-pulse 3s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: ringSize, height: ringSize, borderRadius: '50%', border: '1px dashed rgba(99,102,241,0.45)', boxShadow: '0 0 12px rgba(99,102,241,0.3)', animation: 'spin-slow 8s linear infinite' }} />
      <div style={{ position: 'absolute', width: ringSize * 0.72, height: ringSize * 0.72, borderRadius: '50%', border: '1px dashed rgba(6,182,212,0.4)', boxShadow: '0 0 10px rgba(6,182,212,0.2)', animation: 'spin-reverse 12s linear infinite' }} />
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #a5b4fc 0%, #6366f1 25%, #8b5cf6 55%, #06b6d4 100%)', boxShadow: '0 0 30px 8px rgba(99,102,241,0.55), 0 0 60px 20px rgba(139,92,246,0.3), inset 0 0 20px rgba(255,255,255,0.12)', animation: active ? 'orb-activate 2s ease-in-out infinite' : 'orb-pulse 3s ease-in-out infinite', position: 'relative' }}>
        <div style={{ position: 'absolute', width: size * 0.28, height: size * 0.28, top: size * 0.1, left: size * 0.18, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.65) 0%, transparent 70%)' }} />
      </div>
    </div>
  )
}

// ─── Component: Floating background particles ─────────────────────────────────

function FloatingParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {PARTICLES.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.left, top: p.top, width: p.size, height: p.size, borderRadius: '50%', background: p.id % 3 === 0 ? 'rgba(99,102,241,0.9)' : p.id % 3 === 1 ? 'rgba(139,92,246,0.8)' : 'rgba(6,182,212,0.8)', opacity: p.opacity, animation: `float ${p.duration} ease-in-out ${p.delay} infinite` }} />
      ))}
      <div style={{ position: 'absolute', top: '8%',    left: '4%',   width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',  filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '6%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',   filter: 'blur(60px)' }} />
    </div>
  )
}

// ─── Component: Top progress rail ─────────────────────────────────────────────

function TopProgressBar({ step }: { step: number }) {
  const pct = step === 0 ? 3 : Math.round((step / TOTAL_STEPS) * 100)
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.05)', zIndex: 60 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)', backgroundSize: '300% 100%', animation: 'gradient-shift 3s ease infinite', transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 0 10px rgba(99,102,241,0.9)' }} />
    </div>
  )
}

// ─── Component: Typewriter line ───────────────────────────────────────────────

function TypewriterLine({ text, speed = 38 }: { text: string; speed?: number }) {
  const { displayed } = useTypewriter(text, speed)
  return (
    <span>
      {displayed}
      <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'rgba(99,102,241,0.9)', marginLeft: 3, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
    </span>
  )
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Field({ label, type = 'text', value, onChange, placeholder, min, maxLength, hint }: {
  label: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; min?: number; maxLength?: number; hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} minLength={min} maxLength={maxLength} className="input-ai" />
      {hint && <p style={{ fontSize: '0.65rem', color: 'rgba(100,116,139,0.7)', fontStyle: 'italic' }}>{hint}</p>}
    </div>
  )
}

function ChipGrid<T extends { id: string; label: string; emoji?: string }>({
  label, items, value, onChange, cols = 3
}: { label: string; items: T[]; value: string; onChange: (v: string) => void; cols?: number }) {
  return (
    <div>
      <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)', marginBottom: 10 }}>{label}</p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
        {items.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)}
            style={{
              padding: '10px 8px', borderRadius: 10,
              border: value === item.id ? '1px solid rgba(99,102,241,0.7)' : '1px solid rgba(255,255,255,0.07)',
              background: value === item.id ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.2s ease',
              boxShadow: value === item.id ? '0 0 16px rgba(99,102,241,0.25)' : 'none',
            }}
          >
            {item.emoji && <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>}
            <span style={{ fontSize: '0.68rem', color: value === item.id ? 'rgba(165,180,252,1)' : 'rgba(148,163,184,0.7)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const BTN_PRIMARY = (enabled: boolean): React.CSSProperties => ({
  flex: 1, padding: '14px 24px',
  background: enabled ? 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)' : 'rgba(255,255,255,0.05)',
  backgroundSize: '200% 200%', animation: enabled ? 'gradient-shift 4s ease infinite' : 'none',
  border: enabled ? 'none' : '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
  color: enabled ? 'white' : 'rgba(148,163,184,0.4)', fontSize: '0.9rem', fontWeight: 600,
  letterSpacing: '0.04em', cursor: enabled ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease',
  boxShadow: enabled ? '0 0 30px rgba(99,102,241,0.35)' : 'none',
})

const BTN_BACK: React.CSSProperties = {
  flex: '0 0 auto', padding: '14px 20px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
  color: 'rgba(148,163,184,0.8)', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s ease',
}

const BTN_SKIP: React.CSSProperties = {
  flex: '0 0 auto', padding: '14px 16px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
  color: 'rgba(100,116,139,0.6)', fontSize: '0.8rem', cursor: 'pointer',
}

function NavRow({ onBack, onNext, onSkip, canNext, nextLabel = 'Continuer →' }: {
  onBack: () => void; onNext: () => void; onSkip?: () => void
  canNext: boolean; nextLabel?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 20, alignItems: 'center' }}>
      <button onClick={onBack} style={BTN_BACK}>←</button>
      <button onClick={onNext} disabled={!canNext} style={BTN_PRIMARY(canNext)}>{nextLabel}</button>
      {onSkip && <button onClick={onSkip} style={BTN_SKIP}>Passer</button>}
    </div>
  )
}

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const DURATION = 2700; const start = Date.now(); let raf: number
    const tick = () => {
      const pct = Math.min(((Date.now() - start) / DURATION) * 100, 100)
      setProgress(pct)
      if (pct < 100) { raf = requestAnimationFrame(tick) } else { setTimeout(onDone, 280) }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onDone])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 48, animation: 'fade-slide-up 0.6s ease-out forwards' }}>
      <AIOrb active={progress > 55} />
      <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
        <p style={{ fontSize: '1.1rem', color: 'rgba(226,232,240,0.9)', fontWeight: 300, letterSpacing: '0.02em', minHeight: '1.8em' }}>
          <TypewriterLine text="Initialisation de votre Business Brain..." speed={44} />
        </p>
        <div style={{ marginTop: 32, width: 280, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', margin: '32px auto 0' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)', backgroundSize: '200% 100%', animation: 'gradient-shift 2s ease infinite', borderRadius: 99, boxShadow: '0 0 12px rgba(99,102,241,0.8)', transition: 'width 0.05s linear' }} />
        </div>
        <p style={{ marginTop: 16, fontSize: '0.7rem', color: 'rgba(100,116,139,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Brainlo · v2.0</p>
      </div>
    </div>
  )
}

// ─── Step 1: Identity ─────────────────────────────────────────────────────────

function StepIdentity({ formData, update, onNext }: {
  formData: FormData; update: (f: keyof FormData, v: string) => void; onNext: () => void
}) {
  const isValidEmail = (email: string) => /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())
  const canContinue = formData.name.trim().length > 0 && isValidEmail(formData.email) && formData.password.length >= 8 && formData.businessName.trim().length > 0
  return (
    <div style={{ animation: 'fade-slide-up 0.5s ease-out forwards', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <AIOrb small />
        <div style={{ paddingTop: 16 }}>
          <p style={{ fontSize: '0.65rem', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>Business Brain</p>
          <p style={{ fontSize: '0.95rem', color: 'rgba(203,213,225,0.85)', fontWeight: 300, lineHeight: 1.6, maxWidth: 300 }}>
            <TypewriterLine text="Bonjour. Je suis votre Business Brain. Commençons par faire connaissance." speed={22} />
          </p>
        </div>
      </div>
      <div className="glass-ai" style={{ borderRadius: 20, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Prénom & Nom" value={formData.name} onChange={v => update('name', v)} placeholder="Jean Dupont" />
          <Field label="Entreprise" value={formData.businessName} onChange={v => update('businessName', v)} placeholder="Acme SAS" />
        </div>
        <Field label="Email professionnel" type="email" value={formData.email} onChange={v => update('email', v)} placeholder="jean@entreprise.com" />
        {formData.email.length > 0 && !isValidEmail(formData.email) && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(251,113,133,0.8)', marginTop: -10 }}>Veuillez saisir une adresse email valide (ex: jean@entreprise.com)</p>
        )}
        <Field label="Mot de passe" type="password" value={formData.password} onChange={v => update('password', v)} placeholder="8 caractères minimum" min={8} />
        {formData.password.length > 0 && formData.password.length < 8 && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(251,113,133,0.8)', marginTop: -10 }}>Le mot de passe doit contenir au moins 8 caractères</p>
        )}
      </div>
      <button onClick={onNext} disabled={!canContinue} style={{ ...BTN_PRIMARY(canContinue), marginTop: 20, width: '100%', display: 'block' }}>
        Continuer →
      </button>
    </div>
  )
}

// ─── Step 2: Business Profile ─────────────────────────────────────────────────

function StepBusiness({ formData, update, onNext, onBack }: {
  formData: FormData; update: (f: keyof FormData, v: string) => void
  onNext: () => void; onBack: () => void
}) {
  const canContinue = formData.sector.length > 0 && formData.description.trim().length > 0
  return (
    <div style={{ animation: 'fade-slide-up 0.5s ease-out forwards', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: '0.65rem', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>Business Brain — Étape 2/6</p>
        <p style={{ fontSize: '0.95rem', color: 'rgba(203,213,225,0.85)', fontWeight: 300, lineHeight: 1.6 }}>
          <TypewriterLine text={"Décrivez votre activité. Ces données calibrent vos agents IA."} speed={24} />
        </p>
      </div>
      <div className="glass-ai" style={{ borderRadius: 20, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ChipGrid label="Secteur" items={SECTORS} value={formData.sector} onChange={v => update('sector', v)} cols={3} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Objectif CA / mois" type="number" value={formData.monthlyGoal} onChange={v => update('monthlyGoal', v)} placeholder="10000" hint="Visez haut" />
          <Field label="Charges fixes / mois" type="number" value={formData.fixedCharges} onChange={v => update('fixedCharges', v)} placeholder="3000" hint="Loyer, abonnements..." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)' }}>Ce que vous faites en 1 phrase</label>
          <textarea value={formData.description} onChange={e => update('description', e.target.value)} placeholder="Ex: J'aide les PME B2B à automatiser leur prospection..." maxLength={200} rows={3} className="input-ai" style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
          <p style={{ fontSize: '0.65rem', color: 'rgba(100,116,139,0.6)', textAlign: 'right' }}>{formData.description.length}/200</p>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} canNext={canContinue} nextLabel="Continuer →" />
    </div>
  )
}

// ─── Step 3: Produits & Offres ────────────────────────────────────────────────

function StepOffers({ formData, update, onNext, onBack }: {
  formData: FormData; update: (f: keyof FormData, v: string) => void
  onNext: () => void; onBack: () => void
}) {
  return (
    <div style={{ animation: 'fade-slide-up 0.5s ease-out forwards', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: '0.65rem', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>Business Brain — Étape 3/6</p>
        <p style={{ fontSize: '0.95rem', color: 'rgba(203,213,225,0.85)', fontWeight: 300, lineHeight: 1.6 }}>
          <TypewriterLine text={"Parlons de vos offres. Je calibrerai votre pricing et pipeline."} speed={26} />
        </p>
      </div>
      <div className="glass-ai" style={{ borderRadius: 20, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ChipGrid label="Type d'offre" items={OFFER_TYPES} value={formData.offerType} onChange={v => update('offerType', v)} cols={3} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)' }}>Décrivez votre offre principale</label>
          <textarea value={formData.offerDescription} onChange={e => update('offerDescription', e.target.value)} placeholder="Ex: Accompagnement 3 mois pour structurer la stratégie commerciale..." maxLength={300} rows={3} className="input-ai" style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)', marginBottom: 10 }}>Panier moyen par client</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {PRICE_RANGES.map(r => (
              <button key={r.id} onClick={() => update('priceRange', r.id)} style={{ padding: '10px 12px', borderRadius: 10, border: formData.priceRange === r.id ? '1px solid rgba(99,102,241,0.7)' : '1px solid rgba(255,255,255,0.07)', background: formData.priceRange === r.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', color: formData.priceRange === r.id ? 'rgba(165,180,252,1)' : 'rgba(148,163,184,0.7)', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s ease' }}>{r.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)', marginBottom: 10 }}>Durée de mission typique</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {DURATIONS.map(d => (
              <button key={d.id} onClick={() => update('typicalDuration', d.id)} style={{ padding: '10px 8px', borderRadius: 10, border: formData.typicalDuration === d.id ? '1px solid rgba(99,102,241,0.7)' : '1px solid rgba(255,255,255,0.07)', background: formData.typicalDuration === d.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', color: formData.typicalDuration === d.id ? 'rgba(165,180,252,1)' : 'rgba(148,163,184,0.7)', fontSize: '0.72rem', fontWeight: 500, transition: 'all 0.2s ease' }}>{d.label}</button>
            ))}
          </div>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} onSkip={onNext} canNext={true} nextLabel="Continuer →" />
    </div>
  )
}

// ─── Step 4: Stratégie & ICP ──────────────────────────────────────────────────

function StepStrategy({ formData, update, onNext, onBack }: {
  formData: FormData; update: (f: keyof FormData, v: string) => void
  onNext: () => void; onBack: () => void
}) {
  return (
    <div style={{ animation: 'fade-slide-up 0.5s ease-out forwards', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: '0.65rem', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>Business Brain — Étape 4/6</p>
        <p style={{ fontSize: '0.95rem', color: 'rgba(203,213,225,0.85)', fontWeight: 300, lineHeight: 1.6 }}>
          <TypewriterLine text={"Qui est votre client idéal ? Ces infos guideront chaque relance."} speed={26} />
        </p>
      </div>
      <div className="glass-ai" style={{ borderRadius: 20, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)' }}>Profil client idéal (ICP)</label>
          <textarea value={formData.targetClient} onChange={e => update('targetClient', e.target.value)} placeholder="Ex: Directeurs commerciaux PME tech 20-100 salariés, budget 5-15k..." maxLength={250} rows={3} className="input-ai" style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)' }}>Problème principal que vous résolvez</label>
          <textarea value={formData.clientPainPoint} onChange={e => update('clientPainPoint', e.target.value)} placeholder="Ex: Ils perdent des deals faute de relances structurées..." maxLength={200} rows={2} className="input-ai" style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
        </div>
        <Field label="Proposition de valeur en 1 phrase" value={formData.valueProposition} onChange={v => update('valueProposition', v)} placeholder="Ex: Je transforme votre pipeline en machine à revenus prévisibles en 90 jours" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Concurrents principaux" value={formData.competitors} onChange={v => update('competitors', v)} placeholder="Ex: Pipedrive, HubSpot" />
          <Field label="Votre différenciateur" value={formData.differentiator} onChange={v => update('differentiator', v)} placeholder="Ex: Spécialisé SaaS B2B" />
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} onSkip={onNext} canNext={true} nextLabel="Continuer →" />
    </div>
  )
}

// ─── Step 5: Localisation & Marché ───────────────────────────────────────────

function StepLocation({ formData, update, onNext, onBack }: {
  formData: FormData; update: (f: keyof FormData, v: string) => void
  onNext: () => void; onBack: () => void
}) {
  return (
    <div style={{ animation: 'fade-slide-up 0.5s ease-out forwards', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: '0.65rem', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>Business Brain — Étape 5/6</p>
        <p style={{ fontSize: '0.95rem', color: 'rgba(203,213,225,0.85)', fontWeight: 300, lineHeight: 1.6 }}>
          <TypewriterLine text={"Où êtes-vous et où prospectez-vous ?"} speed={26} />
        </p>
      </div>
      <div className="glass-ai" style={{ borderRadius: 20, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Ville" value={formData.city} onChange={v => update('city', v)} placeholder="Paris" />
          <Field label="Pays" value={formData.country} onChange={v => update('country', v)} placeholder="France" />
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)', marginBottom: 10 }}>Zone de prospection</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {GEOGRAPHIES.map(g => (
              <button key={g.id} onClick={() => update('targetGeography', g.id)} style={{ padding: '10px 12px', borderRadius: 10, border: formData.targetGeography === g.id ? '1px solid rgba(99,102,241,0.7)' : '1px solid rgba(255,255,255,0.07)', background: formData.targetGeography === g.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', color: formData.targetGeography === g.id ? 'rgba(165,180,252,1)' : 'rgba(148,163,184,0.7)', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s ease' }}>{g.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)', marginBottom: 10 }}>Langues de travail</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => update('workLanguages', l.id)} style={{ padding: '10px 12px', borderRadius: 10, border: formData.workLanguages === l.id ? '1px solid rgba(99,102,241,0.7)' : '1px solid rgba(255,255,255,0.07)', background: formData.workLanguages === l.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', color: formData.workLanguages === l.id ? 'rgba(165,180,252,1)' : 'rgba(148,163,184,0.7)', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s ease' }}>{l.label}</button>
            ))}
          </div>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} onSkip={onNext} canNext={true} nextLabel="Continuer →" />
    </div>
  )
}

// ─── Step 6: Documentation commerciale ───────────────────────────────────────

function StepDocumentation({ formData, update, onNext, onBack }: {
  formData: FormData; update: (f: keyof FormData, v: string) => void
  onNext: () => void; onBack: () => void
}) {
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text().catch(() => '')
    update('briefContent', (formData.briefContent ? formData.briefContent + '\n\n---\n\n' : '') + text.slice(0, 3000))
  }
  return (
    <div style={{ animation: 'fade-slide-up 0.5s ease-out forwards', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: '0.65rem', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>Business Brain — Étape 6/6 — Optionnel</p>
        <p style={{ fontSize: '0.95rem', color: 'rgba(203,213,225,0.85)', fontWeight: 300, lineHeight: 1.6 }}>
          <TypewriterLine text={"Enrichissez votre Business Brain avec vos documents commerciaux."} speed={26} />
        </p>
      </div>
      <div className="glass-ai" style={{ borderRadius: 20, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)' }}>Collez votre brief, pitch ou présentation</label>
          <textarea value={formData.briefContent} onChange={e => update('briefContent', e.target.value)} placeholder="Collez ici votre pitch deck, brief commercial, cas client, description de vos offres..." maxLength={5000} rows={8} className="input-ai" style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, fontSize: '0.85rem' }} />
          <p style={{ fontSize: '0.65rem', color: 'rgba(100,116,139,0.6)', textAlign: 'right' }}>{formData.briefContent.length}/5000</p>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)', display: 'block', marginBottom: 10 }}>Ou importez un fichier texte (.txt, .md)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: 10, cursor: 'pointer', background: 'rgba(99,102,241,0.04)' }}>
            <span style={{ fontSize: '1.4rem' }}>📎</span>
            <div>
              <p style={{ fontSize: '0.82rem', color: 'rgba(165,180,252,0.9)', fontWeight: 500, margin: 0 }}>Importer un document</p>
              <p style={{ fontSize: '0.68rem', color: 'rgba(100,116,139,0.7)', margin: 0 }}>TXT, MD — max 3 000 caractères extraits</p>
            </div>
            <input type="file" accept=".txt,.md" onChange={handleFile} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: '0.7rem', color: 'rgba(129,140,248,0.7)', marginBottom: 6 }}>💡 Exemples de documents utiles :</p>
          <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {['Pitch deck (texte)', 'Brief de vos offres', 'Témoignages clients', 'FAQ commerciale', 'Proposition de valeur détaillée'].map(ex => (
              <li key={ex} style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.7)' }}>{ex}</li>
            ))}
          </ul>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} onSkip={onNext} canNext={true} nextLabel="Activer mes agents IA →" />
    </div>
  )
}

// ─── Step 7: AI Activation ────────────────────────────────────────────────────

function StepActivation({ formData }: { formData: FormData }) {
  const router = useRouter()
  const [visibleCount, setVisibleCount] = useState(0)
  const [checkedCount, setCheckedCount] = useState(0)
  const [error, setError] = useState('')
  const [apiDone, setApiDone] = useState(false)
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true
    const run = async () => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name, email: formData.email, password: formData.password,
            businessName: formData.businessName, sector: formData.sector,
            monthlyGoal: formData.monthlyGoal ? Number(formData.monthlyGoal) : undefined,
            fixedCharges: formData.fixedCharges ? Number(formData.fixedCharges) : undefined,
          }),
        })
        const data = await res.json()
        if (res.status === 409) { router.push('/login?msg=email_exists&email=' + encodeURIComponent(formData.email)); return }
        if (!res.ok) { setError(data.error ?? 'Erreur lors de la création du compte'); return }
        // ── BUG-06 fix: token removed from body — httpOnly cookie set by server
        // Browser includes the httpOnly cookie automatically on subsequent requests
        await fetch('/api/wiki/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'onboarding_complete',
            data: {
              businessName: formData.businessName, sector: formData.sector,
              monthlyGoal: formData.monthlyGoal ? Number(formData.monthlyGoal) : 0,
              fixedCharges: formData.fixedCharges ? Number(formData.fixedCharges) : 0,
              description: formData.description,
              offerType: formData.offerType, offerDescription: formData.offerDescription,
              priceRange: formData.priceRange, typicalDuration: formData.typicalDuration,
              targetClient: formData.targetClient, clientPainPoint: formData.clientPainPoint,
              valueProposition: formData.valueProposition, competitors: formData.competitors,
              differentiator: formData.differentiator, city: formData.city,
              country: formData.country, targetGeography: formData.targetGeography,
              workLanguages: formData.workLanguages, briefContent: formData.briefContent,
            },
          }),
        }).catch(() => null)
        setApiDone(true)
      } catch { setError('Erreur réseau. Vérifiez votre connexion.') }
    }
    run()
  }, [formData, router])

  useEffect(() => {
    if (visibleCount >= ACTIVATION_MESSAGES.length) return
    const t = setTimeout(() => setVisibleCount(v => v + 1), 700)
    return () => clearTimeout(t)
  }, [visibleCount])

  useEffect(() => {
    if (checkedCount >= visibleCount) return
    const t = setTimeout(() => setCheckedCount(c => c + 1), 900)
    return () => clearTimeout(t)
  }, [visibleCount, checkedCount])

  useEffect(() => {
    if (checkedCount >= ACTIVATION_MESSAGES.length && apiDone) {
      const t = setTimeout(() => router.push('/focus'), 600)
      return () => clearTimeout(t)
    }
  }, [checkedCount, apiDone, router])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, animation: 'fade-slide-up 0.5s ease-out forwards', width: '100%' }}>
      <AIOrb active />
      <div style={{ width: '100%', maxWidth: 420 }}>
        {error ? (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(252,165,165,0.9)', fontSize: '0.88rem', textAlign: 'center' }}>{error}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ACTIVATION_MESSAGES.slice(0, visibleCount).map((msg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'fade-slide-up 0.4s ease-out forwards' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: i < checkedCount ? 'none' : '1px solid rgba(99,102,241,0.4)', background: i < checkedCount ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', boxShadow: i < checkedCount ? '0 0 10px rgba(99,102,241,0.5)' : 'none' }}>
                  {i < checkedCount && (<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
                </div>
                <span style={{ fontSize: '0.9rem', color: i < checkedCount ? 'rgba(165,180,252,1)' : 'rgba(203,213,225,0.75)', fontWeight: i < checkedCount ? 500 : 300, transition: 'all 0.3s ease' }}>
                  {i === visibleCount - 1 && i >= checkedCount ? <TypewriterLine text={msg} speed={30} /> : msg}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// ─── Main Page Component ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState<number>(0)
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', password: '', businessName: '',
    sector: '', monthlyGoal: '', fixedCharges: '', description: '',
    offerType: '', offerDescription: '', priceRange: '', typicalDuration: '',
    targetClient: '', clientPainPoint: '', valueProposition: '', competitors: '', differentiator: '',
    city: '', country: '', targetGeography: '', workLanguages: '',
    briefContent: '',
  })

  const update = useCallback(
    (field: keyof FormData, value: string) => setFormData(prev => ({ ...prev, [field]: value })),
    []
  )
  const goNext = useCallback(() => setStep(s => Math.min(s + 1, TOTAL_STEPS)), [])
  const goBack = useCallback(() => setStep(s => Math.max(s - 1, 0)), [])

  return (
    <div style={{ minHeight: '100vh', background: '#030712', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', zIndex: 0 }} />
      <FloatingParticles />
      <TopProgressBar step={step} />

      {/* Step dots */}
      {step > 0 && step < TOTAL_STEPS && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 50 }}>
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div key={s} style={{ width: s === step ? 24 : 8, height: 8, borderRadius: 99, background: s === step ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : s < step ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)', transition: 'all 0.4s ease', boxShadow: s === step ? '0 0 10px rgba(99,102,241,0.6)' : 'none' }} />
          ))}
        </div>
      )}

      {/* Brand mark */}
      {step > 0 && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #a5b4fc 0%, #6366f1 40%, #8b5cf6 100%)', boxShadow: '0 0 12px rgba(99,102,241,0.6)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', background: 'linear-gradient(135deg, #a5b4fc, #8b5cf6, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Brainlo</span>
        </div>
      )}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: step >= 4 ? 580 : 520, padding: step === 0 ? 0 : '80px 20px 60px' }}>
        {step === 0 && <StepWelcome onDone={() => setStep(1)} />}
        {step === 1 && <StepIdentity formData={formData} update={update} onNext={goNext} />}
        {step === 2 && <StepBusiness formData={formData} update={update} onNext={goNext} onBack={goBack} />}
        {step === 3 && <StepOffers formData={formData} update={update} onNext={goNext} onBack={goBack} />}
        {step === 4 && <StepStrategy formData={formData} update={update} onNext={goNext} onBack={goBack} />}
        {step === 5 && <StepLocation formData={formData} update={update} onNext={goNext} onBack={goBack} />}
        {step === 6 && <StepDocumentation formData={formData} update={update} onNext={goNext} onBack={goBack} />}
        {step === 7 && <StepActivation formData={formData} />}
      </div>
    </div>
  )
}
