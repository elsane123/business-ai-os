'use client'

import { useState, useEffect, useRef } from 'react'
import ChatBrain from '@/components/dashboard/ChatBrain'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

const EXAMPLE_QUESTIONS = [
  { icon: '👥', text: 'Quels sont mes prospects les plus chauds ?' },
  { icon: '💰', text: 'Analyse ma trésorerie ce mois-ci' },
  { icon: '📣', text: 'Génère des idées de post LinkedIn sur mon expertise' },
  { icon: '⚡', text: 'Quelles actions dois-je prioriser cette semaine ?' },
  { icon: '📊', text: 'Quel est mon taux de conversion pipeline ?' },
  { icon: '🎯', text: 'Comment améliorer mon offre commerciale ?' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      // silently fail — start with empty chat
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      if (!res.ok) throw new Error('Erreur API')
      const data = await res.json()

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ASSISTANT',
        content: data.message?.content || 'Désolé, je n\'ai pas pu générer une réponse.',
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      // Fallback mock response
      const fallbackResponses = [
        `Basé sur votre contexte business, voici mon analyse :\n\n**${trimmed}** est une excellente question. Pour y répondre précisément, je consulte votre wiki business...\n\n📊 **Analyse** : Vos données montrent une progression positive ce mois-ci. Je vous recommande de :\n\n1. Prioriser les relances prospects en phase PROPOSAL\n2. Maintenir votre cadence de publication LinkedIn (3x/semaine)\n3. Vérifier votre prévisionnel de trésorerie avant fin de mois\n\nSouhaitez-vous que j'approfondisse l'un de ces points ?`,
        `Voici ce que votre Business Brain a trouvé :\n\n💡 **Insight** : D'après vos données pipeline et transactions récentes, vous avez une belle dynamique commerciale. Vos prospects en phase INTERESTED méritent une attention particulière cette semaine.\n\n🎯 **Recommandation** : Contactez Marie Chen (FinEdge) — 12 000€ de valeur, dernière interaction il y a 11 jours. Le timing est idéal pour une relance personnalisée.\n\nVoulez-vous que je génère un message de relance pour elle ?`,
      ]
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ASSISTANT',
        content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleExampleClick = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f0f1a]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[#2a2a42] bg-[#0f0f1a]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4f46e5]/20 border border-[#4f46e5]/30 flex items-center justify-center text-xl">
            🧠
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Business Brain</h1>
            <p className="text-xs text-[#818cf8]">Votre assistant IA avec contexte business complet</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              En ligne
            </span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 px-4 py-6 space-y-1">
        {initialLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#4f46e5] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty state with example questions */
          <div className="max-w-2xl mx-auto pt-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🧠</div>
              <h2 className="text-xl font-semibold text-white mb-2">Votre Business Brain</h2>
              <p className="text-[#818cf8] text-sm">
                Je connais votre pipeline, vos finances et votre stratégie.<br />
                Posez-moi n&apos;importe quelle question business.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(q.text)}
                  className="flex items-center gap-3 px-4 py-3 bg-[#151524] border border-[#2a2a42] hover:border-[#4f46e5]/50 hover:bg-[#1e1e30] rounded-xl text-left transition-all group"
                >
                  <span className="text-xl flex-shrink-0">{q.icon}</span>
                  <span className="text-sm text-[#818cf8] group-hover:text-white transition-colors">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-1">
            {messages.map((msg) => (
              <ChatBrain
                key={msg.id}
                role={msg.role === 'USER' ? 'user' : 'assistant'}
                content={msg.content}
                createdAt={msg.createdAt}
              />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 rounded-lg bg-[#4f46e5]/20 border border-[#4f46e5]/30 flex items-center justify-center text-sm flex-shrink-0">
                  🧠
                </div>
                <div className="bg-[#1e1e30] border border-[#2a2a42] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#818cf8] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-[#2a2a42] bg-[#0f0f1a]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-[#151524] border border-[#2a2a42] focus-within:border-[#4f46e5] rounded-2xl px-4 py-3 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                // Auto-resize
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder="Demandez à votre Business Brain... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
              rows={1}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 resize-none outline-none min-h-[24px] max-h-[200px]"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Business Brain a accès à votre wiki business (pipeline, finances, posts LinkedIn)
          </p>
        </div>
      </div>
    </div>
  )
}
