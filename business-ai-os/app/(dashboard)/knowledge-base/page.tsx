'use client'
import { useState, useEffect, useRef } from 'react'

interface KBDoc {
  id: string
  name: string
  fileName: string
  fileType: string
  category: string
  size: number
  status: string
  pageCount?: number
  createdAt: string
}

const CATEGORIES = ['Général', 'Offres & Tarifs', 'Produits & Services', 'Commercial', 'Appels d\'offre', 'Références', 'Admin & Légal']
const FILE_ICONS: Record<string, string> = { pdf: '📄', docx: '📝', pptx: '📊', txt: '📃', md: '📋' }
const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  PROCESSING: { dot: 'bg-yellow-400 animate-pulse', label: 'Indexation...' },
  INDEXED:    { dot: 'bg-green-400', label: 'Indexé' },
  ERROR:      { dot: 'bg-red-400', label: 'Erreur' },
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KBDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filterCat, setFilterCat] = useState('Tous')

  // Upload form state
  const [file, setFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [category, setCategory] = useState('Général')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadDocs() }, [])

  async function loadDocs() {
    setLoading(true)
    try {
      const res = await fetch('/api/knowledge')
      if (res.ok) setDocs(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', docName || file.name.replace(/\.[^.]+$/, ''))
      fd.append('category', category)
      const res = await fetch('/api/knowledge', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur upload')
      setUploadMsg({ type: 'success', text: `✅ "${data.name}" indexé avec succès (${data.pageCount ?? 1} page${(data.pageCount ?? 1) > 1 ? 's' : ''})` })
      setDocs(prev => [data, ...prev])
      setFile(null); setDocName(''); setCategory('Général')
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => { setShowModal(false); setUploadMsg(null) }, 2000)
    } catch (err) {
      setUploadMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce document de la Knowledge Base ?')) return
    const res = await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' })
    if (res.ok) setDocs(prev => prev.filter(d => d.id !== id))
  }

  const filtered = filterCat === 'Tous' ? docs : docs.filter(d => d.category === filterCat)
  const indexedCount = docs.filter(d => d.status === 'INDEXED').length

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white p-4 sm:p-6 pb-24 sm:pb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📚 Base de connaissance</h1>
          <p className="text-sm text-gray-400 mt-1">
            {indexedCount} document{indexedCount !== 1 ? 's' : ''} indexé{indexedCount !== 1 ? 's' : ''} — utilisés par le Business Brain Chat
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          + Ajouter un document
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total documents', value: docs.length, color: 'text-white' },
          { label: 'Indexés', value: indexedCount, color: 'text-green-400' },
          { label: 'En cours', value: docs.filter(d => d.status === 'PROCESSING').length, color: 'text-yellow-400' },
          { label: 'Erreurs', value: docs.filter(d => d.status === 'ERROR').length, color: 'text-red-400' },
        ].map(k => (
          <div key={k.label} className="bg-[#13131f] border border-[#2a2a42] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-6 flex gap-3">
        <span className="text-2xl">🧠</span>
        <div>
          <p className="text-sm font-semibold text-indigo-300">Comment ça fonctionne ?</p>
          <p className="text-xs text-gray-400 mt-1">
            Les documents uploadés sont automatiquement lus et indexés. Le <strong className="text-white">Business Brain Chat</strong> les utilise pour répondre avec le contexte exact de votre activité — tarifs, offres, références clients, appels d&apos;offre...
          </p>
        </div>
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['Tous', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterCat === cat ? 'bg-indigo-600 text-white' : 'bg-[#1e1e30] text-gray-400 hover:text-white'
            }`}
          >{cat}</button>
        ))}
      </div>

      {/* Liste documents */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#13131f] border border-[#2a2a42] rounded-xl">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-gray-400 font-medium">Aucun document</p>
          <p className="text-xs text-gray-600 mt-1">Uploadez vos plaquettes, tarifs, présentations...</p>
          <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ Ajouter un document</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const st = STATUS_STYLES[doc.status] ?? STATUS_STYLES.ERROR
            return (
              <div
                key={doc.id}
                className="bg-[#13131f] border border-[#2a2a42] hover:border-[#4f46e5]/40 rounded-xl p-4 flex items-center gap-4 transition-colors cursor-pointer"
                onClick={() => window.open(`/api/knowledge/file?id=${doc.id}`, '_blank')}
              >
                <div className="text-3xl w-10 text-center shrink-0">{FILE_ICONS[doc.fileType] ?? '📎'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm truncate">{doc.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2a42] text-gray-400">{doc.category}</span>
                    <span className="flex items-center gap-1 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      <span className="text-gray-400">{st.label}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.fileName} · {fmtSize(doc.size)}
                    {doc.pageCount ? ` · ${doc.pageCount} page${doc.pageCount > 1 ? 's' : ''}` : ''}
                    · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.status === 'INDEXED' && (
                    <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded hidden sm:inline">👁 Ouvrir</span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(doc.id) }}
                    className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                  >🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-2xl z-40 active:scale-95 transition-transform"
      >+</button>

      {/* Modal upload */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13131f] border border-[#2a2a42] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">📤 Ajouter un document</h2>
            <form onSubmit={handleUpload} className="space-y-4">

              {/* Zone de drop */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#4f46e5]/40 rounded-xl p-6 text-center cursor-pointer hover:border-[#4f46e5] transition-colors"
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.pptx,.txt,.md"
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null
                    setFile(f)
                    if (f && !docName) setDocName(f.name.replace(/\.[^.]+$/, ''))
                  }}
                />
                {file ? (
                  <p className="text-sm text-indigo-300 font-medium">{file.name} ({fmtSize(file.size)})</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">Cliquer pour sélectionner un fichier</p>
                    <p className="text-xs text-gray-600 mt-1">PDF, DOCX, PPTX, TXT, MD · max 10Mo</p>
                  </>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Nom du document</label>
                <input
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="Plaquette commerciale 2026"
                  className="w-full bg-[#0d0d1a] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#0d0d1a] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {uploadMsg && (
                <div className={`p-3 rounded-lg text-sm ${uploadMsg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {uploadMsg.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setUploadMsg(null); setFile(null); setDocName(''); }} className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-[#2a2a42] rounded-lg transition-colors">Annuler</button>
                <button type="submit" disabled={uploading || !file} className="flex-1 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-lg transition-all">
                  {uploading ? '⏳ Indexation...' : '📤 Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}