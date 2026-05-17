import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ingestWikiEvent } from '@/lib/wiki/ingest'
import { sanitizeText, sanitizeEmail, sanitizePhone } from '@/lib/sanitize'

type RouteContext = { params: { id: string } }

// ── PATCH /api/pipeline/prospects/:id ────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const id = params.id
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

    const body = await request.json()
    const {
      status, notes, lastContactDate, value,
      name, company, email, phone,
      lostReason, linkedinUrl, position,
      siret, enrichCity, enrichAddress, enrichZip, employeeRange, nafCode,
    } = body

    const updateData: Record<string, unknown> = {}
    if (status !== undefined)           updateData.status = status
    if (notes !== undefined)            updateData.notes = sanitizeText(notes, 5000)
    if (lastContactDate !== undefined)  updateData.lastContactDate = new Date(lastContactDate)
    if (value !== undefined)            updateData.value = parseFloat(value) || 0
    if (name !== undefined)             updateData.name = sanitizeText(name, 200)
    if (company !== undefined)          updateData.company = sanitizeText(company, 200)
    if (email !== undefined)            updateData.email = sanitizeEmail(email)
    if (phone !== undefined)            updateData.phone = sanitizePhone(phone)
    if (lostReason !== undefined)       updateData.lostReason = sanitizeText(lostReason, 500)
    if (linkedinUrl !== undefined)      updateData.linkedinUrl = linkedinUrl || null
    if (position !== undefined)         updateData.position = position ? sanitizeText(position, 200) : null
    if (siret !== undefined)            updateData.siret = siret ? sanitizeText(siret, 20) : null
    if (enrichCity !== undefined)       updateData.enrichCity = enrichCity ? sanitizeText(enrichCity, 100) : null
    if (enrichAddress !== undefined)    updateData.enrichAddress = enrichAddress ? sanitizeText(enrichAddress, 300) : null
    if (enrichZip !== undefined)        updateData.enrichZip = enrichZip ? sanitizeText(enrichZip, 20) : null
    if (employeeRange !== undefined)    updateData.employeeRange = employeeRange ? sanitizeText(employeeRange, 50) : null
    if (nafCode !== undefined)          updateData.nafCode = nafCode ? sanitizeText(nafCode, 20) : null

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
    } catch (_) { /* wiki ingest optional */ }

    return NextResponse.json({ prospect })
  } catch (error) {
    console.error('[pipeline/prospects/:id PATCH]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// ── DELETE /api/pipeline/prospects/:id ───────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const id = params.id
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

    // Delete related relances first (cascade)
    await prisma.relance.deleteMany({ where: { prospectId: id } })
    await prisma.prospect.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[pipeline/prospects/:id DELETE]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
