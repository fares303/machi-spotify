export const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2,'0')}`
}

export const fmtNum = (n) => {
  if (!n) return ''
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`
  return String(n)
}

export const debounce = (fn, ms) => {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

export const THEMES = [
  { id:'dark',  label:'Dark',  preview:'#0DFFB0' },
  { id:'amoled',label:'AMOLED',preview:'#00FF88' },
  { id:'light', label:'Light', preview:'#059669' },
  { id:'ocean', label:'Ocean', preview:'#38BDF8' },
  { id:'rose',  label:'Rose',  preview:'#FB7185' },
]

export const LANGUAGES = [
  { code:'en', label:'English' },
  { code:'hi', label:'हिंदी' },
  { code:'es', label:'Español' },
  { code:'fr', label:'Français' },
  { code:'de', label:'Deutsch' },
  { code:'ja', label:'日本語' },
  { code:'ko', label:'한국어' },
  { code:'pt', label:'Português' },
  { code:'ar', label:'العربية' },
]

export const EQ_PRESETS = ['flat','bass','treble','vocal','rock','electronic','classical','jazz']
