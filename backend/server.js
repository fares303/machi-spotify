require('dotenv').config()

const express     = require('express')
const cors        = require('cors')
const compression = require('compression')
const rateLimit   = require('express-rate-limit')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(compression())
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/stream',   require('./routes/stream'))
app.use('/api/search',   require('./routes/search'))
app.use('/api/lyrics',   require('./routes/lyrics'))
app.use('/api/download', require('./routes/download'))
app.use('/api/chart',    require('./routes/chart'))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
)

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ error: err.message })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎵  Machi Spotify Backend  →  http://localhost:${PORT}`)
  console.log('─────────────────────────────────────────')
  console.log('  GET /api/health')
  console.log('  GET /api/search?q=...')
  console.log('  GET /api/stream?title=...&artist=...')
  console.log('  GET /api/stream/:youtubeVideoId')
  console.log('  GET /api/lyrics?artist=...&title=...')
  console.log('  GET /api/download?title=...&artist=...')
  console.log('  GET /api/chart')
  console.log('─────────────────────────────────────────\n')
})
