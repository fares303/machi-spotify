import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLyrics, parseLRC } from '../../services/api'

export default function LyricsPanel({ track, progress }) {
  const [lyrics, setLyrics]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode]       = useState('scroll') // scroll | karaoke
  const [activeIdx, setActive]= useState(0)
  const [syncedLines, setSynced] = useState(null)
  const containerRef = useRef(null)
  const activeRef    = useRef(null)
  const lastId       = useRef(null)

  useEffect(() => {
    if (!track || lastId.current === track.id) return
    lastId.current = track.id
    setLoading(true); setLyrics(null); setSynced(null); setActive(0)

    getLyrics(track.artist || '', track.title || '')
      .then(data => {
        setLyrics(data)
        if (data?.syncedLrc) setSynced(parseLRC(data.syncedLrc))
      })
      .catch(() => setLyrics(null))
      .finally(() => setLoading(false))
  }, [track?.id])

  // Advance synced line
  useEffect(() => {
    if (syncedLines?.length > 0) {
      let idx = 0
      for (let i = 0; i < syncedLines.length; i++) {
        if (syncedLines[i].time <= progress + 0.5) idx = i
      }
      setActive(idx)
    } else if (lyrics?.lines?.length > 0 && track?.duration) {
      const idx = Math.floor((progress / (track.duration || 200)) * lyrics.lines.length)
      setActive(Math.min(idx, lyrics.lines.length - 1))
    }
  }, [progress, syncedLines, lyrics, track?.duration])

  // Scroll active line
  useEffect(() => {
    if (activeRef.current && mode === 'scroll') {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIdx, mode])

  const lines = syncedLines ? syncedLines.map(l=>l.text) : (lyrics?.lines || [])

  if (loading) return (
    <div className="h-full p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold" style={{color:'var(--color-on-surface-muted)'}}>Lyrics</span>
        <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:'var(--color-primary)'}}/>
      </div>
      {Array(10).fill(0).map((_,i)=><div key={i} className={`h-4 shimmer rounded ${[0,3,6,9].includes(i)?'w-1/2':'w-full'}`}/>)}
    </div>
  )

  if (!lyrics && !loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-4xl">🎵</span>
      <p className="font-semibold text-sm">No lyrics found</p>
      <p className="text-xs" style={{color:'var(--color-on-surface-muted)'}}>for "{track?.title}"</p>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 border-b" style={{borderColor:'var(--glass-border)'}}>
        <div>
          <span className="text-sm font-semibold">Lyrics</span>
          {lyrics?.source && <span className="text-xs ml-2" style={{color:'var(--color-on-surface-muted)'}}>{lyrics.source}</span>}
          {syncedLines && <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded-full" style={{background:'color-mix(in srgb, var(--color-primary) 15%, transparent)',color:'var(--color-primary)'}}>Synced</span>}
        </div>
        <div className="flex gap-1">
          {['scroll','karaoke'].map(m=>(
            <button key={m} onClick={()=>setMode(m)} className="px-2.5 py-1 rounded-full text-xs capitalize transition-all"
              style={{background:mode===m?'color-mix(in srgb, var(--color-primary) 15%, transparent)':'transparent',
                      color:mode===m?'var(--color-primary)':'var(--color-on-surface-muted)',
                      border:`1px solid ${mode===m?'color-mix(in srgb, var(--color-primary) 30%, transparent)':'transparent'}`}}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Karaoke mode */}
      {mode === 'karaoke' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 overflow-hidden">
          {activeIdx > 0 && lines[activeIdx-1] && (
            <p className="text-sm text-center opacity-30">{lines[activeIdx-1]}</p>
          )}
          <AnimatePresence mode="wait">
            <motion.p key={activeIdx}
              initial={{opacity:0,y:12,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-12,scale:0.95}}
              transition={{duration:0.25}}
              className="text-xl font-display font-bold text-center leading-relaxed"
              style={{color:'var(--color-primary)',textShadow:'0 0 20px color-mix(in srgb, var(--color-primary) 50%, transparent)'}}>
              {lines[activeIdx] || '♪'}
            </motion.p>
          </AnimatePresence>
          {lines[activeIdx+1] && (
            <p className="text-sm text-center opacity-30">{lines[activeIdx+1]}</p>
          )}
        </div>
      ) : (
        /* Scroll mode */
        <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-1"
          style={{maskImage:'linear-gradient(transparent 0%,black 8%,black 88%,transparent 100%)',scrollbarWidth:'none'}}>
          {lines.map((line, i) => (
            <motion.p key={i} ref={i===activeIdx?activeRef:null}
              animate={{
                color: i===activeIdx?'var(--color-primary)':i<activeIdx?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.65)',
                scale: i===activeIdx?1.02:1,
                textShadow: i===activeIdx?'0 0 16px color-mix(in srgb, var(--color-primary) 60%, transparent)':'none',
              }}
              transition={{duration:0.2}}
              className="text-sm leading-7 cursor-pointer"
              style={{transformOrigin:'left'}}
            >
              {line || <span className="opacity-20">·</span>}
            </motion.p>
          ))}
          <div className="h-12"/>
        </div>
      )}
    </div>
  )
}
