'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Loader2, Info } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import BrainloLogo from '@/components/ui/BrainloLogo'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const msg = searchParams.get('msg')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion')
      router.push('/focus')
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
          <div className="flex justify-center mb-4">
            <BrainloLogo size={48} showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-white">Connexion</h1>
          <p className="text-gray-400 mt-1 text-sm">Accédez à votre cerveau business</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            {msg === 'email_exists' && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-indigo-300 text-sm">
                  Cet email est déjà enregistré. Connectez-vous ou{' '}
                  <a
                    href={`/forgot-password?email=${encodeURIComponent(email)}`}
                    className="underline text-indigo-300 hover:text-white"
                  >
                    réinitialisez votre mot de passe
                  </a>.
                </p>
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="vous@exemple.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-4">
            Pas encore de compte ?{' '}
            <Link href="/onboarding" className="text-indigo-400 hover:text-indigo-300">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712] flex items-center justify-center"><div className="text-white">Chargement...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}
