import { createBdd } from 'playwright-bdd'
import { test } from '../../support/fixtures.js'
const { Given, When, Then } = createBdd(test)

Given('the user is on the login page', async ({ loginPage }: any) => {
  await loginPage.gotoLogin()
})

When('the user logs in with generated credentials', async ({ loginPage }: any) => {
  const username = process.env.PARABANK_USER ?? 'john'
  const password = process.env.PARABANK_PASSWORD ?? 'demo'
  await loginPage.login(username, password)
})

Then('the accounts overview page should be visible', async ({ accountsOverviewPage }: any) => {
  await accountsOverviewPage.expectOnOverview()
})
