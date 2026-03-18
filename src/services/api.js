import axios from 'axios'

const B = '/api'   // backend base

// ── Session caches ─────────────────────────────────────────────────────────────
const streamCache  = new Map()
const lyricsCache  = new Map()
const searchCache  = new Map()

// ── Deezer (direct from browser — metadata/browse only, NO streaming) ──────────
const DZ = 'https://api.deezer.com'
const dz = async (path, params = {}) => {
  try {
    const r = await axios.get(`${DZ}${path}`, { params, timeout: 8000 })
    return r.data
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export const normalizeDeezer = (t) => ({
  id:        `dz_${t.id}`,
  source:    'deezer',
  title:     t.title || t.name || 'Unknown',
  artist:    t.artist?.name || 'Unknown',
  album:     t.album?.title || '',
  duration:  t.duration || 0,
  cover:     t.album?.cover_xl || t.album?.cover_big || t.album?.cover_medium || '',
  streamUrl: null,
  videoId:   null,
})

export const normalizeYT = (t) => {
  const vid = t.videoId || t.id?.videoId || t.id || ''
  return {
    id:        `yt_${vid}`,
    source:    'youtube',
    title:     t.title || 'Unknown',
    artist:    t.author?.name || t.author || t.channelTitle || t.artist || '',
    album:     '',
    duration:  t.seconds || t.duration || 0,
    cover:     t.thumbnail || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
    streamUrl: null,
    videoId:   vid,
  }
}

export const normalizeSaavn = (s) => {
  const artist = Array.isArray(s.artists?.primary)
    ? s.artists.primary.map(a => a.name).join(', ')
    : s.primaryArtists || s.artist || 'Unknown'
  const dl = s.downloadUrl || []
  let streamUrl = null
  for (let i = dl.length - 1; i >= 0; i--) {
    const u = dl[i]?.url || dl[i]?.link || (typeof dl[i] === 'string' ? dl[i] : null)
    if (u?.startsWith('http')) { streamUrl = u; break }
  }
  return {
    id:        `js_${s.id}`,
    source:    'jiosaavn',
    title:     s.name || s.title || s.song || 'Unknown',
    artist,
    album:     s.album?.name || s.album || '',
    duration:  parseInt(s.duration) || 0,
    cover:     s.image?.[2]?.url || s.image?.[2]?.link || s.image?.[1]?.url || '',
    streamUrl,
    videoId:   null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAM RESOLVER — calls backend which handles all the hard work
// ─────────────────────────────────────────────────────────────────────────────
export const resolveStream = async (track) => {
  const key = track.id
  if (streamCache.has(key)) return streamCache.get(key)

  // JioSaavn tracks already have URL embedded from search
  if (track.source === 'jiosaavn' && track.streamUrl) {
    streamCache.set(key, track.streamUrl)
    return track.streamUrl
  }

  try {
    // Ask backend to resolve the stream (it tries JioSaavn → YouTube/Invidious)
    const res = await axios.get(`${B}/stream`, {
      params: {
        title:  track.title,
        artist: track.artist,
        source: track.source,
      },
      timeout: 20000,
    })
    const url = res.data?.url
    if (url) {
      streamCache.set(key, url)
      return url
    }
  } catch (e) {
    console.warn('[resolveStream] Backend failed:', e.message)
  }

  // If it's a YouTube track and backend failed, try a direct videoId lookup
  if (track.videoId) {
    try {
      const res = await axios.get(`${B}/stream/${track.videoId}`, { timeout: 15000 })
      const url = res.data?.url
      if (url) { streamCache.set(key, url); return url }
    } catch {}
  }

  streamCache.set(key, null)
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH — backend handles JioSaavn + YouTube
// ─────────────────────────────────────────────────────────────────────────────
export const searchAll = async (query, limit = 20) => {
  const key = `${query}_${limit}`
  if (searchCache.has(key)) return searchCache.get(key)

  try {
    const res = await axios.get(`${B}/search`, { params: { q: query, limit }, timeout: 12000 })
    const tracks = res.data?.tracks || []
    searchCache.set(key, tracks)
    return tracks
  } catch (e) {
    console.warn('[searchAll] Backend failed:', e.message)
    return []
  }
}

export const searchYouTube = searchAll  // alias for compatibility

// ─────────────────────────────────────────────────────────────────────────────
// CHART (Deezer trending — backend proxies it)
// ─────────────────────────────────────────────────────────────────────────────
export const getChart = async () => {
  try {
    const res = await axios.get(`${B}/chart`, { timeout: 8000 })
    return res.data?.tracks || []
  } catch {
    // Fallback: direct Deezer (CORS may block on some browsers)
    try {
      const r = await dz('/chart')
      return (r?.tracks?.data || []).map(normalizeDeezer)
    } catch { return [] }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DEEZER — browse/metadata (artist, album, chart, search artists/albums)
// ─────────────────────────────────────────────────────────────────────────────
export const deezerSearch = async (query, type = 'track') => {
  const ep = type === 'artist' ? '/search/artist' : type === 'album' ? '/search/album' : '/search'
  const r  = await dz(`${ep}?q=${encodeURIComponent(query)}&limit=25`)
  return r?.data || []
}

export const deezerArtist = async (id) => dz(`/artist/${id}`)

export const deezerArtistTracks = async (id) => {
  const r = await dz(`/artist/${id}/top?limit=20`)
  return (r?.data || []).map(normalizeDeezer)
}

export const deezerArtistAlbums = async (id) => {
  const r = await dz(`/artist/${id}/albums?limit=20`)
  return r?.data || []
}

export const deezerAlbum = async (id) => dz(`/album/${id}`)

// ─────────────────────────────────────────────────────────────────────────────
// LYRICS — browser-direct, free sources
// ─────────────────────────────────────────────────────────────────────────────
export const getLyrics = async (artist, title) => {
  const key = `${artist}_${title}`.toLowerCase()
  if (lyricsCache.has(key)) return lyricsCache.get(key)

  const c  = (s) => s.replace(/\(.*?\)/g,'').replace(/\[.*?\]/g,'').replace(/feat\..*/i,'').trim()
  const ct = c(title)
  const ca = artist.split(/[,&]/)[0].trim()

  const parse = (raw, src) => ({
    lines: raw.replace(/\r\n/g,'\n').split('\n')
      .map(l => l.replace(/^\[\d{2}:\d{2}[.:]\d{2,3}\]\s*/g,'').trim())
      .filter((l,i,a) => !(l==='' && i>0 && a[i-1]===''))
      .filter(l => !/^\d+Embed$/i.test(l) && l !== 'Embed'),
    source: src,
  })

  // 1. lrclib.net — great synced lyrics, free, CORS-ok
  try {
    const r = await axios.get('https://lrclib.net/api/search', {
      params: { track_name: ct, artist_name: ca }, timeout: 7000
    })
    const best = (r.data || []).find(x => x.plainLyrics?.length > 60 || x.syncedLyrics?.length > 60)
    if (best?.plainLyrics?.length > 60) {
      const result = parse(best.plainLyrics, 'LRCLib')
      lyricsCache.set(key, result); return result
    }
    if (best?.syncedLyrics?.length > 60) {
      const result = parse(best.syncedLyrics, 'LRCLib')
      lyricsCache.set(key, result); return result
    }
  } catch {}

  // 2. lyrics.ovh — free, no key needed
  try {
    const r = await axios.get(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(ca)}/${encodeURIComponent(ct)}`,
      { timeout: 7000 }
    )
    if (r.data?.lyrics?.length > 60) {
      const result = parse(r.data.lyrics, 'Lyrics.ovh')
      lyricsCache.set(key, result); return result
    }
  } catch {}

  // 3. Backend (tries Musixmatch if key set in .env)
  try {
    const r = await axios.get(`${B}/lyrics`, {
      params: { artist: ca, title: ct }, timeout: 8000
    })
    if (r.data?.lines?.length > 3) {
      lyricsCache.set(key, r.data); return r.data
    }
  } catch {}

  lyricsCache.set(key, null)
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────
export const downloadTrack = (track) => {
  const params = new URLSearchParams({
    title:   track.title || '',
    artist:  track.artist || '',
    ...(track.videoId ? { videoId: track.videoId } : {}),
  })
  const a = document.createElement('a')
  a.href  = `${B}/download?${params}`
  a.download = `${track.title || 'audio'}.m4a`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT FROM URL (YouTube video or playlist)
// ─────────────────────────────────────────────────────────────────────────────
export const importFromUrl = async (url) => {
  // Extract video ID from youtu.be or youtube.com/watch
  const videoMatch = url.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/)
  // Extract playlist ID
  const playlistMatch = url.match(/[?&]list=([A-Za-z0-9_-]+)/)

  if (playlistMatch) {
    // Fetch playlist via backend search (we search YT for the playlist name)
    try {
      const playlistId = playlistMatch[1]
      // Use yt-search via backend to get playlist info
      const res = await axios.get(`${B}/search`, {
        params: { q: `playlist:${playlistId}`, limit: 20 },
        timeout: 15000,
      })
      const tracks = res.data?.tracks || []
      if (tracks.length > 0) {
        return { type: 'playlist', name: 'YouTube Playlist', tracks, cover: tracks[0]?.cover || '' }
      }
      // fallback: search for generic results
      return { type: 'playlist', name: 'Imported Playlist', tracks: [], cover: '' }
    } catch {
      return { type: 'playlist', name: 'YouTube Playlist', tracks: [], cover: '' }
    }
  }

  if (videoMatch) {
    const videoId = videoMatch[1]
    // Single video
    const track = {
      id:        `yt_${videoId}`,
      source:    'youtube',
      title:     'YouTube Video',
      artist:    '',
      album:     '',
      duration:  0,
      cover:     `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      streamUrl: null,
      videoId,
    }
    return { type: 'track', track }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// parseLRC — parse synced LRC lyrics format into timed array
// ─────────────────────────────────────────────────────────────────────────────
export const parseLRC = (lrcText) => {
  if (!lrcText) return []
  return lrcText.split('\n')
    .map(line => {
      const m = line.match(/^\[(\d{2}):(\d{2})[.:](\d{2,3})\]\s*(.*)$/)
      if (!m) return null
      const time = parseInt(m[1]) * 60 + parseFloat(`${m[2]}.${m[3]}`)
      return { time, text: m[4].trim() }
    })
    .filter(Boolean)
    .filter(l => l.text.length > 0)
}
