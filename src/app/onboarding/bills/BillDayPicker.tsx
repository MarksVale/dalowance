'use client'

import { useState, useRef, useEffect } from 'react'

export default function BillDayPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = parseInt(value) || null

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative shrink-0 flex items-center gap-2">
      <span className="text-zinc-400 dark:text-zinc-500 text-xs">Pick a day</span>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center ${
          selected
            ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
        }`}
      >
        {selected ?? '1'}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl p-3 w-64">
          <p className="text-zinc-400 dark:text-zinc-500 text-xs mb-2.5 text-center">Which day of the month?</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => { onChange(String(d)); setOpen(false) }}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  selected === d
                    ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
