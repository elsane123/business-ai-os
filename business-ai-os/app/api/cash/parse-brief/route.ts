import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { chatCompletion } from '@/lib/openrouter'

/** Call chatCompletion with a hard timeout to prevent indefinite hanging */
async function chatCompletionWithTimeout(
  messages: Parameters<typeof chatCompletion>[0],
  options: Parameters<typeof chatCompletion>[1],
  timeoutMs = 20_000
): Promise<string> {
  return Promise.race([
    chatCompletion(messages, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('LLM request timed out')), timeoutMs)
    ),
  ])
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body || !body.brief?.trim()) {
      return NextResponse.json({ error: 'Le brief est requis' }, { status: 400 })
    }
    const { brief } = body

    const today = new Date().toISOString().split('T')[0]

    const prompt = `Tu es un assistant comptable. Analyse ce brief en langage naturel et extrait les informations d'une transaction financière.

Brief : "${brief.trim().slice(0, 500)}"

Date du jour : ${today}

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans explication) :
{
  "amount": nombre décimal positif (montant en euros, toujours positif),
  "type": "INCOME" ou "EXPENSE",
  "category": "l'une des catégories suivantes EXACTEMENT",
  "description": "description concise de la transaction (max 100 caractères)",
  "date": "date ISO YYYY-MM-DD"
}

Catégories disponibles (choisir la plus pertinente) :
- Facture client : paiement reçu d'un client, facture encaissée
- Freelances : paiement à un freelance, sous-traitant
- Logiciels & SaaS : abonnement logiciel, outil numérique, hébergement
- Marketing : publicité, communication, création de contenu
- Loyer/Hébergement : loyer bureau, hébergement serveur
- Comptabilité : expert-comptable, frais bancaires, assurance
- Formation : cours, formation professionnelle, conférence
- Salaires : salaire, charges salariales
- Autre : tout ce qui ne correspond pas aux catégories précédentes

Règles :
- INCOME = argent reçu (paiement client, remboursement, subvention)
- EXPENSE = argent dépensé (achat, abonnement, prestataire)
- Si TTC mentionné, garder le montant TTC
- Si date non précisée, utiliser aujourd'hui : ${today}
- Si "hier", calculer la date correspondante
- Si "lundi dernier" ou jour de semaine, calculer la date
- description : formuler en français, clair et professionnel`

    let raw: string
    try {
      raw = await chatCompletionWithTimeout(
        [{ role: 'user', content: prompt }],
        { temperature: 0.2, max_tokens: 512 },
        20_000
      )
    } catch (llmError: unknown) {
      const msg = llmError instanceof Error ? llmError.message : String(llmError)
      console.error('[parse-brief] LLM error:', msg)
      // Return a user-friendly error instead of HTTP 500
      if (msg.includes('timed out')) {
        return NextResponse.json(
          { error: 'Le service IA est temporairement lent. Réessayez dans quelques secondes.' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: 'Service IA indisponible. Réessayez dans quelques instants.' },
        { status: 503 }
      )
    }

    // Extract JSON from LLM response (may contain surrounding text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[parse-brief] No JSON in LLM response:', raw.slice(0, 200))
      return NextResponse.json(
        { error: 'Impossible de parser la réponse IA. Reformulez votre brief.' },
        { status: 422 }
      )
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      console.error('[parse-brief] JSON.parse failed:', jsonMatch[0].slice(0, 200))
      return NextResponse.json(
        { error: 'Réponse IA invalide. Reformulez votre brief.' },
        { status: 422 }
      )
    }

    const validCategories = [
      'Facture client', 'Freelances', 'Logiciels & SaaS', 'Marketing',
      'Loyer/Hébergement', 'Comptabilité', 'Formation', 'Salaires', 'Autre',
    ]

    const result = {
      amount:
        typeof parsed.amount === 'number' && parsed.amount > 0
          ? Math.round((parsed.amount as number) * 100) / 100
          : 0,
      type:
        parsed.type === 'INCOME' || parsed.type === 'EXPENSE'
          ? (parsed.type as string)
          : 'INCOME',
      category: validCategories.includes(parsed.category as string)
        ? (parsed.category as string)
        : 'Autre',
      description: String(parsed.description ?? '').slice(0, 100),
      date:
        typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
          ? parsed.date
          : today,
    }

    return NextResponse.json({ transaction: result })
  } catch (error) {
    console.error('[parse-brief] Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
