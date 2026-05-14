import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'

interface RecurrenceSuggestion {
  description: string
  category: string
  type: 'INCOME' | 'EXPENSE'
  avgAmount: number
  occurrences: number
  lastDate: string
  periodDays: number
  label: string // "Mensuel", "Hebdomadaire", etc.
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[\d/\-_.]+/g, '') // remove numbers and separators
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Load last 90 days of transactions
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: since } },
      orderBy: { date: 'asc' },
    })

    if (transactions.length < 3) return NextResponse.json({ suggestions: [] })

    // Group by normalized description
    const groups = new Map<string, typeof transactions>()
    for (const tx of transactions) {
      const key = normalizeDescription(tx.description || tx.category)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(tx)
    }

    const suggestions: RecurrenceSuggestion[] = []

    for (const [, txs] of groups) {
      if (txs.length < 2) continue

      // Check same type
      const types = [...new Set(txs.map(t => t.type))]
      if (types.length > 1) continue

      // Check similar amounts (within 20%)
      const amounts = txs.map(t => t.amount)
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const allSimilar = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.25)
      if (!allSimilar) continue

      // Compute gaps between dates
      const dates = txs.map(t => new Date(t.date).getTime()).sort((a, b) => a - b)
      const gaps: number[] = []
      for (let i = 1; i < dates.length; i++) {
        gaps.push((dates[i] - dates[i - 1]) / 86400000) // days
      }

      if (gaps.length === 0) continue
      const medianGap = median(gaps)

      // Classify period
      let label = ''
      if (medianGap >= 6 && medianGap <= 10) label = 'Hebdomadaire'
      else if (medianGap >= 13 && medianGap <= 17) label = 'Bi-mensuel'
      else if (medianGap >= 26 && medianGap <= 35) label = 'Mensuel'
      else if (medianGap >= 55 && medianGap <= 70) label = 'Bi-mensuel'
      else if (medianGap >= 85 && medianGap <= 95) label = 'Trimestriel'
      else continue // Not a clear recurrence

      const lastTx = txs[txs.length - 1]
      suggestions.push({
        description: lastTx.description || lastTx.category,
        category: lastTx.category,
        type: lastTx.type as 'INCOME' | 'EXPENSE',
        avgAmount: Math.round(avgAmount * 100) / 100,
        occurrences: txs.length,
        lastDate: new Date(lastTx.date).toISOString().split('T')[0],
        periodDays: Math.round(medianGap),
        label,
      })
    }

    // Sort by most recent last occurrence
    suggestions.sort((a, b) =>
      new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    )

    return NextResponse.json({ suggestions: suggestions.slice(0, 5) })
  } catch (error) {
    console.error('[cash/recurrences]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
