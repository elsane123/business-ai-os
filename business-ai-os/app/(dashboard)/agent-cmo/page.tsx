'use client'

import { useEffect, useRef, useState } from 'react'

const AGENT_ID = 'agent-cmo'
const AGENT_NAME = 'Agent Marketing'
const AGENT_ICON = '📣'
const AGENT_TAGLINE = 'Votre directeur marketing IA'

const EXAMPLE_QUESTIONS = [
  'Quel contenu publier cette semaine ?',
  'Comment améliorer mon engagement LinkedIn ?',
  'Rédige-moi un post sur mon expertise',
  'Quelle est ma stratégie marketing pour ce mois ?',
]

type Message = { id: string; role: 'USER' | 'ASSISTANT'; content: string; createdAt: string }

export default function AgentCMOPage() {
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
  const [liPostLoading, setLiPostLoading] = useState(false)
  const [liPostContent, setLiPostContent] = useState('')
  const [liPostPublishing, setLiPostPublishing] = useState(false)
  const [liPostUrl, setLiPostUrl] = useState<string | null>(null)
  const [liPostError, setLiPostError] = useState<string | null>(null)
  const [liPostCopied, setLiPostCopied] = useState(false)

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

  async function handleGenerateLinkedIn() {
    setLiPostLoading(true)
    setLiPostError(null)
    setLiPostUrl(null)
    try {
      const res = await fetch('/api/agents/linkedin-post/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setLiPostContent(data.content ?? '')
    } catch (err) {
      console.error('[linkedin-post generate]', err)
      setLiPostError('Erreur lors de la génération du post.')
    } finally {
      setLiPostLoading(false)
    }
  }

  async function handlePublishLinkedIn() {
    if (!liPostContent.trim()) return
    setLiPostPublishing(true)
    setLiPostError(null)
    try {
      const res = await fetch('/api/agents/linkedin-post/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: liPostContent }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'token_expired') setLiPostError('Token LinkedIn expiré — Reconnecte-toi dans Paramètres.')
        else setLiPostError('Échec de la publication LinkedIn.')
        return
      }
      setLiPostUrl(data.postUrl)
    } catch {
      setLiPostError('Erreur réseau lors de la publication.')
    } finally {
      setLiPostPublishing(false)
    }
  }

  if (planLoading) return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (plan !== 'PRO') return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 bg-purple-500/20 mx-auto">{AGENT_ICON}</div>
        <h1 className="text-2xl font-bold text-white mb-2">{AGENT_NAME}</h1>
        <p className="text-[#818cf8] text-sm mb-6">{AGENT_TAGLINE}</p>
        <div className="bg-[#1a1d2e] border border-purple-500/20 rounded-2xl p-6 mb-6">
          <ul className="text-left space-y-2 text-sm text-white mb-4">
            <li>📝 Génération posts LinkedIn personnalisés</li>
            <li>📣 Publication directe sur LinkedIn</li>
            <li>📅 Stratégie de contenu mensuelle</li>
            <li>💬 Chat marketing IA</li>
          </ul>
          <p className="text-amber-300 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">🔒 Disponible avec l&apos;abonnement PRO</p>
        </div>
        <a href="/settings" className="inline-block w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm">Passer à PRO →</a>
        <a href="/dashboard" className="block mt-3 text-sm text-[#818cf8]">Retour au dashboard</a>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-[#0a0a14] text-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a42] bg-[#0f0f1a] flex-shrink-0">
        <a href="/dashboard" className="p-1.5 rounded-lg text-[#818cf8] hover:text-white hover:bg-[#1e1e30] transition-colors">←</a>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-purple-500/20 text-purple-300">{AGENT_ICON}</div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm text-white truncate">{AGENT_NAME}</h1>
          <p className="text-[#818cf8] text-xs truncate">{AGENT_TAGLINE}</p>
        </div>
        {brainScore > 50 && <span className="hidden sm:flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">🧠 Brain actif</span>}
        <button onClick={clearHistory} className="text-[#818cf8] hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-900/20 transition-colors" title="Effacer">🗑️</button>
      </div>

      <div className="px-4 py-3 border-b border-[#2a2a42] bg-[#0a0a14] flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          <a href="/content" className="flex items-center gap-2 px-3 py-2 bg-[#1a1d2e] hover:bg-[#23263a] border border-[#2a2a42] rounded-xl text-xs text-[#818cf8] hover:text-white transition-colors">📝 Contenu LinkedIn</a>
          <button data-testid="linkedin-post-btn" onClick={handleGenerateLinkedIn} disabled={liPostLoading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-xs text-blue-300 disabled:opacity-50">
            {liPostLoading ? '⏳ Génération...' : '💼 Rédiger post LinkedIn'}
          </button>
        </div>
        {liPostContent && (
          <div className="mt-3 bg-[#1a1d2e] border border-blue-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-300">💼 Post LinkedIn</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${liPostContent.length > 3000 ? 'text-red-400' : 'text-slate-500'}`}>{liPostContent.length}/3000</span>
                <button onClick={() => { setLiPostContent(''); setLiPostUrl(null); setLiPostError(null) }} className="text-xs text-slate-500 hover:text-white">✕</button>
              </div>
            </div>
            <textarea value={liPostContent} onChange={e => setLiPostContent(e.target.value)}
              rows={8} maxLength={3000}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none" />
            {liPostError && <p className="text-xs text-red-400">{liPostError}</p>}
            {liPostUrl ? (
              <a href={liPostUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">✓ Publié — Voir sur LinkedIn →</a>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => { navigator.clipboard.writeText(liPostContent); setLiPostCopied(true); setTimeout(() => setLiPostCopied(false), 2000) }} className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 text-sm">{liPostCopied ? '✓ Copié' : 'Copier'}</button>
                <button type="button" onClick={handlePublishLinkedIn} disabled={liPostPublishing || liPostContent.length > 3000} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm">{liPostPublishing ? '⏳...' : '🚀 Publier'}</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!chatLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 bg-purple-500/20 text-purple-300">{AGENT_ICON}</div>
            <h2 className="font-semibold text-white text-base mb-1">Chat avec {AGENT_NAME}</h2>
            <p className="text-[#818cf8] text-sm mb-5 max-w-xs">{AGENT_TAGLINE}</p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-left px-4 py-2.5 bg-[#1e1e30] border border-[#2a2a42] rounded-xl text-sm text-[#818cf8] hover:text-white hover:border-purple-400/40 transition-all">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'USER' ? 'bg-purple-600/80 text-white' : 'bg-purple-900/20 border border-purple-500/20 text-[#e0e0f0]'}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-center text-xs text-red-400">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[#2a2a42] bg-[#0f0f1a] flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Posez une question marketing..." rows={1}
            className="flex-1 bg-[#1a1d2e] border border-[#2a2a42] rounded-xl px-4 py-3 text-sm text-white
              placeholder:text-[#4a4a6a] focus:outline-none focus:border-purple-500/50 resize-none"
            style={{ maxHeight: '120px' }} />
          <button onClick={() => sendMessage()} disabled={!input.trim() || sending}
            className="px-4 py-3 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40">↑</button>
        </div>
      </div>
    </div>
  )
}
