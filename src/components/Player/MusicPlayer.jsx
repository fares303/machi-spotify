import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiPlay, HiPause, HiFastForward, HiRewind,
  HiVolumeUp, HiVolumeOff, HiHeart, HiDotsHorizontal,
  HiDownload, HiArrowsExpand, HiChevronDown, HiMenuAlt2
} from 'react-icons/hi'
import { MdShuffle, MdRepeat, MdRepeatOne, MdQueueMusic } from 'react-icons/md'
import { usePlayerStore } from '../../store/playerStore'
import AudioVisualizer from '../Visualizer/AudioVisualizer'
import LyricsPanel from '../Lyrics/LyricsPanel'
import AlbumArt3D from '../3D/AlbumArt3D'
import { downloadTrack } from '../../services/musicApi'
import { formatTime } from '../../utils/helpers'

export default function MusicPlayer({ analyserRef, seek, getAnalyserData, onInteract, fullscreen }) {
  const {
    currentTrack, isPlaying, volume, isMuted, progress, duration,
    isShuffled, repeatMode, showLyrics,
    togglePlay, setVolume, toggleMute, toggleShuffle, cycleRepeat,
    playNext, playPrev, toggleFullscreen, toggleLyrics, toggleMiniPlayer,
    isFavorite, toggleFavorite,
  } = usePlayerStore()

  const [showQueue, setShowQueue] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [localProgress, setLocalProgress] = useState(0)

  const displayProgress = isDragging ? localProgress : progress
  const progressPercent = duration > 0 ? (displayProgress / duration) * 100 : 0

  const handleProgressClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    const time = pct * duration
    seek(time)
  }, [duration, seek])

  const handleDownload = () => {
    if (!currentTrack) return
    if (currentTrack.source === 'youtube') {
      downloadTrack(currentTrack.sourceId, currentTrack.title)
    } else if (currentTrack.streamUrl) {
      const a = document.createElement('a')
      a.href = currentTrack.streamUrl
      a.download = `${currentTrack.title}.mp3`
      a.click()
    }
  }

  if (!currentTrack) return null

  const isFav = isFavorite(currentTrack.id)

  if (fullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{
          background: `radial-gradient(ellipse at center, rgba(13,255,176,0.05) 0%, #050508 70%)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white p-2">
            <HiChevronDown className="text-2xl" />
          </button>
          <span className="text-sm font-display text-gray-400">Now Playing</span>
          <button className="text-gray-400 hover:text-white p-2">
            <HiDotsHorizontal />
          </button>
        </div>

        <div className="flex-1 flex gap-8 px-12 pb-8 overflow-hidden">
          {/* Left: Album art + visualizer */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <AlbumArt3D
              cover={currentTrack.cover}
              isPlaying={isPlaying}
              size={320}
            />
            <AudioVisualizer
              analyserRef={analyserRef}
              getAnalyserData={getAnalyserData}
              isPlaying={isPlaying}
              width={320}
              height={80}
            />
          </div>

          {/* Right: Lyrics */}
          <div className="w-80 overflow-hidden">
            <LyricsPanel
              track={currentTrack}
              progress={progress}
              isPlaying={isPlaying}
            />
          </div>
        </div>

        {/* Controls */}
        <FullPlayerControls
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={displayProgress}
          duration={duration}
          progressPercent={progressPercent}
          volume={volume}
          isMuted={isMuted}
          isShuffled={isShuffled}
          repeatMode={repeatMode}
          isFav={isFav}
          onTogglePlay={() => { onInteract?.(); togglePlay() }}
          onPrev={playPrev}
          onNext={playNext}
          onSeek={handleProgressClick}
          onVolume={setVolume}
          onMute={toggleMute}
          onShuffle={toggleShuffle}
          onRepeat={cycleRepeat}
          onFavorite={() => toggleFavorite(currentTrack)}
          onDownload={handleDownload}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="h-20 glass border-t border-white/5 flex items-center px-4 gap-4 relative z-20 flex-shrink-0"
    >
      {/* Track info */}
      <div className="flex items-center gap-3 w-64 min-w-0">
        <div className="relative group cursor-pointer" onClick={toggleFullscreen}>
          <img
            src={currentTrack.cover || '/placeholder.jpg'}
            alt={currentTrack.title}
            className="w-12 h-12 rounded-lg object-cover"
            onError={e => e.target.src = 'https://placehold.co/48x48/0A0A12/0DFFB0?text=♫'}
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
              <div className="flex gap-0.5 items-end h-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate text-white">{currentTrack.title}</p>
          <p className="text-xs text-gray-500 truncate">{currentTrack.artist}</p>
        </div>
        <button
          onClick={() => toggleFavorite(currentTrack)}
          className={`flex-shrink-0 transition-colors ${isFav ? 'text-accent' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <HiHeart className={isFav ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Center controls */}
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`transition-colors text-lg ${isShuffled ? 'text-primary' : 'text-gray-600 hover:text-gray-300'}`}
          >
            <MdShuffle />
          </button>
          <button onClick={playPrev} className="text-gray-400 hover:text-white transition-colors text-xl">
            <HiRewind />
          </button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { onInteract?.(); togglePlay() }}
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-dark"
            style={{ boxShadow: '0 0 20px rgba(13,255,176,0.4)' }}
          >
            {isPlaying ? <HiPause className="text-lg" /> : <HiPlay className="text-lg" />}
          </motion.button>
          <button onClick={playNext} className="text-gray-400 hover:text-white transition-colors text-xl">
            <HiFastForward />
          </button>
          <button
            onClick={cycleRepeat}
            className={`transition-colors text-lg ${repeatMode !== 'none' ? 'text-primary' : 'text-gray-600 hover:text-gray-300'}`}
          >
            {repeatMode === 'one' ? <MdRepeatOne /> : <MdRepeat />}
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-gray-500 w-10 text-right">{formatTime(displayProgress)}</span>
          <div
            className="progress-bar flex-1"
            onClick={handleProgressClick}
          >
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 w-48 justify-end">
        <button onClick={toggleLyrics} className={`transition-colors text-sm ${showLyrics ? 'text-primary' : 'text-gray-600 hover:text-gray-400'}`}>
          <HiMenuAlt2 />
        </button>
        <button onClick={handleDownload} className="text-gray-600 hover:text-primary transition-colors">
          <HiDownload />
        </button>
        <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
          {isMuted || volume === 0 ? <HiVolumeOff /> : <HiVolumeUp />}
        </button>
        <input
          type="range"
          min="0" max="1" step="0.01"
          value={isMuted ? 0 : volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="w-20"
        />
        <button onClick={toggleFullscreen} className="text-gray-600 hover:text-white transition-colors">
          <HiArrowsExpand />
        </button>
        <button onClick={toggleMiniPlayer} className="text-gray-600 hover:text-white transition-colors text-xs">
          mini
        </button>
      </div>
    </motion.div>
  )
}

function FullPlayerControls({
  currentTrack, isPlaying, progress, duration, progressPercent,
  volume, isMuted, isShuffled, repeatMode, isFav,
  onTogglePlay, onPrev, onNext, onSeek, onVolume, onMute,
  onShuffle, onRepeat, onFavorite, onDownload
}) {
  return (
    <div className="px-12 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-display font-bold">{currentTrack.title}</h2>
          <p className="text-gray-400">{currentTrack.artist} • {currentTrack.album}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onFavorite} className={isFav ? 'text-accent' : 'text-gray-600 hover:text-white'}>
            <HiHeart className={`text-2xl ${isFav ? 'fill-current' : ''}`} />
          </button>
          <button onClick={onDownload} className="text-gray-600 hover:text-primary transition-colors">
            <HiDownload className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">{formatTime(progress)}</span>
        <div className="progress-bar flex-1" onClick={onSeek}>
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="text-sm text-gray-500">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8">
        <button onClick={onShuffle} className={`text-2xl ${isShuffled ? 'text-primary' : 'text-gray-600'}`}>
          <MdShuffle />
        </button>
        <button onClick={onPrev} className="text-gray-400 hover:text-white text-3xl">
          <HiRewind />
        </button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onTogglePlay}
          className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-dark"
          style={{ boxShadow: '0 0 30px rgba(13,255,176,0.5)' }}
        >
          {isPlaying ? <HiPause className="text-2xl" /> : <HiPlay className="text-2xl" />}
        </motion.button>
        <button onClick={onNext} className="text-gray-400 hover:text-white text-3xl">
          <HiFastForward />
        </button>
        <button onClick={onRepeat} className={`text-2xl ${repeatMode !== 'none' ? 'text-primary' : 'text-gray-600'}`}>
          {repeatMode === 'one' ? <MdRepeatOne /> : <MdRepeat />}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button onClick={onMute}>
          {isMuted ? <HiVolumeOff className="text-gray-400" /> : <HiVolumeUp className="text-gray-400" />}
        </button>
        <input
          type="range" min="0" max="1" step="0.01"
          value={isMuted ? 0 : volume}
          onChange={e => onVolume(parseFloat(e.target.value))}
          className="w-32"
        />
      </div>
    </div>
  )
}
