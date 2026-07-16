import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// ─── GET — récupérer le profil ────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true, email: true, name: true,
        businessName: true, sector: true,
        monthlyGoal: true, fixedCharges: true,
        linkedinUrl: true, plan: true, createdAt: true,
        legalName: true, address: true, zipCode: true,
        city: true, country: true, siret: true,
        legalForm: true, vatNumber: true, shareCapital: true,
        paymentTerms: true, invoiceFooter: true,
        calcomWebhookSecret: true,
        calcomBookingUrl: true,
      },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('[profile GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// ─── PATCH — mettre à jour le profil ─────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const { name, businessName, sector, monthlyGoal, fixedCharges, linkedinUrl,
      legalName, address, zipCode, city, country, siret, legalForm,
      vatNumber, shareCapital, paymentTerms, invoiceFooter,
      calcomWebhookSecret, calcomBookingUrl } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined)         updateData.name = String(name).trim()
    if (businessName !== undefined) updateData.businessName = String(businessName).trim()
    if (sector !== undefined)       updateData.sector = String(sector).trim()
    if (monthlyGoal !== undefined) {
      const goalVal = parseFloat(monthlyGoal)
      if (isNaN(goalVal) || goalVal < 0) return NextResponse.json({ error: 'Objectif CA invalide : doit être un nombre positif.' }, { status: 400 })
      updateData.monthlyGoal = goalVal
    }
    if (fixedCharges !== undefined) {
      const chargesVal = parseFloat(fixedCharges)
      if (isNaN(chargesVal) || chargesVal < 0) return NextResponse.json({ error: 'Charges fixes invalides : doit être un nombre positif.' }, { status: 400 })
      updateData.fixedCharges = chargesVal
    }
    if (linkedinUrl !== undefined) {
      const urlTrimmed = String(linkedinUrl).trim()
      if (urlTrimmed !== '' && !/^https?:\/\/(www\.)?linkedin\.com\/.+/.test(urlTrimmed)) {
        return NextResponse.json({ error: 'URL LinkedIn invalide. Format attendu : https://www.linkedin.com/in/votre-profil' }, { status: 400 })
      }
      updateData.linkedinUrl = urlTrimmed
    }
    if (legalName !== undefined)     updateData.legalName = String(legalName).trim()
    if (address !== undefined)       updateData.address = String(address).trim()
    if (zipCode !== undefined)       updateData.zipCode = String(zipCode).trim()
    if (city !== undefined)          updateData.city = String(city).trim()
    if (country !== undefined)       updateData.country = String(country).trim()
    if (siret !== undefined) {
      const cleanedSiret = String(siret).replace(/\s/g, '')
      if (cleanedSiret !== '' && !/^\d{14}$/.test(cleanedSiret)) {
        return NextResponse.json(
          { error: 'Format SIRET invalide. Le SIRET doit contenir exactement 14 chiffres.' },
          { status: 400 }
        )
      }
      updateData.siret = cleanedSiret
    }
    if (legalForm !== undefined)     updateData.legalForm = String(legalForm).trim()
    if (vatNumber !== undefined)     updateData.vatNumber = String(vatNumber).trim()
    if (shareCapital !== undefined)  updateData.shareCapital = String(shareCapital).trim()
    if (paymentTerms !== undefined)  updateData.paymentTerms = parseInt(paymentTerms) || 30
    if (invoiceFooter !== undefined) updateData.invoiceFooter = String(invoiceFooter).trim()
    if (calcomWebhookSecret !== undefined) updateData.calcomWebhookSecret = String(calcomWebhookSecret).trim()
    if (calcomBookingUrl !== undefined)    updateData.calcomBookingUrl = String(calcomBookingUrl).trim()

    if (Object.keys(updateData).length === 0)
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true, email: true, name: true,
        businessName: true, sector: true,
        monthlyGoal: true, fixedCharges: true,
        linkedinUrl: true, plan: true,
      },
    })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('[profile PATCH]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
