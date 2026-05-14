import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ingestWikiEvent } from '@/lib/wiki/ingest'

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

    const prospect = await prisma.prospect.create({
      data: {
        userId: session.userId,
        name,
        company: company || '',
        email: email || '',
        phone: phone || '',
        value: parseFloat(value || '0') || 0,
        status: status || 'IDENTIFIED',
        notes: notes || '',
        // Enrichissement
        siret: siret || null,
        linkedinUrl: linkedinUrl || null,
        position: position || null,
        enrichCity: enrichCity || null,
        enrichAddress: enrichAddress || null,
        enrichZip: enrichZip || null,
        employeeRange: employeeRange || null,
        nafCode: nafCode || null,
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

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (lastContactDate !== undefined) updateData.lastContactDate = new Date(lastContactDate)
    if (value !== undefined) updateData.value = parseFloat(value) || 0
    if (name !== undefined) updateData.name = name
    if (company !== undefined) updateData.company = company
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone

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
