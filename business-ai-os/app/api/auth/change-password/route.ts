import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    if (newPassword.length < 8)
      return NextResponse.json({ error: 'Le mot de passe doit faire au moins 8 caractères' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })

    const hash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: hash },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[change-password PATCH]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
