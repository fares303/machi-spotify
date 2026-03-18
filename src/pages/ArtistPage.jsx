import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiPlay, HiArrowLeft, HiHeart, HiClock } from 'react-icons/hi'
import { MdShuffle, MdAlbum } from 'react-icons/md'
import { useQuery } from '@tanstack/react-query'
import { deezerArtist, deezerArtistTracks, deezerArtistAlbums, normalizeDeezer } from '../services/api'
import { useStore } from '../store'
import TrackCard from '../components/UI/TrackCard'
import { fmt, fmtNum } from '../utils/helpers'

const Sk = () => <div className="card p-2.5"><div className="aspect-square shimmer rounded-xl mb-2"/><div className="h-3 shimmer rounded w-3/4 mb-1"/><div className="h-2.5 shimmer rounded w-1/2"/></div>
const RowSk = () => <div className="flex items-center gap-3 px-4 py-3"><div className="w-10 h-10 shimmer rounded-lg flex-shrink-0"/><div className="flex-1"><div className="h-3.5 shimmer rounded w-2/3 mb-1.5"/><div className="h-3 shimmer rounded w-1/3"/></div></div>

const TABS = ['Top Songs', 'Albums']

export default function ArtistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Top Songs')
  const { setQueue, currentTrack, isPlaying, togglePlay, toggleFavorite, isFavorite } = useStore()

  const { data: artist } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => deezerArtist(id),
    staleTime: 15 * 60 * 1000,
  })

  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['artist-tracks', id],
    queryFn: async () => {
      const raw = await deezerArtistTracks(id)
      return raw.map(normalizeDeezer)
    },
    staleTime: 10 * 60 * 1000,
  })

  const { data: albums = [], isLoading: albumsLoading } = useQuery({
    queryKey: ['artist-albums', id],
    queryFn: () => deezerArtistAlbums(id),
    staleTime: 10 * 60 * 1000,
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-4">

      {/* Hero */}
      <div className="relative min-h-[260px] sm:min-h-[320px] flex flex-col justify-end overflow-hidden">
        {/* Blurred bg image */}
        {artist?.picture_xl && (
          <div className="absolute inset-0">
            <img src={artist.picture_xl} alt="" className="w-full h-full object-cover object-top"
              style={{ filter: 'blur(3px) brightness(0.4)', transform: 'scale(1.08)' }}/>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, var(--color-surface) 100%)' }}/>

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}>
          <HiArrowLeft/> Back
        </button>

        {/* Info */}
        <div className="relative z-10 px-4 sm:px-6 pb-5 pt-20">
          {artist ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-end gap-4 mb-4">
                <img src={artist.picture_medium || artist.picture} alt={artist.name}
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover flex-shrink-0 border-2"
                  style={{ borderColor: 'var(--color-primary)', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                  onError={e => e.target.style.display='none'}/>
                <div className="min-w-0">
                  <p className="text-xs mb-1 font-semibold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>Artist</p>
                  <h1 className="text-2xl sm:text-4xl font-display font-extrabold leading-tight truncate">{artist.name}</h1>
                  {artist.nb_fan > 0 && (
                    <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>{fmtNum(artist.nb_fan)} fans</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary text-sm px-5 py-2 flex items-center gap-2"
                  onClick={() => tracks.length && setQueue(tracks, 0)}>
                  <HiPlay/> Play
                </button>
                <button className="btn-ghost text-sm px-5 py-2 flex items-center gap-2"
                  onClick={() => tracks.length && setQueue([...tracks].sort(() => Math.random()-0.5), 0)}>
                  <MdShuffle/> Shuffle
                </button>
              </div>
            </motion.div>
          ) : (
            <div>
              <div className="h-8 shimmer rounded w-48 mb-2"/>
              <div className="h-5 shimmer rounded w-32"/>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 sm:px-6 mt-4 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: tab === t ? 'var(--color-primary)' : 'var(--glass-bg)',
              color: tab === t ? 'var(--color-surface)' : 'var(--color-on-surface-muted)',
              border: `1px solid ${tab === t ? 'var(--color-primary)' : 'var(--glass-border)'}`,
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Top Songs */}
      {tab === 'Top Songs' && (
        <div className="px-2 sm:px-4">
          {/* Column header */}
          <div className="grid gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ gridTemplateColumns: '32px 1fr 48px 40px', color: 'var(--color-on-surface-muted)', borderBottom: '1px solid var(--glass-border)' }}>
            <span className="text-center">#</span>
            <span>Title</span>
            <span className="text-right flex items-center justify-end gap-1"><HiClock/></span>
            <span/>
          </div>
          {tracksLoading
            ? Array(8).fill(0).map((_,i) => <RowSk key={i}/>)
            : tracks.map((t, i) => (
                <ArtistTrackRow key={t.id} track={t} index={i}
                  isCurrent={currentTrack?.id === t.id} isPlaying={isPlaying}
                  onPlay={() => setQueue(tracks, i)} onToggle={togglePlay}
                  isFav={isFavorite(t.id)} onFav={() => toggleFavorite(t)}/>
              ))
          }
          {!tracksLoading && tracks.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--color-on-surface-muted)' }}>
              <div className="text-4xl mb-3">🎵</div>
              <p>No songs found</p>
            </div>
          )}
        </div>
      )}

      {/* Albums */}
      {tab === 'Albums' && (
        <div className="px-3 sm:px-6">
          {albumsLoading
            ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{Array(8).fill(0).map((_,i) => <Sk key={i}/>)}</div>
            : albums.length > 0
              ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {albums.map((a, i) => (
                    <AlbumCard key={a.id} album={a} index={i} navigate={navigate}/>
                  ))}
                </div>
              : <div className="text-center py-12" style={{ color: 'var(--color-on-surface-muted)' }}>
                  <div className="text-4xl mb-3">💿</div>
                  <p>No albums found</p>
                </div>
          }
        </div>
      )}
    </motion.div>
  )
}

function ArtistTrackRow({ track, index, isCurrent, isPlaying, onPlay, onToggle, isFav, onFav }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.02 } }}
      onDoubleClick={onPlay}
      className="grid items-center gap-4 px-4 py-2.5 rounded-xl cursor-pointer group transition-colors"
      style={{ gridTemplateColumns: '32px 1fr 48px 40px' }}
      onMouseEnter={e => e.currentTarget.style.background='var(--glass-bg)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <div className="flex items-center justify-center">
        {isCurrent
          ? <button onClick={onToggle} style={{ color: 'var(--color-primary)' }}>
              {isPlaying
                ? <div className="flex gap-0.5 items-end h-4">{[0,1,2].map(i=><div key={i} className="waveform-bar w-0.5" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
                : <HiPlay/>}
            </button>
          : <>
              <span className="text-sm group-hover:hidden" style={{ color: 'var(--color-on-surface-muted)' }}>{index + 1}</span>
              <button className="hidden group-hover:block" onClick={onPlay}><HiPlay className="text-sm"/></button>
            </>
        }
      </div>
      <div className="flex items-center gap-3 min-w-0">
        <img src={track.cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          onError={e => e.target.src='https://placehold.co/40x40/161622/0DFFB0?text=♫'}/>
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isCurrent ? 'neon-text' : ''}`}>{track.title}</p>
          <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-muted)' }}>{track.album}</p>
        </div>
      </div>
      <p className="text-sm text-right" style={{ color: 'var(--color-on-surface-muted)' }}>{fmt(track.duration)}</p>
      <button onClick={onFav} className="flex items-center justify-center transition-colors"
        style={{ color: isFav ? '#F87171' : 'var(--color-on-surface-muted)' }}>
        <HiHeart className={`text-base ${isFav ? 'fill-current' : ''}`}/>
      </button>
    </motion.div>
  )
}

function AlbumCard({ album, index, navigate }) {
  const year = album.release_date ? new Date(album.release_date).getFullYear() : ''
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.04 } }}
      whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
      className="cursor-pointer group" onClick={() => navigate(`/album/${album.id}`)}>
      <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
        <img src={album.cover_xl || album.cover_big || album.cover_medium || ''} alt={album.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => e.target.src='https://placehold.co/200x200/161622/0DFFB0?text=♫'}/>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-primary)', boxShadow: '0 0 20px color-mix(in srgb, var(--color-primary) 50%, transparent)' }}>
            <HiPlay style={{ color: 'var(--color-surface)', fontSize: 18, marginLeft: 2 }}/>
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold truncate leading-tight">{album.title}</p>
      <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--color-on-surface-muted)' }}>
        {year}{year && album.record_type ? ' · ' : ''}{album.record_type}
      </p>
    </motion.div>
  )
}
