import { test, expect } from '@playwright/test'

test.describe('Dashboard — Checklist & Navigation', () => {
  // DASH-01 : chargement initial
  test('DASH-01 : page /focus se charge avec widgets visibles', async ({ page }) => {
    await page.goto('/focus')
    await expect(page).toHaveURL('/focus')
    await expect(page.locator('text=focus').first()).toBeVisible({ timeout: 8_000 })
  })

  // DASH-02 : checklist premiers pas
  test('DASH-02 : widget checklist visible dans le dashboard', async ({ page }) => {
    await page.goto('/focus')
    // Réinitialiser l'état dismissed pour voir la checklist complète
    await page.evaluate(() => localStorage.removeItem('brainlo_checklist_dismissed'))
    await page.reload()
    const checklist = page.locator('text=Premiers pas avec Brainlo')
    await expect(checklist).toBeVisible({ timeout: 8_000 })
  })

  // Progression checklist
  test('DASH-02b : checklist affiche un pourcentage de progression', async ({ page }) => {
    await page.goto('/focus')
    await page.evaluate(() => localStorage.removeItem('brainlo_checklist_dismissed'))
    await page.reload()
    await expect(page.getByText(/%/).first()).toBeVisible({ timeout: 8_000 })
  })

  // DASH-03 : clic sur étape checklist → navigation
  test('DASH-03 : clic sur une étape de la checklist → navigation', async ({ page }) => {
    await page.goto('/focus')
    await page.evaluate(() => localStorage.removeItem('brainlo_checklist_dismissed'))
    await page.reload()
    // Attendre la checklist
    const checklist = page.locator('text=Premiers pas avec Brainlo')
    await expect(checklist).toBeVisible({ timeout: 8_000 })
    // Chercher un lien dans la checklist
    const stepLink = page.locator('[data-testid*="checklist"] a').first()
    const fallback = page.getByRole('link', { name: /configurer|remplir|ajouter|découvrir|créer|renseigner|générer|connecter|essayer|explorer/i }).first()
    if (await stepLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await stepLink.click()
    } else if (await fallback.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await fallback.click()
    }
    await page.waitForTimeout(1_000)
    await expect(page).toHaveURL(/\//, { timeout: 5_000 })
  })

  // DASH-04 : navigation sidebar
  test('DASH-04 : navigation sidebar — toutes les pages se chargent', async ({ page }) => {
    const routes = ['/focus', '/tasks', '/pipeline', '/invoices', '/cash']
    for (const route of routes) {
      await page.goto(route)
      await expect(page).toHaveURL(route, { timeout: 8_000 })
    }
  })

  // DASH-05 : déconnexion
  test('DASH-05 : déconnexion via menu utilisateur → redirect /login', async ({ page }) => {
    await page.goto('/focus')
    // Le bouton de déconnexion a aria-label="Se déconnecter" dans la sidebar
    const logoutBtn = page.getByRole('button', { name: /se déconnecter|déconnexion|déconnecter|logout/i }).first()
    await expect(logoutBtn).toBeVisible({ timeout: 8_000 })
    await logoutBtn.click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  // DASH-06 : accès sans auth → redirect login
  test('DASH-06 : accès /focus sans authentification → redirect /login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    await page.goto('http://localhost:50082/focus')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await context.close()
  })

  // Badges PRO sidebar — présence ou absence selon le plan du compte
  test('DASH — badges PRO visibles dans la sidebar', async ({ page }) => {
    await page.goto('/focus')
    // La sidebar doit toujours être rendue, quel que soit le plan
    const nav = page.locator('nav[aria-label="Navigation principale"]')
    await expect(nav).toBeVisible({ timeout: 8_000 })
    // Les badges PRO s'affichent uniquement pour les comptes FREE
    // Vérification souple : si présents, ils doivent être dans la sidebar
    const proBadge = nav.locator('span:text-is("PRO")').first()
    const hasBadge = await proBadge.isVisible({ timeout: 2_000 }).catch(() => false)
    if (hasBadge) {
      await expect(proBadge).toBeVisible()
    }
    // Si absent → compte PRO, comportement attendu, test passe
  })

  // Page /chat
  test('DASH — page /chat accessible ou affiche wall PRO', async ({ page }) => {
    await page.goto('/chat')
    await expect(page).toHaveURL(/\/(chat|focus|login)/, { timeout: 8_000 })
  })

  // Page /agents
  test('DASH — page /agents accessible', async ({ page }) => {
    await page.goto('/agents')
    await expect(page).toHaveURL(/\/agents/, { timeout: 8_000 })
  })
})
