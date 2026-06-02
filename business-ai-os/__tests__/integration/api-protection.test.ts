import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:50082'

const PROTECTED_ROUTES = [
  { method: 'GET',  path: '/api/auth/profile' },
  { method: 'GET',  path: '/api/pipeline/prospects' },
  { method: 'GET',  path: '/api/cash/transactions' },
  { method: 'GET',  path: '/api/invoices' },
  { method: 'GET',  path: '/api/focus' },
  { method: 'GET',  path: '/api/agents' },
  { method: 'GET',  path: '/api/cash/runway' },
  { method: 'GET',  path: '/api/cash/urssaf' },
  { method: 'GET',  path: '/api/user/enrichment' },
  { method: 'GET',  path: '/api/user/linkedin-token' },
  { method: 'POST', path: '/api/pipeline/icp/generate' },
  { method: 'POST', path: '/api/agents/cold-email/generate' },
  { method: 'POST', path: '/api/agents/linkedin-post/generate' },
]

describe('API — Authentication Protection', () => {
  for (const route of PROTECTED_ROUTES) {
    it(`${route.method} ${route.path} returns 401 without auth`, async () => {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        body: route.method === 'POST' ? '{}' : undefined,
      })
      expect(res.status).toBe(401)
    })
  }
})
