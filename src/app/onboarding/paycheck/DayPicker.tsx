'use client'

import { useState } from 'react'

export default function DayPicker({ defaultValue }: { defaultValue?: number }) {
  const [selected, setSelected] = useState<number | null>(defaultValue ?? null)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="paycheck_day" value={selected ?? ''} />
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setSelected(d)}
            className={`
              aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center
              ${selected === d
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
                : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600'
              }
            `}
          >
            {d}
          </button>
        ))}
      </div>
      {!selected && (
        <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center mt-1">Tap the day you usually get paid</p>
      )}
      {selected && (
        <p className="text-zinc-500 dark:text-zinc-400 text-xs text-center mt-1">
          You get paid on the <span className="font-semibold text-zinc-950 dark:text-white">{selected}{ordinal(selected)}</span> of each month
        </p>
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
