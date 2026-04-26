import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email')?.toString() ?? ''

  const origin = request.nextUrl.origin
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.redirect(`${origin}/?status=error`, { status: 303 })
  }

  return NextResponse.redirect(`${origin}/?status=check-email`, { status: 303 })
}
