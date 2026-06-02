'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string; email: string; password: string; confirmPassword: string; businessName: string
  sector: string; monthlyGoal: string; description: string
  fixedCharges: string; offerType: string; offerDescription: string; priceRange: string
  typicalDuration: string; targetClient: string; clientPainPoint: string
  valueProposition: string; competitors: string; differentiator: string
  city: string; country: string; targetGeography: string; workLanguages: string; briefContent: string
}

interface Particle {
  id: number; left: string; top: string; size: string; duration: string; delay: string; opacity: number
}

const SECTORS = [
  { id: 'consulting', label: 'Consulting',  emoji: '🧠' },
  { id: 'tech',       label: 'Tech / SaaS', emoji: '💻' },
  { id: 'commerce',  label: 'Commerce',     emoji: '🛒' },
  { id: 'services',  label: 'Services',     emoji: '⚙️' },
  { id: 'creative',  label: 'Créatif',      emoji: '🎨' },
  { id: 'other',     label: 'Autre',        emoji: '✨' },
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

const TOTAL_STEPS = 3

const PARTICLES: Particle[] = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  left:     `${(i * 37 + 7)  % 97}%`,
  top:      `${(i * 53 + 13) % 95}%`,
  size:     `${(i % 3) + 1}px`,
  duration: `${6 + (i % 8)}s`,
  delay:    `${(i * 0.7) % 6}s`,
  opacity:  0.2 + (i % 5) * 0.1,
}))

function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    if (!text) return
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])
  return displayed
}

function AIOrb({ active = false, small = false }: { active?: boolean; small?: boolean }) {
  const size = small ? 80 : 160; const ring = small ? 120 : 240; const outer = small ? 160 : 320
  return (
    <div style={{ position: 'relative', width: outer, height: outer, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: outer, height: outer, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)', animation: active ? 'orb-activate 2s ease-in-out infinite' : 'orb-pulse 3s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: ring, height: ring, borderRadius: '50%', border: '1px dashed rgba(99,102,241,0.45)', boxShadow: '0 0 12px rgba(99,102,241,0.3)', animation: 'spin-slow 8s linear infinite' }} />
      <div style={{ position: 'absolute', width: ring * 0.72, height: ring * 0.72, borderRadius: '50%', border: '1px dashed rgba(6,182,212,0.4)', animation: 'spin-reverse 12s linear infinite' }} />
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #a5b4fc 0%, #6366f1 25%, #8b5cf6 55%, #06b6d4 100%)', boxShadow: '0 0 30px 8px rgba(99,102,241,0.55), 0 0 60px 20px rgba(139,92,246,0.3), inset 0 0 20px rgba(255,255,255,0.12)', animation: active ? 'orb-activate 2s ease-in-out infinite' : 'orb-pulse 3s ease-in-out infinite', position: 'relative' }}>
        <div style={{ position: 'absolute', width: size * 0.28, height: size * 0.28, top: size * 0.1, left: size * 0.18, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.65) 0%, transparent 70%)' }} />
      </div>
    </div>
  )
}

function FloatingParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {PARTICLES.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.left, top: p.top, width: p.size, height: p.size, borderRadius: '50%', background: p.id % 3 === 0 ? 'rgba(99,102,241,0.9)' : p.id % 3 === 1 ? 'rgba(139,92,246,0.8)' : 'rgba(6,182,212,0.8)', opacity: p.opacity, animation: `float ${p.duration} ease-in-out ${p.delay} infinite` }} />
      ))}
      <div style={{ position: 'absolute', top: '8%', left: '4%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '6%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
    </div>
  )
}

function TopProgressBar({ step }: { step: number }) {
  const pct = step === 0 ? 3 : Math.round((step / TOTAL_STEPS) * 100)
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.05)', zIndex: 60 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)', backgroundSize: '300% 100%', animation: 'gradient-shift 3s ease infinite', transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 0 10px rgba(99,102,241,0.9)' }} />
    </div>
  )
}

function TypewriterLine({ text, speed = 38 }: { text: string; speed?: number }) {
  const displayed = useTypewriter(text, speed)
  return (
    <span>
      {displayed}
      <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'rgba(99,102,241,0.9)', marginLeft: 3, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
    </span>
  )
}

function WhyCallout({ items }: { items: { icon: string; label: string }[] }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
      <p style={{ fontSize: '0.65rem', color: 'rgba(129,140,248,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>✨ Ces infos permettent à Brainlo de :</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'rgba(165,180,252,0.9)' }}>
            <span>{item.icon}</span><span>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, min, maxLength, hint }: {
  label: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; min?: number; maxLength?: number; hint?: string
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)' }}>{label}</label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} minLength={min} maxLength={maxLength} className="input-ai" />
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
          <button key={item.id} onClick={() => onChange(item.id)} style={{ padding: '10px 8px', borderRadius: 10, border: value === item.id ? '1px solid rgba(99,102,241,0.7)' : '1px solid rgba(255,255,255,0.07)', background: value === item.id ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))' : 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.2s ease', boxShadow: value === item.id ? '0 0 16px rgba(99,102,241,0.25)' : 'none' }}>
            {item.emoji && <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>}
            <span style={{ fontSize: '0.68rem', color: value === item.id ? 'rgba(165,180,252,1)' : 'rgba(148,163,184,0.7)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const BTN_PRIMARY = (on: boolean): React.CSSProperties => ({
  flex: 1, padding: '14px 24px',
  background: on ? 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)' : 'rgba(255,255,255,0.05)',
  backgroundSize: '200% 200%', animation: on ? 'gradient-shift 4s ease infinite' : 'none',
  border: on ? 'none' : '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
  color: on ? 'white' : 'rgba(148,163,184,0.4)', fontSize: '0.9rem', fontWeight: 600,
  letterSpacing: '0.04em', cursor: on ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease',
  boxShadow: on ? '0 0 30px rgba(99,102,241,0.35)' : 'none',
})

const BTN_BACK: React.CSSProperties = {
  flex: '0 0 auto', padding: '14px 20px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
  color: 'rgba(148,163,184,0.8)', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s ease',
}

function NavRow({ onBack, onNext, canNext, nextLabel = 'Continuer' }: {
  onBack: () => void; onNext: () => void; canNext: boolean; nextLabel?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
      <button onClick={onBack} style={BTN_BACK}>&larr;</button>
      <button onClick={onNext} disabled={!canNext} style={BTN_PRIMARY(canNext)}>{nextLabel}</button>
    </div>
  )
}

// Step 0: Welcome

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
        <p style={{ marginTop: 16, fontSize: '0.7rem', color: 'rgba(100,116,139,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Brainlo v2.0</p>
      </div>
    </div>
  )
}

// Step 1: Identity

function StepIdentity({ formData, update, onNext, onBack }: {
  formData: FormData; update: (f: keyof FormData, v: string) => void; onNext: () => void; onBack: () => void
}) {
  const isEmail = (e: string) => /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e.trim())
  const isStrong = (p: string) => /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(p)
  const ok = formData.name.trim().length > 0 && isEmail(formData.email) && formData.password.length >= 8 && isStrong(formData.password) && formData.confirmPassword === formData.password && formData.businessName.trim().length > 0
  return (
    <div style={{ animation: 'fade-slide-up 0.5s ease-out forwards', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <AIOrb small />
        <div style={{ paddingTop: 16 }}>
          <p style={{ fontSize: '0.65rem', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>Etape 1 sur 2</p>
          <p style={{ fontSize: '0.95rem', color: 'rgba(203,213,225,0.85)', fontWeight: 300, lineHeight: 1.6, maxWidth: 300 }}>
            <TypewriterLine text="Bonjour. Je suis votre Business Brain. Faisons connaissance." speed={22} />
          </p>
        </div>
      </div>
      <WhyCallout items={[
        { icon: '🔐', label: 'Securise votre espace Brainlo' },
        { icon: '🧠', label: 'Personnalise vos agents IA' },
        { icon: '📋', label: 'Pre-remplit vos devis et factures' },
        { icon: '⚡', label: 'Active votre Daily Focus' },
      ]} />
      <div className="glass-ai" style={{ borderRadius: 20, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Prenom et Nom" value={formData.name} onChange={v => update('name', v)} placeholder="Jean Dupont" />
          <Field label="Entreprise" value={formData.businessName} onChange={v => update('businessName', v)} placeholder="Acme SAS" />
        </div>
        <Field label="Email professionnel" type="email" value={formData.email} onChange={v => update('email', v)} placeholder="jean@entreprise.com" />
        {formData.email.length > 0 && !isEmail(formData.email) && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(251,113,133,0.8)', marginTop: -10 }}>Adresse email invalide</p>
        )}
        <Field label="Mot de passe" type="password" value={formData.password} onChange={v => update('password', v)} placeholder="8 caracteres minimum" min={8} />
        {formData.password.length > 0 && formData.password.length < 8 && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(251,113,133,0.8)', marginTop: -10 }}>Au moins 8 caracteres requis</p>
        )}
        {formData.password.length >= 8 && !isStrong(formData.password) && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(251,113,133,0.8)', marginTop: -10 }}>Ajoutez majuscule, minuscule et chiffre</p>
        )}
        <Field label="Confirmer le mot de passe" type="password" value={formData.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Repetez votre mot de passe" min={8} />
        {formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(251,113,133,0.8)', marginTop: -10 }}>Les mots de passe ne correspondent pas</p>
        )}
      </div>
      <NavRow onBack={onBack} onNext={onNext} canNext={ok} nextLabel="Continuer" />
    </div>
  )
}

// Step 2: Profil rapide

function StepProfile({ formData, update, onNext, onBack }: {
  formData: FormData; update: (f: keyof FormData, v: string) => void
  onNext: () => void; onBack: () => void
}) {
  const canContinue = formData.sector.length > 0
  return (
    <div style={{ animation: 'fade-slide-up 0.5s ease-out forwards', width: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: '0.65rem', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>Etape 2 sur 2</p>
        <p style={{ fontSize: '0.95rem', color: 'rgba(203,213,225,0.85)', fontWeight: 300, lineHeight: 1.6 }}>
          <TypewriterLine text="Parlez-moi de votre activite. En 30 secondes." speed={26} />
        </p>
      </div>
      <WhyCallout items={[
        { icon: '🤖', label: 'Calibre vos agents IA' },
        { icon: '💡', label: 'Personnalise votre Daily Focus' },
        { icon: '📣', label: 'Adapte vos posts LinkedIn' },
        { icon: '👥', label: 'Optimise vos relances clients' },
      ]} />
      <div className="glass-ai" style={{ borderRadius: 20, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ChipGrid label="Votre secteur" items={SECTORS} value={formData.sector} onChange={v => update('sector', v)} cols={3} />
        <Field
          label="Objectif de chiffre d'affaires mensuel (optionnel)"
          type="number"
          value={formData.monthlyGoal}
          onChange={v => update('monthlyGoal', v)}
          placeholder="10000"
          hint="Permet a l'IA de calibrer votre pipeline et focus quotidien"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.85)' }}>Ce que vous faites en 1 phrase (optionnel)</label>
          <textarea value={formData.description} onChange={e => update('description', e.target.value)} placeholder="Ex: J'accompagne les PME B2B a structurer leur strategie commerciale..." maxLength={200} rows={3} className="input-ai" style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.65rem', color: 'rgba(100,116,139,0.5)', fontStyle: 'italic' }}>Optionnel — vous pourrez completer depuis les parametres</p>
            <p style={{ fontSize: '0.65rem', color: 'rgba(100,116,139,0.6)' }}>{formData.description.length}/200</p>
          </div>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} canNext={canContinue} nextLabel="Activer Brainlo" />
    </div>
  )
}

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
        if (!res.ok) { setError(data.error ?? 'Erreur lors de la creation du compte'); return }
        // Save pitch/description to enrichment briefContent
        if (formData.description.trim()) {
          await fetch('/api/user/enrichment', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ briefContent: formData.description.trim() }),
          }).catch((err) => console.warn('[onboarding] enrichment briefContent save failed:', err))
        }
        await fetch('/api/wiki/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'onboarding_complete',
            data: {
              businessName: formData.businessName, sector: formData.sector,
              monthlyGoal: formData.monthlyGoal ? Number(formData.monthlyGoal) : 0,
              description: formData.description,
            },
          }),
        }).catch(() => null)
        setApiDone(true)
      } catch { setError('Erreur reseau. Verifiez votre connexion.') }
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

// Main Page

export default function OnboardingPage() {
  const [step, setStep] = useState<number>(0)
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', password: '', confirmPassword: '', businessName: '',
    sector: '', monthlyGoal: '', description: '',
    fixedCharges: '', offerType: '', offerDescription: '', priceRange: '',
    typicalDuration: '', targetClient: '', clientPainPoint: '',
    valueProposition: '', competitors: '', differentiator: '',
    city: '', country: '', targetGeography: '', workLanguages: '', briefContent: '',
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

      {step > 0 && step < TOTAL_STEPS && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 50 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ width: s === step ? 24 : 8, height: 8, borderRadius: 99, background: s === step ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : s < step ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)', transition: 'all 0.4s ease', boxShadow: s === step ? '0 0 10px rgba(99,102,241,0.6)' : 'none' }} />
          ))}
        </div>
      )}

      {step > 0 && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #a5b4fc 0%, #6366f1 40%, #8b5cf6 100%)', boxShadow: '0 0 12px rgba(99,102,241,0.6)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', background: 'linear-gradient(135deg, #a5b4fc, #8b5cf6, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Brainlo</span>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 520, padding: step === 0 ? 0 : '80px 20px 60px' }}>
        {step === 0 && <StepWelcome onDone={() => setStep(1)} />}
        {step === 1 && <StepIdentity formData={formData} update={update} onNext={goNext} onBack={goBack} />}
        {step === 2 && <StepProfile formData={formData} update={update} onNext={goNext} onBack={goBack} />}
        {step === 3 && <StepActivation formData={formData} />}
      </div>
    </div>
  )
}
