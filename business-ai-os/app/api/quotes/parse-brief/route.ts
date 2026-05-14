import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { chatCompletion } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brief } = await req.json()
    if (!brief?.trim()) {
      return NextResponse.json({ error: 'Le brief est requis' }, { status: 400 })
    }

    const prompt = `Tu es un assistant commercial expert en facturation française. Analyse ce brief en langage naturel et extrait les informations pour créer un devis.

Brief : "${brief.trim()}"

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans explication) :
{
  "clientName": "nom du client ou société (obligatoire)",
  "clientAddress": "adresse rue ou null",
  "clientZip": "code postal ou null",
  "clientCity": "ville ou null",
  "clientSiret": "numéro SIRET si mentionné ou null",
  "clientEmail": "email si mentionné ou null",
  "validDays": nombre entier parmi 14|30|45|60 (délai de validité, défaut 30),
  "notes": "notes ou conditions particulières ou null",
  "lines": [
    {
      "title": "intitulé de la prestation",
      "description": "description optionnelle ou null",
      "qty": nombre décimal (quantité, défaut 1),
      "unitPrice": nombre décimal (prix unitaire HT en euros),
      "vatRate": nombre entier parmi 0|10|20 (taux TVA, défaut 20)
    }
  ]
}

Règles importantes :
- Toujours créer au moins une ligne de prestation
- Si plusieurs prestations distinctes sont mentionnées, créer une ligne par prestation
- Les prix sont TOUJOURS HT (hors taxe) sauf si explicitement "TTC"
- Si un prix TTC est donné avec TVA 20%, diviser par 1.20 pour obtenir le HT
- vatRate 0 = exonéré TVA (micro-entrepreneur), 10 = taux réduit, 20 = taux normal
- Si le brief mentionne "auto-entrepreneur" ou "micro-entrepreneur" sans préciser la TVA, mettre vatRate à 0
- qty peut être en heures, jours, unités (ex: "3 jours" → qty: 3)
- clientName doit être le nom du CLIENT (celui qui reçoit la facture), pas le prestataire`

    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 1024 }
    )

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Impossible de parser la réponse IA' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    const validVatRates = [0, 10, 20]
    const validDaysOptions = [14, 30, 45, 60]

    const lines = Array.isArray(parsed.lines) && parsed.lines.length > 0
      ? parsed.lines.map((l: Record<string, unknown>) => ({
          title: String(l.title || '').slice(0, 200),
          description: l.description ? String(l.description).slice(0, 300) : undefined,
          qty: typeof l.qty === 'number' && l.qty > 0 ? l.qty : 1,
          unitPrice: typeof l.unitPrice === 'number' && l.unitPrice >= 0 ? Math.round(l.unitPrice * 100) / 100 : 0,
          vatRate: validVatRates.includes(l.vatRate as number) ? l.vatRate : 20,
          unit: l.unit ? String(l.unit) : undefined,
        }))
      : [{ title: '', qty: 1, unitPrice: 0, vatRate: 20 }]

    const result = {
      clientName: String(parsed.clientName || '').slice(0, 100),
      clientAddress: parsed.clientAddress ? String(parsed.clientAddress).slice(0, 200) : '',
      clientZip: parsed.clientZip ? String(parsed.clientZip).slice(0, 10) : '',
      clientCity: parsed.clientCity ? String(parsed.clientCity).slice(0, 100) : '',
      clientSiret: parsed.clientSiret ? String(parsed.clientSiret).slice(0, 20) : '',
      clientEmail: parsed.clientEmail ? String(parsed.clientEmail).slice(0, 100) : '',
      validDays: validDaysOptions.includes(parsed.validDays) ? parsed.validDays : 30,
      notes: parsed.notes ? String(parsed.notes).slice(0, 500) : '',
      lines,
    }

    return NextResponse.json({ quote: result })
  } catch (error) {
    console.error('POST /api/quotes/parse-brief error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
