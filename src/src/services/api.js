import axios from 'axios'

const API = '/api'

// ── In-memory stream cache ────────────────────────────────────────────────────
const streamCache = new Map()

// ── Normalize a raw YouTube/Piped track ──────────────────────────────────────
export const normalizeYT = (item) => {
  const id = item.id?.videoId || item.id || item.videoId || ''
  return {
    id:        `yt_${id}`,
    videoId:   id,
    source:    'youtube',
    title:     item.snippet?.title || item.title || 'Unknown',
    artist:    item.snippet?.channelTitle || item.channelTitle || item.artist || item.uploaderName || '',
    album:     item.album || '',
    duration:  item.duration || item.lengthSeconds || 0,
    cover:     item.snippet?.thumbnails?.high?.url
              || item.thumbnail
              || item.thumbnailUrl
              || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    streamUrl: null,
  }
}

// ── Search YouTube ────────────────────────────────────────────────────────────
export const searchYouTube = async (query, limit = 20) => {
  try {
    const res = await axios.get(`${API}/youtube/search`, { params: { q: query, limit }, timeout: 10000 })
    return (res.data?.items || []).map(normalizeYT)
  } catch { return [] }
}

// ── Resolve stream URL — backend → Piped fallback ─────────────────────────────
export const resolveStream = async (videoId, quality = 'high') => {
  const key = `${videoId}_${quality}`
  if (streamCache.has(key)) return streamCache.get(key)

  // 1. Backend ytdl
  try {
    const res = await axios.get(`${API}/youtube/stream/${videoId}`, {
      params: { quality }, timeout: 15000,
    })
    if (res.data?.url) {
      streamCache.set(key, res.data.url)
      return res.data.url
    }
  } catch (e) { console.warn('ytdl stream failed:', e.message) }

  // 2. Piped fallback (no backend needed)
  try {
    const res = await axios.get(`${API}/piped/stream/${videoId}`, { timeout: 10000 })
    if (res.data?.url) {
      streamCache.set(key, res.data.url)
      return res.data.url
    }
  } catch {}

  return null
}

// ── Get related videos (Radio feature) ───────────────────────────────────────
export const getRelated = async (videoId) => {
  try {
    const res = await axios.get(`${API}/youtube/related/${videoId}`, { timeout: 10000 })
    return (res.data?.items || []).map(normalizeYT)
  } catch { return [] }
}

// ── Import from YouTube / YouTube Music URL ───────────────────────────────────
export const importFromUrl = async (url) => {
  try {
    const res = await axios.get(`${API}/piped/resolve`, { params: { url }, timeout: 15000 })
    const data = res.data
    if (data.type === 'playlist') {
      return {
        type:   'playlist',
        id:     data.id,
        name:   data.title,
        cover:  data.thumbnail,
        tracks: (data.tracks || []).map(normalizeYT),
      }
    }
    if (data.type === 'track') return { type: 'track', track: normalizeYT(data) }
  } catch (e) {
    throw new Error(`Could not import: ${e.message}`)
  }
  return null
}

// ── Download ──────────────────────────────────────────────────────────────────
export const downloadTrack = (videoId, title, quality = 'high') => {
  const a = document.createElement('a')
  a.href = `${API}/download/${videoId}?title=${encodeURIComponent(title)}&quality=${quality}`
  a.download = `${title}.webm`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Lyrics ────────────────────────────────────────────────────────────────────
const lyricsCache = new Map()

export const getLyrics = async (artist, title) => {
  const key = `${artist}_${title}`.toLowerCase()
  if (lyricsCache.has(key)) return lyricsCache.get(key)

  const cleanTitle  = title.replace(/\(.*?\)/g,'').replace(/\[.*?\]/g,'').replace(/feat\..*/i,'').trim()
  const cleanArtist = artist.split(/[,&]/)[0].trim()

  // 1. lrclib.net (free, synced)
  try {
    const res = await axios.get('https://lrclib.net/api/search', {
      params: { track_name: cleanTitle, artist_name: cleanArtist }, timeout: 8000,
    })
    const best = (res.data || []).find(r => r.syncedLyrics || r.plainLyrics)
    if (best) {
      const result = {
        lines: parsePlain(best.plainLyrics || best.syncedLyrics),
        syncedLrc: best.syncedLyrics || null,
        source: 'LRCLib',
        synced: !!best.syncedLyrics,
      }
      lyricsCache.set(key, result)
      return result
    }
  } catch {}

  // 2. lyrics.ovh
  try {
    const res = await axios.get(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`,
      { timeout: 7000 }
    )
    if (res.data?.lyrics?.length > 60) {
      const result = { lines: parsePlain(res.data.lyrics), syncedLrc: null, source: 'Lyrics.ovh', synced: false }
      lyricsCache.set(key, result)
      return result
    }
  } catch {}

  // 3. Backend (Musixmatch / Genius if configured)
  try {
    const res = await axios.get(`${API}/lyrics`, {
      params: { artist: cleanArtist, title: cleanTitle }, timeout: 8000,
    })
    if (res.data?.lines?.length > 2) {
      lyricsCache.set(key, res.data)
      return res.data
    }
  } catch {}

  return null
}

const parsePlain = (raw) => {
  if (!raw) return []
  return raw.replace(/\r\n/g, '\n').split('\n')
    .map(l => l.replace(/^\[\d{2}:\d{2}[.:]\d{2,3}\]\s*/g, '').trim())
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .filter(l => !/^\d+embed$/i.test(l))
}

// ── Parse LRC for synced lyrics ───────────────────────────────────────────────
export const parseLRC = (lrc) => {
  if (!lrc) return []
  const lines = []
  for (const line of lrc.split('\n')) {
    const match = line.match(/^\[(\d{2}):(\d{2})[.:](\d{2,3})\]\s*(.*)/)
    if (match) {
      const mins = parseInt(match[1])
      const secs = parseInt(match[2])
      const ms   = parseInt(match[3].padEnd(3, '0'))
      const time = mins * 60 + secs + ms / 1000
      lines.push({ time, text: match[4].trim() })
    }
  }
  return lines.filter(l => l.text)
}
