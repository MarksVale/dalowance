import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider') as 'google' | 'github' | 'apple'
  const origin = request.nextUrl.origin
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error || !data.url) {
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(error?.message ?? 'OAuth error')}`,
      { status: 303 }
    )
  }

  return NextResponse.redirect(data.url, { status: 303 })
}
