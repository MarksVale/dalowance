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
