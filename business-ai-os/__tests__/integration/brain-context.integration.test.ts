import { describe, it, expect, beforeAll } from 'vitest'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:50082'

// QA fixtures
const USER1_EMAIL    = 'test_qa_20260525@brainlo.test'
const USER1_PASS     = 'TestBrainlo123!'
const USER1_BIZ_NAME = 'Brainlo QA Test'  // businessName in DB
const USER2_EMAIL    = 'test_qa_user2@brainlo.test'
const USER2_PASS     = 'TestUser2Pass'

async function getAuthCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`)
  const cookie = res.headers.get('set-cookie') ?? ''
  const token  = cookie.match(/auth_token=([^;]+)/)?.[1] ?? ''
  return `auth_token=${token}`
}

let cookieUser1: string
let cookieUser2: string

beforeAll(async () => {
  cookieUser1 = await getAuthCookie(USER1_EMAIL, USER1_PASS)
  cookieUser2 = await getAuthCookie(USER2_EMAIL, USER2_PASS)
})

// ─── Auth gate tests (no LLM) ────────────────────────────────────────────────

describe('Brain — Auth gates (no LLM)', () => {

  it('BC-I04: POST /api/agents/agent-coach/chat sans cookie → 401', async () => {
    const res = await fetch(`${BASE_URL}/api/agents/agent-coach/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bonjour' }),
    })
    expect(res.status).toBe(401)
  })

  it('BC-I05: POST agent non activé (agent-cfo) → 403', async () => {
    // agent-cfo is NOT activated for user1
    const res = await fetch(`${BASE_URL}/api/agents/agent-cfo/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUser1 },
      body: JSON.stringify({ message: 'Bonjour' }),
    })
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toMatch(/activé/i)
  })

  it('BC-I06: POST message vide → 400', async () => {
    const res = await fetch(`${BASE_URL}/api/agents/agent-coach/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUser1 },
      body: JSON.stringify({ message: '   ' }),
    })
    expect(res.status).toBe(400)
  })

})

// ─── Agent list isolation (no LLM) ──────────────────────────────────────────

describe('Brain — Context isolation (no LLM)', () => {

  it('BC-I03: GET /api/agents — user1 (PRO) et user2 (FREE) ont des plans différents', async () => {
    const [r1, r2] = await Promise.all([
      fetch(`${BASE_URL}/api/agents`, { headers: { Cookie: cookieUser1 } }),
      fetch(`${BASE_URL}/api/agents`, { headers: { Cookie: cookieUser2 } }),
    ])
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)

    const [d1, d2] = await Promise.all([r1.json(), r2.json()])
    expect(d1.userPlan).toBe('PRO')
    expect(d2.userPlan).toBe('FREE')
    // PRO has more slots than FREE
    expect(d1.maxSlots).toBeGreaterThan(d2.maxSlots)
  })

  it('BC-I03b: GET /api/auth/profile — user1 et user2 ont des businessNames différents', async () => {
    const [r1, r2] = await Promise.all([
      fetch(`${BASE_URL}/api/auth/profile`, { headers: { Cookie: cookieUser1 } }),
      fetch(`${BASE_URL}/api/auth/profile`, { headers: { Cookie: cookieUser2 } }),
    ])
    const [d1, d2] = await Promise.all([r1.json(), r2.json()])
    expect(d1.user.businessName).toBe('Brainlo QA Test')
    expect(d2.user.businessName).toBe('QA Bizz Two')
    expect(d1.user.businessName).not.toBe(d2.user.businessName)
  })

})

// ─── Sentinel LLM test — brain context injecté dans le system prompt ─────────

describe('Brain — Contexte injecté dans le LLM (appel réel OpenRouter)', () => {

  it('BC-I01: agent-coach cite le businessName exact de l\'utilisateur', async () => {
    const res = await fetch(`${BASE_URL}/api/agents/agent-coach/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUser1 },
      body: JSON.stringify({ message: 'Quel est exactement le nom de mon entreprise ?' }),
    })
    expect(res.ok).toBe(true)
    const data = await res.json()
    const reply: string = data.reply ?? ''
    expect(reply.length).toBeGreaterThan(10)
    // The reply MUST mention the sentinel businessName — proves brain context was injected
    expect(reply).toMatch(new RegExp(USER1_BIZ_NAME, 'i'))
  }, 30_000) // 30s timeout for LLM

  it('BC-I02: agent-coach mentionne l\'objectif mensuel (5000€)', async () => {
    const res = await fetch(`${BASE_URL}/api/agents/agent-coach/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUser1 },
      body: JSON.stringify({ message: 'Quel est mon objectif de chiffre d\'affaires mensuel ?' }),
    })
    expect(res.ok).toBe(true)
    const data = await res.json()
    const reply: string = data.reply ?? ''
    // 5000€ must appear in the reply
    expect(reply).toMatch(/5[\s.]?000/)
  }, 30_000)

})
