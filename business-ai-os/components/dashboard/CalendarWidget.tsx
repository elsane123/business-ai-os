'use client'

import { useState, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  attendeeName?: string
  attendeeEmail?: string
  status: string
  meetingUrl?: string
  notes?: string
  prospect?: {
    id: string
    name: string
    company?: string
    status: string
  } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'CONFIRMED':   return 'bg-green-500/20 border-green-500/40 text-green-300'
    case 'RESCHEDULED': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
    case 'CANCELLED':   return 'bg-red-500/20 border-red-500/40 text-red-300'
    default:            return 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'CONFIRMED':   return '✅ Confirmé'
    case 'RESCHEDULED': return '🔄 Reporté'
    case 'CANCELLED':   return '❌ Annulé'
    default:            return status
  }
}

function isInNextHour(iso: string): boolean {
  const now = new Date()
  const start = new Date(iso)
  const diffMs = start.getTime() - now.getTime()
  return diffMs > 0 && diffMs <= 60 * 60 * 1000
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [hasCalcom, setHasCalcom] = useState<boolean | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Vérifier si Cal.com est configuré
        const profileRes = await fetch('/api/auth/profile')
        if (profileRes.ok) {
          const { user } = await profileRes.json()
          setHasCalcom(!!(user?.calcomWebhookSecret && user?.calcomBookingUrl))
        }

        // Charger les RDV du jour
        const eventsRes = await fetch('/api/calcom/events?today=true')
        if (eventsRes.ok) {
          const data = await eventsRes.json()
          setEvents(data.events || [])
        }
      } catch (e) {
        console.error('CalendarWidget load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Ne pas afficher le widget si Cal.com n'est pas configuré et qu'il n'y a pas de RDV
  if (!loading && hasCalcom === false && events.length === 0) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 mb-6 animate-pulse">
        <div className="h-4 bg-[#2a2a42] rounded w-1/3 mb-3" />
        <div className="h-16 bg-[#2a2a42] rounded" />
      </div>
    )
  }

  // Cal.com configuré mais aucun RDV aujourd'hui
  if (hasCalcom && events.length === 0) {
    return (
      <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">📅</span>
          <h3 className="text-sm font-semibold text-white">RDV du jour</h3>
        </div>
        <p className="text-xs text-gray-500">Aucun rendez-vous prévu aujourd&apos;hui. Agenda libre !</p>
      </div>
    )
  }

  if (events.length === 0) return null

  return (
    <div className="bg-[#151524] border border-[#2a2a42] rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <h3 className="text-sm font-semibold text-white">RDV du jour</h3>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full px-2 py-0.5">
            {events.length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {events.map((event) => {
          const soon = isInNextHour(event.startTime)
          return (
            <div
              key={event.id}
              className={`rounded-lg border p-3 ${
                soon
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-[#0f0f1f] border-[#2a2a42]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Horaire + alerte */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-300">
                      {formatTime(event.startTime)} – {formatTime(event.endTime)}
                    </span>
                    {soon && (
                      <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-1.5 py-0.5 animate-pulse">
                        🔔 Dans moins d&apos;1h
                      </span>
                    )}
                  </div>

                  {/* Titre du RDV */}
                  <p className="text-sm font-semibold text-white truncate">{event.title}</p>

                  {/* Attendee */}
                  {event.attendeeName && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      👤 {event.attendeeName}
                      {event.prospect?.company && (
                        <span className="text-gray-500"> — {event.prospect.company}</span>
                      )}
                    </p>
                  )}

                  {/* Lien prospect si trouvé */}
                  {event.prospect && (
                    <div className="mt-1.5">
                      <span className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full px-2 py-0.5">
                        🎯 Prospect pipeline
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(event.status)}`}>
                    {getStatusLabel(event.status)}
                  </span>
                  {event.meetingUrl && (
                    <a
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
                    >
                      📹 Rejoindre
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              {event.notes && (
                <p className="text-xs text-gray-500 mt-2 border-t border-[#2a2a42] pt-2 line-clamp-2">
                  {event.notes}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
