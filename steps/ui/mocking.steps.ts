import { createBdd } from 'playwright-bdd'
import { test, expect } from '../../support/fixtures.js'

const { Given, When, Then } = createBdd(test)

Given('a mocked accounts response is configured', async ({ page, loginPage }: any) => {
  await page.route('**/services_proxy/bank/customers/*/accounts*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 99999, customerId: 12212, type: 'SAVINGS', balance: 777 }]),
    })
  })
  await loginPage.gotoLogin()
  await loginPage.login(process.env.PARABANK_USER ?? 'john', process.env.PARABANK_PASSWORD ?? 'demo')
})

When('the user opens accounts overview via mocked backend', async ({ accountsOverviewPage }: any) => {
  await accountsOverviewPage.gotoAccountsOverview()
})

Then('the mocked balance should appear', async ({ page }: any) => {
  await expect(page.locator('text=777').first()).toBeVisible()
})
