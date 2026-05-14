import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'

// URSSAF rates by activity type (2025)
const URSSAF_RATES: Record<string, number> = {
  SERVICE_BNC: 22.0,  // Prestation de services BNC (micro-BNC, libéral)
  SERVICE_BIC: 22.9,  // Prestation de services BIC
  COMMERCE:    12.3,  // Vente de marchandises / hébergement
  LIBERAL:     22.2,  // Libéral réglementé CIPAV
}

// TVA franchise thresholds by activity type (2024-2025)
const TVA_THRESHOLDS: Record<string, number> = {
  SERVICE_BNC: 36800,
  SERVICE_BIC: 36800,
  COMMERCE:    91900,
  LIBERAL:     36800,
}

const TVA_TOLERANCE: Record<string, number> = {
  SERVICE_BNC: 39100,
  SERVICE_BIC: 39100,
  COMMERCE:    101000,
  LIBERAL:     39100,
}

function monthLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Get user fiscal settings
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        activityType: true,
        urssafRate: true,
        urssafPeriodicity: true,
        tvaThreshold: true,
      },
    })

    const activityType = user?.activityType || 'SERVICE_BNC'
    const urssafRate = user?.urssafRate ?? URSSAF_RATES[activityType] ?? 22.0
    const urssafPeriodicity = user?.urssafPeriodicity || 'MONTHLY'
    const tvaThreshold = user?.tvaThreshold ?? TVA_THRESHOLDS[activityType] ?? 36800
    const tvaTolerance = TVA_TOLERANCE[activityType] ?? 39100

    const now = new Date()
    const currentYear = now.getFullYear()

    // Load all transactions for current year (INCOME only for CA)
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.userId,
        date: { gte: yearStart, lte: yearEnd },
      },
      select: { amount: true, type: true, date: true },
    })

    // Aggregate monthly CA (INCOME only)
    const monthlyCA: Record<string, number> = {}
    let annualCA = 0

    for (const tx of transactions) {
      if (tx.type !== 'INCOME') continue
      const d = new Date(tx.date)
      const key = monthLabel(d.getFullYear(), d.getMonth() + 1)
      monthlyCA[key] = (monthlyCA[key] || 0) + tx.amount
      annualCA += tx.amount
    }

    // Load existing declarations for current year
    const declarations = await prisma.urssafDeclaration.findMany({
      where: {
        userId: session.userId,
        period: { startsWith: String(currentYear) },
      },
    })
    const declaredPeriods = new Map(declarations.map(d => [d.period, d]))

    // Build monthly grid (Jan → current month)
    const months = []
    const currentMonth = now.getMonth() + 1

    for (let m = 1; m <= currentMonth; m++) {
      const period = monthLabel(currentYear, m)
      const ca = monthlyCA[period] || 0
      const cotisations = Math.round(ca * urssafRate) / 100
      const decl = declaredPeriods.get(period)
      const isPast = m < currentMonth
      const isCurrent = m === currentMonth

      months.push({
        period,
        month: m,
        year: currentYear,
        label: new Date(currentYear, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        ca: Math.round(ca * 100) / 100,
        cotisations: Math.round(cotisations * 100) / 100,
        status: decl?.status || 'PENDING',
        declaredAt: decl?.declaredAt?.toISOString() || null,
        isPast,
        isCurrent,
        hasCA: ca > 0,
      })
    }

    // TVA tracker
    const tvaPercent = Math.min(Math.round((annualCA / tvaThreshold) * 100), 150)
    const tvaStatus = annualCA >= tvaTolerance
      ? 'EXCEEDED'
      : annualCA >= tvaThreshold
        ? 'TOLERANCE'
        : annualCA >= tvaThreshold * 0.8
          ? 'WARNING'
          : 'OK'

    // Pending declarations (past months with CA > 0 and not declared)
    const pendingCount = months.filter(m => m.isPast && m.hasCA && m.status === 'PENDING').length

    return NextResponse.json({
      activityType,
      urssafRate,
      urssafPeriodicity,
      tvaThreshold,
      tvaTolerance,
      annualCA: Math.round(annualCA * 100) / 100,
      tvaPercent,
      tvaStatus, // OK | WARNING | TOLERANCE | EXCEEDED
      months,
      pendingCount,
      currentYear,
    })
  } catch (error) {
    console.error('[cash/urssaf GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// POST — Mark a period as declared
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { period, ca, cotisations } = await request.json()
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json({ error: 'Période invalide (format YYYY-MM requis)' }, { status: 400 })
    }

    const declaration = await prisma.urssafDeclaration.upsert({
      where: { userId_period: { userId: session.userId, period } },
      create: {
        userId: session.userId,
        period,
        ca: ca || 0,
        cotisations: cotisations || 0,
        status: 'DECLARED',
        declaredAt: new Date(),
      },
      update: {
        ca: ca || 0,
        cotisations: cotisations || 0,
        status: 'DECLARED',
        declaredAt: new Date(),
      },
    })

    return NextResponse.json({ declaration })
  } catch (error) {
    console.error('[cash/urssaf POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// PATCH — Update user fiscal settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { activityType, urssafRate, urssafPeriodicity, tvaThreshold } = await request.json()

    const updateData: Record<string, unknown> = {}
    if (activityType) {
      updateData.activityType = activityType
      // Auto-update rate and threshold if not manually set
      updateData.urssafRate = URSSAF_RATES[activityType] ?? 22.0
      updateData.tvaThreshold = TVA_THRESHOLDS[activityType] ?? 36800
    }
    if (urssafRate !== undefined) updateData.urssafRate = urssafRate
    if (urssafPeriodicity) updateData.urssafPeriodicity = urssafPeriodicity
    if (tvaThreshold !== undefined) updateData.tvaThreshold = tvaThreshold

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[cash/urssaf PATCH]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
