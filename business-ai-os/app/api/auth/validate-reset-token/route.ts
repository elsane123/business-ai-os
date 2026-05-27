import { NextRequest, NextResponse } from 'next/server'
import { validateResetToken } from '@/lib/reset-tokens'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const email = validateResetToken(token)
  return NextResponse.json({ valid: email !== null })
}
