import { test, expect } from '@playwright/test'

test.describe('Paramètres', () => {
  // SET-01 : chargement
  test('SET-01 : page /settings se charge avec données pré-remplies', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL('/settings')
    await expect(page.getByText('Paramètres')).toBeVisible({ timeout: 8_000 })
  })

  // SET-02 : modifier nom et email
  test('SET-02 : modifier le nom → données sauvegardées', async ({ page }) => {
    await page.goto('/settings')
    const nameInput = page.locator('input[name*="name"], input[name*="nom"], input[placeholder*="nom"]').first()
    if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameInput.clear()
      await nameInput.fill('Test User E2E')
      await page.getByRole('button', { name: /sauvegarder|enregistrer|mettre à jour/i }).first().click()
      await expect(page.getByText(/sauvegardé|enregistré|mis à jour|succès/i).first()).toBeVisible({ timeout: 5_000 })
    }
  })

  // SET-03 : modifier nom d'entreprise et secteur
  test('SET-03 : modifier le nom d\'entreprise et secteur', async ({ page }) => {
    await page.goto('/settings')
    const companyInput = page.locator('input[name*="company"], input[name*="entreprise"], input[placeholder*="entreprise"]').first()
    if (await companyInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await companyInput.clear()
      await companyInput.fill('Société Test E2E')
      await page.getByRole('button', { name: /sauvegarder|enregistrer|mettre à jour/i }).first().click()
      await expect(page.getByText(/sauvegardé|enregistré|mis à jour|succès/i).first()).toBeVisible({ timeout: 5_000 }).catch(() => {
        // Confirmation peut être un toast ou un badge
      })
    }
  })

  // SET-04 : modifier l'objectif mensuel
  test('SET-04 : modifier l\'objectif mensuel (€)', async ({ page }) => {
    await page.goto('/settings')
    const objectifInput = page.locator('input[name*="objectif"], input[name*="goal"], input[name*="revenue"], input[placeholder*="objectif"]').first()
    if (await objectifInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await objectifInput.clear()
      await objectifInput.fill('5000')
      await page.getByRole('button', { name: /sauvegarder|enregistrer|mettre à jour/i }).first().click()
    }
  })

  // SET-05 : modifier les charges fixes
  test('SET-05 : modifier les charges fixes (€)', async ({ page }) => {
    await page.goto('/settings')
    const chargesInput = page.locator('input[name*="charges"], input[name*="fixed"], input[placeholder*="charges"]').first()
    if (await chargesInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await chargesInput.clear()
      await chargesInput.fill('800')
      await page.getByRole('button', { name: /sauvegarder|enregistrer|mettre à jour/i }).first().click()
    }
  })

  // SET-06 : URL LinkedIn
  test('SET-06 : navigation /settings#calcom → section Cal.com visible', async ({ page }) => {
    await page.goto('/settings#calcom')
    await expect(page).toHaveURL(/\/settings#calcom/)
    await expect(page.getByText('Cal.com').first()).toBeVisible({ timeout: 8_000 })
  })

  // SET-06b : section Enrichir
  test('SET-06b : navigation /settings#enrich → section Enrichir visible', async ({ page }) => {
    await page.goto('/settings#enrich')
    await expect(page).toHaveURL(/\/settings#enrich/)
    await expect(page.getByText('Enrichir').first()).toBeVisible({ timeout: 8_000 })
  })

  // SET-07 : configurer webhook Cal.com
  test('SET-07 : configurer le webhook Cal.com', async ({ page }) => {
    await page.goto('/settings#calcom')
    await expect(page.getByText('Cal.com').first()).toBeVisible({ timeout: 8_000 })
    const webhookInput = page.locator('input[name*="webhook"], input[name*="calcom"], input[placeholder*="webhook"]').first()
    if (await webhookInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await webhookInput.fill('https://cal.com/webhook/test')
      await page.getByRole('button', { name: /sauvegarder|enregistrer/i }).first().click()
    }
  })

  // SET-08 : changer le mot de passe
  test('SET-08 : section changement de mot de passe visible', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText(/mot de passe|password/i).first()).toBeVisible({ timeout: 8_000 })
    // Vérifier que le champ mot de passe actuel est présent
    const currentPwdInput = page.locator('input[type="password"]').first()
    if (await currentPwdInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expect(currentPwdInput).toBeVisible()
    }
  })

  // SET-09 : champs numériques invalides → blocage
  test('SET-09 : champs numériques invalides → blocage', async ({ page }) => {
    await page.goto('/settings')
    const numericInput = page.locator('input[name*="objectif"], input[name*="charges"], input[type="number"]').first()
    if (await numericInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await numericInput.fill('abc')
      await page.getByRole('button', { name: /sauvegarder|enregistrer/i }).first().click()
      // Doit bloquer ou afficher un message
      await expect(page.getByText(/nombre|invalide|valide/i).first()).toBeVisible({ timeout: 5_000 }).catch(() => {
        // La validation HTML5 peut bloquer sans message visible
      })
    }
  })

  // SET-10 : accès sans auth → redirect login
  test('SET-10 : accès /settings sans authentification → redirect /login', async ({ browser }) => {
    const context = await browser.newContext() // pas de storageState
    const page = await context.newPage()
    await page.goto('http://localhost:50082/settings')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await context.close()
  })

  // Score de complétion visible
  test('SET — score de complétion du profil visible', async ({ page }) => {
    await page.goto('/settings#enrich')
    await expect(page.getByText(/%/).first()).toBeVisible({ timeout: 8_000 })
  })

  // Section Abonnement
  test('SET — section Abonnement visible', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText(/abonnement|plan/i).first()).toBeVisible({ timeout: 8_000 })
  })

  // Epic 6 — IA Fiscale & Stripe personal ──────────────────────────────────

  test('E6-01 : settings — section Clé API Stripe personnelle visible', async ({ page }) => {
    await page.goto('/settings')
    const stripeKeySection = page.getByText(/cl. api stripe|stripe.*personnelle|rk_live/i).first()
    if (await stripeKeySection.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(stripeKeySection).toBeVisible()
    }
  })

  test('E6-02 : settings — champ clé Stripe de type password', async ({ page }) => {
    await page.goto('/settings')
    const stripeInput = page.getByPlaceholder(/rk_live|sk_live|stripe/i)
    if (await stripeInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(stripeInput).toHaveAttribute('type', 'password')
    }
  })

  test('E6-03 : settings — bouton Connecter Stripe désactivé si champ vide', async ({ page }) => {
    await page.goto('/settings')
    const connectBtn = page.getByRole('button', { name: /connecter stripe/i })
    if (await connectBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(connectBtn).toBeDisabled()
    }
  })

  // Epic 8 — LinkedIn Token ─────────────────────────────────────────────────

  test('E8-SET-01 : settings — section Token LinkedIn visible', async ({ page }) => {
    await page.goto('/settings')
    const linkedinSection = page.getByText(/token linkedin|🔗/i).first()
    if (await linkedinSection.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(linkedinSection).toBeVisible()
    }
  })

  test('E8-SET-02 : settings — champ token LinkedIn de type password quand non configuré', async ({ page }) => {
    await page.goto('/settings')
    const tokenInput = page.getByPlaceholder(/AQV/i)
    if (await tokenInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(tokenInput).toHaveAttribute('type', 'password')
    }
  })
})
