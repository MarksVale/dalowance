'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveProfileSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const name = (formData.get('name')?.toString() ?? '').trim().slice(0, 40)
  const paycheckDay = parseInt(formData.get('paycheck_day') as string)
  const paycheckAmount = parseFloat(formData.get('paycheck_amount') as string)
  const bufferAmount = parseFloat(formData.get('buffer_amount') as string) || 0

  await supabase
    .from('profiles')
    .update({ name: name || null, paycheck_day: paycheckDay, paycheck_amount: paycheckAmount, buffer_amount: bufferAmount })
    .eq('id', user.id)

  revalidatePath('/settings')
  revalidatePath('/home')
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  await supabase.from('bills').delete().eq('user_id', user.id)
  await supabase.from('balance_updates').delete().eq('user_id', user.id)
  await supabase.from('spend_logs').delete().eq('user_id', user.id)
  await supabase.from('profiles').delete().eq('id', user.id)
  await supabase.auth.signOut()

  redirect('/')
}
