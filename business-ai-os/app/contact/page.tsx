'use client'
import { useState } from 'react'
import Link from 'next/link'
import BrainloLogo from '@/components/ui/BrainloLogo'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('commercial')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrainloLogo size={32} showText />
        </Link>
        <Link href="/onboarding" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Commencer</Link>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Contactez-nous</h1>
          <p style={{ color: '#9ca3af', fontSize: 16 }}>Une question commerciale ou besoin d&apos;aide ? Nous répondons sous 24h.</p>
        </div>

        {success ? (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Message envoyé !</h2>
            <p style={{ color: '#9ca3af', marginBottom: 24 }}>Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.</p>
            <Link href="/" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>Retour à l&apos;accueil</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px' }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 6 }}>Nom complet *</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Jean Dupont"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 6 }}>Email *</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value.trim())} required
                  placeholder="jean@entreprise.com"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 6 }}>Sujet</label>
              <select
                value={subject} onChange={e => setSubject(e.target.value)}
                style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 15, outline: 'none', cursor: 'pointer' }}
              >
                <option value="commercial">💼 Demande commerciale</option>
                <option value="support">🛠️ Support client</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 6 }}>Message *</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)} required rows={5}
                placeholder="Décrivez votre besoin..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 15, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit" disabled={loading || !name.trim() || !email.trim() || !message.trim()}
              style={{ width: '100%', background: loading ? '#374151' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity .15s' }}
            >
              {loading ? '⏳ Envoi en cours...' : '📨 Envoyer le message'}
            </button>

            <p style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 16 }}>
              Votre message sera envoyé à contact@brainlo.ai · Réponse sous 24h
            </p>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center', color: '#4b5563', fontSize: 13, marginTop: 40 }}>
        <span>© 2026 Brainlo · </span>
        <Link href="/mentions-legales" style={{ color: '#4b5563', textDecoration: 'underline', margin: '0 8px' }}>Mentions légales</Link>
        <Link href="/confidentialite" style={{ color: '#4b5563', textDecoration: 'underline', margin: '0 8px' }}>Confidentialité</Link>
      </footer>
    </div>
  )
}
