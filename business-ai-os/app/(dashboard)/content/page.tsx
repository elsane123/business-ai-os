'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Post {
  id: string
  content: string
  postType: string
  status: string
  topic?: string | null
  publishedAt?: string | null
  createdAt: string
}

type FilterType = 'all' | 'DRAFT' | 'PUBLISHED'

// ─── Constants ───────────────────────────────────────────────────────────────

const POST_TYPES = [
  { value: 'insight',    label: '💡 Insight',    desc: 'Partage une leçon ou observation' },
  { value: 'story',      label: '📖 Story',      desc: 'Raconte une expérience personnelle' },
  { value: 'tips',       label: '🎯 Tips',       desc: 'Conseils pratiques en liste' },
  { value: 'question',   label: '❓ Question',   desc: 'Lance un débat, engage la communauté' },
  { value: 'case_study', label: '📊 Case Study', desc: 'Résultat concret d\'un projet' },
]

const TYPE_COLORS: Record<string, string> = {
  insight:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  story:      'bg-purple-500/20 text-purple-300 border-purple-500/30',
  tips:       'bg-green-500/20 text-green-300 border-green-500/30',
  question:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  case_study: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function charCountColor(n: number): string {
  if (n >= 800 && n <= 1300) return 'text-green-400'
  if (n === 0) return 'text-[#818cf8]'
  return 'text-orange-400'
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="text-5xl mb-4">✍️</div>
      <h3 className="text-white font-semibold text-lg mb-2">Aucun post encore</h3>
      <p className="text-[#818cf8] text-sm max-w-xs">
        Génère ton premier post LinkedIn avec le générateur à gauche.
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContentPage() {
  // Generator state
  const [selectedType, setSelectedType] = useState('insight')
  const [subject, setSubject] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  // History state
  const [posts, setPosts] = useState<Post[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  // Hydration-safe dates — only rendered client-side
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // ─── Load history on mount ──────────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    try {
      setHistoryLoading(true)
      const res = await fetch('/api/content/posts')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch {
      console.error('Failed to load posts')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  // ─── Generate ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setActivePostId(null)
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postType: selectedType, subject }),
      })
      if (!res.ok) throw new Error('Erreur lors de la génération')
      const data = await res.json()
      const post: Post = data.post
      setGeneratedContent(post.content)
      setActivePostId(post.id)
      // Add to history (prepend)
      setPosts(prev => [post, ...prev.filter(p => p.id !== post.id)])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // ─── Load post into preview ─────────────────────────────────────────────
  const handleSelectPost = (post: Post) => {
    setGeneratedContent(post.content)
    setActivePostId(post.id)
    setSelectedType(post.postType)
    setSubject(post.topic ?? '')
    setError('')
  }

  // ─── Copy to clipboard ──────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!generatedContent) return
    await navigator.clipboard.writeText(generatedContent)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // ─── Mark as published ──────────────────────────────────────────────────
  const handleMarkPublished = async () => {
    if (!activePostId) return
    try {
      const res = await fetch('/api/content/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activePostId, status: 'PUBLISHED', content: generatedContent }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPosts(prev => prev.map(p => p.id === activePostId ? { ...p, ...data.post } : p))
    } catch {
      setError('Impossible de mettre à jour le statut')
    }
  }

  // ─── Save edited content ────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!activePostId || !generatedContent) return
    try {
      await fetch('/api/content/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activePostId, content: generatedContent }),
      })
      setPosts(prev => prev.map(p => p.id === activePostId ? { ...p, content: generatedContent } : p))
    } catch {
      setError('Impossible de sauvegarder les modifications')
    }
  }

  // ─── Delete post ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/content/posts?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setPosts(prev => prev.filter(p => p.id !== id))
      if (activePostId === id) {
        setGeneratedContent('')
        setActivePostId(null)
      }
    } catch {
      setError('Impossible de supprimer le post')
    }
  }

  // ─── Filtered posts ─────────────────────────────────────────────────────
  const filteredPosts = posts.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  const activePost = posts.find(p => p.id === activePostId)
  const charCount = generatedContent.length

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f1a] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">📣 LinkedIn Generator</h1>
        <p className="text-[#818cf8] text-sm">Génère des posts engageants avec ton Business Brain</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-3">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Generator ──────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Type selector */}
          <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
            <label className="block text-xs font-semibold text-[#818cf8] uppercase tracking-wider mb-3">
              Type de post
            </label>
            <div className="grid grid-cols-1 gap-2">
              {POST_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    selectedType === type.value
                      ? 'bg-[#4f46e5]/20 border-[#4f46e5] text-white'
                      : 'bg-[#1e1e30] border-[#2a2a42] text-[#818cf8] hover:border-[#4f46e5]/50 hover:text-white'
                  }`}
                >
                  <span className="text-base w-6 flex-shrink-0">{type.label.split(' ')[0]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{type.label.split(' ').slice(1).join(' ')}</div>
                    <div className="text-xs opacity-60 truncate">{type.desc}</div>
                  </div>
                  {selectedType === type.value && (
                    <span className="text-[#4f46e5] ml-auto flex-shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Subject input */}
          <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4">
            <label className="block text-xs font-semibold text-[#818cf8] uppercase tracking-wider mb-2">
              Sujet ou angle <span className="normal-case font-normal opacity-60">(optionnel)</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: comment j'ai doublé ma productivité..."
              className="w-full bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-600"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Génération en cours…
              </>
            ) : (
              <><span>✨</span> Générer un post</>
            )}
          </button>

          {/* Preview / editor */}
          {generatedContent ? (
            <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#818cf8] uppercase tracking-wider">
                  {activePost ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${TYPE_COLORS[activePost.postType] ?? TYPE_COLORS.insight}`}>
                      {POST_TYPES.find(t => t.value === activePost.postType)?.label ?? activePost.postType}
                    </span>
                  ) : 'Aperçu'}
                </span>
                <span className={`text-xs font-mono ${charCountColor(charCount)}`}>
                  {charCount} car. {charCount >= 800 && charCount <= 1300 ? '✓ idéal' : charCount > 0 ? '(800-1300 recommandé)' : ''}
                </span>
              </div>
              <textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={10}
                className="w-full bg-[#1e1e30] border border-[#2a2a42] focus:border-[#4f46e5] text-white rounded-lg px-3 py-2.5 text-sm outline-none transition-colors resize-none leading-relaxed font-mono"
                placeholder="Votre post LinkedIn apparaîtra ici…"
              />
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e30] border border-[#2a2a42] hover:border-[#4f46e5]/50 text-[#818cf8] hover:text-white rounded-lg text-xs font-medium transition-all"
                >
                  {copySuccess ? '✅ Copié !' : '📋 Copier'}
                </button>
                {activePostId && (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e30] border border-[#2a2a42] hover:border-[#4f46e5]/50 text-[#818cf8] hover:text-white rounded-lg text-xs font-medium transition-all"
                    >
                      💾 Sauvegarder
                    </button>
                    <button
                      onClick={handleMarkPublished}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 border border-green-600/30 hover:border-green-500 text-green-400 hover:text-green-300 rounded-lg text-xs font-medium transition-all"
                    >
                      ✅ Marquer publié
                    </button>
                    <button
                      onClick={() => handleDelete(activePostId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 border border-red-600/20 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium transition-all ml-auto"
                    >
                      🗑️ Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#151524] border border-dashed border-[#2a2a42] rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-white font-semibold mb-1">Génère ton premier post</h3>
              <p className="text-[#818cf8] text-sm">
                Sélectionne un type, ajoute un sujet optionnel, puis clique sur Générer.
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT: History ───────────────────────────────────────────────── */}
        <div className="bg-[#151524] border border-[#2a2a42] rounded-xl flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
          {/* Header */}
          <div className="p-4 border-b border-[#2a2a42] flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">
                Historique des posts
                <span className="ml-2 text-xs text-[#818cf8] font-normal">({filteredPosts.length})</span>
              </h2>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1 bg-[#1e1e30] rounded-lg p-1">
              {(['all', 'DRAFT', 'PUBLISHED'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                    filter === f
                      ? 'bg-[#4f46e5] text-white'
                      : 'text-[#818cf8] hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Tous' : f === 'DRAFT' ? 'Drafts' : 'Publiés'}
                </button>
              ))}
            </div>
          </div>

          {/* Post list */}
          <div className="flex-1">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-6 w-6 text-[#4f46e5]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            ) : filteredPosts.length === 0 ? (
              <EmptyHistory />
            ) : (
              <div className="divide-y divide-[#2a2a42]">
                {filteredPosts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => handleSelectPost(post)}
                    className={`p-3 cursor-pointer transition-all hover:bg-[#1e1e30] ${
                      activePostId === post.id ? 'bg-[#4f46e5]/10 border-l-2 border-[#4f46e5]' : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-medium flex-shrink-0 ${TYPE_COLORS[post.postType] ?? TYPE_COLORS.insight}`}>
                        {POST_TYPES.find(t => t.value === post.postType)?.label.split(' ')[0] ?? '📝'}
                        <span className="ml-1">{POST_TYPES.find(t => t.value === post.postType)?.label.split(' ').slice(1).join(' ') ?? post.postType}</span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          post.status === 'PUBLISHED'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-[#2a2a42] text-[#818cf8]'
                        }`}>
                          {post.status === 'PUBLISHED' ? '✅' : '📝'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(post.id) }}
                          className="text-[#818cf8] hover:text-red-400 transition-colors text-xs p-0.5 rounded"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-[#c4c4d4] text-xs leading-relaxed line-clamp-2 mb-1">
                      {post.content.slice(0, 100)}{post.content.length > 100 ? '…' : ''}
                    </p>
                    <p className="text-[#818cf8] text-xs">
                      {mounted ? formatDate(post.createdAt) : '…'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}