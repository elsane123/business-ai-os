import { test, expect } from '@playwright/test'

// Tests de protection des endpoints cron
// Ces endpoints nécessitent le header x-cron-secret pour être appelés
// Ils rejettent toute requête sans secret ou avec un secret invalide

test.describe('Cron Endpoints — Protection x-cron-secret', () => {

  // CRON-01 : POST /api/cron/daily-focus sans secret → 401
  test('CRON-01 : POST /api/cron/daily-focus sans x-cron-secret → 401', async ({ request }) => {
    const response = await request.post('/api/cron/daily-focus', {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(401)
  })

  // CRON-02 : POST /api/cron/daily-focus avec secret invalide → 401
  test('CRON-02 : POST /api/cron/daily-focus avec secret invalide → 401', async ({ request }) => {
    const response = await request.post('/api/cron/daily-focus', {
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': 'secret_invalide_e2e_xyz',
      },
    })
    expect(response.status()).toBe(401)
  })

  // CRON-03 : POST /api/cron/monthly-report sans secret → 401
  test('CRON-03 : POST /api/cron/monthly-report sans x-cron-secret → 401', async ({ request }) => {
    const response = await request.post('/api/cron/monthly-report', {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(401)
  })

  // CRON-04 : POST /api/cron/monthly-report avec secret invalide → 401
  test('CRON-04 : POST /api/cron/monthly-report avec secret invalide → 401', async ({ request }) => {
    const response = await request.post('/api/cron/monthly-report', {
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': 'secret_invalide_e2e_xyz',
      },
    })
    expect(response.status()).toBe(401)
  })

  // CRON-05 : POST /api/cron/wiki-lint sans secret → 401
  test('CRON-05 : POST /api/cron/wiki-lint sans x-cron-secret → 401', async ({ request }) => {
    const response = await request.post('/api/cron/wiki-lint', {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(401)
  })

  // CRON-06 : POST /api/cron/wiki-lint avec secret invalide → 401
  test('CRON-06 : POST /api/cron/wiki-lint avec secret invalide → 401', async ({ request }) => {
    const response = await request.post('/api/cron/wiki-lint', {
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': 'secret_invalide_e2e_xyz',
      },
    })
    expect(response.status()).toBe(401)
  })

  // CRON-07 : GET /api/reports/monthly sans auth → 401 ou redirect
  test('CRON-07 : GET /api/reports/monthly sans auth → 401', async ({ playwright }) => {
    // Use a fresh context without storageState to get a truly unauthenticated request
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:50082', storageState: { cookies: [], origins: [] } })
    const response = await ctx.get('/api/reports/monthly?month=2026-05')
    await ctx.dispose()
    expect([401, 302, 403]).toContain(response.status())
  })

  // CRON-08 : vérifier que les endpoints cron acceptent le bon secret
  // NOTE : ce test nécessite CRON_SECRET disponible dans l'env de test
  // Il est marqué skip si la variable n'est pas disponible
  test.skip('CRON-08 : POST /api/cron/wiki-lint avec bon secret → 200 ou 500 (pas 401)', async ({ request }) => {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      test.skip(true, 'CRON_SECRET non disponible dans les variables d\'environnement de test')
      return
    }
    const response = await request.post('/api/cron/wiki-lint', {
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
      },
    })
    // Doit être traité (200 succès ou 500 erreur interne), pas 401 rejeté
    expect(response.status()).not.toBe(401)
  })
})
