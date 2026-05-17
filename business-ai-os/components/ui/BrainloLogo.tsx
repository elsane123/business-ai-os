import React from 'react'

interface BrainloLogoProps {
  size?: number
  showText?: boolean
  collapsed?: boolean
  className?: string
  textSize?: string
}

export default function BrainloLogo({
  size = 34,
  showText = true,
  collapsed = false,
  className = '',
  textSize = '17px',
}: BrainloLogoProps) {
  return (
    <div
      className={`flex items-center gap-2.5 ${className}`}
      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
    >
      {/* Icon mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          flexShrink: 0,
          borderRadius: size * 0.28,
          boxShadow: '0 0 14px rgba(99,102,241,0.55)',
        }}
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="brainlo-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="brainlo-glyph" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#brainlo-bg)" />

        {/* Brain stylized glyph — B + neural nodes */}
        {/* Left vertical bar of B */}
        <rect x="10" y="10" width="4" height="20" rx="2" fill="url(#brainlo-glyph)" />

        {/* Top lobe of B */}
        <path
          d="M14 10 Q24 10 24 15.5 Q24 21 14 21"
          stroke="url(#brainlo-glyph)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Bottom lobe of B - slightly wider */}
        <path
          d="M14 21 Q26 21 26 26.5 Q26 32 14 32"
          stroke="url(#brainlo-glyph)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Neural dot top-right */}
        <circle cx="28" cy="11" r="2.5" fill="#a5b4fc" opacity="0.85" />
        {/* Neural dot mid-right */}
        <circle cx="31" cy="19" r="1.8" fill="#c4b5fd" opacity="0.7" />
        {/* Neural dot bottom-right */}
        <circle cx="28" cy="31" r="2" fill="#a5b4fc" opacity="0.6" />

        {/* Connecting lines */}
        <line x1="24" y1="13" x2="26.5" y2="11" stroke="#818cf8" strokeWidth="1" opacity="0.6" />
        <line x1="25" y1="19" x2="29.2" y2="19" stroke="#818cf8" strokeWidth="1" opacity="0.5" />
        <line x1="24" y1="29" x2="26.5" y2="31" stroke="#818cf8" strokeWidth="1" opacity="0.5" />
      </svg>

      {/* Text */}
      {showText && !collapsed && (
        <span
          style={{
            fontWeight: 700,
            fontSize: textSize,
            color: '#fff',
            letterSpacing: '-0.025em',
            lineHeight: 1,
          }}
        >
          Brainlo
        </span>
      )}

      {/* Collapsed state: show just initials */}
      {showText && collapsed && (
        <span
          style={{
            fontWeight: 800,
            fontSize: '11px',
            color: '#818cf8',
            width: '100%',
            textAlign: 'center',
          }}
        >
          BR
        </span>
      )}
    </div>
  )
}
