import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
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

  if (!currentTrack) return null

  const handleSeekTouch = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left
    seek((x / rect.width) * duration)
  }

  return (
    <div style={{ background: 'var(--color-surface-2)', borderTop: '1px solid var(--glass-border)' }}>
      {/* Seekable progress strip */}
      <div
        style={{ height: 3, background: 'var(--glass-bg)', cursor: 'pointer' }}
        onClick={handleSeekTouch}
        onTouchEnd={handleSeekTouch}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-primary)', transition: 'width 0.1s linear' }} />
      </div>

      {/* Single centered row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        gap: 8,
      }}>
        {/* Art */}
        <div onClick={toggleFullscreen} style={{ position: 'relative', width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
          <img src={currentTrack.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => e.target.src='https://placehold.co/44x44/161622/0DFFB0?text=♫'} />
          {isPlaying && (
            <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <div style={{ display:'flex',gap:2,alignItems:'flex-end',height:12 }}>
                {[0,1,2].map(i=><div key={i} className="waveform-bar" style={{ width:3,animationDelay:`${i*0.15}s` }}/>)}
              </div>
            </div>
          )}
        </div>

        {/* Title — tappable to expand */}
        <div onClick={toggleFullscreen} style={{ flex:1, minWidth:0, cursor:'pointer' }}>
          <p style={{ fontSize:14,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.3 }}>{currentTrack.title}</p>
          <p style={{ fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--color-on-surface-muted)',marginTop:1 }}>{currentTrack.artist}</p>
        </div>

        {/* Prev */}
        <button onClick={playPrev} style={{ width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--color-on-surface-muted)',borderRadius:'50%',border:'none',background:'none',cursor:'pointer' }}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>

        {/* Play/Pause — center hero button */}
        <button onClick={()=>{ onInteract?.(); togglePlay() }}
          style={{ width:44,height:44,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
            background:'var(--color-primary)',color:'var(--color-surface)',border:'none',cursor:'pointer',
            boxShadow:'0 0 16px rgba(13,255,176,0.4)' }}>
          {isBuffering
            ? <div style={{ width:16,height:16,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>
            : isPlaying
              ? <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
              : <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{marginLeft:2}}><path d="M8 5v14l11-7z"/></svg>
          }
        </button>

        {/* Next */}
        <button onClick={playNext} style={{ width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--color-on-surface-muted)',borderRadius:'50%',border:'none',background:'none',cursor:'pointer' }}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>
        </button>

        {/* Fav */}
        <button onClick={()=>toggleFavorite(currentTrack)}
          style={{ width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'none',background:'none',cursor:'pointer',
            color: isFav ? '#F87171' : 'var(--color-on-surface-muted)' }}>
          <svg width="20" height="20" fill={isFav?'currentColor':'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
