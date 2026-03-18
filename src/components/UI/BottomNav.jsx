import React from 'react'
import { NavLink } from 'react-router-dom'
import { HiHome, HiSearch, HiCollection } from 'react-icons/hi'
import { MdExplore } from 'react-icons/md'

const TABS = [
  { icon: HiHome,        label: 'Home',     to: '/' },
  { icon: HiSearch,      label: 'Search',   to: '/search' },
  { icon: MdExplore,     label: 'Discover', to: '/discover' },
  { icon: HiCollection,  label: 'Library',  to: '/library' },
]

export default function BottomNav() {
  return (
    <div className="flex items-center justify-around flex-shrink-0"
      style={{
        background: 'var(--color-surface-2)',
        borderTop: '1px solid var(--glass-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 6px)',
      }}>
      {TABS.map(({ icon: Icon, label, to }) => (
        <NavLink key={to} to={to} end={to === '/'}
          className="flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-colors"
          style={({ isActive }) => ({
            color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-muted)',
          })}>
          {({ isActive }) => (
            <>
              <div className="relative flex items-center justify-center w-6 h-6">
                <Icon className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform`}/>
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: 'var(--color-primary)' }}/>
                )}
              </div>
              <span className="text-[9px] font-semibold leading-none mt-0.5">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
