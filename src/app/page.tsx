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

        <div className="flex flex-col gap-3">
          <a href="/auth/oauth?provider=google" className="flex items-center justify-center gap-3 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          <a href="/auth/oauth?provider=apple" className="flex items-center justify-center gap-3 w-full rounded-xl bg-zinc-950 dark:bg-white px-4 py-3 text-sm font-medium text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
            <svg width="15" height="18" viewBox="0 0 814 1000" fill="currentColor">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-143-39.3c-58.3 0-81.3 39.9-148.3 39.9s-113.3-58.7-162.8-125.4C83.5 768.2 34.5 677.3 34.5 590.9c0-168.8 109.7-258.2 213-258.2 79.5 0 143 51.9 193.3 51.9 49 0 120.5-55.3 205.8-55.3zM636.2 45.5c43.7-52.3 75.7-124.2 75.7-196.2 0-10.3-.6-20.7-2.6-29.6-71.9 2.6-156.5 48.3-207.4 107.4-39.9 45.5-78.5 117.4-78.5 190.6 0 11.6 2 23.2 2.9 27.1 4.5.6 11.6 1.6 18.7 1.6 64.4 0 143.7-43.1 191.2-100.9z"/>
            </svg>
            Continue with Apple
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">or continue with email</span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
        </div>

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
