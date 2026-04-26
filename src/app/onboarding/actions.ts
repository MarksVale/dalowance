'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type OnboardingData = {
  balance?: number
  paycheck_day?: number
  paycheck_amount?: number
  bills?: Array<{ name: string; amount: number; day_of_month: number }>
  buffer_amount?: number
}

const COOKIE = 'onboarding'
const OPTS = { httpOnly: true, path: '/', maxAge: 3600 } as const

async function readCookie(): Promise<OnboardingData> {
  const store = await cookies()
  try { return JSON.parse(store.get(COOKIE)?.value ?? '{}') } catch { return {} }
}

async function patchCookie(patch: Partial<OnboardingData>) {
  const store = await cookies()
  const prev = await readCookie()
  store.set(COOKIE, JSON.stringify({ ...prev, ...patch }), OPTS)
}

export async function saveBalanceStep(formData: FormData) {
  const balance = parseFloat(formData.get('balance') as string)
  if (isNaN(balance)) return
  await patchCookie({ balance })
  redirect('/onboarding/paycheck')
}

export async function savePaycheckStep(formData: FormData) {
  const paycheck_day = parseInt(formData.get('paycheck_day') as string)
  const paycheck_amount = parseFloat(formData.get('paycheck_amount') as string)
  if (isNaN(paycheck_day) || isNaN(paycheck_amount)) return
  await patchCookie({ paycheck_day, paycheck_amount })
  redirect('/onboarding/bills')
}

export async function saveBillsStep(formData: FormData) {
  let bills: Array<{ name: string; amount: number; day_of_month: number }> = []
  try { bills = JSON.parse((formData.get('bills') as string) ?? '[]') } catch {}
  const buffer_amount = parseFloat(formData.get('buffer_amount') as string) || 0
  await patchCookie({ bills, buffer_amount })
  redirect('/onboarding/done')
}

export async function saveOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const data = await readCookie()

  if (data.balance == null || !data.paycheck_day || !data.paycheck_amount) {
    redirect('/onboarding/balance')
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      paycheck_day: data.paycheck_day,
      paycheck_amount: data.paycheck_amount,
      buffer_amount: data.buffer_amount ?? 0,
    })
    .eq('id', user.id)

  if (profileError) redirect('/onboarding/done?error=save')

  const { error: balanceError } = await supabase
    .from('balance_updates')
    .insert({ user_id: user.id, balance: data.balance })

  if (balanceError) redirect('/onboarding/done?error=save')

  if (data.bills && data.bills.length > 0) {
    const { error: billsError } = await supabase
      .from('bills')
      .insert(data.bills.map(b => ({ ...b, user_id: user.id })))
    if (billsError) redirect('/onboarding/done?error=save')
  }

  const store = await cookies()
  store.delete(COOKIE)

  redirect('/home')
}
