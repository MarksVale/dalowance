import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const clean = (s: string) => s.replace(/^﻿/, '').trim()
  const email = clean(formData.get('email')?.toString() ?? '')
  const password = clean(formData.get('password')?.toString() ?? '')
  const mode = clean(formData.get('mode')?.toString() ?? 'signin')
  const origin = request.nextUrl.origin
  const supabase = await createClient()

  if (mode === 'signup') {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    })
    if (error) {
      const msg = encodeURIComponent(error.message)
      return NextResponse.redirect(`${origin}/?mode=signup&error=${msg}`, { status: 303 })
    }
    // Auto sign in after signup (works if email confirmation is disabled)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      const encoded = encodeURIComponent(email)
      return NextResponse.redirect(`${origin}/?mode=signup&status=check-email&email=${encoded}`, { status: 303 })
    }
    return NextResponse.redirect(`${origin}/onboarding/balance`, { status: 303 })
  }

  // Sign in
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const msg = encodeURIComponent(error.message)
    return NextResponse.redirect(`${origin}/?error=${msg}`, { status: 303 })
  }
  return NextResponse.redirect(`${origin}/home`, { status: 303 })
}
