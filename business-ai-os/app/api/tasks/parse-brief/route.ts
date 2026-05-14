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

    const prompt = `Tu es un assistant qui analyse un brief en langage naturel et extrait les informations d'une tâche professionnelle.

Brief : "${brief.trim()}"

Date du jour : ${today}

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans explication) :
{
  "title": "titre concis de la tâche (max 80 caractères)",
  "description": "description optionnelle avec contexte supplémentaire ou null",
  "category": "l'une de : CASH | CLIENTS | VISIBILITY | ADMIN | AUTRE",
  "estimatedMinutes": nombre entier parmi 5|15|30|60|120 ou null,
  "dueDate": "date ISO YYYY-MM-DD si mentionnée ou null",
  "priority": "HIGH | MEDIUM | LOW"
}

Règles de catégorisation :
- CASH : facturation, paiement, relance, trésorerie, devis, argent
- CLIENTS : prospects, réunion client, appel, proposition, onboarding
- VISIBILITY : réseaux sociaux, contenu, article, LinkedIn, marketing
- ADMIN : administratif, comptabilité, contrat, RH, outil, configuration
- AUTRE : tout ce qui ne rentre pas dans les catégories précédentes

Règles de priorité :
- HIGH : urgent, aujourd'hui, demain, deadlines proches, client qui attend
- MEDIUM : cette semaine, important mais pas urgent
- LOW : quand possible, pas de deadline précise`

    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 512 }
    )

    // Parse JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Impossible de parser la réponse IA' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate and sanitize
    const validCategories = ['CASH', 'CLIENTS', 'VISIBILITY', 'ADMIN', 'AUTRE']
    const validPriorities = ['HIGH', 'MEDIUM', 'LOW']
    const validDurations = [5, 15, 30, 60, 120]

    const result = {
      title: String(parsed.title || '').slice(0, 80),
      description: parsed.description ? String(parsed.description) : null,
      category: validCategories.includes(parsed.category) ? parsed.category : 'AUTRE',
      estimatedMinutes: validDurations.includes(parsed.estimatedMinutes) ? parsed.estimatedMinutes : null,
      dueDate: parsed.dueDate || null,
      priority: validPriorities.includes(parsed.priority) ? parsed.priority : 'MEDIUM',
    }

    return NextResponse.json({ task: result })
  } catch (error) {
    console.error('POST /api/tasks/parse-brief error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
