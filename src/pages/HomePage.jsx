import React from 'react'
import { motion } from 'framer-motion'
import { HiPlay, HiArrowRight, HiFire } from 'react-icons/hi'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { searchAll } from '../services/api'
import { useStore } from '../store'
import TrackCard from '../components/UI/TrackCard'

// 🇩🇿 Algeria-focused trending queries — Arabic/Algerian/North African music
// Absolutely no Bollywood/Indian suggestions
const DZ_TRENDING_QUERIES = [
  'أغاني جزائرية 2024',           // Algerian songs 2024
  'music algerienne 2024',
  'rai algerien 2024',
  'cheb khaled 2024',
  'amazigh music algerie',
]

const Skeleton = () => (
  <div className="card p-3">
    <div className="aspect-square shimmer rounded-xl mb-3"/>
    <div className="h-3.5 shimmer rounded w-3/4 mb-2"/>
    <div className="h-3 shimmer rounded w-1/2"/>
  </div>
)

const greet = () => {
  const h = new Date().getHours()
  if (h < 5)  return ['🌙', 'Late night vibes']
  if (h < 12) return ['☀️', 'Good morning']
  if (h < 18) return ['🎵', 'Good afternoon']
  if (h < 22) return ['🌆', 'Good evening']
  return ['⭐', 'Good night']
}

export default function HomePage() {
  const navigate = useNavigate()
  const { setQueue, recentlyPlayed } = useStore()
  const [emoji, greeting] = greet()

  // Pick a random Algerian query on each page load
  const trendQuery = DZ_TRENDING_QUERIES[Math.floor(Math.random() * DZ_TRENDING_QUERIES.length)]

  const { data: trending = [], isLoading } = useQuery({
    queryKey: ['dz-trending', trendQuery],
    queryFn: () => searchAll(trendQuery, 20),
    staleTime: 15 * 60 * 1000,
  })

  // Second batch with a different query for variety
  const { data: trending2 = [] } = useQuery({
    queryKey: ['dz-trending2'],
    queryFn: () => searchAll('أحسن أغاني عربية 2024', 12),
    staleTime: 15 * 60 * 1000,
  })

  const allTrending = [...trending, ...trending2].filter(
    (t, i, self) => self.findIndex(x => x.id === t.id) === i
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 md:pb-8">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden mx-3 mt-3 mb-6 rounded-2xl p-5 sm:p-8 min-h-[180px] sm:min-h-[220px] flex flex-col justify-end"
        style={{ background: 'linear-gradient(135deg, var(--color-surface-3) 0%, var(--color-surface-2) 100%)', border: '1px solid var(--glass-border)' }}>

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[['30% 40%','var(--color-secondary)'], ['72% 20%','var(--color-primary)'], ['55% 80%','var(--color-accent)']].map(([pos, col], i) => (
            <motion.div key={i}
              className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full opacity-[0.12]"
              style={{ background: `radial-gradient(circle, ${col}, transparent)`, left: pos.split(' ')[0], top: pos.split(' ')[1], transform: 'translate(-50%,-50%)' }}
              animate={{ x: [0, 15, 0], y: [0, -12, 0] }}
              transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <p className="text-xs sm:text-sm mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>{emoji} {greeting}</p>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold mb-1 sm:mb-2">
            <span className="gradient-text">Machi Spotify</span>
          </h1>
          <p className="text-xs sm:text-sm mb-4" style={{ color: 'var(--color-on-surface-muted)' }}>
            🇩🇿 Algeria · Stream · No Ads · No Login
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {allTrending.length > 0 && (
              <motion.button whileTap={{ scale: 0.96 }}
                className="btn-primary text-xs sm:text-sm px-4 py-2"
                onClick={() => setQueue(allTrending, 0)}>
                <HiPlay /> Play Trending
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.96 }}
              className="btn-ghost text-xs sm:text-sm px-4 py-2"
              onClick={() => navigate('/search')}>
              <HiArrowRight /> Browse
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── 🔥 Trending in Algeria — MAIN SECTION ── */}
      <div className="px-3 sm:px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiFire className="text-orange-400 text-xl" />
            <h2 className="text-lg sm:text-xl font-display font-bold">Trending in Algeria</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(13,255,176,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(13,255,176,0.2)' }}>🇩🇿 DZ</span>
          </div>
          <button onClick={() => navigate('/discover')}
            className="flex items-center gap-1 text-xs sm:text-sm hover:text-white transition-colors"
            style={{ color: 'var(--color-on-surface-muted)' }}>
            See all <HiArrowRight className="text-xs" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array(10).fill(0).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {allTrending.slice(0, 10).map((t, i) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}>
                <TrackCard track={t} queue={allTrending} index={i} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Ranked Top 10 list ── */}
      {allTrending.length >= 5 && (
        <div className="px-3 sm:px-6 mb-6">
          <h2 className="text-base sm:text-lg font-display font-bold mb-3">📊 Top 10 Algeria</h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--glass-border)' }}>
            {allTrending.slice(0, 10).map((t, i) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03 } }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer group transition-colors"
                style={{ borderBottom: i < 9 ? '1px solid var(--glass-border)' : undefined }}
                onClick={() => setQueue(allTrending, i)}>
                <span className="w-6 text-center font-mono text-sm font-bold flex-shrink-0"
                  style={{ color: i < 3 ? 'var(--color-primary)' : 'var(--color-on-surface-muted)' }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </span>
                <img src={t.cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  onError={e => e.target.src = 'https://placehold.co/40x40/161622/0DFFB0?text=♫'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-muted)' }}>{t.artist}</p>
                </div>
                <HiPlay className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  style={{ color: 'var(--color-primary)' }} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recently played ── */}
      {recentlyPlayed.length > 0 && (
        <div className="px-3 sm:px-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-display font-bold">🕐 Recently Played</h2>
            <button onClick={() => navigate('/library?tab=recent')}
              className="text-xs hover:text-white transition-colors flex items-center gap-1"
              style={{ color: 'var(--color-on-surface-muted)' }}>
              See all <HiArrowRight className="text-xs" />
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--glass-border)' }}>
            {recentlyPlayed.slice(0, 5).map((t, i) => (
              <TrackCard key={`${t.id}_${i}`} track={t} queue={recentlyPlayed} index={i} compact />
            ))}
          </div>
        </div>
      )}

    </motion.div>
  )
}
