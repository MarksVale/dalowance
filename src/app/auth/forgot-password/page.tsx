type Props = {
  searchParams: Promise<{ status?: string; error?: string }>
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { status, error } = await searchParams

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">Reset password</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400 text-sm">We&apos;ll send a reset link to your email.</p>
        </div>

        {status === 'sent' && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            Check your email for a reset link.
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {decodeURIComponent(error)}
          </div>
        )}

        {status !== 'sent' && (
          <form action="/auth/forgot-password" method="POST" className="flex flex-col gap-3">
            <input
              type="email" name="email" required autoFocus placeholder="you@example.com"
              className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Send reset link
            </button>
          </form>
        )}

        <a href="/" className="text-zinc-400 dark:text-zinc-500 text-sm hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-center">
          ← Back to sign in
        </a>
      </div>
    </main>
  )
}
