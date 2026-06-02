import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAgentContext } from '@/lib/agents-context'
import { chatCompletion } from '@/lib/openrouter'
import { getUserWikiPath } from '@/lib/wiki/reader'

interface ICPResult {
  sector: string
  companySize: string
  decisionMaker: string
  painPoint: string
  confidence: 'high' | 'medium' | 'low'
}

interface ProspectScore {
  prospectId: string
  score: number
  reason: string
}

function updateBrainICP(userId: string, icp: ICPResult): void {
  const wikiPath = getUserWikiPath(userId)
  const brainFile = path.join(wikiPath, 'BRAIN.md')
  let content = ''
  if (fs.existsSync(brainFile)) {
    content = fs.readFileSync(brainFile, 'utf-8')
  }
  const icpSection = [
    '## Profil Client Ideal (ICP)',
    `- **Secteur cible**: ${icp.sector}`,
    `- **Taille entreprise**: ${icp.companySize}`,
    `- **Persona decideur**: ${icp.decisionMaker}`,
    `- **Probleme principal resolu**: ${icp.painPoint}`,
    `- **Confiance ICP**: ${icp.confidence}`,
  ].join('\n')
  if (content.includes('## Profil Client')) {
    content = content.replace(/## Profil Client[\s\S]*?(?=\n## |$)/, icpSection + '\n')
  } else {
    content = content.trimEnd() + '\n\n' + icpSection + '\n'
  }
  fs.mkdirSync(wikiPath, { recursive: true })
  fs.writeFileSync(brainFile, content, 'utf-8')
}

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }
    const userId = session.userId

    const prospects = await prisma.prospect.findMany({
      where: { userId },
      select: { id: true, name: true, company: true, value: true, status: true, notes: true },
      orderBy: { createdAt: 'desc' },
    })

    const wonProspects = prospects.filter(p => p.status === 'WON')
    const allProspects = prospects.filter(p => p.status !== 'LOST')
    const lowConfidence = wonProspects.length === 0

    const context = await getAgentContext('agent-cro', userId)
    const systemPrompt = `Tu es le CRO Agent de Brainlo, expert en acquisition client B2B.\n\n${context}`

    const wonList = wonProspects.length === 0
      ? '(aucun)'
      : wonProspects.map(p => `- ${p.name}${p.company ? ` (${p.company})` : ''} — ${p.value}EUR`).join('\n')

    const allList = allProspects.length === 0
      ? '(aucun)'
      : allProspects.map(p => `- ID:${p.id} | ${p.name}${p.company ? ` (${p.company})` : ''} | ${p.value}EUR | ${p.status}${p.notes ? ` | ${p.notes}` : ''}`).join('\n')

    const lowNote = lowConfidence
      ? 'Aucun deal gagne — genere un ICP hypothetique base sur le Business Brain (confidence: low).\n\n'
      : ''

    const userPrompt = `Genere l'ICP et un score de closing (0-100) pour chaque prospect actif.\n\n${lowNote}Deals gagnes:\n${wonList}\n\nProspects actifs:\n${allList}\n\nReponds UNIQUEMENT avec ce JSON:\n{\n  "icp": {\n    "sector": "secteur cible",\n    "companySize": "ex: TPE 1-10, PME 10-50",\n    "decisionMaker": "ex: CEO, DAF",\n    "painPoint": "probleme en 1 phrase",\n    "confidence": "high|medium|low"\n  },\n  "prospectScores": [\n    { "prospectId": "id", "score": 75, "reason": "raison courte" }\n  ]\n}`

    const raw = await chatCompletion(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { temperature: 0.3, track: { userId, feature: 'icp-builder' } }
    )

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as { icp: ICPResult; prospectScores: ProspectScore[] }

    updateBrainICP(userId, parsed.icp)

    return NextResponse.json({ icp: parsed.icp, prospectScores: parsed.prospectScores, lowConfidence })
  } catch (error) {
    console.error('[pipeline/icp/generate]', error)
    return NextResponse.json({ error: 'Erreur generation ICP' }, { status: 500 })
  }
}
