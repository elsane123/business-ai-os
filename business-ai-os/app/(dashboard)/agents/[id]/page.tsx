'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Message = {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

const COLOR_STYLES: Record<string, { btn: string; bubble: string; icon: string }> = {
  emerald: { btn: 'bg-emerald-600 hover:bg-emerald-500', bubble: 'bg-emerald-900/20 border-emerald-500/20', icon: 'bg-emerald-500/20 text-emerald-300' },
  blue:    { btn: 'bg-blue-600 hover:bg-blue-500',       bubble: 'bg-blue-900/20 border-blue-500/20',       icon: 'bg-blue-500/20 text-blue-300' },
  purple:  { btn: 'bg-purple-600 hover:bg-purple-500',   bubble: 'bg-purple-900/20 border-purple-500/20',   icon: 'bg-purple-500/20 text-purple-300' },
  amber:   { btn: 'bg-amber-600 hover:bg-amber-500',     bubble: 'bg-amber-900/20 border-amber-500/20',     icon: 'bg-amber-500/20 text-amber-300' },
  rose:    { btn: 'bg-rose-600 hover:bg-rose-500',       bubble: 'bg-rose-900/20 border-rose-500/20',       icon: 'bg-rose-500/20 text-rose-300' },
  cyan:    { btn: 'bg-cyan-600 hover:bg-cyan-500',       bubble: 'bg-cyan-900/20 border-cyan-500/20',       icon: 'bg-cyan-500/20 text-cyan-300' },
  indigo:  { btn: 'bg-indigo-600 hover:bg-indigo-500',   bubble: 'bg-indigo-900/20 border-indigo-500/20',   icon: 'bg-indigo-500/20 text-indigo-300' },
}

type AgentMeta = {
  id: string
  name: string
  icon: string
  tagline: string
  color: string
  exampleQuestions: string[]
  isActive: boolean
}

type BrainEnrichment = {
  offerType?: string
  priceRange?: string
  targetClient?: string
  valueProposition?: string
  differentiator?: string
  sector?: string
  businessName?: string
}

// E2.2 — Dynamic questions based on agent id + profile enrichment
function computeDynamicQuestions(agentId: string, e: BrainEnrichment): string[] {
  const q: string[] = []
  const price = e.priceRange ? `panier ${e.priceRange}` : null
  const client = e.targetClient ? e.targetClient.split(/[,;.]/)[0].trim().slice(0, 40) : null
  const vp = e.valueProposition ? e.valueProposition.slice(0, 60) : null

  if (agentId === 'agent-cfo') {
    if (price) q.push(`Avec un ${price}, quel CA mensuel dois-je viser pour atteindre mon objectif ?`)
  } else if (agentId === 'agent-cro') {
    if (client) q.push(`Comment optimiser ma conversion pour convaincre ${client} ?`)
  } else if (agentId === 'agent-cmo') {
    if (vp) q.push(`Comment formuler "${vp}" pour mes posts LinkedIn ?`)
  } else if (agentId === 'agent-coach') {
    if (e.differentiator) q.push(`Mon différenciateur est "${e.differentiator.slice(0, 50)}". Comment l\'exploiter au maximum ?`)
  } else if (agentId === 'agent-legal') {
    if (e.offerType) q.push(`Quels sont les points de vigilance contractuels pour une offre de type ${e.offerType} ?`)
  }
  return q
}

export default function AgentChatPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<AgentMeta | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // E2.1/E2.2/E2.3 — Brain context state
  const [brainScore, setBrainScore] = useState(0)
  const [brainEnrichment, setBrainEnrichment] = useState<BrainEnrichment>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Story 8.2 — Cold Email Sequence (CRO agent only)
  const [coldEmailOpen, setColdEmailOpen] = useState(false)
  const [coldEmailLoading, setColdEmailLoading] = useState(false)
  const [coldEmailForm, setColdEmailForm] = useState({ prospectName: '', company: '', sector: '', tone: 'professionnel' })
  const [coldEmailResult, setColdEmailResult] = useState<Array<{ day: number; subject: string; body: string }> | null>(null)
  const [coldEmailCopied, setColdEmailCopied] = useState<number | null>(null)
  const [coldEmailError, setColdEmailError] = useState<string | null>(null)

  // Story 8.3 — LinkedIn CMO Post (CMO agent only)
  const [liPostLoading, setLiPostLoading] = useState(false)
  const [liPostContent, setLiPostContent] = useState('')
  const [liPostPublishing, setLiPostPublishing] = useState(false)
  const [liPostUrl, setLiPostUrl] = useState<string | null>(null)
  const [liPostError, setLiPostError] = useState<string | null>(null)
  const [liPostCopied, setLiPostCopied] = useState(false)

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: liPostContent }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'token_expired') {
          setLiPostError('Token LinkedIn expiré — Reconnecte-toi dans Paramètres > Intégrations.')
        } else {
          setLiPostError('Échec de la publication LinkedIn.')
        }
        return
      }
      setLiPostUrl(data.postUrl)
    } catch {
      setLiPostError('Erreur réseau lors de la publication.')
    } finally {
      setLiPostPublishing(false)
    }
  }

  async function handleGenerateColdEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!coldEmailForm.prospectName.trim()) return
    setColdEmailLoading(true)
    setColdEmailResult(null)
    setColdEmailError(null)
    try {
      const res = await fetch('/api/agents/cold-email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coldEmailForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setColdEmailResult(data.sequence)
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

  async function loadData() {
    try {
      // Load agent info
      const agentsRes = await fetch('/api/agents')
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        const found = agentsData.agents.find((a: AgentMeta) => a.id === agentId)
        if (!found) { router.push('/agents'); return }
        if (!found.isActive) { router.push('/agents'); return }
        setAgent(found)
      }

      // Load conversation history
      const histRes = await fetch(`/api/agents/${agentId}/chat`)
      if (histRes.ok) {
        const { messages: msgs } = await histRes.json()
        setMessages(msgs)
      }
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }

    // E2.1 — Load brain enrichment (silent, non-blocking — does not affect agent loading)
    fetch('/api/user/enrichment')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setBrainScore(d.score ?? 0); setBrainEnrichment(d.data ?? {}) } })
      .catch(() => null)
  }

  useEffect(() => { loadData() }, [agentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(msg?: string) {
    const text = (msg ?? input).trim()
    if (!text || sending) return

    setInput('')
    setSending(true)
    setError('')

    // Optimistic UI
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'USER', content: text, createdAt: new Date().toISOString() },
    ])

    try {
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Erreur')
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        return
      }

      const { reply } = await res.json()
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: `u-${Date.now()}`, role: 'USER', content: text, createdAt: new Date().toISOString() },
        { id: `a-${Date.now()}`, role: 'ASSISTANT', content: reply, createdAt: new Date().toISOString() },
      ])
    } catch {
      setError('Erreur réseau')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  async function clearHistory() {
    if (!confirm('Effacer tout lhistorique de cette conversation ?')) return
    await fetch(`/api/agents/${agentId}/chat`, { method: 'DELETE' })
    setMessages([])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const styles = agent ? (COLOR_STYLES[agent.color] ?? COLOR_STYLES['indigo']) : COLOR_STYLES['indigo']

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!agent) return null

  return (
    <div className="flex flex-col h-screen bg-[#0a0a14] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a42] bg-[#0f0f1a] flex-shrink-0">
        <Link
          href="/agents"
          className="p-1.5 rounded-lg text-[#818cf8] hover:text-white hover:bg-[#1e1e30] transition-colors"
          title="Retour aux agents"
        >
          ←
        </Link>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${styles.icon}`}>
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm text-white truncate">{agent.name}</h1>
          <p className="text-[#818cf8] text-xs truncate">{agent.tagline}</p>
        </div>
        {/* E2.1 — Brain active indicator */}
        {brainScore > 50 && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full flex-shrink-0" title="Tes agents utilisent ton profil Business Brain complet">
            🧠 Brain actif
          </span>
        )}
        <button
          onClick={clearHistory}
          className="text-[#818cf8] hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-900/20 transition-colors"
          title="Effacer l'historique"
        >
          🗑️
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 ${styles.icon}`}>
              {agent.icon}
            </div>
            <h2 className="font-bold text-white text-lg mb-1">{agent.name}</h2>
            <p className="text-[#818cf8] text-sm mb-6 max-w-xs">{agent.tagline}</p>

            {/* E2.3 — Brain incomplete warning */}
            {brainScore < 25 && (
              <a
                href="/profile"
                className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl mb-5 hover:bg-amber-500/20 transition-colors"
              >
                <span>⚠️</span>
                <span>Business Brain incomplet — <span className="underline">Complète ton profil</span> pour des réponses personnalisées</span>
              </a>
            )}

            {/* E2.2 — Dynamic + static suggested questions */}
            <p className="text-[#6b7280] text-xs mb-4">Questions exemples :</p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {computeDynamicQuestions(agentId, brainEnrichment).map((q, i) => (
                <button
                  key={`dyn-${i}`}
                  onClick={() => sendMessage(q)}
                  className="text-left px-4 py-2.5 bg-indigo-900/20 border border-indigo-500/30 rounded-xl text-sm text-indigo-300 hover:text-white hover:border-indigo-400/60 transition-all"
                >
                  ✨ {q}
                </button>
              ))}
              {agent.exampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left px-4 py-2.5 bg-[#1e1e30] border border-[#2a2a42] rounded-xl text-sm text-[#818cf8] hover:text-white hover:border-[#4f46e5]/40 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Story 8.2 — Cold Email Generator (CRO agent only) */}
            {agentId === 'agent-cro' && !coldEmailResult && (
              <div className="mt-6 w-full max-w-sm">
                {!coldEmailOpen ? (
                  <button
                    onClick={() => setColdEmailOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 text-pink-300 font-medium rounded-xl text-sm transition-colors"
                  >
                    📧 Générer une séquence email
                  </button>
                ) : (
                  <form onSubmit={handleGenerateColdEmail} className="bg-[#1a1d2e] border border-pink-500/20 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-pink-300">📧 Séquence Cold Email</p>
                    <input
                      type="text" required placeholder="Prénom Nom du prospect *"
                      value={coldEmailForm.prospectName}
                      onChange={e => setColdEmailForm(f => ({ ...f, prospectName: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50"
                    />
                    <input
                      type="text" placeholder="Entreprise"
                      value={coldEmailForm.company}
                      onChange={e => setColdEmailForm(f => ({ ...f, company: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50"
                    />
                    <input
                      type="text" placeholder="Secteur"
                      value={coldEmailForm.sector}
                      onChange={e => setColdEmailForm(f => ({ ...f, sector: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50"
                    />
                    <select
                      value={coldEmailForm.tone}
                      onChange={e => setColdEmailForm(f => ({ ...f, tone: e.target.value }))}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50"
                    >
                      <option value="professionnel">Professionnel</option>
                      <option value="casual">Décontracté</option>
                      <option value="direct">Direct</option>
                    </select>
                    {coldEmailError && (
                      <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{coldEmailError}</p>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setColdEmailOpen(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Annuler</button>
                      <button type="submit" disabled={coldEmailLoading || !coldEmailForm.prospectName.trim()} className="flex-1 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-medium text-sm transition-colors">
                        {coldEmailLoading ? '⏳ Génération...' : '✨ Générer'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Story 8.3 — LinkedIn Post Generator (CMO agent only) */}
            {agentId === 'agent-cmo' && (
              <div className="mt-6 w-full max-w-sm space-y-3">
                {!liPostContent ? (
                  <button
                    onClick={handleGenerateLinkedIn}
                    disabled={liPostLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {liPostLoading ? '⏳ Génération...' : '💼 Rédiger un post LinkedIn'}
                  </button>
                ) : (
                  <div className="bg-[#1a1d2e] border border-blue-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-blue-300">💼 Post LinkedIn</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${liPostContent.length > 3000 ? 'text-red-400' : 'text-slate-500'}`}>{liPostContent.length}/3000</span>
                        <button onClick={() => { setLiPostContent(''); setLiPostUrl(null); setLiPostError(null) }} className="text-xs text-slate-500 hover:text-white">✕</button>
                      </div>
                    </div>
                    <textarea
                      value={liPostContent}
                      onChange={e => setLiPostContent(e.target.value)}
                      rows={10}
                      maxLength={3000}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                    />
                    {liPostError && (
                      <p className="text-xs text-red-400">{liPostError} {liPostError.includes('Paramètres') && <a href="/settings" className="underline text-red-300">Paramètres &rarr;</a>}</p>
                    )}
                    {liPostUrl ? (
                      <a href={liPostUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 hover:bg-green-500/20 transition-colors">
                        ✓ Post publié — Voir sur LinkedIn →
                      </a>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(liPostContent); setLiPostCopied(true); setTimeout(() => setLiPostCopied(false), 2000) }}
                          className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors"
                        >
                          {liPostCopied ? '✓ Copié' : 'Copier'}
                        </button>
                        <button
                          type="button"
                          onClick={handlePublishLinkedIn}
                          disabled={liPostPublishing || liPostContent.length > 3000}
                          className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-colors"
                        >
                          {liPostPublishing ? '⏳ Publication...' : '🚀 Publier'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cold Email Results */}
            {agentId === 'agent-cro' && coldEmailResult && (
              <div className="mt-6 w-full max-w-sm space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-pink-300">📧 Séquence générée ({coldEmailResult.length} emails)</p>
                  <button onClick={() => { setColdEmailResult(null); setColdEmailOpen(false) }} className="text-xs text-slate-500 hover:text-white">✕ Fermer</button>
                </div>
                {coldEmailResult.map((email, idx) => (
                  <details key={idx} className="bg-[#1a1d2e] border border-pink-500/20 rounded-xl overflow-hidden">
                    <summary className="px-4 py-2.5 text-sm font-medium text-pink-200 cursor-pointer hover:bg-pink-500/10 flex items-center justify-between">
                      <span>Jour {email.day} — {email.subject}</span>
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); copyColdEmail(idx, email.subject, email.body) }}
                        className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 ml-2 flex-shrink-0"
                      >
                        {coldEmailCopied === idx ? '✓ Copié' : 'Copier'}
                      </button>
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
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ASSISTANT' && (
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5 ${styles.icon}`}>
                {agent.icon}
              </div>
            )}
            <div
              className={[
                'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                msg.role === 'USER'
                  ? 'bg-[#4f46e5] text-white rounded-tr-sm'
                  : `border ${styles.bubble} text-[#e2e8f0] rounded-tl-sm`,
              ].join(' ')}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mr-2 ${styles.icon}`}>
              {agent.icon}
            </div>
            <div className={`px-4 py-3 rounded-2xl border ${styles.bubble}`}>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#818cf8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#818cf8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#818cf8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#2a2a42] bg-[#0f0f1a] flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Posez une question à ${agent.name}...`}
            rows={1}
            className="flex-1 bg-[#1e1e30] border border-[#2a2a42] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#818cf8] resize-none focus:outline-none focus:border-[#4f46e5]/50 transition-colors"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles.btn}`}
          >
            {sending ? '⏳' : '↑'}
          </button>
        </div>
        <p className="text-[#6b7280] text-[10px] mt-1.5 ml-1">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
      </div>
    </div>
  )
}
