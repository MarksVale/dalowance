'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, X } from 'lucide-react'
import { saveBalanceUpdate } from './actions'

export default function UpdateBalanceModal({ currentBalance }: { currentBalance: number }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await saveBalanceUpdate(formData)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-zinc-800 px-5 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
      >
        <RefreshCw size={14} />
        Update balance
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Update balance</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form action={handleAction} className="flex flex-col gap-4">
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
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 pl-8 pr-4 py-3 text-white text-sm outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-white text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-100 transition-colors disabled:opacity-50"
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
