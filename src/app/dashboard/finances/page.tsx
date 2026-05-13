import { redirect } from 'next/navigation'
import { getOfficeFinancialSummary } from '@/lib/actions/fees'
import { FinancesClient } from './FinancesClient'

export const metadata = {
  title: 'التقرير المالي | ميزان',
}

export default async function FinancesPage() {
  const { data, error } = await getOfficeFinancialSummary()

  // Redirect if unauthorized or error
  if (!data || error === 'unauthorized') {
    redirect('/dashboard')
  }

  return <FinancesClient data={data} />
}
