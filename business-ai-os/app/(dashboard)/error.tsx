'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-white mb-2">Une erreur s&apos;est produite</h2>
      <p className="text-[#818cf8] text-sm mb-2 max-w-sm">
        Cette page a rencontré un problème inattendu. Vos données sont en sécurité.
      </p>
      {error.digest && (
        <p className="text-[#4a4a6a] text-xs mb-4 font-mono">Réf : {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          Réessayer
        </button>
        <a
          href="/focus"
          className="px-4 py-2 border border-[#2a2a42] hover:border-[#6366f1] text-[#818cf8] text-sm rounded-lg transition-colors"
        >
          Retour au dashboard
        </a>
      </div>
    </div>
  )
}
