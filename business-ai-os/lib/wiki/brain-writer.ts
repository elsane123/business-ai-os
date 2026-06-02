import * as fs from 'fs'
import { getUserWikiPath } from './reader'

export interface BrainEnrichment {
  offerType?: string
  offerDescription?: string
  priceRange?: string
  typicalDuration?: string
  targetClient?: string
  clientPainPoint?: string
  valueProposition?: string
  competitors?: string
  differentiator?: string
  targetGeography?: string
  workLanguages?: string
  briefContent?: string
}

export interface BrainUserData {
  businessName?: string | null
  sector?: string | null
  monthlyGoal?: number
}

/**
 * Generates a filled BRAIN.md from wizard enrichment data and writes it to the user's wiki.
 * Called after /api/user/brain-wizard to keep BRAIN.md in sync with profileEnrichment.
 */
export function writeBrainFromEnrichment(
  userId: string,
  enrichment: BrainEnrichment,
  user: BrainUserData = {}
): void {
  const wikiPath = getUserWikiPath(userId)
  fs.mkdirSync(wikiPath, { recursive: true })

  const content = buildBrainContent(enrichment, user)
  fs.writeFileSync(`${wikiPath}/BRAIN.md`, content, 'utf-8')
}

function buildBrainContent(e: BrainEnrichment, u: BrainUserData): string {
  const competitors = e.competitors
    ? e.competitors.split(',').map(c => `- ${c.trim()} — différenciation:`).join('\n')
    : '- [à compléter] — différenciation:'

  return `# Business Brain — ${u.businessName ?? '[Nom Entreprise]'}

## Identité de l'entreprise
- **Secteur**: ${u.sector ?? '[à compléter]'}
- **Produit/Service**: ${e.offerDescription ?? '[à compléter]'}
- **Ton**: professionnel
- **Langue**: ${e.workLanguages === 'en' ? 'Anglais' : e.workLanguages === 'fr+en' ? 'Français + Anglais' : 'Français'}

## Offre principale
- **Type d'offre**: ${e.offerType ?? '[à compléter]'}
- **Panier moyen**: ${e.priceRange ?? '[à compléter]'}
- **Durée typique**: ${e.typicalDuration ?? '[à compléter]'}
- **Description courte**: ${e.offerDescription ?? '[à compléter]'}

## Profil Client Idéal (ICP)
- **Description**: ${e.targetClient ?? '[à compléter]'}
- **Problème principal résolu**: ${e.clientPainPoint ?? '[à compléter]'}

## Proposition de valeur
${e.valueProposition ?? '[à compléter]'}

## Différenciateur
${e.differentiator ?? '[à compléter]'}

## Concurrents principaux
${competitors}

## Zone géographique & langues
- **Géographie**: ${e.targetGeography ?? '[à compléter]'}
- **Langues de travail**: ${e.workLanguages ?? '[à compléter]'}

## Objectifs
- CA mensuel cible: ${u.monthlyGoal ? `${u.monthlyGoal}€` : '[X]€'}

## Ton & voix
Professionnel et direct. Axé résultats concrets pour l'entrepreneur.

## Brief complet
${e.briefContent ?? '[Brief à compléter via le wizard]'}

## Conventions wiki
- Chaque prospect a sa page dans /prospects/
- Les patterns business sont dans /business/
- Les insights financiers sont dans /finance/
- L'intelligence contenu est dans /content/
- Toute ingestion est loggée dans log.md
- L'index global est dans index.md
`
}
