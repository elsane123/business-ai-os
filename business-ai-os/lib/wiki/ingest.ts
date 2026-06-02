import { writeWikiPage, appendToLog, upsertWikiSection, ensureUserWikiExists } from './writer'
import { readWikiPage } from './reader'
import { chatCompletion } from '../openrouter'

// Re-exports for API route compatibility
export { ensureUserWikiExists } from './writer'

// Wrapper function: ingestWikiEvent(userId, eventType, data)
export async function ingestWikiEvent(
  userId: string,
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  const validTypes = ['prospect_created','prospect_updated','transaction_added','message_sent','post_published','free_text']
  const type = validTypes.includes(eventType)
    ? eventType as IngestEvent['type']
    : 'free_text'
  await ingestEvent({ type, userId, data })
}


export interface IngestEvent {
  type: 'prospect_created' | 'prospect_updated' | 'transaction_added' | 'message_sent' | 'post_published' | 'free_text'
  userId: string
  data: Record<string, unknown>
}

export async function ingestEvent(event: IngestEvent): Promise<void> {
  switch (event.type) {
    case 'prospect_created':
    case 'prospect_updated':
      await ingestProspect(event)
      break
    case 'transaction_added':
      await ingestTransaction(event)
      break
    case 'post_published':
      await ingestPost(event)
      break
    case 'free_text':
      await ingestFreeText(event)
      break
    default:
      appendToLog(event.userId, event.type, JSON.stringify(event.data, null, 2))
  }
}

async function ingestProspect(event: IngestEvent): Promise<void> {
  const { userId, data } = event
  const { name, company, status, value, notes, email } = data as {
    name: string; company: string; status: string
    value: number; notes: string; email: string
  }

  const slug = toSlug(`${company || name}`)
  const existingContent = readWikiPage(userId, `prospects/${slug}`) ?? ''
  const brain = readWikiPage(userId, 'BRAIN') ?? ''

  const prompt = existingContent
    ? `Tu maintiens le wiki business d'un entrepreneur. Voici la page prospect existante:\n\n${existingContent}\n\nMet à jour cette page avec les nouvelles informations:\n- Statut: ${status}\n- Valeur: ${value}€\n- Notes: ${notes ?? 'aucune'}\n\nRetourne UNIQUEMENT le contenu markdown mis à jour, sans explication.`
    : `Tu crées une nouvelle page prospect pour le wiki business.\n\nContexte entreprise:\n${brain.slice(0, 500)}\n\nInformations prospect:\n- Nom: ${name}\n- Entreprise: ${company ?? 'N/A'}\n- Email: ${email ?? 'N/A'}\n- Statut: ${status}\n- Valeur estimée: ${value}€\n- Notes: ${notes ?? 'aucune'}\n\nCrée une page markdown structurée avec: statut actuel, informations de contact, historique, prochaines étapes, notes. Retourne UNIQUEMENT le contenu markdown.`

  const content = await chatCompletion([
    { role: 'system', content: 'Tu es un assistant qui maintient un wiki business en markdown. Réponds toujours en français avec du markdown propre.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 })

  writeWikiPage(userId, `prospects/${slug}`, content)
  appendToLog(userId, `prospect_${event.type === 'prospect_created' ? 'créé' : 'mis_à_jour'}`,
    `**${name}** (${company ?? 'N/A'}) — Statut: ${status} — Valeur: ${value}€`)
}

async function ingestTransaction(event: IngestEvent): Promise<void> {
  const { userId, data } = event
  const { amount, type, category, description, date } = data as {
    amount: number; type: string; category: string; description: string; date: string
  }

  const month = new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const sign = type === 'INCOME' ? '+' : '-'
  const entry = `- ${new Date(date).toLocaleDateString('fr-FR')} | ${sign}${amount}€ | ${category} | ${description ?? ''}`

  // Append to finance patterns
  upsertWikiSection(userId, 'finance/patterns',
    `## Transactions ${month}`, entry)

  appendToLog(userId, 'transaction_ajoutée',
    `${sign}${amount}€ — ${category} — ${description ?? 'sans description'}`)
}

async function ingestPost(event: IngestEvent): Promise<void> {
  const { userId, data } = event
  const { content, impressions, engagement, postType } = data as {
    content: string; impressions: number; engagement: number; postType: string
  }

  const rate = impressions > 0 ? ((engagement / impressions) * 100).toFixed(1) : '0'
  const performance = impressions > 500 ? '🔥 Viral' : impressions > 100 ? '✅ Bon' : '📉 Faible'

  const entry = `### Post ${new Date().toLocaleDateString('fr-FR')} — ${performance}
**Type**: ${postType} | **Impressions**: ${impressions} | **Engagement**: ${engagement} (${rate}%)

> ${content.slice(0, 200)}...
`
  upsertWikiSection(userId, 'content/what-works', '## Posts récents', entry)
  appendToLog(userId, 'post_publié', `${performance} — ${impressions} impressions — taux ${rate}%`)
}

async function ingestFreeText(event: IngestEvent): Promise<void> {
  const { userId, data } = event
  const { text, context } = data as { text?: string; context?: string }
  if (!text) return // skip if no text provided

  const brain = readWikiPage(userId, 'BRAIN') ?? ''
  const index = readWikiPage(userId, 'index') ?? ''

  const prompt = `Tu es un assistant qui maintient un wiki business. Tu reçois une nouvelle information libre à intégrer.

Contexte entreprise (BRAIN.md):
${brain.slice(0, 800)}

Index actuel du wiki:
${index.slice(0, 500)}

Nouvelle information à intégrer:
${text}

Contexte additionnel: ${context ?? 'aucun'}

Dis-moi:
1. Dans quelle(s) page(s) wiki intégrer cette information (une ligne par page avec le chemin)
2. Le contenu markdown à ajouter pour chaque page

Format de réponse:
PAGE: prospects/nom-prospect
CONTENU:
[markdown]
---
PAGE: business/patterns
CONTENU:
[markdown]`

  const response = await chatCompletion([
    { role: 'system', content: 'Tu maintiens un wiki business markdown. Réponds UNIQUEMENT dans le format demandé.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.4 })

  // Parse and apply updates
  const sections = response.split('---').filter(s => s.trim())
  for (const section of sections) {
    const pageMatch = section.match(/PAGE:\s*(.+)/)
    const contentMatch = section.match(/CONTENU:\n([\s\S]+)/)
    if (pageMatch && contentMatch) {
      const pagePath = pageMatch[1].trim()
      const content = contentMatch[1].trim()
      const existing = readWikiPage(userId, pagePath)
      if (existing) {
        writeWikiPage(userId, pagePath, existing + '\n\n' + content)
      } else {
        writeWikiPage(userId, pagePath, content)
      }
    }
  }
  appendToLog(userId, 'ingestion_libre', text.slice(0, 200))
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}
