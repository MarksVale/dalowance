import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If next param is set (e.g. from reset-password flow), use it directly
      if (searchParams.get('next')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise check if name is set for onboarding routing
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single()

        if (!profile?.name) {
          return NextResponse.redirect(`${origin}/onboarding/name`)
        }
      }

      return NextResponse.redirect(`${origin}/home`)
    }
  }

  return NextResponse.redirect(`${origin}/?status=error`)
}
