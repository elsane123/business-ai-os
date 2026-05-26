'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { Brain, Loader2, CheckCircle } from 'lucide-react'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié ?</h1>
          <p className="text-gray-400 mt-1 text-sm">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h2 className="text-white font-semibold text-lg mb-1">Email envoyé !</h2>
              <p className="text-gray-400 text-sm">
                Si ce compte existe, vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
              </p>
              <p className="text-gray-500 text-xs mt-3">Vérifiez également vos spams.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="vous@exemple.com"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Envoi en cours...' : '📧 Envoyer le lien de réinitialisation'}
              </button>
            </form>
          )}
          <p className="text-center text-sm text-gray-400 mt-4">
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}
