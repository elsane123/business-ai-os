import { test } from '@playwright/test'

test('debug pipeline crash', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message))
  page.on('console', msg => {
    if (['error','warn'].includes(msg.type())) {
      errors.push('CONSOLE[' + msg.type() + ']: ' + msg.text())
    }
  })
  
  await page.goto('/pipeline')
  await page.waitForTimeout(6000)
  
  console.log('\n=== CAPTURED ERRORS ===')
  errors.forEach(e => console.log(e))
  console.log('=== END ===' + '\n')
})
