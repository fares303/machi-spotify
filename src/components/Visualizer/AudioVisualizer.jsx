import React, { useEffect, useRef } from 'react'

export default function AudioVisualizer({ analyserRef, getAnalyserData, isPlaying, width = 300, height = 60 }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      const data = getAnalyserData?.()

      if (!data || !isPlaying) {
        // Draw idle waveform
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(13,255,176,0.3)'
        ctx.lineWidth = 2
        ctx.moveTo(0, height / 2)
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.05 + Date.now() * 0.001) * 4
          ctx.lineTo(x, y)
        }
        ctx.stroke()
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      const barWidth = (width / data.length) * 2.5
      let x = 0

      // Draw frequency bars
      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * height

        // Gradient per bar
        const gradient = ctx.createLinearGradient(x, height, x, height - barHeight)
        gradient.addColorStop(0, 'rgba(123,47,255,0.8)')
        gradient.addColorStop(0.5, 'rgba(13,255,176,0.9)')
        gradient.addColorStop(1, 'rgba(13,255,176,0.4)')

        ctx.fillStyle = gradient
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)

        // Mirror
        ctx.fillStyle = `rgba(13,255,176,0.15)`
        ctx.fillRect(x, 0, barWidth - 1, barHeight * 0.3)

        x += barWidth + 1
        if (x > width) break
      }

      // Glow effect
      ctx.shadowBlur = 15
      ctx.shadowColor = '#0DFFB0'

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
