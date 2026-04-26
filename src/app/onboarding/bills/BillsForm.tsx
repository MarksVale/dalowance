'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { saveBillsStep } from '../actions'

type Bill = { name: string; amount: string; day_of_month: string }

const empty = (): Bill => ({ name: '', amount: '', day_of_month: '' })

const steps = [0, 1, 2, 3]

export default function BillsForm({
  initialBills,
  initialBuffer,
}: {
  initialBills: Array<{ name: string; amount: number; day_of_month: number }>
  initialBuffer: number
}) {
  const [bills, setBills] = useState<Bill[]>(
    initialBills.map(b => ({
      name: b.name,
      amount: String(b.amount),
      day_of_month: String(b.day_of_month),
    }))
  )
  const [buffer, setBuffer] = useState(initialBuffer > 0 ? String(initialBuffer) : '')

  const addBill = () => setBills(p => [...p, empty()])
  const removeBill = (i: number) => setBills(p => p.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof Bill, value: string) =>
    setBills(p => p.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)))

  const canProceed =
    bills.length === 0 ||
    bills.every(
      b =>
        b.name.trim() &&
        parseFloat(b.amount) > 0 &&
        parseInt(b.day_of_month) >= 1 &&
        parseInt(b.day_of_month) <= 31
    )

  const billsJson = JSON.stringify(
    bills
      .filter(b => b.name.trim())
      .map(b => ({
        name: b.name.trim(),
        amount: parseFloat(b.amount),
        day_of_month: parseInt(b.day_of_month),
      }))
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-xs font-medium tracking-wider uppercase">Step 3 of 4</p>
        <div className="flex gap-1">
          {steps.map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-zinc-950 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">What bills auto-deduct each month?</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">These are subtracted before splitting your remaining balance.</p>
      </div>

      <form action={saveBillsStep} className="flex flex-col gap-6">
        <input type="hidden" name="bills" value={billsJson} />
        <input type="hidden" name="buffer_amount" value={buffer || '0'} />

        <div className="flex flex-col gap-2">
          {bills.map((bill, i) => (
            <div key={i} className="rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Name (e.g. Netflix)"
                  value={bill.name}
                  onChange={e => update(i, 'name', e.target.value)}
                  className="flex-1 bg-transparent text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeBill(i)}
                  className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors p-1 shrink-0"
                  aria-label="Remove bill"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">€</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    value={bill.amount}
                    onChange={e => update(i, 'amount', e.target.value)}
                    className="w-full bg-transparent pl-4 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none"
                  />
                </div>
                <span className="text-zinc-400 dark:text-zinc-600 text-xs shrink-0">on day</span>
                <input
                  type="number"
                  placeholder="1"
                  min="1"
                  max="31"
                  value={bill.day_of_month}
                  onChange={e => update(i, 'day_of_month', e.target.value)}
                  className="w-12 bg-transparent text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none text-right"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addBill}
            className="flex items-center gap-2 text-zinc-500 text-sm hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors py-1 w-fit"
          >
            <Plus size={14} />
            Add a bill
          </button>
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <label className="text-zinc-500 text-xs uppercase tracking-wider">
            Minimum to keep in account
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={buffer}
              onChange={e => setBuffer(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-8 pr-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
            />
          </div>
          <p className="text-zinc-400 dark:text-zinc-600 text-xs">Safety buffer — won&apos;t be included in your daily number.</p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/onboarding/paycheck"
            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium text-sm py-3 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            ← Back
          </Link>
          <button
            type="submit"
            disabled={!canProceed}
            className="flex-1 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {bills.length === 0 ? 'Skip →' : 'Next →'}
          </button>
        </div>
      </form>
    </div>
  )
}
