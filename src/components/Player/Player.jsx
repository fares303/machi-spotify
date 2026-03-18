import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiPlay, HiPause, HiVolumeUp, HiVolumeOff, HiHeart,
  HiDownload, HiDotsHorizontal, HiChevronDown, HiChevronUp
} from 'react-icons/hi'
import { MdShuffle, MdRepeat, MdRepeatOne, MdSkipNext, MdSkipPrevious, MdEqualizer } from 'react-icons/md'
import { useStore } from '../../store'
import { downloadTrack } from '../../services/api'
import { fmt } from '../../utils/helpers'
import Visualizer from '../visualizer/Visualizer'
import LyricsPanel from '../lyrics/LyricsPanel'
import Equalizer from '../equalizer/Equalizer'

export default function Player({ seek, getAnalyserData, onInteract }) {
  const {
    currentTrack, isPlaying, progress, duration, buffered, isBuffering,
    volume, isMuted, isShuffled, repeatMode, showLyrics, isFullscreen, streamQuality,
    togglePlay, setVolume, toggleMute, toggleShuffle, cycleRepeat,
    playNext, playPrev, toggleLyrics, toggleFullscreen, isFavorite, toggleFavorite,
    setStreamQuality, showEqualizer, toggleEqualizer,
  } = useStore()

  const [showQueue, setShowQueue] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [localProg, setLocalProg] = useState(0)

  const displayProg = dragging ? localProg : progress
  const pct = duration > 0 ? (displayProg / duration) * 100 : 0
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0
  const isFav = isFavorite(currentTrack?.id)

  const handleSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const t = ((e.clientX - rect.left) / rect.width) * duration
    seek(t)
  }, [duration, seek])

  if (!currentTrack) return null

  const Controls = ({ big }) => (
    <div className={`flex items-center ${big ? 'gap-6' : 'gap-4'}`}>
      <button onClick={toggleShuffle} className="transition-colors" title="Shuffle (S)"
        style={{color:isShuffled?'var(--color-primary)':'var(--color-on-surface-muted)',fontSize:big?22:18}}>
        <MdShuffle/>
      </button>
      <button onClick={playPrev} className="hover:text-white transition-colors" title="Previous (Shift+←)"
        style={{color:'var(--color-on-surface)',fontSize:big?28:20}}>
        <MdSkipPrevious/>
      </button>
      <motion.button whileHover={{scale:1.08}} whileTap={{scale:0.93}}
        onClick={()=>{onInteract?.();togglePlay()}}
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          width:big?60:40,height:big?60:40,
          background:'var(--color-primary)',
          color:'var(--color-surface)',
          boxShadow:'0 0 25px color-mix(in srgb, var(--color-primary) 45%, transparent)',
          fontSize:big?26:18,
        }}>
        {isBuffering ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/>
          : isPlaying ? <HiPause/> : <HiPlay/>}
      </motion.button>
      <button onClick={playNext} className="hover:text-white transition-colors" title="Next (Shift+→)"
        style={{color:'var(--color-on-surface)',fontSize:big?28:20}}>
        <MdSkipNext/>
      </button>
      <button onClick={cycleRepeat} className="transition-colors" title="Repeat (R)"
        style={{color:repeatMode!=='none'?'var(--color-primary)':'var(--color-on-surface-muted)',fontSize:big?22:18}}>
        {repeatMode==='one'?<MdRepeatOne/>:<MdRepeat/>}
      </button>
    </div>
  )

  /* ── Fullscreen / expanded player ────────────────────────────────────────── */
  if (isFullscreen) return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex flex-col"
      style={{background:'var(--color-surface)',backdropFilter:'blur(30px)'}}>

      {/* Bg blur from cover */}
      <div className="absolute inset-0 opacity-20 bg-center bg-cover blur-3xl scale-110"
        style={{backgroundImage:`url(${currentTrack.cover})`}}/>

      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <button onClick={toggleFullscreen} style={{color:'var(--color-on-surface-muted)'}} className="hover:text-white transition-colors"><HiChevronDown className="text-2xl"/></button>
          <p className="text-sm font-semibold" style={{color:'var(--color-on-surface-muted)'}}>Now Playing</p>
          <button style={{color:'var(--color-on-surface-muted)'}} className="hover:text-white transition-colors"><HiDotsHorizontal/></button>
        </div>

        {/* 
          Mobile: single column, everything centered
          Desktop: two columns (art+controls | lyrics)
        */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 px-4 md:px-8 pb-4 overflow-y-auto overflow-x-hidden">

          {/* Art + controls — full width on mobile, flex-1 on desktop */}
          <div className="flex flex-col items-center justify-center gap-4 md:gap-6 w-full md:flex-1 md:min-w-0 py-2">

            {/* Rotating album art — responsive size */}
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="rounded-full overflow-hidden shadow-2xl flex-shrink-0"
              style={{
                width:  'min(220px, 55vw)',
                height: 'min(220px, 55vw)',
                boxShadow: '0 0 60px color-mix(in srgb, var(--color-primary) 25%, transparent)',
              }}>
              <img src={currentTrack.cover} alt="" className="w-full h-full object-cover"
                onError={e => e.target.src='https://placehold.co/220x220/161622/0DFFB0?text=♫'}/>
            </motion.div>

            {/* Visualizer */}
            <div className="w-full max-w-xs">
              <Visualizer getAnalyserData={getAnalyserData} isPlaying={isPlaying} width={260} height={44}/>
            </div>

            {/* Track info */}
            <div className="w-full max-w-xs text-center px-2">
              <h2 className="font-display font-bold text-xl sm:text-2xl truncate mb-0.5">{currentTrack.title}</h2>
              <p className="text-sm truncate" style={{ color: 'var(--color-on-surface-muted)' }}>{currentTrack.artist}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs flex items-center gap-3">
              <span className="text-xs w-9 text-right tabular-nums" style={{ color: 'var(--color-on-surface-muted)' }}>{fmt(displayProg)}</span>
              <div className="flex-1 progress-bar" onClick={handleSeek}>
                <div className="absolute inset-0 rounded" style={{ background: 'var(--glass-border)' }}/>
                <div className="absolute left-0 top-0 h-full rounded opacity-30" style={{ width: `${bufPct}%`, background: 'var(--color-on-surface-muted)' }}/>
                <div className="progress-fill" style={{ width: `${pct}%` }}/>
              </div>
              <span className="text-xs w-9 tabular-nums" style={{ color: 'var(--color-on-surface-muted)' }}>{fmt(duration)}</span>
            </div>

            {/* Playback controls */}
            <Controls big/>

            {/* Volume + action buttons */}
            <div className="flex items-center gap-4 sm:gap-5 flex-wrap justify-center">
              <button onClick={() => toggleFavorite(currentTrack)}
                style={{ color: isFav ? '#F87171' : 'var(--color-on-surface-muted)' }}>
                <HiHeart className={`text-xl ${isFav ? 'fill-current' : ''}`}/>
              </button>
              <button onClick={toggleMute} className="hover:text-white transition-colors"
                style={{ color: 'var(--color-on-surface-muted)' }}>
                {isMuted ? <HiVolumeOff className="text-xl"/> : <HiVolumeUp className="text-xl"/>}
              </button>
              <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
                onChange={e => setVolume(Number(e.target.value))} style={{ width: 80 }}/>
              <button onClick={() => downloadTrack(currentTrack)} className="hover:text-white transition-colors"
                style={{ color: 'var(--color-on-surface-muted)' }}>
                <HiDownload className="text-xl"/>
              </button>
              <button onClick={toggleEqualizer}
                style={{ color: showEqualizer ? 'var(--color-primary)' : 'var(--color-on-surface-muted)' }}>
                <MdEqualizer className="text-xl"/>
              </button>
            </div>
          </div>

          {/* Lyrics — hidden on mobile by default, full width on desktop */}
          <div className="hidden md:flex w-80 flex-col rounded-2xl overflow-hidden flex-shrink-0"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <LyricsPanel track={currentTrack} progress={progress}/>
          </div>
        </div>
      </div>

      <AnimatePresence>{showEqualizer && <Equalizer onClose={toggleEqualizer}/>}</AnimatePresence>
    </motion.div>
  )

  /* ── Bottom bar (mini player) ─────────────────────────────────────────────── */
  return (
    <motion.div initial={{y:80}} animate={{y:0}}
      className="flex-shrink-0 z-20 relative"
      style={{background:'var(--player-bg)',borderTop:'1px solid var(--glass-border)',backdropFilter:'blur(30px)'}}>
      <div className="flex items-center gap-4 px-4 h-20">

        {/* Track info */}
        <div className="flex items-center gap-3 w-56 min-w-0 cursor-pointer" onClick={toggleFullscreen}>
          <div className="relative flex-shrink-0">
            <img src={currentTrack.cover} alt="" className="w-12 h-12 rounded-xl object-cover"
              onError={e=>e.target.src='https://placehold.co/48x48/161622/0DFFB0?text=♫'}/>
            {isPlaying && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <div className="waveform">{[0,1,2,3].map(i=><div key={i} className="waveform-bar w-0.5" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
            </div>}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
            <p className="text-xs truncate" style={{color:'var(--color-on-surface-muted)'}}>{currentTrack.artist}</p>
          </div>
          <button onClick={e=>{e.stopPropagation();toggleFavorite(currentTrack)}} className="flex-shrink-0 ml-1" style={{color:isFav?'#F87171':'var(--color-on-surface-muted)'}}>
            <HiHeart className={`text-base ${isFav?'fill-current':''}`}/>
          </button>
        </div>

        {/* Center: controls + progress */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <Controls/>
          <div className="flex items-center gap-2.5 w-full max-w-lg">
            <span className="text-xs w-8 text-right" style={{color:'var(--color-on-surface-muted)'}}>{fmt(displayProg)}</span>
            <div className="flex-1 progress-bar relative" onClick={handleSeek}>
              <div className="absolute left-0 top-0 h-full rounded opacity-25"
                style={{width:`${bufPct}%`,background:'var(--color-on-surface-muted)'}}/>
              <div className="progress-fill" style={{width:`${pct}%`}}/>
            </div>
            <span className="text-xs w-8" style={{color:'var(--color-on-surface-muted)'}}>{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: volume + actions */}
        <div className="flex items-center gap-2 w-52 justify-end">
          <button onClick={toggleLyrics} title="Lyrics" className="hover:text-white transition-colors"
            style={{color:showLyrics?'var(--color-primary)':'var(--color-on-surface-muted)',fontSize:16}}>
            <span className="text-sm font-bold">LRC</span>
          </button>
          <button onClick={toggleEqualizer} className="hover:text-white transition-colors"
            style={{color:showEqualizer?'var(--color-primary)':'var(--color-on-surface-muted)',fontSize:18}}>
            <MdEqualizer/>
          </button>
          {/* Quality selector */}
          <select value={streamQuality} onChange={e=>setStreamQuality(e.target.value)}
            className="text-xs px-1 py-0.5 rounded cursor-pointer outline-none"
            style={{background:'var(--color-surface-2)',color:'var(--color-on-surface-muted)',border:'1px solid var(--glass-border)',fontSize:11}}>
            <option value="high">HQ</option>
            <option value="medium">MQ</option>
            <option value="low">LQ</option>
          </select>
          <button onClick={toggleMute} className="hover:text-white transition-colors" style={{color:'var(--color-on-surface-muted)'}}>
            {isMuted?<HiVolumeOff className="text-base"/>:<HiVolumeUp className="text-base"/>}
          </button>
          <input type="range" min={0} max={1} step={0.01} value={isMuted?0:volume} onChange={e=>setVolume(Number(e.target.value))} style={{width:70}}/>
          <button onClick={toggleFullscreen} className="hover:text-white transition-colors" style={{color:'var(--color-on-surface-muted)'}}><HiChevronUp className="text-base"/></button>
        </div>
      </div>

      <AnimatePresence>{showEqualizer && <Equalizer onClose={toggleEqualizer}/>}</AnimatePresence>
    </motion.div>
  )
}
