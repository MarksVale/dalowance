import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = (formData.get('email')?.toString() ?? '').replace(/^﻿/, '').trim()
  const origin = request.nextUrl.origin
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    const msg = encodeURIComponent(error.message)
    return NextResponse.redirect(`${origin}/auth/forgot-password?error=${msg}`, { status: 303 })
  }

  return NextResponse.redirect(`${origin}/auth/forgot-password?status=sent`, { status: 303 })
}
