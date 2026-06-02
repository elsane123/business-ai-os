'use client'

import { useState } from 'react'

interface ProBadgeProps {
  collapsed?: boolean // sidebar collapsed mode — show only icon
}

export default function ProBadge({ collapsed = false }: ProBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleUpgrade = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.location.href = '/focus?upgrade=1'
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {collapsed ? (
        // Collapsed mode: small dot indicator
        <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] flex-shrink-0" />
      ) : (
        // Full badge
        <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#8b5cf6] text-white leading-none">
          PRO
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-52 pointer-events-none"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))' }}
        >
          <div className="bg-[#1a1a2e] border border-[#3a3a5c] rounded-xl p-3 text-left">
            <p className="text-white font-semibold text-xs mb-1">🔒 Fonctionnalité Solo Pro</p>
            <p className="text-[#818cf8] text-[11px] leading-relaxed mb-2">
              Débloquez les fonctionnalités IA avancées pour automatiser votre activité.
            </p>
            <button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[11px] font-bold py-1.5 px-2 rounded-lg pointer-events-auto hover:opacity-90 transition-opacity"
            >
              Passer à Solo Pro — 29€/mois →
            </button>
          </div>
          {/* Arrow pointing left */}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
            style={{ borderRightColor: '#3a3a5c' }}
          />
        </div>
      )}
    </span>
  )
}
