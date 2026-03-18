import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft, HiPlay, HiTrash, HiShare } from 'react-icons/hi'
import { MdShuffle } from 'react-icons/md'
import { useStore } from '../store'
import TrackCard from '../components/ui/TrackCard'
import { fmt } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function PlaylistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playlists, setQueue, deletePlaylist, removeFromPlaylist } = useStore()
  const playlist = playlists.find(p => p.id === id)

  if (!playlist) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <span className="text-5xl">😕</span>
      <p className="text-xl font-display font-bold">Playlist not found</p>
      <button className="btn-ghost" onClick={()=>navigate('/library')}>← Back to Library</button>
    </div>
  )

  const total = playlist.tracks.reduce((a,t)=>a+(t.duration||0),0)
  const shuffle = () => { if(playlist.tracks.length) setQueue([...playlist.tracks].sort(()=>Math.random()-0.5),0) }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="pb-8">
      <div className="p-6 pb-0">
        <button onClick={()=>navigate(-1)} className="flex items-center gap-2 text-sm hover:text-white transition-colors mb-6" style={{color:'var(--color-on-surface-muted)'}}>
          <HiArrowLeft/>Back
        </button>
      </div>

      {/* Header */}
      <div className="px-6 pb-6 flex gap-6 items-end">
        <div className="w-44 h-44 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center text-5xl"
          style={{background:playlist.tracks[0]?.cover?undefined:`linear-gradient(135deg, ${playlist.coverColor}, var(--color-surface))`}}>
          {playlist.tracks[0]?.cover
            ? <img src={playlist.tracks[0].cover} alt="" className="w-full h-full object-cover"/>
            : '🎵'}
        </div>
        <div className="flex-1 pb-1">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{color:'var(--color-on-surface-muted)'}}>Playlist</p>
          <h1 className="text-4xl font-display font-extrabold mb-2">{playlist.name}</h1>
          <p className="text-sm mb-4" style={{color:'var(--color-on-surface-muted)'}}>{playlist.tracks.length} songs · {fmt(total)}</p>
          <div className="flex gap-3 flex-wrap">
            {playlist.tracks.length>0 && <button className="btn-primary" onClick={()=>setQueue(playlist.tracks,0)}><HiPlay/>Play All</button>}
            <button className="btn-ghost" onClick={shuffle}><MdShuffle/>Shuffle</button>
            <button className="btn-ghost" onClick={()=>{navigator.clipboard.writeText(location.href);toast.success('Link copied!')}}><HiShare/>Share</button>
            <button className="btn-ghost text-red-400 border-red-400/20 hover:bg-red-400/10" onClick={()=>{if(confirm('Delete playlist?')){deletePlaylist(id);navigate('/library')}}}><HiTrash/>Delete</button>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="px-6">
        {playlist.tracks.length===0
          ? <div className="text-center py-16">
              <span className="text-5xl">🎵</span>
              <p className="mt-4" style={{color:'var(--color-on-surface-muted)'}}>Playlist is empty. Search for songs to add.</p>
              <button className="btn-primary mt-4" onClick={()=>navigate('/search')}>Find Music</button>
            </div>
          : <div className="rounded-2xl overflow-hidden" style={{border:'1px solid var(--glass-border)'}}>
              {playlist.tracks.map((t,i)=>(
                <div key={t.id} className="group relative">
                  <TrackCard track={t} queue={playlist.tracks} index={i} compact/>
                  <button onClick={()=>removeFromPlaylist(id,t.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-red-400/60 hover:text-red-400">
                    <HiTrash className="text-sm"/>
                  </button>
                </div>
              ))}
            </div>
        }
      </div>
    </motion.div>
  )
}
