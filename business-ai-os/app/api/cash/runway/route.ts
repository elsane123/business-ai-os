import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + Math.floor(months))
  const remainingDays = Math.round((months % 1) * 30)
  d.setDate(d.getDate() + remainingDays)
  return d
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch user settings
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { monthlyGoal: true, fixedCharges: true },
    })

    const monthlyGoal = user?.monthlyGoal ?? 0
    const fixedCharges = user?.fixedCharges ?? 0

    // Current month boundaries
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // All-time transactions for balance
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: session.userId },
      select: { amount: true, type: true, date: true },
    })

    // Current balance = sum of all transactions
    const currentBalance = allTransactions.reduce((sum, t) => {
      return t.type === 'INCOME' ? sum + t.amount : sum - t.amount
    }, 0)

    // Current month transactions
    const monthTransactions = allTransactions.filter(t => {
      const d = new Date(t.date)
      return d >= startOfMonth && d <= endOfMonth
    })

    const monthlyIncome = monthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyExpenses = monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    // Goal progress
    const goalProgress = monthlyGoal > 0
      ? Math.min(Math.round((monthlyIncome / monthlyGoal) * 100), 100)
      : 0

    // Runway calculation
    // Monthly burn = fixedCharges (guaranteed) + variable expenses estimate
    // Pessimistic: burn = fixedCharges + monthlyExpenses (worst case all repeats)
    // Realistic: burn = fixedCharges + (monthlyExpenses * 0.7) average
    // Optimistic: burn = fixedCharges * 0.8 (only essential)
    const safeBurn = monthlyExpenses > 0 ? monthlyExpenses : fixedCharges || 1
    const pessimisticBurn = Math.max(fixedCharges + safeBurn, 1)
    const realisticBurn = Math.max(fixedCharges + safeBurn * 0.7, 1)
    const optimisticBurn = Math.max(fixedCharges * 0.8 || safeBurn * 0.5, 1)

    const balance = Math.max(currentBalance, 0)

    const pessimisticMonths = Math.min(balance / pessimisticBurn, 999)
    const realisticMonths = Math.min(balance / realisticBurn, 999)
    const optimisticMonths = Math.min(balance / optimisticBurn, 999)

    const pessimisticDate = addMonths(now, pessimisticMonths)
    const realisticDate = addMonths(now, realisticMonths)
    const optimisticDate = addMonths(now, optimisticMonths)

    return NextResponse.json({
      currentBalance: Math.round(currentBalance * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
      monthlyGoal,
      fixedCharges,
      goalProgress,
      runway: {
        pessimistic: {
          months: Math.round(pessimisticMonths * 10) / 10,
          date: pessimisticDate.toISOString().split('T')[0],
        },
        realistic: {
          months: Math.round(realisticMonths * 10) / 10,
          date: realisticDate.toISOString().split('T')[0],
        },
        optimistic: {
          months: Math.round(optimisticMonths * 10) / 10,
          date: optimisticDate.toISOString().split('T')[0],
        },
      },
    })
  } catch (error) {
    console.error('[cash/runway GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
