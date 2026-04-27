import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calcAllowance } from '@/lib/calc'
import SimulateClient from './SimulateClient'

export default async function SimulatePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('paycheck_day, paycheck_amount, buffer_amount')
    .eq('id', user.id)
    .single()

  if (!profile?.paycheck_day || !profile?.paycheck_amount) redirect('/onboarding/balance')

  const { data: latestBalance } = await supabase
    .from('balance_updates')
    .select('balance')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  if (!latestBalance) redirect('/onboarding/balance')

  const { data: bills } = await supabase
    .from('bills')
    .select('amount, day_of_month')
    .eq('user_id', user.id)
    .eq('active', true)

  const activeBills = (bills ?? []).map(b => ({
    amount: Number(b.amount),
    day_of_month: Number(b.day_of_month),
  }))

  const currentBalance = Number(latestBalance.balance)
  const paycheckAmount = Number(profile.paycheck_amount)
  const bufferAmount = Number(profile.buffer_amount ?? 0)

  const { allowance, daysRemaining } = calcAllowance({
    balance: currentBalance,
    paycheckDay: profile.paycheck_day!,
    paycheckAmount,
    bufferAmount,
    bills: activeBills,
  })

  return (
    <SimulateClient
      currentBalance={currentBalance}
      currentAllowance={allowance}
      daysRemaining={daysRemaining}
      paycheckDay={profile.paycheck_day!}
      paycheckAmount={paycheckAmount}
      bufferAmount={bufferAmount}
      bills={activeBills}
    />
  )
}
