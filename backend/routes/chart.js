/**
 * GET /api/chart
 * Returns trending tracks from Deezer chart (metadata only, stream resolved on play)
 */
const express   = require('express')
const axios     = require('axios')
const NodeCache = require('node-cache')
const router    = express.Router()
const cache     = new NodeCache({ stdTTL: 600 })

const DEEZER = 'https://api.deezer.com'

router.get('/', async (req, res) => {
  const hit = cache.get('chart')
  if (hit) return res.json(hit)

  try {
    const r = await axios.get(`${DEEZER}/chart`, { timeout: 8000 })
    const tracks = (r.data?.tracks?.data || []).map(t => ({
      id:        `dz_${t.id}`,
      source:    'deezer',
      title:     t.title,
      artist:    t.artist?.name || '',
      album:     t.album?.title || '',
      duration:  t.duration || 0,
      cover:     t.album?.cover_xl || t.album?.cover_big || t.album?.cover_medium || '',
      streamUrl: null, // resolved via /api/stream on play
      videoId:   null,
    }))
    const result = { tracks }
    cache.set('chart', result)
    return res.json(result)
  } catch (e) {
    console.warn('[Chart] Deezer failed:', e.message)
    res.json({ tracks: [] })
  }
})

module.exports = router
