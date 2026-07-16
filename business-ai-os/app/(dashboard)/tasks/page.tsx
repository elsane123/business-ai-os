'use client'

import { useState, useEffect, useCallback } from 'react'

type TaskCategory = 'CASH' | 'CLIENTS' | 'VISIBILITY' | 'ADMIN' | 'AUTRE'
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'

interface LinkedProspect {
  id: string
  name: string
  company?: string
  status: string
  value: number
}

interface Task {
  id: string
  title: string
  description?: string
  category: TaskCategory
  status: TaskStatus
  priority: TaskPriority
  aiPriorityScore?: number
  aiReason?: string
  estimatedMinutes?: number
  dueDate?: string
  linkedProspect?: LinkedProspect
  linkedInvoiceId?: string
  isRecurring: boolean
  recurrenceType?: string
  recurrenceLabel?: string
  completedAt?: string
  createdAt: string
}

interface Prospect {
  id: string
  name: string
  company?: string
  status: string
  value: number
}

const CATEGORY_CONFIG: Record<TaskCategory, { emoji: string; label: string; color: string; bg: string }> = {
  CASH:       { emoji: '💰', label: 'Cash',       color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  CLIENTS:    { emoji: '👥', label: 'Clients',    color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  VISIBILITY: { emoji: '📣', label: 'Visibilité', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  ADMIN:      { emoji: '⚙️', label: 'Admin',      color: 'text-slate-400',  bg: 'bg-slate-400/10 border-slate-400/20' },
  AUTRE:      { emoji: '📌', label: 'Autre',       color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
}

const PRIORITY_CONFIG: Record<TaskPriority, { dot: string; badge: string; label: string }> = {
  HIGH:   { dot: 'bg-red-500',   badge: 'bg-red-500/20 text-red-400 border-red-500/30',       label: 'Haute' },
  MEDIUM: { dot: 'bg-amber-500', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Moyenne' },
  LOW:    { dot: 'bg-slate-500', badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Basse' },
}

const DURATION_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
]

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Aucune' },
  { value: 'DAILY', label: 'Quotidienne' },
  { value: 'WEEKLY', label: 'Hebdomadaire' },
  { value: 'MONTHLY_START', label: 'Début de mois' },
  { value: 'MONTHLY_END', label: 'Fin de mois' },
  { value: 'QUARTERLY', label: 'Trimestrielle' },
]

function formatDuration(minutes?: number): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  return `${minutes / 60}h`
}

function formatDueDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((date.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return `⚠️ Retard (${Math.abs(diff)}j)`
  if (diff === 0) return "📅 Aujourd'hui"
  if (diff === 1) return '📅 Demain'
  return `📅 J+${diff}`
}

// ─── Modal Brief IA ──────────────────────────────────────────────────────────

function BriefModal({ onClose, onParsed }: {
  onClose: () => void
  onParsed: (data: Partial<Task>) => void
}) {
  const [brief, setBrief] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brief.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tasks/parse-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      onParsed(data.task)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 pointer-events-none">
      <div className="bg-[#1a1d2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">✍️ Créer depuis un brief</h2>
            <p className="text-xs text-slate-400 mt-0.5">L&apos;IA analyse votre texte et pré-remplit la tâche</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Décrivez la tâche en langage naturel</label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={5}
              autoFocus
              placeholder={'Ex : « Relancer Martin chez Acme pour la facture de 2400€ impayée depuis 3 semaines, c\'est urgent » ou « Publier un post LinkedIn sur notre nouvelle offre d\'ici vendredi »'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none leading-relaxed"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              ⚠️ {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors text-sm"
            >Annuler</button>
            <button type="submit" disabled={loading || !brief.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> Analyse en cours...</>
              ) : (
                <><span>✨</span> Analyser &amp; pré-remplir</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal Création/Édition ───────────────────────────────────────────────────

function TaskModal({ task, prefill, prospects, onClose, onSave }: {
  task?: Task
  prefill?: Partial<Task>
  prospects: Prospect[]
  onClose: () => void
  onSave: (data: Partial<Task> & { linkedProspectId?: string }) => Promise<void>
}) {
  const [title, setTitle] = useState(task?.title || prefill?.title || '')
  const [description, setDescription] = useState(task?.description || prefill?.description || '')
  const [category, setCategory] = useState<TaskCategory>(task?.category || prefill?.category as TaskCategory || 'ADMIN')
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(task?.estimatedMinutes || prefill?.estimatedMinutes)
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : prefill?.dueDate ? (prefill.dueDate as string).split('T')[0] : '')
  const [linkedProspectId, setLinkedProspectId] = useState(task?.linkedProspect?.id || '')
  const [recurrenceType, setRecurrenceType] = useState(task?.recurrenceType || '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      title, description, category, estimatedMinutes,
      dueDate: dueDate || undefined,
      linkedProspectId: linkedProspectId || undefined,
      isRecurring: !!recurrenceType,
      recurrenceType: recurrenceType || undefined,
      recurrenceLabel: RECURRENCE_OPTIONS.find(r => r.value === recurrenceType)?.label,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 pointer-events-none">
      <div className="bg-[#1a1d2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] pointer-events-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            {task ? '✏️ Modifier la tâche' : '✨ Nouvelle tâche'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Titre *</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Relancer facture Dupont 890€" required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Description (optionnel)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Catégorie</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(CATEGORY_CONFIG) as TaskCategory[]).map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                    category === cat
                      ? `${CATEGORY_CONFIG[cat].bg} ${CATEGORY_CONFIG[cat].color} border-current`
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg">{CATEGORY_CONFIG[cat].emoji}</span>
                  {CATEGORY_CONFIG[cat].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">⏱ Durée estimée</label>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setEstimatedMinutes(estimatedMinutes === opt.value ? undefined : opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      estimatedMinutes === opt.value
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">📅 Échéance</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">🔗 Lier un prospect (optionnel)</label>
            <select value={linkedProspectId} onChange={e => setLinkedProspectId(e.target.value)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
            >
              <option value="">Aucun prospect lié</option>
              {prospects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.company ? ` — ${p.company}` : ''} ({p.value.toLocaleString('fr-FR')}€)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">🔁 Récurrence</label>
            <div className="flex flex-wrap gap-1.5">
              {RECURRENCE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setRecurrenceType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    recurrenceType === opt.value
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors text-sm"
            >Annuler</button>
            <button type="submit" disabled={saving || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-colors"
            >{saving ? 'Enregistrement...' : task ? 'Mettre à jour' : 'Créer la tâche'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Carte Tâche ──────────────────────────────────────────────────────────────

function TaskCard({ task, onStatusChange, onEdit, onDelete }: {
  task: Task
  onStatusChange: (id: string, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}) {
  const cat = CATEGORY_CONFIG[task.category]
  const pri = PRIORITY_CONFIG[task.priority]
  const isDone = task.status === 'DONE'

  return (
    <div className={`bg-white/5 border rounded-xl p-4 transition-all hover:border-white/20 ${
      isDone ? 'opacity-50 border-white/5' : 'border-white/10'
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onStatusChange(task.id, isDone ? 'TODO' : 'DONE')}          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-white'
          }`}
        >
          {isDone && <span className="text-white text-[10px] font-bold">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
            {task.title}
          </p>
          {task.aiReason && !isDone && (
            <p className="text-xs text-amber-400/80 mt-1 italic">💬 {task.aiReason}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cat.bg} ${cat.color}`}>
              {cat.emoji} {cat.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${pri.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
              {pri.label}
            </span>
            {task.estimatedMinutes && (
              <span className="text-xs text-slate-500">⏱ {formatDuration(task.estimatedMinutes)}</span>
            )}
            {task.dueDate && (
              <span className={`text-xs ${formatDueDate(task.dueDate).includes('Retard') ? 'text-red-400' : 'text-slate-500'}`}>
                {formatDueDate(task.dueDate)}
              </span>
            )}
            {task.isRecurring && task.recurrenceLabel && (
              <span className="text-xs text-indigo-400">🔁 {task.recurrenceLabel}</span>
            )}
          </div>
          {task.linkedProspect && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-400">
              <span>🔗</span>
              <span>{task.linkedProspect.name}</span>
              {task.linkedProspect.company && <span className="text-slate-500">— {task.linkedProspect.company}</span>}
              <span className="text-slate-500">({task.linkedProspect.value.toLocaleString('fr-FR')}€)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(task)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all text-xs"
          >✏️</button>
          <button onClick={() => onDelete(task.id)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all text-xs"
          >🗑️</button>
        </div>
      </div>
    </div>
  )
}

// ─── Page Principale ─────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [prioritizing, setPrioritizing] = useState(false)
  const [prioritizeError, setPrioritizeError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [briefPrefill, setBriefPrefill] = useState<Partial<Task> | undefined>()

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const statusParam = filterStatus === 'active' ? 'TODO' : filterStatus === 'done' ? 'DONE' : 'all'
      const res = await fetch(`/api/tasks?status=${statusParam}&category=${filterCategory}`)
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus])

  useEffect(() => {
    loadTasks()
    fetch('/api/pipeline/prospects')
      .then(r => r.json())
      .then(d => setProspects(d.prospects || []))
      .catch(console.error)
  }, [loadTasks])

  async function handleSave(data: Partial<Task> & { linkedProspectId?: string }) {
    if (editingTask) {
      await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      })
    } else {
      await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      })
    }
    setShowModal(false)
    setEditingTask(undefined)
    loadTasks()
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    })
    loadTasks()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette tâche ?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    loadTasks()
  }

  async function handlePrioritize() {
    setPrioritizing(true)
    setPrioritizeError(null)
    try {
      const res = await fetch('/api/tasks/prioritize', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la priorisation')
      loadTasks()
    } catch (e) {
      setPrioritizeError(e instanceof Error ? e.message : 'Service de priorisation indisponible')
    } finally {
      setPrioritizing(false)
    }
  }

  function handleBriefParsed(data: Partial<Task>) {
    setShowBriefModal(false)
    setBriefPrefill(data)
    setEditingTask(undefined)
    setShowModal(true)
  }

  const totalActive = tasks.filter(t => ['TODO','IN_PROGRESS'].includes(t.status)).length
  const highPriority = tasks.filter(t => t.priority === 'HIGH' && t.status !== 'DONE').length
  const totalMinutes = tasks.filter(t => t.status !== 'DONE' && t.estimatedMinutes).reduce((s, t) => s + (t.estimatedMinutes || 0), 0)

  const grouped = {
    HIGH:   tasks.filter(t => t.priority === 'HIGH'   && !['DONE','CANCELLED'].includes(t.status)),
    MEDIUM: tasks.filter(t => t.priority === 'MEDIUM' && !['DONE','CANCELLED'].includes(t.status)),
    LOW:    tasks.filter(t => t.priority === 'LOW'    && !['DONE','CANCELLED'].includes(t.status)),
    DONE:   tasks.filter(t => t.status === 'DONE'),
  }

  const CATEGORIES_FILTER = [
    { value: 'all', label: 'Toutes' },
    { value: 'CASH', label: '💰 Cash' },
    { value: 'CLIENTS', label: '👥 Clients' },
    { value: 'VISIBILITY', label: '📣 Visibilité' },
    { value: 'ADMIN', label: '⚙️ Admin' },
    { value: 'AUTRE', label: '📌 Autre' },
  ]

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">📋 Tâches</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {totalActive} active{totalActive > 1 ? 's' : ''}
              {highPriority > 0 && <span className="text-red-400 ml-2">· {highPriority} haute priorité</span>}
              {totalMinutes > 0 && <span className="text-slate-500 ml-2">· ~{formatDuration(totalMinutes)} estimées</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col items-end gap-1">
              <button onClick={handlePrioritize} disabled={prioritizing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-sm font-medium transition-all disabled:opacity-50"
              >{prioritizing ? '⏳ Analyse...' : '✨ Prioriser'}</button>
              {prioritizeError && (
                <p className="text-xs text-red-400">⚠️ {prioritizeError}</p>
              )}
            </div>
            <button onClick={() => setShowBriefModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-sm font-medium transition-all"
            >✍️ Brief</button>
            <button onClick={() => { setEditingTask(undefined); setBriefPrefill(undefined); setShowModal(true) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
            >+ Nouvelle tâche</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            {[['active','Actives'],['done','Terminées'],['all','Toutes']].map(([val, label]) => (
              <button key={val} onClick={() => setFilterStatus(val)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterStatus === val ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES_FILTER.map(c => (
              <button key={c.value} onClick={() => setFilterCategory(c.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  filterCategory === c.value
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >{c.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">Chargement...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-slate-400 mb-2">Aucune tâche pour l&apos;instant</p>
            <p className="text-slate-600 text-sm">Créez votre première tâche pour démarrer</p>
            <button onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
            >+ Nouvelle tâche</button>
          </div>
        ) : (
          <div className="space-y-6">
            {(['HIGH','MEDIUM','LOW'] as TaskPriority[]).map(p => (
              grouped[p].length > 0 && (
                <div key={p}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                    <span className="text-sm font-medium text-slate-300">{PRIORITY_CONFIG[p].label}</span>
                    <span className="text-xs text-slate-600">({grouped[p].length})</span>
                  </div>
                  <div className="space-y-2">
                    {grouped[p].map(task => (
                      <TaskCard key={task.id} task={task}
                        onStatusChange={handleStatusChange}
                        onEdit={t => { setEditingTask(t); setShowModal(true) }}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
            {filterStatus !== 'active' && grouped.DONE.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-slate-300">Terminées</span>
                  <span className="text-xs text-slate-600">({grouped.DONE.length})</span>
                </div>
                <div className="space-y-2">
                  {grouped.DONE.map(task => (
                    <TaskCard key={task.id} task={task}
                      onStatusChange={handleStatusChange}
                      onEdit={t => { setEditingTask(t); setShowModal(true) }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          prospects={prospects}
          prefill={briefPrefill}
          onClose={() => { setShowModal(false); setEditingTask(undefined); setBriefPrefill(undefined) }}
          onSave={handleSave}
        />
      )}
      {showBriefModal && (
        <BriefModal
          onClose={() => setShowBriefModal(false)}
          onParsed={handleBriefParsed}
        />
      )}
    </div>
  )
}
