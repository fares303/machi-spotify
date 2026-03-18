import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiX, HiClock, HiSwitchHorizontal } from 'react-icons/hi'
import { usePlayerStore } from '../../store/playerStore'
import toast from 'react-hot-toast'

export default function SettingsModal({ onClose }) {
  const { setSleepTimer, crossfadeEnabled, crossfadeDuration } = usePlayerStore()
  const [sleepMins, setSleepMins] = useState(30)

  const handleSleepTimer = (mins) => {
    setSleepTimer(mins)
    toast.success(mins ? `Sleep timer set for ${mins} minutes` : 'Sleep timer cancelled')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass-strong rounded-3xl p-8 w-96"
        style={{ border: '1px solid rgba(13,255,176,0.15)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold">Player Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <HiX className="text-xl" />
          </button>
        </div>

        {/* Sleep Timer */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <HiClock className="text-primary" />
            <h3 className="font-display font-semibold">Sleep Timer</h3>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[15, 30, 45, 60].map(m => (
              <button
                key={m}
                onClick={() => setSleepMins(m)}
                className={`py-2 rounded-xl text-sm font-medium transition-all ${
                  sleepMins === m ? 'bg-primary text-dark font-bold' : 'glass text-gray-400 hover:text-white'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSleepTimer(sleepMins)}
              className="flex-1 btn-primary py-2 text-sm"
            >
              Set Timer ({sleepMins}m)
            </button>
            <button
              onClick={() => handleSleepTimer(null)}
              className="btn-ghost py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div>
          <h3 className="font-display font-semibold mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Space', 'Play / Pause'],
              ['→ / ←', 'Seek 10s forward / back'],
              ['Shift + → / ←', 'Next / Previous track'],
              ['↑ / ↓', 'Volume up / down'],
              ['M', 'Toggle mute'],
              ['S', 'Toggle shuffle'],
              ['R', 'Cycle repeat mode'],
            ].map(([key, desc]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-400">{desc}</span>
                <kbd className="glass px-2 py-0.5 rounded text-xs font-mono text-primary">{key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
