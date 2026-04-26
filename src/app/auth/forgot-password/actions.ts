'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function sendResetEmail(formData: FormData) {
  const email = (formData.get('email')?.toString() ?? '').replace(/^﻿/, '').trim()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? headersList.get('x-forwarded-host') ?? ''
  const proto = headersList.get('x-forwarded-proto') ?? 'https'
  const base = origin.startsWith('http') ? origin : `${proto}://${origin}`

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/auth/forgot-password?status=sent')
}
