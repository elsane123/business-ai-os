'use client'
import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { QUESTIONS, LEADS_MAP, SECTION_LABELS, SECTION_MAX, TOTAL_MAX } from '@/lib/assessment'

type Phase = 'hero' | 'quiz' | 'lead' | 'results' | 'loading'

interface ResultData {
  scores: Record<string, number> & { total: number }
  roi: { totalHours: number; timeValue: number; revenueMissed: number; totalMonthly: number; annualImpact: number }
  synthesis: string
}

const ACCENT = '#4f46e5'
const NAV_STYLE: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
  background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  borderBottom: '1px solid rgba(79,70,229,0.1)',
  boxShadow: '0 1px 12px rgba(0,0,0,0.06)'
}

function Navbar() {
  return (
    <nav style={NAV_STYLE}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, boxShadow: '0 0 14px rgba(99,102,241,0.4)', flexShrink: 0 }}>🧠</div>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', letterSpacing: '-0.02em' }}>Business AI OS</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: '#64748b', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>← Accueil</Link>
          <Link href="/login" style={{ color: '#64748b', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Se connecter</Link>
          <Link href="/onboarding" style={{
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', fontWeight: 600, fontSize: 14, padding: '8px 18px',
            borderRadius: 10, textDecoration: 'none', boxShadow: '0 0 12px rgba(99,102,241,0.35)'
          }}>Commencer</Link>
        </div>
      </div>
    </nav>
  )
}

const BG = '#f8fafc'

function CircleGauge({ score, max, size = 80 }: { score: number; max: number; size?: number }) {
  const pct = Math.round((score / max) * 100)
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const fill = circ * pct / 100
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 - 4} textAnchor="middle" fontSize={size * 0.18} fontWeight="800" fill="#0f172a">{score}</text>
      <text x={size/2} y={size/2 + 12} textAnchor="middle" fontSize={size * 0.12} fill="#64748b">/{max}</text>
    </svg>
  )
}

export default function AssessmentPage() {
  const [phase, setPhase] = useState<Phase>('hero')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(30).fill(null))
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [results, setResults] = useState<ResultData | null>(null)
  const [error, setError] = useState('')
  const topRef = useRef<HTMLDivElement>(null)

  const q = QUESTIONS[current]
  const scoredQuestions = QUESTIONS.filter(q => q.category !== 'context' && q.category !== 'roi_input')
  const answeredScored = scoredQuestions.filter((sq) => {
    const idx = QUESTIONS.indexOf(sq)
    return answers[idx] !== null
  }).length

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function selectChoice(optionIdx: number) {
    const updated = [...answers]
    updated[current] = optionIdx
    setAnswers(updated)
    setTimeout(() => {
      if (current < QUESTIONS.length - 1) {
        setCurrent(current + 1)
        scrollTop()
      } else {
        setPhase('lead')
        scrollTop()
      }
    }, 200)
  }

  function setSlider(value: number) {
    const updated = [...answers]
    updated[current] = value
    setAnswers(updated)
  }

  function confirmSlider() {
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1)
      scrollTop()
    } else {
      setPhase('lead')
      scrollTop()
    }
  }

  function goBack() {
    if (current > 0) { setCurrent(current - 1); scrollTop() }
    else { setPhase('hero'); scrollTop() }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName || !lastName || !email) { setError('Tous les champs sont requis.'); return }
    setError('')
    setPhase('loading')
    const q5Idx = answers[4] as number
    const roiInputs = {
      avgClientValue: (answers[5] as number) ?? 5000,
      hourlyRate: (answers[6] as number) ?? 150,
      conversionRate: (answers[7] as number) ?? 25,
      leadsPerMonth: LEADS_MAP[q5Idx] ?? 12,
    }
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, answers, roiInputs }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setResults(data)
      setPhase('results')
      scrollTop()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(msg)
      setPhase('lead')
    }
  }

  const progress = Math.round(((current + 1) / QUESTIONS.length) * 100)

  // ── HERO ──────────────────────────────────────────────────────────
  if (phase === 'hero') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 16px 40px', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: 640, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)', borderRadius: 99, padding: '6px 18px', fontSize: 13, color: '#a5b4fc', fontWeight: 600, marginBottom: 24 }}>
          🎯 Diagnostic Business IA — Gratuit
        </div>
        <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 20 }}>
          Où perdez-vous du temps<br />
          <span style={{ background: 'linear-gradient(90deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>et de l&apos;argent</span> chaque jour ?
        </h1>
        <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40 }}>
          30 questions. 8 minutes. Un rapport personnalisé avec votre score de maturité IA,
          votre ROI estimé et un plan d&apos;action concret.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          {['⏱ 8 minutes', '📊 Score détaillé', '💰 ROI calculé', '🤖 Synthèse IA'].map(t => (
            <span key={t} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 99, padding: '6px 14px', fontSize: 13, color: '#cbd5e1' }}>{t}</span>
          ))}
        </div>
        <button
          onClick={() => { setPhase('quiz'); scrollTop() }}
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: 14, padding: '16px 40px', fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(79,70,229,0.5)', transition: 'transform .15s' }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Démarrer mon diagnostic gratuit →
        </button>
      </div>
    </div>
  )

  // ── QUIZ ──────────────────────────────────────────────────────────
  if (phase === 'quiz') return (
    <div ref={topRef} style={{ minHeight: '100vh', background: BG, fontFamily: 'Inter,system-ui,sans-serif', padding: '0 0 60px' }}>
      <Navbar />
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Question {current + 1} / {QUESTIONS.length}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{progress}%</span>
          </div>
          <div style={{ background: '#e2e8f0', borderRadius: 99, height: 6 }}>
            <div style={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: 99, height: 6, width: `${progress}%`, transition: 'width .3s' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {Object.entries(SECTION_LABELS).map(([key, label]) => {
              const active = q?.category === key
              return <span key={key} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: active ? '#ede9fe' : '#f1f5f9', color: active ? '#7c3aed' : '#94a3b8', fontWeight: active ? 700 : 400, transition: 'all .2s' }}>{label}</span>
            })}
          </div>
        </div>
      </div>

      {/* Question card */}
      <div style={{ maxWidth: 640, margin: '32px auto', padding: '0 16px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#7c3aed', background: '#ede9fe', borderRadius: 6, padding: '3px 10px', marginBottom: 16 }}>
            {q?.category !== 'context' && q?.category !== 'roi_input' ? (SECTION_LABELS[q.category] ?? q.category) : q?.category === 'roi_input' ? 'Données ROI' : 'Contexte'}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.4, marginBottom: q?.subtitle ? 8 : 24 }}>{q?.question}</h2>
          {q?.subtitle && <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>{q.subtitle}</p>}

          {q?.type === 'choice' && q.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map((opt, idx) => {
                const selected = answers[current] === idx
                return (
                  <button key={idx} onClick={() => selectChoice(idx)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, border: selected ? '2px solid #4f46e5' : '2px solid #e2e8f0', background: selected ? '#ede9fe' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 15, color: selected ? '#4f46e5' : '#374151', fontWeight: selected ? 700 : 400, transition: 'all .15s' }}
                    onMouseOver={e => { if (!selected) { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.background = '#f5f3ff' } }}
                    onMouseOut={e => { if (!selected) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' } }}
                  >
                    <span style={{ width: 24, height: 24, borderRadius: '50%', border: selected ? '2px solid #4f46e5' : '2px solid #cbd5e1', background: selected ? '#4f46e5' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'white' }} />}
                    </span>
                    {opt.label}                  </button>
                )
              })}
            </div>
          )}

          {q?.type === 'slider' && q.slider && (() => {
            const sv = q.slider!
            const currentVal = typeof answers[current] === 'number' ? (answers[current] as number) : sv.default
            return (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: ACCENT }}>
                    {currentVal.toLocaleString('fr-FR')}
                  </span>
                  <span style={{ fontSize: 18, color: '#64748b', marginLeft: 6 }}>{sv.unit}</span>
                </div>
                <input type="range" min={sv.min} max={sv.max} step={sv.step ?? 1} value={currentVal}
                  onChange={e => setSlider(Number(e.target.value))}
                  style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>
                  <span>{sv.min.toLocaleString('fr-FR')} {sv.unit}</span>
                  <span>{sv.max.toLocaleString('fr-FR')} {sv.unit}</span>
                </div>
                <button onClick={confirmSlider}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Confirmer →
                </button>
              </div>
            )
          })()}

          {/* Back button */}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={goBack}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Précédent
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── LEAD CAPTURE ──────────────────────────────────────────────────
  if (phase === 'lead') return (
    <div ref={topRef} style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 8 }}>Votre diagnostic est prêt !</h2>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>Entrez vos coordonnées pour recevoir votre rapport personnalisé et voir vos résultats.</p>
        </div>
        <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={submitLead} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Prénom *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nom *</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email professionnel *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@entreprise.com"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>
            <button type="submit"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8, boxShadow: '0 4px 16px rgba(79,70,229,0.4)' }}>
              Voir mes résultats →
            </button>
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
              🔒 Aucun spam. Vos données sont confidentielles.
            </p>
          </form>
        </div>
      </div>
    </div>
  )

  // ── LOADING ───────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <Navbar />
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, border: '4px solid rgba(129,140,248,0.2)', borderTop: '4px solid #818cf8', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Analyse en cours…</h2>
        <p style={{ color: '#94a3b8', fontSize: 15 }}>Notre IA génère votre synthèse personnalisée</p>
      </div>
    </div>
  )

  // ── RESULTS ───────────────────────────────────────────────────────
  if (phase === 'results' && results) {
    const { scores, roi, synthesis } = results
    const totalPct = Math.round((scores.total / TOTAL_MAX) * 100)
    const gaugeColor = totalPct >= 70 ? '#22c55e' : totalPct >= 40 ? '#f59e0b' : '#ef4444'
    const maturityLabel = totalPct >= 70 ? 'Optimisé' : totalPct >= 55 ? 'Structuré' : totalPct >= 35 ? 'En construction' : 'Mode survie'

    return (
      <div ref={topRef} style={{ minHeight: '100vh', background: BG, fontFamily: 'Inter,system-ui,sans-serif', padding: '40px 16px 80px' }}>
      <Navbar />
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ede9fe', borderRadius: 99, padding: '6px 18px', fontSize: 13, color: '#7c3aed', fontWeight: 600, marginBottom: 16 }}>
              🎯 Votre Diagnostic Business IA
            </div>
            <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Bonjour {firstName} !</h1>
            <p style={{ color: '#64748b', fontSize: 16 }}>Voici votre rapport de maturité IA personnalisé</p>
          </div>

          {/* Global score */}
          <div style={{ background: 'white', borderRadius: 20, padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', marginBottom: 24, textAlign: 'center' }}>
            <CircleGauge score={scores.total} max={TOTAL_MAX} size={140} />
            <p style={{ fontSize: 22, fontWeight: 800, color: gaugeColor, marginTop: 12 }}>{totalPct}% de maturité IA</p>
            <div style={{ display: 'inline-block', background: totalPct >= 70 ? '#f0fdf4' : totalPct >= 40 ? '#fffbeb' : '#fef2f2', border: `1px solid ${gaugeColor}30`, borderRadius: 99, padding: '4px 16px', fontSize: 14, fontWeight: 700, color: gaugeColor, marginTop: 8 }}>
              {maturityLabel}
            </div>
          </div>

          {/* Section breakdown */}
          <div style={{ background: 'white', borderRadius: 20, padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>📊 Score par domaine</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(Object.entries(SECTION_LABELS) as [string, string][]).map(([key, label]) => {
                const sc = (scores[key] ?? 0) as number
                const mx = SECTION_MAX[key] ?? 1
                const pct = Math.round((sc / mx) * 100)
                const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'
                const emoji = pct >= 70 ? '🟢' : pct >= 40 ? '🟡' : '🔴'
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{emoji} {label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color }}>{sc}/{mx}</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 99, height: 8 }}>
                      <div style={{ background: color, borderRadius: 99, height: 8, width: `${pct}%`, transition: 'width .5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ROI */}
          <div style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', borderRadius: 20, padding: '28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#4f46e5', marginBottom: 20 }}>💰 Votre ROI estimé</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { icon: '⏱', label: 'Heures récupérables/mois', value: `${roi.totalHours}h` },
                { icon: '💼', label: 'Valeur temps mensuelle', value: `${roi.timeValue.toLocaleString('fr-FR')} €` },
                { icon: '📈', label: 'CA manqué estimé/mois', value: `${roi.revenueMissed.toLocaleString('fr-FR')} €` },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ background: 'white', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, marginBottom: 4 }}>🎯 Impact annuel total estimé</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#4f46e5' }}>{roi.annualImpact.toLocaleString('fr-FR')} €</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>en valeur temps + opportunités manquées</div>
            </div>
          </div>

          {/* AI Synthesis */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#166534', marginBottom: 16 }}>🤖 Synthèse IA personnalisée</h2>
            <p style={{ color: '#15803d', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{synthesis}</p>
          </div>

          {/* Email confirmation */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: '16px 20px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📧</span>
            <p style={{ margin: 0, fontSize: 14, color: '#92400e' }}>
              Ce rapport a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.
            </p>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <Link href="/onboarding"
              style={{ display: 'inline-block', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', fontWeight: 700, fontSize: 17, padding: '16px 40px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 8px 32px rgba(79,70,229,0.4)', marginBottom: 16 }}>
              🚀 Créer mon compte gratuit →
            </Link>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 12 }}>
              Rejoignez les entrepreneurs qui ont automatisé leur business avec l&apos;IA
            </p>
            <button onClick={() => { setPhase('hero'); setCurrent(0); setAnswers(Array(30).fill(null)); setResults(null) }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', marginTop: 8 }}>
              Recommencer le diagnostic
            </button>
          </div>

        </div>
      </div>
    )
  }

  // Fallback
  return null
}
