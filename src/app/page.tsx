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

        {/* Wordmark */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">Dalowance</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-base">Know what you can spend today.</p>
        </div>

        {/* Banners */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-400 text-center">
            {decodeURIComponent(error)}
          </div>
        )}
        {status === 'check-email' && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 text-center">
            We sent a confirmation link to{' '}
            <span className="font-semibold">{email ? decodeURIComponent(email) : 'your email'}</span>.
            Click it, then sign in.
          </div>
        )}

        {/* Social buttons */}
        <div className="flex flex-col gap-3">
          <a
            href="/auth/oauth?provider=google"
            className="flex items-center justify-center gap-3 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {/* Google icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c