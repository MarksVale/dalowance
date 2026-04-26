import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BillsClient from './BillsClient'

export default async function BillsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: bills } = await supabase
    .from('bills')
    .select('id, name, amount, day_of_month, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('day_of_month', { ascending: true })

  const today = new Date()

  return (
    <BillsClient
      bills={(bills ?? []).map(b => ({
        id: b.id,
        name: b.name,
        amount: Number(b.amount),
        day_of_month: Number(b.day_of_month),
        active: b.active ?? true,
      }))}
      year={today.getFullYear()}
      month={today.getMonth()}
      todayDay={today.getDate()}
    />
  )
}
