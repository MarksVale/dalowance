const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

type BarData = { day: Date; allowance: number | null }

export default function History({
  data,
  paycheckAmount,
}: {
  data: BarData[]
  paycheckAmount: number
}) {
  const idealDaily = paycheckAmount > 0 ? paycheckAmount / 30 : 1
  const nonNullValues = data.map(d => d.allowance ?? 0).filter(v => v > 0)
  const maxVal = Math.max(...nonNullValues, idealDaily, 1)
  const greenCount = data.filter(d => d.allowance !== null && d.allowance / idealDaily >= 0.7).length

  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      <p className="text-zinc-500 text-xs uppercase tracking-widest">Last 7 days</p>

      <div className="flex items-end gap-1.5 h-14">
        {data.map((d, i) => {
          const isToday = i === data.length - 1
          const label = <span className={`text-[10px] leading-none mt-1 ${isToday ? 'text-zinc-500 dark:text-zinc-400 font-medium' : 'text-zinc-400 dark:text-zinc-600'}`}>{DAY_LABELS[d.day.getDay()]}</span>

          if (d.allowance === null) {
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <div className="w-full rounded-t-sm bg-zinc-100 dark:bg-zinc-800/40" style={{ height: '6px' }} />
                {label}
              </div>
            )
          }

          const ratio = d.allowance / idealDaily
          const heightPct = Math.max(8, Math.min(100, (d.allowance / maxVal) * 100))
          const barColor = ratio >= 0.7
            ? 'bg-emerald-500 dark:bg-emerald-400'
            : ratio >= 0.3
            ? 'bg-amber-500 dark:bg-amber-400'
            : 'bg-red-500 dark:bg-red-400'

          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <div className={`w-full rounded-t-sm ${barColor}`} style={{ height: `${heightPct}%` }} />
              {label}
            </div>
          )
        })}
      </div>

      <p className="text-zinc-400 dark:text-zinc-600 text-xs">
        {greenCount} of last 7 {greenCount === 1 ? 'day was' : 'days were'} green
      </p>
    </div>
  )
}
