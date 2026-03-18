import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function AlbumArt3D({ cover, isPlaying, size = 260 }) {
  const canvasRef = useRef(null)
  const rotationRef = useRef(0)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = cover || 'https://placehold.co/260x260/0A0A12/0DFFB0?text=♫'

    const draw = () => {
      ctx.clearRect(0, 0, size, size)

      const cx = size / 2
      const cy = size / 2
      const r = size / 2 - 8

      // Outer glow ring
      const outerGlow = ctx.createRadialGradient(cx, cy, r - 4, cx, cy, r + 8)
      outerGlow.addColorStop(0, 'rgba(13,255,176,0.3)')
      outerGlow.addColorStop(1, 'rgba(13,255,176,0)')
      ctx.fillStyle = outerGlow
      ctx.beginPath()
      ctx.arc(cx, cy, r + 8, 0, Math.PI * 2)
      ctx.fill()

      // Vinyl record look
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotationRef.current)

      // Draw vinyl grooves
      for (let i = 0; i < 12; i++) {
        const gr = r - 12 - i * 4
        ctx.beginPath()
        ctx.arc(0, 0, gr, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,0,0,${0.2 + i * 0.02})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.restore()

      // Album cover in center circle
      if (img.complete && img.naturalWidth > 0) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, r - 30, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, cx - (r - 30), cy - (r - 30), (r - 30) * 2, (r - 30) * 2)
        ctx.restore()
      } else {
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, r - 30, 0, Math.PI * 2)
        ctx.fillStyle = '#0A0A12'
        ctx.fill()
        ctx.restore()
      }

      // Center hole
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#050508'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(13,255,176,0.5)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      // Rotating shine effect
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotationRef.current * 0.5)
      const shine = ctx.createLinearGradient(-r, -r, r, r)
      shine.addColorStop(0, 'rgba(255,255,255,0)')
      shine.addColorStop(0.45, 'rgba(255,255,255,0)')
      shine.addColorStop(0.5, 'rgba(255,255,255,0.08)')
      shine.addColorStop(0.55, 'rgba(255,255,255,0)')
      shine.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = shine
      ctx.fill()
      ctx.restore()

      if (isPlaying) {
        rotationRef.current += 0.008
      }
      animRef.current = requestAnimationFrame(draw)
    }

    img.onload = () => {}
    draw()

    return () => cancelAnimationFrame(animRef.current)
  }, [cover, isPlaying, size])

  return (
    <motion.div
      animate={isPlaying ? {
        filter: ['drop-shadow(0 0 20px rgba(13,255,176,0.4))', 'drop-shadow(0 0 40px rgba(123,47,255,0.4))', 'drop-shadow(0 0 20px rgba(13,255,176,0.4))'],
      } : { filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ borderRadius: '50%' }}
      />
    </motion.div>
  )
}
