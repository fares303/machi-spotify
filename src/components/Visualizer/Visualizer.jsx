import React, { useEffect, useRef } from 'react'

// Hardcoded hex fallbacks per theme — Canvas API cannot parse CSS variables or color-mix()
const THEME_COLORS = {
  dark:   { primary: '#0DFFB0', secondary: '#7B2FFF', accent: '#FF2D78' },
  amoled: { primary: '#00FF88', secondary: '#9333EA', accent: '#F43F5E' },
  light:  { primary: '#059669', secondary: '#6D28D9', accent: '#DC2626' },
  ocean:  { primary: '#38BDF8', secondary: '#818CF8', accent: '#F472B6' },
  rose:   { primary: '#FB7185', secondary: '#A855F7', accent: '#FBBF24' },
}

// Read computed CSS variable — strip whitespace, validate it's a real hex/rgb color
const readCSSVar = (name, fallback) => {
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    // Only accept if it looks like a real color (hex, rgb, hsl)
    if (val && (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl'))) {
      return val
    }
  } catch {}
  return fallback
}

const getColors = () => {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark'
  const defaults = THEME_COLORS[theme] || THEME_COLORS.dark
  return {
    primary:   readCSSVar('--color-primary',   defaults.primary),
    secondary: readCSSVar('--color-secondary', defaults.secondary),
  }
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
        const barCount = Math.min(data.length, 64)
        const barW = Math.max(2, Math.floor(width / barCount) - 1)
        let x = 0
        for (let i = 0; i < barCount; i++) {
          const bh = Math.max(2, (data[i] / 255) * height)
          const g = ctx.createLinearGradient(x, height, x, height - bh)
          g.addColorStop(0, secondary)
          g.addColorStop(1, primary)
          ctx.fillStyle = g
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
