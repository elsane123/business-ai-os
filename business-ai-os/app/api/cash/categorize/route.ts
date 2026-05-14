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

    const { description, type } = await request.json()
    if (!description || description.trim().length < 3) {
      return NextResponse.json({ category: null })
    }

    const prompt = `Tu es un assistant de comptabilité pour une entreprise française.
À partir de cette description de transaction (type: ${type === 'INCOME' ? 'revenu' : 'dépense'}), choisis la catégorie la plus appropriée.

Description: "${description.trim()}"

Catégories disponibles (choisir UNE SEULE, exactement comme écrite):
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Réponds UNIQUEMENT avec le nom exact de la catégorie, sans ponctuation ni explication.`

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        max_tokens: 30,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return NextResponse.json({ category: null })

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() || ''

    // Find exact match or partial match
    const exact = CATEGORIES.find(c => c.toLowerCase() === raw.toLowerCase())
    const partial = CATEGORIES.find(c =>
      raw.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(raw.toLowerCase())
    )

    const category = exact || partial || null
    return NextResponse.json({ category })
  } catch (error) {
    console.error('[cash/categorize]', error)
    return NextResponse.json({ category: null })
  }
}
