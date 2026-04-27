'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Minus, RefreshCw, LayoutList, Zap, X, Settings, Banknote, Receipt, Plus, Pencil, Trash2 } from 'lucide-react'
import { logSpend, saveBalanceUpdate } from './actions'
import { createBill, updateBill, deleteBill } from '@/app/bills/actions'
import { calcSaveUpAllowance, allowanceColor } from '@/lib/calc'
import type { ForecastSegment } from '@/lib/calc'
import TheNumber from './TheNumber'
import ProgressBar from './ProgressBar'

type Bill = { name: string; amount: number; day_of_month: number }
type FullBill = { id: string; name: string; amount: number; day_of_month: number }

type Props = {
  greeting: string
  contextMessage: { text: string; color: 'emerald' | 'amber' | 'red' | 'zinc' }
  allowance: number
  color: string
  daysRemaining: number
  nextPaycheckDate: Date
  cyclePercent: number
  spentToday: number
  currentBalance: number
  paycheckAmount: number
  forecastSegments: ForecastSegment[]
  remainingDays: Date[]
  daysAgoBalance: number
  calcParams: { paycheckDay: number; paycheckAmount: number; bufferAmount: number; bills: Bill[] }
  formatPaycheckDate: string
  fullBills: FullBill[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmtDate(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function dailyColor(allowance: number, paycheckAmount: number): string {
  return allowanceColor(allowance, paycheckAmount)
}

const contextColorMap = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  zinc: 'text-zinc-500 dark:text-zinc-400',
}

type BillModalState = { mode: 'add' } | { mode: 'edit'; bill: FullBill } | null

export default function HomeClient({
  greeting,
  contextMessage,
  allowance,
  color,
  daysRemaining,
  cyclePercent,
  spentToday,
  currentBalance,
  paycheckAmount,
  forecastSegments,
  remainingDays,
  daysAgoBalance,
  calcParams,
  formatPaycheckDate,
  fullBills,
}: Props) {
  const [spendModalOpen, setSpendModalOpen] = useState(false)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [billsModalOpen, setBillsModalOpen] = useState(false)
  const [billFormModal, setBillFormModal] = useState<BillModalState>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedSaveUpDay, setSelectedSaveUpDay] = useState<Date | null>(null)
  const [spendAmount, setSpendAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const saveUpResult = selectedSaveUpDay
    ? calcSaveUpAllowance({ ...calcParams, balance: currentBalance, targetDate: selectedSaveUpDay })
    : null

  const typedAmount = parseFloat(spendAmount) || 0
  const totalMonthly = fullBills.reduce((s, b) => s + b.amount, 0)

  function handleSpend(formData: FormData) {
    startTransition(async () => {
      await logSpend(formData)
      setSpendModalOpen(false)
      setSpendAmount('')
      router.refresh()
    })
  }

  function handleSync(formData: FormData) {
    startTransition(async () => {
      await saveBalanceUpdate(formData)
      setSyncModalOpen(false)
      router.refresh()
    })
  }

  function handleBillSave(formData: FormData) {
    startTransition(async () => {
      if (billFormModal?.mode === 'edit') {
        formData.set('id', billFormModal.bill.id)
        await updateBill(formData)
      } else {
        await createBill(formData)
      }
      setBillFormModal(null)
      router.refresh()
    })
  }

  function handleBillDelete(id: string) {
    startTransition(async () => {
      await deleteBill(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">

        <Link
          href="/settings"
          className="fixed top-4 left-4 z-40 size-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Link>

        <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-10 gap-7">

          {/* A: Stale balance banner */}
          {daysAgoBalance > 1 && (
            <button
              onClick={() => setSyncModalOpen(true)}
              className="w-full max-w-sm rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 px-4 py-2.5 text-left text-sm text-amber-600 dark:text-amber-400"
            >
              Balance last updated {daysAgoBalance} days old — tap Sync to stay accurate
            </button>
          )}

          {/* B: Greeting + context */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-zinc-950 dark:text-white font-semibold text-lg">{greeting}</p>
            <p className={`text-sm ${contextColorMap[contextMessage.color]}`}>{contextMessage.text}</p>
          </div>

          {/* C: The number */}
          <div className="flex flex-col items-center gap-2 text-center">
            <TheNumber amount={allowance} color={color} />
            {spentToday > 0 && (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                You&apos;ve spent €{spentToday.toFixed(2)} today
              </p>
            )}
          </div>

          {/* D: Progress bar */}
          <div className="w-full max-w-sm flex flex-col items-center gap-2">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} until {formatPaycheckDate}
            </p>
            <ProgressBar percent={cyclePercent} />
          </div>

          {/* E: Actions */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setSpendModalOpen(true)}
              className="rounded-2xl bg-zinc-950 dark:bg-white flex flex-col items-center justify-center gap-2 py-4 active:scale-[0.97] transition-transform"
            >
              <Minus size={20} className="text-white dark:text-zinc-950" />
              <span className="text-white dark:text-zinc-950 text-sm font-medium">I spent</span>
            </button>
            <button
              onClick={() => setSyncModalOpen(true)}
              className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center gap-2 py-4 active:scale-[0.97] transition-transform hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <RefreshCw size={20} className="text-zinc-500 dark:text-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-300 text-sm font-medium">Sync</span>
            </button>
            <button
              onClick={() => setBillsModalOpen(true)}
              className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center gap-2 py-4 active:scale-[0.97] transition-transform hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <LayoutList size={20} className="text-zinc-500 dark:text-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-300 text-sm font-medium">Bills</span>
            </button>
            <Link
              href="/simulate"
              className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center gap-2 py-4 active:scale-[0.97] transition-transform hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <Zap size={20} className="text-zinc-500 dark:text-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-300 text-sm font-medium">What if?</span>
            </Link>
          </div>

          {/* F: Save Up strip */}
          {remainingDays.length > 0 && (
            <div className="w-full max-w-sm flex flex-col gap-3">
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Save Up</p>

              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {remainingDays.map((day, i) => {
                  const isSelected = selectedSaveUpDay?.getTime() === day.getTime()
                  const isFirst = i === 0
                  const label = isFirst
                    ? `${MONTHS[day.getMonth()]} ${day.getDate()}`
                    : day.getDate() === 1
                    ? `${day.getDate()} ${MONTHS[day.getMonth()]}`
                    : `${day.getDate()}`

                  return (
                    <button
                      key={day.getTime()}
                      onClick={() => setSelectedSaveUpDay(isSelected ? null : day)}
                      className={`shrink-0 rounded-full px-3 py-1.5 transition-colors ${
                        isFirst
                          ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-base font-medium'
                          : isSelected
                          ? 'bg-emerald-500 text-white text-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className={`flex flex-col gap-0.5 transition-opacity duration-200 ${saveUpResult ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {saveUpResult && selectedSaveUpDay && (
                  <>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      On {WEEKDAYS[selectedSaveUpDay.getDay()]} {fmtDate(selectedSaveUpDay)} you could spend
                    </p>
                    <p className={`text-2xl font-bold tabular-nums ${dailyColor(saveUpResult.dailyAllowance, paycheckAmount)}`}>
                      €{saveUpResult.dailyAllowance.toFixed(2)}/day
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      Skip {saveUpResult.daysSkipped} {saveUpResult.daysSkipped === 1 ? 'day' : 'days'} to get there
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* G: Forecast — expenses on top, flat daily at bottom */}
          {(() => {
            // Split segments into current cycle (before first paycheck) and next cycle
            const firstPaycheckIdx = forecastSegments.findIndex(s => s.type === 'paycheck')
            const currentEvents = forecastSegments.slice(1, firstPaycheckIdx) // bills before payday
            const paycheck = firstPaycheckIdx >= 0 ? forecastSegments[firstPaycheckIdx] : null
            const afterPaycheck = forecastSegments.slice(firstPaycheckIdx + 1)
            const nextPeriod = afterPaycheck.find(s => s.type === 'period') as (typeof forecastSegments[0] & { type: 'period' }) | undefined
            const nextBills = afterPaycheck.filter(s => s.type === 'bill')

            return (
              <>
                {/* Current cycle block */}
                <div className="w-full max-w-sm flex flex-col gap-0">
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Until payday</p>

                  {/* Bills due before payday */}
                  {currentEvents.filter(s => s.type === 'bill').map((seg, i) => seg.type === 'bill' && (
                    <div key={i} className="flex items-center gap-2 px-1 py-2 border-b border-zinc-100 dark:border-zinc-900">
                      <Receipt size={13} className="text-zinc-400 shrink-0" />
                      <span className="text-zinc-700 dark:text-zinc-300 text-sm flex-1 truncate">{seg.name}</span>
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs shrink-0">{fmtDate(seg.date)}</span>
                      <span className="text-red-500 dark:text-red-400 text-sm font-medium tabular-nums shrink-0">−€{seg.amount.toFixed(2)}</span>
                    </div>
                  ))}

                  {/* Paycheck */}
                  {paycheck && paycheck.type === 'paycheck' && (
                    <div className="flex items-center gap-2 px-1 py-2 border-b border-zinc-100 dark:border-zinc-900">
                      <Banknote size={13} className="text-emerald-500 shrink-0" />
                      <span className="text-zinc-700 dark:text-zinc-300 text-sm flex-1">Paycheck</span>
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs shrink-0">{fmtDate(paycheck.date)}</span>
                      <span className="text-emerald-500 text-sm font-medium tabular-nums shrink-0">+€{paycheck.amount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Flat daily for current cycle */}
                  <div className="flex items-center justify-between pt-3 px-1">
                    <span className={`text-2xl font-bold tabular-nums ${color}`}>€{allowance.toFixed(2)}<span className="text-base font-medium">/day</span></span>
                    <span className="text-zinc-400 dark:text-zinc-500 text-sm">{daysRemaining}d left</span>
                  </div>
                </div>

                {/* Next cycle block */}
                {nextPeriod && (
                  <div className="w-full max-w-sm flex flex-col gap-0 mt-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">After payday</p>

                    {/* Bills in next cycle */}
                    {nextBills.map((seg, i) => seg.type === 'bill' && (
                      <div key={i} className="flex items-center gap-2 px-1 py-2 border-b border-zinc-100 dark:border-zinc-900">
                        <Receipt size={13} className="text-zinc-400 shrink-0" />
                        <span className="text-zinc-700 dark:text-zinc-300 text-sm flex-1 truncate">{seg.name}</span>
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs shrink-0">{fmtDate(seg.date)}</span>
                        <span className="text-red-500 dark:text-red-400 text-sm font-medium tabular-nums shrink-0">−€{seg.amount.toFixed(2)}</span>
                      </div>
                    ))}

                    {/* Flat daily for next cycle */}
                    <div className="flex items-center justify-between pt-3 px-1">
                      <span className={`text-2xl font-bold tabular-nums ${dailyColor(nextPeriod.dailyAllowance, paycheckAmount)}`}>
                        €{nextPeriod.dailyAllowance.toFixed(2)}<span className="text-base font-medium">/day</span>
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500 text-sm">{nextPeriod.days}d</span>
                    </div>
                  </div>
                )}
              </>
            )
          })()}

        </div>

        {/* H: Footer */}
        <footer className="px-6 py-5 flex items-center justify-center gap-8 border-t border-zinc-200 dark:border-zinc-900">
          <Link href="/settings" className="text-zinc-400 dark:text-zinc-600 text-sm hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            Settings
          </Link>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="text-zinc-400 dark:text-zinc-600 text-sm hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
              Sign out
            </button>
          </form>
        </footer>

      </main>

      {/* Spend modal */}
      {spendModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setSpendModalOpen(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-950 dark:text-white font-semibold">I just spent</h2>
              <button onClick={() => setSpendModalOpen(false)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form action={handleSpend} className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                <input
                  name="amount" type="number" step="0.01" min="0.01" required autoFocus placeholder="0.00"
                  value={spendAmount}
                  onChange={e => setSpendAmount(e.target.value)}
                  className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 pl-8 pr-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                />
              </div>
              {typedAmount > 0 && (
                <p className={`text-sm ${dailyColor(allowance - typedAmount, paycheckAmount)}`}>
                  Remaining today: €{(allowance - typedAmount).toFixed(2)}
                </p>
              )}
              <input
                name="note" type="text" placeholder="What for? (optional)"
                className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
              <button
                type="submit" disabled={isPending}
                className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Logging…' : 'Log it'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sync modal */}
      {syncModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setSyncModalOpen(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-950 dark:text-white font-semibold">Sync balance</h2>
              <button onClick={() => setSyncModalOpen(false)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-zinc-500 text-sm -mt-2">Open your bank app and enter what you actually have.</p>
            <form action={handleSync} className="flex flex-col gap-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                <input
                  name="balance" type="number" step="0.01" min="0" required defaultValue={currentBalance} autoFocus
                  className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 pl-8 pr-4 py-3 text-zinc-950 dark:text-white text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                />
              </div>
              <button
                type="submit" disabled={isPending}
                className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm py-3 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Syncing…' : 'Sync'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bills modal */}
      {billsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setBillsModalOpen(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-zinc-950 dark:text-white font-semibold">Monthly bills</h2>
                {fullBills.length > 0 && (
                  <span className="text-zinc-400 dark:text-zinc-500 text-sm">€{totalMonthly.toFixed(2)}/mo</span>
                )}
              </div>
              <button onClick={() => setBillsModalOpen(false)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {fullBills.length === 0 ? (
                <p className="text-zinc-400 dark:text-zinc-600 text-sm text-center py-4">No bills yet.</p>
              ) : (
                fullBills.map(bill => (
                  <div
                    key={bill.id}
                    className="flex items-center gap-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-950 dark:text-white text-sm font-medium truncate">{bill.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">day {bill.day_of_month} · €{bill.amount.toFixed(2)}</p>
                    </div>
                    {deletingId === bill.id ? (
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => handleBillDelete(bill.id)}
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
                          onClick={() => setBillFormModal({ mode: 'edit', bill })}
                          className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors p-2"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingId(bill.id)}
                          className="text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition-colors p-2"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              <button
                onClick={() => setBillFormModal({ mode: 'add' })}
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 text-sm py-3.5 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mt-1"
              >
                <Plus size={14} />
                Add a bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill add/edit modal */}
      {billFormModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setBillFormModal(null) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-950 dark:text-white font-semibold">
                {billFormModal.mode === 'add' ? 'Add a bill' : 'Edit bill'}
              </h2>
              <button onClick={() => setBillFormModal(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form action={handleBillSave} className="flex flex-col gap-3">
              <input
                name="name" type="text" required placeholder="Name (e.g. Netflix)"
                defaultValue={billFormModal.mode === 'edit' ? billFormModal.bill.name : ''}
                autoFocus
                className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">€</span>
                  <input
                    name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00"
                    defaultValue={billFormModal.mode === 'edit' ? billFormModal.bill.amount : ''}
                    className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 pl-8 pr-4 py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                  />
                </div>
                <select
                  name="day_of_month" required
                  defaultValue={billFormModal.mode === 'edit' ? billFormModal.bill.day_of_month : ''}
                  className="w-24 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-3 py-3 text-zinc-950 dark:text-white text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
                >
                  <optio