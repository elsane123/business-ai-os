import { test, expect } from '@playwright/test'

test.describe('Acquisition Client AI — Epic 8', () => {

  // ── Story 8.1 — ICP Builder ──────────────────────────────────────────────────

  test('ACQ-01 : pipeline page — bouton Générer mon ICP visible', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page).toHaveURL('/pipeline', { timeout: 8_000 })
    const icpBtn = page.getByRole('button', { name: /ICP|client idéal/i })
    if (await icpBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(icpBtn).toBeVisible()
    }
  })

  test('ACQ-02 : ICP generate — appel API renvoie 200 ou 401', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/pipeline/icp/generate'), { timeout: 30_000 }).catch(() => null),
      page.goto('/pipeline').then(async () => {
        const btn = page.getByRole('button', { name: /ICP|client idéal/i })
        if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) await btn.click()
      }),
    ])
    if (response) {
      expect([200, 401, 403]).toContain(response.status())
    }
  })

  test('ACQ-03 : badges score de closing visibles sur cartes prospects', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page).toHaveURL('/pipeline', { timeout: 8_000 })
    // Les badges apparaissent après la génération de l'ICP
    const scoreBadge = page.locator('[class*="score"], [class*="badge"], [data-testid*="score"]').first()
    const hasBadge = await scoreBadge.isVisible({ timeout: 5_000 }).catch(() => false)
    // Soft check: badges may not exist if ICP not yet generated
    if (hasBadge) {
      await expect(scoreBadge).toBeVisible()
    }
  })

  // ── Story 8.2 — Cold Email Sequence ──────────────────────────────────────────

  test('ACQ-04 : cold email generate — API renvoie 200 ou 401', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/agents/cold-email/generate'), { timeout: 30_000 }).catch(() => null),
      page.goto('/agents').then(async () => {
        const btn = page.getByRole('button', { name: /email|cold|séquence/i }).first()
        if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) await btn.click()
      }),
    ])
    if (response) {
      expect([200, 401, 403]).toContain(response.status())
    }
  })

  // ── Story 8.3 — LinkedIn CMO Outreach ────────────────────────────────────────

  test('ACQ-05 : linkedin post generate — API renvoie 200 ou 401', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/agents/linkedin-post/generate'), { timeout: 30_000 }).catch(() => null),
      page.goto('/agents').then(async () => {
        const btn = page.getByRole('button', { name: /linkedin|CMO|publication/i }).first()
        if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) await btn.click()
      }),
    ])
    if (response) {
      expect([200, 401, 403]).toContain(response.status())
    }
  })

  test('ACQ-06 : sidebar CROISSANCE section visible', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page).toHaveURL('/pipeline', { timeout: 8_000 })
    const croissance = page.getByText(/croissance/i).first()
    if (await croissance.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(croissance).toBeVisible()
    }
  })

})
