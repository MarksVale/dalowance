'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RefreshCw, LayoutList, Zap, X, Minus } from 'lucide-react'
import { saveBalanceUpdate, logSpend } from './actions'

type Props = {
  currentBalance: number
  isPayday: boolean
  daysSinceUpdate: number
}

export default function HomeActions({ currentBalance, isPayday, daysSinceUpdate }: Props) {
  const [modal, setModal] = useState<'spend' | 'sync' | null>(null)
  const [isPending, startTransition] = useTransition()
  const [paydayDismissed, setPaydayDismissed] = useState(true)
  const router = useRouter()

  const now = new Date()
  const paydayKey = `payday-banner-dismissed-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    setPaydayDismissed(localStorage.getItem(paydayKey) === '1')
  }, [paydayKey])

  function dismissPayday() {
    localStorage.setItem(paydayKey, '1')
    setPaydayDismissed(true)
  }

  function handleSpend(formData: FormData) {
    startTransition(async () => {
      await logSpend(formData)
      setModal(null)
      router.refresh()
    })
  }

  function handleSync(formData: FormData) {
    startTransition(async () => {
      await saveBalanceUpdate(formData)
      setModal(null)
      router.refresh()
    })
  }

  const showPayday = isPayday && daysSinceUpdate > 1 && !paydayDismissed
  const showStale = !showPayday && daysSinceUpdate > 1

  return (
    <>
      {/* Payday banner — fixed at top */}
      {showPayday && (
        <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900/60 px-4 py-3">
          <button
            onClick={() => setModal('sync')}
            className="flex-1 text-left text-sm text-emerald-700 dark:text-emerald-300 font-medium"
          >
            🎉 Payday! Tap to update your balance.
          </button>
          <button onClick={dismissPayday} className="text-emerald-500 dark:text-emerald-400 shrink-0 p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stale balance warning */}
      {showStale && (
        <button
          onClick={() => setModal('sync')}
          className="w-full max-w-sm rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 px-4 py-3 text-left text-sm text-amber-600 dark:text-amber-400"
        >
          Balance last updated {daysSinceUpdate} {daysSinceUpdate === 1 ? 'day' : 'days'} ago — tap to sync
        </button>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 w-full">
        <button
          onClick={() => setModal('spend')}
          className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3.5 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Minus size={14} />
          I spent
        </button>
        <button
          onClick={() => setModal('sync')}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm font-medium py-3.5 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          <RefreshCw size={14} />
          Sync
        </button>
        <Link
          href="/bills"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm font-medium py-3.5 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          <LayoutList size={14} />
          Bills
        </Link>
        <Link
          href="/simulate"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm font-medium py-3.5 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          <Zap size={14} />
          What if?
        </Link>
      </div>

      {/* Spend modal */}
      {modal === 'spend' && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-950 dark:text-white font-semibold">Log a spend</h2>
              <button onClick={() => setModal(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form action={handleSpend} className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                <input
                  name="amount" type="number" step="0.01" min="0.01" required autoFocus placeholder="0.00"
                  className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 pl-8 pr-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                />
              </div>
              <input
                name="note" type="text" placeholder="What was it for? (optional)"
                className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
              <button
                type="submit" disabled={isPending}
                className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Logging…' : 'Log spend'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sync modal */}
      {modal === 'sync' && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-950 dark:text-white font-semibold">Sync balance</h2>
              <button onClick={() => setModal(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-zinc-500 text-sm -mt-2">Enter your actual bank balance to correct any drift.</p>
            <form action={handleSync} className="flex flex-col gap-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                <input
                  name="balance" type="number" step="0.01" min="0" required defaultValue={currentBalance} autoFocus
                  className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 pl-8 pr-4 py-3 text-zinc-950 dark:text-white text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                />
              </div>
              <button
                type="submit" disabled={isPending}
                className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Save balance'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
