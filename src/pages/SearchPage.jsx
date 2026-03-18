import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSearch, HiX, HiPlay, HiUserGroup } from 'react-icons/hi'
import { MdAlbum } from 'react-icons/md'
import { searchAll, deezerSearch, normalizeDeezer } from '../services/api'
import { useStore } from '../store'
import TrackCard from '../components/ui/TrackCard'

const CATS = [
  {label:'Rai Algérien',  color:'#F43F5E', emoji:'🎵'},
  {label:'Amazigh',       color:'#8B5CF6', emoji:'🏔️'},
  {label:'Chaabi DZ',     color:'#10B981', emoji:'🎸'},
  {label:'DZ Rap',        color:'#F97316', emoji:'🎤'},
  {label:'Arabic Pop',    color:'#EAB308', emoji:'🌟'},
  {label:'Gnawa',         color:'#3B82F6', emoji:'🥁'},
  {label:'Malouf',        color:'#EC4899', emoji:'🎻'},
  {label:'Hawzi',         color:'#A855F7', emoji:'🎶'},
  {label:'Kabyle',        color:'#06B6D4', emoji:'⛰️'},
  {label:'Andalusian',    color:'#EF4444', emoji:'🕌'},
  {label:'North Africa',  color:'#F59E0B', emoji:'🌍'},
  {label:'Arab Electronic',color:'#6366F1',emoji:'🎛️'},
]

const Sk = () => <div className="card p-2.5"><div className="aspect-square shimmer rounded-xl mb-2"/><div className="h-3.5 shimmer rounded w-3/4 mb-1.5"/><div className="h-3 shimmer rounded w-1/2"/></div>

export default function SearchPage() {
  const [params] = useSearchParams()
  const initQ = params.get('q') || ''
  const [query, setQuery]   = useState(initQ)
  const [tracks, setTracks] = useState([])
  const [artists, setArtists] = useState([])
  const [albums, setAlbums]   = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!initQ)
  const [filter, setFilter]   = useState('all') // 'all' | 'songs' | 'artists' | 'albums'
  const navigate = useNavigate()
  const timerRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setTracks([]); setArtists([]); setAlbums([]); setSearched(false); return }
    setLoading(true); setSearched(true)
    try {
      const [tracksRes, artistsRes, albumsRes] = await Promise.allSettled([
        searchAll(q, 20),
        deezerSearch(q, 'artist'),
        deezerSearch(q, 'album'),
      ])
      setTracks(tracksRes.status === 'fulfilled' ? tracksRes.value : [])
      setArtists(artistsRes.status === 'fulfilled' ? (artistsRes.value || []).slice(0, 12) : [])
      setAlbums(albumsRes.status === 'fulfilled' ? (albumsRes.value || []).slice(0, 12) : [])
    } catch { setTracks([]); setArtists([]); setAlbums([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (initQ) doSearch(initQ) }, [initQ])

  const handleInput = (v) => {
    setQuery(v)
    navigate(v ? `/search?q=${encodeURIComponent(v)}` : '/search', { replace: true })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(v), 450)
  }

  const hasResults = tracks.length > 0 || artists.length > 0 || albums.length > 0
  const showSongs   = filter === 'all' || filter === 'songs'
  const showArtists = filter === 'all' || filter === 'artists'
  const showAlbums  = filter === 'all' || filter === 'albums'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-6 pb-8">
      <h1 className="text-2xl sm:text-3xl font-display font-extrabold mb-4">Search</h1>

      {/* Search input */}
      <div className="relative max-w-2xl mb-6">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base" style={{ color: 'var(--color-on-surface-muted)' }}/>
        <input value={query} onChange={e => handleInput(e.target.value)}
          placeholder="Search songs, artists, albums…"
          className="w-full pl-11 pr-11 py-3.5 text-base outline-none rounded-2xl transition-all"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--glass-border)', color: 'var(--color-on-surface)' }}
          onFocus={e => e.target.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)'}
          onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
          autoFocus={!initQ}/>
        {query && (
          <button onClick={() => handleInput('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-white transition-colors"
            style={{ color: 'var(--color-on-surface-muted)' }}>
            <HiX className="text-base"/>
          </button>
        )}
      </div>

      {/* Filter tabs - shown after search */}
      {searched && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'all', label: 'All' },
            { id: 'songs', label: `Songs${tracks.length ? ` (${tracks.length})` : ''}` },
            { id: 'artists', label: `Artists${artists.length ? ` (${artists.length})` : ''}` },
            { id: 'albums', label: `Albums${albums.length ? ` (${albums.length})` : ''}` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={{
                background: filter === f.id ? 'var(--color-primary)' : 'var(--glass-bg)',
                color: filter === f.id ? 'var(--color-surface)' : 'var(--color-on-surface-muted)',
                border: `1px solid ${filter === f.id ? 'var(--color-primary)' : 'var(--glass-border)'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Browse categories */}
        {!searched && (
          <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-base font-bold mb-4">Browse Algerian Music</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {CATS.map((c, i) => (
                <motion.button key={c.label}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.03 } }}
                  whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleInput(c.label)}
                  className="h-20 sm:h-24 rounded-2xl relative flex items-end p-3 sm:p-4 overflow-hidden text-left"
                  style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${c.color} 30%, var(--color-surface-2)), var(--color-surface-2))`, border: `1px solid color-mix(in srgb, ${c.color} 25%, transparent)` }}>
                  <span className="absolute top-2.5 right-3 text-xl sm:text-2xl">{c.emoji}</span>
                  <span className="font-display font-bold text-xs sm:text-sm leading-tight">{c.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array(10).fill(0).map((_,i) => <Sk key={i}/>)}
            </div>
          </motion.div>
        )}

        {/* No results */}
        {searched && !loading && !hasResults && (
          <motion.div key="empty" className="flex flex-col items-center py-20 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-6xl">🔍</div>
            <p className="text-xl font-display font-bold">No results for "{query}"</p>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>Try different keywords</p>
          </motion.div>
        )}

        {/* Results */}
        {searched && !loading && hasResults && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

            {/* Artists */}
            {showArtists && artists.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg font-display font-bold mb-4 flex items-center gap-2">
                  <HiUserGroup style={{ color: 'var(--color-primary)' }}/> Artists
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                  {artists.map((a, i) => (
                    <ArtistCard key={a.id} artist={a} index={i} navigate={navigate}/>
                  ))}
                </div>
              </section>
            )}

            {/* Albums */}
            {showAlbums && albums.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg font-display font-bold mb-4 flex items-center gap-2">
                  <MdAlbum style={{ color: 'var(--color-secondary)' }}/> Albums
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {albums.map((a, i) => (
                    <AlbumCard key={a.id} album={a} index={i} navigate={navigate}/>
                  ))}
                </div>
              </section>
            )}

            {/* Songs */}
            {showSongs && tracks.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg font-display font-bold mb-4 flex items-center gap-2">
                  🎵 Songs <span className="text-sm font-normal" style={{ color: 'var(--color-on-surface-muted)' }}>({tracks.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {tracks.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.02 } }}>
                      <TrackCard track={t} queue={tracks} index={i}/>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ArtistCard({ artist, index, navigate }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.04 } }}
      whileTap={{ scale: 0.96 }}
      className="flex flex-col items-center gap-2 cursor-pointer group"
      onClick={() => navigate(`/artist/${artist.id}`)}>
      <div className="relative w-full aspect-square">
        <img src={artist.picture_xl || artist.picture_big || artist.picture_medium || artist.picture || ''}
          alt={artist.name}
          className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
          onError={e => e.target.src = `https://placehold.co/200x200/161622/0DFFB0?text=${encodeURIComponent((artist.name||'?')[0].toUpperCase())}`}/>
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ boxShadow: 'inset 0 0 0 2px var(--color-primary)' }}/>
        {/* Play on hover */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <HiPlay style={{ color: 'var(--color-primary)', fontSize: 28 }}/>
        </div>
      </div>
      <div className="text-center w-full">
        <p className="text-xs sm:text-sm font-semibold truncate">{artist.name}</p>
        <p className="text-[10px] sm:text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>Artist</p>
      </div>
    </motion.div>
  )
}

function AlbumCard({ album, index, navigate }) {
  const year = album.release_date ? new Date(album.release_date).getFullYear() : ''
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.03 } }}
      whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
      className="cursor-pointer group" onClick={() => navigate(`/album/${album.id}`)}>
      <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
        <img src={album.cover_xl || album.cover_big || album.cover_medium || ''} alt={album.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => e.target.src='https://placehold.co/200x200/161622/0DFFB0?text=♫'}/>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}>
            <HiPlay style={{ color: 'var(--color-surface)', fontSize: 16, marginLeft: 2 }}/>
          </div>
        </div>
      </div>
      <p className="text-xs sm:text-sm font-semibold truncate leading-tight">{album.title}</p>
      <p className="text-[10px] sm:text-xs truncate mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>
        {album.artist?.name}{year ? ` · ${year}` : ''}
      </p>
    </motion.div>
  )
}
