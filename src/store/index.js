import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({

      // ── Now playing ─────────────────────────────────────────────────────────
      currentTrack:  null,
      queue:         [],
      queueIndex:    0,
      isPlaying:     false,
      progress:      0,
      duration:      0,
      buffered:      0,
      isBuffering:   false,
      isShuffled:    false,
      repeatMode:    'none',    // 'none' | 'one' | 'all'
      volume:        0.85,
      isMuted:       false,
      streamQuality: 'high',   // 'high' | 'medium' | 'low'

      // ── UI state ────────────────────────────────────────────────────────────
      navPosition:   'side',   // 'side' | 'bottom'
      theme:         'dark',   // 'dark' | 'light' | 'amoled' | 'ocean' | 'rose'
      language:      'en',
      showLyrics:    false,
      isFullscreen:  false,
      isMiniPlayer:  false,
      showEqualizer: false,
      skipSilence:   false,
      sleepTimer:    null,
      sleepTimerEnd: null,

      // ── Equalizer ───────────────────────────────────────────────────────────
      equalizerEnabled: false,
      equalizerPreset:  'flat',
      equalizerBands:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10-band

      // ── Library ─────────────────────────────────────────────────────────────
      playlists:        [],   // { id, name, tracks[], coverColor, createdAt }
      favorites:        [],   // tracks
      bookmarkedArtists:[],   // { id, name, thumbnail }
      bookmarkedAlbums: [],   // { id, title, artist, thumbnail }
      recentlyPlayed:   [],   // tracks (last 100)
      downloadQueue:    [],   // { track, progress, status }

      // ── Actions: Playback ───────────────────────────────────────────────────
      setCurrentTrack: (track) => set((s) => ({
        currentTrack: track,
        isPlaying: true,
        progress: 0,
        recentlyPlayed: [track, ...s.recentlyPlayed.filter(t => t.id !== track.id)].slice(0, 100),
      })),

      setQueue: (tracks, index = 0) => {
        if (!tracks?.length) return
        set({ queue: tracks, queueIndex: index, currentTrack: tracks[index], isPlaying: true, progress: 0 })
      },

      addToQueue: (track) => set(s => ({ queue: [...s.queue, track] })),
      addNextInQueue: (track) => set(s => {
        const newQueue = [...s.queue]
        newQueue.splice(s.queueIndex + 1, 0, track)
        return { queue: newQueue }
      }),

      playNext: () => {
        const { queue, queueIndex, isShuffled, repeatMode } = get()
        if (!queue.length) return
        if (repeatMode === 'one') { set({ progress: 0 }); return }
        let next = isShuffled
          ? Math.floor(Math.random() * queue.length)
          : queueIndex + 1
        if (next >= queue.length) {
          if (repeatMode === 'all') next = 0
          else { set({ isPlaying: false }); return }
        }
        set({ queueIndex: next, currentTrack: queue[next], isPlaying: true, progress: 0 })
      },

      playPrev: () => {
        const { queue, queueIndex, progress } = get()
        if (progress > 3) { set({ progress: 0 }); return }
        const prev = Math.max(0, queueIndex - 1)
        if (queue[prev]) set({ queueIndex: prev, currentTrack: queue[prev], isPlaying: true, progress: 0 })
      },

      togglePlay:    () => set(s => ({ isPlaying: !s.isPlaying })),
      setIsPlaying:  (v) => set({ isPlaying: v }),
      setProgress:   (v) => set({ progress: v }),
      setDuration:   (v) => set({ duration: v }),
      setBuffered:   (v) => set({ buffered: v }),
      setBuffering:  (v) => set({ isBuffering: v }),
      setVolume:     (v) => set({ volume: v, isMuted: v === 0 }),
      toggleMute:    () => set(s => ({ isMuted: !s.isMuted })),
      toggleShuffle: () => set(s => ({ isShuffled: !s.isShuffled })),
      cycleRepeat:   () => set(s => ({
        repeatMode: s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none'
      })),
      setStreamQuality: (q) => set({ streamQuality: q }),

      // ── Actions: UI ─────────────────────────────────────────────────────────
      setTheme:        (t) => { set({ theme: t }); document.documentElement.setAttribute('data-theme', t) },
      setNavPosition:  (p) => set({ navPosition: p }),
      setLanguage:     (l) => set({ language: l }),
      toggleLyrics:    () => set(s => ({ showLyrics: !s.showLyrics })),
      toggleFullscreen:() => set(s => ({ isFullscreen: !s.isFullscreen })),
      toggleMiniPlayer:() => set(s => ({ isMiniPlayer: !s.isMiniPlayer })),
      toggleEqualizer: () => set(s => ({ showEqualizer: !s.showEqualizer })),
      toggleSkipSilence:() => set(s => ({ skipSilence: !s.skipSilence })),

      // ── Equalizer ───────────────────────────────────────────────────────────
      setEqualizerBand: (index, value) => set(s => {
        const bands = [...s.equalizerBands]; bands[index] = value
        return { equalizerBands: bands, equalizerEnabled: true }
      }),
      setEqualizerPreset: (preset) => {
        const presets = {
          flat:       [0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
          bass:       [6,  5,  4,  2,  0,  0,  0,  0,  0,  0],
          treble:     [0,  0,  0,  0,  0,  2,  4,  5,  6,  5],
          vocal:      [-2,-1,  1,  3,  4,  3,  2,  1, -1, -2],
          rock:       [4,  3,  2,  1, -1, -1,  1,  2,  3,  4],
          electronic: [4,  3,  0, -2, -1,  2,  0, -1,  3,  4],
          classical:  [0,  0,  0,  0,  0, -2, -3, -3, -2,  0],
          jazz:       [0,  0,  1,  2,  2,  0, -1, -1,  0,  0],
        }
        set({ equalizerPreset: preset, equalizerBands: presets[preset] || presets.flat, equalizerEnabled: preset !== 'flat' })
      },
      toggleEqualizerEnabled: () => set(s => ({ equalizerEnabled: !s.equalizerEnabled })),

      // ── Sleep timer ─────────────────────────────────────────────────────────
      setSleepTimer: (minutes) => {
        if (get().sleepTimer) clearTimeout(get().sleepTimer)
        if (!minutes) { set({ sleepTimer: null, sleepTimerEnd: null }); return }
        const end   = Date.now() + minutes * 60 * 1000
        const timer = setTimeout(() => set({ isPlaying: false, sleepTimer: null, sleepTimerEnd: null }), minutes * 60 * 1000)
        set({ sleepTimer: timer, sleepTimerEnd: end })
      },

      // ── Favorites ───────────────────────────────────────────────────────────
      toggleFavorite: (track) => set(s => {
        const has = s.favorites.some(t => t.id === track.id)
        return { favorites: has ? s.favorites.filter(t => t.id !== track.id) : [track, ...s.favorites] }
      }),
      isFavorite: (id) => get().favorites.some(t => t.id === id),

      // ── Playlists ────────────────────────────────────────────────────────────
      createPlaylist: (name) => {
        const id = `pl_${Date.now()}`
        set(s => ({ playlists: [...s.playlists, { id, name, tracks: [], createdAt: Date.now(), coverColor: `hsl(${Math.floor(Math.random()*360)},60%,50%)` }] }))
        return id
      },
      deletePlaylist:  (id) => set(s => ({ playlists: s.playlists.filter(p => p.id !== id) })),
      renamePlaylist:  (id, name) => set(s => ({ playlists: s.playlists.map(p => p.id === id ? { ...p, name } : p) })),
      addToPlaylist:   (pid, track) => set(s => ({
        playlists: s.playlists.map(p => p.id === pid
          ? { ...p, tracks: [...p.tracks.filter(t => t.id !== track.id), track] }
          : p)
      })),
      removeFromPlaylist: (pid, tid) => set(s => ({
        playlists: s.playlists.map(p => p.id === pid ? { ...p, tracks: p.tracks.filter(t => t.id !== tid) } : p)
      })),
      importPlaylist: (playlist) => set(s => ({
        playlists: [...s.playlists, { ...playlist, id: `pl_${Date.now()}`, createdAt: Date.now(), coverColor: `hsl(${Math.floor(Math.random()*360)},60%,50%)` }]
      })),

      // ── Bookmarks ────────────────────────────────────────────────────────────
      toggleBookmarkArtist: (artist) => set(s => {
        const has = s.bookmarkedArtists.some(a => a.id === artist.id)
        return { bookmarkedArtists: has ? s.bookmarkedArtists.filter(a => a.id !== artist.id) : [artist, ...s.bookmarkedArtists] }
      }),
      toggleBookmarkAlbum: (album) => set(s => {
        const has = s.bookmarkedAlbums.some(a => a.id === album.id)
        return { bookmarkedAlbums: has ? s.bookmarkedAlbums.filter(a => a.id !== album.id) : [album, ...s.bookmarkedAlbums] }
      }),
      isArtistBookmarked: (id) => get().bookmarkedArtists.some(a => a.id === id),
      isAlbumBookmarked:  (id) => get().bookmarkedAlbums.some(a => a.id === id),
    }),
    {
      name: 'machi-spotify-v3',
      partialize: (s) => ({
        playlists: s.playlists, favorites: s.favorites,
        bookmarkedArtists: s.bookmarkedArtists, bookmarkedAlbums: s.bookmarkedAlbums,
        recentlyPlayed: s.recentlyPlayed,
        volume: s.volume, isMuted: s.isMuted,
        isShuffled: s.isShuffled, repeatMode: s.repeatMode,
        theme: s.theme, navPosition: s.navPosition, language: s.language,
        streamQuality: s.streamQuality,
        equalizerEnabled: s.equalizerEnabled, equalizerBands: s.equalizerBands, equalizerPreset: s.equalizerPreset,
        skipSilence: s.skipSilence,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) document.documentElement.setAttribute('data-theme', state.theme)
      },
    }
  )
)

export { useStore }
export default useStore
