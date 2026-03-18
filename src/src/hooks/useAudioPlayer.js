import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { resolveStream } from '../services/api'
import toast from 'react-hot-toast'

export const useAudioPlayer = () => {
  const audioRef        = useRef(null)
  const acRef           = useRef(null)   // AudioContext
  const analyserRef     = useRef(null)
  const sourceRef       = useRef(null)
  const eqNodesRef      = useRef([])     // 10 BiquadFilterNode
  const gainRef         = useRef(null)
  const loadedId        = useRef(null)
  const resolving       = useRef(false)

  const {
    currentTrack, isPlaying, volume, isMuted, repeatMode,
    streamQuality, equalizerEnabled, equalizerBands, skipSilence,
    setProgress, setDuration, setBuffered, setIsPlaying, setBuffering, playNext,
  } = useStore()

  // ── Init Web Audio API ─────────────────────────────────────────────────────
  const initAC = useCallback(() => {
    if (acRef.current) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ac = new AC()
    acRef.current = ac

    // Analyser for visualizer
    const analyser = ac.createAnalyser()
    analyser.fftSize = 512
    analyserRef.current = analyser

    // 10-band EQ
    const freqs = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
    let prev = analyser
    const eqNodes = freqs.map((freq, i) => {
      const f = ac.createBiquadFilter()
      f.type = i === 0 ? 'lowshelf' : i === 9 ? 'highshelf' : 'peaking'
      f.frequency.value = freq
      f.gain.value = 0
      f.Q.value = 1.4
      prev.connect(f)
      prev = f
      return f
    })
    eqNodesRef.current = eqNodes

    gainRef.current = ac.createGain()
    prev.connect(gainRef.current)
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

  // ── Load track ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack?.videoId || !audioRef.current) return
    if (loadedId.current === currentTrack.id) return
    if (resolving.current) return

    loadedId.current  = currentTrack.id
    resolving.current = true
    setBuffering(true)

    const toastId = toast.loading(`Loading: ${currentTrack.title}`, { duration: 25000 })

    resolveStream(currentTrack.videoId, streamQuality)
      .then(url => {
        if (loadedId.current !== currentTrack.id) { toast.dismiss(toastId); return }
        if (!url) {
          toast.error('Stream not available — skipping', { id: toastId, duration: 3000 })
          setIsPlaying(false)
          setBuffering(false)
          resolving.current = false
          setTimeout(playNext, 2500)
          return
        }
        audioRef.current.src = url
        audioRef.current.load()
        if (acRef.current?.state === 'suspended') acRef.current.resume()
        toast.dismiss(toastId)
        setBuffering(false)
        resolving.current = false
      })
      .catch(err => {
        console.error('Stream resolve error:', err)
        toast.error('Error loading track', { id: toastId })
        setIsPlaying(false)
        setBuffering(false)
        resolving.current = false
      })
  }, [currentTrack?.id, streamQuality])

  // ── Play / pause ───────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    if (isPlaying) {
      initAC()
      if (!sourceRef.current && acRef.current) connectSource()
      if (acRef.current?.state === 'suspended') acRef.current.resume()
      audio.play().catch(e => { if (e.name !== 'AbortError') setIsPlaying(false) })
    } else {
      audio.pause()
    }
  }, [isPlaying, currentTrack?.id])

  // ── Volume ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // ── Equalizer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    eqNodesRef.current.forEach((node, i) => {
      if (node) node.gain.value = equalizerEnabled ? (equalizerBands[i] || 0) : 0
    })
  }, [equalizerEnabled, equalizerBands])

  // ── Skip silence ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !skipSilence) return
    const interval = setInterval(() => {
      if (!isPlaying || !audio.src) return
      if (audio.volume < 0.01 && !audio.paused) {
        audio.currentTime = Math.min(audio.currentTime + 2, audio.duration || audio.currentTime)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [skipSilence, isPlaying])

  // ── Audio events ───────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => setProgress(audio.currentTime)
    const onDur  = () => { if (!isNaN(audio.duration)) setDuration(audio.duration) }
    const onProg = () => {
      if (audio.buffered.length > 0)
        setBuffered(audio.buffered.end(audio.buffered.length - 1))
    }
    const onEnd  = () => {
      if (repeatMode === 'one') { audio.currentTime = 0; audio.play() }
      else playNext()
    }
    const onWait = () => setBuffering(true)
    const onPlay = () => setBuffering(false)
    const onErr  = () => { setBuffering(false); setIsPlaying(false) }

    audio.addEventListener('timeupdate',     onTime)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('progress',       onProg)
    audio.addEventListener('ended',          onEnd)
    audio.addEventListener('waiting',        onWait)
    audio.addEventListener('canplay',        onPlay)
    audio.addEventListener('error',          onErr)
    return () => {
      audio.removeEventListener('timeupdate',     onTime)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('progress',       onProg)
      audio.removeEventListener('ended',          onEnd)
      audio.removeEventListener('waiting',        onWait)
      audio.removeEventListener('canplay',        onPlay)
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
