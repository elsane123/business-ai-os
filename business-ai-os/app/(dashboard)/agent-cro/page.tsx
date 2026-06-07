'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const AGENT_ID = 'agent-cro'
const AGENT_NAME = 'Agent Commercial'
const AGENT_ICON = '📈'
const AGENT_TAGLINE = 'Votre directeur commercial IA'

const EXAMPLE_QUESTIONS = [
  "Qui dois-je relancer en priorité aujourd'hui ?",
  'Quel est mon forecast CA pour le mois prochain ?',
  'Pourquoi est-ce que je perds des deals ?',
  'Comment convaincre ce prospect hésitant ?',
]

type Message = { id: string; role: 'USER' | 'ASSISTANT'; content: string; createdAt: string }

export default function AgentCROPage() {
  const [plan, setPlan] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [chatLoading, setChatLoading] = useState(true)
  const [error, setError] = useState('')
  const [brainScore, setBrainScore] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [coldEmailOpen, setColdEmailOpen] = useState(false)
  const [coldEmailLoading, setColdEmailLoading] = useState(false)
  const [coldEmailForm, setColdEmailForm] = useState({ prospectName: '', company: '', sector: '', tone: 'professionnel' })
  const [coldEmailResult, setColdEmailResult] = useState<Array<{ day: number; subject: string; body: string }> | null>(null)
  const [coldEmailCopied, setColdEmailCopied] = useState<number | null>(null)
  const [coldEmailError, setColdEmailError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setPlan(d?.user?.plan ?? 'FREE'); setPlanLoading(false) })
      .catch(() => { setPlan('FREE'); setPlanLoading(false) })
    fetch(`/api/agents/${AGENT_ID}/chat`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.messages) setMessages(d.messages) })
      .catch(() => null)
      .finally(() => setChatLoading(false))
    fetch('/api/user/enrichment')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBrainScore(d.score ?? 0) })
      .catch(() => null)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage(msg?: string) {
    const text = (msg ?? input).trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    setError('')
    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, { id: tempId, role: 'USER', content: text, createdAt: new Date().toISOString() }])
    try {
      const res = await fetch(`/api/agents/${AGENT_ID}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Erreur')
        setMessages(prev => prev.filter(m => m.id !== tempId))
        return
      }
      const { reply } = await res.json()
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        { id: `u-${Date.now()}`, role: 'USER', content: text, createdAt: new Date().toISOString() },
        { id: `a-${Date.now()}`, role: 'ASSISTANT', content: reply, createdAt: new Date().toISOString() },
      ])
    } catch {
      setError('Erreur réseau')
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  async function clearHistory() {
    if (!confirm("Effacer tout l'historique ?")) return
    await fetch(`/api/agents/${AGENT_ID}/chat`, { method: 'DELETE' })
    setMessages([])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  async function handleGenerateColdEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!coldEmailForm.prospectName.trim()) return
    setColdEmailLoading(true)
    setColdEmailResult(null)
    setColdEmailError(null)
    try {
      const res = await fetch('/api/agents/cold-email/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coldEmailForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setColdEmailResult(data.sequence)
      setColdEmailOpen(false)
    } catch (err) {
      console.error('[cold-email]', err)
      setColdEmailError('Erreur lors de la génération. Réessaie.')
    } finally {
      setColdEmailLoading(false)
    }
  }

  function copyColdEmail(idx: number, subject: string, body: string) {
    navigator.clipboard.writeText(`${subject}\n\n${body}`)
    setColdEmailCopied(idx)
    setTimeout(() => setColdEmailCopied(null), 2000)
  }

  if (planLoading) return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (plan !== 'PRO') return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 bg-blue-500/20 mx-auto">{AGENT_ICON}</div>
        <h1 className="text-2xl font-bold text-white mb-2">{AGENT_NAME}</h1>
        <p className="text-[#818cf8] text-sm mb-6">{AGENT_TAGLINE}</p>
        <div className="bg-[#1a1d2e] border border-blue-500/20 rounded-2xl p-6 mb-6">
          <ul className="text-left space-y-2 text-sm text-white mb-4">
            <li>📈 Analyse pipeline &amp; forecast CA</li>
            <li>📧 Séquences cold email personnalisées</li>
            <li>🎯 ICP Builder &amp; scoring prospects</li>
            <li>💬 Chat commercial IA</li>
          </ul>
          <p className="text-amber-300 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">🔒 Disponible avec l&apos;abonnement PRO</p>
        </div>
        <a href="/settings" className="inline-block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm">Passer à PRO →</a>
        <a href="/dashboard" className="block mt-3 text-sm text-[#818cf8]">Retour au dashboard</a>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-[#0a0a14] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a42] bg-[#0f0f1a] flex-shrink-0">
        <a href="/dashboard" className="p-1.5 rounded-lg text-[#818cf8] hover:text-white hover:bg-[#1e1e30] transition-colors">←</a>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-blue-500/20 text-blue-300">{AGENT_ICON}</div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm text-white truncate">{AGENT_NAME}</h1>
          <p className="text-[#818cf8] text-xs truncate">{AGENT_TAGLINE}</p>
        </div>
        {brainScore > 50 && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">🧠 Brain actif</span>
        )}
        <button onClick={clearHistory} className="text-[#818cf8] hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-900/20 transition-colors" title="Effacer">🗑️</button>
      </div>

      {/* Tools bar */}
      <div className="px-4 py-3 border-b border-[#2a2a42] bg-[#0a0a14] flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          <a href="/pipeline" className="flex items-center gap-2 px-3 py-2 bg-[#1a1d2e] hover:bg-[#23263a] border border-[#2a2a42] rounded-xl text-xs text-[#818cf8] hover:text-white transition-colors">🎯 ICP Builder</a>
          <button
            data-testid="cold-email-btn"
            onClick={() => { setColdEmailOpen(o => !o); setColdEmailResult(null) }}
            className="flex items-center gap-2 px-3 py-2 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 rounded-xl text-xs text-pink-300 hover:text-white transition-colors">
            📧 Séquence Email
          </button>
        </div>
        {coldEmailOpen && (
          <form onSubmit={handleGenerateColdEmail} className="mt-3 bg-[#1a1d2e] border border-pink-500/20 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-pink-300">📧 Générer une séquence cold email</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="text" required placeholder="Prénom Nom *" value={coldEmailForm.prospectName} onChange={e => setColdEmailForm(f => ({ ...f, prospectName: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50" />
              <input type="text" placeholder="Entreprise" value={coldEmailForm.company} onChange={e => setColdEmailForm(f => ({ ...f, company: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50" />
              <input type="text" placeholder="Secteur" value={coldEmailForm.sector} onChange={e => setColdEmailForm(f => ({ ...f, sector: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50" />
              <select value={coldEmailForm.tone} onChange={e => setColdEmailForm(f => ({ ...f, tone: e.target.value }))} className="bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50">
                <option value="professionnel">Professionnel</option>
                <option value="casual">Décontracté</option>
                <option value="direct">Direct</option>
              </select>
            </div>
            {coldEmailError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{coldEmailError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setColdEmailOpen(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Annuler</button>
              <button type="submit" disabled={coldEmailLoading || !coldEmailForm.prospectName.trim()} className="flex-1 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-medium text-sm transition-colors">{coldEmailLoading ? '⏳ Génération...' : '✨ Générer'}</button>
            </div>
          </form>
        )}
        {coldEmailResult && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-pink-300">📧 {coldEmailResult.length} emails générés</p>
              <button onClick={() => setColdEmailResult(null)} className="text-xs text-slate-500 hover:text-white">✕ Fermer</button>
            </div>
            {coldEmailResult.map((email, idx) => (
              <details key={idx} className="bg-[#1a1d2e] border border-pink-500/20 rounded-xl overflow-hidden">
                <summary className="px-4 py-2.5 text-sm font-medium text-pink-200 cursor-pointer hover:bg-pink-500/10 flex items-center justify-between">
                  <span>Jour {email.day} — {email.subject}</span>
                  <button type="button" onClick={e => { e.preventDefault(); copyColdEmail(idx, email.subject, email.body) }} className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 ml-2">{coldEmailCopied === idx ? '✓ Copié' : 'Copier'}</button>
                </summary>
                <div className="px-4 py-3 border-t border-pink-500/10">
                  <p className="text-xs text-slate-400 mb-1 font-medium">Objet: {email.subject}</p>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {!chatLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 bg-blue-500/20 text-blue-300">{AGENT_ICON}</div>
            <h2 className="font-semibold text-white text-base mb-1">Chat avec {AGENT_NAME}</h2>
            <p className="text-[#818cf8] text-sm mb-5 max-w-xs">{AGENT_TAGLINE}</p>
            {brainScore < 25 && (
              <a href="/profile" className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl mb-5">
                ⚠️ Business Brain incomplet — Complète ton profil
              </a>
            )}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-left px-4 py-2.5 bg-[#1e1e30] border border-[#2a2a42] rounded-xl text-sm text-[#818cf8] hover:text-white hover:border-blue-400/40 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'USER' ? 'bg-blue-600/80 text-white' : 'bg-blue-900/20 border border-blue-500/20 text-[#e0e0f0]'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-center text-xs text-red-400">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#2a2a42] bg-[#0f0f1a] flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question commerciale..."
            rows={1}
            className="flex-1 bg-[#1a1d2e] border border-[#2a2a42] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4a4a6a] focus:outline-none focus:border-blue-500/50 resize-none"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-colors flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
          >↑</button>
        </div>
      </div>
    </div>
  )
}
