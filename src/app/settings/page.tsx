import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('paycheck_day, paycheck_amount, buffer_amount, name')
    .eq('id', user.id)
    .single()

  if (!profile?.paycheck_day || !profile?.paycheck_amount) redirect('/onboarding/balance')

  const { data: bills } = await supabase
    .from('bills')
    .select('id, name, amount, day_of_month, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('day_of_month', { ascending: true })

  return (
    <SettingsClient
      email={user.email ?? ''}
      name={profile.name ?? ''}
      paycheckDay={profile.paycheck_day}
      paycheckAmount={Number(profile.paycheck_amount)}
      bufferAmount={Number(profile.buffer_amount ?? 0)}
      bills={(bills ?? []).map(b => ({
        id: b.id,
        name: b.name,
        amount: Number(b.amount),
        day_of_month: Number(b.day_of_month),
        active: b.active ?? true,
      }))}
    />
  )
}
