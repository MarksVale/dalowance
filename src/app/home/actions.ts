'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveBalanceUpdate(formData: FormData) {
  const balance = parseFloat(formData.get('balance') as string)
  if (isNaN(balance)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('balance_updates').insert({ user_id: user.id, balance })
  revalidatePath('/home')
}

export async function logSpend(formData: FormData) {
  const amount = parseFloat(formData.get('amount') as string)
  const note = (formData.get('note') as string)?.trim() || null
  if (isNaN(amount) || amount <= 0) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: latest } = await supabase
    .from('balance_updates')
    .select('balance')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  const currentBalance = Number(latest?.balance ?? 0)
  await supabase.from('spend_logs').insert({ user_id: user.id, amount, note })
  await supabase.from('balance_updates').insert({ user_id: user.id, balance: currentBalance - amount })
  revalidatePath('/home')
}
