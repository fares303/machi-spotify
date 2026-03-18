import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiHeart, HiClock, HiCollection, HiPlus, HiTrash, HiUserGroup, HiMusicNote } from 'react-icons/hi'
import { useStore } from '../store'
import TrackCard from '../components/ui/TrackCard'

const TABS = [
  {id:'playlists',label:'Playlists',icon:HiCollection},
  {id:'favorites',label:'Liked',icon:HiHeart},
  {id:'recent',label:'Recent',icon:HiClock},
  {id:'artists',label:'Artists',icon:HiUserGroup},
  {id:'albums',label:'Albums',icon:HiMusicNote},
]

export default function LibraryPage() {
  const [sp] = useSearchParams()
  const [tab, setTab] = useState(sp.get('tab')||'playlists')
  const { playlists, favorites, recentlyPlayed, bookmarkedArtists, bookmarkedAlbums,
          createPlaylist, deletePlaylist, setQueue } = useStore()
  const navigate = useNavigate()

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="p-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-extrabold">Your Library</h1>
        {tab==='playlists' && (
          <button className="btn-primary text-xs py-2 px-4" onClick={()=>{const n=prompt('Playlist name:');if(n?.trim())createPlaylist(n.trim())}}>
            <HiPlus/>New Playlist
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>setTab(id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background:tab===id?'var(--color-primary)':'var(--glass-bg)',
              color:tab===id?'var(--color-surface)':'var(--color-on-surface-muted)',
              border:`1px solid ${tab===id?'var(--color-primary)':'var(--glass-border)'}`,
              fontWeight:tab===id?700:400,
            }}>
            <Icon className="text-sm"/>{label}
            <span className="text-xs opacity-70">
              {id==='playlists'?playlists.length:id==='favorites'?favorites.length:id==='recent'?recentlyPlayed.length:id==='artists'?bookmarkedArtists.length:bookmarkedAlbums.length}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab==='playlists' && (
          <motion.div key="pl" initial={{opacity:0}} animate={{opacity:1}}>
            {playlists.length===0
              ? <Empty icon="🎵" title="No playlists yet" desc="Create a playlist to organize your music"/>
              : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {playlists.map((p,i)=>(
                    <motion.div key={p.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1,transition:{delay:i*0.05}}}
                      whileHover={{y:-3}} className="card p-3 cursor-pointer group" onClick={()=>navigate(`/playlist/${p.id}`)}>
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 flex items-center justify-center text-3xl"
                        style={{background:p.tracks[0]?.cover?undefined:`linear-gradient(135deg, ${p.coverColor}, var(--color-surface))`}}>
                        {p.tracks[0]?.cover
                          ? <img src={p.tracks[0].cover} alt="" className="w-full h-full object-cover"/>
                          : '🎵'}
                      </div>
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-xs" style={{color:'var(--color-on-surface-muted)'}}>{p.tracks.length} songs</p>
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.tracks.length>0 && <button onClick={e=>{e.stopPropagation();setQueue(p.tracks,0)}} className="btn-primary text-xs py-1 px-3">Play</button>}
                        <button onClick={e=>{e.stopPropagation();if(confirm('Delete?'))deletePlaylist(p.id)}} className="btn-ghost text-xs py-1 px-2 text-red-400 border-red-400/20"><HiTrash/></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
            }
          </motion.div>
        )}

        {tab==='favorites' && (
          <motion.div key="fav" initial={{opacity:0}} animate={{opacity:1}}>
            {favorites.length===0
              ? <Empty icon="🤍" title="No liked songs" desc="Heart songs while browsing to save them here"/>
              : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {favorites.map((t,i)=>(
                    <motion.div key={t.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0,transition:{delay:i*0.03}}}>
                      <TrackCard track={t} queue={favorites} index={i}/>
                    </motion.div>
                  ))}
                </div>
            }
          </motion.div>
        )}

        {tab==='recent' && (
          <motion.div key="rec" initial={{opacity:0}} animate={{opacity:1}}>
            {recentlyPlayed.length===0
              ? <Empty icon="⏰" title="Nothing played yet" desc="Songs you play will appear here"/>
              : <div className="rounded-2xl overflow-hidden" style={{border:'1px solid var(--glass-border)'}}>
                  {recentlyPlayed.map((t,i)=>(
                    <motion.div key={`${t.id}_${i}`} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0,transition:{delay:i*0.02}}}>
                      <TrackCard track={t} queue={recentlyPlayed} index={i} compact/>
                    </motion.div>
                  ))}
                </div>
            }
          </motion.div>
        )}

        {tab==='artists' && (
          <motion.div key="art" initial={{opacity:0}} animate={{opacity:1}}>
            {bookmarkedArtists.length===0
              ? <Empty icon="🎤" title="No bookmarked artists" desc="Bookmark artists from search results"/>
              : <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {bookmarkedArtists.map((a,i)=>(
                    <motion.div key={a.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1,transition:{delay:i*0.04}}}
                      whileHover={{y:-3}} className="text-center cursor-pointer group">
                      <div className="aspect-square rounded-full overflow-hidden mb-2"
                        style={{background:'var(--color-surface-3)',boxShadow:'0 0 0 2px var(--glass-border)'}}>
                        {a.thumbnail
                          ? <img src={a.thumbnail} alt={a.name} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center text-3xl">🎤</div>}
                      </div>
                      <p className="text-sm font-semibold truncate">{a.name}</p>
                    </motion.div>
                  ))}
                </div>
            }
          </motion.div>
        )}

        {tab==='albums' && (
          <motion.div key="alb" initial={{opacity:0}} animate={{opacity:1}}>
            {bookmarkedAlbums.length===0
              ? <Empty icon="💿" title="No bookmarked albums" desc="Bookmark albums from search results"/>
              : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {bookmarkedAlbums.map((a,i)=>(
                    <motion.div key={a.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1,transition:{delay:i*0.04}}}
                      whileHover={{y:-3}} className="card p-3 cursor-pointer">
                      {a.thumbnail && <img src={a.thumbnail} alt="" className="w-full aspect-square rounded-xl object-cover mb-2"/>}
                      <p className="text-sm font-semibold truncate">{a.title}</p>
                      <p className="text-xs truncate" style={{color:'var(--color-on-surface-muted)'}}>{a.artist}</p>
                    </motion.div>
                  ))}
                </div>
            }
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const Empty = ({icon,title,desc}) => (
  <div className="flex flex-col items-center py-24 gap-4">
    <span className="text-5xl">{icon}</span>
    <p className="text-xl font-display font-bold">{title}</p>
    <p className="text-sm" style={{color:'var(--color-on-surface-muted)'}}>{desc}</p>
  </div>
)
