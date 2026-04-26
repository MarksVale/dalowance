'use client'

import { Banknote, Receipt } from 'lucide-react'
import type { ForecastSegment } from '@/lib/calc'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function dailyColor(allowance: number, paycheckAmount: number): string {
  const idealDaily = paycheckAmount > 0 ? paycheckAmount / 30 : 1
  const ratio = allowance / idealDaily
  if (ratio >= 0.7) return 'text-emerald-600 dark:text-emerald-400'
  if (ratio >= 0.3) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export default function ForecastCalendar({
  segments,
  paycheckAmount,
}: {
  segments: ForecastSegment[]
  paycheckAmount: number
}) {
  return (
    <div className="w-full max-w-sm flex flex-col">
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Your cycle</p>

      <div className="flex flex-col">
        {segments.map((seg, i) => {
          if (seg.type === 'period') {
            const color = dailyColor(seg.dailyAllowance, paycheckAmount)
            return (
              <div
                key={i}
                className={`flex items-center gap-2 min-h-[44px] px-3 ${
                  seg.isToday
                    ? 'border-l-2 border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-900/60 rounded-r-lg'
                    : 'pl-[14px]'
                }`}
              >
                <span className="text-zinc-500 dark:text-zinc-400 text-sm flex-1 min-w-0">
                  {seg.isToday && (
                    <span className="text-zinc-950 dark:text-white text-[10px] font-semibold uppercase tracking-wider mr-1.5">
                      Today
                    </span>
                  )}
                  {fmtDate(seg.fromDate)} – {fmtDate(seg.toDate)}
                </span>
                <span className={`text-sm font-semibold tabular-nums shrink-0 ${color}`}>
                  €{seg.dailyAllowance.toFixed(2)}/day
                </span>
                <span className="text-zinc-400 dark:text-zinc-600 text-xs tabular-nums w-8 text-right shrink-0">
                  {seg.days}d
                </span>
              </div>
            )
          }

          if (seg.type === 'paycheck') {
            return (
              <div key={i} className="relative flex items-center py-1.5 min-h-[44px]">
                <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-200 dark:bg-emerald-900/50" />
                <div className="relative z-10 flex items-center gap-2.5 w-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-lg px-3 py-2">
                  <div className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                    <Banknote size={12} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-emerald-700 dark:text-emerald-300 text-sm font-medium flex-1">Paycheck</span>
                  <span className="text-zinc-400 dark:text-zinc-500 text-xs shrink-0">{fmtDate(seg.date)}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold tabular-nums shrink-0">
                    +€{seg.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          }

          if (seg.type === 'bill') {
            return (
              <div key={i} className="relative flex items-center py-1.5 min-h-[44px]">
                <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200 dark:bg-zinc-800" />
                <div className="relative z-10 flex items-center gap-2.5 w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                  <div className="size-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Receipt size={12} className="text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <span className="text-zinc-950 dark:text-white text-sm font-medium flex-1 truncate">{seg.name}</span>
                  <span className="text-zinc-400 dark:text-zinc-500 text-xs shrink-0">{fmtDate(seg.date)}</span>
                  <span className="text-red-600 dark:text-red-400 text-sm font-semibold tabular-nums shrink-0">
                    −€{seg.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
