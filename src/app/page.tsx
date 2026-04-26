import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Props = {
  searchParams: Promise<{ status?: string }>
}

export default async function LandingPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/home')

  const { status } = await searchParams

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Wordmark */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Dalowance
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-base">
            Know what you can spend today.
          </p>
        </div>

        {/* Status banners */}
        {status === 'check-email' && (
          <div className="w-full rounded-lg bg-emerald-950 border border-emerald-800 px-4 py-3 text-sm text-emerald-300 text-center">
            Check your email for the login link.
          </div>
        )}
        {status === 'error' && (
          <div className="w-full rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300 text-center">
            Something went wrong, try again.
          </div>
        )}

        {/* Magic link form */}
        <form action="/auth/login" method="POST" className="w-full flex flex-col gap-3">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Send magic link
          </button>
        </form>

      </div>
    </main>
  )
}
