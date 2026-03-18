import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiPlay, HiPause, HiHeart, HiDotsHorizontal,
  HiDownload, HiPlus, HiClock
} from 'react-icons/hi'
import { usePlayerStore } from '../../store/playerStore'
import { downloadTrack } from '../../services/musicApi'
import { formatTime } from '../../utils/helpers'

export default function SongCard({ track, queue = [], index = 0, compact = false }) {
  const { currentTrack, isPlaying, setCurrentTrack, setQueue, isFavorite, toggleFavorite, playlists, addToPlaylist } = usePlayerStore()
  const [showMenu, setShowMenu] = useState(false)

  const isCurrentTrack = currentTrack?.id === track.id
  const isFav = isFavorite(track.id)

  const handlePlay = () => {
    if (isCurrentTrack) return
    if (queue.length > 0) {
      setQueue(queue, index)
    } else {
      setCurrentTrack(track)
    }
  }

  const handleDownload = (e) => {
    e.stopPropagation()
    if (track.source === 'youtube') {
      downloadTrack(track.sourceId, track.title)
    } else if (track.streamUrl) {
      const a = document.createElement('a')
      a.href = track.streamUrl
      a.download = `${track.title}.mp3`
      a.click()
    }
  }

  if (compact) {
    return (
      <motion.div
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        onClick={handlePlay}
        className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer group"
      >
        <div className="relative w-10 h-10 flex-shrink-0">
          <img
            src={track.cover}
            alt={track.title}
            className="w-10 h-10 rounded-lg object-cover"
            onError={e => e.target.src = 'https://placehold.co/40x40/0A0A12/0DFFB0?text=♫'}
          />
          {isCurrentTrack && isPlaying ? (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="flex gap-0.5 items-end h-3">
                {[1,2,3].map(i => (
                  <div key={i} className="waveform-bar w-0.5" style={{ animationDelay: `${i*0.1}s` }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <HiPlay className="text-white text-sm" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-primary' : 'text-white'}`}>
            {track.title}
          </p>
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
            {track.source === 'jiosaavn' && (
              <span className="flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: 'rgba(13,255,176,0.15)', color: '#0DFFB0' }}>FULL</span>
            )}
            {track.previewUrl && !track.streamUrl && track.source === 'deezer' && (
              <span className="flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: 'rgba(255,165,0,0.15)', color: '#FFA500' }}>30s</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); toggleFavorite(track) }}
            className={`${isFav ? 'text-accent' : 'text-gray-600'} hover:text-accent transition-colors`}>
            <HiHeart className={`text-sm ${isFav ? 'fill-current' : ''}`} />
          </button>
          <button onClick={handleDownload} className="text-gray-600 hover:text-primary transition-colors">
            <HiDownload className="text-sm" />
          </button>
        </div>
        {track.duration > 0 && (
          <span className="text-xs text-gray-600 w-10 text-right">{formatTime(track.duration)}</span>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(13,255,176,0.1)' }}
      onClick={handlePlay}
      className="card cursor-pointer group relative overflow-hidden"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-secondary/0 group-hover:from-primary/5 group-hover:to-secondary/5 transition-all duration-300 rounded-2xl" />

      <div className="relative">
        <div className="relative mb-3 overflow-hidden rounded-xl">
          <img
            src={track.cover}
            alt={track.title}
            className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
            onError={e => e.target.src = 'https://placehold.co/200x200/0A0A12/0DFFB0?text=♫'}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(13,255,176,0.5)' }}
            >
              {isCurrentTrack && isPlaying ? (
                <HiPause className="text-dark text-xl" />
              ) : (
                <HiPlay className="text-dark text-xl" />
              )}
            </motion.div>
          </div>
          {isCurrentTrack && (
            <div className="absolute top-2 right-2">
              <div className="flex gap-0.5 items-end h-4 bg-black/60 rounded px-1.5 py-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`waveform-bar ${isPlaying ? '' : 'animation-paused'}`}
                    style={{ animationDelay: `${i*0.1}s`, animationPlayState: isPlaying ? 'running' : 'paused' }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <h3 className={`font-display font-semibold text-sm truncate mb-0.5 ${isCurrentTrack ? 'text-primary' : 'text-white'}`}>
          {track.title}
        </h3>
        <div className="flex items-center gap-1.5"><p className="text-xs text-gray-500 truncate">{track.artist}</p>{track.source === "jiosaavn" && <span className="flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded" style={{background:"rgba(13,255,176,0.15)",color:"#0DFFB0"}}>FULL</span>}</div>

        <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); toggleFavorite(track) }}
            className={`${isFav ? 'text-accent' : 'text-gray-600'} hover:text-accent transition-colors`}
          >
            <HiHeart className={`text-sm ${isFav ? 'fill-current' : ''}`} />
          </button>
          <button onClick={handleDownload} className="text-gray-600 hover:text-primary transition-colors">
            <HiDownload className="text-sm" />
          </button>
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className="text-gray-600 hover:text-white transition-colors"
            >
              <HiDotsHorizontal className="text-sm" />
            </button>
            {showMenu && (
              <div className="absolute right-0 bottom-6 glass-strong rounded-xl p-2 w-40 z-10"
                onClick={e => e.stopPropagation()}
              >
                <p className="text-xs text-gray-500 px-2 py-1 font-display">Add to playlist</p>
                {playlists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { addToPlaylist(p.id, track); setShowMenu(false) }}
                    className="w-full text-left text-xs px-2 py-1.5 hover:bg-white/5 rounded-lg text-gray-300 hover:text-white transition-colors truncate"
                  >
                    {p.name}
                  </button>
                ))}
                {playlists.length === 0 && (
                  <p className="text-xs text-gray-600 px-2 py-1">No playlists yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
