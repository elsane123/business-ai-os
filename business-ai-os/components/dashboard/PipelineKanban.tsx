'use client'
import { useState, useCallback, useRef } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Prospect {
  id: string
  name: string
  company?: string
  value: number
  status: string
  email?: string
  lastContactDate?: string
}

interface PipelineKanbanProps {
  prospects: Prospect[]
  onProspectMoved?: (prospectId: string, newStatus: string) => void
  onGenerateRelance?: (prospect: Prospect) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { status: string; title: string; color: string }[] = [
  { status: 'IDENTIFIED',  title: 'Prospect',  color: 'bg-gray-500' },
  { status: 'CONTACTED',   title: 'Contacté',  color: 'bg-blue-500' },
  { status: 'INTERESTED',  title: 'Intéressé', color: 'bg-yellow-500' },
  { status: 'PROPOSAL',    title: 'Devis',     color: 'bg-orange-500' },
  { status: 'WON',         title: 'Gagné',     color: 'bg-green-500' },
]

const RELANCE_STATUSES = ['CONTACTED', 'INTERESTED']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(dateStr))
}

function getHeatBadge(lastContactDate?: string): { label: string; className: string } | null {
  if (!lastContactDate) return null
  const days = Math.floor((Date.now() - new Date(lastContactDate).getTime()) / 86400000)
  if (days >= 14) return { label: `J+${days}`, className: 'bg-red-500/20 text-red-400 border border-red-500/30' }
  if (days >= 7)  return { label: `J+${days}`, className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' }
  return null
}

// ─── ProspectCard ─────────────────────────────────────────────────────────────

function ProspectCard({
  prospect,
  onDragStart,
  onGenerateRelance,
  isDragging,
}: {
  prospect: Prospect
  onDragStart: (id: string) => void
  onGenerateRelance?: (prospect: Prospect) => void
  isDragging: boolean
}) {
  const canRelance = RELANCE_STATUSES.includes(prospect.status)
  const heat = getHeatBadge(prospect.lastContactDate)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(prospect.id)
      }}
      className={`bg-[#151524] border rounded-lg p-3 mb-2 cursor-grab active:cursor-grabbing transition-all duration-150 select-none
        ${ isDragging
          ? 'opacity-40 scale-95 border-[#4f46e5] shadow-lg shadow-indigo-500/20'
          : 'border-[#2a2a42] hover:border-[#4f46e5]/50'
        }`}
    >
      {/* Name + Company */}
      <div className="mb-2">
        <p className="text-sm font-semibold text-white leading-tight">{prospect.name}</p>
        {prospect.company && (
          <p className="text-xs text-[#818cf8] mt-0.5">{prospect.company}</p>
        )}
      </div>

      {/* Value + Date + Heat */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-green-400 tabular-nums">
          {formatCurrency(prospect.value)}
        </span>
        <div className="flex items-center gap-1.5">
          {heat && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${heat.className}`}>
              {heat.label}
            </span>
          )}
          {prospect.lastContactDate && (
            <span className="text-xs text-gray-500">{formatDate(prospect.lastContactDate)}</span>
          )}
        </div>
      </div>

      {/* Relance button */}
      {canRelance && onGenerateRelance && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs mt-1 text-[#818cf8] hover:text-white hover:bg-[#4f46e5]/20 border border-[#2a2a42] hover:border-[#4f46e5]/50"
          onClick={(e) => { e.stopPropagation(); onGenerateRelance(prospect) }}
        >
          ⚡ Générer relance
        </Button>
      )}
    </div>
  )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({
  title,
  status,
  color,
  prospects,
  isDragOver,
  draggingId,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardDragStart,
  onGenerateRelance,
}: {
  title: string
  status: string
  color: string
  prospects: Prospect[]
  isDragOver: boolean
  draggingId: string | null
  onDragOver: (status: string) => void
  onDragLeave: () => void
  onDrop: (status: string) => void
  onCardDragStart: (id: string) => void
  onGenerateRelance?: (prospect: Prospect) => void
}) {
  const total = prospects.reduce((sum, p) => sum + p.value, 0)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(status) }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(status) }}
      className={`flex flex-col min-h-[400px] rounded-xl p-3 transition-all duration-200
        ${ isDragOver
          ? 'bg-[#4f46e5]/10 border-2 border-[#4f46e5]/60 border-dashed scale-[1.01]'
          : 'bg-[#0f0f1f] border border-[#2a2a42]'
        }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className="text-xs bg-[#1e1e3f] text-gray-400 rounded-full px-2 py-0.5">
            {prospects.length}
          </span>
        </div>
        {prospects.length > 0 && (
          <span className="text-xs text-green-400 font-medium tabular-nums">
            {formatCurrency(total)}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1">
        {prospects.map((p) => (
          <ProspectCard
            key={p.id}
            prospect={p}
            onDragStart={onCardDragStart}
            onGenerateRelance={onGenerateRelance}
            isDragging={draggingId === p.id}
          />
        ))}
      </div>

      {/* Drop zone hint */}
      {isDragOver && (
        <div className="mt-2 rounded-lg border-2 border-dashed border-[#4f46e5]/40 p-4 text-center">
          <p className="text-xs text-[#818cf8]">Déposer ici</p>
        </div>
      )}
    </div>
  )
}

// ─── PipelineKanban ───────────────────────────────────────────────────────────

export default function PipelineKanban({
  prospects: initialProspects,
  onProspectMoved,
  onGenerateRelance,
}: PipelineKanbanProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)
  const dragLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external changes
  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id)
  }, [])

  const handleDragOver = useCallback((status: string) => {
    if (dragLeaveTimer.current) clearTimeout(dragLeaveTimer.current)
    setDragOverStatus(status)
  }, [])

  const handleDragLeave = useCallback(() => {
    // Delay to avoid flicker when moving between child elements
    dragLeaveTimer.current = setTimeout(() => setDragOverStatus(null), 80)
  }, [])

  const handleDrop = useCallback(async (newStatus: string) => {
    setDragOverStatus(null)
    if (!draggingId) return

    const prospect = prospects.find((p) => p.id === draggingId)
    if (!prospect || prospect.status === newStatus) {
      setDraggingId(null)
      return
    }

    // Optimistic update
    setProspects((prev) =>
      prev.map((p) => p.id === draggingId ? { ...p, status: newStatus } : p)
    )
    setDraggingId(null)

    try {
      const res = await fetch('/api/pipeline/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggingId, status: newStatus }),
      })
      if (!res.ok) throw new Error('API error')
      onProspectMoved?.(draggingId, newStatus)
    } catch {
      // Rollback on error
      setProspects((prev) =>
        prev.map((p) => p.id === draggingId ? { ...p, status: prospect.status } : p)
      )
    }
  }, [draggingId, prospects, onProspectMoved])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOverStatus(null)
  }, [])

  return (
    <div
      className="grid grid-cols-5 gap-3"
      onDragEnd={handleDragEnd}
    >
      {COLUMNS.map((col) => (
        <KanbanColumn
          key={col.status}
          title={col.title}
          status={col.status}
          color={col.color}
          prospects={prospects.filter((p) => p.status === col.status)}
          isDragOver={dragOverStatus === col.status}
          draggingId={draggingId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onCardDragStart={handleDragStart}
          onGenerateRelance={onGenerateRelance}
        />
      ))}
    </div>
  )
}
