import { createBdd } from 'playwright-bdd'
import { test } from '../../support/fixtures.js'
import { createRandomAmount } from '../../utils/random-data.js'

const { When, Then } = createBdd(test)

When('the user transfers a generated amount', async ({ transferFundsPage }: any) => {
  await transferFundsPage.transfer(createRandomAmount())
})

Then('transfer confirmation is shown', async ({ transferFundsPage }: any) => {
  await transferFundsPage.expectTransferConfirmation()
})
