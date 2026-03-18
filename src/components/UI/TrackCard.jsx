import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiPlay, HiPause, HiHeart, HiDotsVertical, HiDownload, HiPlus, HiViewList } from 'react-icons/hi'
import { MdPlaylistAdd } from 'react-icons/md'
import { useStore } from '../../store'
import { downloadTrack } from '../../services/api'
import { fmt } from '../../utils/helpers'

export default function TrackCard({ track, queue = [], index = 0, compact = false }) {
  const {
    currentTrack, isPlaying, setCurrentTrack, setQueue,
    isFavorite, toggleFavorite, playlists, addToPlaylist, addToQueue, addNextInQueue,
  } = useStore()
  const [menu, setMenu] = useState(false)
  const isCurrent = currentTrack?.id === track.id
  const isFav = isFavorite(track.id)

  const play = () => {
    if (queue.length > 0) setQueue(queue, index)
    else setCurrentTrack(track)
  }

  // ── Compact (list) mode ───────────────────────────────────────────────────
  if (compact) return (
    <div
      className="flex items-center gap-3 px-3 py-3 cursor-pointer group transition-colors active:opacity-70"
      style={{ minHeight: '56px' }}
      onClick={play}
    >
      <div className="relative w-10 h-10 flex-shrink-0">
        <img src={track.cover} alt="" className="w-10 h-10 rounded-lg object-cover"
          onError={e => e.target.src = 'https://placehold.co/40x40/161622/0DFFB0?text=♫'} />
        {isCurrent && isPlaying && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <div className="waveform">{[0,1,2].map(i => <div key={i} className="waveform-bar w-0.5" style={{ animationDelay: `${i*0.15}s` }}/>)}</div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate leading-tight ${isCurrent ? 'neon-text' : ''}`}>{track.title}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>{track.artist}</p>
      </div>

      {/* Always visible fav button — important for mobile */}
      <button
        onClick={e => { e.stopPropagation(); toggleFavorite(track) }}
        className="p-2 flex-shrink-0 transition-colors active:scale-90"
        style={{ color: isFav ? '#F87171' : 'var(--color-on-surface-muted)' }}>
        <HiHeart className={`text-base ${isFav ? 'fill-current' : ''}`} />
      </button>

      {track.duration > 0 && (
        <span className="text-xs flex-shrink-0 hidden sm:block" style={{ color: 'var(--color-on-surface-muted)' }}>
          {fmt(track.duration)}
        </span>
      )}
    </div>
  )

  // ── Card (grid) mode ──────────────────────────────────────────────────────
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className="card p-2.5 sm:p-3 cursor-pointer group relative"
      onClick={play}>

      <div className="relative mb-2.5 rounded-xl overflow-hidden aspect-square">
        <img src={track.cover} alt={track.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => e.target.src = 'https://placehold.co/200x200/161622/0DFFB0?text=♫'} />

        {/* Play overlay — visible on hover (desktop) and always shows on current */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-primary)', boxShadow: '0 0 20px color-mix(in srgb, var(--color-primary) 50%, transparent)' }}>
            {isCurrent && isPlaying
              ? <HiPause style={{ color: 'var(--color-surface)', fontSize: 18 }} />
              : <HiPlay style={{ color: 'var(--color-surface)', fontSize: 18, marginLeft: 2 }} />
            }
          </motion.div>
        </div>

        {/* Waveform for current */}
        {isCurrent && (
          <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-1.5 py-1 flex gap-0.5 items-end">
            {[0,1,2,3].map(i => (
              <div key={i} className="waveform-bar w-0.5"
                style={{ animationDelay: `${i*0.15}s`, animationPlayState: isPlaying ? 'running' : 'paused' }}/>
            ))}
          </div>
        )}
      </div>

      <p className={`font-semibold text-xs sm:text-sm truncate mb-0.5 leading-tight ${isCurrent ? 'neon-text' : ''}`}>
        {track.title}
      </p>
      <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-muted)' }}>{track.artist}</p>

      {/* Bottom actions — shown on hover desktop, always mobile */}
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={e => { e.stopPropagation(); toggleFavorite(track) }}
          className="p-1 transition-colors active:scale-90"
          style={{ color: isFav ? '#F87171' : 'var(--color-on-surface-muted)' }}>
          <HiHeart className={`text-sm ${isFav ? 'fill-current' : ''}`} />
        </button>

        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenu(!menu) }}
            className="p-1 transition-colors active:scale-90"
            style={{ color: 'var(--color-on-surface-muted)' }}>
            <HiDotsVertical className="text-sm" />
          </button>
          <AnimatePresence>
            {menu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="absolute right-0 bottom-8 z-50 w-44 rounded-xl p-1.5 shadow-2xl"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--glass-border)' }}>
                <MenuItem icon={HiViewList} label="Play Next" onClick={() => { addNextInQueue(track); setMenu(false) }} />
                <MenuItem icon={MdPlaylistAdd} label="Add to Queue" onClick={() => { addToQueue(track); setMenu(false) }} />
                <MenuItem icon={HiHeart} label={isFav ? 'Remove Fav' : 'Add to Fav'} onClick={() => { toggleFavorite(track); setMenu(false) }} />
                <MenuItem icon={HiDownload} label="Download" onClick={() => { downloadTrack(track); setMenu(false) }} />
                {playlists.length > 0 && <>
                  <div className="border-t my-1" style={{ borderColor: 'var(--glass-border)' }} />
                  <p className="text-xs px-2 py-1" style={{ color: 'var(--color-on-surface-muted)' }}>Add to playlist</p>
                  {playlists.slice(0, 4).map(p => (
                    <MenuItem key={p.id} icon={HiPlus} label={p.name} onClick={() => { addToPlaylist(p.id, track); setMenu(false) }} />
                  ))}
                </>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-xs text-left active:opacity-70 transition-colors"
      style={{ color: 'var(--color-on-surface-muted)', minHeight: '40px' }}>
      <Icon className="text-sm flex-shrink-0" /> {label}
    </button>
  )
}
