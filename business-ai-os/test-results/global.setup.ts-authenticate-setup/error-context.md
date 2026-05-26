# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global.setup.ts >> authenticate
- Location: e2e/global.setup.ts:6:6

# Error details

```
TimeoutError: locator.fill: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[type=email]')
    - locator resolved to <input value="" required="" type="email" placeholder="vous@exemple.com" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"/>
    - fill("test_qa_20260525@brainlo.test")
  - attempting fill action
    - waiting for element to be visible, enabled and editable

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e7]
      - heading "Connexion" [level=1] [ref=e17]
      - paragraph [ref=e18]: Accédez à votre cerveau business
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: Email
          - textbox "vous@exemple.com" [active] [ref=e23]: test_qa_20260525@brainlo.test
        - generic [ref=e24]:
          - generic [ref=e25]: Mot de passe
          - textbox "••••••••" [ref=e26]
        - button "Se connecter" [ref=e27] [cursor=pointer]
      - paragraph [ref=e28]:
        - text: Pas encore de compte ?
        - link "Créer un compte" [ref=e29] [cursor=pointer]:
          - /url: /onboarding
  - button "Open Next.js Dev Tools" [ref=e35] [cursor=pointer]:
    - img [ref=e36]
  - alert [ref=e39]
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
> 8  |   await page.locator('input[type=email]').fill('test_qa_20260525@brainlo.test')
     |                                           ^ TimeoutError: locator.fill: Timeout 10000ms exceeded.
  9  |   await page.locator('input[type=password]').fill('TestBrainlo123!')
  10 |   await page.getByRole('button', { name: /se connecter/i }).click()
  11 |   await expect(page).toHaveURL(/\/(focus|dashboard)/, { timeout: 12_000 })
  12 |   await page.context().storageState({ path: AUTH_FILE })
  13 | })
  14 | 
```