import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft, HiPlay, HiHeart, HiDownload, HiClock, HiCheck } from 'react-icons/hi'
import { MdShuffle } from 'react-icons/md'
import { useQuery } from '@tanstack/react-query'
import { deezerAlbum, normalizeDeezer, resolveStream } from '../services/api'
import { useStore } from '../store'
import { fmt } from '../utils/helpers'
import toast from 'react-hot-toast'

const RowSk = () => (
  <div className="grid gap-4 px-4 py-3 items-center" style={{ gridTemplateColumns: '32px 1fr 52px 44px' }}>
    <div className="h-3 shimmer rounded"/>
    <div className="flex items-center gap-3"><div className="w-10 h-10 shimmer rounded-lg flex-shrink-0"/><div className="flex-1"><div className="h-3.5 shimmer rounded w-2/3 mb-1.5"/><div className="h-3 shimmer rounded w-1/3"/></div></div>
    <div className="h-3 shimmer rounded"/>
    <div className="h-3 shimmer rounded"/>
  </div>
)

export default function AlbumPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)
  const [dlDone, setDlDone] = useState(false)
  const { setQueue, currentTrack, isPlaying, togglePlay, toggleFavorite, isFavorite } = useStore()

  const { data: album, isLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: () => deezerAlbum(id),
    staleTime: 15 * 60 * 1000,
  })

  const tracks = album?.tracks?.data
    ? album.tracks.data.map(t =>
        normalizeDeezer({
          ...t,
          album: { title: album.title, cover_xl: album.cover_xl, cover_big: album.cover_big, cover_medium: album.cover_medium },
        })
      )
    : []

  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0)
  const releaseYear = album?.release_date ? new Date(album.release_date).getFullYear() : ''

  // Download all tracks in the album one by one
  const downloadAll = async () => {
    if (!tracks.length) return
    setDownloading(true)
    const tid = toast.loading(`Resolving streams for ${tracks.length} tracks…`)

    let downloaded = 0
    for (const track of tracks) {
      try {
        toast.loading(`Downloading ${downloaded + 1}/${tracks.length}: ${track.title}`, { id: tid })
        const url = await resolveStream(track)
        if (url) {
          const a = document.createElement('a')
          a.href = url
          a.download = `${track.title.replace(/[^a-zA-Z0-9 ]/g, '')}.m4a`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          downloaded++
          // Small delay between downloads to not overwhelm browser
          await new Promise(r => setTimeout(r, 800))
        }
      } catch {}
    }

    toast.success(`Downloaded ${downloaded}/${tracks.length} tracks!`, { id: tid, duration: 4000 })
    setDownloading(false)
    setDlDone(true)
    setTimeout(() => setDlDone(false), 5000)
  }

  if (isLoading) return <AlbumSkeleton/>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-6">

      {/* Header */}
      <div className="px-4 sm:px-6 pt-5 pb-0">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm mb-5 transition-colors hover:text-white"
          style={{ color: 'var(--color-on-surface-muted)' }}>
          <HiArrowLeft/> Back
        </button>
      </div>

      {/* Album info */}
      <div className="flex flex-col sm:flex-row gap-5 px-4 sm:px-6 mb-6">
        <motion.div className="flex-shrink-0 self-center sm:self-auto" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <img src={album?.cover_xl || album?.cover_big || album?.cover_medium || ''}
            alt={album?.title}
            className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl object-cover shadow-2xl"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            onError={e => e.target.src='https://placehold.co/208x208/161622/0DFFB0?text=♫'}/>
        </motion.div>

        <motion.div className="flex flex-col justify-end gap-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-on-surface-muted)' }}>Album</p>
          <h1 className="text-xl sm:text-3xl font-display font-extrabold leading-tight">{album?.title}</h1>

          <div className="flex items-center gap-2 flex-wrap text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
            {album?.artist && (
              <button className="font-semibold hover:underline" style={{ color: 'var(--color-on-surface)' }}
                onClick={() => navigate(`/artist/${album.artist.id}`)}>
                {album.artist.name}
              </button>
            )}
            {releaseYear && <><span>·</span><span>{releaseYear}</span></>}
            <span>·</span>
            <span>{tracks.length} songs</span>
            {totalDuration > 0 && <><span>·</span><span>{fmt(totalDuration)}</span></>}
          </div>

          {/* Genres */}
          {album?.genres?.data?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {album.genres.data.map(g => (
                <span key={g.id} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--glass-bg)', color: 'var(--color-on-surface-muted)', border: '1px solid var(--glass-border)' }}>
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-1">
            <button className="btn-primary text-sm px-5 py-2 flex items-center gap-2"
              onClick={() => tracks.length && setQueue(tracks, 0)}>
              <HiPlay/> Play All
            </button>
            <button className="btn-ghost text-sm px-4 py-2 flex items-center gap-2"
              onClick={() => tracks.length && setQueue([...tracks].sort(() => Math.random()-0.5), 0)}>
              <MdShuffle/> Shuffle
            </button>

            {/* Download ALL button */}
            <button
              onClick={downloadAll}
              disabled={downloading || tracks.length === 0}
              className="btn-ghost text-sm px-4 py-2 flex items-center gap-2 transition-all"
              style={{
                borderColor: dlDone ? 'var(--color-primary)' : undefined,
                color: dlDone ? 'var(--color-primary)' : undefined,
                opacity: downloading ? 0.7 : 1,
              }}>
              {downloading
                ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Downloading…</>
                : dlDone
                  ? <><HiCheck/> Downloaded!</>
                  : <><HiDownload/> Download All</>
              }
            </button>
          </div>
        </motion.div>
      </div>

      {/* Tracklist */}
      <div className="px-2 sm:px-4">
        {/* Header row */}
        <div className="grid gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wider hidden sm:grid"
          style={{ gridTemplateColumns: '32px 1fr 52px 44px', color: 'var(--color-on-surface-muted)', borderBottom: '1px solid var(--glass-border)' }}>
          <span className="text-center">#</span>
          <span>Title</span>
          <span className="flex items-center justify-end gap-1"><HiClock/></span>
          <span/>
        </div>

        {tracks.length === 0 && !isLoading ? (
          <div className="text-center py-16" style={{ color: 'var(--color-on-surface-muted)' }}>
            <div className="text-5xl mb-3">💿</div>
            <p>No tracks found for this album</p>
          </div>
        ) : (
          tracks.map((track, i) => (
            <AlbumTrackRow key={track.id} track={track} index={i}
              isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying}
              onPlay={() => setQueue(tracks, i)} onToggle={togglePlay}
              isFav={isFavorite(track.id)} onFav={() => toggleFavorite(track)}/>
          ))
        )}
      </div>

      {/* Footer info */}
      {album?.release_date && (
        <div className="px-4 sm:px-6 mt-6 text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
          <p>Released {new Date(album.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          {album.label && <p className="mt-0.5">© {releaseYear} {album.label}</p>}
        </div>
      )}
    </motion.div>
  )
}

function AlbumTrackRow({ track, index, isCurrent, isPlaying, onPlay, onToggle, isFav, onFav }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.02 } }}
      onDoubleClick={onPlay}
      className="grid items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl cursor-pointer group transition-colors"
      style={{ gridTemplateColumns: '32px 1fr 52px 44px' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

      {/* Index / play */}
      <div className="flex items-center justify-center">
        {isCurrent
          ? <button onClick={onToggle} style={{ color: 'var(--color-primary)' }}>
              {isPlaying
                ? <div className="flex gap-0.5 items-end h-4">{[0,1,2].map(i=><div key={i} className="waveform-bar w-0.5" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
                : <HiPlay className="text-base"/>}
            </button>
          : <>
              <span className="text-sm group-hover:hidden" style={{ color: 'var(--color-on-surface-muted)' }}>{index + 1}</span>
              <button className="hidden group-hover:block" onClick={onPlay}><HiPlay className="text-base"/></button>
            </>
        }
      </div>

      {/* Title */}
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate leading-tight ${isCurrent ? 'neon-text' : ''}`}>{track.title}</p>
        <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-muted)' }}>{track.artist}</p>
      </div>

      {/* Duration */}
      <p className="text-sm text-right" style={{ color: 'var(--color-on-surface-muted)' }}>{fmt(track.duration)}</p>

      {/* Fav */}
      <button onClick={onFav} className="flex items-center justify-center transition-colors"
        style={{ color: isFav ? '#F87171' : 'var(--color-on-surface-muted)' }}>
        <HiHeart className={`text-base ${isFav ? 'fill-current' : ''}`}/>
      </button>
    </motion.div>
  )
}

function AlbumSkeleton() {
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="w-52 h-52 shimmer rounded-2xl flex-shrink-0"/>
        <div className="flex-1 flex flex-col justify-end gap-3">
          <div className="h-3 shimmer rounded w-16"/>
          <div className="h-9 shimmer rounded w-2/3"/>
          <div className="h-4 shimmer rounded w-1/3"/>
          <div className="flex gap-3 mt-2">
            <div className="h-10 shimmer rounded-full w-28"/>
            <div className="h-10 shimmer rounded-full w-28"/>
            <div className="h-10 shimmer rounded-full w-36"/>
          </div>
        </div>
      </div>
      {Array(8).fill(0).map((_,i) => <RowSk key={i}/>)}
    </div>
  )
}
