'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createBill(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const amount = parseFloat(formData.get('amount') as string)
  const day_of_month = parseInt(formData.get('day_of_month') as string)

  if (!name || isNaN(amount) || isNaN(day_of_month)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('bills').insert({ user_id: user.id, name, amount, day_of_month })
  revalidatePath('/bills')
  revalidatePath('/home')
}

export async function updateBill(formData: FormData) {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const amount = parseFloat(formData.get('amount') as string)
  const day_of_month = parseInt(formData.get('day_of_month') as string)

  if (!id || !name || isNaN(amount) || isNaN(day_of_month)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('bills')
    .update({ name, amount, day_of_month })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/bills')
  revalidatePath('/home')
}

export async function deleteBill(id: string) {
  if (!id) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('bills').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath('/bills')
  revalidatePath('/home')
}
