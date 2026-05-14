'use client'

import { useEffect, useRef } from 'react'

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animId: number
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string
    }> = []
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#a78bfa']
    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    function spawn() {
      particles.push({
        x: Math.random() * canvas!.width,
        y: canvas!.height + 10,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(Math.random() * 0.8 + 0.3),
        size: Math.random() * 2.5 + 0.5,
        opacity: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      if (Math.random() < 0.15) spawn()
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy
        p.opacity = Math.min(1, p.opacity + 0.02)
        if (p.y < canvas!.height * 0.3) p.opacity -= 0.015
        if (p.opacity <= 0 || p.y < -20) { particles.splice(i, 1); continue }
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = p.color
        ctx!.globalAlpha = p.opacity * 0.7
        ctx!.fill()
        ctx!.globalAlpha = 1
      }
      animId = requestAnimationFrame(draw)
    }
    resize()
    window.addEventListener('resize', resize)
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0
      }}
    />
  )
}
