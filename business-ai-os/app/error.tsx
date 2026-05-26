'use client'

import { useEffect } from 'react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Root Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🌐</div>
        <h2 className="text-lg font-bold text-white mb-2">Page introuvable ou erreur</h2>
        <p className="text-[#818cf8] text-sm mb-6">
          Une erreur s&apos;est produite sur cette page.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-[#2a2a42] hover:border-[#6366f1] text-[#818cf8] text-sm rounded-lg transition-colors"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  )
}
