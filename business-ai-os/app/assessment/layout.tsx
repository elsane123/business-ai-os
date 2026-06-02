import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Diagnostic IA Gratuit — Évaluez votre maturité business en 3 minutes',
  description:
    'Répondez à 10 questions et obtenez un diagnostic personnalisé de votre business par notre IA. Score de maturité, axes d\'amélioration, recommandations concrètes. 100% gratuit.',
  alternates: { canonical: 'https://brainlo.ai/assessment' },
  openGraph: {
    title: 'Diagnostic IA Business — Résultats en 3 minutes',
    description:
      'Évaluez votre maturité IA en 3 minutes. Score personnalisé, ROI estimé, recommandations concrètes. Gratuit.',
    url: 'https://brainlo.ai/assessment',
    type: 'website',
    siteName: 'Brainlo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diagnostic IA Business Gratuit — Brainlo',
    description: 'Évaluez votre maturité IA en 3 minutes. Score personnalisé + recommandations.',
  },
  robots: { index: true, follow: true },
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
