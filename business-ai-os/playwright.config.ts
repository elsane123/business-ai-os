import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:50082',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // Setup: save auth state
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    // Tests using saved auth state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/auth.json',
      },
      dependencies: ['setup'],
      testIgnore: [/global\.setup\.ts/, /auth\.spec\.ts/],
    },
    // Auth tests run without saved state
    {
      name: 'auth-tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth\.spec\.ts/,
    },
  ],
})
