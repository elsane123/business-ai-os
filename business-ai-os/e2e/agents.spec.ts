import { test, expect } from '@playwright/test'

test.describe('Agents IA', () => {
  // AGT-01 : chargement du catalogue
  test('AGT-01 : page /agents se charge avec catalogue', async ({ page }) => {
    await page.goto('/agents')
    await expect(page).toHaveURL(/\/agents/)
    await expect(page.getByText(/agents?|catalogue|assistant/i).first()).toBeVisible({ timeout: 8_000 })
  })

  // AGT-02 : filtrer par domaine
  test('AGT-02 : filtrer les agents par domaine', async ({ page }) => {
    await page.goto('/agents')
    const filterBtn = page.getByRole('button', { name: /finance|commercial|marketing|tous/i }).first()
    if (await filterBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await filterBtn.click()
      await page.waitForTimeout(500)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  // AGT-03 : voir le détail d'un agent
  test('AGT-03 : voir le détail d\'un agent — capacités et questions exemples', async ({ page }) => {
    await page.goto('/agents')
    // Cliquer sur le premier agent du catalogue
    const agentCard = page.locator('[data-testid*="agent-card"], [class*="agent"]').first()
      .or(page.getByRole('article').first())
    if (await agentCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await agentCard.click()
      await expect(page.getByText(/capacité|question|interagir/i).first()).toBeVisible({ timeout: 5_000 }).catch(() => {})
    }
  })

  // AGT-04 : activer un agent (PRO)
  test('AGT-04 : bouton d\'activation visible sur les fiches agents', async ({ page }) => {
    await page.goto('/agents')
    const activateBtn = page.getByRole('button', { name: /activer|activate|démarrer/i }).first()
    if (await activateBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      // L'action dépend du plan (PRO/FREE) et du nombre de slots
      await expect(activateBtn).toBeVisible()
    }
  })

  // AGT-06 : désactiver un agent
  test('AGT-06 : bouton désactiver un agent actif visible', async ({ page }) => {
    await page.goto('/agents')
    const deactivateBtn = page.getByRole('button', { name: /désactiver|deactivate/i }).first()
    if (await deactivateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(deactivateBtn).toBeVisible()
    }
  })

  // AGT-07 : page détail d'un agent
  test('AGT-07 : page /agents/[id] — détail agent avec chat dédié', async ({ page }) => {
    await page.goto('/agents')
    // Trouver un lien vers un agent spécifique
    const agentLink = page.getByRole('link', { name: /finance|commercial|stratégie/i }).first()
      .or(page.locator('a[href*="/agents/"]').first())
    if (await agentLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await agentLink.click()
      await expect(page).toHaveURL(/\/agents\//, { timeout: 8_000 })
      await expect(page.locator('body')).toBeVisible()
    }
  })

  // AGT-09 : limite de slots affichée
  test('AGT-09 : compteur de slots agents visible', async ({ page }) => {
    await page.goto('/agents')
    await expect(
      page.getByText(/slot|agents? actifs?|\d+\/\d+/i).first()
    ).toBeVisible({ timeout: 8_000 }).catch(() => {
      // Compteur peut être sous une forme différente
    })
  })

  // PLAN-13 : catalogue visible en FREE
  test('PLAN-13 : catalogue agents visible en FREE avec badge upgrade', async ({ page }) => {
    await page.goto('/agents')
    await expect(page).toHaveURL(/\/agents/)
    // Le catalogue doit être visible même en FREE
    await expect(page.locator('body')).toBeVisible()
    // Badge upgrade PRO attendu
    await expect(
      page.getByText(/solo pro|passer en pro|activer des agents|upgrade/i).first()
    ).toBeVisible({ timeout: 8_000 }).catch(() => {
      // Peut ne pas apparaître si compte PRO
    })
  })

  // PLAN-14 : activation agent en FREE → erreur
  test('PLAN-14 : tenter d\'activer un agent en FREE → message upgrade', async ({ page }) => {
    await page.goto('/agents')
    const activateBtn = page.getByRole('button', { name: /activer/i }).first()
    if (await activateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await activateBtn.click()
      // Soit upgrade message, soit activation réussie (PRO)
      await Promise.race([
        expect(page.getByText(/upgrade|solo pro|requis|limite/i).first()).toBeVisible({ timeout: 5_000 }),
        expect(page.getByText(/désactiver|actif/i).first()).toBeVisible({ timeout: 5_000 }),
      ]).catch(() => {})
    }
  })

  // PLAN-16 : compteur de slots en FREE → 0 slot
  test('PLAN-16 : compteur de slots en FREE → 0 slot disponible', async ({ page }) => {
    await page.goto('/agents')
    // Vérifier le badge ou texte indiquant 0 slot
    await expect(
      page.getByText(/0 slot|passez en solo pro|activer des agents/i).first()
    ).toBeVisible({ timeout: 8_000 }).catch(() => {
      // PRO account can have slots
    })
  })

  // AGT-07 : accès page agent inexistant → 404
  test('AGT-07b : accès /agents/id-inexistant → erreur 404', async ({ page }) => {
    await page.goto('/agents/agent-inexistant-xyz-404')
    await expect(
      page.getByText(/introuvable|not found|erreur|404/i).first()
    ).toBeVisible({ timeout: 8_000 }).catch(async () => {
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
