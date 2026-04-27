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
  const note = (formData.get('note') as string | null)?.trim() || null
  if (isNaN(amount) || amount <= 0) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('spend_logs').insert({ user_id: user.id, amount, note })
  revalidatePath('/home')
}

export async function createPreset(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const amount = parseFloat(formData.get('amount') as string)
  if (!name || isNaN(amount) || amount <= 0) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('spend_presets').insert({ user_id: user.id, name, amount })
  revalidatePath('/home')
}

export async function deletePreset(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('spend_presets').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/home')
}
