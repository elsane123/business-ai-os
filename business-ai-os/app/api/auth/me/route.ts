import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, plan: true, businessName: true, sector: true, monthlyGoal: true, fixedCharges: true }
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('[auth/me]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
