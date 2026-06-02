# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global.setup.ts >> authenticate
- Location: e2e/global.setup.ts:6:6

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/(focus|dashboard)/
Received string:  "http://localhost:50082/login"
Timeout: 12000ms

Call log:
  - Expect "toHaveURL" with timeout 12000ms
    27 × unexpected value "http://localhost:50082/login"

```

```yaml
- img
- heading "Connexion" [level=1]
- paragraph: Accédez à votre cerveau business
- text: Email ou mot de passe incorrect Email
- textbox "Email":
  - /placeholder: vous@exemple.com
  - text: test_qa_20260525@brainlo.test
- text: Mot de passe
- textbox "Mot de passe":
  - /placeholder: ••••••••
  - text: TestBrainlo123!
- link "Mot de passe oublié ?":
  - /url: /forgot-password
- button "Se connecter"
- paragraph:
  - text: Pas encore de compte ?
  - link "Créer un compte":
    - /url: /onboarding
- alert
```

# Test source

```ts
  1  | import { test as setup, expect } from '@playwright/test'
  2  | import path from 'path'
  3  | 
  4  | const AUTH_FILE = path.join(__dirname, '../.playwright/auth.json')
  5  | 
  6  | setup('authenticate', async ({ page }) => {
  7  |   await page.goto('/login')
  8  |   await page.locator('input[type=email]').fill('test_qa_20260525@brainlo.test')
  9  |   await page.locator('input[type=password]').fill('TestBrainlo123!')
  10 |   await page.getByRole('button', { name: /se connecter/i }).click()
> 11 |   await expect(page).toHaveURL(/\/(focus|dashboard)/, { timeout: 12_000 })
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  12 |   // Dismiss the onboarding checklist panel for all tests
  13 |   await page.evaluate(() => localStorage.setItem('brainlo_checklist_dismissed', 'true'))
  14 |   await page.context().storageState({ path: AUTH_FILE })
  15 | })
  16 | 
```