import { test, expect } from '@playwright/test'

/**
 * E2E Behavioral Tests — Brain Context
 * Validates that user documents and context are correctly interpreted by agents.
 * Auth: user1 PRO (test_qa_20260525@brainlo.test) via .playwright/auth.json
 * Agent-coach must be activated (done in DB setup).
 */

const BUSINESS_NAME = 'Brainlo QA Test'
const MONTHLY_GOAL  = '5000'

// ─── Brain UX — Profile & Score ─────────────────────────────────────────────

test.describe('Brain UX — Profil & Score', () => {

  test('BC-E04: /profile — Brain Power Score visible et positif', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/profile/, { timeout: 8_000 })

    // Brain Power Score shown as percentage or /100
    const scoreEl = page.getByText(/brain|score/i).first()
      .or(page.locator('[class*="brain"], [class*="score"]').first())
    await expect(scoreEl).toBeVisible({ timeout: 8_000 })
  })

  test('BC-E03: /agents/agent-coach — indicateur Brain visible sur la page agent', async ({ page }) => {
    await page.goto('/agents/agent-coach')
    await expect(page).toHaveURL(/\/agents\/agent-coach/, { timeout: 8_000 })

    // Brain indicator: shows brain level (actif, puissant, expert…) or brain score badge
    const brainEl = page.getByText(/brain|🧠/i).first()
    await expect(brainEl).toBeVisible({ timeout: 8_000 })
  })

})

// ─── Sentinel Tests — Context Injected into LLM ──────────────────────────────

test.describe('Brain Sentinel — Contexte injecté dans le LLM', () => {

  test('BC-E01: agent-coach cite le businessName exact dans la réponse', async ({ page }) => {
    await page.goto('/agents/agent-coach')
    await expect(page).toHaveURL(/\/agents\/agent-coach/, { timeout: 8_000 })

    // Target the main chat textarea
    const textarea = page.locator('textarea').last()
    await expect(textarea).toBeVisible({ timeout: 8_000 })

    // Type the sentinel question
    await textarea.click()
    await textarea.fill('Quel est exactement le nom de mon entreprise ?')

    // Submit with Enter (the chat uses onKeyDown Shift+Enter for newline, Enter for send)
    await textarea.press('Enter')

    // Wait for the LLM reply to appear — look for BUSINESS_NAME in any response bubble
    await expect(
      page.getByText(new RegExp(BUSINESS_NAME, 'i'))
    ).toBeVisible({ timeout: 45_000 })
  })

  test('BC-E02: agent-coach mentionne l\'objectif mensuel (5 000€) dans la réponse', async ({ page }) => {
    await page.goto('/agents/agent-coach')
    await expect(page).toHaveURL(/\/agents\/agent-coach/, { timeout: 8_000 })

    const textarea = page.locator('textarea').last()
    await expect(textarea).toBeVisible({ timeout: 8_000 })

    await textarea.click()
    await textarea.fill('Quel est mon objectif de chiffre d\'affaires mensuel ?')
    await textarea.press('Enter')

    // The reply must mention 5000 (formats: 5000, 5 000, 5.000)
    await expect(
      page.getByText(/5[\s.\u00a0]?000/)
    ).toBeVisible({ timeout: 45_000 })
  })

})
