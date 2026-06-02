import { prisma } from '@/lib/db'
import { readBrain } from '@/lib/wiki/reader'

interface ProfileEnrichment {
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

/**
 * Returns a unified business brain context string for a given user.
 * Fuses: Prisma structured fields + profileEnrichment (wizard output) + BRAIN.md wiki.
 * Injected into every agent's system prompt as a common business identity header.
 */
export async function getBrainContext(userId: string): Promise<string> {
  const [user, brain] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        businessName: true,
        sector: true,
        monthlyGoal: true,
        fixedCharges: true,
        legalForm: true,
        activityType: true,
        city: true,
        profileEnrichment: true,
      },
    }),
    Promise.resolve(readBrain(userId)),
  ])

  if (!user) return ''

  let enrichment: ProfileEnrichment = {}
  try {
    enrichment = JSON.parse(user.profileEnrichment ?? '{}')
  } catch {
    // malformed JSON — use empty enrichment
  }

  const hasBrain = brain && !brain.includes('[Nom Entreprise]') && !brain.includes('Non configuré')

  const lines: string[] = [
    `## 🧠 Identité Business`,
    `- Entreprise : ${user.businessName ?? 'Non renseigné'} | Secteur : ${user.sector ?? 'Non renseigné'}`,
    `- Forme juridique : ${user.legalForm ?? 'Non renseigné'} | Activité : ${user.activityType ?? 'Non renseigné'}`,
    `- Localisation : ${user.city ?? 'Non renseigné'}`,
    `- Objectif mensuel : ${user.monthlyGoal ?? 0}€ | Charges fixes : ${user.fixedCharges ?? 0}€/mois`,
  ]

  if (enrichment.offerType || enrichment.offerDescription) {
    lines.push(`\n## 💼 Offre principale`)
    if (enrichment.offerType)        lines.push(`- Type : ${enrichment.offerType}`)
    if (enrichment.offerDescription) lines.push(`- Description : ${enrichment.offerDescription}`)
    if (enrichment.priceRange)        lines.push(`- Panier moyen : ${enrichment.priceRange}`)
    if (enrichment.typicalDuration)   lines.push(`- Durée typique : ${enrichment.typicalDuration}`)
  }

  if (enrichment.valueProposition || enrichment.differentiator) {
    lines.push(`\n## 🎯 Positionnement`)
    if (enrichment.valueProposition) lines.push(`- Proposition de valeur : ${enrichment.valueProposition}`)
    if (enrichment.differentiator)   lines.push(`- Différenciateur : ${enrichment.differentiator}`)
    if (enrichment.targetClient)     lines.push(`- Client idéal : ${enrichment.targetClient}`)
    if (enrichment.clientPainPoint)  lines.push(`- Problème résolu : ${enrichment.clientPainPoint}`)
    if (enrichment.competitors)      lines.push(`- Concurrents : ${enrichment.competitors}`)
  }

  if (enrichment.briefContent) {
    lines.push(`\n## 📋 Brief Business\n${enrichment.briefContent}`)
  } else if (hasBrain) {
    lines.push(`\n## 📋 Wiki Business Brain\n${brain}`)
  }

  return lines.join('\n')
}
