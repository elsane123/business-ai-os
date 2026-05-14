import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { ingestWikiEvent } from '@/lib/wiki/ingest'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { eventType, data } = body

    await ingestWikiEvent(session.userId, eventType, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[wiki/ingest] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
