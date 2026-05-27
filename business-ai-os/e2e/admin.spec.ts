import { test, expect } from '@playwright/test'

// NOTE : ces tests nécessitent un compte administrateur
// Le compte de test standard (test_qa_20260525@brainlo.test) est un compte client
// → ADM-01 et ADM-02 sont testables avec le compte client standard
// → ADM-03 à ADM-07 nécessitent un compte admin dédié

test.describe('Administration', () => {
  // ADM-01 : accès avec compte client → 403 ou redirect
  test('ADM-01 : accès /admin avec compte client → accès refusé', async ({ page }) => {
    await page.goto('/admin')
    // Un compte client standard ne doit pas accéder à /admin
    await expect(page).not.toHaveURL('/admin', { timeout: 8_000 }).catch(async () => {
      // Si la page /admin se charge, vérifier qu'un message 403 s'affiche
      await expect(
        page.getByText(/accès non autorisé|non autorisé|403|interdit/i).first()
      ).toBeVisible({ timeout: 5_000 })
    })
  })

  // ADM-02 : accès sans auth → redirect login
  test('ADM-02 : accès /admin sans authentification → redirect /login', async ({ browser }) => {
    const context = await browser.newContext() // pas de storageState
    const page = await context.newPage()
    await page.goto('http://localhost:50082/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await context.close()
  })

  // ADM-02b : accès /admin/users sans auth → redirect login
  test('ADM-02b : accès /admin/users sans auth → redirect /login', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('http://localhost:50082/admin/users')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await context.close()
  })

  // ADM-03 à ADM-07 : nécessitent un compte admin
  // Ces tests sont à exécuter avec un contexte admin (storageState admin)
  // Marqués comme skip en l'absence d'un compte admin de test configuré

  test.skip('ADM-03 : accès avec compte admin → dashboard admin affiché', async ({ page }) => {
    // Configurer storageState admin dans playwright.config.ts pour activer
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin', { timeout: 8_000 })
    await expect(page.getByText(/admin|tableau de bord|utilisateurs/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test.skip('ADM-04 : liste des utilisateurs /admin/users', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page).toHaveURL('/admin/users', { timeout: 8_000 })
    await expect(page.getByRole('table').first()).toBeVisible({ timeout: 8_000 })
  })

  test.skip('ADM-05 : détail utilisateur /admin/users/[id]', async ({ page }) => {
    await page.goto('/admin/users')
    const userLink = page.getByRole('link').first()
    if (await userLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await userLink.click()
      await expect(page).toHaveURL(/\/admin\/users\//, { timeout: 8_000 })
    }
  })

  test.skip('ADM-06 : modifier le plan d\'un utilisateur FREE → PRO', async ({ page }) => {
    await page.goto('/admin/users')
    const planBtn = page.getByRole('button', { name: /modifier le plan|passer en pro|upgrade/i }).first()
    if (await planBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await planBtn.click()
      await expect(page.getByText(/pro|mis à jour/i).first()).toBeVisible({ timeout: 5_000 })
    }
  })

  test.skip('ADM-07 : désactiver un compte utilisateur', async ({ page }) => {
    await page.goto('/admin/users')
    const disableBtn = page.getByRole('button', { name: /désactiver|bloquer/i }).first()
    if (await disableBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await disableBtn.click()
      const confirmBtn = page.getByRole('button', { name: /confirmer|oui/i }).first()
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click()
      }
    }
  })
})
