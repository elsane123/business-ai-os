const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3-haiku'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CompletionOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Business AI OS',
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
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
  return data.choices[0]?.message?.content ?? ''
}

export async function streamCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Business AI OS',
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
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
