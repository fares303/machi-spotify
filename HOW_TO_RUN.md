# 🎵 How to Run Machi Spotify

## ⚠️ IMPORTANT — Read This First

You need **TWO terminals open at the same time**.
The backend must be running BEFORE you open the website.

---

## Step 1 — Delete old node_modules (fixes broken Vite upgrade)

```
cd D:\soundwave\soundwave
rmdir /s /q node_modules
del package-lock.json
```

---

## Step 2 — Start the Backend (Terminal 1)

```
cd D:\soundwave\soundwave\backend
npm install
node server.js
```

You should see:
```
🎵  Machi Spotify Backend  →  http://localhost:3001
```

**Keep this terminal open.** If you close it, songs stop playing.

---

## Step 3 — Start the Frontend (Terminal 2 — NEW window)

```
cd D:\soundwave\soundwave
npm install
npm run dev
```

You should see:
```
VITE v5.x.x  ready in 300ms
➜  Local:   http://localhost:5173/
```

Then open **http://localhost:5173** in your browser.

---

## ✅ Working check

- Open http://localhost:3001/api/health in browser → should show `{"status":"ok"}`
- Open http://localhost:5173 → Machi Spotify loads
- Click a song → should play (may take 3–5 seconds to resolve stream)

---

## ❌ Common errors and fixes

| Error | Fix |
|-------|-----|
| `Cannot find module 'server.js'` | Make sure you're in the `backend` folder: `cd backend` |
| `ECONNREFUSED` proxy errors | Backend is not running — start it in Terminal 1 first |
| Vite v8 / plugin-react error | Delete `node_modules` and `package-lock.json`, then `npm install` again |
| Songs don't play | Backend must be running on port 3001 |
| `yt-search` vulnerability warning | Safe to ignore — it's a dev-only audit warning, not a runtime error |

---

## API Keys (optional — app works without them)

Edit `backend/.env`:
```
YOUTUBE_API_KEY=your_key     # better YouTube search
MUSIXMATCH_API_KEY=your_key  # better lyrics
```
