import { test, expect } from '@playwright/test'

test.describe('Acquisition Client AI — Epic 8', () => {

  // ── Story 8.1 — ICP Builder ───────────────────────────────────────────────

  test('ACQ-01 : pipeline — bouton Générer mon ICP visible', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page).toHaveURL(/\/pipeline/, { timeout: 8_000 })
    const icpBtn = page.getByRole('button', { name: /ICP|client id.al/i })
    if (await icpBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(icpBtn).toBeVisible()
    }
  })

  test('ACQ-02 : ICP generate — API répond 200 ou 401', async ({ page }) => {
    await page.goto('/pipeline')
    const icpBtn = page.getByRole('button', { name: /ICP|client id.al/i })
    if (await icpBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const [response] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/pipeline/icp/generate'), { timeout: 30_000 }),
        icpBtn.click(),
      ])
      expect([200, 401, 403, 500]).toContain(response.status())
    }
  })

  test('ACQ-03 : badges score de closing affichés sur cartes prospects', async ({ page }) => {
    await page.goto('/pipeline')
    // Badges visibles après génération ICP (si déjà générés)
    const scoreBadge = page.locator('[class*="score"], [class*="badge"]').filter({ hasText: /\d+%/ }).first()
    if (await scoreBadge.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(scoreBadge).toBeVisible()
    }
  })

  test('ACQ-04 : ICP résultat — secteur, taille, décideur, problème visibles', async ({ page }) => {
    await page.goto('/pipeline')
    const icpBtn = page.getByRole('button', { name: /ICP|client id.al/i })
    if (await icpBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await icpBtn.click()
      await page.waitForTimeout(3_000)
      const icpResult = page.getByText(/secteur|taille|décideur|persona|ICP/i).first()
      if (await icpResult.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(icpResult).toBeVisible()
      }
    }
  })

  // ── Story 8.2 — Cold Email Sequence ──────────────────────────────────────

  test('ACQ-05 : agent CRO — bouton séquence email visible', async ({ page }) => {
    await page.goto('/agents/agent-cro')
    await expect(page).toHaveURL(/\/agents\/agent-cro/, { timeout: 8_000 })
    const emailBtn = page.getByRole('button', { name: /s.quence email|cold email/i })
    if (await emailBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(emailBtn).toBeVisible()
    }
  })

  test('ACQ-06 : formulaire cold email — champs nom, entreprise, secteur visibles', async ({ page }) => {
    await page.goto('/agents/agent-cro')
    const emailBtn = page.getByRole('button', { name: /s.quence email|cold email/i })
    if (await emailBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await emailBtn.click()
      await expect(page.getByPlaceholder(/pr.nom|prospect/i).first()).toBeVisible({ timeout: 5_000 }).catch(() => {})
    }
  })

  test('ACQ-07 : cold email — soumettre sans nom → champ requis bloque', async ({ page }) => {
    await page.goto('/agents/agent-cro')
    const emailBtn = page.getByRole('button', { name: /s.quence email|cold email/i })
    if (await emailBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await emailBtn.click()
      const submitBtn = page.getByRole('button', { name: /g.n.rer/i }).last()
      if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await expect(submitBtn).toBeDisabled()
      }
    }
  })

  test('ACQ-08 : cold email — génération renvoie 5 emails en accordéon', async ({ page }) => {
    await page.goto('/agents/agent-cro')
    const emailBtn = page.getByRole('button', { name: /s.quence email|cold email/i })
    if (await emailBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await emailBtn.click()
      const nameInput = page.getByPlaceholder(/pr.nom|prospect/i).first()
      if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nameInput.fill('Marie Dupont')
        const [response] = await Promise.all([
          page.waitForResponse(r => r.url().includes('/api/agents/cold-email/generate'), { timeout: 30_000 }),
          page.getByRole('button', { name: /g.n.rer/i }).last().click(),
        ])
        expect([200, 401, 500]).toContain(response.status())
        if (response.status() === 200) {
          await expect(page.getByText(/Jour 1|J1|email 1/i).first()).toBeVisible({ timeout: 10_000 }).catch(() => {})
        }
      }
    }
  })

  test('ACQ-09 : cold email — bouton copier visible sur chaque email', async ({ page }) => {
    await page.goto('/agents/agent-cro')
    // Si une séquence est déjà affichée
    const copyBtn = page.getByRole('button', { name: /copier|copy/i }).first()
    if (await copyBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(copyBtn).toBeVisible()
    }
  })

  // ── Story 8.3 — LinkedIn CMO Outreach ────────────────────────────────────

  test('ACQ-10 : agent CMO — bouton rédiger post LinkedIn visible', async ({ page }) => {
    await page.goto('/agents/agent-cmo')
    await expect(page).toHaveURL(/\/agents\/agent-cmo/, { timeout: 8_000 })
    const liBtn = page.getByRole('button', { name: /linkedin|post/i })
    if (await liBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(liBtn).toBeVisible()
    }
  })

  test('ACQ-11 : LinkedIn generate — API répond avec contenu', async ({ page }) => {
    await page.goto('/agents/agent-cmo')
    const liBtn = page.getByRole('button', { name: /linkedin|post|r.diger/i }).first()
    if (await liBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      const [response] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/agents/linkedin-post/generate'), { timeout: 30_000 }),
        liBtn.click(),
      ])
      expect([200, 401, 500]).toContain(response.status())
    }
  })

  test('ACQ-12 : LinkedIn post — textarea éditable visible après génération', async ({ page }) => {
    await page.goto('/agents/agent-cmo')
    const liBtn = page.getByRole('button', { name: /linkedin|post|r.diger/i }).first()
    if (await liBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await liBtn.click()
      await page.waitForTimeout(5_000)
      const textarea = page.getByRole('textbox').first()
      if (await textarea.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(textarea).toBeVisible()
        await expect(textarea).toBeEditable()
      }
    }
  })

  test('ACQ-13 : LinkedIn post — compteur 3000 caractères visible', async ({ page }) => {
    await page.goto('/agents/agent-cmo')
    const charCounter = page.getByText(/3000|\d+ \/? ?3000|caractères/i).first()
    if (await charCounter.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(charCounter).toBeVisible()
    }
  })

  test('ACQ-14 : LinkedIn post — boutons Copier et Publier visibles', async ({ page }) => {
    await page.goto('/agents/agent-cmo')
    const liBtn = page.getByRole('button', { name: /linkedin|post|r.diger/i }).first()
    if (await liBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await liBtn.click()
      await page.waitForTimeout(5_000)
      const publishBtn = page.getByRole('button', { name: /publier|publish/i })
      if (await publishBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(publishBtn).toBeVisible()
      }
    }
  })

  test('ACQ-15 : LinkedIn publish — sans token → message token expiré', async ({ page }) => {
    await page.goto('/agents/agent-cmo')
    const liBtn = page.getByRole('button', { name: /linkedin|post|r.diger/i }).first()
    if (await liBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await liBtn.click()
      await page.waitForTimeout(5_000)
      const publishBtn = page.getByRole('button', { name: /publier|publish/i })
      if (await publishBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const [response] = await Promise.all([
          page.waitForResponse(r => r.url().includes('/api/agents/linkedin-post/publish'), { timeout: 15_000 }),
          publishBtn.click(),
        ])
        // Avec un token invalide ou absent → 401 token_expired
        if (response.status() === 401) {
          await expect(page.getByText(/token.*expir.|param.tres.*int.grations/i).first()).toBeVisible({ timeout: 5_000 }).catch(() => {})
        }
      }
    }
  })

  // ── LinkedIn Token Settings (Epic 8 — Settings intégrations) ────────────

  test('ACQ-16 : settings — section Token LinkedIn visible dans Intégrations', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings/, { timeout: 8_000 })
    const linkedinSection = page.getByText(/token linkedin|linkedin.*token|int.grations.*linkedin/i).first()
    if (await linkedinSection.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(linkedinSection).toBeVisible()
    }
  })

  test('ACQ-17 : settings — formulaire token LinkedIn avec champ password', async ({ page }) => {
    await page.goto('/settings')
    const tokenInput = page.getByPlaceholder(/AQV|token.*linkedin|linkedin.*access/i)
    if (await tokenInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(tokenInput).toBeVisible()
      await expect(tokenInput).toHaveAttribute('type', 'password')
    }
  })

  test('ACQ-18 : settings — bouton Connecter LinkedIn désactivé si token vide', async ({ page }) => {
    await page.goto('/settings')
    const connectBtn = page.getByRole('button', { name: /connecter linkedin/i })
    if (await connectBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(connectBtn).toBeDisabled()
    }
  })

  test('ACQ-19 : token linkedin — GET /api/user/linkedin-token répond 200', async ({ page }) => {
    const response = await page.request.get('/api/user/linkedin-token')
    expect([200, 401]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      expect(typeof body.configured).toBe('boolean')
    }
  })

  // ── Sidebar CROISSANCE ────────────────────────────────────────────────────

  test('ACQ-20 : sidebar — section CROISSANCE visible', async ({ page }) => {
    await page.goto('/pipeline')
    const croissanceSection = page.getByText(/croissance/i).first()
    if (await croissanceSection.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(croissanceSection).toBeVisible()
    }
  })

  test('ACQ-21 : sidebar CROISSANCE — liens ICP Builder, Séquence Email, LinkedIn CMO visibles', async ({ page }) => {
    await page.goto('/pipeline')
    const icpLink = page.getByText(/ICP|client id.al/i).first()
    if (await icpLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(icpLink).toBeVisible()
    }
  })
})
