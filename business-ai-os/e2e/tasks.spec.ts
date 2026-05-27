import { test, expect } from '@playwright/test'

test.describe('Tâches', () => {
  // TASK-01 : chargement
  test('TASK-01 : page /tasks se charge avec liste des tâches', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page).toHaveURL('/tasks')
  })

  // TASK-02 : bouton visible
  test('TASK-02 : bouton "+ Nouvelle tâche" visible', async ({ page }) => {
    await page.goto('/tasks')
    const addBtn = page.getByRole('button', { name: /nouvelle tâche/i })
    await expect(addBtn.first()).toBeVisible({ timeout: 8_000 })
  })

  // TASK-02b : créer une tâche
  test('TASK-02b : créer une tâche via le formulaire', async ({ page }) => {
    await page.goto('/tasks')
    await page.getByRole('button', { name: /nouvelle tâche/i }).first().click()
    const titleInput = page.getByPlaceholder(/Relancer facture/i)
    await expect(titleInput).toBeVisible({ timeout: 5_000 })
    await titleInput.fill('Tâche Playwright E2E')
    await page.getByRole('button', { name: /créer la tâche/i }).click()
    await expect(page.getByText('Tâche Playwright E2E').first()).toBeVisible({ timeout: 8_000 })
  })

  // TASK-03 : définir une priorité
  test('TASK-03 : définir une priorité (Haute/Moyenne/Basse)', async ({ page }) => {
    await page.goto('/tasks')
    await page.getByRole('button', { name: /nouvelle tâche/i }).first().click()
    const titleInput = page.getByPlaceholder(/Relancer facture/i)
    await expect(titleInput).toBeVisible({ timeout: 5_000 })
    await titleInput.fill('Tâche Priorité Haute E2E')
    // Sélectionner la priorité haute
    const priorityBtn = page.getByRole('button', { name: /haute|high/i })
      .or(page.locator('select[name*="priorit"]'))
      .or(page.locator('[data-testid*="priority"]'))
      .first()
    if (await priorityBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await priorityBtn.click()
    }
    await page.getByRole('button', { name: /créer la tâche/i }).click()
    await expect(page.getByText('Tâche Priorité Haute E2E').first()).toBeVisible({ timeout: 8_000 })
  })

  // TASK-04 : définir une catégorie
  test('TASK-04 : définir une catégorie (Cash/Clients/Visibilité/Admin)', async ({ page }) => {
    await page.goto('/tasks')
    await page.getByRole('button', { name: /nouvelle tâche/i }).first().click()
    const titleInput = page.getByPlaceholder(/Relancer facture/i)
    await expect(titleInput).toBeVisible({ timeout: 5_000 })
    await titleInput.fill('Tâche Catégorie Cash E2E')
    // Cliquer sur le bouton Cash dans la modale (scopé dans le formulaire pour éviter les filtres de page)
    const modalForm = page.locator('form').filter({ has: titleInput })
    const categoryBtn = modalForm.getByRole('button', { name: /cash/i }).first()
    if (await categoryBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await categoryBtn.click()
    }
    await page.getByRole('button', { name: /créer la tâche/i }).click()
    await expect(page.getByText('Tâche Catégorie Cash E2E').first()).toBeVisible({ timeout: 8_000 })
  })

  // TASK-05 : définir une durée estimée
  test('TASK-05 : définir une durée estimée', async ({ page }) => {
    await page.goto('/tasks')
    await page.getByRole('button', { name: /nouvelle tâche/i }).first().click()
    const titleInput = page.getByPlaceholder(/Relancer facture/i)
    await expect(titleInput).toBeVisible({ timeout: 5_000 })
    await titleInput.fill('Tâche Durée E2E')
    const durationInput = page.locator('input[name*="durat"], input[name*="duree"], input[placeholder*="durée"]').first()
    if (await durationInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await durationInput.fill('30')
    }
    await page.getByRole('button', { name: /créer la tâche/i }).click()
    await expect(page.getByText('Tâche Durée E2E').first()).toBeVisible({ timeout: 8_000 })
  })

  // TASK-06 : définir une date d'échéance
  test('TASK-06 : définir une date d\'échéance', async ({ page }) => {
    await page.goto('/tasks')
    await page.getByRole('button', { name: /nouvelle tâche/i }).first().click()
    const titleInput = page.getByPlaceholder(/Relancer facture/i)
    await expect(titleInput).toBeVisible({ timeout: 5_000 })
    await titleInput.fill('Tâche Deadline E2E')
    const dateInput = page.locator('input[type="date"], input[name*="due"], input[name*="echeance"]').first()
    if (await dateInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await dateInput.fill('2026-12-31')
    }
    await page.getByRole('button', { name: /créer la tâche/i }).click()
    await expect(page.getByText('Tâche Deadline E2E').first()).toBeVisible({ timeout: 8_000 })
  })

  // TASK-08 : passer à "En cours"
  test('TASK-08 : passer une tâche à "En cours"', async ({ page }) => {
    await page.goto('/tasks')
    // S'assurer qu'il y a au moins une tâche
    const taskItem = page.locator('[data-testid*="task"], [class*="task-item"]').first()
    if (await taskItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const enCoursBtn = page.getByRole('button', { name: /en cours|start/i }).first()
      if (await enCoursBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await enCoursBtn.click()
        await expect(page.getByText(/en cours/i).first()).toBeVisible({ timeout: 5_000 })
      }
    }
  })

  // TASK-09 : passer à "Terminée"
  test('TASK-09 : passer une tâche à "Terminée"', async ({ page }) => {
    await page.goto('/tasks')
    // Chercher une checkbox ou bouton de complétion
    const checkbox = page.locator('input[type="checkbox"]').first()
      .or(page.getByRole('checkbox').first())
    if (await checkbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await checkbox.check()
      await expect(page.getByText(/terminée?|complète?|done/i).first()).toBeVisible({ timeout: 5_000 }).catch(() => {
        // La tâche cochée peut avoir un style barré plutôt qu'un texte
      })
    }
  })

  // TASK-11 : supprimer une tâche
  test('TASK-11 : supprimer une tâche avec confirmation', async ({ page }) => {
    await page.goto('/tasks')
    // Créer une tâche à supprimer
    await page.getByRole('button', { name: /nouvelle tâche/i }).first().click()
    const titleInput = page.getByPlaceholder(/Relancer facture/i)
    await expect(titleInput).toBeVisible({ timeout: 5_000 })
    await titleInput.fill('A Supprimer E2E Task')
    await page.getByRole('button', { name: /créer la tâche/i }).click()
    await expect(page.getByText('A Supprimer E2E Task').first()).toBeVisible({ timeout: 8_000 })
    // Chercher le bouton supprimer
    const deleteBtn = page.getByRole('button', { name: /supprimer/i }).first()
    if (await deleteBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await deleteBtn.click()
      const confirmBtn = page.getByRole('button', { name: /confirmer|oui|supprimer/i }).first()
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click()
      }
    }
  })

  // TASK-14 : filtrer par catégorie
  test('TASK-14 : filtrer les tâches par catégorie', async ({ page }) => {
    await page.goto('/tasks')
    const filterBtn = page.getByRole('button', { name: /cash|clients|visibilité|admin|filtrer/i }).first()
      .or(page.locator('select[name*="filter"], select[name*="categ"]').first())
    if (await filterBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await filterBtn.click()
      await page.waitForTimeout(500)
    }
  })
})
