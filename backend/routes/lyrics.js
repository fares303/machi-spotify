const express   = require('express')
const axios     = require('axios')
const NodeCache = require('node-cache')
const router    = express.Router()
const cache     = new NodeCache({ stdTTL: 3600 })

router.get('/', async (req, res) => {
  const { artist, title } = req.query
  if (!artist || !title) return res.status(400).json({ error: 'artist and title required' })

  const key = `lyr_${artist}_${title}`.toLowerCase().replace(/\s+/g,'_').slice(0,100)
  const hit = cache.get(key)
  if (hit) return res.json(hit)

  const clean = (s) => s.replace(/\(.*?\)/g,'').replace(/\[.*?\]/g,'').replace(/feat\..*/i,'').trim()
  const cTitle  = clean(title)
  const cArtist = artist.split(/[,&]/)[0].trim()

  const parse = (raw, src) => ({
    lines: raw.replace(/\r\n/g,'\n').split('\n')
      .map(l => l.replace(/^\[\d{2}:\d{2}[.:]\d{2,3}\]\s*/g,'').trim())
      .filter((l,i,a) => !(l==='' && i>0 && a[i-1]===''))
      .filter(l => !/^\d+Embed$/i.test(l)),
    source: src
  })

  // 1. lrclib.net
  try {
    const r = await axios.get('https://lrclib.net/api/search', {
      params: { track_name: cTitle, artist_name: cArtist }, timeout: 8000
    })
    const best = (r.data||[]).find(x => x.plainLyrics || x.syncedLyrics)
    if (best?.plainLyrics?.length > 60) {
      const result = parse(best.plainLyrics, 'LRCLib')
      cache.set(key, result)
      return res.json(result)
    }
  } catch {}

  // 2. lyrics.ovh
  try {
    const r = await axios.get(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(cArtist)}/${encodeURIComponent(cTitle)}`,
      { timeout: 7000 }
    )
    if (r.data?.lyrics?.length > 60) {
      const result = parse(r.data.lyrics, 'Lyrics.ovh')
      cache.set(key, result)
      return res.json(result)
    }
  } catch {}

  // 3. Musixmatch (if key set)
  if (process.env.MUSIXMATCH_API_KEY) {
    try {
      const s = await axios.get('https://api.musixmatch.com/ws/1.1/track.search', {
        params: { apikey: process.env.MUSIXMATCH_API_KEY, q_artist: cArtist, q_track: cTitle, f_has_lyrics: 1, page_size: 1 },
        timeout: 7000
      })
      const tid = s.data?.message?.body?.track_list?.[0]?.track?.track_id
      if (tid) {
        const l = await axios.get('https://api.musixmatch.com/ws/1.1/track.lyrics.get', {
          params: { apikey: process.env.MUSIXMATCH_API_KEY, track_id: tid }, timeout: 7000
        })
        const text = l.data?.message?.body?.lyrics?.lyrics_body
        if (text?.length > 60) {
          const result = parse(text, 'Musixmatch')
          cache.set(key, result)
          return res.json(result)
        }
      }
    } catch {}
  }

  res.status(404).json({ lines: null, error: 'Lyrics not found' })
})

module.exports = router
