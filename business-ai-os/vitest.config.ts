import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    testTimeout: 15_000,
    env: {
      BASE_URL: process.env.BASE_URL ?? 'http://localhost:50082',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
