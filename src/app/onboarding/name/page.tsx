import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { saveNameStep } from '../actions'

export default async function NamePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  if (profile?.name) redirect('/onboarding/balance')

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">What should we call you?</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">Just your first name is fine.</p>
      </div>

      <form action={saveNameStep} className="flex flex-col gap-4">
        <input
          name="name"
          type="text"
          required
          autoFocus
          placeholder="Mark"
          maxLength={40}
          className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          {"Let's go →"}
        </button>
      </form>
    </div>
  )
}
