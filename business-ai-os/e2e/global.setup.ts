import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '../.playwright/auth.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type=email]').fill('test_qa_20260525@brainlo.test')
  await page.locator('input[type=password]').fill('TestBrainlo123!')
  await page.getByRole('button', { name: /se connecter/i }).click()
  await expect(page).toHaveURL(/\/(focus|dashboard)/, { timeout: 12_000 })
  // Dismiss the onboarding checklist panel for all tests
  await page.evaluate(() => localStorage.setItem('brainlo_checklist_dismissed', 'true'))
  await page.context().storageState({ path: AUTH_FILE })
})
