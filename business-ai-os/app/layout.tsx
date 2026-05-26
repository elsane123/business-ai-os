import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://brainlo.ai'),
  title: {
    default: 'Brainlo — L\'OS IA pour solopreneurs et PME',
    template: '%s | Brainlo',
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
  authors: [{ name: 'Brainlo' }],
  creator: 'Brainlo',
  publisher: 'Brainlo',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://brainlo.ai',
    siteName: 'Brainlo',
    title: 'Brainlo — Ton équipe dirigeante IA à 29€/mois',
    description:
      'CFO, CMO, CRO IA pour solopreneurs et PME. Daily Focus quotidien, trésorerie temps réel, pipeline IA. Gratuit pour commencer.',
    images: [
      {
        url: 'https://brainlo.ai/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Brainlo — Dashboard agents IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brainlo — L\'OS IA pour solopreneurs',
    description:
      'Agents IA dédiés : CFO, CMO, CRO. Daily Focus quotidien. Trésorerie temps réel. Gratuit pour commencer.',
    images: ['https://brainlo.ai/og-image.png'],
    creator: '@brainlo_ai',
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
  name: 'Brainlo',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://brainlo.ai',
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
  screenshot: 'https://brainlo.ai/og-image.png',
  softwareVersion: '1.0',
  datePublished: '2026-01-01',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`dark ${inter.variable}`}>
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
