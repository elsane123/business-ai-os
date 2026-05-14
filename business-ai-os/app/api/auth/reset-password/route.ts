
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Aucun compte trouvé avec cet email' }, { status: 404 })
    }
    const hash = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { email }, data: { passwordHash: hash } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[reset-password]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
