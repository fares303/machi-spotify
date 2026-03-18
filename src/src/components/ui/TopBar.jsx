import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSearch, HiX, HiClock, HiFire, HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { searchYouTube, normalizeYT } from '../../services/api'
import { useStore } from '../../store'
import { debounce } from '../../utils/helpers'

const RECENT_KEY = 'machi_searches'
const TRENDING = ['Trending hits 2024','Lo-fi beats','Bollywood songs','Taylor Swift','Eminem','BTS','Drake','Coldplay','The Weeknd','K-Pop']

const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]') } catch { return [] } }
const saveRecent = (q) => {
  try {
    const prev = getRecent()
    const updated = [q, ...prev.filter(x=>x!==q)].slice(0,10)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {}
}
const removeRecent = (q) => {
  try {
    const updated = getRecent().filter(x=>x!==q)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {}
}

export default function TopBar() {
  const [query, setQuery]         = useState('')
  const [open, setOpen]           = useState(false)
  const [suggestions, setSugg]    = useState([])
  const [recents, setRecents]     = useState(getRecent())
  const [loading, setLoading]     = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef  = useRef(null)
  const dropRef   = useRef(null)
  const navigate  = useNavigate()
  const location  = useLocation()
  const { setCurrentTrack } = useStore()

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    const h = e => { if(!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const fetchSuggestions = useCallback(
    debounce(async (q) => {
      if (!q || q.length < 2) { setSugg([]); return }
      setLoading(true)
      try {
        const items = await searchYouTube(q, 6)
        setSugg(items.slice(0, 6))
      } catch { setSugg([]) }
      finally { setLoading(false) }
    }, 320), []
  )

  const handleChange = (v) => {
    setQuery(v); setOpen(true); setActiveIdx(-1); fetchSuggestions(v)
  }

  const doSearch = (q = query) => {
    if (!q.trim()) return
    saveRecent(q.trim())
    setRecents(getRecent())
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
    setOpen(false)
    setQuery(q)
  }

  const playTrack = (track) => {
    setCurrentTrack(track)
    setOpen(false)
    saveRecent(track.title)
    setRecents(getRecent())
  }

  const handleKey = (e) => {
    if (e.key==='Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) playTrack(suggestions[activeIdx])
      else doSearch()
    } else if (e.key==='Escape') { setOpen(false); inputRef.current?.blur() }
    else if (e.key==='ArrowDown') { e.preventDefault(); setActiveIdx(i=>Math.min(i+1,suggestions.length-1)) }
    else if (e.key==='ArrowUp')   { e.preventDefault(); setActiveIdx(i=>Math.max(i-1,-1)) }
  }

  return (
    <header className="h-16 flex items-center px-5 gap-4 flex-shrink-0 z-30 relative"
      style={{background:'var(--player-bg)',borderBottom:'1px solid var(--glass-border)',backdropFilter:'blur(20px)'}}>
      {/* Nav */}
      <div className="flex gap-1.5">
        {[{icon:HiChevronLeft,fn:()=>window.history.back()},{icon:HiChevronRight,fn:()=>window.history.forward()}].map(({icon:Icon,fn},i)=>(
          <button key={i} onClick={fn} className="w-8 h-8 rounded-full flex items-center justify-center hover:text-white transition-colors"
            style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',color:'var(--color-on-surface-muted)'}}>
            <Icon className="text-sm"/>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl relative" ref={dropRef}>
        <div className="relative">
          {loading
            ? <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:'var(--color-primary)'}}/>
            : <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{color:'var(--color-on-surface-muted)'}}/>
          }
          <input ref={inputRef} type="text" value={query}
            onChange={e=>handleChange(e.target.value)}
            onFocus={()=>setOpen(true)}
            onKeyDown={handleKey}
            placeholder="Search songs, artists..."
            className="w-full pl-10 pr-9 py-2.5 text-sm outline-none transition-all"
            style={{
              background: open ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
              border: `1px solid ${open ? 'color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'var(--glass-border)'}`,
              borderRadius: open ? '0.75rem 0.75rem 0 0' : '0.75rem',
              borderBottom: open ? '1px solid var(--glass-border)' : undefined,
              color: 'var(--color-on-surface)',
            }}
          />
          {query && <button onClick={()=>{setQuery('');setSugg([]);inputRef.current?.focus()}}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white transition-colors" style={{color:'var(--color-on-surface-muted)'}}>
            <HiX className="text-sm"/>
          </button>}
        </div>

        <AnimatePresence>
          {open && (
            <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:0.12}}
              className="absolute top-full left-0 right-0 z-50 overflow-hidden shadow-2xl"
              style={{background:'var(--color-surface-2)',border:'1px solid var(--glass-border)',borderTop:'none',borderRadius:'0 0 0.75rem 0.75rem'}}>

              {/* Live suggestions */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5" style={{color:'var(--color-on-surface-muted)'}}>Songs</p>
                  {suggestions.map((t,i)=>(
                    <motion.div key={t.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0,transition:{delay:i*0.03}}}
                      onClick={()=>playTrack(t)}
                      className="flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer group hover:text-white transition-all"
                      style={{background:activeIdx===i?'var(--glass-bg)':'transparent',color:'var(--color-on-surface)'}}>
                      <img src={t.cover} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                        onError={e=>e.target.src='https://placehold.co/36x36/161622/0DFFB0?text=♫'}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs truncate" style={{color:'var(--color-on-surface-muted)'}}>{t.artist}</p>
                      </div>
                      <span className="text-xs opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-full transition-opacity"
                        style={{background:'var(--color-primary)',color:'var(--color-surface)'}}>▶ Play</span>
                    </motion.div>
                  ))}
                  {query && (
                    <button onClick={()=>doSearch()} className="w-full flex items-center gap-2 px-2 py-2.5 rounded-xl text-sm transition-colors" style={{color:'var(--color-primary)'}}>
                      <HiSearch/> Search all results for <strong>"{query}"</strong>
                    </button>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!query && (
                <div className="p-2">
                  {recents.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5" style={{color:'var(--color-on-surface-muted)'}}>Recent</p>
                      {recents.map(r=>(
                        <div key={r} onClick={()=>doSearch(r)} className="flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer hover:text-white group" style={{color:'var(--color-on-surface-muted)'}}>
                          <HiClock className="text-sm flex-shrink-0"/>
                          <span className="flex-1 text-sm">{r}</span>
                          <button onClick={e=>{e.stopPropagation();removeRecent(r);setRecents(getRecent())}} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
                            <HiX className="text-xs"/>
                          </button>
                        </div>
                      ))}
                      <div className="border-t my-1" style={{borderColor:'var(--glass-border)'}}/>
                    </>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 flex items-center gap-1" style={{color:'var(--color-on-surface-muted)'}}><HiFire style={{color:'#FB923C'}}/>Trending</p>
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {TRENDING.map(t=>(
                      <button key={t} onClick={()=>doSearch(t)} className="text-left text-xs px-2 py-1.5 rounded-lg hover:text-white transition-colors truncate" style={{color:'var(--color-on-surface-muted)'}}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {query && suggestions.length===0 && !loading && (
                <div className="p-4 text-center text-sm" style={{color:'var(--color-on-surface-muted)'}}>
                  No suggestions — <button onClick={()=>doSearch()} style={{color:'var(--color-primary)'}}>search anyway</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1"/>
      {/* Settings link */}
      <button onClick={()=>navigate('/settings')} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
        style={{background:'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',color:'var(--color-surface)'}}>
        M
      </button>
    </header>
  )
}
