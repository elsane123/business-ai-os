import { prisma } from '@/lib/db'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3-haiku'

// Cost per million tokens in USD (approximate, update as needed)
const COST_PER_1M: Record<string, { input: number; output: number }> = {
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'anthropic/claude-3-opus': { input: 15.0, output: 75.0 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  'openai/gpt-4o': { input: 5.0, output: 15.0 },
}

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const rates = COST_PER_1M[model] ?? { input: 1.0, output: 3.0 }
  return (promptTokens * rates.input + completionTokens * rates.output) / 1_000_000
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CompletionOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
  /** Optional tracking — records usage to ai_usage table */
  track?: { userId: string; feature: string }
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const model = options.model ?? DEFAULT_MODEL

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Brainlo',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content ?? ''

  // Track usage if requested
  if (options.track && data.usage) {
    const { userId, feature } = options.track
    const promptTokens = data.usage.prompt_tokens ?? 0
    const completionTokens = data.usage.completion_tokens ?? 0
    const totalTokens = data.usage.total_tokens ?? (promptTokens + completionTokens)
    const estimatedCostUsd = estimateCost(model, promptTokens, completionTokens)

    prisma.aIUsage.create({
      data: { userId, model, feature, promptTokens, completionTokens, totalTokens, estimatedCostUsd },
    }).catch((e) => { console.error('[ai-usage tracking]', e) })
  }

  return content
}

export async function streamCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const model = options.model ?? DEFAULT_MODEL

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Brainlo',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter stream error: ${response.status}`)
  }

  return response.body
}
