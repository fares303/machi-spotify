import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { resolveStream } from '../services/api'
import toast from 'react-hot-toast'

export const useAudioPlayer = () => {
  const audioRef    = useRef(null)
  const acRef       = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef   = useRef(null)
  const gainRef     = useRef(null)
  const loadedId    = useRef(null)
  const resolving   = useRef(false)

  const {
    currentTrack, isPlaying, volume, isMuted, repeatMode,
    setProgress, setDuration, setBuffered, setIsPlaying, setBuffering, playNext,
  } = useStore()

  const initAC = useCallback(() => {
    if (acRef.current) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ac = new AC()
    acRef.current = ac
    analyserRef.current = ac.createAnalyser()
    analyserRef.current.fftSize = 512
    gainRef.current = ac.createGain()
    analyserRef.current.connect(gainRef.current)
    gainRef.current.connect(ac.destination)
  }, [])

  const connectSource = useCallback(() => {
    if (!audioRef.current || !acRef.current) return
    if (sourceRef.current) {
      try { sourceRef.current.disconnect() } catch {}
      sourceRef.current = null
    }
    try {
      sourceRef.current = acRef.current.createMediaElementSource(audioRef.current)
      sourceRef.current.connect(analyserRef.current)
    } catch {}
  }, [])

  // ── Load + resolve stream when track changes ──────────────────────────────
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return
    if (loadedId.current === currentTrack.id) return
    if (resolving.current) return

    loadedId.current  = currentTrack.id
    resolving.current = true
    setBuffering(true)

    const tid = toast.loading(`Loading "${currentTrack.title}"…`, { duration: 30000 })

    resolveStream(currentTrack)
      .then(url => {
        resolving.current = false

        // Track changed while resolving — abort silently
        if (loadedId.current !== currentTrack.id) {
          toast.dismiss(tid)
          return
        }

        if (!url) {
          toast.error(`Couldn't stream "${currentTrack.title}" — skipping`, { id: tid, duration: 3000 })
          setIsPlaying(false)
          setBuffering(false)
          setTimeout(playNext, 2500)
          return
        }

        const audio = audioRef.current
        audio.src   = url
        audio.load()
        if (acRef.current?.state === 'suspended') acRef.current.resume()
        toast.dismiss(tid)
        setBuffering(false)
      })
      .catch(err => {
        resolving.current = false
        console.error('[Audio] resolveStream threw:', err)
        toast.error('Stream error', { id: tid, duration: 2000 })
        setIsPlaying(false)
        setBuffering(false)
      })
  }, [currentTrack?.id])

  // ── Play / Pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.src || audio.src === window.location.href) return

    if (isPlaying) {
      initAC()
      if (!sourceRef.current && acRef.current) connectSource()
      if (acRef.current?.state === 'suspended') acRef.current.resume()
      audio.play().catch(e => {
        if (e.name !== 'AbortError') {
          console.warn('[Audio] play() failed:', e.message)
          setIsPlaying(false)
        }
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, currentTrack?.id])

  // ── Volume ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume))
  }, [volume, isMuted])

  // ── Audio events ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime  = () => setProgress(audio.currentTime)
    const onDur   = () => { if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration) }
    const onProg  = () => {
      if (audio.buffered.length > 0)
        setBuffered(audio.buffered.end(audio.buffered.length - 1))
    }
    const onEnd = () => {
      if (repeatMode === 'one') { audio.currentTime = 0; audio.play().catch(() => {}) }
      else playNext()
    }
    const onWait  = () => setBuffering(true)
    const onReady = () => {
      setBuffering(false)
      // Auto-play when canplay fires if we're supposed to be playing
      if (useStore.getState().isPlaying) {
        audio.play().catch(() => {})
      }
    }
    const onErr = () => {
      setBuffering(false)
      setIsPlaying(false)
      console.error('[Audio] HTMLMediaElement error code:', audio.error?.code)
    }

    audio.addEventListener('timeupdate',     onTime)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('progress',       onProg)
    audio.addEventListener('ended',          onEnd)
    audio.addEventListener('waiting',        onWait)
    audio.addEventListener('canplay',        onReady)
    audio.addEventListener('error',          onErr)
    return () => {
      audio.removeEventListener('timeupdate',     onTime)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('progress',       onProg)
      audio.removeEventListener('ended',          onEnd)
      audio.removeEventListener('waiting',        onWait)
      audio.removeEventListener('canplay',        onReady)
      audio.removeEventListener('error',          onErr)
    }
  }, [repeatMode])

  const seek = useCallback((t) => {
    if (audioRef.current) { audioRef.current.currentTime = t; setProgress(t) }
  }, [])

  const getAnalyserData = useCallback(() => {
    if (!analyserRef.current) return null
    const d = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(d)
    return d
  }, [])

  return { audioRef, analyserRef, seek, getAnalyserData, initAC }
}
