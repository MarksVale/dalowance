'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Plus, Pencil, Trash2, X } from 'lucide-react'
import { createBill, updateBill, deleteBill } from './actions'

type Bill = { id: string; name: string; amount: number; day_of_month: number; active: boolean }
type ModalState = { mode: 'add' } | { mode: 'edit'; bill: Bill } | null

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function BillsClient({
  bills,
  year,
  month,
  todayDay,
}: {
  bills: Bill[]
  year: number
  month: number
  todayDay: number
}) {
  const [modal, setModal] = useState<ModalState>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Calendar grid
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7 // 0 = Mon
  const totalDays = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const billsByDay = bills.reduce<Record<number, Bill[]>>((acc, b) => {
    acc[b.day_of_month] = acc[b.day_of_month] ?? []
    acc[b.day_of_month].push(b)
    return acc
  }, {})

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0)

  function handleSave(formData: FormData) {
    startTransition(async () => {
      if (modal?.mode === 'edit') {
        formData.set('id', modal.bill.id)
        await updateBill(formData)
      } else {
        await createBill(formData)
      }
      setModal(null)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteBill(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-8">
      <div className="max-w-sm mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/home" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors p-1 -ml-1">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-zinc-950 dark:text-white font-semibold text-lg flex-1">Monthly bills</h1>
          {bills.length > 0 && (
            <span className="text-zinc-500 text-sm">€{totalMonthly.toFixed(2)}/mo</span>
          )}
        </div>

        {/* Calendar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-zinc-400 dark:text-zinc-600" />
            <span className="text-zinc-500 text-sm">{MONTH_NAMES[month]} {year}</span>
          </div>

          {/* Day-of-week labels */}
          <div className="grid grid-cols-7">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => (
              <div key={i} className="text-center text-zinc-400 dark:text-zinc-700 text-xs py-1">{label}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <div key={idx} />

              const dayBills = billsByDay[day] ?? []
              const hasBills = dayBills.length > 0
              const isToday = day === todayDay
              const billTotal = dayBills.reduce((s, b) => s + b.amount, 0)

              return (
                <div
                  key={idx}
                  className={[
                    'aspect-square flex flex-col items-center justify-center rounded-md gap-0.5',
                    hasBills ? 'bg-zinc-200 dark:bg-zinc-800' : '',
                    isToday ? 'ring-1 ring-zinc-950 dark:ring-white' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className={`text-xs leading-none ${hasBills ? 'text-zinc-950 dark:text-white font-medium' : 'text-zinc-400 dark:text-zinc-600'}`}>
                    {day}
                  </span>
                  {hasBills && (
                    <span className="text-zinc-500 dark:text-zinc-400 text-[9px] leading-none">
                      €{Math.round(billTotal)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bill list */}
        <div className="flex flex-col gap-2">
          {bills.length === 0 ? (
            <p className="text-zinc-400 dark:text-zinc-600 text-sm text-center py-4">No bills yet.</p>
          ) : (
            bills.map(bill => (
              <div
                key={bill.id}
                className="flex items-center gap-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-950 dark:text-white text-sm font-medium truncate">{bill.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    day {bill.day_of_month} · €{bill.amount.toFixed(2)}
                  </p>
                </div>

                {deletingId === bill.id ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleDelete(bill.id)}
                      disabled={isPending}
                      className="text-red-400 text-xs font-medium hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-zinc-400 dark:text-zinc-500 text-xs hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setModal({ mode: 'edit', bill })}
                      className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors p-2"
                      aria-label="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeletingId(bill.id)}
                      className="text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition-colors p-2"
                      aria-label="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add bill */}
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 text-sm py-3.5 hover:border-zinc-500 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mt-1"
          >
            <Plus size={14} />
            Add a bill
          </button>
        </div>

      </div>

      {/* Add / Edit modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-950 dark:text-white font-semibold">
                {modal.mode === 'add' ? 'Add a bill' : 'Edit bill'}
              </h2>
              <button onClick={() => setModal(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form action={handleSave} className="flex flex-col gap-3">
              <input
                name="name"
                type="text"
                required
                placeholder="Name (e.g. Netflix)"
                defaultValue={modal.mode === 'edit' ? modal.bill.name : ''}
                autoFocus
                className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    defaultValue={modal.mode === 'edit' ? modal.bill.amount : ''}
                    className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 pl-8 pr-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                  />
                </div>
                <select
                  name="day_of_month"
                  required
                  defaultValue={modal.mode === 'edit' ? modal.bill.day_of_month : ''}
                  className="w-24 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-3 py-3 text-zinc-950 dark:text-white text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 mt-1"
              >
                {isPending ? 'Saving…' : modal.mode === 'add' ? 'Add bill' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
