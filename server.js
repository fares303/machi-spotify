require('dotenv').config()

const express    = require('express')
const cors       = require('cors')
const compression = require('compression')
const path       = require('path')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(compression())
app.use(cors())
app.use(express.json())

// ── STEP 1: Health check first, always ────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ ok: true, ts: Date.now() }))
})

// ── STEP 2: All other API routes ──────────────────────────────────────────────
app.use('/api/stream',   require('./backend/routes/stream'))
app.use('/api/search',   require('./backend/routes/search'))
app.use('/api/lyrics',   require('./backend/routes/lyrics'))
app.use('/api/download', require('./backend/routes/download'))
app.use('/api/chart',    require('./backend/routes/chart'))

// ── STEP 3: Static files (React build) ───────────────────────────────────────
const DIST = path.join(__dirname, 'dist')
app.use(express.static(DIST))

// ── STEP 4: React Router fallback ────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎵 Machi Spotify running on port ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})
