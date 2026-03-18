import React, { useEffect, useRef } from 'react'

// Hardcoded hex colors per theme — Canvas API CANNOT use CSS variables or color-mix()
const THEME_COLORS = {
  dark:   { primary: '#0DFFB0', secondary: '#7B2FFF' },
  amoled: { primary: '#00FF88', secondary: '#9333EA' },
  light:  { primary: '#059669', secondary: '#6D28D9' },
  ocean:  { primary: '#38BDF8', secondary: '#818CF8' },
  rose:   { primary: '#FB7185', secondary: '#A855F7' },
}

const getColors = () => {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark'
  return THEME_COLORS[theme] || THEME_COLORS.dark
}

export default function Visualizer({ getAnalyserData, isPlaying, width = 300, height = 60, style = 'bars' }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const { primary, secondary } = getColors()
      const data = getAnalyserData?.()

      if (!data || !isPlaying) {
        // Idle sine wave
        ctx.beginPath()
        ctx.strokeStyle = primary
        ctx.globalAlpha = 0.35
        ctx.lineWidth = 2
        ctx.moveTo(0, height / 2)
        const t = Date.now() * 0.002
        for (let x = 0; x < width; x++) {
          ctx.lineTo(x, height / 2 + Math.sin(x * 0.04 + t) * 5)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      if (style === 'bars') {
        const barCount = Math.min(data.length, 60)
        const barW = Math.max(2, Math.floor(width / barCount) - 1)
        let x = 0
        for (let i = 0; i < barCount; i++) {
          const bh = Math.max(2, (data[i] / 255) * height)
          // Use hex strings directly — never CSS variables
          const grad = ctx.createLinearGradient(x, height, x, height - bh)
          grad.addColorStop(0, secondary)
          grad.addColorStop(1, primary)
          ctx.fillStyle = grad
          ctx.fillRect(x, height - bh, barW, bh)
          x += barW + 1
          if (x >= width) break
        }
      } else if (style === 'wave') {
        ctx.beginPath()
        ctx.lineWidth = 2
        ctx.strokeStyle = primary
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
    return () => {
      cancelAnimationFrame(rafRef.current)
      try { ctx.clearRect(0, 0, width, height) } catch {}
    }
  }, [isPlaying, style, width, height, getAnalyserData])

  return <canvas ref={canvasRef} width={width} height={height} className="rounded-lg" />
}
