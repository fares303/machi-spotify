import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiHome, HiSearch, HiCollection, HiHeart, HiClock, HiPlus, HiMenu, HiChevronDown } from 'react-icons/hi'
import { MdExplore, MdEqualizer } from 'react-icons/md'
import { useStore } from '../../store'

const NAV = [
  { icon: HiHome,        label: 'Home',     to: '/' },
  { icon: HiSearch,      label: 'Search',   to: '/search' },
  { icon: MdExplore,     label: 'Discover', to: '/discover' },
  { icon: HiCollection,  label: 'Library',  to: '/library' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed]     = useState(false)
  const [showPlaylists, setShowPl]    = useState(true)
  const { playlists, favorites, recentlyPlayed, currentTrack, isPlaying, createPlaylist } = useStore()
  const navigate = useNavigate()

  return (
    <motion.aside animate={{width:collapsed?68:236}} transition={{duration:0.22,ease:[0.4,0,0.2,1]}}
      className="flex-shrink-0 h-full flex flex-col z-20 overflow-hidden"
      style={{background:'var(--color-surface-2)',borderRight:'1px solid var(--glass-border)'}}>

      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3 border-b flex-shrink-0" style={{borderColor:'var(--glass-border)'}}>
        <motion.div animate={{rotate:isPlaying?360:0}} transition={{duration:4,repeat:Infinity,ease:'linear'}}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-black text-base"
          style={{background:'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',color:'var(--color-surface)'}}>
          M
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}} className="overflow-hidden">
              <p className="font-display font-extrabold text-base gradient-text whitespace-nowrap">Machi Spotify</p>
              <p className="text-[10px] whitespace-nowrap" style={{color:'var(--color-on-surface-muted)'}}>No Ads · No Login</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={()=>setCollapsed(!collapsed)} className="ml-auto hover:text-white transition-colors p-1 rounded-lg"
          style={{color:'var(--color-on-surface-muted)'}}>
          <HiMenu className="text-base"/>
        </button>
      </div>

      {/* Nav */}
      <nav className="px-2 pt-3 space-y-0.5 flex-shrink-0">
        {NAV.map(({icon:Icon,label,to})=>(
          <NavLink key={to} to={to} className={({isActive})=>`nav-link ${isActive?'active':''}`}>
            <Icon className="text-lg flex-shrink-0"/>
            <AnimatePresence>
              {!collapsed && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-sm whitespace-nowrap">{label}</motion.span>}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 my-2 border-t" style={{borderColor:'var(--glass-border)'}}/>

      {/* Quick links */}
      {!collapsed && (
        <div className="px-2 space-y-0.5 flex-shrink-0">
          <div className="nav-link cursor-pointer" onClick={()=>navigate('/library?tab=favorites')}>
            <HiHeart className="text-lg flex-shrink-0" style={{color:'#F87171'}}/>
            <span className="text-sm flex-1">Liked Songs</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:'var(--glass-bg)',color:'var(--color-on-surface-muted)'}}>{favorites.length}</span>
          </div>
          <div className="nav-link cursor-pointer" onClick={()=>navigate('/library?tab=recent')}>
            <HiClock className="text-lg flex-shrink-0" style={{color:'var(--color-secondary)'}}/>
            <span className="text-sm flex-1">Recently Played</span>
          </div>
        </div>
      )}

      <div className="mx-3 my-2 border-t" style={{borderColor:'var(--glass-border)'}}/>

      {/* Playlists */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 overflow-y-auto px-2 pb-2" style={{scrollbarWidth:'none'}}>
            <div className="flex items-center px-1 py-1.5">
              <button onClick={()=>setShowPl(!showPlaylists)} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest flex-1 hover:text-white transition-colors" style={{color:'var(--color-on-surface-muted)'}}>
                <HiChevronDown className={`transition-transform ${showPlaylists?'':'rotate-180'}`}/> Playlists
              </button>
              <button onClick={()=>{ const n=prompt('Playlist name:'); if(n?.trim()) createPlaylist(n.trim()) }}
                className="hover:text-white transition-colors p-1" style={{color:'var(--color-on-surface-muted)'}}>
                <HiPlus className="text-sm"/>
              </button>
            </div>
            <AnimatePresence>
              {showPlaylists && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden space-y-0.5">
                  {playlists.length === 0 && (
                    <p className="text-xs px-3 py-2 italic" style={{color:'var(--color-on-surface-muted)'}}>No playlists yet</p>
                  )}
                  {playlists.map(p=>(
                    <NavLink key={p.id} to={`/playlist/${p.id}`} className={({isActive})=>`nav-link ${isActive?'active':''}`}>
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden"
                        style={{background:`linear-gradient(135deg, ${p.coverColor}, var(--color-surface))`}}>
                        {p.tracks[0]?.cover && <img src={p.tracks[0].cover} alt="" className="w-full h-full object-cover"/>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                        <p className="text-[10px]" style={{color:'var(--color-on-surface-muted)'}}>{p.tracks.length} songs</p>
                      </div>
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Now playing mini */}
      {!collapsed && currentTrack && (
        <div className="mx-2 mb-2 p-2.5 rounded-xl" style={{background:'color-mix(in srgb, var(--color-primary) 8%, transparent)',border:'1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)'}}>
          <div className="flex items-center gap-2">
            <img src={currentTrack.cover} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              onError={e=>e.target.src='https://placehold.co/32x32/161622/0DFFB0?text=♫'}/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate neon-text">{currentTrack.title}</p>
              <p className="text-[10px] truncate" style={{color:'var(--color-on-surface-muted)'}}>{currentTrack.artist}</p>
            </div>
            {isPlaying && <div className="waveform flex-shrink-0">{[0,1,2].map(i=><div key={i} className="waveform-bar w-0.5" style={{animationDelay:`${i*0.15}s`}}/>)}</div>}
          </div>
        </div>
      )}
    </motion.aside>
  )
}
