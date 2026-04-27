'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingDown } from 'lucide-react'
import { calcAllowance, allowanceColor, formatAllowance } from '@/lib/calc'
import { saveBalanceUpdate } from '@/app/home/actions'

type Bill = { amount: number; day_of_month: number }

type Props = {
  currentBalance: number
  currentAllowance: number
  daysRemaining: number
  paycheckDay: number
  paycheckAmount: number
  bufferAmount: number
  bills: Bill[]
}

export default function SimulateClient(props: Props) {
  const [spendInput, setSpendInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const spend = parseFloat(spendInput) || 0
  const newBalance = props.currentBalance - spend

  const simResult =
    spend > 0
      ? calcAllowance({
          balance: newBalance,
          paycheckDay: props.paycheckDay,
          paycheckAmount: props.paycheckAmount,
          bufferAmount: props.bufferAmount,
          bills: props.bills,
        })
      : null

  const newAllowance = simResult?.allowance ?? props.currentAllowance
  const drop = spend > 0 ? props.currentAllowance - newAllowance : 0
  const color = simResult
    ? allowanceColor(newAllowance, props.paycheckAmount)
    : 'text-zinc-400 dark:text-zinc-500'

  function handleSpend() {
    if (spend <= 0) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('balance', String(newBalance))
      await saveBalanceUpdate(fd)
      router.push('/home')
    })
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-8">
      <div className="max-w-sm mx-auto flex flex-col gap-8">

        <div className="flex items-center gap-3">
          <Link href="/home" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors p-1 -ml-1">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-zinc-950 dark:text-white font-semibold text-lg">What if I spend…</h1>
        </div>

        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 text-2xl pointer-events-none">€</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={spendInput}
            onChange={e => setSpendInput(e.target.value)}
            placeholder="0.00"
            autoFocus
            className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-11 pr-5 py-5 text-zinc-950 dark:text-white text-2xl font-semibold placeholder:text-zinc-300 dark:placeholder:text-zinc-700 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          />
        </div>

        <div className={`rounded-2xl border p-6 flex flex-col gap-5 transition-opacity duration-300 ${
          simResult
            ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-100'
            : 'bg-zinc-100/40 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-900 opacity-40'
        }`}>
          <div className="flex flex-col gap-1">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">New daily allowance</p>
            <p className={`text-5xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${color}`}>
              {formatAllowance(newAllowance)}
            </p>
          </div>

          {spend > 0 && (
            <div className="flex flex-col gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className="text-red-400 shrink-0" />
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                  Down <span className="text-red-400 font-medium">{formatAllowance(Math.abs(drop))}</span> per day
                </span>
              </div>
              <p className="text-zinc-400 dark:text-zinc-600 text-sm">
                {props.daysRemaining} {props.daysRemaining === 1 ? 'day' : 'days'} until payday
              </p>
            </div>
          )}
        </div>

        {spend > 0 && (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSpend}
              disabled={isPending}
              className="w-full rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3.5 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving…' : `Yes, I'm spending €${spend.toFixed(2)}`}
            </button>
            <Link
              href="/home"
              className="text-center text-zinc-400 dark:text-zinc-500 text-sm hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-2"
            >
              Never mind
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}
