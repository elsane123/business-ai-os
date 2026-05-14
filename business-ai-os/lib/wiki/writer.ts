import * as fs from 'fs'
import * as path from 'path'
import { getUserWikiPath, getWikiFilePath } from './reader'

export function ensureUserWikiExists(userId: string, businessName = 'Mon Entreprise', sector = 'Non défini') {
  const userDir = getUserWikiPath(userId)
  if (!fs.existsSync(userDir)) {
    // Create directory structure
    fs.mkdirSync(userDir, { recursive: true })
    fs.mkdirSync(path.join(userDir, 'prospects'), { recursive: true })
    fs.mkdirSync(path.join(userDir, 'business'), { recursive: true })
    fs.mkdirSync(path.join(userDir, 'finance'), { recursive: true })
    fs.mkdirSync(path.join(userDir, 'content'), { recursive: true })

    // Initialize BRAIN.md from template
    const brainContent = generateBrainTemplate(businessName, sector)
    writeWikiPage(userId, 'BRAIN', brainContent)

    // Initialize index.md
    writeWikiPage(userId, 'index', `# Index Wiki — ${businessName}\n\n_Généré le ${new Date().toLocaleDateString('fr-FR')}_\n\n## Pages\n- [BRAIN](BRAIN) — Schéma de l'entreprise\n- [log](log) — Journal des événements\n`)

    // Initialize log.md
    writeWikiPage(userId, 'log', `# Journal Wiki — ${businessName}\n\n## [${new Date().toISOString()}] init\nInitialisation du wiki Business Brain.\n`)

    // Initialize business subdirectory files
    writeWikiPage(userId, 'business/icp', `# Profil Client Idéal (ICP)\n\n## Secteur cible\nÀ compléter au fil des ventes.\n\n## Taille d'entreprise\nÀ compléter.\n\n## Budget typique\nÀ compléter.\n\n## Persona décideur\nÀ compléter.\n`)
    writeWikiPage(userId, 'business/patterns', `# Patterns Business\n\n## Ce qui fonctionne\n_Aucun pattern identifié pour l'instant._\n\n## Ce qui ne fonctionne pas\n_Aucun anti-pattern identifié._\n`)
    writeWikiPage(userId, 'business/messages', `# Messages qui Convertissent\n\n## Accroche principale\nÀ compléter.\n\n## Objections fréquentes\nÀ compléter.\n`)

    // Finance
    writeWikiPage(userId, 'finance/patterns', `# Patterns Financiers\n\n## Saisonnalité\nÀ compléter au fil du temps.\n\n## Catégories principales de revenus\nÀ compléter.\n`)
    writeWikiPage(userId, 'finance/clients', `# Intelligence Clients\n\n## Meilleurs clients\nÀ compléter.\n\n## Clients à risque\nÀ compléter.\n`)

    // Content
    writeWikiPage(userId, 'content/what-works', `# Ce qui Fonctionne sur LinkedIn\n\n## Formats performants\nÀ compléter.\n\n## Sujets engageants\nÀ compléter.\n`)
    writeWikiPage(userId, 'content/ideas-bank', `# Banque d'Idées LinkedIn\n\n## Idées en attente\n_Aucune idée pour l'instant._\n`)
  }
}

export function writeWikiPage(userId: string, pagePath: string, content: string): void {
  const filePath = getWikiFilePath(userId, pagePath)
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

export function appendToWikiPage(userId: string, pagePath: string, content: string): void {
  const filePath = getWikiFilePath(userId, pagePath)
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.appendFileSync(filePath, '\n' + content, 'utf-8')
}

export function appendToLog(userId: string, eventType: string, summary: string): void {
  const timestamp = new Date().toISOString()
  const entry = `\n## [${timestamp}] ${eventType}\n${summary}\n`
  appendToWikiPage(userId, 'log', entry)
}

export function upsertWikiSection(
  userId: string,
  pagePath: string,
  sectionHeader: string,
  newContent: string
): void {
  const filePath = getWikiFilePath(userId, pagePath)
  let existing = ''
  try {
    existing = fs.readFileSync(filePath, 'utf-8')
  } catch {
    writeWikiPage(userId, pagePath, `${sectionHeader}\n\n${newContent}`)
    return
  }

  const sectionRegex = new RegExp(
    `(${escapeRegex(sectionHeader)}\\n)([\\s\\S]*?)(?=\\n## |\\n# |$)`,
    'm'
  )
  if (sectionRegex.test(existing)) {
    const updated = existing.replace(sectionRegex, `$1\n${newContent}\n`)
    fs.writeFileSync(filePath, updated, 'utf-8')
  } else {
    fs.appendFileSync(filePath, `\n\n${sectionHeader}\n\n${newContent}`, 'utf-8')
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function generateBrainTemplate(businessName: string, sector: string): string {
  return `# Business Brain — ${businessName}

## Identité de l'entreprise
- **Secteur**: ${sector}
- **Produit/Service**: À compléter
- **Ton**: Professionnel et expert
- **Langue**: Français

## Profil Client Idéal (ICP)
- **Secteur cible**: À compléter
- **Taille entreprise**: À compléter
- **Budget typique**: À compléter
- **Persona décideur**: À compléter

## Objectifs
- CA mensuel cible: À compléter €
- Nombre de clients actifs cible: À compléter
- Cycle de vente moyen: À compléter jours

## Conventions wiki
- Chaque prospect a sa page dans /prospects/
- Les patterns business sont dans /business/
- Les insights financiers sont dans /finance/
- L'intelligence contenu est dans /content/
- Toute ingestion est loggée dans log.md

## Notes stratégiques
_À compléter au fil du temps._
`
}
