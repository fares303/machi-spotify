import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { HiCheck, HiMoon, HiSun, HiClock, HiVolumeUp, HiTranslate } from 'react-icons/hi'
import { MdEqualizer, MdSkipNext } from 'react-icons/md'
import { useStore } from '../store'
import { THEMES, LANGUAGES, EQ_PRESETS } from '../utils/helpers'
import toast from 'react-hot-toast'

const Row = ({icon:Icon,title,desc,children}) => (
  <div className="flex items-start justify-between gap-4 py-4 border-b" style={{borderColor:'var(--glass-border)'}}>
    <div className="flex items-start gap-3">
      {Icon && <div className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'color-mix(in srgb, var(--color-primary) 12%, transparent)'}}>
        <Icon style={{color:'var(--color-primary)'}}/>
      </div>}
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {desc && <p className="text-xs mt-0.5" style={{color:'var(--color-on-surface-muted)'}}>{desc}</p>}
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
)

const Toggle = ({value,onChange}) => (
  <button onClick={()=>onChange(!value)}
    className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
    style={{background:value?'var(--color-primary)':'var(--glass-border)'}}>
    <motion.div animate={{x:value?20:2}} transition={{type:'spring',stiffness:400,damping:30}}
      className="absolute top-1 w-4 h-4 rounded-full" style={{background:value?'var(--color-surface)':'var(--color-on-surface-muted)'}}/>
  </button>
)

export default function SettingsPage() {
  const {
    theme, setTheme, navPosition, setNavPosition, language, setLanguage,
    streamQuality, setStreamQuality, skipSilence, toggleSkipSilence,
    equalizerEnabled, equalizerPreset, toggleEqualizerEnabled, setEqualizerPreset,
    equalizerBands, setEqualizerBand,
    sleepTimerEnd, setSleepTimer,
  } = useStore()

  const remaining = sleepTimerEnd ? Math.max(0, Math.ceil((sleepTimerEnd - Date.now()) / 60000)) : 0

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="p-6 pb-12 max-w-2xl">
      <h1 className="text-3xl font-display font-extrabold mb-6">Settings</h1>

      {/* Theme */}
      <Section title="Appearance" icon={HiMoon}>
        <Row title="Theme" desc="Choose your visual style">
          <div className="flex gap-2 flex-wrap">
            {THEMES.map(t=>(
              <button key={t.id} onClick={()=>setTheme(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{background:theme===t.id?t.preview:'var(--glass-bg)',color:theme===t.id?'#000':'var(--color-on-surface-muted)',border:`1px solid ${theme===t.id?t.preview:'var(--glass-border)'}`}}>
                {theme===t.id && <HiCheck className="text-xs"/>}{t.label}
              </button>
            ))}
          </div>
        </Row>

        <Row title="Navigation Bar" desc="Position of the navigation">
          <div className="flex gap-2">
            {['side','bottom'].map(p=>(
              <button key={p} onClick={()=>setNavPosition(p)}
                className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
                style={{background:navPosition===p?'var(--color-primary)':'var(--glass-bg)',color:navPosition===p?'var(--color-surface)':'var(--color-on-surface-muted)',border:`1px solid ${navPosition===p?'var(--color-primary)':'var(--glass-border)'}`}}>
                {p}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      {/* Playback */}
      <Section title="Playback" icon={HiVolumeUp}>
        <Row title="Streaming Quality" desc="Higher quality uses more data">
          <div className="flex gap-2">
            {[{v:'high',l:'High'},{v:'medium',l:'Medium'},{v:'low',l:'Low'}].map(({v,l})=>(
              <button key={v} onClick={()=>setStreamQuality(v)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{background:streamQuality===v?'var(--color-primary)':'var(--glass-bg)',color:streamQuality===v?'var(--color-surface)':'var(--color-on-surface-muted)',border:`1px solid ${streamQuality===v?'var(--color-primary)':'var(--glass-border)'}`}}>
                {l}
              </button>
            ))}
          </div>
        </Row>
        <Row title="Skip Silence" desc="Automatically skip silent sections">
          <Toggle value={skipSilence} onChange={toggleSkipSilence}/>
        </Row>
      </Section>

      {/* Equalizer */}
      <Section title="Equalizer" icon={MdEqualizer}>
        <Row title="Enable Equalizer" desc="Apply audio EQ filters">
          <Toggle value={equalizerEnabled} onChange={toggleEqualizerEnabled}/>
        </Row>
        <Row title="Preset" desc="Choose a built-in EQ preset">
          <div className="flex gap-1.5 flex-wrap max-w-xs">
            {EQ_PRESETS.map(p=>(
              <button key={p} onClick={()=>setEqualizerPreset(p)}
                className="px-2.5 py-1 rounded-full text-xs capitalize transition-all"
                style={{background:equalizerPreset===p?'var(--color-primary)':'var(--glass-bg)',color:equalizerPreset===p?'var(--color-surface)':'var(--color-on-surface-muted)',border:`1px solid ${equalizerPreset===p?'var(--color-primary)':'var(--glass-border)'}`}}>
                {p}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      {/* Sleep Timer */}
      <Section title="Sleep Timer" icon={HiClock}>
        <Row title="Auto Stop Playback" desc={sleepTimerEnd ? `Stops in ~${remaining} min` : 'Set timer to auto-pause music'}>
          <div className="flex gap-2 flex-wrap">
            {[15,30,45,60,90].map(m=>(
              <button key={m} onClick={()=>{setSleepTimer(m);toast.success(`Sleep timer: ${m} min`)}}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{background:'var(--glass-bg)',color:'var(--color-on-surface-muted)',border:'1px solid var(--glass-border)'}}>
                {m}m
              </button>
            ))}
            {sleepTimerEnd && <button onClick={()=>setSleepTimer(null)} className="px-3 py-1.5 rounded-full text-xs font-medium text-red-400" style={{border:'1px solid rgba(248,113,113,0.3)'}}>Cancel</button>}
          </div>
        </Row>
      </Section>

      {/* Language */}
      <Section title="Language" icon={HiTranslate}>
        <Row title="App Language" desc="Interface language">
          <select value={language} onChange={e=>setLanguage(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl outline-none cursor-pointer"
            style={{background:'var(--color-surface-2)',color:'var(--color-on-surface)',border:'1px solid var(--glass-border)'}}>
            {LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </Row>
      </Section>

      {/* About */}
      
    </motion.div>
  )
}

function Section({title,icon:Icon,children}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-1">

        {Icon && <Icon style={{color:'var(--color-primary)'}}/>}
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{color:'var(--color-on-surface-muted)'}}>{title}</h2>
      </div>
      <div className="rounded-2xl px-4" style={{background:'var(--color-surface-2)',border:'1px solid var(--glass-border)'}}>
        {children}
      </div>
    </div>
  )
}
