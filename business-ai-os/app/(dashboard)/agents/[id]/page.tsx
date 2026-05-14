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
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
            <p className="text-[#6b7280] text-xs mb-4">Questions exemples :</p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
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
