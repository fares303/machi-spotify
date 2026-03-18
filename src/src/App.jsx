import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useKeyboard } from './hooks/useKeyboard'
import { useStore } from './store'
import Sidebar from './components/UI/Sidebar'
import TopBar from './components/UI/TopBar'
import Player from './components/Player/Player'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import LibraryPage from './pages/LibraryPage'
import PlaylistPage from './pages/PlaylistPage'
import DiscoverPage from './pages/DiscoverPage'
import SettingsPage from './pages/SettingsPage'
import ImportPage from './pages/ImportPage'

export default function App() {
  const { audioRef, seek, getAnalyserData, initAC } = useAudioPlayer()
  const { currentTrack, isFullscreen } = useStore()
  useKeyboard(seek)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      {/* Hidden audio element */}
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin' }}>
          <Routes>
            <Route path="/"             element={<HomePage />} />
            <Route path="/search"       element={<SearchPage />} />
            <Route path="/library"      element={<LibraryPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/discover"     element={<DiscoverPage />} />
            <Route path="/settings"     element={<SettingsPage />} />
            <Route path="/import"       element={<ImportPage />} />
          </Routes>
        </main>

        {/* Bottom player bar (hidden when fullscreen) */}
        {currentTrack && !isFullscreen && (
          <Player seek={seek} getAnalyserData={getAnalyserData} onInteract={initAC} />
        )}
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && currentTrack && (
          <Player seek={seek} getAnalyserData={getAnalyserData} onInteract={initAC} />
        )}
      </AnimatePresence>
    </div>
  )
}
