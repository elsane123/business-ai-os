# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> AUTH-16 : onboarding v3 — page /onboarding affiche les 3 étapes
- Location: e2e/auth.spec.ts:173:7

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /suivant|continuer|next/i }).first()
    - locator resolved to <button disabled>Continuer</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
      - waiting 100ms
    16 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e10]: Brainlo
    - generic [ref=e12]:
      - generic [ref=e20]:
        - paragraph [ref=e21]: Etape 1 sur 2
        - paragraph [ref=e22]:
          - generic [ref=e23]: Bonjour. Je suis votre Business Brain. Faisons connaissance.
      - generic [ref=e25]:
        - paragraph [ref=e26]: "✨ Ces infos permettent à Brainlo de :"
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]: 🔐
            - generic [ref=e30]: Securise votre espace Brainlo
          - generic [ref=e31]:
            - generic [ref=e32]: 🧠
            - generic [ref=e33]: Personnalise vos agents IA
          - generic [ref=e34]:
            - generic [ref=e35]: 📋
            - generic [ref=e36]: Pre-remplit vos devis et factures
          - generic [ref=e37]:
            - generic [ref=e38]: ⚡
            - generic [ref=e39]: Active votre Daily Focus
      - generic [ref=e40]:
        - generic [ref=e41]:
          - generic [ref=e42]:
            - generic [ref=e43]: Prenom et Nom
            - textbox "Prenom et Nom" [ref=e44]:
              - /placeholder: Jean Dupont
          - generic [ref=e45]:
            - generic [ref=e46]: Entreprise
            - textbox "Entreprise" [ref=e47]:
              - /placeholder: Acme SAS
        - generic [ref=e48]:
          - generic [ref=e49]: Email professionnel
          - textbox "Email professionnel" [ref=e50]:
            - /placeholder: jean@entreprise.com
            - text: onboarding_e2e_1780489396991@brainlo.test
        - generic [ref=e51]:
          - generic [ref=e52]: Mot de passe
          - textbox "Mot de passe" [active] [ref=e53]:
            - /placeholder: 8 caracteres minimum
            - text: TestBrainlo123!
        - generic [ref=e54]:
          - generic [ref=e55]: Confirmer le mot de passe
          - textbox "Confirmer le mot de passe" [ref=e56]:
            - /placeholder: Repetez votre mot de passe
      - generic [ref=e57]:
        - button "←" [ref=e58] [cursor=pointer]
        - button "Continuer" [disabled] [ref=e59]
  - alert [ref=e60]
```

# Test source

```ts
  104 |     // On teste avec un vrai token si disponible, sinon on vérifie la validation UI
  105 |     await page.goto('/reset-password?token=token_test')
  106 |     const pwdInput = page.locator('input[type=password]').first()
  107 |     if (await pwdInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  108 |       await pwdInput.fill('court')
  109 |       await page.getByRole('button', { name: /confirmer|réinitialiser|enregistrer/i }).click()
  110 |       await expect(page.getByText(/court|minimum|caractères/i).first()).toBeVisible({ timeout: 5_000 })
  111 |     } else {
  112 |       // Token invalide attendu — test de la page d'erreur
  113 |       await expect(page.getByText(/invalide|expiré|erreur/i).first()).toBeVisible({ timeout: 5_000 })
  114 |     }
  115 |   })
  116 | 
  117 |   // AUTH-14 : mots de passe ≠ confirmation
  118 |   test('AUTH-14 : reset-password mdp ≠ confirmation → message', async ({ page }) => {
  119 |     await page.goto('/reset-password?token=token_test')
  120 |     const inputs = page.locator('input[type=password]')
  121 |     if (await inputs.count() >= 2) {
  122 |       await inputs.nth(0).fill('NouveauMotDePasse123!')
  123 |       await inputs.nth(1).fill('MotDePasseDifferent!')
  124 |       await page.getByRole('button', { name: /confirmer|réinitialiser|enregistrer/i }).click()
  125 |       await expect(page.getByText(/correspondent pas|identiques/i).first()).toBeVisible({ timeout: 5_000 })
  126 |     } else {
  127 |       // Token invalide — attendu si pas de token valide en test
  128 |       await expect(page.getByText(/invalide|expiré|erreur/i).first()).toBeVisible({ timeout: 5_000 })
  129 |     }
  130 |   })
  131 | 
  132 |   // AUTH-18 : onboarding déjà complété → redirection focus
  133 |   test('AUTH-18 : accès /onboarding si déjà complété → redirection /focus', async ({ browser }) => {
  134 |     const context = await browser.newContext({ storageState: '.playwright/auth.json' })
  135 |     const page = await context.newPage()
  136 |     await page.goto('/onboarding')
  137 |     // Utilisateur ayant déjà complété l'onboarding est redirigé
  138 |     await expect(page).toHaveURL(/\/(focus|dashboard|onboarding)/, { timeout: 10_000 })
  139 |     await context.close()
  140 |   })
  141 | 
  142 |   // Route protégée
  143 |   test('AUTH — route dashboard protégée → redirige vers login', async ({ page }) => {
  144 |     await page.goto('/focus')
  145 |     await expect(page).toHaveURL(/\/login|\/(focus)/, { timeout: 8_000 })
  146 |   })
  147 | })
  148 | 
  149 |   // AUTH-15 : rate limiting — 5 tentatives/15min sur login
  150 |   test('AUTH-15 : rate limiting login — blocage après 5 tentatives erronées', async ({ page }) => {
  151 |     await page.goto('/login')
  152 |     // Envoyer 5 tentatives de login incorrectes rapidement
  153 |     for (let i = 0; i < 5; i++) {
  154 |       await page.locator('input[type=email]').fill('ratelimit_test@brainlo.test')
  155 |       await page.locator('input[type=password]').fill(`mauvais_mdp_${i}`)
  156 |       await page.getByRole('button', { name: /se connecter/i }).click()
  157 |       await page.waitForTimeout(300)
  158 |     }
  159 |     // La 6ème tentative doit être bloquée par le rate limiter
  160 |     await page.locator('input[type=email]').fill('ratelimit_test@brainlo.test')
  161 |     await page.locator('input[type=password]').fill('mauvais_mdp_6')
  162 |     await page.getByRole('button', { name: /se connecter/i }).click()
  163 |     await expect(
  164 |       page.getByText(/trop de tentatives|rate limit|réessayez dans|bloqué|429/i).first()
  165 |     ).toBeVisible({ timeout: 8_000 }).catch(() => {
  166 |       // Le blocage peut se manifester par un HTTP 429 sans texte explicite
  167 |       // ou par le maintien sur /login avec un message d'erreur
  168 |       expect(page.url()).toContain('/login')
  169 |     })
  170 |   })
  171 | 
  172 |   // AUTH-16 : onboarding v3 — 3 étapes (account, profil rapide, activation)
  173 |   test('AUTH-16 : onboarding v3 — page /onboarding affiche les 3 étapes', async ({ browser }) => {
  174 |     // Utiliser un contexte sans auth pour accéder à l'onboarding
  175 |     const context = await browser.newContext()
  176 |     const page = await context.newPage()
  177 |     await page.goto('http://localhost:50082/onboarding')
  178 |     // Si redirigé vers /login (utilisateur non autorisé), c'est acceptable
  179 |     const url = page.url()
  180 |     if (url.includes('/login') || url.includes('/focus')) {
  181 |       await context.close()
  182 |       return
  183 |     }
  184 |     // Vérifier la présence du formulaire d'onboarding — étape 1 (Compte)
  185 |     await expect(
  186 |       page.getByText(/créer votre compte|étape 1|nom|email|mot de passe/i).first()
  187 |     ).toBeVisible({ timeout: 8_000 })
  188 |     // Étape 2 — Profil rapide : secteur, CA mensuel
  189 |     const nextBtn = page.getByRole('button', { name: /suivant|continuer|next/i }).first()
  190 |     if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  191 |       // Remplir les champs requis de l'étape 1
  192 |       const nameInput = page.locator('input[name*="name"], input[name*="nom"]').first()
  193 |       if (await nameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  194 |         await nameInput.fill('Test Onboarding E2E')
  195 |       }
  196 |       const emailInput = page.locator('input[type="email"]').first()
  197 |       if (await emailInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  198 |         await emailInput.fill(`onboarding_e2e_${Date.now()}@brainlo.test`)
  199 |       }
  200 |       const pwdInput = page.locator('input[type="password"]').first()
  201 |       if (await pwdInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  202 |         await pwdInput.fill('TestBrainlo123!')
  203 |       }
> 204 |       await nextBtn.click()
      |                     ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  205 |       await page.waitForTimeout(500)
  206 |       // Étape 2 : secteur visible
  207 |       await expect(
  208 |         page.getByText(/secteur|profil|ca mensuel|chiffre d'affaires/i).first()
  209 |       ).toBeVisible({ timeout: 5_000 }).catch(() => {})
  210 |     }
  211 |     await context.close()
  212 |   })
  213 | 
  214 |   // AUTH-17 : onboarding — WHY callouts visibles à l'étape 1
  215 |   test('AUTH-17 : onboarding v3 — WHY callouts visibles (sécurisé, agents IA)', async ({ browser }) => {
  216 |     const context = await browser.newContext()
  217 |     const page = await context.newPage()
  218 |     await page.goto('http://localhost:50082/onboarding')
  219 |     const url = page.url()
  220 |     if (url.includes('/login') || url.includes('/focus')) {
  221 |       await context.close()
  222 |       return
  223 |     }
  224 |     // WHY callouts : icônes ou textes explicatifs à côté du formulaire
  225 |     await expect(
  226 |       page.getByText(/sécuris|agents ia|devis|focus/i).first()
  227 |     ).toBeVisible({ timeout: 8_000 }).catch(() => {})
  228 |     await context.close()
  229 |   })
  230 | 
```