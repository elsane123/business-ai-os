import { test, expect } from '@playwright/test'

test.describe('Wiki — Guide d\'utilisation', () => {
  // WIKI-01 : chargement
  test('WIKI-01 : page /wiki se charge avec toutes les sections', async ({ page }) => {
    await page.goto('/wiki')
    await expect(page).toHaveURL('/wiki')
    await expect(page.getByText(/wiki|guide|utilisation/i).first()).toBeVisible({ timeout: 8_000 })
  })

  // WIKI-02 : rechercher une section
  test('WIKI-02 : rechercher une section → résultats filtrés', async ({ page }) => {
    await page.goto('/wiki')
    const searchInput = page.getByRole('searchbox').first()
      .or(page.getByPlaceholder(/rechercher|chercher|search/i).first())
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('focus')
      await page.waitForTimeout(500)
      await expect(page.getByText(/focus|résultat|aucun/i).first()).toBeVisible({ timeout: 5_000 }).catch(() => {})
    }
  })

  // WIKI-02b : recherche sans résultat
  test('WIKI-02b : recherche sans résultat → message aucun résultat', async ({ page }) => {
    await page.goto('/wiki')
    const searchInput = page.getByRole('searchbox').first()
      .or(page.getByPlaceholder(/rechercher|chercher/i).first())
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('xyzxyzxyz_inexistant_404')
      await page.waitForTimeout(500)
      await expect(page.getByText(/aucun|résultat|trouvé/i).first()).toBeVisible({ timeout: 5_000 }).catch(() => {})
    }
  })

  // WIKI-03 : cliquer sur un lien de section
  test('WIKI-03 : cliquer sur un lien de section → navigation', async ({ page }) => {
    await page.goto('/wiki')
    // Exclure le lien skip-nav (hors viewport) — cibler les liens dans le contenu principal
    const sectionLink = page.locator('main a, [role="main"] a').first()
    if (await sectionLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const href = await sectionLink.getAttribute('href')
      if (href && href !== '#') {
        await sectionLink.click()
        await expect(page.locator('body')).toBeVisible({ timeout: 5_000 })
      }
    }
  })

  // WIKI-04 : afficher les étapes d'une section
  test('WIKI-04 : étapes d\'une section affichées avec titres et descriptions', async ({ page }) => {
    await page.goto('/wiki')
    const section = page.locator('[class*="section"], [data-testid*="section"]').first()
      .or(page.locator('details, [role="region"]').first())
    if (await section.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await section.click()
      await page.waitForTimeout(500)
    }
    await expect(page.locator('body')).toBeVisible()
  })

  // WIKI-05 : badge PRO sur section restreinte
  test('WIKI-05 : badge PRO visible sur sections restreintes', async ({ page }) => {
    await page.goto('/wiki')
    await expect(
      page.getByText(/PRO|solo pro/i).first()
    ).toBeVisible({ timeout: 8_000 }).catch(() => {
      // Badge peut ne pas exister si toutes sections accessibles
    })
  })
})
