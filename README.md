# 🎵 Machi Spotify 🇩🇿

Stream Algerian & Arabic music — one server, one port, deploy anywhere.

---

## 🚀 Quick Start

### Option A — One command (recommended)
```bash
./run.sh
```
Choose **1** for production or **2** for development.

---

### Option B — Manual

**Production** (one server on port 3000):
```bash
npm install          # install everything
npm run build        # build React → dist/
npm start            # serve at http://localhost:3000
```

**Development** (live reload):
```bash
npm install
npm run dev          # Vite on :5173 + API on :3000
```

---

## 🌐 Deploy to a Server (VPS / Cloud)

1. Copy the project folder to your server
2. Install Node.js 18+ on the server
3. Run:
```bash
npm install
npm run build
npm start
```
4. Access at `http://YOUR_SERVER_IP:3000`

**With a domain + SSL (using Nginx):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Keep running with PM2:**
```bash
npm install -g pm2
pm2 start server.js --name "machi-spotify"
pm2 save
pm2 startup
```

---

## 🔑 Optional API Keys (add to .env)

```env
PORT=3000
YOUTUBE_API_KEY=       # https://console.cloud.google.com
MUSIXMATCH_API_KEY=    # https://developer.musixmatch.com
GENIUS_API_TOKEN=      # https://genius.com/api-clients
```
App works without any keys — keys just improve quality.

---

## 📁 Project Structure

```
machi-spotify/
├── server.js          ← Express server (API + serves React)
├── package.json       ← All dependencies (frontend + backend)
├── vite.config.js     ← React build config
├── src/               ← React frontend source
├── dist/              ← Built frontend (created by npm run build)
├── backend/
│   └── routes/        ← API route handlers
│       ├── stream.js  ← JioSaavn + Invidious stream resolver
│       ├── search.js  ← Song search (JioSaavn + YouTube)
│       ├── chart.js   ← Deezer trending chart
│       ├── lyrics.js  ← Lyrics (LRCLib + lyrics.ovh)
│       └── download.js← Audio download
└── .env               ← API keys (optional)
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` / `←` | +10s / -10s |
| `Shift+→/←` | Next / Prev |
| `↑` / `↓` | Volume |
| `M` | Mute |
| `S` | Shuffle |
| `R` | Repeat |
