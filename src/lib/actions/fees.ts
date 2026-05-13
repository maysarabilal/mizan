'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import type { Database } from '@/types/database'

type CaseFee = Database['public']['Tables']['case_fees']['Row']
type CasePayment = Database['public']['Tables']['case_payments']['Row']
type CaseExpense = Database['public']['Tables']['case_expenses']['Row']

interface CaseFinancials {
  fee: CaseFee | null
  payments: CasePayment[]
  expenses: CaseExpense[]
  totalAmount: number
  totalPaid: number
  totalExpenses: number
  remaining: number
}

// ─── Permission Helper ───

async function checkFeePermission(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ allowed: boolean; role: string; officeId: string | null; userId: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, role: '', officeId: null, userId: '' }

  const { data: member } = await supabase
    .from('office_members')
    .select('role, office_id, can_manage_fees')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member) return { allowed: false, role: '', officeId: null, userId: user.id }

  const canManage = member.role === 'owner' || member.role === 'admin' || member.can_manage_fees === true
  return { allowed: canManage, role: member.role, officeId: member.office_id, userId: user.id }
}

// ─── Get Case Financials ───

export async function getCaseFinancials(caseId: string): Promise<ActionResult<CaseFinancials>> {
  const supabase = await createClient()

  // Fetch fee agreement
  const { data: fee } = await supabase
    .from('case_fees')
    .select('*')
    .eq('case_id', caseId)
    .single()

  // Fetch payments (only if fee exists)
  let payments: CasePayment[] = []
  if (fee) {
    const { data: paymentData } = await supabase
      .from('case_payments')
      .select('*')
      .eq('case_fee_id', fee.id)
      .order('payment_date', { ascending: false })

    payments = paymentData || []
  }

  // Fetch expenses
  const { data: expenseData } = await supabase
    .from('case_expenses')
    .select('*')
    .eq('case_id', caseId)
    .order('expense_date', { ascending: false })

  const expenses = expenseData || []

  const totalAmount = fee?.total_amount || 0
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return {
    data: {
      fee,
      payments,
      expenses,
      totalAmount: Number(totalAmount),
      totalPaid,
      totalExpenses,
      remaining: Number(totalAmount) - totalPaid,
    },
    error: null,
  }
}

// ─── Upsert Fee Agreement ───

export async function upsertCaseFeeAgreement(
  caseId: string,
  data: { total_amount: number; notes?: string }
): Promise<ActionResult<CaseFee>> {
  const supabase = await createClient()
  const perm = await checkFeePermission(supabase)
  if (!perm.allowed) return { data: null, error: 'ليس لديك صلاحية لإدارة الأتعاب' }
  if (!perm.officeId) return { data: null, error: 'لم يتم تحديد المكتب' }

  // Check if fee agreement already exists
  const { data: existing } = await supabase
    .from('case_fees')
    .select('id')
    .eq('case_id', caseId)
    .single()

  if (existing) {
    // Update
    const { data: updated, error } = await supabase
      .from('case_fees')
      .update({
        total_amount: data.total_amount,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Update fee error:', error)
      return { data: null, error: 'فشل في تحديث الأتعاب' }
    }

    revalidatePath(`/dashboard/cases/${caseId}`)
    return { data: updated, error: null }
  } else {
    // Get client_id from case
    const { data: caseData } = await supabase
      .from('cases')
      .select('client_id')
      .eq('id', caseId)
      .single()

    // Insert
    const { data: created, error } = await supabase
      .from('case_fees')
      .insert({
        case_id: caseId,
        office_id: perm.officeId,
        client_id: caseData?.client_id || null,
        total_amount: data.total_amount,
        notes: data.notes || null,
        created_by: perm.userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert fee error:', error)
      return { data: null, error: 'فشل في إنشاء اتفاقية الأتعاب' }
    }

    revalidatePath(`/dashboard/cases/${caseId}`)
    return { data: created, error: null }
  }
}

// ─── Add Payment ───

export async function addPayment(
  caseFeeId: string,
  caseId: string,
  data: { amount: number; payment_date: string; payment_method: string; notes?: string }
): Promise<ActionResult<CasePayment>> {
  const supabase = await createClient()
  const perm = await checkFeePermission(supabase)
  if (!perm.allowed) return { data: null, error: 'ليس لديك صلاحية لتسجيل دفعة' }
  if (!perm.officeId) return { data: null, error: 'لم يتم تحديد المكتب' }

  const { data: payment, error } = await supabase
    .from('case_payments')
    .insert({
      case_fee_id: caseFeeId,
      office_id: perm.officeId,
      amount: data.amount,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      notes: data.notes || null,
      recorded_by: perm.userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Insert payment error:', error)
    return { data: null, error: 'فشل في تسجيل الدفعة' }
  }

  revalidatePath(`/dashboard/cases/${caseId}`)
  return { data: payment, error: null }
}

// ─── Delete Payment ───

export async function deletePayment(paymentId: string, caseId: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const perm = await checkFeePermission(supabase)
  
  if (perm.role !== 'owner' && perm.role !== 'admin') {
    return { data: null, error: 'فقط المالك أو المدير يمكنه حذف الدفعات' }
  }

  const { error } = await supabase
    .from('case_payments')
    .delete()
    .eq('id', paymentId)

  if (error) {
    console.error('Delete payment error:', error)
    return { data: null, error: 'فشل في حذف الدفعة' }
  }

  revalidatePath(`/dashboard/cases/${caseId}`)
  return { data: null, error: null }
}

// ─── Add Expense ───

export async function addExpense(
  caseId: string,
  data: { amount: number; expense_date: string; description: string }
): Promise<ActionResult<CaseExpense>> {
  const supabase = await createClient()
  const perm = await checkFeePermission(supabase)
  if (!perm.allowed) return { data: null, error: 'ليس لديك صلاحية لإضافة مصاريف' }
  if (!perm.officeId) return { data: null, error: 'لم يتم تحديد المكتب' }

  const { data: expense, error } = await supabase
    .from('case_expenses')
    .insert({
      case_id: caseId,
      office_id: perm.officeId,
      amount: data.amount,
      expense_date: data.expense_date,
      description: data.description,
      recorded_by: perm.userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Insert expense error:', error)
    return { data: null, error: 'فشل في إضافة المصروف' }
  }

  revalidatePath(`/dashboard/cases/${caseId}`)
  return { data: expense, error: null }
}

// ─── Delete Expense ───

export async function deleteExpense(expenseId: string, caseId: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const perm = await checkFeePermission(supabase)
  
  if (perm.role !== 'owner' && perm.role !== 'admin') {
    return { data: null, error: 'فقط المالك أو المدير يمكنه حذف المصاريف' }
  }

  const { error } = await supabase
    .from('case_expenses')
    .delete()
    .eq('id', expenseId)

  if (error) {
    console.error('Delete expense error:', error)
    return { data: null, error: 'فشل في حذف المصروف' }
  }

  revalidatePath(`/dashboard/cases/${caseId}`)
  return { data: null, error: null }
}

// ─── Get Office Financial Summary ───

export interface CaseFinancialSummary {
  case_id: string
  case_title: string
  case_number: string | null
  client_name: string | null
  total_amount: number
  total_paid: number
  remaining: number
}

export interface OfficeFinancialSummary {
  total_fees: number
  total_paid: number
  total_remaining: number
  cases_with_fees: CaseFinancialSummary[]
}

export async function getOfficeFinancialSummary(): Promise<ActionResult<OfficeFinancialSummary>> {
  const supabase = await createClient()
  const perm = await checkFeePermission(supabase)
  
  if (!perm.officeId) return { data: null, error: 'unauthorized' }

  // Secretary or Trainee without explicit permission -> unauthorized
  if ((perm.role === 'secretary' || perm.role === 'trainee') && !perm.allowed) {
    return { data: null, error: 'unauthorized' }
  }

  let query = supabase
    .from('cases')
    .select(`
      id,
      title,
      case_number,
      assigned_to,
      clients ( name ),
      case_fees (
        total_amount,
        case_payments ( amount )
      )
    `)
    .eq('office_id', perm.officeId)

  // Lawyer without explicit permission -> filter by their cases
  if (perm.role === 'lawyer' && !perm.allowed) {
    query = query.eq('assigned_to', perm.userId)
  }

  const { data: casesData, error } = await query

  if (error) {
    console.error('getOfficeFinancialSummary error:', error)
    return { data: null, error: 'فشل في استرداد البيانات المالية' }
  }

  let totalFees = 0
  let totalPaid = 0
  const casesWithFees: CaseFinancialSummary[] = []

  if (casesData) {
    casesData.forEach((c) => {
      // Supabase nested relation gives arrays or objects depending on cardinality. Handle both.
      const feesArr = Array.isArray(c.case_fees) ? c.case_fees : (c.case_fees ? [c.case_fees] : [])
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      feesArr.forEach((feeItem: any) => {
        const amount = Number(feeItem.total_amount) || 0
        const payments = Array.isArray(feeItem.case_payments) ? feeItem.case_payments : (feeItem.case_payments ? [feeItem.case_payments] : [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paid = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
        
        totalFees += amount
        totalPaid += paid

        casesWithFees.push({
          case_id: c.id,
          case_title: c.title,
          case_number: c.case_number,
          // @ts-expect-error - Type instantiation depth
          client_name: c.clients && !Array.isArray(c.clients) ? c.clients.name : null,
          total_amount: amount,
          total_paid: paid,
          remaining: amount - paid
        })
      })
    })
  }

  return {
    data: {
      total_fees: totalFees,
      total_paid: totalPaid,
      total_remaining: totalFees - totalPaid,
      cases_with_fees: casesWithFees
    },
    error: null
  }
}
