import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET: check if token is configured
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { linkedinAccessToken: true },
    })
    return NextResponse.json({ configured: !!user?.linkedinAccessToken })
  } catch (error) {
    console.error('[user/linkedin-token GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// POST: save token
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    const body = await req.json()
    const token: string = (body.token ?? '').trim()
    if (!token) return NextResponse.json({ error: 'Token requis' }, { status: 400 })
    await prisma.user.update({
      where: { id: session.userId },
      data: { linkedinAccessToken: token },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[user/linkedin-token POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// DELETE: remove token
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    await prisma.user.update({
      where: { id: session.userId },
      data: { linkedinAccessToken: null },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[user/linkedin-token DELETE]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
