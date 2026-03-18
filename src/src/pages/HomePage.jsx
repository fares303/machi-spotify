import React from 'react'
import { motion } from 'framer-motion'
import { HiPlay, HiArrowRight } from 'react-icons/hi'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { searchYouTube, normalizeYT } from '../services/api'
import { useStore } from '../store'
import TrackCard from '../components/UI/TrackCard'

const MOODS = [
  {label:'Happy',emoji:'😄',q:'happy upbeat pop 2024',color:'#FBBF24'},
  {label:'Sad',emoji:'😢',q:'sad emotional songs',color:'#60A5FA'},
  {label:'Focus',emoji:'🎯',q:'focus study lofi beats',color:'#34D399'},
  {label:'Workout',emoji:'💪',q:'gym workout motivation',color:'#F87171'},
  {label:'Chill',emoji:'😌',q:'chill vibes relax',color:'#A78BFA'},
  {label:'Party',emoji:'🎉',q:'party dance hits',color:'#FB923C'},
]

const Skeleton = () => (
  <div className="card p-3">
    <div className="aspect-square shimmer rounded-xl mb-3"/><div className="h-3.5 shimmer rounded w-3/4 mb-2"/><div className="h-3 shimmer rounded w-1/2"/>
  </div>
)

export default function HomePage() {
  const navigate = useNavigate()
  const { setQueue, recentlyPlayed, favorites } = useStore()

  const { data: trending=[], isLoading: trendLoading } = useQuery({
    queryKey:['trending'],
    queryFn: () => searchYouTube('trending music 2024', 12),
    staleTime: 10*60*1000,
  })

  const { data: pop=[] } = useQuery({
    queryKey:['pop'],
    queryFn: () => searchYouTube('top pop songs 2024', 6),
    staleTime: 10*60*1000,
  })

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return ['Good morning','☀️']
    if (h < 18) return ['Good afternoon','🎵']
    if (h < 22) return ['Good evening','🌙']
    return ['Up late?','⭐']
  }
  const [greeting, emoji] = greet()

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="pb-6">
      {/* Hero */}
      <div className="relative overflow-hidden m-6 rounded-3xl p-8 min-h-[220px] flex flex-col justify-end"
        style={{background:'linear-gradient(135deg, var(--color-surface-3) 0%, var(--color-surface-2) 100%)',border:'1px solid var(--glass-border)'}}>
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {['30% 40%','70% 20%','55% 75%'].map((pos,i)=>(
            <motion.div key={i} className="absolute w-64 h-64 rounded-full opacity-15"
              style={{background:`radial-gradient(circle, ${['var(--color-secondary)','var(--color-primary)','var(--color-accent)'][i]}, transparent)`,left:pos.split(' ')[0],top:pos.split(' ')[1],transform:'translate(-50%,-50%)'}}
              animate={{x:[0,20,0],y:[0,-15,0]}} transition={{duration:6+i*2,repeat:Infinity,ease:'easeInOut',delay:i*1.5}}/>
          ))}
        </div>
        <div className="relative z-10">
          <p className="text-sm mb-1" style={{color:'var(--color-on-surface-muted)'}}>{emoji} {greeting}</p>
          <h1 className="text-4xl font-display font-extrabold mb-2">
            Welcome to <span className="gradient-text">Machi Spotify</span>
          </h1>
          <p className="text-sm mb-5" style={{color:'var(--color-on-surface-muted)'}}>Stream YouTube Music · No Ads · No Login Required</p>
          <div className="flex flex-wrap gap-3">
            {trending.length>0 && <button className="btn-primary" onClick={()=>setQueue(trending,0)}><HiPlay/>Play Trending</button>}
            <button className="btn-ghost" onClick={()=>navigate('/search')}><HiArrowRight/>Browse Music</button>
            <button className="btn-ghost" onClick={()=>navigate('/import')}><HiArrowRight/>Import Playlist</button>
          </div>
        </div>
      </div>

      {/* Moods */}
      <Section title="Pick a Mood" onSeeAll={()=>navigate('/discover')}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {MOODS.map((m,i)=>(
            <motion.button key={m.label} initial={{opacity:0,scale:0.85}} animate={{opacity:1,scale:1,transition:{delay:i*0.05}}}
              whileHover={{scale:1.06,y:-2}} whileTap={{scale:0.96}}
              onClick={()=>navigate(`/search?q=${encodeURIComponent(m.q)}`)}
              className="py-4 rounded-2xl flex flex-col items-center gap-2"
              style={{background:`color-mix(in srgb, ${m.color} 12%, var(--color-surface-2))`,border:`1px solid color-mix(in srgb, ${m.color} 25%, transparent)`}}>
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-xs font-bold" style={{color:m.color}}>{m.label}</span>
            </motion.button>
          ))}
        </div>
      </Section>

      {/* Trending */}
      <Section title="🔥 Trending Now" onSeeAll={()=>navigate('/discover')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trendLoading ? Array(6).fill(0).map((_,i)=><Skeleton key={i}/>)
            : trending.slice(0,6).map((t,i)=>(
              <motion.div key={t.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0,transition:{delay:i*0.04}}}>
                <TrackCard track={t} queue={trending} index={i}/>
              </motion.div>
            ))
          }
        </div>
      </Section>

      {/* Pop picks */}
      {pop.length>0 && (
        <Section title="✨ Pop Picks" onSeeAll={()=>navigate('/search?q=top+pop+songs+2024')}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {pop.map((t,i)=>(
              <motion.div key={t.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1,transition:{delay:i*0.04}}}>
                <TrackCard track={t} queue={pop} index={i}/>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Recently played */}
      {recentlyPlayed.length>0 && (
        <Section title="🕐 Recently Played" onSeeAll={()=>navigate('/library?tab=recent')}>
          <div className="rounded-2xl overflow-hidden" style={{border:'1px solid var(--glass-border)'}}>
            {recentlyPlayed.slice(0,8).map((t,i)=>(
              <TrackCard key={`${t.id}_${i}`} track={t} queue={recentlyPlayed} index={i} compact/>
            ))}
          </div>
        </Section>
      )}

      {/* Chart list */}
      {trending.length>6 && (
        <Section title="📊 Top 10">
          <div className="rounded-2xl overflow-hidden" style={{border:'1px solid var(--glass-border)'}}>
            {trending.slice(0,10).map((t,i)=>(
              <motion.div key={t.id} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0,transition:{delay:i*0.03}}}
                className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-white/3 group"
                style={{borderBottom:i<9?'1px solid var(--glass-border)':undefined}}
                onClick={()=>setQueue(trending,i)}>
                <span className="w-7 text-center font-mono text-sm font-bold flex-shrink-0"
                  style={{color:i<3?'var(--color-primary)':'var(--color-on-surface-muted)'}}>
                  {i<3?['🥇','🥈','🥉'][i]:i+1}
                </span>
                <img src={t.cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  onError={e=>e.target.src='https://placehold.co/40x40/161622/0DFFB0?text=♫'}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs truncate" style={{color:'var(--color-on-surface-muted)'}}>{t.artist}</p>
                </div>
                <HiPlay className="opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'var(--color-primary)'}}/>
              </motion.div>
            ))}
          </div>
        </Section>
      )}
    </motion.div>
  )
}

function Section({title, children, onSeeAll}) {
  return (
    <div className="px-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold">{title}</h2>
        {onSeeAll && <button onClick={onSeeAll} className="flex items-center gap-1 text-sm hover:text-white transition-colors" style={{color:'var(--color-on-surface-muted)'}}>See all<HiArrowRight/></button>}
      </div>
      {children}
    </div>
  )
}
