import 'dotenv/config'
import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['steps/**/*.ts', 'support/hooks.ts'],
})

export default defineConfig({
  testDir,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'reports/playwright-results.json' }]],
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'ui',
      use: {
        ...devices['Desktop Chrome'],
      },
      grepInvert: /@api/,
    },
    {
      name: 'api',
      use: {
        ...devices['Desktop Chrome'],
        video: 'off',
        screenshot: 'off',
        trace: 'retain-on-failure',
      },
      grep: /@api/,
    },
  ],
})
