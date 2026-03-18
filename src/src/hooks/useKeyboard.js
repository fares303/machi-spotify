import { useEffect } from 'react'
import { useStore } from '../store'

export const useKeyboard = (seek) => {
  const { isPlaying, togglePlay, playNext, playPrev, volume, setVolume, toggleMute, toggleShuffle, cycleRepeat, progress, duration } = useStore()
  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return
      switch (e.code) {
        case 'Space':      e.preventDefault(); togglePlay(); break
        case 'ArrowRight': e.preventDefault(); e.shiftKey ? playNext() : seek?.(Math.min(progress+10, duration)); break
        case 'ArrowLeft':  e.preventDefault(); e.shiftKey ? playPrev() : seek?.(Math.max(progress-10, 0)); break
        case 'ArrowUp':    e.preventDefault(); setVolume(Math.min(volume+0.05,1)); break
        case 'ArrowDown':  e.preventDefault(); setVolume(Math.max(volume-0.05,0)); break
        case 'KeyM': toggleMute(); break
        case 'KeyS': if(!e.ctrlKey&&!e.metaKey) toggleShuffle(); break
        case 'KeyR': if(!e.ctrlKey&&!e.metaKey) cycleRepeat(); break
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isPlaying, volume, progress, duration])
}
