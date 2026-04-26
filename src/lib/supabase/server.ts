import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const stripBom = (s: string) => s.replace(/^﻿/, '')

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''),
    stripBom(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies can't be set.
            // This is fine if you have a middleware refreshing the session.
          }
        },
      },
    }
  )
}
