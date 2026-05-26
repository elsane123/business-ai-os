import { test, expect } from '@playwright/test'

test.describe('Paramètres', () => {
  test('page /settings se charge', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL('/settings')
    await expect(page.getByText('Paramètres')).toBeVisible({ timeout: 8_000 })
  })

  test('navigation /settings#calcom scroll vers section Cal.com', async ({ page }) => {
    await page.goto('/settings#calcom')
    await expect(page).toHaveURL(/\/settings#calcom/)
    await expect(page.getByText('Cal.com').first()).toBeVisible({ timeout: 8_000 })
  })

  test('navigation /settings#enrich scroll vers section Enrichir', async ({ page }) => {
    await page.goto('/settings#enrich')
    await expect(page).toHaveURL(/\/settings#enrich/)
    await expect(page.getByText('Enrichir').first()).toBeVisible({ timeout: 8_000 })
  })

  test('score de complétion du profil visible', async ({ page }) => {
    await page.goto('/settings#enrich')
    // Score bar and percentage should be visible
    await expect(page.getByText(/%/).first()).toBeVisible({ timeout: 8_000 })
  })

  test('section Abonnement visible', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText(/abonnement|plan/i).first()).toBeVisible({ timeout: 8_000 })
  })
})
