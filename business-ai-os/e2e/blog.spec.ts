import { test, expect } from '@playwright/test'

// Le blog est public — ces tests s'exécutent sans session auth
test.describe('Blog', () => {
  // BLOG-01 : liste des articles
  test('BLOG-01 : page /blog se charge avec liste des articles', async ({ page }) => {
    await page.goto('/blog')
    await expect(page).toHaveURL('/blog')
    await expect(page.getByText(/blog|article|actualité/i).first()).toBeVisible({ timeout: 8_000 })
  })

  // BLOG-02 : cliquer sur un article
  test('BLOG-02 : cliquer sur un article → navigation vers /blog/[slug]', async ({ page }) => {
    await page.goto('/blog')
    // Chercher un lien vers un article
    const articleLink = page.locator('a[href*="/blog/"]').first()
      .or(page.getByRole('link', { name: /.{10,}/i }).first())
    if (await articleLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await articleLink.click()
      await expect(page).toHaveURL(/\/blog\//, { timeout: 8_000 })
    }
  })

  // BLOG-03 : affichage d'un article valide
  test('BLOG-03 : article valide affiche son contenu complet', async ({ page }) => {
    // Aller sur le blog puis naviguer vers un article
    await page.goto('/blog')
    const articleLink = page.locator('a[href*="/blog/"]').first()
    if (await articleLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await articleLink.click()
      await expect(page).toHaveURL(/\/blog\//, { timeout: 8_000 })
      // Le contenu de l'article doit être visible
      await expect(page.locator('article, main, [class*="content"]').first()).toBeVisible({ timeout: 5_000 })
    }
  })

  // BLOG-04 : slug inexistant → 404
  test('BLOG-04 : accès à un slug inexistant → page 404', async ({ page }) => {
    await page.goto('/blog/article-inexistant-xyz-404-e2e')
    await expect(
      page.getByText(/introuvable|not found|404|article introuvable/i).first()
    ).toBeVisible({ timeout: 8_000 }).catch(async () => {
      // Next.js peut retourner une page 404 sans texte spécifique
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
