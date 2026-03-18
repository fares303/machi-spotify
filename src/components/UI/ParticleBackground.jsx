import React, { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + Math.random() * 100
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = -(Math.random() * 0.8 + 0.2)
        this.size = Math.random() * 2 + 0.5
        this.opacity = Math.random() * 0.4 + 0.1
        this.color = Math.random() > 0.5 ? '#0DFFB0' : '#7B2FFF'
        this.life = 0
        this.maxLife = Math.random() * 200 + 100
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.life++
        if (this.y < -10 || this.life > this.maxLife) this.reset()
      }
      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity * (1 - this.life / this.maxLife)
        ctx.fillStyle = this.color
        ctx.shadowBlur = 6
        ctx.shadowColor = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      const p = new Particle()
      p.y = Math.random() * canvas.height
      p.life = Math.random() * p.maxLife
      particles.push(p)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}
