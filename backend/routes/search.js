/**
 * GET /api/search?q=...&limit=20
 * Searches JioSaavn + YouTube, returns normalized tracks
 */
const express   = require('express')
const axios     = require('axios')
const NodeCache = require('node-cache')
const router    = express.Router()
const cache     = new NodeCache({ stdTTL: 300 })

const SAAVN = [
  'https://saavn.dev/api',
  'https://jiosaavn-api-privatecvc2.vercel.app',
  'https://jiosaavn-api2.vercel.app/api',
]

const INV = [
  'https://inv.nadeko.net',
  'https://invidious.fdn.fr',
  'https://yt.cdaut.de',
  'https://invidious.nerdvpn.de',
]

const normSaavn = (s) => {
  const artist = Array.isArray(s.artists?.primary)
    ? s.artists.primary.map(a => a.name).join(', ')
    : s.primaryArtists || s.artist || ''
  const dl = s.downloadUrl || []
  const streamUrl = (() => {
    for (let i = dl.length - 1; i >= 0; i--) {
      const u = dl[i]?.url || dl[i]?.link || (typeof dl[i] === 'string' ? dl[i] : null)
      if (u && u.startsWith('http')) return u
    }
    return null
  })()
  return {
    id:        `js_${s.id}`,
    source:    'jiosaavn',
    title:     s.name || s.title || s.song || 'Unknown',
    artist:    artist || 'Unknown',
    album:     s.album?.name || s.album || '',
    duration:  parseInt(s.duration) || 0,
    cover:     s.image?.[2]?.url || s.image?.[2]?.link || s.image?.[1]?.url || '',
    streamUrl, // already resolved!
    videoId:   null,
  }
}

const normYT = (v) => ({
  id:        `yt_${v.videoId || v.id}`,
  source:    'youtube',
  title:     v.title || 'Unknown',
  artist:    v.author?.name || v.author || v.channelTitle || '',
  album:     '',
  duration:  v.seconds || v.duration || 0,
  cover:     v.thumbnail || `https://i.ytimg.com/vi/${v.videoId || v.id}/hqdefault.jpg`,
  streamUrl: null, // resolved on play via /api/stream/:id
  videoId:   v.videoId || v.id,
})

router.get('/', async (req, res) => {
  const { q, limit = 20 } = req.query
  if (!q) return res.status(400).json({ error: 'q required', tracks: [] })

  const key = `search_${q}_${limit}`
  const hit = cache.get(key)
  if (hit) return res.json(hit)

  const results = []
  const seen    = new Set()

  // ── JioSaavn ────────────────────────────────────────────────────────────────
  for (const base of SAAVN) {
    try {
      const r = await axios.get(`${base}/search/songs`, {
        params: { query: q, limit: parseInt(limit) },
        timeout: 8000,
      })
      const songs = r.data?.data?.results || r.data?.results || (Array.isArray(r.data?.data) ? r.data.data : [])
      if (songs.length > 0) {
        for (const s of songs) {
          const t = normSaavn(s)
          if (!seen.has(t.title.toLowerCase().slice(0, 20))) {
            results.push(t)
            seen.add(t.title.toLowerCase().slice(0, 20))
          }
        }
        console.log(`[Search] JioSaavn: ${songs.length} results from ${base}`)
        break // got results, stop trying mirrors
      }
    } catch (e) { console.warn(`[Search] JioSaavn ${base}:`, e.message) }
  }

  // ── YouTube (yt-search) ─────────────────────────────────────────────────────
  try {
    const yts = require('yt-search')
    const r   = await yts(q)
    for (const v of (r.videos || []).slice(0, 10)) {
      const t = normYT(v)
      if (!seen.has(t.title.toLowerCase().slice(0, 20))) {
        results.push(t)
        seen.add(t.title.toLowerCase().slice(0, 20))
      }
    }
    console.log(`[Search] YouTube: ${r.videos?.length || 0} results`)
  } catch (e) { console.warn('[Search] yt-search:', e.message) }

  // ── Invidious YouTube search (fallback) ─────────────────────────────────────
  if (results.length < 5) {
    for (const host of INV) {
      try {
        const r = await axios.get(`${host}/api/v1/search`, {
          params: { q, type: 'video', page: 1 },
          timeout: 7000,
        })
        if (r.data?.length > 0) {
          for (const v of r.data.filter(v => v.type === 'video').slice(0, 10)) {
            const t = normYT({ videoId: v.videoId, title: v.title, author: v.author, seconds: v.lengthSeconds, thumbnail: v.videoThumbnails?.[0]?.url })
            if (!seen.has(t.title.toLowerCase().slice(0, 20))) {
              results.push(t)
              seen.add(t.title.toLowerCase().slice(0, 20))
            }
          }
          break
        }
      } catch {}
    }
  }

  const response = { tracks: results.slice(0, parseInt(limit)) }
  cache.set(key, response)
  res.json(response)
})

module.exports = router
