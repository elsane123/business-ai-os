'use client'

export default function HeroOrb() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none', zIndex: 1
    }}>
      <div className="animate-spin-slow" style={{
        width: 580, height: 580, borderRadius: '50%',
        border: '1px solid rgba(99,102,241,0.1)',
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)'
      }} />
      <div className="animate-spin-reverse" style={{
        width: 420, height: 420, borderRadius: '50%',
        border: '1px solid rgba(139,92,246,0.14)',
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)'
      }} />
      <div className="animate-spin-slow" style={{
        width: 300, height: 300, borderRadius: '50%',
        border: '1px dashed rgba(99,102,241,0.08)',
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)'
      }} />
      <div className="animate-orb-pulse" style={{
        width: 210, height: 210, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #818cf8, #6366f1 40%, #4f46e5 65%, #3730a3)',
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        boxShadow: '0 0 60px 20px rgba(99,102,241,0.5), 0 0 120px 40px rgba(139,92,246,0.3), 0 0 220px 80px rgba(6,182,212,0.12)'
      }}>
        <div style={{
          position: 'absolute', top: '18%', left: '22%',
          width: '35%', height: '25%', borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)', filter: 'blur(8px)'
        }} />
      </div>
    </div>
  )
}
