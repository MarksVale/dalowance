import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Props = {
  searchParams: Promise<{ mode?: string; error?: string; status?: string; email?: string }>
}

export default async function LandingPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/home')

  const { mode, error, status, email } = await searchParams
  const isSignup = mode === 'signup'

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">Dalowance</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-base">Know what you can spend today.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-400 text-center">
            {decodeURIComponent(error)}
          </div>
        )}
        {status === 'check-email' && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 text-center">
            Confirmation link sent to <span className="font-semibold">{email ? decodeURIComponent(email) : 'your email'}</span>. Click it, then sign in.
          </div>
        )}

        <form action="/auth/login" method="POST" className="flex flex-col gap-3">
          <input type="hidden" name="mode" value={isSignup ? 'signup' : 'signin'} />
          <input type="email" name="email" required autoComplete="email" placeholder="you@example.com"
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" />
          <input type="password" name="password" required minLength={6} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="Password"
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" />
          <button type="submit" className="w-full rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
            {isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {isSignup ? (
              <>Already have an account?{' '}<a href="/" className="text-zinc-950 dark:text-white font-medium hover:underline">Sign in</a></>
            ) : (
              <>New here?{' '}<a href="/?mode=signup" className="text-zinc-950 dark:text-white font-medium hover:underline">Create account</a></>
            )}
          </p>
          {!isSignup && (
            <a href="/auth/forgot-password" className="text-zinc-400 dark:text-zinc-500 text-sm hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              Forgot password?
            </a>
          )}
        </div>

      </div>
    </main>
  )
}
