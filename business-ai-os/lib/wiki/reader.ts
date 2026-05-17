import * as fs from 'fs'
import * as path from 'path'

const WIKI_BASE = process.env.WIKI_BASE_PATH ?? './wiki-data'

// ─── Security: Path Traversal Protection ────────────────────────────────────

/** Validates that a userId is safe (cuid/alphanumeric format only, no path separators) */
function isValidUserId(userId: string): boolean {
  return /^[a-z0-9]{10,40}$/.test(userId)
}

/** Validates that a pagePath does not contain traversal sequences */
function isValidPagePath(pagePath: string): boolean {
  // Reject absolute paths, null bytes, and traversal sequences
  if (!pagePath || pagePath.includes('..') || path.isAbsolute(pagePath) || pagePath.includes('\0')) {
    return false
  }
  return true
}

/**
 * Safely resolves a wiki file path and verifies it stays within the user's wiki directory.
 * Throws an error if the resolved path escapes the sandbox.
 */
function safeResolvePath(userId: string, filePath: string): string {
  const resolved = path.resolve(filePath)
  const userBase = path.resolve(path.join(WIKI_BASE, userId))
  if (!resolved.startsWith(userBase + path.sep) && resolved !== userBase) {
    throw new Error(`Path traversal detected: ${filePath}`)
  }
  return resolved
}

export function getUserWikiPath(userId: string): string {
  if (!isValidUserId(userId)) throw new Error(`Invalid userId: ${userId}`)
  return path.join(WIKI_BASE, userId)
}

export function getWikiFilePath(userId: string, pagePath: string): string {
  if (!isValidUserId(userId)) throw new Error(`Invalid userId: ${userId}`)
  if (!isValidPagePath(pagePath)) throw new Error(`Invalid pagePath: ${pagePath}`)
  const ext = pagePath.endsWith('.md') ? '' : '.md'
  const filePath = path.join(WIKI_BASE, userId, pagePath + ext)
  safeResolvePath(userId, filePath)
  return filePath
}

export function readWikiPage(userId: string, pagePath: string): string | null {
  const filePath = getWikiFilePath(userId, pagePath)
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

export function listWikiPages(userId: string, subDir?: string): string[] {
  const dirPath = subDir
    ? path.join(WIKI_BASE, userId, subDir)
    : path.join(WIKI_BASE, userId)
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const pages: string[] = []
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPages = listWikiPages(userId, subDir ? `${subDir}/${entry.name}` : entry.name)
        pages.push(...subPages)
      } else if (entry.name.endsWith('.md')) {
        const relativePath = subDir ? `${subDir}/${entry.name}` : entry.name
        pages.push(relativePath.replace('.md', ''))
      }
    }
    return pages
  } catch {
    return []
  }
}

export function readBrain(userId: string): string {
  return readWikiPage(userId, 'BRAIN') ?? '# Business Brain\n\nNon configuré.'
}

export function readIndex(userId: string): string {
  return readWikiPage(userId, 'index') ?? '# Index Wiki\n\nVide.'
}

export function readLog(userId: string, lastN = 20): string {
  const content = readWikiPage(userId, 'log') ?? ''
  const lines = content.split('\n')
  // Return last N entries (each entry starts with ##)
  const entries: string[] = []
  let current = ''
  for (const line of lines) {
    if (line.startsWith('## ') && current) {
      entries.push(current.trim())
      current = line
    } else {
      current += '\n' + line
    }
  }
  if (current) entries.push(current.trim())
  return entries.slice(-lastN).join('\n\n')
}

export function readMultiplePages(userId: string, pagePaths: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const p of pagePaths) {
    const content = readWikiPage(userId, p)
    if (content) result[p] = content
  }
  return result
}

export function getBusinessContext(userId: string): string {
  const sections: string[] = []

  // Core: BRAIN.md
  const brain = readWikiPage(userId, 'BRAIN')
  if (brain) sections.push(`## 🧠 Business Brain\n${brain}`)

  // Finance patterns
  const finPatterns = readWikiPage(userId, 'finance/patterns')
  if (finPatterns) sections.push(`## 💰 Patterns Financiers\n${finPatterns}`)

  // Business patterns
  const bizPatterns = readWikiPage(userId, 'business/patterns')
  if (bizPatterns) sections.push(`## 📊 Patterns Business\n${bizPatterns}`)

  // Prospects (list all prospect pages)
  const prospectPages = listWikiPages(userId, 'prospects')
  if (prospectPages.length > 0) {
    const prospectContents: string[] = []
    for (const p of prospectPages.slice(0, 5)) { // max 5 prospects
      const content = readWikiPage(userId, p)
      if (content) prospectContents.push(content)
    }
    if (prospectContents.length > 0) {
      sections.push(`## 👥 Prospects Actifs\n${prospectContents.join('\n---\n')}`)
    }
  }

  // Recent log (last 10 entries)
  const recentLog = readLog(userId, 10)
  if (recentLog) sections.push(`## 📋 Activité Récente\n${recentLog}`)

  if (sections.length === 0) {
    return 'Aucun contexte business disponible. Début d\'activité.'
  }

  return sections.join('\n\n')
}

/**
 * Build rich wiki context for a given user query (used by Chat Business Brain).
 * Combines BRAIN.md + BM25 search results for LLM prompt injection.
 */
export function buildWikiContext(userId: string, query: string): string {
  // Import searchWiki dynamically to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { searchWiki } = require('./query')

  const brain = readBrain(userId)
  const searchResults: Array<{ path: string; content: string }> = searchWiki(userId, query, 4)
  const parts: string[] = []

  if (brain) {
    parts.push(`## 🧠 Profil Business\n${brain}`)
  }

  if (searchResults && searchResults.length > 0) {
    const relevantPages = searchResults
      .map((r) => `### ${r.path}\n${r.content.slice(0, 800)}`)
      .join('\n\n')
    parts.push(`## 📚 Pages Pertinentes\n${relevantPages}`)
  }

  const log = readLog(userId, 10)
  if (log) parts.push(`## 📋 Activité Récente\n${log}`)

  return parts.length > 0
    ? parts.join('\n\n')
    : "Aucun contexte business disponible. Vous démarrez votre activité."
}
