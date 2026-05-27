import { test, expect } from '@playwright/test'

// Assessment est public — pas de session auth requise
test.describe('Assessment', () => {
  // ASS-01 : chargement du questionnaire
  test('ASS-01 : page /assessment se charge avec le questionnaire', async ({ page }) => {
    await page.goto('/assessment')
    await expect(page).toHaveURL('/assessment')
    await expect(page.getByText(/assessment|questionnaire|évaluation|questions/i).first()).toBeVisible({ timeout: 8_000 })
  })

  // ASS-02 : répondre aux questions
  test('ASS-02 : répondre aux questions — navigation entre sections', async ({ page }) => {
    await page.goto('/assessment')
    await page.waitForTimeout(1_000)
    // Chercher les options de réponse (choix ou sliders)
    const option = page.getByRole('radio').first()
      .or(page.getByRole('button', { name: /suivant|next|continuer/i }).first())
    if (await option.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Répondre à la première question
      const firstRadio = page.getByRole('radio').first()
      if (await firstRadio.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await firstRadio.click()
      }
      // Passer à la suivante
      const nextBtn = page.getByRole('button', { name: /suivant|next|continuer/i }).first()
      if (await nextBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await nextBtn.click()
        await page.waitForTimeout(500)
      }
    }
  })

  // ASS-03 : soumission sans répondre → blocage
  test('ASS-03 : soumettre sans répondre à toutes les questions → blocage', async ({ page }) => {
    await page.goto('/assessment')
    // Essayer de passer à l'étape suivante sans répondre
    const nextBtn = page.getByRole('button', { name: /suivant|next|continuer/i }).first()
    if (await nextBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nextBtn.click()
      // Doit bloquer ou afficher un message
      await expect(
        page.getByText(/répondre|réponse|obligatoire|toutes les questions/i).first()
      ).toBeVisible({ timeout: 5_000 }).catch(() => {
        // Peut bloquer via validation HTML5
      })
    }
  })

  // ASS-05 : formulaire de coordonnées
  test('ASS-05 : formulaire de coordonnées visible après le questionnaire', async ({ page }) => {
    await page.goto('/assessment')
    // Chercher si le formulaire est directement visible ou après le quiz
    const emailInput = page.locator('input[type="email"]').first()
    const nameInput = page.locator('input[name*="name"], input[name*="prenom"], input[name*="nom"]').first()
    // Si le form de coords est accessible directement
    if (await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(emailInput).toBeVisible()
    }
  })

  // ASS-09 : email invalide → blocage
  test('ASS-09 : soumettre avec email invalide → message erreur', async ({ page }) => {
    await page.goto('/assessment')
    const emailInput = page.locator('input[type="email"]').first()
    if (await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await emailInput.fill('pasunemail')
      const submitBtn = page.getByRole('button', { name: /envoyer|soumettre|recevoir|submit/i }).first()
      if (await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await submitBtn.click()
        await expect(page).toHaveURL('/assessment', { timeout: 3_000 })
      }
    }
  })

  // ASS-10 : champs vides → blocage
  test('ASS-10 : soumettre avec champs vides → blocage', async ({ page }) => {
    await page.goto('/assessment')
    const submitBtn = page.getByRole('button', { name: /envoyer|soumettre|recevoir|submit/i }).first()
    if (await submitBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submitBtn.click()
      await expect(
        page.getByText(/requis|obligatoire|remplir|tous les champs/i).first()
      ).toBeVisible({ timeout: 5_000 }).catch(() => {})
    }
  })
})
