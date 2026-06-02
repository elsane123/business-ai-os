import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '../.playwright/auth.json')

setup('authenticate', async ({ page }) => {
  // Use API login to bypass client-rendered form (avoids Suspense hydration issues in headless mode)
  const res = await page.request.post('/api/auth/login', {
    data: {
      email: 'test_qa_20260525@brainlo.test',
      password: 'TestBrainlo123!',
    },
  })
  expect(res.ok()).toBeTruthy()

  // Navigate to focus page to confirm session and establish localStorage
  await page.goto('/focus', { waitUntil: 'domcontentloaded' })

  // Dismiss the onboarding checklist panel for all tests
  await page.evaluate(() => localStorage.setItem('brainlo_checklist_dismissed', 'true'))
  await page.context().storageState({ path: AUTH_FILE })
})
