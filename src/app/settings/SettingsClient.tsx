'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { saveProfileSettings, deleteAccount } from './actions'
import { createBill, updateBill, deleteBill } from '../bills/actions'
import DayPicker from '../onboarding/paycheck/DayPicker'

type Bill = { id: string; name: string; amount: number; day_of_month: number; active: boolean }
type BillModal = { mode: 'add' } | { mode: 'edit'; bill: Bill } | null

export default function SettingsClient({
  email,
  paycheckDay,
  paycheckAmount,
  bufferAmount,
  bills,
}: {
  email: string
  paycheckDay: number
  paycheckAmount: number
  bufferAmount: number
  bills: Bill[]
}) {
  const [isPending, startTransition] = useTransition()
  const [profileSaved, setProfileSaved] = useState(false)
  const [billModal, setBillModal] = useState<BillModal>(null)
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!profileSaved) return
    const t = setTimeout(() => setProfileSaved(false), 2500)
    return () => clearTimeout(t)
  }, [profileSaved])

  function handleSaveProfile(formData: FormData) {
    startTransition(async () => {
      await saveProfileSettings(formData)
      setProfileSaved(true)
      router.refresh()
    })
  }

  function handleSaveBill(formData: FormData) {
    startTransition(async () => {
      if (billModal?.mode === 'edit') {
        formData.set('id', billModal.bill.id)
        await updateBill(formData)
      } else {
        await createBill(formData)
      }
      setBillModal(null)
      router.refresh()
    })
  }

  function handleDeleteBill(id: string) {
    startTransition(async () => {
      await deleteBill(id)
      setDeletingBillId(null)
      router.refresh()
    })
  }

  function handleDeleteAccount() {
    startTransition(async () => {
      await deleteAccount()
    })
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-8 pb-16">
      <div className="max-w-sm mx-auto flex flex-col gap-10">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/home" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors p-1 -ml-1">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-zinc-950 dark:text-white font-semibold text-lg">Settings</h1>
        </div>

        {/* Account */}
        <section className="flex flex-col gap-3">
          <h2 className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Account</h2>
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-zinc-500 text-sm">Email</span>
              <span className="text-zinc-950 dark:text-white text-sm truncate ml-4 max-w-[200px]">{email}</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium py-2.5 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </form>
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="w-full rounded-lg border border-red-200 dark:border-red-900/60 text-red-500 dark:text-red-400 text-sm font-medium py-2.5 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                Delete account
              </button>
            </div>
          </div>
        </section>

        {/* Pay cycle */}
        <section className="flex flex-col gap-3">
          <h2 className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Pay cycle</h2>
          <form action={handleSaveProfile} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-zinc-500 text-xs uppercase tracking-wider">Payday</label>
              <DayPicker defaultValue={paycheckDay} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-500 text-xs uppercase tracking-wider">Paycheck amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                <input
                  name="paycheck_amount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  defaultValue={paycheckAmount}
                  className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-8 pr-4 py-3 text-zinc-950 dark:text-white text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-500 text-xs uppercase tracking-wider">Minimum to keep in account</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                <input
                  name="buffer_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={bufferAmount || ''}
                  placeholder="0.00"
                  className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-8 pr-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                />
              </div>
              <p className="text-zinc-400 dark:text-zinc-600 text-xs">Won&apos;t count toward your daily spending number.</p>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {profileSaved ? (
                <><Check size={14} /> Saved</>
              ) : isPending ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>

        {/* Bills */}
        <section className="flex flex-col gap-3">
          <h2 className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Monthly bills</h2>
          <div className="flex flex-col gap-2">
            {bills.length === 0 ? (
              <p className="text-zinc-400 dark:text-zinc-600 text-sm py-1">No bills added yet.</p>
            ) : bills.map(bill => (
              <div key={bill.id} className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-950 dark:text-white text-sm font-medium truncate">{bill.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">day {bill.day_of_month} · €{bill.amount.toFixed(2)}</p>
                </div>
                {deletingBillId === bill.id ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => handleDeleteBill(bill.id)} disabled={isPending} className="text-red-400 text-xs font-medium hover:text-red-300 transition-colors">Delete</button>
                    <button onClick={() => setDeletingBillId(null)} className="text-zinc-400 dark:text-zinc-500 text-xs hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setBillModal({ mode: 'edit', bill })} className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors p-2" aria-label="Edit"><Pencil size={13} /></button>
                    <button onClick={() => setDeletingBillId(bill.id)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition-colors p-2" aria-label="Delete"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => setBillModal({ mode: 'add' })}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 text-sm py-3.5 hover:border-zinc-500 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mt-1"
            >
              <Plus size={14} />
              Add a bill
            </button>
          </div>
        </section>

        {/* Display */}
        <section className="flex flex-col gap-3">
          <h2 className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Display</h2>
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-zinc-950 dark:text-white text-sm">Theme</span>
              <span className="text-zinc-500 text-sm">Use ☀/🌙 button (top right)</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-zinc-950 dark:text-white text-sm">Currency</span>
              <span className="text-zinc-500 text-sm">EUR</span>
            </div>
          </div>
        </section>

      </div>

      {/* Bill add/edit modal */}
      {billModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setBillModal(null) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-950 dark:text-white font-semibold">{billModal.mode === 'add' ? 'Add a bill' : 'Edit bill'}</h2>
              <button onClick={() => setBillModal(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <form action={handleSaveBill} className="flex flex-col gap-3">
              <input
                name="name" type="text" required placeholder="Name (e.g. Netflix)"
                defaultValue={billModal.mode === 'edit' ? billModal.bill.name : ''}
                autoFocus
                className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                  <input
                    name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00"
                    defaultValue={billModal.mode === 'edit' ? billModal.bill.amount : ''}
                    className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 pl-8 pr-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                  />
                </div>
                <select
                  name="day_of_month" required
                  defaultValue={billModal.mode === 'edit' ? billModal.bill.day_of_month : ''}
                  className="w-24 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-3 py-3 text-zinc-950 dark:text-white text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={isPending}
                className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 mt-1">
                {isPending ? 'Saving…' : billModal.mode === 'add' ? 'Add bill' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {showDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 size-9 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mt-0.5">
                <AlertTriangle size={16} className="text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-zinc-950 dark:text-white font-semibold">Delete account?</h2>
                <p className="text-zinc-500 text-sm mt-1">This permanently deletes all your data — balance history, bills, and settings. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isPending}
                className="w-full rounded-lg bg-red-500 text-white font-semibold text-sm py-3 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting…' : 'Yes, delete everything'}
              </button>
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium text-sm py-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
