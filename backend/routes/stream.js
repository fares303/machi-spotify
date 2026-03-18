/**
 * Stream resolver — the most critical backend route
 * GET /api/stream?title=...&artist=...   → resolves a full stream URL
 * GET /api/stream/:videoId               → resolves stream for a specific YT video
 *
 * Strategy (in order):
 * 1. JioSaavn search → full quality MP4/M4A stream (no restrictions)
 * 2. Invidious (multiple mirrors) → YouTube audio stream
 * 3. Return null if nothing works
 */
const express   = require('express')
const axios     = require('axios')
const NodeCache = require('node-cache')
const router    = express.Router()
const cache     = new NodeCache({ stdTTL: 3600, checkperiod: 300 })

// ── JioSaavn API mirrors (all public, no key) ─────────────────────────────────
const SAAVN = [
  'https://saavn.dev/api',
  'https://jiosaavn-api-privatecvc2.vercel.app',
  'https://jiosaavn-api2.vercel.app/api',
  'https://saavn-api.vercel.app/api',
]

// ── Invidious mirrors (YouTube without restrictions) ──────────────────────────
const INV = [
  'https://inv.nadeko.net',
  'https://invidious.fdn.fr',
  'https://invidious.privacydev.net',
  'https://yt.cdaut.de',
  'https://invidious.nerdvpn.de',
  'https://vid.puffyan.us',
]

// ── Helper: try JioSaavn search on all mirrors ────────────────────────────────
const saavnSearch = async (query, limit = 5) => {
  for (const base of SAAVN) {
    try {
      // saavn.dev and clones use /search/songs?query=...&limit=...
      const res = await axios.get(`${base}/search/songs`, {
        params: { query, limit },
        timeout: 7000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      // Different mirrors wrap data differently
      const results =
        res.data?.data?.results ||
        res.data?.results ||
        (Array.isArray(res.data?.data) ? res.data.data : null) ||
        (Array.isArray(res.data) ? res.data : null)

      if (results?.length > 0) {
        console.log(`[JioSaavn] Got ${results.length} results from ${base}`)
        return results
      }
    } catch (e) {
      console.warn(`[JioSaavn] ${base} failed: ${e.message}`)
    }
  }
  return []
}

// ── Helper: extract best download URL from a JioSaavn song ───────────────────
const extractUrl = (song) => {
  if (!song) return null
  const dl = song.downloadUrl || song.download_url || []
  if (Array.isArray(dl) && dl.length > 0) {
    // Try highest quality first (index 4 = 320kbps, 3 = 160kbps, etc.)
    for (let i = dl.length - 1; i >= 0; i--) {
      const entry = dl[i]
      const url = typeof entry === 'string' ? entry
        : entry?.url || entry?.link || entry?.audioUrl
      if (url && typeof url === 'string' && url.startsWith('http')) return url
    }
  }
  // Some mirrors return url directly
  return song.url || song.stream_url || song.media_url || null
}

// ── Helper: get audio stream from Invidious ───────────────────────────────────
const invStream = async (videoId) => {
  for (const host of INV) {
    try {
      const res = await axios.get(`${host}/api/v1/videos/${videoId}`, {
        params: { fields: 'title,author,lengthSeconds,videoThumbnails,adaptiveFormats,formatStreams' },
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      const d = res.data

      // Audio-only streams (best quality, smaller file)
      const audio = (d.adaptiveFormats || [])
        .filter(f => f.type?.includes('audio/') && f.url)
        .sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0))

      // Muxed streams (video+audio, still playable as audio)
      const muxed = (d.formatStreams || [])
        .filter(f => f.url)
        .sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0))

      const best = audio[0] || muxed[0]
      if (best?.url) {
        console.log(`[Invidious] Got stream from ${host}`)
        return {
          url:       best.url,
          mimeType:  best.type || 'audio/webm',
          bitrate:   parseInt(best.bitrate) || 0,
          title:     d.title,
          artist:    d.author,
          duration:  d.lengthSeconds,
          thumbnail: d.videoThumbnails?.[0]?.url,
        }
      }
    } catch (e) {
      console.warn(`[Invidious] ${host} failed: ${e.message}`)
    }
  }
  return null
}

// ── Helper: search YouTube via yt-search ──────────────────────────────────────
const ytSearch = async (query) => {
  try {
    const yts = require('yt-search')
    const r = await yts(query)
    return (r.videos || []).slice(0, 5)
  } catch (e) {
    console.warn('[yt-search]', e.message)
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/stream?title=...&artist=...
// Resolves a full stream URL by searching JioSaavn then YouTube
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  const { title, artist = '', source = '' } = req.query
  if (!title) return res.status(400).json({ error: 'title is required' })

  const cacheKey = `stream_${title}_${artist}`.toLowerCase().replace(/\s+/g, '_').slice(0, 80)
  const cached   = cache.get(cacheKey)
  if (cached) return res.json(cached)

  const cleanTitle  = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/feat\..*/i, '').trim()
  const cleanArtist = artist.split(/[,&]/)[0].trim()
  const searchQuery = [cleanTitle, cleanArtist].filter(Boolean).join(' ')

  console.log(`[Stream] Resolving: "${searchQuery}"`)

  // ── 1. JioSaavn (full songs, no restrictions) ──────────────────────────────
  const saavnResults = await saavnSearch(searchQuery)
  if (saavnResults.length > 0) {
    // Score matches by title similarity
    const titleLow  = cleanTitle.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 25)
    const artistLow = cleanArtist.toLowerCase().slice(0, 15)

    let best = null, bestScore = -1
    for (const r of saavnResults) {
      const rt = (r.name || r.title || r.song || '').toLowerCase().replace(/[^a-z0-9 ]/g, '')
      const ra = (
        Array.isArray(r.artists?.primary)
          ? r.artists.primary.map(a => a.name).join(' ')
          : r.primaryArtists || ''
      ).toLowerCase()

      let score = 0
      // Title match
      if (rt.includes(titleLow.slice(0, 15)) || titleLow.includes(rt.slice(0, 12))) score += 3
      // Artist match
      if (artistLow && (ra.includes(artistLow.split(' ')[0]) || artistLow.includes(ra.split(' ')[0]))) score += 2
      if (score > bestScore) { bestScore = score; best = r }
    }

    const chosen = (bestScore > 0 ? best : saavnResults[0])
    const url = extractUrl(chosen)
    if (url) {
      const result = {
        url,
        source:   'jiosaavn',
        quality:  'full',
        title:    chosen.name || chosen.title || title,
        artist:   Array.isArray(chosen.artists?.primary)
                    ? chosen.artists.primary.map(a => a.name).join(', ')
                    : chosen.primaryArtists || artist,
        cover:    chosen.image?.[2]?.url || chosen.image?.[2]?.link || chosen.image?.[1]?.url || '',
        duration: parseInt(chosen.duration) || 0,
      }
      cache.set(cacheKey, result)
      console.log(`[Stream] ✅ JioSaavn: ${url.slice(0, 60)}...`)
      return res.json(result)
    }
  }

  // ── 2. YouTube via yt-search + Invidious ───────────────────────────────────
  const ytVideos = await ytSearch(searchQuery)
  for (const video of ytVideos.slice(0, 3)) {
    const streamData = await invStream(video.videoId)
    if (streamData) {
      const result = {
        url:      streamData.url,
        source:   'youtube',
        quality:  'full',
        title:    streamData.title || title,
        artist:   streamData.artist || artist,
        cover:    video.thumbnail,
        duration: streamData.duration || video.seconds || 0,
      }
      cache.set(cacheKey, result)
      console.log(`[Stream] ✅ YouTube: ${streamData.url.slice(0, 60)}...`)
      return res.json(result)
    }
  }

  console.warn(`[Stream] ❌ Could not resolve: "${searchQuery}"`)
  res.status(404).json({ url: null, error: 'No stream found for: ' + searchQuery })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/stream/:videoId
// Get stream URL for a specific YouTube video ID
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params
  if (!videoId || videoId.length < 5) return res.status(400).json({ error: 'Invalid videoId' })

  const cacheKey = `inv_${videoId}`
  const cached   = cache.get(cacheKey)
  if (cached) return res.json(cached)

  const streamData = await invStream(videoId)
  if (streamData) {
    cache.set(cacheKey, streamData)
    return res.json(streamData)
  }

  res.status(404).json({ error: 'Could not get stream for videoId: ' + videoId })
})

module.exports = router
