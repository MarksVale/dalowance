'use client'

import { useEffect, useRef, useState } from 'react'

export default function TheNumber({
  amount,
  color,
}: {
  amount: number
  color: string
}) {
  const [displayed, setDisplayed] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const duration = 700
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayed(amount * eased)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [amount])

  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(displayed)

  return (
    <p className={`text-8xl sm:text-9xl font-bold tracking-tight leading-none tabular-nums transition-colors duration-500 ${color}`}>
      {sign}€{abs.toFixed(2)}
    </p>
  )
}
