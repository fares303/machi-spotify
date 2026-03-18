import React from 'react'
import { motion } from 'framer-motion'
import { HiX } from 'react-icons/hi'
import { useStore } from '../../store'
import { EQ_PRESETS } from '../../utils/helpers'

const FREQS = ['32','64','125','250','500','1K','2K','4K','8K','16K']

export default function Equalizer({ onClose }) {
  const {
    equalizerBands, equalizerEnabled, equalizerPreset,
    setEqualizerBand, setEqualizerPreset, toggleEqualizerEnabled
  } = useStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[500px] max-w-[95vw] rounded-2xl p-5 shadow-2xl"
      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--glass-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold">Equalizer</span>
          <button
            onClick={toggleEqualizerEnabled}
            className="px-3 py-0.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: equalizerEnabled ? 'var(--color-primary)' : 'var(--glass-bg)',
              color: equalizerEnabled ? 'var(--color-surface)' : 'var(--color-on-surface-muted)',
              border: `1px solid ${equalizerEnabled ? 'var(--color-primary)' : 'var(--glass-border)'}`,
            }}
          >
            {equalizerEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <button onClick={onClose} className="hover:text-white transition-colors" style={{ color: 'var(--color-on-surface-muted)' }}>
          <HiX />
        </button>
      </div>

      {/* Presets */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {EQ_PRESETS.map(p => (
          <button
            key={p}
            onClick={() => setEqualizerPreset(p)}
            className="px-2.5 py-1 rounded-full text-xs capitalize transition-all"
            style={{
              background: equalizerPreset === p ? 'var(--color-primary)' : 'var(--glass-bg)',
              color: equalizerPreset === p ? 'var(--color-surface)' : 'var(--color-on-surface-muted)',
              border: `1px solid ${equalizerPreset === p ? 'var(--color-primary)' : 'var(--glass-border)'}`,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Band sliders - horizontal layout with rotated sliders */}
      <div className="flex gap-1 items-end justify-between px-1">
        {FREQS.map((freq, i) => {
          const val = equalizerBands[i] || 0
          const pct = ((val + 12) / 24) * 100
          return (
            <div key={i} className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
              {/* dB value */}
              <span className="text-[10px] font-mono tabular-nums" style={{
                color: val > 0 ? 'var(--color-primary)' : val < 0 ? 'var(--color-accent)' : 'var(--color-on-surface-muted)'
              }}>
                {val > 0 ? '+' : ''}{val}
              </span>

              {/* Vertical slider via CSS rotation */}
              <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={val}
                  onChange={e => setEqualizerBand(i, Number(e.target.value))}
                  style={{
                    width: 90,
                    height: 4,
                    transform: 'rotate(-90deg)',
                    cursor: 'pointer',
                    accentColor: 'var(--color-primary)',
                  }}
                />
              </div>

              {/* Frequency label */}
              <span className="text-[10px]" style={{ color: 'var(--color-on-surface-muted)' }}>{freq}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
