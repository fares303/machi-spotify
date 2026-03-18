import React from 'react'
import { motion } from 'framer-motion'
import { HiChevronRight } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'

export default function SectionHeader({ title, subtitle, link, action }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-xl font-display font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {(link || action) && (
        <button
          onClick={action || (() => navigate(link))}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          See all <HiChevronRight />
        </button>
      )}
    </div>
  )
}
