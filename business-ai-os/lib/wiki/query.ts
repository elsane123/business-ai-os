import { listWikiPages, readWikiPage, readBrain, readIndex } from './reader'

export interface WikiSearchResult {
  path: string
  score: number
  snippet: string
  content: string
}

/**
 * BM25-inspired search over the user's wiki pages.
 * Tokenizes query and content, scores by term frequency + coverage.
 */
export function searchWiki(
  userId: string,
  query: string,
  maxResults = 5
): WikiSearchResult[] {
  const pages = listWikiPages(userId)
  if (pages.length === 0) return []

  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const results: WikiSearchResult[] = []

  for (const pagePath of pages) {
    const content = readWikiPage(userId, pagePath)
    if (!content) continue

    const score = bm25Score(queryTokens, content)
    if (score > 0) {
      results.push({
        path: pagePath,
        score,
        snippet: extractSnippet(content, queryTokens),
        content,
      })
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}

/**
 * Build a context string for LLM from the most relevant wiki pages.
 * Used by the chat endpoint to ground the assistant in user's business reality.
 */
export function buildWikiContext(
  userId: string,
  query: string,
  maxTokensApprox = 3000
): string {
  const brain = readBrain(userId)
  const results = searchWiki(userId, query, 4)

  let context = `## Business Brain (Context)
${brain.slice(0, 800)}

`

  let remaining = maxTokensApprox - context.length / 4

  for (const result of results) {
    const section = `## Wiki: ${result.path}\n${result.content}\n\n`
    const approxTokens = section.length / 4
    if (approxTokens > remaining) break
    context += section
    remaining -= approxTokens
  }

  return context
}

/**
 * Get pages most relevant to current business context.
 * Used by Daily Focus generation.
 */
export function getBusinessContext(userId: string): string {
  const brain = readBrain(userId)
  const index = readIndex(userId)

  // Always include key business pages
  const keyPages = ['business/icp', 'business/patterns', 'finance/patterns', 'business/messages']
  let context = `${brain}\n\n`

  for (const page of keyPages) {
    const content = readWikiPage(userId, page)
    if (content) {
      context += `## ${page}\n${content.slice(0, 600)}\n\n`
    }
  }

  // Get recent prospects (first 3)
  const prospectPages = listWikiPages(userId, 'prospects').slice(0, 3)
  for (const p of prospectPages) {
    const content = readWikiPage(userId, p)
    if (content) {
      context += `## ${p}\n${content.slice(0, 400)}\n\n`
    }
  }

  return context
}

// --- BM25 helpers ---

const K1 = 1.5
const B = 0.75
const AVG_DOC_LENGTH = 500

function bm25Score(queryTokens: string[], document: string): number {
  const docTokens = tokenize(document)
  const docLength = docTokens.length
  const tf = termFrequency(docTokens)

  let score = 0
  for (const term of queryTokens) {
    const freq = tf[term] ?? 0
    if (freq === 0) continue
    const numerator = freq * (K1 + 1)
    const denominator = freq + K1 * (1 - B + B * (docLength / AVG_DOC_LENGTH))
    score += numerator / denominator
  }
  return score
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2)
}

function termFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {}
  for (const t of tokens) {
    tf[t] = (tf[t] ?? 0) + 1
  }
  return tf
}

function extractSnippet(content: string, queryTokens: string[], snippetLength = 200): string {
  const lower = content.toLowerCase()
  let bestPos = 0
  let bestScore = 0

  for (const token of queryTokens) {
    const pos = lower.indexOf(token)
    if (pos >= 0) {
      const score = queryTokens.filter(t => lower.slice(
        Math.max(0, pos - 100),
        pos + snippetLength
      ).includes(t)).length
      if (score > bestScore) {
        bestScore = score
        bestPos = Math.max(0, pos - 50)
      }
    }
  }

  const snippet = content.slice(bestPos, bestPos + snippetLength)
  return (bestPos > 0 ? '...' : '') + snippet.replace(/\n+/g, ' ').trim() + '...'
}
