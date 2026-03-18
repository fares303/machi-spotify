require('dotenv').config()

const express     = require('express')
const cors        = require('cors')
const compression = require('compression')
const rateLimit   = require('express-rate-limit')
const path        = require('path')

const app  = express()
const PORT = process.env.PORT || 3000

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(compression())
app.use(cors())
app.use(express.json())
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }))

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/stream',   require('./backend/routes/stream'))
app.use('/api/search',   require('./backend/routes/search'))
app.use('/api/lyrics',   require('./backend/routes/lyrics'))
app.use('/api/download', require('./backend/routes/download'))
app.use('/api/chart',    require('./backend/routes/chart'))
app.get('/api/health',   (_req, res) => res.json({ ok: true, ts: Date.now() }))

// ── Serve React build ──────────────────────────────────────────────────────────
const DIST = path.join(__dirname, 'dist')
app.use(express.static(DIST))

// All non-API routes → React app (client-side routing)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' })
  res.sendFile(path.join(DIST, 'index.html'))
})

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERR]', err.message)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`\n🎵  Machi Spotify  →  http://localhost:${PORT}`)
  console.log(`     API  →  http://localhost:${PORT}/api/health`)
  console.log(`     Mode: ${process.env.NODE_ENV || 'production'}\n`)
})
