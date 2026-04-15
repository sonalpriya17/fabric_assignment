import { createBdd } from 'playwright-bdd'
import { test } from '../../support/fixtures.js'
import { createRandomBillPaymentData } from '../../utils/random-data.js'

const { When, Then } = createBdd(test)

When('the user submits a generated bill payment', async ({ billPaymentPage }: any) => {
  await billPaymentPage.gotoBillPay()
  await billPaymentPage.payBill(createRandomBillPaymentData())
})

Then('bill payment confirmation is shown', async ({ billPaymentPage }: any) => {
  await billPaymentPage.expectBillPaymentComplete()
})
