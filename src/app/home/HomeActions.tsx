'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RefreshCw, LayoutList, Zap, X } from 'lucide-react'
import { saveBalanceUpdate } from './actions'

export default function HomeActions({ currentBalance }: { currentBalance: number }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await saveBalanceUpdate(formData)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex gap-3 w-full">
        <button
          onClick={() => setOpen(true)}
          className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3.5 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <RefreshCw size={14} />
          Update balance
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

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-950 dark:text-white font-semibold">Update balance</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form action={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                <input
                  name="balance"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={currentBalance}
                  autoFocus
                  className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 pl-8 pr-4 py-3 text-zinc-950 dark:text-white text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
