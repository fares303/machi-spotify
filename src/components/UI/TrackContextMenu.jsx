import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  HiHeart, HiDownload, HiPlus, HiShare,
  HiPlay, HiUserCircle
} from 'react-icons/hi'
import { usePlayerStore } from '../../store/playerStore'
import { downloadTrack } from '../../services/musicApi'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function TrackContextMenu({ track, x, y, onClose }) {
  const ref = useRef(null)
  const navigate = useNavigate()
  const {
    playlists, addToPlaylist, toggleFavorite, isFavorite, addToQueue
  } = usePlayerStore()
  const isFav = isFavorite(track.id)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const actions = [
    {
      icon: HiHeart,
      label: isFav ? 'Remove from Liked' : 'Add to Liked Songs',
      color: isFav ? 'text-accent' : undefined,
      action: () => { toggleFavorite(track); toast.success(isFav ? 'Removed from liked' : 'Added to liked'); onClose() }
    },
    {
      icon: HiPlay,
      label: 'Add to Queue',
      action: () => { addToQueue(track); toast.success('Added to queue'); onClose() }
    },
    {
      icon: HiDownload,
      label: 'Download MP3',
      action: () => {
        if (track.source === 'youtube') downloadTrack(track.sourceId, track.title)
        else if (track.streamUrl) { const a = document.createElement('a'); a.href = track.streamUrl; a.download = `${track.title}.mp3`; a.click() }
        onClose()
      }
    },
    {
      icon: HiShare,
      label: 'Share Song',
      action: () => {
        const url = `${window.location.origin}/search?q=${encodeURIComponent(track.title)}`
        navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'))
        onClose()
      }
    },
  ]

  // Adjust position to stay in viewport
  const menuWidth = 220
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 16)
  const adjustedY = Math.min(y, window.innerHeight - 300)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[100] glass-strong rounded-2xl p-2 shadow-2xl"
      style={{
        left: adjustedX,
        top: adjustedY,
        width: menuWidth,
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* Track info */}
      <div className="px-3 py-2 border-b border-white/5 mb-1">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-gray-500 truncate">{track.artist}</p>
      </div>

      {actions.map(({ icon: Icon, label, action, color }) => (
        <button
          key={label}
          onClick={action}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors ${color || 'text-gray-300 hover:text-white'}`}
        >
          <Icon className="text-base flex-shrink-0" />
          {label}
        </button>
      ))}

      {/* Add to playlist submenu */}
      {playlists.length > 0 && (
        <>
          <div className="border-t border-white/5 my-1" />
          <p className="px-3 py-1.5 text-xs text-gray-600 font-display uppercase tracking-wide">Add to playlist</p>
          {playlists.map(p => (
            <button
              key={p.id}
              onClick={() => { addToPlaylist(p.id, track); toast.success(`Added to ${p.name}`); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-5 h-5 rounded flex-shrink-0" style={{ background: p.coverColor }} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </>
      )}
    </motion.div>
  )
}
