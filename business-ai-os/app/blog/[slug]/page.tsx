import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getArticleBySlug, getAllSlugs } from '@/lib/blog'

// Génère les routes statiques pour tous les articles
export async function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

// Génère les métadonnées SEO dynamiques par article
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return { title: 'Article introuvable' }

  const url = `https://brainlo.ai/blog/${slug}`

  return {
    title: article.meta_title,
    description: article.meta_description,
    keywords: article.keywords,
    authors: [{ name: article.author }],
    alternates: { canonical: url },
    openGraph: {
      title: article.meta_title,
      description: article.meta_description,
      url,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      tags: article.keywords,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.meta_title,
      description: article.meta_description,
    },
  }
}

// JSON-LD Article schema
function ArticleJsonLd({ article, slug }: { article: Awaited<ReturnType<typeof getArticleBySlug>>, slug: string }) {
  if (!article) return null
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description,
    author: { '@type': 'Organization', name: article.author, url: 'https://brainlo.ai' },
    publisher: {
      '@type': 'Organization',
      name: 'Brainlo',
      url: 'https://brainlo.ai',
      logo: { '@type': 'ImageObject', url: 'https://brainlo.ai/og-image.png' },
    },
    datePublished: article.date,
    dateModified: article.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://brainlo.ai/blog/${slug}` },
    image: 'https://brainlo.ai/og-image.png',
    keywords: article.keywords.join(', '),
    inLanguage: 'fr-FR',
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Finance:      { bg: 'rgba(74,222,128,0.1)',   text: '#4ade80' },
  Productivité: { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  Comparatifs:  { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
  Marketing:    { bg: 'rgba(244,114,182,0.12)', text: '#f472b6' },
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const cat = CATEGORY_COLORS[article.category] || { bg: 'rgba(99,102,241,0.1)', text: '#818cf8' }
  const dateFormatted = article.date
    ? new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{ background: '#0a0a14', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh' }}>
      <ArticleJsonLd article={article} slug={slug} />

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
            <Link href="/blog" style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>← Blog</Link>
            <Link href="/onboarding" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: '#fff', fontWeight: 600, fontSize: 14, padding: '9px 20px',
              borderRadius: 10, textDecoration: 'none' }}>Commencer</Link>
          </div>
        </div>
      </nav>

      {/* ═══ ARTICLE ═══ */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '104px 24px 96px' }}>

        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" style={{ marginBottom: 32, fontSize: 13, color: '#475569' }}>
          <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Accueil</Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <Link href="/blog" style={{ color: '#475569', textDecoration: 'none' }}>Blog</Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: '#94a3b8' }}>{article.category}</span>
        </nav>

        {/* Meta info */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99,
            background: cat.bg, color: cat.text, border: `1px solid ${cat.text}33` }}>
            {article.category}
          </span>
          <span style={{ fontSize: 13, color: '#475569' }}>⏱ {article.reading_time}</span>
          {dateFormatted && <span style={{ fontSize: 13, color: '#475569' }}>📅 {dateFormatted}</span>}
          <span style={{ fontSize: 13, color: '#475569' }}>✍️ {article.author}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#fff',
          margin: '0 0 24px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {article.title}
        </h1>

        {/* Description */}
        <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 40px',
          borderLeft: '3px solid rgba(99,102,241,0.5)', paddingLeft: 20 }}>
          {article.meta_description}
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(99,102,241,0.4),transparent)', marginBottom: 40 }} />

        {/* Article content */}
        <div
          className="prose-blog"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          style={{
            fontSize: 16,
            lineHeight: 1.8,
            color: '#cbd5e1',
          }}
        />

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(99,102,241,0.4),transparent)', margin: '48px 0' }} />

        {/* CTA inline */}
        <div style={{
          background: 'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(21,21,36,0.9))',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 18, padding: '32px 28px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: '#fff', margin: '0 0 10px' }}>
            Prêt à piloter votre business avec l&apos;IA ?
          </h2>
          <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 24px', lineHeight: 1.6 }}>
            Brainlo automatise votre Daily Focus, surveille votre trésorerie
            et gère vos relances clients. Gratuit pour commencer.
          </p>
          <Link href="/onboarding" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', fontWeight: 700, fontSize: 15,
            padding: '13px 28px', borderRadius: 12, textDecoration: 'none',
            boxShadow: '0 0 24px rgba(99,102,241,0.4)'
          }}>🚀 Commencer gratuitement — Sans carte bleue</Link>
        </div>

        {/* Back to blog */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/blog" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            ← Voir tous les articles
          </Link>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <span>© 2026 Brainlo · </span>
        <Link href="/" style={{ color: '#374151', textDecoration: 'underline' }}>Accueil</Link>
        <span> · </span>
        <Link href="/blog" style={{ color: '#374151', textDecoration: 'underline' }}>Blog</Link>
        <span> · </span>
        <Link href="/privacy" style={{ color: '#374151', textDecoration: 'underline' }}>Confidentialité</Link>
      </footer>
    </div>
  )
}
