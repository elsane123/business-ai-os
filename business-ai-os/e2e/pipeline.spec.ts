import { test, expect } from '@playwright/test'

test.describe('Pipeline — Gestion des prospects', () => {
  test('page /pipeline se charge', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page).toHaveURL('/pipeline')
  })

  test('bouton "+ Nouveau prospect" visible', async ({ page }) => {
    await page.goto('/pipeline')
    const addBtn = page.getByRole('button', { name: /nouveau prospect/i })
    await expect(addBtn.first()).toBeVisible({ timeout: 8_000 })
  })

  test('créer un prospect via le formulaire', async ({ page }) => {
    await page.goto('/pipeline')
    await page.getByRole('button', { name: /nouveau prospect/i }).first().click()
    // Wait for modal — name input has placeholder "Sophie Martin"
    const nameInput = page.getByPlaceholder('Sophie Martin')
    await expect(nameInput).toBeVisible({ timeout: 5_000 })
    await nameInput.fill('Playwright E2E Prospect')
    await page.getByRole('button', { name: /ajouter|enregistrer|créer|sauvegarder/i }).first().click()
    await expect(page.getByText('Playwright E2E Prospect').first()).toBeVisible({ timeout: 8_000 })
  })
})
