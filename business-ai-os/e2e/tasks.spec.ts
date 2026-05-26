import { test, expect } from '@playwright/test'

test.describe('Tâches', () => {
  test('page /tasks se charge', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page).toHaveURL('/tasks')
  })

  test('bouton "+ Nouvelle tâche" visible', async ({ page }) => {
    await page.goto('/tasks')
    const addBtn = page.getByRole('button', { name: /nouvelle tâche/i })
    await expect(addBtn.first()).toBeVisible({ timeout: 8_000 })
  })

  test('créer une tâche via le formulaire', async ({ page }) => {
    await page.goto('/tasks')
    await page.getByRole('button', { name: /nouvelle tâche/i }).first().click()
    // Wait for the form to appear — title input placeholder
    const titleInput = page.getByPlaceholder(/Relancer facture/i)
    await expect(titleInput).toBeVisible({ timeout: 5_000 })
    await titleInput.fill('Tâche Playwright E2E')
    await page.getByRole('button', { name: /créer la tâche/i }).click()
    await expect(page.getByText('Tâche Playwright E2E')).toBeVisible({ timeout: 8_000 })
  })
})
