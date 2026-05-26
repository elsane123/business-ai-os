import Link from 'next/link'
import ParticleCanvas from '@/components/animations/ParticleCanvas'
import HeroOrb from '@/components/animations/HeroOrb'
import BrainloLogo from '@/components/ui/BrainloLogo'

const STATS = [
  { icon: '⚡', value: '5 min', label: 'Temps de setup' },
  { icon: '🧠', value: 'LLM Wiki', label: 'Contexte business persistant' },
  { icon: '💰', value: '29€/mois', label: 'Plan Solo Pro' },
]

const FEATURES = [
  { icon: '⚡', title: 'Daily Focus', desc: '3 actions IA chaque matin, priorisées sur vos données réelles.', tag: 'Solo Pro', pro: true },
  { icon: '💰', title: 'Trésorerie & Runway', desc: 'Solde en temps réel, 3 scénarios de runway, alertes automatiques.', tag: 'Gratuit', pro: false },
  { icon: '👥', title: 'Pipeline Kanban', desc: 'Gérez vos prospects, relances IA en 1 clic, scoring automatique.', tag: 'Solo Pro', pro: true },
  { icon: '📣', title: 'LinkedIn Generator', desc: 'Posts engageants générés depuis votre expertise métier réelle.', tag: 'Gratuit (4/mois)', pro: false },
  { icon: '🧠', title: 'Business Brain', desc: 'Posez n’importe quelle question business. Il lit votre wiki.', tag: 'Solo Pro', pro: true },
]

const FREE_F = [
  { ok: true,  t: '3 prospects' },
  { ok: true,  t: '4 posts LinkedIn/mois' },
  { ok: true,  t: 'Suivi trésorerie' },
  { ok: true,  t: 'Rapport mensuel basique' },
  { ok: false, t: 'Daily Focus IA' },
  { ok: false, t: 'Relances IA' },
  { ok: false, t: 'Chat Business Brain' },
]

const PRO_F = [
  { ok: true, t: 'Tout du plan Free' },
  { ok: true, t: 'Daily Focus 3 actions IA' },
  { ok: true, t: 'Pipeline illimité' },
  { ok: true, t: 'Relances IA en 1 clic' },
  { ok: true, t: 'Chat Business Brain' },
  { ok: true, t: 'Posts LinkedIn illimités' },
  { ok: true, t: 'Rapport mensuel complet' },
]

const WIKI_STEPS = [
  { n: '1️⃣', title: 'Décrivez votre business', desc: 'Onboarding guidé en 5 minutes — secteur, clients, objectifs.' },
  { n: '2️⃣', title: 'Travaillez normalement', desc: 'Pipeline, cash, LinkedIn. Chaque action enrichit le wiki.' },
  { n: '3️⃣', title: "L'IA apprend et s'améliore", desc: 'Contexte persistant. Réponses de plus en plus précises.' },
]

function PlanItem({ ok, t }: { ok: boolean; t: string }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, marginBottom: 10 }}>
      <span style={{ flexShrink: 0, fontSize: 15 }}>{ok ? '✅' : '❌'}</span>
      <span style={{ color: ok ? '#cbd5e1' : '#475569' }}>{t}</span>
    </li>
  )
}

export default function LandingPage() {
  return (
    <div style={{ background: '#0a0a14', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh' }}>

      {/* ═══ NAVBAR ═══ */}
      <nav aria-label="Navigation principale" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(99,102,241,0.14)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrainloLogo size={34} showText={true} textSize="17px" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/login" style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Se connecter</Link>
            <Link href="/assessment" style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Diagnostic IA</Link>
            <a href="/fonctionnalites.html" style={{ color: '#818cf8', fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(129,140,248,0.35)', padding: '6px 14px', borderRadius: 8, transition: 'border-color 0.2s' }} className="hide-sm">🚀 Fonctionnalités</a>
            <Link href="/onboarding" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: '#fff', fontWeight: 600, fontSize: 14, padding: '9px 20px',
              borderRadius: 10, textDecoration: 'none', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>Commencer</Link>
          </div>
        </div>
      </nav>

      <main id="main-content">

      {/* ═══ HERO ═══ */}
      <section
        aria-label="Présentation Brainlo"
        style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', paddingTop: 120, paddingBottom: 80 }}>
        <ParticleCanvas />
        <HeroOrb />
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(79,70,229,0.13) 0%, rgba(124,58,237,0.06) 45%, transparent 70%)',
          zIndex: 2, pointerEvents: 'none' }} />
        <div className="animate-fade-slide-up" style={{ position: 'relative', zIndex: 10,
          maxWidth: 840, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 999, padding: '7px 20px', fontSize: 13, color: '#818cf8', marginBottom: 32 }}>
            <span>✨</span><span>Actuellement en Beta privée</span>
          </div>
          <h1 style={{ fontWeight: 800, lineHeight: 1.1, margin: '0 0 24px',
            fontSize: 'clamp(2.6rem,5.5vw,4.8rem)' }}>
            <span style={{ color: '#fff' }}>Votre Business Brain.</span><br />
            <span className="text-gradient-ai">Augmenté par l&apos;IA.</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem,2vw,1.15rem)', maxWidth: 600,
            lineHeight: 1.75, color: '#94a3b8', margin: '0 auto 40px' }}>
            Le tableau de bord intelligent pour solopreneurs.{' '}
            <span style={{ color: '#e2e8f0' }}>Daily Focus IA</span>,
            trésorerie, pipeline, posts LinkedIn — tout en un.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16,
            justifyContent: 'center', marginBottom: 24 }}>
            <Link href="/onboarding" style={{
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: '#fff', fontWeight: 700, fontSize: 16,
              padding: '15px 34px', borderRadius: 14, textDecoration: 'none',
              boxShadow: '0 0 28px rgba(99,102,241,0.5), 0 4px 20px rgba(0,0,0,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>🚀 Commencer gratuitement</Link>
            <Link href="/login" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0', fontWeight: 500, fontSize: 16,
              padding: '15px 34px', borderRadius: 14, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>Se connecter</Link>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Pas de carte bleue requise · Setup en 5 minutes
          </p>
        </div>
        <div className="animate-float" style={{ position: 'absolute', bottom: 32,
          left: '50%', transform: 'translateX(-50%)', zIndex: 10, opacity: 0.4 }}>
          <div style={{ width: 24, height: 40, borderRadius: 12,
            border: '2px solid rgba(99,102,241,0.5)',
            display: 'flex', justifyContent: 'center', paddingTop: 7 }}>
            <div style={{ width: 4, height: 8, borderRadius: 2, background: '#6366f1' }} />
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section
        aria-label="Chiffres clés"
        style={{ borderTop: '1px solid rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(99,102,241,0.1)', background: 'rgba(15,15,26,0.98)', padding: '52px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 40 }}>
          {STATS.map(s => (
            <div key={s.value} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 28, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section aria-label="Fonctionnalités" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Tout ce dont un solopreneur a besoin</h2>
            <p style={{ color: '#64748b', fontSize: 16, maxWidth: 460, margin: '0 auto' }}>5 modules connectés à votre wiki business IA.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {FEATURES.map(f => (
              <article key={f.title} style={{ background: 'rgba(21,21,36,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: f.pro ? 'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)' : 'linear-gradient(90deg,transparent,rgba(74,222,128,0.4),transparent)' }} />
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 17, color: '#f1f5f9', margin: 0 }}>{f.title}</h3>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: f.pro ? 'rgba(99,102,241,0.15)' : 'rgba(74,222,128,0.12)', color: f.pro ? '#818cf8' : '#4ade80', border: f.pro ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(74,222,128,0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{f.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section aria-label="Tarifs" style={{ padding: '0 24px 96px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Choisissez votre plan</h2>
            <p style={{ color: '#64748b', fontSize: 16, margin: 0 }}>Commencez gratuitement. Upgradez quand vous êtes prêt.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24, alignItems: 'start' }}>

            {/* FREE */}
            <div style={{ background: 'rgba(21,21,36,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '36px 32px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, letterSpacing: '0.1em', marginBottom: 20 }}>GRATUIT</div>
              <div style={{ fontWeight: 800, fontSize: 46, color: '#fff', marginBottom: 4, lineHeight: 1 }}>0<span style={{ fontSize: 18, fontWeight: 500, color: '#64748b' }}>€/mois</span></div>
              <div style={{ color: '#64748b', fontSize: 14, marginBottom: 28, marginTop: 8 }}>Pour démarrer</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {FREE_F.map(f => <PlanItem key={f.t} ok={f.ok} t={f.t} />)}
              </ul>
              <Link href="/onboarding" style={{ display: 'block', textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontWeight: 600, fontSize: 15, padding: '14px', borderRadius: 12, textDecoration: 'none' }}>Commencer gratuitement</Link>
            </div>

            {/* PRO */}
            <div style={{ background: 'linear-gradient(160deg,rgba(79,70,229,0.2) 0%,rgba(21,21,36,0.95) 60%)', border: '1px solid rgba(99,102,241,0.45)', borderRadius: 22, padding: '36px 32px', position: 'relative', boxShadow: '0 0 50px rgba(99,102,241,0.14), 0 8px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 18px', borderRadius: 99, letterSpacing: '0.07em', whiteSpace: 'nowrap', boxShadow: '0 0 14px rgba(99,102,241,0.5)' }}>⭐ POPULAIRE</div>
              <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, letterSpacing: '0.1em', marginBottom: 20 }}>SOLO PRO ⚡</div>
              <div style={{ fontWeight: 800, fontSize: 46, color: '#fff', marginBottom: 4, lineHeight: 1 }}>29<span style={{ fontSize: 18, fontWeight: 500, color: '#64748b' }}>€/mois</span></div>
              <div style={{ color: '#64748b', fontSize: 14, marginBottom: 28, marginTop: 8 }}>Pour les sérieux</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {PRO_F.map(f => <PlanItem key={f.t} ok={f.ok} t={f.t} />)}
              </ul>
              <Link href="/onboarding" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>Démarrer Solo Pro</Link>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: 12, marginBottom: 0 }}>Annulez à tout moment</p>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ LLM WIKI HIGHLIGHT ═══ */}
      <section aria-label="Business Brain" style={{ padding: '96px 24px', background: 'rgba(15,15,26,0.95)', borderTop: '1px solid rgba(99,102,241,0.08)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: '#fff', margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            🧠 Un Business Brain qui apprend de vous
          </h2>
          <p style={{ color: '#64748b', fontSize: 'clamp(0.95rem,2vw,1.1rem)', maxWidth: 640, margin: '0 auto 64px', lineHeight: 1.75 }}>
            Inspiré du concept de wiki LLM d&apos;Andrej Karpathy — votre Business Brain construit une connaissance
            persistante de votre entreprise. À chaque action, il se met à jour et devient plus précis.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
            {WIKI_STEPS.map((step, i) => (
              <div key={i} style={{ background: 'rgba(21,21,36,0.9)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 18, padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,rgba(99,102,241,0.6),rgba(139,92,246,0.6),rgba(6,182,212,0.4))' }} />
                <div style={{ fontSize: 36, marginBottom: 16 }}>{step.n}</div>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: '#f1f5f9', margin: '0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section aria-label="Appel à l'action" style={{ padding: '96px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(79,70,229,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(2rem,4.5vw,3.2rem)', color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Prêt à augmenter votre business ?
          </h2>
          <p style={{ color: '#64748b', fontSize: 18, margin: '0 0 40px' }}>Setup en 5 minutes. Sans carte bleue.</p>
          <Link href="/onboarding" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', fontWeight: 700, fontSize: 18,
            padding: '18px 42px', borderRadius: 16, textDecoration: 'none',
            boxShadow: '0 0 40px rgba(99,102,241,0.55), 0 8px 32px rgba(0,0,0,0.4)'
          }}>🚀 Créer mon compte gratuit</Link>
        </div>
      </section>

      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <span>© 2026 Brainlo · Made with ❤️ · </span>
        <Link href="/privacy" style={{ color: '#374151', textDecoration: 'underline' }}>Politique de confidentialité</Link>
      </footer>

    </div>
  )
}
