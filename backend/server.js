require('dotenv').config()

const express     = require('express')
const cors        = require('cors')
const compression = require('compression')
const rateLimit   = require('express-rate-limit')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(compression())
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }))

app.use('/api/stream',    require('./routes/stream'))
app.use('/api/search',    require('./routes/search'))
app.use('/api/lyrics',    require('./routes/lyrics'))
app.use('/api/download',  require('./routes/download'))
app.use('/api/chart',     require('./routes/chart'))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use((err, _req, res, _next) => {
  console.error('[ERR]', err.message)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`\n🎵  Machi Spotify backend  →  http://localhost:${PORT}`)
  console.log('  /api/search?q=...')
  console.log('  /api/stream?title=...&artist=...')
  console.log('  /api/stream/:youtubeId')
  console.log('  /api/lyrics?artist=...&title=...')
  console.log('  /api/chart\n')
})
