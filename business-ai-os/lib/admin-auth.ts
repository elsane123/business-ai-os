import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Server Component guard — redirige vers /login si non admin
 * Usage: await requireAdmin()
 */
export async function requireAdmin() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true, isSuspended: true },
  })

  if (!user?.isAdmin || user.isSuspended) redirect('/dashboard')
}

/**
 * API Route guard — retourne 401/403 si non admin
 * Usage: const guard = await requireAdminApi(req); if (guard) return guard;
 */
export async function requireAdminApi(
  req: NextRequest
): Promise<NextResponse | null> {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true, isSuspended: true },
  })

  if (!user?.isAdmin || user.isSuspended) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}
