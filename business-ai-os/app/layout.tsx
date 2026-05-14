import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://businessaios.com'),
  title: {
    default: 'Business AI OS — L\'OS IA pour solopreneurs et PME',
    template: '%s | Business AI OS',
  },
  description:
    'Gérez votre business avec des agents IA dédiés : Daily Focus quotidien, trésorerie temps réel, pipeline clients, posts LinkedIn. Gratuit pour commencer. Setup en 5 minutes.',
  keywords: [
    'logiciel gestion solopreneur',
    'agent ia pme',
    'dashboard trésorerie freelance',
    'crm solopreneur gratuit',
    'daily focus entrepreneur',
    'business ai os',
    'gestion business ia',
    'suivi prospects freelance',
    'runway calculator freelance',
    'automatisation entrepreneur',
  ],
  authors: [{ name: 'Business AI OS' }],
  creator: 'Business AI OS',
  publisher: 'Business AI OS',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://businessaios.com',
    siteName: 'Business AI OS',
    title: 'Business AI OS — Ton équipe dirigeante IA à 29€/mois',
    description:
      'CFO, CMO, CRO IA pour solopreneurs et PME. Daily Focus quotidien, trésorerie temps réel, pipeline IA. Gratuit pour commencer.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Business AI OS — Dashboard agents IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business AI OS — L\'OS IA pour solopreneurs',
    description:
      'Agents IA dédiés : CFO, CMO, CRO. Daily Focus quotidien. Trésorerie temps réel. Gratuit pour commencer.',
    images: ['/og-image.png'],
    creator: '@businessaios',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  category: 'technology',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Business AI OS',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://businessaios.com',
  description:
    'Système d\'exploitation business piloté par l\'IA. Agents IA dédiés (CFO, CMO, CRO) pour solopreneurs et PME. Daily Focus quotidien, trésorerie temps réel, pipeline clients intelligent.',
  inLanguage: 'fr-FR',
  offers: [
    {
      '@type': 'Offer',
      name: 'Solo Free',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Plan gratuit pour démarrer : 3 prospects, 4 posts LinkedIn/mois, suivi trésorerie.',
    },
    {
      '@type': 'Offer',
      name: 'Solo Pro',
      price: '29',
      priceCurrency: 'EUR',
      billingIncrement: 'P1M',
      description: 'Plan complet solopreneur : Daily Focus IA, pipeline illimité, Business Brain, rapports mensuels.',
    },
    {
      '@type': 'Offer',
      name: 'Starter PME',
      price: '149',
      priceCurrency: 'EUR',
      billingIncrement: 'P1M',
      description: 'Pour PME 1-4 personnes : Agent CFO + CRO, connexion bancaire, multi-utilisateurs.',
    },
    {
      '@type': 'Offer',
      name: 'PME Growth',
      price: '349',
      priceCurrency: 'EUR',
      billingIncrement: 'P1M',
      description: 'Pour PME 5-20 personnes : CFO + CRO + CMO complets, interconnexion agents, Business Review.',
    },
  ],
  featureList: [
    'Daily Focus IA — 3 actions prioritaires chaque matin',
    'Trésorerie temps réel avec 3 scénarios de runway',
    'Pipeline Kanban avec relances IA en 1 clic',
    'Générateur de posts LinkedIn depuis votre expertise',
    'Business Brain — chat IA sur vos données réelles',
    'LLM Wiki persistante — contexte business qui s\'améliore',
  ],
  screenshot: 'https://businessaios.com/og-image.png',
  softwareVersion: '1.0',
  datePublished: '2026-01-01',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <Script
          id="json-ld-software"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-surface-900 text-gray-100 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
