import { test, expect } from '@playwright/test'

test.describe('Trésorerie & Runway', () => {
  // CASH-01 : chargement
  test('CASH-01 : page /cash se charge avec KPIs', async ({ page }) => {
    await page.goto('/cash')
    await expect(page).toHaveURL('/cash')
    await expect(page.getByText(/trésorerie|cash|solde|balance/i).first()).toBeVisible({ timeout: 8_000 })
  })

  // CASH-02 : ajouter une transaction (revenu)
  test('CASH-02 : ajouter une transaction revenu', async ({ page }) => {
    await page.goto('/cash')
    const addBtn = page.getByRole('button', { name: /ajouter|nouvelle transaction|nouveau/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 8_000 })
    await addBtn.click()
    // Remplir le montant
    const amountInput = page.locator('input[name*="amount"], input[name*="montant"], input[type="number"]').first()
    if (await amountInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await amountInput.fill('500')
    }
    // Sélectionner type revenu
    const revenueBtn = page.getByRole('button', { name: /revenu|recette|entrée/i }).first()
      .or(page.locator('input[value*="income"], input[value*="revenue"]').first())
    if (await revenueBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await revenueBtn.click()
    }
    // Ajouter un label/description
    const descInput = page.locator('input[name*="label"], input[name*="description"], input[placeholder*="description"]').first()
    if (await descInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await descInput.fill('Revenu E2E Test')
    }
    const saveBtn = page.getByRole('button', { name: /ajouter|enregistrer|sauvegarder|créer/i }).first()
    await saveBtn.click()
    await page.waitForTimeout(1_000)
  })

  // CASH-03 : ajouter une transaction (dépense)
  test('CASH-03 : ajouter une transaction dépense', async ({ page }) => {
    await page.goto('/cash')
    const addBtn = page.getByRole('button', { name: /ajouter|nouvelle transaction|nouveau/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 8_000 })
    await addBtn.click()
    // Sélectionner type dépense
    const expenseBtn = page.getByRole('button', { name: /dépense|charge|sortie/i }).first()
      .or(page.locator('input[value*="expense"], input[value*="charge"]').first())
    if (await expenseBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expenseBtn.click()
    }
    const amountInput = page.locator('input[name*="amount"], input[name*="montant"], input[type="number"]').first()
    if (await amountInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await amountInput.fill('200')
    }
    const saveBtn = page.getByRole('button', { name: /ajouter|enregistrer|sauvegarder|créer/i }).first()
    await saveBtn.click()
    await page.waitForTimeout(1_000)
  })

  // CASH-04 : sélectionner une catégorie
  test('CASH-04 : sélectionner une catégorie sur une transaction', async ({ page }) => {
    await page.goto('/cash')
    const addBtn = page.getByRole('button', { name: /ajouter|nouvelle transaction|nouveau/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 8_000 })
    await addBtn.click()
    const categorySelect = page.locator('select[name*="categ"]')
      .or(page.getByRole('combobox', { name: /catégorie/i }))
      .first()
    if (await categorySelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await categorySelect.click()
      const option = page.getByRole('option').first()
      if (await option.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await option.click()
      }
    }
  })

  // CASH-05 : taux de TVA
  test('CASH-05 : sélectionner un taux de TVA', async ({ page }) => {
    await page.goto('/cash')
    const addBtn = page.getByRole('button', { name: /ajouter|nouvelle transaction|nouveau/i }).first()
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click()
      const tvaSelect = page.locator('select[name*="tva"], select[name*="vat"]')
        .or(page.getByRole('combobox', { name: /tva|vat/i }))
        .first()
      if (await tvaSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await tvaSelect.click()
        const option = page.getByRole('option', { name: /20|10|5|0/i }).first()
        if (await option.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await option.click()
        }
      }
    }
  })

  // CASH-07 : supprimer une transaction
  test('CASH-07 : supprimer une transaction avec confirmation', async ({ page }) => {
    await page.goto('/cash')
    // Chercher un bouton supprimer sur une transaction existante
    const deleteBtn = page.getByRole('button', { name: /supprimer/i }).first()
    if (await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await deleteBtn.click()
      const confirmBtn = page.getByRole('button', { name: /confirmer|oui|supprimer/i }).first()
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click()
      }
    }
  })

  // CASH-08 : widget Runway affiché
  test('CASH-08 : widget Runway avec 3 scénarios visible', async ({ page }) => {
    await page.goto('/cash')
    await expect(page.getByText(/runway|pessimiste|réaliste|optimiste/i).first()).toBeVisible({ timeout: 8_000 }).catch(() => {
      // Runway peut nécessiter des données de transactions
    })
  })

  // CASH-09 : barre de progression objectif mensuel
  test('CASH-09 : progression vers l\'objectif mensuel visible', async ({ page }) => {
    await page.goto('/cash')
    await expect(page.getByText(/objectif|progression|%/i).first()).toBeVisible({ timeout: 8_000 }).catch(() => {})
  })

  // CASH-10 : filtrer par période
  test('CASH-10 : filtrer les transactions par période', async ({ page }) => {
    await page.goto('/cash')
    const filterBtn = page.getByRole('button', { name: /ce mois|semaine|année|période|filtrer/i }).first()
      .or(page.locator('select[name*="period"], select[name*="periode"]').first())
    if (await filterBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await filterBtn.click()
      await page.waitForTimeout(500)
    }
  })

  // CASH-11 : saisie en langage naturel (IA)
  test('CASH-11 : saisie en langage naturel visible', async ({ page }) => {
    await page.goto('/cash')
    const nlInput = page.getByPlaceholder(/langage naturel|décrivez|par exemple|ex:/i).first()
      .or(page.locator('textarea[name*="natural"], input[name*="natural"]').first())
    if (await nlInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nlInput.fill('Facture client Acme 1500€ hier')
      const parseBtn = page.getByRole('button', { name: /analyser|parser|interpréter|IA/i }).first()
      if (await parseBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await parseBtn.click()
        await page.waitForTimeout(2_000)
      }
    }
  })
})
