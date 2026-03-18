import React, { useEffect, useRef } from 'react'

export default function Visualizer({ getAnalyserData, isPlaying, width=300, height=60, style='bars' }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const data = getAnalyserData?.()

      if (!data || !isPlaying) {
        // Idle sine wave
        ctx.beginPath()
        ctx.strokeStyle = 'var(--color-primary)'
        ctx.globalAlpha = 0.3
        ctx.lineWidth = 2
        ctx.moveTo(0, height/2)
        const t = Date.now() * 0.002
        for (let x = 0; x < width; x++) {
          ctx.lineTo(x, height/2 + Math.sin(x*0.04+t)*4)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      if (style === 'bars') {
        const barW = Math.ceil(width / (data.length * 0.6))
        const gap  = 1
        let x = 0
        for (let i = 0; i < data.length; i++) {
          const bh = (data[i] / 255) * height
          const g  = ctx.createLinearGradient(x, height, x, height - bh)
          g.addColorStop(0, 'var(--color-secondary)')
          g.addColorStop(1, 'var(--color-primary)')
          ctx.fillStyle = g
          ctx.fillRect(x, height - bh, barW - gap, bh)
          x += barW
          if (x > width) break
        }
      } else if (style === 'wave') {
        ctx.beginPath()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'var(--color-primary)'
        const slice = width / data.length
        for (let i = 0; i < data.length; i++) {
          const y = (data[i] / 255) * height
          i === 0 ? ctx.moveTo(i * slice, y) : ctx.lineTo(i * slice, y)
        }
        ctx.stroke()
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, style, width, height])

  return <canvas ref={canvasRef} width={width} height={height} className="rounded-lg" />
}
