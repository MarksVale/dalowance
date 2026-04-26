import { cookies } from 'next/headers'
import { saveBalanceStep } from '../actions'

const steps = [0, 1, 2, 3]

export default async function BalancePage() {
  const store = await cookies()
  let prevBalance: number | undefined
  try {
    const data = JSON.parse(store.get('onboarding')?.value ?? '{}')
    prevBalance = data.balance
  } catch {}

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-xs font-medium tracking-wider uppercase">Step 1 of 4</p>
        <div className="flex gap-1">
          {steps.map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-zinc-950 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">What&apos;s in your account right now?</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">Check your bank app and type the number.</p>
      </div>

      <form action={saveBalanceStep} className="flex flex-col gap-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
          <input
            name="balance"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={prevBalance}
            placeholder="0.00"
            autoFocus
            className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-8 pr-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          Next →
        </button>
      </form>
    </div>
  )
}
