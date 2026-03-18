# 🎵 Machi Spotify

A full-featured music streaming app — stream, search, download, and enjoy lyrics. No music stored on your server. Everything streams from JioSaavn and YouTube.

---

## 🚀 Quick Start

### Requirements
- **Node.js 18+** — download from https://nodejs.org

### Run (one command)
```bash
chmod +x run.sh && ./run.sh
```

Or manually:

```bash
# Terminal 1 — Backend (REQUIRED for streaming)
cd backend
npm install
node server.js
# Runs at http://localhost:3001

# Terminal 2 — Frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## ✅ How Songs Play

1. You click a track
2. Frontend asks **backend `/api/stream?title=...&artist=...`**
3. Backend searches **JioSaavn** (full quality, free, no restrictions) across 4 mirrors
4. If JioSaavn fails → searches **YouTube** via yt-search + **Invidious** (public YouTube proxy)
5. Stream URL returned to browser → plays full song

**JioSaavn tracks** show a **FULL** badge — these have the stream URL pre-loaded from search.  
**Other tracks** resolve on play — you'll see a "Loading..." toast for 2-5 seconds.

---

## 🔑 Optional API Keys

Add to `backend/.env` for better results:

```env
YOUTUBE_API_KEY=your_key   # https://console.cloud.google.com (free 10k/day)
MUSIXMATCH_API_KEY=your_key  # https://developer.musixmatch.com (free tier)
```

The app works without any keys.

---

## 🎵 Features

- 🔍 Search songs, artists, albums (JioSaavn + YouTube)
- ▶️ Full song streaming (not 30-second previews)
- ⬇️ Download MP3/M4A
- 🎤 Lyrics (LRCLib + Lyrics.ovh, no key needed)
- 📋 Playlists + Library
- 🎨 5 themes: Dark, Light, AMOLED, Ocean, Rose
- 🎛️ 10-band Equalizer
- ⌨️ Keyboard shortcuts (Space, arrows, M, S, R)
- 📥 Import YouTube playlists by URL
- 💤 Sleep timer
- 🔁 Shuffle, Repeat, Queue management

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` / `←` | Seek +10s / -10s |
| `Shift+→` / `Shift+←` | Next / Prev track |
| `↑` / `↓` | Volume up / down |
| `M` | Mute toggle |
| `S` | Shuffle |
| `R` | Repeat cycle |

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TailwindCSS |
| Animations | Framer Motion |
| State | Zustand (persisted) |
| Audio | Web Audio API |
| Backend | Node.js + Express |
| Music source | JioSaavn API (full songs) |
| YT fallback | yt-search + Invidious public mirrors |
| Lyrics | LRCLib + Lyrics.ovh |
