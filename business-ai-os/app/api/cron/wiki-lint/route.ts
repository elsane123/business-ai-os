/**
 * QW-3 — Cron: Wiki Lint hebdomadaire (lundi 9h UTC)
 * Protected by x-cron-secret header
 * Schedule: 0 9 * * 1 curl -X POST -H 'x-cron-secret: ...' http://localhost:50082/api/cron/wiki-lint
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import path from 'path'

const PYTHON_API = process.env.PYTHON_AGENT_URL ?? 'http://localhost:8000'
const CRON_SECRET = process.env.CRON_SECRET
const WIKI_BASE_PATH = path.join(process.cwd(), 'wiki-data')

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { processed: 0, errors: 0, totalCleaned: 0, totalBytesFreed: 0, details: [] as object[] }

  try {
    // Get all users with wiki data
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    })

    for (const user of users) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const resp = await fetch(`${PYTHON_API}/wiki/lint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            wiki_base_path: WIKI_BASE_PATH,
          }),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (resp.ok) {
          const data = await resp.json()
          results.processed++
          results.totalCleaned += data.pages_cleaned ?? 0
          results.totalBytesFreed += data.bytes_freed ?? 0
          if (data.pages_cleaned > 0) {
            results.details.push({
              userId: user.id,
              pagesChecked: data.pages_checked,
              pagesCleaned: data.pages_cleaned,
              bytesFreed: data.bytes_freed,
            })
          }
        } else {
          results.errors++
        }
      } catch (err) {
        results.errors++
        console.error(`[cron/wiki-lint] Error for user ${user.id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      date: new Date().toISOString(),
      totalUsers: users.length,
      ...results,
    })
  } catch (err) {
    console.error('[cron/wiki-lint] Fatal:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ status: 'ok', cron: 'wiki-lint', schedule: '0 9 * * 1' })
}
