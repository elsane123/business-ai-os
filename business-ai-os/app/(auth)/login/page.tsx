'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BrainloLogo from '@/components/ui/BrainloLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [returnTo, setReturnTo] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('email')) setEmail(params.get('email')!)
    if (params.get('msg')) setMsg(params.get('msg')!)
    const rt = params.get('returnTo') || ''
    if (rt) setReturnTo(rt)
    // If already authenticated, redirect away — otherwise show the form
    fetch('/api/auth/profile')
      .then(r => { if (r.ok) router.push(rt || '/focus'); else setMounted(true) })
      .catch(() => setMounted(true))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      router.push(returnTo || '/focus')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

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
              <label htmlFor="email" className="block text-sm text-gray-300 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="vous@exemple.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-gray-300 mb-1.5">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">
                Mot de passe oublié ?
              </Link>
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


