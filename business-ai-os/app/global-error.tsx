'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="text-center px-6 py-16 max-w-md">
          <div className="text-5xl mb-4">💥</div>
          <h1 className="text-xl font-bold text-white mb-2">Erreur critique</h1>
          <p className="text-[#818cf8] text-sm mb-6">
            Une erreur inattendue s&apos;est produite. Nos équipes ont été notifiées.
          </p>
          {error.digest && (
            <p className="text-[#4a4a6a] text-xs mb-4">Code : {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
