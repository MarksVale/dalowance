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

export type ForecastPeriod = {
  type: 'period'
  fromDate: Date
  toDate: Date
  dailyAllowance: number
  days: number
  isToday: boolean
}

export type ForecastBill = {
  type: 'bill'
  date: Date
  name: string
  amount: number
}

export type ForecastPaycheck = {
  type: 'paycheck'
  date: Date
  amount: number
}

export type ForecastSegment = ForecastPeriod | ForecastBill | ForecastPaycheck

export function calcForecast({
  balance,
  paycheckDay,
  paycheckAmount,
  bufferAmount,
  bills,
}: {
  balance: number
  paycheckDay: number
  paycheckAmount: number
  bufferAmount: number
  bills: Array<{ name: string; amount: number; day_of_month: number }>
}): ForecastSegment[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const today = new Date(y, m, d)

  const paycheck1 =
    d <= paycheckDay
      ? new Date(y, m, paycheckDay)
      : new Date(y, m + 1, paycheckDay)
  const paycheck2 = new Date(paycheck1.getFullYear(), paycheck1.getMonth() + 1, paycheckDay)

  type RawEvent =
    | { type: 'bill'; date: Date; name: string; amount: number }
    | { type: 'paycheck'; date: Date; amount: number }

  const events: RawEvent[] = [
    { type: 'paycheck', date: paycheck1, amount: paycheckAmount },
    { type: 'paycheck', date: paycheck2, amount: paycheckAmount },
  ]

  for (const bill of bills) {
    let ey = y, em = m
    for (let i = 0; i < 6; i++) {
      const billDate = new Date(ey, em, bill.day_of_month)
      if (billDate.getTime() >= paycheck2.getTime()) break
      if (billDate.getMonth() === em && billDate.getTime() > today.getTime()) {
        events.push({ type: 'bill', date: billDate, name: bill.name, amount: bill.amount })
      }
      em++
      if (em > 11) { em = 0; ey++ }
    }
  }

  events.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime()
    if (diff !== 0) return diff
    return a.type === 'paycheck' ? -1 : 1
  })

  const billAmount = (e: RawEvent) => (e as { type: 'bill'; amount: number }).amount

  // Pre-compute a single daily rate per cycle so all periods within a cycle show the same number.
  // Cycle 0: today → paycheck1 (uses current real balance)
  const daysInCycle0 = Math.max(1, Math.round((paycheck1.getTime() - today.getTime()) / 86_400_000))
  const billsInCycle0 = events
    .filter(e => e.type === 'bill' && e.date.getTime() > today.getTime() && e.date.getTime() < paycheck1.getTime())
    .reduce((sum, e) => sum + billAmount(e), 0)
  const dailyCycle0 = Math.round(((balance - billsInCycle0 - bufferAmount) / daysInCycle0) * 100) / 100

  // Cycle 1: paycheck1 → paycheck2 (uses paycheckAmount, all bills in that window)
  const daysInCycle1 = Math.max(1, Math.round((paycheck2.getTime() - paycheck1.getTime()) / 86_400_000))
  const billsInCycle1 = events
    .filter(e => e.type === 'bill' && e.date.getTime() >= paycheck1.getTime() && e.date.getTime() < paycheck2.getTime())
    .reduce((sum, e) => sum + billAmount(e), 0)
  const dailyCycle1 = Math.round(((paycheckAmount - billsInCycle1 - bufferAmount) / daysInCycle1) * 100) / 100

  const segments: ForecastSegment[] = []
  let periodStart = today

  for (const event of events) {
    const periodEnd = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate() - 1)

    if (periodEnd.getTime() >= periodStart.getTime()) {
      const days = Math.round((periodEnd.getTime() - periodStart.getTime()) / 86_400_000) + 1
      const inCycle1 = periodStart.getTime() >= paycheck1.getTime()
      segments.push({
        type: 'period',
        fromDate: new Date(periodStart),
        toDate: new Date(periodEnd),
        dailyAllowance: inCycle1 ? dailyCycle1 : dailyCycle0,
        days,
        isToday: periodStart.getTime() === today.getTime(),
      })
    }

    if (event.type === 'paycheck') {
      segments.push({ type: 'paycheck', date: event.date, amount: event.amount })
      periodStart = new Date(event.date)
    } else {
      segments.push({ type: 'bill', date: event.date, name: event.name, amount: event.amount })
      periodStart = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate() + 1)
    }
  }

  return segments
}

export function formatPaycheckDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
}
