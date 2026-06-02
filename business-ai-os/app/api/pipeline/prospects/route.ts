import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ingestWikiEvent } from '@/lib/wiki/ingest'
import { sanitizeText, sanitizeEmail, sanitizeUrl, sanitizePhone } from '@/lib/sanitize'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const prospects = await prisma.prospect.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        relances: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({ prospects })
  } catch (error) {
    console.error('[pipeline/prospects GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { name, company, email, value, status, notes, phone,
            siret, linkedinUrl, position, enrichCity, enrichAddress, enrichZip, employeeRange, nafCode } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    // ── Plan enforcement: FREE plan limited to 3 prospects ────────────────────
    const sessionUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true },
    })
    if (sessionUser?.plan === 'FREE') {
      const count = await prisma.prospect.count({ where: { userId: session.userId } })
      if (count >= 3) {
        return NextResponse.json(
          { error: 'Limite de 3 prospects atteinte sur le plan gratuit', upgradeRequired: true },
          { status: 402 }
        )
      }
    }

    // ── BUG-07: Sanitize all user-supplied text fields against stored XSS ────
    const prospect = await prisma.prospect.create({
      data: {
        userId: session.userId,
        name: sanitizeText(name, 200),
        company: sanitizeText(company, 200),
        email: sanitizeEmail(email),
        phone: sanitizePhone(phone),
        value: parseFloat(value || '0') || 0,
        status: status || 'IDENTIFIED',
        notes: sanitizeText(notes, 5000),
        // Enrichissement
        siret: siret ? sanitizeText(siret, 20) : null,
        linkedinUrl: sanitizeUrl(linkedinUrl),
        position: position ? sanitizeText(position, 200) : null,
        enrichCity: enrichCity ? sanitizeText(enrichCity, 100) : null,
        enrichAddress: enrichAddress ? sanitizeText(enrichAddress, 300) : null,
        enrichZip: enrichZip ? sanitizeText(enrichZip, 20) : null,
        employeeRange: employeeRange ? sanitizeText(employeeRange, 50) : null,
        nafCode: nafCode ? sanitizeText(nafCode, 20) : null,
      },
    })

    try {
      await ingestWikiEvent(session.userId, 'prospect_created', {
        name,
        company,
        value,
        status,
      })
    } catch (_) {
      // wiki ingest optional — ignore silently
    }

    return NextResponse.json({ prospect }, { status: 201 })
  } catch (error) {
    console.error('[pipeline/prospects POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, notes, lastContactDate, value, name, company, email, phone } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.prospect.findFirst({
      where: { id, userId: session.userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })
    }

    // ── BUG-07: Sanitize user-supplied fields against stored XSS ───────────
    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = sanitizeText(notes, 5000)
    if (lastContactDate !== undefined) updateData.lastContactDate = new Date(lastContactDate)
    if (value !== undefined) updateData.value = parseFloat(value) || 0
    if (name !== undefined) updateData.name = sanitizeText(name, 200)
    if (company !== undefined) updateData.company = sanitizeText(company, 200)
    if (email !== undefined) updateData.email = sanitizeEmail(email)
    if (phone !== undefined) updateData.phone = sanitizePhone(phone)

    const prospect = await prisma.prospect.update({
      where: { id },
      data: updateData,
    })

    try {
      await ingestWikiEvent(session.userId, 'prospect_updated', {
        name: prospect.name,
        company: prospect.company,
        status: prospect.status,
        value: prospect.value,
      })
    } catch (_) {
      // wiki ingest optional — ignore silently
    }

    return NextResponse.json({ prospect })
  } catch (error) {
    console.error('[pipeline/prospects PATCH]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    // Verify ownership
    const prospect = await prisma.prospect.findFirst({
      where: { id, userId: session.userId },
    })

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })
    }

    // Delete related relances first (cascading)
    await prisma.relance.deleteMany({ where: { prospectId: id } })
    await prisma.prospect.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[pipeline/prospects DELETE]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
