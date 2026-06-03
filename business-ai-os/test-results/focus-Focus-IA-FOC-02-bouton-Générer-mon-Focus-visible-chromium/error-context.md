# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: focus.spec.ts >> Focus IA >> FOC-02 : bouton "Générer mon Focus" visible
- Location: e2e/focus.spec.ts:14:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /générer|générer mon focus|regénérer/i }).first()
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByRole('button', { name: /générer|générer mon focus|regénérer/i }).first()

```

```yaml
- link "Aller au contenu principal":
  - /url: "#main-content"
- complementary:
  - img
  - text: Brainlo
  - button "Collapse sidebar":
    - img
  - navigation "Navigation principale":
    - button "🧠 Brain" [expanded]:
      - text: 🧠 Brain
      - img
    - link "🧠 Business Brain":
      - /url: /chat
    - link "👤 Mon Profil Business":
      - /url: /profile
    - link "🤖 Agents IA":
      - /url: /agents
    - button "🎯 Focus" [expanded]:
      - text: 🎯 Focus
      - img
    - link "⚡ Aujourd'hui":
      - /url: /focus
    - link "📋 Tâches":
      - /url: /tasks
    - link "👥 Pipeline":
      - /url: /pipeline
    - button "⛽ Carburant" [expanded]:
      - text: ⛽ Carburant
      - img
    - link "📄 Devis & Factures":
      - /url: /invoices
    - link "💰 Cash":
      - /url: /cash
    - link "📊 Rapports":
      - /url: /reports
    - button "🚀 Croissance" [expanded]:
      - text: 🚀 Croissance
      - img
    - link "📣 Contenu LinkedIn":
      - /url: /content
    - link "🎯 ICP Builder":
      - /url: /pipeline
    - link "📧 Séquence Email":
      - /url: /agents/agent-cro
    - link "💼 LinkedIn CMO":
      - /url: /agents/agent-cmo
    - link "⚙️ Paramètres":
      - /url: /settings
    - link "❓ Aide":
      - /url: /wiki
  - text: QT
  - paragraph: test_qa_20260525@brainlo.test
  - paragraph: PRO
  - button "Se déconnecter":
    - img
    - text: Se déconnecter
- button "🚀 Premiers pas 2/10"
- main:
  - heading "Bonjour 👋, votre focus du jour" [level=1]
  - paragraph: mercredi 3 juin 2026
  - text: ✨
  - heading "Bienvenue dans votre Daily Focus !" [level=2]
  - paragraph: Votre Focus IA s'appuie sur vos données réelles pour vous proposer 3 actions prioritaires chaque matin. Commencez par renseigner vos données.
  - text: 💰 Étape 1
  - heading "Saisissez vos premières transactions" [level=3]
  - paragraph: Ajoutez vos revenus et charges pour que l'IA calcule votre runway.
  - button "Aller à la Trésorerie →"
  - text: 👥 Étape 2
  - heading "Ajoutez vos premiers prospects" [level=3]
  - paragraph: Renseignez vos contacts clients pour que l'IA priorise vos relances.
  - button "Aller au Pipeline →"
  - text: 🧠 Étape 3
  - heading "Générez votre premier Focus IA" [level=3]
  - paragraph: Une fois vos données ajoutées, générez 3 actions prioritaires personnalisées.
  - text: Disponible après les étapes 1 & 2
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | test.describe('Focus IA', () => {
  4   |   // FOC-01 : chargement de la page
  5   |   test('FOC-01 : page /focus se charge avec date du jour', async ({ page }) => {
  6   |     await page.goto('/focus')
  7   |     await expect(page).toHaveURL('/focus')
  8   |     // Date du jour ou skeleton loader
  9   |     const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  10  |     await expect(page.getByText(/focus|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/i).first()).toBeVisible({ timeout: 8_000 })
  11  |   })
  12  | 
  13  |   // FOC-02 : bouton de génération visible
  14  |   test('FOC-02 : bouton "Générer mon Focus" visible', async ({ page }) => {
  15  |     await page.goto('/focus')
  16  |     const generateBtn = page.getByRole('button', { name: /générer|générer mon focus|regénérer/i })
> 17  |     await expect(generateBtn.first()).toBeVisible({ timeout: 8_000 })
      |                                       ^ Error: expect(locator).toBeVisible() failed
  18  |   })
  19  | 
  20  |   // FOC-03 : cocher une action comme accomplie
  21  |   test('FOC-03 : cocher une action focus → statut done', async ({ page }) => {
  22  |     await page.goto('/focus')
  23  |     // Attendre le chargement des actions
  24  |     await page.waitForTimeout(2_000)
  25  |     const checkbox = page.locator('input[type="checkbox"]').first()
  26  |       .or(page.getByRole('checkbox').first())
  27  |     if (await checkbox.isVisible({ timeout: 5_000 }).catch(() => false)) {
  28  |       const wasChecked = await checkbox.isChecked()
  29  |       if (!wasChecked) {
  30  |         await checkbox.check()
  31  |         // Score ou statut mis à jour
  32  |         await page.waitForTimeout(500)
  33  |         await expect(checkbox).toBeChecked()
  34  |       }
  35  |     }
  36  |   })
  37  | 
  38  |   // FOC-04 : décocher une action
  39  |   test('FOC-04 : décocher une action → statut revient à todo', async ({ page }) => {
  40  |     await page.goto('/focus')
  41  |     await page.waitForTimeout(2_000)
  42  |     const checkbox = page.locator('input[type="checkbox"]').first()
  43  |       .or(page.getByRole('checkbox').first())
  44  |     if (await checkbox.isVisible({ timeout: 5_000 }).catch(() => false)) {
  45  |       // Cocher puis décocher
  46  |       if (!(await checkbox.isChecked())) await checkbox.check()
  47  |       await checkbox.uncheck()
  48  |       await expect(checkbox).not.toBeChecked()
  49  |     }
  50  |   })
  51  | 
  52  |   // FOC-06 : régénérer le focus
  53  |   test('FOC-06 : clic sur régénérer → nouvelles actions générées', async ({ page }) => {
  54  |     await page.goto('/focus')
  55  |     const regenBtn = page.getByRole('button', { name: /régénérer|regénérer|regenerate/i })
  56  |     if (await regenBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
  57  |       await regenBtn.click()
  58  |       // Peut afficher une confirmation avant écrasement
  59  |       const confirmBtn = page.getByRole('button', { name: /confirmer|oui|continuer/i })
  60  |       if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
  61  |         await confirmBtn.click()
  62  |       }
  63  |       // Attendre la génération
  64  |       await page.waitForTimeout(3_000)
  65  |     }
  66  |   })
  67  | 
  68  |   // FOC-07 : historique
  69  |   test('FOC-07 : accès à l\'historique des jours passés', async ({ page }) => {
  70  |     await page.goto('/focus')
  71  |     const historyBtn = page.getByRole('button', { name: /historique|history|passé/i })
  72  |       .or(page.getByRole('tab', { name: /historique/i }))
  73  |     if (await historyBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
  74  |       await historyBtn.click()
  75  |       await expect(page.getByText(/historique|jours|aucun historique/i).first()).toBeVisible({ timeout: 5_000 })
  76  |     }
  77  |   })
  78  | 
  79  |   // FOC-08 : widget streak
  80  |   test('FOC-08 : widget streak affiché', async ({ page }) => {
  81  |     await page.goto('/focus')
  82  |     // Chercher le widget streak (jours consécutifs)
  83  |     await expect(page.getByText(/streak|jours consécutifs|🔥|jour/i).first()).toBeVisible({ timeout: 8_000 }).catch(() => {
  84  |       // Widget peut ne pas être visible selon les données
  85  |     })
  86  |   })
  87  | 
  88  |   // FOC-09 : widget calendrier
  89  |   test('FOC-09 : widget calendrier visible', async ({ page }) => {
  90  |     await page.goto('/focus')
  91  |     // Chercher un calendrier ou grille de jours
  92  |     await expect(page.locator('[class*="calendar"], [data-testid*="calendar"], [role="grid"]').first()).toBeVisible({ timeout: 8_000 }).catch(() => {
  93  |       // Calendrier peut être sous une autre structure
  94  |     })
  95  |   })
  96  | 
  97  |   // FOC-10 : checklist onboarding visible si données manquantes
  98  |   test('FOC-10 : checklist onboarding visible', async ({ page }) => {
  99  |     await page.goto('/focus')
  100 |     await expect(page.getByText(/premiers pas|onboarding|commencer/i).first()).toBeVisible({ timeout: 8_000 }).catch(() => {
  101 |       // Peut ne pas s'afficher si onboarding complété
  102 |     })
  103 |   })
  104 | 
  105 |   // PLAN-01 : accès /focus avec compte FREE → page chargée
  106 |   test('PLAN-01 : page /focus se charge (même en FREE)', async ({ page }) => {
  107 |     await page.goto('/focus')
  108 |     await expect(page).toHaveURL('/focus')
  109 |     // La page doit se charger normalement
  110 |     await expect(page.locator('body')).toBeVisible()
  111 |   })
  112 | 
  113 |   // PLAN-02 : génération bloquée en FREE → modale upgrade
  114 |   test('PLAN-02 : génération Focus en FREE → modale Solo Pro ou actions visibles', async ({ page }) => {
  115 |     await page.goto('/focus')
  116 |     const generateBtn = page.getByRole('button', { name: /générer mon focus|générer/i }).first()
  117 |     if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
```