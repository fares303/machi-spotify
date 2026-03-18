import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { HiLink, HiDownload, HiPlay, HiCheck } from 'react-icons/hi'
import { importFromUrl } from '../services/api'
import { useStore } from '../store'
import TrackCard from '../components/UI/TrackCard'
import toast from 'react-hot-toast'

const EXAMPLES = [
  'https://www.youtube.com/playlist?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG',
  'https://music.youtube.com/playlist?list=RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ns7t5SVqulF31Y',
  'https://youtu.be/dQw4w9WgXcQ',
]

export default function ImportPage() {
  const [url, setUrl]         = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [imported, setImported] = useState(false)
  const { setQueue, importPlaylist, setCurrentTrack } = useStore()

  const handleImport = async () => {
    if (!url.trim()) return
    setLoading(true); setResult(null); setImported(false)
    try {
      const data = await importFromUrl(url.trim())
      if (!data) throw new Error('Could not parse URL')
      setResult(data)
      toast.success(`Found: ${data.name || data.track?.title}`)
    } catch (e) {
      toast.error(e.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    if (!result) return
    if (result.type === 'playlist') {
      importPlaylist({ name: result.name, tracks: result.tracks, coverColor: '#0DFFB0' })
      toast.success(`Playlist "${result.name}" added!`)
      setImported(true)
    } else if (result.type === 'track') {
      setCurrentTrack(result.track)
      toast.success('Playing track!')
    }
  }

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="p-6 pb-12 max-w-2xl">
      <h1 className="text-3xl font-display font-extrabold mb-2">Import from YouTube</h1>
      <p className="text-sm mb-6" style={{color:'var(--color-on-surface-muted)'}}>
        Paste a YouTube or YouTube Music URL to import a playlist or song
      </p>

      {/* URL input */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <HiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{color:'var(--color-on-surface-muted)'}}/>
          <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleImport()}
            placeholder="https://youtube.com/playlist?list=... or youtu.be/..."
            className="w-full pl-10 pr-4 py-3 text-sm outline-none rounded-xl"
            style={{background:'var(--color-surface-2)',border:'1px solid var(--glass-border)',color:'var(--color-on-surface)'}}
          />
        </div>
        <button className="btn-primary" onClick={handleImport} disabled={loading||!url.trim()}>
          {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : 'Import'}
        </button>
      </div>

      {/* Examples */}
      <div className="mb-8">
        <p className="text-xs mb-2" style={{color:'var(--color-on-surface-muted)'}}>Examples:</p>
        {EXAMPLES.map(e=>(
          <button key={e} onClick={()=>setUrl(e)} className="block text-left text-xs mb-1 hover:text-white transition-colors truncate w-full" style={{color:'var(--color-on-surface-muted)'}}>
            {e}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
          className="rounded-2xl p-4" style={{background:'var(--color-surface-2)',border:'1px solid var(--glass-border)'}}>
          {result.type === 'playlist' ? (
            <>
              <div className="flex items-start gap-4 mb-4">
                {result.cover && <img src={result.cover} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0"/>}
                <div>
                  <p className="text-xs mb-1" style={{color:'var(--color-on-surface-muted)'}}>YouTube Playlist</p>
                  <p className="font-display font-bold text-lg">{result.name}</p>
                  <p className="text-sm" style={{color:'var(--color-on-surface-muted)'}}>{result.tracks?.length} songs</p>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden mb-4" style={{border:'1px solid var(--glass-border)',maxHeight:240,overflowY:'auto'}}>
                {result.tracks?.slice(0,10).map((t,i)=>(
                  <TrackCard key={t.id||i} track={t} compact/>
                ))}
                {result.tracks?.length>10 && <p className="text-xs text-center py-2" style={{color:'var(--color-on-surface-muted)'}}>+{result.tracks.length-10} more songs</p>}
              </div>
              <div className="flex gap-3">
                {!imported
                  ? <>
                      <button className="btn-primary" onClick={handleAdd}><HiDownload/>Add to Library</button>
                      <button className="btn-ghost" onClick={()=>setQueue(result.tracks,0)}><HiPlay/>Play Now</button>
                    </>
                  : <div className="flex items-center gap-2 text-sm" style={{color:'var(--color-primary)'}}><HiCheck/> Added to library!</div>
                }
              </div>
            </>
          ) : (
            <div className="flex items-start gap-4">
              <img src={result.track.cover} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                onError={e=>e.target.src='https://placehold.co/64x64/161622/0DFFB0?text=♫'}/>
              <div className="flex-1">
                <p className="text-xs mb-1" style={{color:'var(--color-on-surface-muted)'}}>YouTube Video</p>
                <p className="font-bold mb-1">{result.track.title}</p>
                <p className="text-sm" style={{color:'var(--color-on-surface-muted)'}}>{result.track.artist}</p>
                <button className="btn-primary mt-3 text-xs py-1.5" onClick={handleAdd}><HiPlay/>Play</button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* How it works */}
      <div className="mt-8 p-4 rounded-2xl" style={{background:'var(--color-surface-2)',border:'1px solid var(--glass-border)'}}>
        <p className="text-sm font-semibold mb-3">How to import from YouTube Music</p>
        <ol className="space-y-2 text-sm" style={{color:'var(--color-on-surface-muted)'}}>
          <li>1. Open YouTube or YouTube Music on your phone</li>
          <li>2. Go to any song, playlist, or album</li>
          <li>3. Tap <strong style={{color:'var(--color-on-surface)'}}>Share</strong> → <strong style={{color:'var(--color-on-surface)'}}>Copy link</strong></li>
          <li>4. Paste the link above and click Import</li>
        </ol>
      </div>
    </motion.div>
  )
}
