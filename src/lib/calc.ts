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

  // Deduct ALL bills in this cycle upfront, then divide evenly
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

export type ForecastSegment =
  | { type: 'period'; fromDate: Date; toDate: Date; dailyAllowance: number; days: number; isCurrentPeriod: boolean }
  | { type: 'bill'; date: Date; name: string; amount: number }
  | { type: 'paycheck'; date: Date; amount: number }

function sumBillsBetween(
  bills: Array<{ amount: number; day_of_month: number }>,
  from: Date,
  to: Date
): number {
  let total = 0
  for (const bill of bills) {
    let ey = from.getFullYear(), em = from.getMonth()
    for (let i = 0; i < 4; i++) {
      const bd = new Date(ey, em, bill.day_of_month)
      if (bd.getTime() >= to.getTime()) break
      if (bd.getTime() > from.getTime()) total += bill.amount
      em++
      if (em > 11) { em = 0; ey++ }
    }
  }
  return total
}

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
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate()
  const today = new Date(y, m, d)

  const paycheck1 =
    d <= paycheckDay
      ? new Date(y, m, paycheckDay)
      : new Date(y, m + 1, paycheckDay)
  const paycheck2 = new Date(paycheck1.getFullYear(), paycheck1.getMonth() + 1, paycheckDay)

  // Current cycle: one flat daily rate (all bills deducted upfront)
  const { allowance: currentDailyRate, daysRemaining } = calcAllowance({
    balance, paycheckDay, paycheckAmount, bufferAmount, bills,
  })

  // Next cycle: all bills in that cycle deducted from paycheck upfront
  const billsNextCycle = sumBillsBetween(bills, paycheck1, paycheck2)
  const daysNextCycle = Math.max(1, Math.round((paycheck2.getTime() - paycheck1.getTime()) / 86_400_000))
  const nextDailyRate = Math.round((paycheckAmount - billsNextCycle - bufferAmount) / daysNextCycle * 100) / 100

  // Collect all bill events between today and paycheck2
  type BillEvent = { type: 'bill'; date: Date; name: string; amount: number }
  const billEvents: BillEvent[] = []
  for (const bill of bills) {
    let ey = y, em = m
    for (let i = 0; i < 6; i++) {
      const billDate = new Date(ey, em, bill.day_of_month)
      if (billDate.getTime() >= paycheck2.getTime()) break
      if (billDate.getTime() > today.getTime()) {
        billEvents.push({ type: 'bill', date: billDate, name: bill.name, amount: bill.amount })
      }
      em++
      if (em > 11) { em = 0; ey++ }
    }
  }
  billEvents.sort((a, b) => a.date.getTime() - b.date.getTime())

  const billsBefore1 = billEvents.filter(e => e.date.getTime() < paycheck1.getTime())
  const billsAfter1 = billEvents.filter(e => e.date.getTime() >= paycheck1.getTime())

  const segments: ForecastSegment[] = []

  // 1. Current period — one flat block
  const currentPeriodEnd = new Date(paycheck1.getFullYear(), paycheck1.getMonth(), paycheck1.getDate() - 1)
  segments.push({
    type: 'period',
    fromDate: today,
    toDate: currentPeriodEnd,
    dailyAllowance: currentDailyRate,
    days: daysRemaining,
    isCurrentPeriod: true,
  })

  // 2. Any bills due before payday (as warning markers)
  for (const ev of billsBefore1) {
    segments.push({ type: 'bill', date: ev.date, name: ev.name, amount: ev.amount })
  }

  // 3. Paycheck 1
  segments.push({ type: 'paycheck', date: paycheck1, amount: paycheckAmount })

  // 4. Next cycle — one flat block
  const nextPeriodEnd = new Date(paycheck2.getFullYear(), paycheck2.getMonth(), paycheck2.getDate() - 1)
  segments.push({
    type: 'period',
    fromDate: paycheck1,
    toDate: nextPeriodEnd,
    dailyAllowance: nextDailyRate,
    days: daysNextCycle,
    isCurrentPeriod: false,
  })

  // 5. Bills in the next cycle (shown as info — already deducted from rate above)
  for (const ev of billsAfter1) {
    segments.push({ type: 'bill', date: ev.date, name: ev.name, amount: ev.amount })
  }

  // 6. Paycheck 2
  segments.push({ type: 'paycheck', date: paycheck2, amount: paycheckAmount })

  return segments
}

export function calcSaveUpAllowance(params: {
  balance: number
  paycheckDay: number
  paycheckAmount: number
  bufferAmount: number
  bills: Array<{ name: string; amount: number; day_of_month: number }>
  targetDate: Date
}): { dailyAllowance: number; daysSkipped: number } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(params.targetDate.getFullYear(), params.targetDate.getMonth(), params.targetDate.getDate())

  const daysSkipped = Math.max(0, Math.round((target.getTime() - today.getTime()) / 86_400_000))

  const billsBetweenNowAndTarget = sumBillsBetween(params.bills, today, target)

  const ty = target.getFullYear(), tm = target.getMonth(), td = target.getDate()
  const nextPCFromTarget =
    td < params.paycheckDay
      ? new Date(ty, tm, params.paycheckDay)
      : new Date(ty, tm + 1, params.paycheckDay)

  const billsTargetToPaycheck = sumBillsBetween(params.bills, target, nextPCFromTarget)
  const daysFromTargetToPaycheck = Math.max(1, Math.round((nextPCFromTarget.getTime() - target.getTime()) / 86_400_000))

  const dailyAllowance = Math.round(
    (params.balance - billsBetweenNowAndTarget - billsTargetToPaycheck - params.bufferAmount)
    / daysFromTargetToPaycheck * 100
  ) / 100

  return { dailyAllowance, daysSkipped }
}

export function getContextMessage(params: {
  allowance: number
  paycheckAmount: number
  daysRemaining: number
  daysAgoBalance: number
  paycheckDay: number
  bills: Array<{ name: string; day_of_month: number }>
}): { text: string; color: 'emerald' | 'amber' | 'red' | 'zinc' } {
  const now = new Date()
  const today = now.getDate()

  if (today === params.paycheckDay) {
    return { text: 'Payday! Sync your balance to start fresh.', color: 'emerald' }
  }

  if (params.daysAgoBalance > 1) {
    return {
      text: `Your balance is ${params.daysAgoBalance} days old — sync it for the real number.`,
      color: 'amber',
    }
  }

  const upcomingBills = params.bills
    .map(b => {
      const billDay = b.day_of_month
      let daysUntil = billDay - today
      if (daysUntil < 0) daysUntil += 31
      return { name: b.name, daysUntil }
    })
    .filter(b => b.daysUntil <= 2)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  if (upcomingBills.length > 0) {
    const nearest = upcomingBills[0]
    const dayLabel = nearest.daysUntil === 0 ? 'today' : nearest.daysUntil === 1 ? 'tomorrow' : 'in 2 days'
    return { text: `Heads up — ${nearest.name} is due ${dayLabel}.`, color: 'amber' }
  }

  if (params.allowance < 0) {
    return { text: "You're over budget. Cut back to recover by payday.", color: 'red' }
  }

  if (params.daysRemaining === 1) {
    return { text: 'Last day before payday. Make it count.', color: 'zinc' }
  }

  const timeframe = params.daysRemaining <= 7 ? 'this week' : 'this month'
  const ratio = params.allowance / (params.paycheckAmount > 0 ? params.paycheckAmount / 30 : 1)

  if (ratio >= 0.7) return { text: `You're looking good ${timeframe}.`, color: 'emerald' }
  if (ratio >= 0.3) return { text: `Getting tight ${timeframe} — pace yourself today.`, color: 'amber' }
  return { text: `Running low ${timeframe}. Every euro counts.`, color: 'red' }
}

export function getGreeting(name: string | null, hour: number): string {
  const suffix = name ? `, ${name}` : ''
  if (hour >= 6 && hour < 12) return `Good morning${suffix}.`
  if (hour >= 12 && hour < 17) return `Good afternoon${suffix}.`
  if (hour >= 17 && hour < 22) return `Good evening${suffix}.`
  return `Hey${suffix}.`
}

export function formatPaycheckDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
}
