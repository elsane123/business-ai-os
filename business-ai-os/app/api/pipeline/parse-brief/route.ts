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

    const prompt = `Tu es un assistant commercial qui analyse un brief en langage naturel et extrait les informations d'un prospect commercial.

Brief : "${brief.trim()}"

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans explication) :
{
  "name": "prénom et nom du contact (obligatoire, si inconnu mettre 'Contact à qualifier')",
  "company": "nom de l'entreprise ou null",
  "email": "email si mentionné ou null",
  "phone": "téléphone si mentionné ou null",
  "value": nombre entier représentant la valeur estimée du deal en euros (0 si inconnue),
  "status": "l'un de : IDENTIFIED | CONTACTED | INTERESTED | PROPOSAL",
  "notes": "résumé contextuel utile pour la relance : besoin, contexte, prochaine étape ou null"
}

Règles de statut :
- IDENTIFIED : prospect repéré, pas encore contacté
- CONTACTED : déjà contacté, en attente de réponse
- INTERESTED : a montré de l'intérêt, échange en cours
- PROPOSAL : devis ou proposition envoyée

Règles de valeur :
- Extraire les montants explicites mentionnés (ex: "contrat 5000€" → 5000)
- Si une fourchette est mentionnée, prendre la valeur médiane
- Si aucun montant : 0`

    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 512 }
    )

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Impossible de parser la réponse IA' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    const validStatuses = ['IDENTIFIED', 'CONTACTED', 'INTERESTED', 'PROPOSAL']

    const result = {
      name: String(parsed.name || 'Contact à qualifier').slice(0, 100),
      company: parsed.company ? String(parsed.company).slice(0, 100) : '',
      email: parsed.email ? String(parsed.email).slice(0, 100) : '',
      phone: parsed.phone ? String(parsed.phone).slice(0, 50) : '',
      value: typeof parsed.value === 'number' ? Math.max(0, Math.round(parsed.value)) : 0,
      status: validStatuses.includes(parsed.status) ? parsed.status : 'IDENTIFIED',
      notes: parsed.notes ? String(parsed.notes).slice(0, 500) : '',
    }

    return NextResponse.json({ prospect: result })
  } catch (error) {
    console.error('POST /api/pipeline/parse-brief error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
