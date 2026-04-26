import { cookies } from 'next/headers'
import Link from 'next/link'
import { savePaycheckStep } from '../actions'

const steps = [0, 1, 2, 3]

export default async function PaycheckPage() {
  const store = await cookies()
  let prev: { paycheck_day?: number; paycheck_amount?: number } = {}
  try { prev = JSON.parse(store.get('onboarding')?.value ?? '{}') } catch {}

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-xs font-medium tracking-wider uppercase">Step 2 of 4</p>
        <div className="flex gap-1">
          {steps.map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= 1 ? 'bg-zinc-950 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">When do you get paid?</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">Roughly when and how much. You can adjust later.</p>
      </div>

      <form action={savePaycheckStep} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-500 text-xs uppercase tracking-wider">Day of month</label>
          <select
            name="paycheck_day"
            required
            defaultValue={prev.paycheck_day ?? ''}
            className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-zinc-950 dark:text-white text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors appearance-none cursor-pointer"
          >
            <option value="" disabled>Select day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-500 text-xs uppercase tracking-wider">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
            <input
              name="paycheck_amount"
              type="number"
              step="0.01"
              min="1"
              required
              defaultValue={prev.paycheck_amount}
              placeholder="0.00"
              className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-8 pr-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Link
            href="/onboarding/balance"
            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium text-sm py-3 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            ← Back
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Next →
          </button>
        </div>
      </form>
    </div>
  )
}
