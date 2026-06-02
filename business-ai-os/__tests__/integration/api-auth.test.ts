import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:50082'

async function login(email: string, password: string) {
  return fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

describe('API — Auth Login Endpoint', () => {
  it('returns 200 and user data on valid credentials', async () => {
    const res = await login('test_qa_20260525@brainlo.test', 'TestBrainlo123!' )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.user.email).toBe('test_qa_20260525@brainlo.test')
    expect(data.user.plan).toBe('PRO')
    expect(data.user.id).toBeTruthy()
  })

  it('sets auth_token cookie on successful login', async () => {
    const res = await login('test_qa_20260525@brainlo.test', 'TestBrainlo123!')
    const cookie = res.headers.get('set-cookie')
    expect(cookie).toBeTruthy()
    expect(cookie).toContain('auth_token')
    expect(cookie).toContain('HttpOnly')
  })

  it('returns 401 on wrong password', async () => {
    const res = await login('test_qa_20260525@brainlo.test', 'WrongPassword999')
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBeTruthy()
  })

  it('returns 401 for non-existent user', async () => {
    const res = await login('nobody@doesnotexist.test', 'AnyPassword123')
    expect(res.status).toBe(401)
  })

  it('returns 400 or 401 for missing password field', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_qa_20260525@brainlo.test' }),
    })
    expect([400, 401, 422]).toContain(res.status)
  })

  it('returns 400 or 401 for empty body', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect([400, 401, 422]).toContain(res.status)
  })
})

describe('API — Auth Logout Endpoint', () => {
  it('returns 200 and clears auth cookie on POST /api/auth/logout', async () => {
    const loginRes = await login('test_qa_20260525@brainlo.test', 'TestBrainlo123!')
    const cookie = loginRes.headers.get('set-cookie') ?? ''
    const token = cookie.match(/auth_token=([^;]+)/)?.[1] ?? ''

    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `auth_token=${token}` },
    })
    expect(logoutRes.status).toBe(200)
  })
})
