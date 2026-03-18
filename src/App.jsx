import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useKeyboard } from './hooks/useKeyboard'
import { useStore } from './store'
import Sidebar from './components/ui/Sidebar'
import BottomNav from './components/ui/BottomNav'
import TopBar from './components/ui/TopBar'
import Player from './components/player/Player'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import LibraryPage from './pages/LibraryPage'
import PlaylistPage from './pages/PlaylistPage'
import DiscoverPage from './pages/DiscoverPage'
import SettingsPage from './pages/SettingsPage'
import ImportPage from './pages/ImportPage'
import ArtistPage from './pages/ArtistPage'
import AlbumPage from './pages/AlbumPage'

export default function App() {
  const { audioRef, seek, getAnalyserData, initAC } = useAudioPlayer()
  const { currentTrack, isFullscreen } = useStore()
  const location = useLocation()
  useKeyboard(seek)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin' }}>
          <Routes location={location} key={location.pathname}>
            <Route path="/"              element={<HomePage />} />
            <Route path="/search"        element={<SearchPage />} />
            <Route path="/library"       element={<LibraryPage />} />
            <Route path="/playlist/:id"  element={<PlaylistPage />} />
            <Route path="/discover"      element={<DiscoverPage />} />
            <Route path="/settings"      element={<SettingsPage />} />
            <Route path="/import"        element={<ImportPage />} />
            <Route path="/artist/:id"    element={<ArtistPage />} />
            <Route path="/album/:id"     element={<AlbumPage />} />
          </Routes>
        </main>

        {/* ── Desktop Player bar ── */}
        {currentTrack && !isFullscreen && (
          <div className="hidden md:block flex-shrink-0">
            <Player seek={seek} getAnalyserData={getAnalyserData} onInteract={initAC} />
          </div>
        )}

        {/* ── Mobile: mini player + bottom nav stacked ── */}
        <div className="block md:hidden flex-shrink-0">
          {currentTrack && !isFullscreen && (
            <MobilePlayer seek={seek} onInteract={initAC} />
          )}
          <BottomNav />
        </div>
      </div>

      {/* Fullscreen player overlay */}
      <AnimatePresence>
        {isFullscreen && currentTrack && (
          <Player seek={seek} getAnalyserData={getAnalyserData} onInteract={initAC} />
        )}
      </AnimatePresence>
    </div>
  )
}

function MobilePlayer({ seek, onInteract }) {
  const {
    currentTrack, isPlaying, progress, duration, isBuffering,
    togglePlay, playNext, playPrev, toggleFullscreen, isFavorite, toggleFavorite,
  } = useStore()

  const pct = duration > 0 ? (progress / duration) * 100 : 0
  const isFav = isFavorite(currentTrack?.id)

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    seek(((e.clientX - rect.left) / rect.width) * duration)
  }

  if (!currentTrack) return null

  return (
    <motion.div
      initial={{ y: 80 }} animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="w-full"
      style={{ background: 'var(--color-surface-2)', borderTop: '1px solid var(--glass-border)' }}>

      {/* Progress bar — full width tap to seek */}
      <div className="h-1 w-full cursor-pointer" style={{ background: 'var(--glass-bg)' }} onClick={handleSeek}>
        <div className="h-full transition-none" style={{ width: `${pct}%`, background: 'var(--color-primary)' }} />
      </div>

      {/* Player row — perfectly centered */}
      <div className="flex items-center w-full px-3 py-2"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>

        {/* Album art — tap to open fullscreen */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer mr-3"
          onClick={toggleFullscreen}>
          <img src={currentTrack.cover} alt=""
            className="w-full h-full object-cover"
            onError={e => e.target.src = 'https://placehold.co/44x44/161622/0DFFB0?text=♫'} />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex gap-0.5 items-end h-3">
                {[0,1,2].map(i => <div key={i} className="waveform-bar w-0.5" style={{ animationDelay:`${i*0.15}s` }}/>)}
              </div>
            </div>
          )}
        </div>

        {/* Track info — fills space, tap to open fullscreen */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={toggleFullscreen}>
          <p className="text-sm font-semibold truncate leading-tight">{currentTrack.title}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>
            {currentTrack.artist}
          </p>
        </div>

        {/* Controls — right-aligned, equal spacing */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {/* Fav */}
          <button
            onClick={() => toggleFavorite(currentTrack)}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ color: isFav ? '#F87171' : 'var(--color-on-surface-muted)' }}>
            <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>

          {/* Prev */}
          <button onClick={playPrev} className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ color: 'var(--color-on-surface-muted)' }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </button>

          {/* Play / Pause — primary color, larger */}
          <button
            onClick={() => { onInteract?.(); togglePlay() }}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-surface)',
              boxShadow: '0 0 18px rgba(13,255,176,0.35)',
            }}>
            {isBuffering
              ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
              : isPlaying
                ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                : <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            }
          </button>

          {/* Next */}
          <button onClick={playNext} className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ color: 'var(--color-on-surface-muted)' }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
