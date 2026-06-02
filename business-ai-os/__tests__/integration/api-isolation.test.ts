import { describe, it, expect, beforeAll } from 'vitest'

const BASE_URL = process.env.BASE_URL || 'http://localhost:50082'

async function getAuthCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`)
  const cookie = res.headers.get('set-cookie') ?? ''
  const token = cookie.match(/auth_token=([^;]+)/)?.[1] ?? ''
  return `auth_token=${token}`
}

let cookieUser1: string
let cookieUser2: string

beforeAll(async () => {
  cookieUser1 = await getAuthCookie('test_qa_20260525@brainlo.test', 'TestBrainlo123!')
  cookieUser2 = await getAuthCookie('test_qa_user2@brainlo.test', 'TestUser2Pass')
})

describe('API — Cross-User Data Isolation', () => {
  it('user1 and user2 get different profile data', async () => {
    const [r1, r2] = await Promise.all([
      fetch(`${BASE_URL}/api/auth/profile`, { headers: { Cookie: cookieUser1 } }),
      fetch(`${BASE_URL}/api/auth/profile`, { headers: { Cookie: cookieUser2 } }),
    ])
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    const [d1, d2] = await Promise.all([r1.json(), r2.json()])
    expect(d1.user.email).toBe('test_qa_20260525@brainlo.test')
    expect(d2.user.email).toBe('test_qa_user2@brainlo.test')
    expect(d1.user.id).not.toBe(d2.user.id)
  })

  it('user1 prospects are not visible to user2', async () => {
    const [r1, r2] = await Promise.all([
      fetch(`${BASE_URL}/api/pipeline/prospects`, { headers: { Cookie: cookieUser1 } }),
      fetch(`${BASE_URL}/api/pipeline/prospects`, { headers: { Cookie: cookieUser2 } }),
    ])
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    const [p1, p2] = await Promise.all([r1.json(), r2.json()])
    if (Array.isArray(p1) && p1.length > 0 && Array.isArray(p2)) {
      const ids1 = new Set(p1.map((p: { id: string }) => p.id))
      p2.forEach((p: { id: string }) => expect(ids1.has(p.id)).toBe(false))
    }
  })

  it('user1 transactions are not visible to user2', async () => {
    const [r1, r2] = await Promise.all([
      fetch(`${BASE_URL}/api/cash/transactions`, { headers: { Cookie: cookieUser1 } }),
      fetch(`${BASE_URL}/api/cash/transactions`, { headers: { Cookie: cookieUser2 } }),
    ])
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    const [t1, t2] = await Promise.all([r1.json(), r2.json()])
    if (Array.isArray(t1) && t1.length > 0 && Array.isArray(t2)) {
      const ids1 = new Set(t1.map((t: { id: string }) => t.id))
      t2.forEach((t: { id: string }) => expect(ids1.has(t.id)).toBe(false))
    }
  })

  it('user1 invoices are not visible to user2', async () => {
    const [r1, r2] = await Promise.all([
      fetch(`${BASE_URL}/api/invoices`, { headers: { Cookie: cookieUser1 } }),
      fetch(`${BASE_URL}/api/invoices`, { headers: { Cookie: cookieUser2 } }),
    ])
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    const [i1, i2] = await Promise.all([r1.json(), r2.json()])
    if (Array.isArray(i1) && i1.length > 0 && Array.isArray(i2)) {
      const ids1 = new Set(i1.map((i: { id: string }) => i.id))
      i2.forEach((i: { id: string }) => expect(ids1.has(i.id)).toBe(false))
    }
  })
})
