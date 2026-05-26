import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Step IDs that are auto-detected from real data
// Step IDs that must be manually marked (visits)
const MANUAL_STEPS = ['chat', 'agents']

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        sector: true,
        onboardingProgress: true,
        profileEnrichment: true,
        calcomBookingUrl: true,
        createdAt: true,
        _count: {
          select: {
            prospects: true,
            tasks: true,
            dailyFocuses: true,
          },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Parse stored manual completions
    let manualDone: string[] = []
    try {
      manualDone = JSON.parse(user.onboardingProgress ?? '[]')
    } catch {
      manualDone = []
    }

    // Auto-detect enrichment completion (profileEnrichment has real data beyond empty object)
    let enrichDone = false
    try {
      const enrichData = JSON.parse(user.profileEnrichment ?? '{}')
      enrichDone = Object.values(enrichData).some((v) => v !== '' && v !== null && v !== undefined)
    } catch { enrichDone = false }

    // Auto-detect completions from real data
    const completed: string[] = [
      'account', // always done
      ...(user.sector ? ['sector'] : []),
      ...(user._count.prospects > 0 ? ['prospect'] : []),
      ...(user._count.tasks > 0 ? ['task'] : []),
      ...(user._count.dailyFocuses > 0 ? ['focus'] : []),
      ...(enrichDone ? ['enrich'] : []),
      ...(user.calcomBookingUrl ? ['calcom'] : []),
      ...manualDone.filter((s) => MANUAL_STEPS.includes(s)),
    ]

    // Deduplicate
    const completedSet = [...new Set(completed)]

    // Account age in days
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({ completed: completedSet, daysSinceCreation })
  } catch (error) {
    console.error('GET /api/user/onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/user/onboarding — mark a manual step as done
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { stepId } = await req.json()
    if (!stepId || !MANUAL_STEPS.includes(stepId)) {
      return NextResponse.json({ error: 'Invalid stepId' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { onboardingProgress: true },
    })

    let current: string[] = []
    try {
      current = JSON.parse(user?.onboardingProgress ?? '[]')
    } catch {
      current = []
    }

    if (!current.includes(stepId)) {
      current.push(stepId)
      await prisma.user.update({
        where: { id: session.userId },
        data: { onboardingProgress: JSON.stringify(current) },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/user/onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
