import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllArticles } from '@/lib/blog'

// Cache ISR — revalidation toutes les 24h en production
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Blog Brainlo — Conseils IA pour solopreneurs et PME',
  description:
    'Guides, méthodes et outils pour solopreneurs et PME. Trésorerie, productivité, acquisition clients, intelligence artificielle. Ressources gratuites.',
  alternates: { canonical: 'https://brainlo.ai/blog' },
  openGraph: {
    title: 'Blog Brainlo — Ressources pour solopreneurs',
    description: 'Guides pratiques, méthodes et outils pour gérer et développer votre business solo avec l\'IA.',
    url: 'https://brainlo.ai/blog',
  },
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Finance:      { bg: 'rgba(74,222,128,0.1)',   text: '#4ade80' },
  Productivité: { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  Comparatifs:  { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
  Marketing:    { bg: 'rgba(244,114,182,0.12)', text: '#f472b6' },
}

export default async function BlogPage() {
  const articles = await getAllArticles()

  return (
    <div style={{ background: '#0a0a14', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh' }}>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(99,102,241,0.14)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, flexShrink: 0 }}>🧠</div>
            <span style={{ fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: '-0.02em' }}>Brainlo</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/" style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Accueil</Link>
            <Link href="/assessment" style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Diagnostic IA</Link>
            <Link href="/onboarding" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: '#fff', fontWeight: 600, fontSize: 14, padding: '9px 20px',
              borderRadius: 10, textDecoration: 'none' }}>Commencer</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HEADER ═══ */}
      <header style={{ paddingTop: 120, paddingBottom: 64, textAlign: 'center', padding: '120px 24px 64px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 999, padding: '6px 18px', fontSize: 13, color: '#818cf8', marginBottom: 24 }}>
          📝 Ressources gratuites
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', color: '#fff',
          margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Blog Brainlo
        </h1>
        <p style={{ color: '#64748b', fontSize: 17, maxWidth: 520, margin: '0 auto' }}>
          Guides, méthodes et outils pour solopreneurs et PME qui veulent piloter leur business avec l&apos;IA.
        </p>
      </header>

      {/* ═══ ARTICLES ═══ */}
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 96px' }}>
        {articles.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#475569', padding: '64px 0' }}>
            <p style={{ fontSize: 18 }}>Aucun article disponible pour le moment.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Revenez bientôt ! 🚀</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 24 }}>
            {articles.map(article => {
              const cat = CATEGORY_COLORS[article.category] || { bg: 'rgba(99,102,241,0.1)', text: '#818cf8' }
              const dateFormatted = article.date
                ? new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : ''
              return (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <article style={{
                    background: 'rgba(21,21,36,0.85)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 18,
                    padding: '28px 28px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s, transform 0.2s',
                    cursor: 'pointer',
                    height: '100%',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg,rgba(99,102,241,0.6),rgba(139,92,246,0.6),rgba(6,182,212,0.4))' }} />

                    {/* Category + reading time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99,
                        background: cat.bg, color: cat.text, border: `1px solid ${cat.text}33` }}>
                        {article.category}
                      </span>
                      <span style={{ fontSize: 12, color: '#475569' }}>⏱ {article.reading_time}</span>
                    </div>

                    {/* Title */}
                    <h2 style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9',
                      margin: '0 0 10px', lineHeight: 1.35 }}>
                      {article.title}
                    </h2>

                    {/* Description */}
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: '0 0 20px' }}>
                      {article.description}
                    </p>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#475569' }}>{dateFormatted}</span>
                      <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600 }}>Lire l&apos;article →</span>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      {/* ═══ CTA ═══ */}
      <section style={{ borderTop: '1px solid rgba(99,102,241,0.08)', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem,3vw,2.2rem)', color: '#fff', margin: '0 0 16px' }}>
          Prêt à piloter votre business avec l&apos;IA ?
        </h2>
        <p style={{ color: '#64748b', fontSize: 16, margin: '0 0 32px' }}>Gratuit · Setup en 5 minutes · Sans carte bleue</p>
        <Link href="/onboarding" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          color: '#fff', fontWeight: 700, fontSize: 16,
          padding: '14px 32px', borderRadius: 14, textDecoration: 'none',
          boxShadow: '0 0 28px rgba(99,102,241,0.4)'
        }}>🚀 Commencer gratuitement</Link>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <span>© 2026 Brainlo · </span>
        <Link href="/" style={{ color: '#374151', textDecoration: 'underline' }}>Accueil</Link>
        <span> · </span>
        <Link href="/privacy" style={{ color: '#374151', textDecoration: 'underline' }}>Confidentialité</Link>
      </footer>
    </div>
  )
}
