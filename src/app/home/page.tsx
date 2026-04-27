import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  calcAllowance,
  allowanceColor,
  calcForecast,
  getGreeting,
  getContextMessage,
  formatPaycheckDate,
} from '@/lib/calc'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('paycheck_day, paycheck_amount, buffer_amount, name')
    .eq('id', user.id)
    .single()

  if (!profile?.paycheck_day || !profile?.paycheck_amount) redirect('/onboarding/balance')

  const { data: recentBalances } = await supabase
    .from('balance_updates')
    .select('balance, recorded_at')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(2)

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

  // Delta vs previous balance update
  const delta = recentBalances.length >= 2
    ? Number(recentBalances[0].balance) - Number(recentBalances[1].balance)
    : null

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

  // Days since balance was last updated
  const daysAgoBalance = Math.floor((Date.now() - new Date(recentBalances[0].recorded_at).getTime()) / 86_400_000)

  // Spent today
  const todayMidnight = new Date(y, m, d).toISOString()
  const { data: todaySpendLogs } = await supabase
    .from('spend_logs')
    .select('amount')
    .eq('user_id', user.id)
    .gte('logged_at', todayMidnight)

  const spentToday = (todaySpendLogs ?? []).reduce((s, l) => s + Number(l.amount), 0)

  // Forecast segments
  const forecastSegments = calcForecast({ balance: latestBalance, ...calcParams })

  // Remaining days for save-up strip (tomorrow → day before payday)
  const tomorrow = new Date(y, m, d + 1)
  const dayBeforePaycheck = new Date(nextPaycheckDate.getFullYear(), nextPaycheckDate.getMonth(), nextPaycheckDate.getDate() - 1)
  const remainingDays: Date[] = []
  let cur = new Date(tomorrow)
  while (cur.getTime() <= dayBeforePaycheck.getTime()) {
    remainingDays.push(new Date(cur))
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1)
  }

  // Greeting and context message
  const currentHour = now.getHours()
  const greeting = getGreeting(profile.name ?? null, currentHour)
  const contextMessage = getContextMessage({
    allowance,
    paycheckAmount: calcParams.paycheckAmount,
    daysRemaining,
    daysAgoBalance,
    paycheckDay: calcParams.paycheckDay,
    bills: activeBills,
  })

  return (
    <HomeClient
      greeting={greeting}
      contextMessage={contextMessage}
      allowance={allowance}
      color={color}
      delta={delta}
      daysRemaining={daysRemaining}
      nextPaycheckDate={nextPaycheckDate}
      cyclePercent={cyclePercent}
      spentToday={spentToday}
      currentBalance={latestBalance}
      paycheckAmount={calcParams.paycheckAmount}
      forecastSegments={forecastSegments}
      remainingDays={remainingDays}
      daysAgoBalance={daysAgoBalance}
      calcParams={calcParams}
      formatPaycheckDate={formatPaycheckDate(nextPaycheckDate)}
    />
  )
}
