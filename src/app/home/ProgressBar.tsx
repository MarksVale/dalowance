'use client'

import { useEffect, useState } from 'react'

export default function ProgressBar({ percent }: { percent: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 80)
    return () => clearTimeout(t)
  }, [percent])

  return (
    <div className="w-full h-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
