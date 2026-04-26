import { cookies } from 'next/headers'
import Link from 'next/link'
import { calcAllowance, allowanceColor, formatAllowance, formatPaycheckDate } from '@/lib/calc'
import { saveOnboarding } from '../actions'

type Props = {
  searchParams: Promise<{ error?: string }>
}

export default async function DonePage({ searchParams }: Props) {
  const store = await cookies()
  let data: {
    balance?: number
    paycheck_day?: number
    paycheck_amount?: number
    buffer_amount?: number
    bills?: Array<{ name: string; amount: number; day_of_month: number }>
  } = {}
  try { data = JSON.parse(store.get('onboarding')?.value ?? '{}') } catch {}

  const { error } = await searchParams

  const hasAllData =
    data.balance != null && data.paycheck_day && data.paycheck_amount

  const preview = hasAllData
    ? calcAllowance({
        balance: data.balance!,
        paycheckDay: data.paycheck_day!,
        paycheckAmount: data.paycheck_amount!,
        bufferAmount: data.buffer_amount ?? 0,
        bills: data.bills ?? [],
      })
    : null

  const color = preview
    ? allowanceColor(preview.allowance, data.paycheck_amount!)
    : 'text-zinc-950 dark:text-white'

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-xs font-medium tracking-wider uppercase">Step 4 of 4</p>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full bg-zinc-950 dark:bg-white" />
          ))}
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">You&apos;re set up.</h1>

      {preview ? (
        <div className="flex flex-col items-center gap-2 py-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">you can spend today</p>
          <p className={`text-6xl font-bold leading-none mt-1 ${color}`}>
            {formatAllowance(preview.allowance)}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
            for {preview.daysRemaining} more {preview.daysRemaining === 1 ? 'day' : 'days'}, until{' '}
            {formatPaycheckDate(preview.nextPaycheckDate)}
          </p>
        </div>
      ) : (
        <div className="py-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 text-sm">
          Complete the earlier steps to see your preview.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300 text-center">
          Something went wrong saving your data — please try again.
        </div>
      )}

      <div className="flex flex-col gap-3">
        <form action={saveOnboarding}>
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3.5 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            See my daily allowance →
          </button>
        </form>
        <Link
          href="/onboarding/bills"
          className="text-center text-zinc-400 dark:text-zinc-500 text-sm hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors py-2"
        >
          ← Back
        </Link>
      </div>
    </div>
  )
}
