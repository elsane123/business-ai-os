import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { buildWikiContext } from '@/lib/wiki/reader'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { query } = body

    const context = await buildWikiContext(session.userId, query)

    // Try to enrich context via Python microservice (silent fallback)
    let enrichedResults: unknown[] = []
    try {
      const pythonRes = await fetch('http://localhost:8000/wiki/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.userId, query }),
      })
      if (pythonRes.ok) {
        const pythonData = await pythonRes.json()
        enrichedResults = pythonData.results ?? []
      }
    } catch {
      // Silent fallback — Python service may not be available
    }

    return NextResponse.json({ context, results: enrichedResults })
  } catch (error) {
    console.error('[wiki/query] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
