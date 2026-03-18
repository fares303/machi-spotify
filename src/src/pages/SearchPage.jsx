import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSearch, HiX } from 'react-icons/hi'
import { searchYouTube } from '../services/api'
import { useStore } from '../store'
import TrackCard from '../components/UI/TrackCard'
import { debounce } from '../utils/helpers'

const CATS = [
  {label:'Pop Hits',color:'#F43F5E',emoji:'🎤'},
  {label:'Hip Hop',color:'#8B5CF6',emoji:'🎧'},
  {label:'Electronic',color:'#10B981',emoji:'🎛️'},
  {label:'Rock',color:'#F97316',emoji:'🎸'},
  {label:'R&B Soul',color:'#EAB308',emoji:'🎷'},
  {label:'Lo-fi',color:'#3B82F6',emoji:'☕'},
  {label:'Bollywood',color:'#EC4899',emoji:'🎬'},
  {label:'K-Pop',color:'#A855F7',emoji:'✨'},
  {label:'Jazz',color:'#06B6D4',emoji:'🎺'},
  {label:'Workout',color:'#EF4444',emoji:'💪'},
  {label:'Afrobeats',color:'#F59E0B',emoji:'🌍'},
  {label:'Classical',color:'#6366F1',emoji:'🎻'},
]

const Skeleton = () => (
  <div className="card p-3"><div className="aspect-square shimmer rounded-xl mb-3"/><div className="h-3.5 shimmer rounded w-3/4 mb-2"/><div className="h-3 shimmer rounded w-1/2"/></div>
)

export default function SearchPage() {
  const [params] = useSearchParams()
  const initQ = params.get('q') || ''
  const [query, setQuery]   = useState(initQ)
  const [results, setRes]   = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!initQ)
  const navigate = useNavigate()

  const doSearch = useCallback(
    debounce(async (q) => {
      if (!q.trim()) { setRes([]); setSearched(false); return }
      setLoading(true); setSearched(true)
      try {
        const items = await searchYouTube(q, 24)
        setRes(items)
      } catch { setRes([]) }
      finally { setLoading(false) }
    }, 450), []
  )

  useEffect(() => { if (initQ) doSearch(initQ) }, [initQ])

  const handleInput = (v) => {
    setQuery(v)
    navigate(v ? `/search?q=${encodeURIComponent(v)}` : '/search', { replace: true })
    doSearch(v)
  }

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="p-6 pb-8">
      <h1 className="text-3xl font-display font-extrabold mb-5">Search</h1>

      {/* Search bar */}
      <div className="relative max-w-2xl mb-8">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base" style={{color:'var(--color-on-surface-muted)'}}/>
        <input value={query} onChange={e=>handleInput(e.target.value)}
          placeholder="Search YouTube Music..."
          className="w-full pl-11 pr-11 py-4 text-base outline-none rounded-2xl transition-all"
          style={{background:'var(--color-surface-2)',border:'1px solid var(--glass-border)',color:'var(--color-on-surface)'}}
          onFocus={e=>e.target.style.borderColor='color-mix(in srgb, var(--color-primary) 50%, transparent)'}
          onBlur={e=>e.target.style.borderColor='var(--glass-border)'}
          autoFocus={!initQ}
        />
        {query && <button onClick={()=>handleInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-white transition-colors" style={{color:'var(--color-on-surface-muted)'}}><HiX/></button>}
      </div>

      <AnimatePresence mode="wait">
        {!searched && (
          <motion.div key="browse" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <h2 className="text-base font-bold mb-4">Browse Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {CATS.map((c,i)=>(
                <motion.button key={c.label} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1,transition:{delay:i*0.04}}}
                  whileHover={{scale:1.03,y:-2}} whileTap={{scale:0.97}}
                  onClick={()=>handleInput(c.label)}
                  className="h-24 rounded-2xl relative flex items-end p-4 overflow-hidden text-left"
                  style={{background:`linear-gradient(135deg, color-mix(in srgb, ${c.color} 30%, var(--color-surface-2)), var(--color-surface-2))`,border:`1px solid color-mix(in srgb, ${c.color} 25%, transparent)`}}>
                  <span className="absolute top-3 right-4 text-2xl">{c.emoji}</span>
                  <span className="font-display font-bold text-sm">{c.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array(12).fill(0).map((_,i)=><Skeleton key={i}/>)}
            </div>
          </motion.div>
        )}

        {searched && !loading && results.length===0 && (
          <motion.div key="empty" className="flex flex-col items-center py-24 gap-4" initial={{opacity:0}} animate={{opacity:1}}>
            <div className="text-6xl">🔍</div>
            <p className="text-xl font-display font-bold">No results for "{query}"</p>
            <p className="text-sm" style={{color:'var(--color-on-surface-muted)'}}>Try different keywords</p>
          </motion.div>
        )}

        {searched && !loading && results.length>0 && (
          <motion.div key="results" initial={{opacity:0}} animate={{opacity:1}}>
            <p className="text-sm mb-4" style={{color:'var(--color-on-surface-muted)'}}>
              <span style={{color:'var(--color-on-surface)',fontWeight:600}}>{results.length}</span> results for "{query}"
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((t,i)=>(
                <motion.div key={t.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0,transition:{delay:i*0.025}}}>
                  <TrackCard track={t} queue={results} index={i}/>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
