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

    const today = new Date().toISOString().split('T')[0]

    const prompt = `Tu es un assistant comptable. Analyse ce brief en langage naturel et extrait les informations d'une transaction financière.

Brief : "${brief.trim()}"

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

    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 512 }
    )

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Impossible de parser la réponse IA' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    const validCategories = [
      'Facture client', 'Freelances', 'Logiciels & SaaS', 'Marketing',
      'Loyer/Hébergement', 'Comptabilité', 'Formation', 'Salaires', 'Autre'
    ]

    const result = {
      amount: typeof parsed.amount === 'number' && parsed.amount > 0
        ? Math.round(parsed.amount * 100) / 100
        : 0,
      type: parsed.type === 'INCOME' || parsed.type === 'EXPENSE' ? parsed.type : 'INCOME',
      category: validCategories.includes(parsed.category) ? parsed.category : 'Autre',
      description: String(parsed.description || '').slice(0, 100),
      date: parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : today,
    }

    return NextResponse.json({ transaction: result })
  } catch (error) {
    console.error('POST /api/cash/parse-brief error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
