import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { calcAllowance, allowanceColor, formatAllowance, formatPaycheckDate, calcForecast } from '@/lib/calc'
import TheNumber from './TheNumber'
import ProgressBar from './ProgressBar'
import HomeActions from './HomeActions'
import ForecastCalendar from './ForecastCalendar'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('paycheck_day, paycheck_amount, buffer_amount')
    .eq('id', user.id)
    .single()

  if (!profile?.paycheck_day || !profile?.paycheck_amount) redirect('/onboarding/balance')

  const { data: recentBalances } = await supabase
    .from('balance_updates')
    .select('balance, recorded_at')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(50)

  if (!recentBalances?.length) redirect('/onboarding/balance')

  const { data: billsRaw } = await supabase
    .from('bills')
    .select('name, amount, day_of_month')
    .eq('user_id', user.id)
    .eq('active', true)

  const activeBills = (billsRaw ?? []).map(b => ({
    name: b.name as string,
    amount: Number(b.amount),
    day_of_month: Number(b.day_of_month),
  }))

  const calcParams = {
    paycheckDay: profile.paycheck_day!,
    paycheckAmount: Number(profile.paycheck_amount),
    bufferAmount: Number(profile.buffer_amount ?? 0),
    bills: activeBills,
  }

  const latestBalance = Number(recentBalances[0].balance)
  const { allowance, daysRemaining, nextPaycheckDate } = calcAllowance({ balance: latestBalance, ...calcParams })
  const color = allowanceColor(allowance, calcParams.paycheckAmount)

  // Delta vs previous update
  let delta: number | null = null
  if (recentBalances[1]) {
    const { allowance: prevAllowance } = calcAllowance({ balance: Number(recentBalances[1].balance), ...calcParams })
    delta = Math.round((allowance - prevAllowance) * 100) / 100
  }

  // Pay cycle progress
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const prevPaycheckDate =
    d >= profile.paycheck_day!
      ? new Date(y, m, profile.paycheck_day!)
      : new Date(y, m - 1, profile.paycheck_day!)
  const cycleDays = Math.max(1, Math.round((nextPaycheckDate.getTime() - prevPaycheckDate.getTime()) / 86_400_000))
  const elapsedDays = Math.round((new Date(y, m, d).getTime() - prevPaycheckDate.getTime()) / 86_400_000)
  const cyclePercent = Math.min(100, Math.max(0, (elapsedDays / cycleDays) * 100))

  // Payday + stale detection
  const isPayday = d === profile.paycheck_day
  const daysSinceUpdate = Math.floor((Date.now() - new Date(recentBalances[0].recorded_at).getTime()) / 86_400_000)

  // Spent this cycle
  const { data: spendLogs } = await supabase
    .from('spend_logs')
    .select('amount')
    .eq('user_id', user.id)
    .gte('logged_at', prevPaycheckDate.toISOString())
  const spentThisCycle = (spendLogs ?? []).reduce((s, l) => s + Number(l.amount), 0)

  // Negative allowance recovery
  const recoveryDaily = allowance < 0
    ? Math.max(0, Math.round(((allowance * daysRemaining + Math.abs(allowance)) / daysRemaining) * 100) / 100)
    : null

  // Forecast calendar
  const forecastSegments = calcForecast({ balance: latestBalance, ...calcParams })

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">

      {/* Settings link */}
      <Link
        href="/settings"
        className="fixed top-4 left-4 z-40 size-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Settings"
      >
        <Settings size={16} />
      </Link>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">

        {/* The Number block */}
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-widest">you can spend today</p>
          <TheNumber amount={allowance} color={color} />
          {delta !== null && delta !== 0 && (
            <p className={`text-sm font-medium ${delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {delta > 0 ? '↑' : '↓'} {formatAllowance(Math.abs(delta))} vs last update
            </p>
          )}
          {spentThisCycle > 0 && (
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">
              Spent this cycle: <span className="text-zinc-600 dark:text-zinc-300">€{spentThisCycle.toFixed(2)}</span>
            </p>
          )}
          {allowance < 0 && (
            <div className="flex flex-col items-center gap-0.5 mt-1">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                You&apos;re €{Math.abs(allowance).toFixed(2)} over budget.
              </p>
              <p className="text-red-500 dark:text-red-400 text-xs">
                {recoveryDaily === 0
                  ? 'Spend nothing for the rest of this cycle to recover.'
                  : `Keep daily spending under €${recoveryDaily?.toFixed(2)} to recover.`}
              </p>
            </div>
          )}
        </div>

        {/* Days + progress bar */}
        <div className="w-full max-w-sm flex flex-col gap-2.5">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">
            {daysRemaining} more {daysRemaining === 1 ? 'day' : 'days'}, until{' '}
            {formatPaycheckDate(nextPaycheckDate)}
          </p>
          <ProgressBar percent={cyclePercent} />
        </div>

        {/* Interactive actions (banners + buttons + modals) */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <HomeActions
            currentBalance={latestBalance}
            allowance={allowance}
            isPayday={isPayday}
            daysSinceUpdate={daysSinceUpdate}
          />
        </div>

        {/* Forecast calendar */}
        <ForecastCalendar segments={forecastSegments} paycheckAmount={calcParams.paycheckAmount} />

      </div>

      <footer className="px-6 py-5 flex items-center justify-center gap-8 border-t border-zinc-200 dark:border-zinc-900">
        <a href="/settings" className="text-zinc-400 dark:text-zinc-600 text-sm hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
          Settings
        </a>
        <form action="/auth/signout" method="POST">
          <button type="submit" className="text-zinc-400 dark:text-zinc-600 text-sm hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            Sign out
          </button>
        </form>
      </footer>
    </main>
  )
}
