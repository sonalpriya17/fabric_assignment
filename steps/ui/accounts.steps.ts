import { createBdd } from 'playwright-bdd'
import { test } from '../../support/fixtures.js'

const { Given, When, Then } = createBdd(test)

Given('the user is authenticated', async ({ loginPage }: any) => {
  await loginPage.gotoLogin()
  await loginPage.login(process.env.PARABANK_USER ?? 'john', process.env.PARABANK_PASSWORD ?? 'demo')
})

When('the user opens a new {string} account', async ({ openAccountPage }: any, accountType: string) => {
  await openAccountPage.openNewAccount(accountType)
})

Then('account opening confirmation is shown', async ({ openAccountPage }: any) => {
  await openAccountPage.expectAccountOpened()
})
