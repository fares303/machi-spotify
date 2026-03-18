import React from 'react'

export function CardSkeleton() {
  return (
    <div className="card">
      <div className="w-full aspect-square shimmer rounded-xl mb-3" />
      <div className="h-4 shimmer rounded w-3/4 mb-2" />
      <div className="h-3 shimmer rounded w-1/2" />
    </div>
  )
}

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="w-10 h-10 shimmer rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3.5 shimmer rounded w-2/3 mb-2" />
        <div className="h-3 shimmer rounded w-1/3" />
      </div>
      <div className="h-3 shimmer rounded w-10" />
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-80 shimmer rounded-3xl" />
  )
}
