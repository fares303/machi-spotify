import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { HiPlay } from 'react-icons/hi'
import { useQuery } from '@tanstack/react-query'
import { searchYouTube } from '../services/api'
import { useStore } from '../store'
import TrackCard from '../components/ui/TrackCard'

const GENRES = ['Pop','Rock','Hip Hop','Electronic','R&B','Jazz','Classical','Metal','Reggae','Country','Afrobeats','K-Pop','Bollywood','Lo-fi','Workout']

const Sk = () => <div className="card p-3"><div className="aspect-square shimmer rounded-xl mb-3"/><div className="h-3.5 shimmer rounded w-3/4 mb-2"/><div className="h-3 shimmer rounded w-1/2"/></div>

export default function DiscoverPage() {
  const [genre, setGenre] = useState('Pop')
  const { setQueue } = useStore()

  const { data: genreTracks=[], isLoading: gl } = useQuery({
    queryKey:['genre',genre],
    queryFn:()=>searchYouTube(`best ${genre} songs 2024`,12),
    staleTime:5*60*1000,
  })

  const { data: viral=[], isLoading: vl } = useQuery({
    queryKey:['viral'],
    queryFn:()=>searchYouTube('viral music trending now 2024',10),
    staleTime:10*60*1000,
  })

  const { data: radio=[] } = useQuery({
    queryKey:['radio'],
    queryFn:()=>searchYouTube('non stop music radio 2024',8),
    staleTime:10*60*1000,
  })

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="p-6 pb-8">
      <h1 className="text-3xl font-display font-extrabold mb-6">Discover</h1>

      {/* Genre tabs */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-3">Explore Genres</h2>
        <div className="flex gap-2 flex-wrap mb-5">
          {GENRES.map(g=>(
            <motion.button key={g} whileHover={{scale:1.05}} whileTap={{scale:0.96}}
              onClick={()=>setGenre(g)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{background:genre===g?'var(--color-primary)':'var(--glass-bg)',color:genre===g?'var(--color-surface)':'var(--color-on-surface-muted)',border:`1px solid ${genre===g?'var(--color-primary)':'var(--glass-border)'}`}}>
              {g}
            </motion.button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {gl?Array(6).fill(0).map((_,i)=><Sk key={i}/>)
            :genreTracks.slice(0,6).map((t,i)=>(
              <motion.div key={t.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1,transition:{delay:i*0.04}}}>
                <TrackCard track={t} queue={genreTracks} index={i}/>
              </motion.div>
            ))
          }
        </div>
      </div>

      {/* Radio */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">📻 Radio Stations</h2>
          {radio.length>0 && <button className="btn-ghost text-xs py-1.5" onClick={()=>setQueue(radio,0)}><HiPlay/>Play All</button>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {radio.slice(0,4).map((t,i)=>(
            <TrackCard key={t.id} track={t} queue={radio} index={i}/>
          ))}
        </div>
      </div>

      {/* Viral */}
      <div>
        <h2 className="text-base font-bold mb-3">🔥 Viral Right Now</h2>
        <div className="rounded-2xl overflow-hidden" style={{border:'1px solid var(--glass-border)'}}>
          {vl?Array(5).fill(0).map((_,i)=>(
              <div key={i} className="flex items-center gap-3 p-3 border-b" style={{borderColor:'var(--glass-border)'}}>
                <div className="w-10 h-10 shimmer rounded-lg flex-shrink-0"/>
                <div className="flex-1"><div className="h-3.5 shimmer rounded w-2/3 mb-1.5"/><div className="h-3 shimmer rounded w-1/3"/></div>
              </div>
            ))
            :viral.map((t,i)=><TrackCard key={t.id} track={t} queue={viral} index={i} compact/>)
          }
        </div>
      </div>
    </motion.div>
  )
}
