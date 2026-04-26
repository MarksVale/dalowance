import { cookies } from 'next/headers'
import BillsForm from './BillsForm'

export default async function BillsPage() {
  const store = await cookies()
  let prev: {
    bills?: Array<{ name: string; amount: number; day_of_month: number }>
    buffer_amount?: number
  } = {}
  try { prev = JSON.parse(store.get('onboarding')?.value ?? '{}') } catch {}

  return (
    <BillsForm
      initialBills={prev.bills ?? []}
      initialBuffer={prev.buffer_amount ?? 0}
    />
  )
}
