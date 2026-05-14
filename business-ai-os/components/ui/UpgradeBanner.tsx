'use client'

import { useState } from 'react'

interface UpgradeBannerProps {
  plan: string
}

export default function UpgradeBanner({ plan }: UpgradeBannerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (plan !== 'FREE') return null

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à niveau')
      if (data.url && data.url.startsWith('http')) {
        // Stripe live : redirection vers la page de paiement
        window.location.href = data.url
      } else {
        // Mode test : upgrade direct en DB → recharger la page
        // Le layout relira le plan depuis la DB et masquera cette bannière
        window.location.href = data.url || '/focus?upgrade=success'
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setTimeout(() => setError(null), 5000)
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col">
      <div className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 text-white">
          <span className="text-lg">🚀</span>
          <div>
            <span className="font-semibold text-sm">Passez à Solo Pro</span>
            <span className="text-white/80 text-sm ml-2">— Débloquez Focus IA, Relances IA et toutes les fonctionnalités avancées</span>
          </div>
          <span className="hidden sm:inline-block bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            29€/mois
          </span>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="flex-shrink-0 bg-white text-indigo-600 font-bold text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⏳ Activation…' : 'Upgrader maintenant →'}
        </button>
      </div>
      {error && (
        <div className="w-full bg-red-500/90 px-4 py-2 text-white text-xs flex items-center gap-2">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
