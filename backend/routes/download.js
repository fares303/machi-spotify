/**
 * GET /api/download?title=...&artist=...
 * Streams audio file as download (uses same JioSaavn/Invidious as stream resolver)
 */
const express   = require('express')
const axios     = require('axios')
const router    = express.Router()

const SAAVN = ['https://saavn.dev/api','https://jiosaavn-api-privatecvc2.vercel.app','https://jiosaavn-api2.vercel.app/api']
const INV   = ['https://inv.nadeko.net','https://invidious.fdn.fr','https://yt.cdaut.de']

const saavnSearch = async (query) => {
  for (const base of SAAVN) {
    try {
      const r = await axios.get(`${base}/search/songs`, { params: { query, limit: 3 }, timeout: 7000 })
      const results = r.data?.data?.results || r.data?.results || []
      if (results.length) return results
    } catch {}
  }
  return []
}

const extractUrl = (song) => {
  const dl = song?.downloadUrl || []
  for (let i = dl.length - 1; i >= 0; i--) {
    const u = dl[i]?.url || dl[i]?.link || (typeof dl[i] === 'string' ? dl[i] : null)
    if (u?.startsWith('http')) return u
  }
  return null
}

router.get('/', async (req, res) => {
  const { title = '', artist = '', videoId } = req.query
  const safeName = (title || 'audio').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim()

  // Try JioSaavn first
  if (title) {
    const results = await saavnSearch(`${title} ${artist}`)
    const url = results.length ? extractUrl(results[0]) : null
    if (url) {
      try {
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.m4a"`)
        res.setHeader('Content-Type', 'audio/mp4')
        const stream = await axios.get(url, { responseType: 'stream', timeout: 30000 })
        stream.data.pipe(res)
        return
      } catch {}
    }
  }

  // Try Invidious for YouTube
  if (videoId) {
    for (const host of INV) {
      try {
        const info = await axios.get(`${host}/api/v1/videos/${videoId}`, {
          params: { fields: 'adaptiveFormats,formatStreams' }, timeout: 8000
        })
        const formats = [
          ...(info.data?.adaptiveFormats || []).filter(f => f.type?.includes('audio/') && f.url),
          ...(info.data?.formatStreams || []).filter(f => f.url),
        ].sort((a, b) => (parseInt(b.bitrate)||0) - (parseInt(a.bitrate)||0))

        if (formats[0]?.url) {
          res.setHeader('Content-Disposition', `attachment; filename="${safeName}.webm"`)
          res.setHeader('Content-Type', formats[0].type || 'audio/webm')
          const stream = await axios.get(formats[0].url, { responseType: 'stream', timeout: 30000 })
          stream.data.pipe(res)
          return
        }
      } catch {}
    }
  }

  res.status(404).json({ error: 'Download not available for this track' })
})

module.exports = router
