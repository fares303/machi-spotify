import React from 'react'
import { motion } from 'framer-motion'
import { HiPlay, HiPause, HiFastForward, HiX } from 'react-icons/hi'
import { usePlayerStore } from '../../store/playerStore'

export default function MiniPlayer() {
  const { currentTrack, isPlaying, progress, duration, togglePlay, playNext, toggleMiniPlayer } = usePlayerStore()
  if (!currentTrack) return null

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-4 right-4 z-50 glass-strong rounded-2xl p-3 flex items-center gap-3 w-72"
      style={{ boxShadow: '0 0 30px rgba(13,255,176,0.15)' }}
    >
      <img
        src={currentTrack.cover}
        alt={currentTrack.title}
        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        onError={e => e.target.src = 'https://placehold.co/40x40/0A0A12/0DFFB0?text=♫'}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{currentTrack.title}</p>
        <p className="text-xs text-gray-500 truncate">{currentTrack.artist}</p>
        <div className="h-0.5 bg-white/10 rounded mt-1">
          <div className="h-full bg-primary rounded" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
        {isPlaying ? <HiPause /> : <HiPlay />}
      </button>
      <button onClick={playNext} className="text-gray-500 hover:text-white transition-colors">
        <HiFastForward />
      </button>
      <button onClick={toggleMiniPlayer} className="text-gray-600 hover:text-white transition-colors">
        <HiX className="text-sm" />
      </button>
    </motion.div>
  )
}
