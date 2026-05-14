'use client'

import Badge from '@/components/ui/Badge'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActionStatus = 'pending' | 'done' | 'skipped' | 'snoozed'

export interface FocusAction {
  priority: 'high' | 'medium' | 'low'
  action: string
  context: string
  why: string
  estimatedTime: string
}

interface DailyFocusProps {
  action: FocusAction
  index: number
  status: ActionStatus
  onStatusChange: (status: ActionStatus) => void
  disabled?: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITY_VARIANT: Record<FocusAction['priority'], 'danger' | 'warning' | 'info'> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
}

const PRIORITY_LABEL: Record<FocusAction['priority'], string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Faible',
}

const STATUS_STYLES: Record<ActionStatus, { card: string; text: string; label: string }> = {
  pending: {
    card: 'bg-[#151524] border-[#2a2a42] hover:border-[#4f46e5]/50',
    text: 'text-white',
    label: '',
  },
  done: {
    card: 'bg-[#0d1f18] border-green-900/50',
    text: 'text-gray-500 line-through',
    label: '✅ Fait',
  },
  skipped: {
    card: 'bg-[#1a1a1a] border-[#2a2a42] opacity-60',
    text: 'text-gray-600 line-through',
    label: '❌ Ignoré',
  },
  snoozed: {
    card: 'bg-[#1a1526] border-purple-900/50',
    text: 'text-gray-400',
    label: '🔄 Reporté',
  },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DailyFocus({
  action,
  index,
  status,
  onStatusChange,
  disabled = false,
}: DailyFocusProps) {
  const styles = STATUS_STYLES[status]
  const isPending = status === 'pending'

  return (
    <div
      className={[
        'border rounded-xl p-5 transition-all duration-200 group flex flex-col gap-3',
        styles.card,
      ].join(' ')}
    >
      {/* Header: index + priority badge + status label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#2a2a42] group-hover:text-[#4f46e5]/40 transition-colors select-none">
            #{index}
          </span>
          {!isPending && (
            <span className="text-xs font-medium text-gray-500">{styles.label}</span>
          )}
        </div>
        {isPending && (
          <Badge variant={PRIORITY_VARIANT[action.priority]}>
            {PRIORITY_LABEL[action.priority]}
          </Badge>
        )}
      </div>

      {/* Action title */}
      <h3 className={`text-base font-semibold leading-snug ${styles.text}`}>
        {action.action}
      </h3>

      {/* Context + Why — masqués si ignoré */}
      {status !== 'skipped' && (
        <>
          <p className="text-sm text-[#818cf8]">{action.context}</p>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pourquoi</span>
            <p className="text-sm text-gray-400 mt-0.5">{action.why}</p>
          </div>
        </>
      )}

      {/* Estimated time */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
        <span>{action.estimatedTime}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 border-t border-[#2a2a42] mt-auto">
        {status === 'done' ? (
          // Undo done
          <button
            onClick={() => !disabled && onStatusChange('pending')}
            disabled={disabled}
            className="flex-1 text-xs py-1.5 rounded-lg border border-green-900/40 text-green-700 hover:text-green-400 hover:border-green-700/50 transition-colors"
          >
            ↩ Annuler
          </button>
        ) : status === 'skipped' ? (
          // Undo skip
          <button
            onClick={() => !disabled && onStatusChange('pending')}
            disabled={disabled}
            className="flex-1 text-xs py-1.5 rounded-lg border border-[#2a2a42] text-gray-600 hover:text-gray-400 transition-colors"
          >
            ↩ Restaurer
          </button>
        ) : status === 'snoozed' ? (
          // Undo snooze
          <button
            onClick={() => !disabled && onStatusChange('pending')}
            disabled={disabled}
            className="flex-1 text-xs py-1.5 rounded-lg border border-purple-900/40 text-purple-700 hover:text-purple-400 transition-colors"
          >
            ↩ Annuler
          </button>
        ) : (
          // Pending — show 3 action buttons
          <>
            <button
              onClick={() => !disabled && onStatusChange('done')}
              disabled={disabled}
              title="Marquer comme fait"
              className="flex-1 text-xs py-1.5 rounded-lg border border-green-900/30 text-green-600 hover:bg-green-900/20 hover:text-green-400 hover:border-green-700/50 transition-all"
            >
              ✅ Fait
            </button>
            <button
              onClick={() => !disabled && onStatusChange('snoozed')}
              disabled={disabled}
              title="Reporter au lendemain"
              className="flex-1 text-xs py-1.5 rounded-lg border border-purple-900/30 text-purple-600 hover:bg-purple-900/20 hover:text-purple-400 hover:border-purple-700/50 transition-all"
            >
              🔄 Reporter
            </button>
            <button
              onClick={() => !disabled && onStatusChange('skipped')}
              disabled={disabled}
              title="Ignorer cette action"
              className="flex-1 text-xs py-1.5 rounded-lg border border-red-900/30 text-red-700 hover:bg-red-900/20 hover:text-red-500 hover:border-red-700/50 transition-all"
            >
              ❌ Ignorer
            </button>
          </>
        )}
      </div>
    </div>
  )
}
