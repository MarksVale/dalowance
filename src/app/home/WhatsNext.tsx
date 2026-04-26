import { Banknote, Receipt } from 'lucide-react'
import { type UpcomingEvent, formatPaycheckDate } from '@/lib/calc'

export default function WhatsNext({
  events,
  estimatedDailyAfterPaycheck,
}: {
  events: UpcomingEvent[]
  estimatedDailyAfterPaycheck: number
}) {
  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      <p className="text-zinc-500 text-xs uppercase tracking-widest">What&apos;s next</p>

      {events.length === 0 ? (
        <p className="text-zinc-400 dark:text-zinc-600 text-sm">Nothing scheduled until payday.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event, i) => (
            <div key={i}>
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                event.type === 'paycheck'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
              }`}>
                <div className={`shrink-0 size-7 rounded-full flex items-center justify-center ${
                  event.type === 'paycheck'
                    ? 'bg-emerald-100 dark:bg-emerald-900/60'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                  {event.type === 'paycheck'
                    ? <Banknote size={13} className="text-emerald-600 dark:text-emerald-400" />
                    : <Receipt size={13} className="text-zinc-500 dark:text-zinc-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    event.type === 'paycheck'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-zinc-950 dark:text-white'
                  }`}>
                    {event.name}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">{formatPaycheckDate(event.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold tabular-nums ${
                    event.type === 'paycheck'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-950 dark:text-white'
                  }`}>
                    {event.type === 'paycheck' ? '+' : '-'}€{event.amount.toFixed(2)}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {event.daysUntil === 0 ? 'today' : `in ${event.daysUntil}d`}
                  </p>
                </div>
              </div>
              {event.type === 'paycheck' && estimatedDailyAfterPaycheck > 0 && (
                <p className="text-zinc-400 dark:text-zinc-600 text-xs px-1 mt-1.5">
                  After paycheck, daily resets to ~€{estimatedDailyAfterPaycheck.toFixed(2)}/day
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
