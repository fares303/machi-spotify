import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSearch, HiX, HiClock, HiFire, HiChevronLeft } from 'react-icons/hi'
import { MdEqualizer } from 'react-icons/md'
import { searchAll } from '../../services/api'
import { useStore } from '../../store'

const RECENT_KEY = 'machi_searches'
const TRENDING_DZ = [
  'cheb khaled','rai algérien 2024','music amazigh','أغاني جزائرية',
  'cheb mami','amir','gnawa','chaabi algérien','dz rap','atlas',
]

const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]') } catch { return [] } }
const saveRecent = (q) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([q,...getRecent().filter(x=>x!==q)].slice(0,10))) } catch {}
}
const removeRecent = (q) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter(x=>x!==q))) } catch {}
}

// Standalone debounce (not from helpers to avoid stale closure issues)
function useDebouncedSearch(fn, delay) {
  const timer = useRef(null)
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

export default function TopBar() {
  const [query, setQuery]       = useState('')
  const [open, setOpen]         = useState(false)
  const [sugg, setSugg]         = useState([])
  const [recents, setRecents]   = useState(getRecent)
  const [loading, setLoading]   = useState(false)
  const [mobileSearch, setMobS] = useState(false)

  const inputRef  = useRef(null)
  const wrapRef   = useRef(null)
  const navigate  = useNavigate()
  const location  = useLocation()
  const { setCurrentTrack, isPlaying, currentTrack } = useStore()

  // Close on route change
  useEffect(() => { setOpen(false); setMobS(false) }, [location.pathname])

  // Close on outside click
  useEffect(() => {
    const h = e => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Fetch suggestions
  const fetchSugg = useDebouncedSearch(async (q) => {
    if (!q || q.trim().length < 2) { setSugg([]); setLoading(false); return }
    setLoading(true)
    try {
      const items = await searchAll(q.trim(), 6)
      setSugg(items.slice(0, 6))
    } catch {
      setSugg([])
    } finally {
      setLoading(false)
    }
  }, 350)

  const handleChange = (v) => {
    setQuery(v)
    setOpen(true)
    if (v.trim().length >= 2) {
      setLoading(true) // show spinner immediately
      fetchSugg(v)
    } else {
      setSugg([])
      setLoading(false)
    }
  }

  const doSearch = (q) => {
    const term = (q || query).trim()
    if (!term) return
    saveRecent(term)
    setRecents(getRecent())
    setQuery(term)
    setOpen(false)
    setMobS(false)
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  const playTrack = (t) => {
    setCurrentTrack(t)
    saveRecent(t.title)
    setRecents(getRecent())
    setOpen(false)
    setMobS(false)
    setSugg([])
    setQuery('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') doSearch()
    if (e.key === 'Escape') { setOpen(false); setMobS(false) }
  }

  const SearchDropdown = ({ mobile = false }) => (
    <div className={`${mobile ? '' : 'absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl shadow-2xl overflow-hidden'}`}
      style={mobile ? {} : { background: 'var(--color-surface-3)', border: '1px solid var(--glass-border)' }}>
      <div className="p-2 max-h-80 overflow-y-auto" style={mobile ? {} : {}}>
        {loading && (
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}/>
            <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>Searching…</span>
          </div>
        )}

        {!loading && sugg.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5" style={{ color: 'var(--color-on-surface-muted)' }}>Songs</p>
            {sugg.map((t, i) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03 } }}
                onMouseDown={e => { e.preventDefault(); playTrack(t) }} // mousedown not click - prevents blur closing dropdown first
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors active:opacity-70"
                style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <img src={t.cover} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                  onError={e => e.target.src='https://placehold.co/36x36/161622/0DFFB0?text=♫'}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{t.title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-muted)' }}>{t.artist}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:block"
                  style={{ background: 'var(--glass-bg)', color: 'var(--color-on-surface-muted)', border: '1px solid var(--glass-border)' }}>
                  ▶ Play
                </span>
              </motion.div>
            ))}
            <div className="border-t my-1.5" style={{ borderColor: 'var(--glass-border)' }}/>
            <button onMouseDown={e => { e.preventDefault(); doSearch() }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
              style={{ color: 'var(--color-primary)' }}>
              <HiSearch className="flex-shrink-0"/> Search all for <strong className="ml-1 truncate">"{query}"</strong>
            </button>
          </>
        )}

        {!loading && sugg.length === 0 && (
          <>
            {recents.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5" style={{ color: 'var(--color-on-surface-muted)' }}>Recent</p>
                {recents.map(r => (
                  <div key={r}
                    onMouseDown={e => { e.preventDefault(); doSearch(r) }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <HiClock className="text-base flex-shrink-0" style={{ color: 'var(--color-on-surface-muted)' }}/>
                    <span className="flex-1 text-sm truncate">{r}</span>
                    <button
                      onMouseDown={e => { e.stopPropagation(); e.preventDefault(); removeRecent(r); setRecents(getRecent()) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs p-1"
                      style={{ color: 'var(--color-on-surface-muted)' }}>
                      <HiX/>
                    </button>
                  </div>
                ))}
                <div className="border-t my-1.5" style={{ borderColor: 'var(--glass-border)' }}/>
              </>
            )}
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-muted)' }}>
              <HiFire className="text-orange-400"/> Trending in Algeria 🇩🇿
            </p>
            <div className="grid grid-cols-2 gap-1 px-1 pb-1">
              {TRENDING_DZ.map(t => (
                <button key={t} onMouseDown={e => { e.preventDefault(); doSearch(t) }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors"
                  style={{ background: 'var(--glass-bg)', color: 'var(--color-on-surface)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  🎵 <span className="truncate">{t}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      <header className="flex-shrink-0 h-14 flex items-center px-3 sm:px-4 gap-3 z-30"
        style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--glass-border)' }}>

        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2 flex-shrink-0">
          <motion.div animate={{ rotate: isPlaying ? 360 : 0 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'var(--color-surface)' }}>
            M
          </motion.div>
          <span className="font-display font-extrabold text-sm gradient-text">Machi Spotify</span>
        </div>

        {/* Desktop back button */}
        <button onClick={() => window.history.back()}
          className="hidden md:flex w-8 h-8 rounded-full items-center justify-center flex-shrink-0 transition-colors hover:text-white"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--color-on-surface-muted)' }}>
          <HiChevronLeft className="text-sm"/>
        </button>

        {/* Desktop search box */}
        <div ref={wrapRef} className="hidden md:flex flex-1 max-w-xl relative">
          <div className="relative w-full">
            {loading
              ? <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}/>
              : <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-on-surface-muted)' }}/>
            }
            <input
              ref={inputRef}
              value={query}
              onChange={e => handleChange(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKey}
              placeholder="Search Algerian music, artists…"
              className="w-full pl-9 pr-8 py-2 text-sm outline-none rounded-xl"
              style={{ background: 'var(--glass-bg)', border: `1px solid ${open ? 'var(--color-primary)' : 'var(--glass-border)'}`, color: 'var(--color-on-surface)', transition: 'border-color 0.15s' }}
            />
            {query && (
              <button onMouseDown={e => { e.preventDefault(); setQuery(''); setSugg([]); setLoading(false); inputRef.current?.focus() }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-on-surface-muted)' }}>
                <HiX className="text-sm"/>
              </button>
            )}
          </div>

          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}>
                <SearchDropdown/>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 md:flex-none"/>

        {/* Mobile search button */}
        <button className="flex md:hidden items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--color-on-surface-muted)' }}
          onClick={() => setMobS(true)}>
          <HiSearch className="text-base"/>
        </button>

        {/* Settings */}
        <button onClick={() => navigate('/settings')}
          className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 hover:text-white transition-colors"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--color-on-surface-muted)' }}>
          <MdEqualizer className="text-base"/>
        </button>
      </header>

      {/* Mobile full-screen search */}
      <AnimatePresence>
        {mobileSearch && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 flex flex-col md:hidden"
            style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <button onClick={() => { setMobS(false); setQuery('') }}
                className="p-2" style={{ color: 'var(--color-on-surface-muted)' }}>
                <HiChevronLeft className="text-xl"/>
              </button>
              <div className="relative flex-1">
                {loading
                  ? <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}/>
                  : <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-on-surface-muted)' }}/>
                }
                <input autoFocus value={query}
                  onChange={e => handleChange(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Search songs, artists…"
                  className="w-full pl-9 pr-9 py-3 text-base outline-none rounded-xl"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--glass-border)', color: 'var(--color-on-surface)' }}/>
                {query && (
                  <button onTouchStart={() => { setQuery(''); setSugg([]) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-on-surface-muted)' }}>
                    <HiX className="text-base"/>
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              <SearchDropdown mobile/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
