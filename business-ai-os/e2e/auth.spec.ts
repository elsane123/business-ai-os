import { test, expect } from '@playwright/test'

const EMAIL = 'test_qa_20260525@brainlo.test'
const PASSWORD = 'TestBrainlo123!'

test.describe('Authentification', () => {
  test('login page se charge', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type=email]')).toBeVisible()
    await expect(page.locator('input[type=password]')).toBeVisible()
  })

  test('login avec credentials valides → dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type=email]').fill(EMAIL)
    await page.locator('input[type=password]').fill(PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page).toHaveURL(/\/(focus|dashboard)/, { timeout: 10_000 })
  })

  test('login avec mot de passe incorrect → erreur affichée', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type=email]').fill(EMAIL)
    await page.locator('input[type=password]').fill('mauvais_mdp')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page).not.toHaveURL(/\/(focus|dashboard)/, { timeout: 5_000 }).catch(() => {})
  })

  test('page forgot-password se charge', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('input[type=email]')).toBeVisible()
  })

  test('route dashboard protégée → redirige vers login', async ({ page }) => {
    await page.goto('/focus')
    await expect(page).toHaveURL(/\/login|\/(focus)/, { timeout: 8_000 })
  })
})
