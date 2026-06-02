import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAgentContext } from '@/lib/agents-context'
import { chatCompletion } from '@/lib/openrouter'

interface EmailStep {
  day: number
  subject: string
  body: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }
    const userId = session.userId

    const body = await req.json()
    const prospectName: string = (body.prospectName ?? '').trim()
    const company: string = (body.company ?? '').trim()
    const sector: string = (body.sector ?? '').trim()
    const tone: string = body.tone ?? 'professionnel'

    if (!prospectName) {
      return NextResponse.json({ error: 'Nom du prospect requis' }, { status: 400 })
    }

    const context = await getAgentContext('agent-cro', userId)
    const systemPrompt = `Tu es le CRO Agent de Brainlo, expert en acquisition client B2B et cold email.\n\n${context}`

    const toneLabel = tone === 'casual' ? 'decontracte et chaleureux' : tone === 'direct' ? 'direct et concis' : 'professionnel et expert'

    const userPrompt = `Genere une sequence de 5 emails de prospection pour ce prospect:\n- Prenom/Nom: ${prospectName}\n- Entreprise: ${company || 'non precise'}\n- Secteur: ${sector || 'non precise'}\n- Ton souhaite: ${toneLabel}\n\nDelais: Jour 1, Jour 3, Jour 7, Jour 14, Jour 21.\nEmail 1: introduction et valeur, Email 5: dernier contact.\n\nReponds UNIQUEMENT avec ce JSON valide:\n{\n  "sequence": [\n    { "day": 1, "subject": "Objet email", "body": "Corps de l'email" },\n    { "day": 3, "subject": "Objet email", "body": "Corps de l'email" },\n    { "day": 7, "subject": "Objet email", "body": "Corps de l'email" },\n    { "day": 14, "subject": "Objet email", "body": "Corps de l'email" },\n    { "day": 21, "subject": "Objet email", "body": "Corps de l'email" }\n  ]\n}`

    const raw = await chatCompletion(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { temperature: 0.5, track: { userId, feature: 'cold-email-sequence' } }
    )

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as { sequence: EmailStep[] }

    return NextResponse.json({ sequence: parsed.sequence })
  } catch (error) {
    console.error('[cold-email/generate]', error)
    return NextResponse.json({ error: 'Erreur generation sequence email' }, { status: 500 })
  }
}
