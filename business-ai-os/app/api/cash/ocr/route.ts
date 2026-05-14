import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const CATEGORIES = [
  'Facture client', 'Freelances', 'Logiciels & SaaS', 'Marketing',
  'Loyer/Hébergement', 'Comptabilité', 'Formation', 'Salaires', 'Autre',
]

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const { imageBase64, mimeType } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const prompt = `Tu es un assistant qui extrait les données d'un ticket de caisse ou d'une facture.

Analyse cette image et extrais les informations suivantes en JSON strict :
- amount : montant total TTC en nombre (ex: 89.90)
- type : "EXPENSE" (dépense) ou "INCOME" (revenu)
- category : une des catégories suivantes exactement : ${CATEGORIES.join(', ')}
- description : courte description de la transaction (max 60 caractères)
- date : date de la transaction au format YYYY-MM-DD (si non visible, utilise ${today})

Réponds UNIQUEMENT avec le JSON, sans markdown, sans explication.
Exemple: {"amount":42.50,"type":"EXPENSE","category":"Logiciels & SaaS","description":"Abonnement Adobe CC","date":"${today}"}`

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:50082',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
              },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[cash/ocr] OpenRouter error:', err)
      return NextResponse.json({ error: 'Erreur LLM Vision' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() || '{}'

    // Clean potential markdown fences
    const cleaned = raw.replace(/```json\n?/gi, '').replace(/```/g, '').trim()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('[cash/ocr] JSON parse error:', cleaned)
      return NextResponse.json({ error: 'Impossible d\'analyser le ticket' }, { status: 422 })
    }

    // Validate and sanitize
    const amount = Math.abs(parseFloat(String(parsed.amount || '0')))
    const type = parsed.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
    const category = CATEGORIES.includes(String(parsed.category)) ? String(parsed.category) : 'Autre'
    const description = String(parsed.description || '').slice(0, 100)
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.date)) ? String(parsed.date) : today

    return NextResponse.json({ amount, type, category, description, date })
  } catch (error) {
    console.error('[cash/ocr]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
