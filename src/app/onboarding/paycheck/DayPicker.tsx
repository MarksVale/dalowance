'use client'

import { useState } from 'react'

export default function DayPicker({ defaultValue }: { defaultValue?: number }) {
  const [selected, setSelected] = useState<number | null>(defaultValue ?? null)

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="paycheck_day" value={selected ?? ''} />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setSelected(d)}
            className={`
              w-10 h-10 rounded-xl text-sm font-semibold transition-all
              ${selected === d
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm scale-105'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white'
              }
            `}
          >
            {d}
          </button>
        ))}
      </div>
      {selected ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Paid on the <span className="font-semibold text-zinc-950 dark:text-white">{selected}{ordinal(selected)}</span> of each month
        </p>
      ) : (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">Pick the day you usually get paid</p>
      )}
    </div>
  )
}

function ordinal(n: number) {
  if (n >= 11 && n <= 13) return 'th'
  if (n % 10 === 1) return 'st'
  if (n % 10 === 2) return 'nd'
  if (n % 10 === 3) return 'rd'
  return 'th'
}
