import { test, expect } from '@playwright/test'

test.describe('Dashboard — Checklist & Navigation', () => {
  test('page /focus se charge', async ({ page }) => {
    await page.goto('/focus')
    await expect(page).toHaveURL('/focus')
    await expect(page.locator('text=focus').first()).toBeVisible({ timeout: 8_000 })
  })

  test('widget checklist visible dans le dashboard', async ({ page }) => {
    await page.goto('/focus')
    // Checklist widget should appear
    const checklist = page.locator('text=Premiers pas avec Brainlo')
    await expect(checklist).toBeVisible({ timeout: 8_000 })
  })

  test('checklist affiche un pourcentage de progression', async ({ page }) => {
    await page.goto('/focus')
    await expect(page.locator('text=/%/')).toBeVisible({ timeout: 8_000 }).catch(async () => {
      // percent shown as XX%
      await expect(page.getByText(/%/).first()).toBeVisible({ timeout: 3_000 })
    })
  })

  test('badges PRO visibles dans la sidebar', async ({ page }) => {
    await page.goto('/focus')
    const proBadges = page.locator('text=PRO')
    await expect(proBadges.first()).toBeVisible({ timeout: 8_000 })
  })

  test('navigation sidebar — toutes les pages se chargent', async ({ page }) => {
    const routes = ['/focus', '/tasks', '/pipeline', '/invoices', '/cash']
    for (const route of routes) {
      await page.goto(route)
      await expect(page).toHaveURL(route, { timeout: 8_000 })
    }
  })

  test('page /chat redirige ou affiche wall PRO', async ({ page }) => {
    await page.goto('/chat')
    // Either accessible or shows upgrade prompt — both are valid
    await expect(page).toHaveURL(/\/(chat|focus|login)/, { timeout: 8_000 })
  })

  test('page /agents accessible', async ({ page }) => {
    await page.goto('/agents')
    await expect(page).toHaveURL(/\/agents/, { timeout: 8_000 })
  })
})
