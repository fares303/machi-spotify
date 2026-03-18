require('dotenv').config()

const express     = require('express')
const cors        = require('cors')
const compression = require('compression')
const rateLimit   = require('express-rate-limit')
const path        = require('path')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(compression())
app.use(cors())
app.use(express.json())

// ── API routes MUST come before static files ───────────────────────────────
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }))

app.use('/api/stream',   require('./backend/routes/stream'))
app.use('/api/search',   require('./backend/routes/search'))
app.use('/api/lyrics',   require('./backend/routes/lyrics'))
app.use('/api/download', require('./backend/routes/download'))
app.use('/api/chart',    require('./backend/routes/chart'))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

// ── Serve React AFTER api routes ───────────────────────────────────────────
const DIST = path.join(__dirname, 'dist')
app.use(express.static(DIST, { index: false })) // index:false = don't auto-serve index.html

// Only serve index.html for non-API GET requests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(DIST, 'index.html'))
})

// 404 for unknown API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' })
})

app.use((err, _req, res, _next) => {
  console.error('[ERR]', err.message)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎵  Machi Spotify → http://0.0.0.0:${PORT}`)
  console.log(`     /api/health should return JSON\n`)
})
