import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { chatCompletion } from '@/lib/openrouter'
import { prisma } from '@/lib/db'
import { writeBrainFromEnrichment } from '@/lib/wiki/brain-writer'

// Escapes control characters inside JSON string values (LLM sometimes emits literal newlines)
function sanitizeJsonStrings(input: string): string {
  let inString = false
  let escaped = false
  let result = ''
  for (const char of input) {
    if (escaped) {
      result += char
      escaped = false
      continue
    }
    if (char === '\\' && inString) {
      escaped = true
      result += char
      continue
    }
    if (char === '"') {
      inString = !inString
      result += char
      continue
    }
    if (inString && char.charCodeAt(0) < 32) {
      result += JSON.stringify(char).slice(1, -1)
      continue
    }
    result += char
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { answers } = await req.json() as {
      answers: {
        whatYouSell: string
        whoYouSellTo: string
        mainProblem: string
        priceRange: string
        geography: string
      }
    }

    const prompt = `Tu es un expert en stratégie commerciale pour solopreneurs et PME.
À partir des réponses ci-dessous, génère les champs du profil business en JSON.

Réponses de l'entrepreneur :
- Ce qu'il vend : ${answers.whatYouSell}
- À qui il vend : ${answers.whoYouSellTo}
- Problème principal résolu : ${answers.mainProblem}
- Panier moyen : ${answers.priceRange}
- Zone géographique : ${answers.geography}

Génère exactement ce JSON (sans markdown, juste le JSON brut) :
{
  "offerType": "mission|retainer|product|formation|mixed",
  "offerDescription": "description concise de l'offre principale (max 200 caractères)",
  "priceRange": "<1k|1k-5k|5k-15k|15k+",
  "typicalDuration": "day|week|month|months",
  "targetClient": "description précise du client idéal avec taille, secteur, budget (max 200 caractères)",
  "clientPainPoint": "problème principal que l'entrepreneur résout (max 150 caractères)",
  "valueProposition": "proposition de valeur en 1 phrase percutante (max 120 caractères)",
  "competitors": "2-4 concurrents ou alternatives typiques séparés par des virgules",
  "differentiator": "différenciateur principal en quelques mots (max 80 caractères)",
  "targetGeography": "local|national|europe|international",
  "workLanguages": "fr|en|fr+en|other",
  "briefContent": "brief commercial complet de 400-600 mots incluant : présentation, offres, clients cibles, valeur ajoutée, objectifs"
}

Règles :
- Utilise le tutoiement dans les textes
- Sois concret et business-oriented
- Pour offerType, déduis-le du contexte (retainer si abonnement mensuel, mission si projet ponctuel, etc.)
- Pour priceRange, utilise la valeur fournie par l'utilisateur
- Pour targetGeography, utilise la valeur fournie par l'utilisateur
- Le briefContent doit sonner authentique et professionnel, rédigé à la première personne`

    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      {
        temperature: 0.7,
        max_tokens: 1500,
        track: { userId: session.userId, feature: 'brain-wizard' },
      }
    )

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid AI response format')

    // Sanitize control characters inside JSON string values (LLM sometimes emits literal \n in strings)
    const sanitizedJson = sanitizeJsonStrings(jsonMatch[0])
    const enrichment = JSON.parse(sanitizedJson)

    // Sync BRAIN.md with enrichment data (silent — never blocks the response)
    try {
      const userData = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { businessName: true, sector: true, monthlyGoal: true },
      })
      writeBrainFromEnrichment(session.userId, enrichment, userData ?? {})
    } catch (brainErr) {
      console.warn('[brain-wizard] BRAIN.md sync failed (non-blocking):', brainErr)
    }

    return NextResponse.json({ ok: true, enrichment })
  } catch (error) {
    console.error('POST /api/user/brain-wizard error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
