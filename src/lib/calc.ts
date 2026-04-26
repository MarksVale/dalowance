export type BillInput = { amount: number; day_of_month: number }

export function calcAllowance({
  balance,
  paycheckDay,
  bufferAmount,
  bills,
  asOf,
}: {
  balance: number
  paycheckDay: number
  paycheckAmount: number
  bufferAmount: number
  bills: BillInput[]
  asOf?: Date
}): { allowance: number; daysRemaining: number; nextPaycheckDate: Date } {
  const now = asOf ?? new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  const nextPaycheckDate =
    d <= paycheckDay
      ? new Date(y, m, paycheckDay)
      : new Date(y, m + 1, paycheckDay)

  const todayMs = new Date(y, m, d).getTime()
  const paycheckMs = new Date(
    nextPaycheckDate.getFullYear(),
    nextPaycheckDate.getMonth(),
    nextPaycheckDate.getDate()
  ).getTime()

  const daysRemaining = Math.max(1, Math.round((paycheckMs - todayMs) / 86_400_000))

  const pm = nextPaycheckDate.getMonth()
  const py = nextPaycheckDate.getFullYear()
  const sameMonth = m === pm && y === py

  // Bills that will auto-deduct between now and paycheck day (exclusive on both ends)
  const billsTotal = bills
    .filter(b =>
      sameMonth
        ? b.day_of_month > d && b.day_of_month < paycheckDay
        : b.day_of_month > d || b.day_of_month < paycheckDay
    )
    .reduce((s, b) => s + Number(b.amount), 0)

  const allowance =
    Math.round(((balance - billsTotal - bufferAmount) / daysRemaining) * 100) / 100

  return { allowance, daysRemaining, nextPaycheckDate }
}

export function allowanceColor(allowance: number, paycheckAmount: number): string {
  const idealDaily = paycheckAmount > 0 ? paycheckAmount / 30 : 1
  const ratio = allowance / idealDaily
  if (ratio >= 0.7) return 'text-emerald-600 dark:text-emerald-400'
  if (ratio >= 0.3) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export function formatAllowance(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}€${Math.abs(amount).toFixed(2)}`
}

export type UpcomingEvent = {
  type: 'bill' | 'paycheck'
  name: string
  amount: number
  date: Date
  daysUntil: number
}

export function getUpcomingEvents({
  bills,
  paycheckDay,
  paycheckAmount,
}: {
  bills: Array<{ name: string; amount: number; day_of_month: number }>
  paycheckDay: number
  paycheckAmount: number
}): UpcomingEvent[] {
  const now = new Date()
  const d = now.getDate()
  const m = now.getMonth()
  const y = now.getFullYear()
  const today = new Date(y, m, d)

  const nextPaycheckDate =
    d <= paycheckDay
      ? new Date(y, m, paycheckDay)
      : new Date(y, m + 1, paycheckDay)

  const pm = nextPaycheckDate.getMonth()
  const py = nextPaycheckDate.getFullYear()
  const sameMonth = m === pm && y === py

  const events: UpcomingEvent[] = []

  for (const bill of bills) {
    let billDate: Date | null = null
    if (sameMonth) {
      if (bill.day_of_month >= d && bill.day_of_month < paycheckDay)
        billDate = new Date(y, m, bill.day_of_month)
    } else {
      if (bill.day_of_month >= d)
        billDate = new Date(y, m, bill.day_of_month)
      else if (bill.day_of_month < paycheckDay)
        billDate = new Date(py, pm, bill.day_of_month)
    }
    if (billDate) {
      const daysUntil = Math.round((billDate.getTime() - today.getTime()) / 86_400_000)
      events.push({ type: 'bill', name: bill.name, amount: bill.amount, date: billDate, daysUntil })
    }
  }

  const daysUntilPaycheck = Math.round((nextPaycheckDate.getTime() - today.getTime()) / 86_400_000)
  events.push({ type: 'paycheck', name: 'Paycheck', amount: paycheckAmount, date: nextPaycheckDate, daysUntil: daysUntilPaycheck })

  return events.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 3)
}

export function formatPaycheckDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
}
