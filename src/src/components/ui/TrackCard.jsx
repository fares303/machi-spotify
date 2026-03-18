import React, { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiPlay, HiPause, HiHeart, HiDotsVertical, HiDownload, HiPlus, HiViewList } from 'react-icons/hi'
import { MdPlaylistAdd } from 'react-icons/md'
import { useStore } from '../../store'
import { downloadTrack } from '../../services/api'
import { fmt } from '../../utils/helpers'

export default function TrackCard({ track, queue = [], index = 0, compact = false }) {
  const { currentTrack, isPlaying, setCurrentTrack, setQueue, isFavorite, toggleFavorite, playlists, addToPlaylist, addToQueue, addNextInQueue } = useStore()
  const [menu, setMenu] = useState(false)
  const isCurrent = currentTrack?.id === track.id
  const isFav = isFavorite(track.id)

  const play = () => {
    if (queue.length > 0) setQueue(queue, index)
    else setCurrentTrack(track)
  }

  if (compact) return (
    <motion.div whileHover={{ backgroundColor: 'var(--glass-bg)' }}
      className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer group relative"
      onClick={play}
    >
      <div className="relative w-10 h-10 flex-shrink-0">
        <img src={track.cover} alt="" className="w-10 h-10 rounded-lg object-cover"
          onError={e => e.target.src='https://placehold.co/40x40/161622/0DFFB0?text=♫'} />
        {isCurrent && isPlaying
          ? <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="waveform">{[0,1,2,3].map(i=><div key={i} className="waveform-bar" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
            </div>
          : <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <HiPlay className="text-white text-sm" />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'neon-text' : ''}`}>{track.title}</p>
        <p className="text-xs truncate" style={{color:'var(--color-on-surface-muted)'}}>{track.artist}</p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e=>{e.stopPropagation();toggleFavorite(track)}} className={isFav?'text-red-400':'hover:text-white transition-colors'} style={{color:isFav?undefined:'var(--color-on-surface-muted)'}}>
          <HiHeart className={`text-sm ${isFav?'fill-current':''}`}/>
        </button>
      </div>
      {track.duration > 0 && <span className="text-xs flex-shrink-0" style={{color:'var(--color-on-surface-muted)'}}>{fmt(track.duration)}</span>}
    </motion.div>
  )

  return (
    <motion.div whileHover={{y:-3}} className="card p-3 cursor-pointer group relative" onClick={play}>
      <div className="relative mb-3 rounded-xl overflow-hidden aspect-square">
        <img src={track.cover} alt={track.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e=>e.target.src='https://placehold.co/200x200/161622/0DFFB0?text=♫'} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <motion.div whileHover={{scale:1.1}} whileTap={{scale:0.9}}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{background:'var(--color-primary)',boxShadow:'0 0 20px color-mix(in srgb, var(--color-primary) 50%, transparent)'}}>
            {isCurrent&&isPlaying ? <HiPause style={{color:'var(--color-surface)',fontSize:20}}/> : <HiPlay style={{color:'var(--color-surface)',fontSize:20}}/>}
          </motion.div>
        </div>
        {isCurrent && (
          <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-1.5 py-1 flex gap-0.5 items-end">
            {[0,1,2,3].map(i=><div key={i} className="waveform-bar w-0.5" style={{animationDelay:`${i*0.15}s`, animationPlayState:isPlaying?'running':'paused'}}/>)}
          </div>
        )}
      </div>
      <p className={`font-semibold text-sm truncate mb-0.5 ${isCurrent?'neon-text':''}`}>{track.title}</p>
      <p className="text-xs truncate" style={{color:'var(--color-on-surface-muted)'}}>{track.artist}</p>
      <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e=>{e.stopPropagation();toggleFavorite(track)}} className={isFav?'text-red-400':'transition-colors'} style={{color:isFav?undefined:'var(--color-on-surface-muted)'}}>
          <HiHeart className={`text-base ${isFav?'fill-current':''}`}/>
        </button>
        <div className="relative">
          <button onClick={e=>{e.stopPropagation();setMenu(!menu)}} className="hover:text-white transition-colors p-1" style={{color:'var(--color-on-surface-muted)'}}>
            <HiDotsVertical/>
          </button>
          <AnimatePresence>
            {menu && (
              <motion.div initial={{opacity:0,scale:0.9,y:-5}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9}} onClick={e=>e.stopPropagation()}
                className="absolute right-0 bottom-8 z-50 w-48 rounded-xl p-1.5 shadow-2xl"
                style={{background:'var(--color-surface-2)',border:'1px solid var(--glass-border)'}}>
                <MenuItem icon={HiViewList} label="Play Next" onClick={()=>{addNextInQueue(track);setMenu(false)}}/>
                <MenuItem icon={MdPlaylistAdd} label="Add to Queue" onClick={()=>{addToQueue(track);setMenu(false)}}/>
                <MenuItem icon={HiHeart} label={isFav?'Remove Favorite':'Add to Favorites'} onClick={()=>{toggleFavorite(track);setMenu(false)}}/>
                <MenuItem icon={HiDownload} label="Download" onClick={()=>{downloadTrack(track.videoId,track.title);setMenu(false)}}/>
                {playlists.length>0 && <>
                  <div className="border-t my-1" style={{borderColor:'var(--glass-border)'}}/>
                  <p className="text-xs px-2 py-1" style={{color:'var(--color-on-surface-muted)'}}>Add to playlist</p>
                  {playlists.slice(0,4).map(p=>(
                    <MenuItem key={p.id} icon={HiPlus} label={p.name} onClick={()=>{addToPlaylist(p.id,track);setMenu(false)}}/>
                  ))}
                </>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

function MenuItem({icon:Icon, label, onClick}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs hover:text-white transition-all text-left" style={{color:'var(--color-on-surface-muted)'}}>
      <Icon className="text-sm flex-shrink-0"/>{label}
    </button>
  )
}
