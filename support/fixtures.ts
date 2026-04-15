import { test as base } from 'playwright-bdd'
import {
  createClaudeAIService,
  createFailureAnalyzer,
  createSmartLocator,
  createTestDataGenerator,
  createVisualAssertion,
  loadLocatorCache,
  type AIService,
  type FailureAnalyzer,
  type SmartLocator,
  type TestDataGenerator,
  type VisualAssertion,
} from '../ai/index.js'
import { AccountsOverviewPage } from '../pages/accounts-overview.page.js'
import { BillPaymentPage } from '../pages/bill-payment.page.js'
import { LoginPage } from '../pages/login.page.js'
import { OpenAccountPage } from '../pages/open-account.page.js'
import { RegistrationPage } from '../pages/registration.page.js'
import { TransferFundsPage } from '../pages/transfer-funds.page.js'
import { World } from './world.js'

export type Fixtures = {
  world: World
  aiService: AIService
  smartLocator: SmartLocator
  failureAnalyzer: FailureAnalyzer
  testDataGenerator: TestDataGenerator
  visualAssertion: VisualAssertion
  loginPage: LoginPage
  registrationPage: RegistrationPage
  accountsOverviewPage: AccountsOverviewPage
  openAccountPage: OpenAccountPage
  transferFundsPage: TransferFundsPage
  billPaymentPage: BillPaymentPage
}

const apiKey = (globalThis as any).process?.env?.ANTHROPIC_API_KEY ?? ''

export const test = base.extend<Fixtures>({
  world: async ({}, use) => {
    await use(new World())
  },

  aiService: async ({}, use) => {
    await use(createClaudeAIService(apiKey))
  },

  smartLocator: async ({ aiService }, use) => {
    await use(createSmartLocator(aiService, await loadLocatorCache()))
  },

  failureAnalyzer: async ({ aiService }, use) => {
    await use(createFailureAnalyzer(aiService))
  },

  testDataGenerator: async ({ aiService }, use) => {
    await use(createTestDataGenerator(aiService))
  },

  visualAssertion: async ({ aiService }, use) => {
    await use(createVisualAssertion(aiService))
  },

  loginPage: async ({ page, smartLocator }, use) => {
    await use(new LoginPage(page, smartLocator))
  },

  registrationPage: async ({ page, smartLocator }, use) => {
    await use(new RegistrationPage(page, smartLocator))
  },

  accountsOverviewPage: async ({ page, smartLocator }, use) => {
    await use(new AccountsOverviewPage(page, smartLocator))
  },

  openAccountPage: async ({ page, smartLocator }, use) => {
    await use(new OpenAccountPage(page, smartLocator))
  },

  transferFundsPage: async ({ page, smartLocator }, use) => {
    await use(new TransferFundsPage(page, smartLocator))
  },

  billPaymentPage: async ({ page, smartLocator }, use) => {
    await use(new BillPaymentPage(page, smartLocator))
  },
})

export { expect } from '@playwright/test'
