import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Brainlo — L\'OS IA pour solopreneurs et PME'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a14',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow background */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Logo + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            🧠
          </div>
          <span style={{ fontWeight: 800, fontSize: 42, color: '#ffffff', letterSpacing: '-1px' }}>
            Brainlo
          </span>
        </div>
        {/* Headline */}
        <div
          style={{
            fontWeight: 800,
            fontSize: 56,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: 900,
          }}
        >
          Ton équipe dirigeante IA
        </div>
        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: '#818cf8',
            textAlign: 'center',
            marginBottom: 40,
            fontWeight: 600,
          }}
        >
          CFO · CMO · CRO — à 29€/mois
        </div>
        {/* Pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['Daily Focus IA', 'Trésorerie temps réel', 'Pipeline intelligent'].map((label) => (
            <div
              key={label}
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.4)',
                borderRadius: 999,
                padding: '10px 24px',
                fontSize: 18,
                color: '#a5b4fc',
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 18,
            color: '#475569',
            fontWeight: 500,
          }}
        >
          brainlo.ai
        </div>
      </div>
    ),
    { ...size }
  )
}
