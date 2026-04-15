import { createBdd } from 'playwright-bdd'
import { test, expect } from '../../support/fixtures.js'
import { createRandomAmount, createRandomBillPaymentData, createRandomRegistrationData } from '../../utils/random-data.js'
import { writeStateFile } from '../../utils/state-file.js'

const { Given, When, Then } = createBdd(test)

Given('the user navigates to ParaBank home page', async ({ loginPage, page }: any) => {
  await loginPage.gotoLogin()
  await expect(page).toHaveURL(/parabank/i)
})

When('the user registers a unique profile', async ({ registrationPage, world }: any) => {
  const user = createRandomRegistrationData('<AI_GENERATED>')
  world.set('registeredUser', user)

  await registrationPage.gotoRegistration()
  await registrationPage.submitRegistration(user)
  await registrationPage.expectWelcomeMessage(user.username)
})

When('the user logs in with the registered credentials', async ({ loginPage, accountsOverviewPage, world }: any) => {
  const user = world.get('registeredUser') as { username: string; password: string }

  await loginPage.logoutIfVisible()
  await loginPage.gotoLogin()
  await loginPage.login(user.username, user.password)
  await accountsOverviewPage.expectOnOverview()
})

Then('the global navigation menu should be functional', async ({ accountsOverviewPage }: any) => {
  await accountsOverviewPage.verifyGlobalNavigationMenu()
})

When('the user opens a new savings account and stores account number', async ({ openAccountPage, world }: any) => {
  await openAccountPage.openNewAccount('SAVINGS')
  await openAccountPage.expectAccountOpened()
  const accountNumber = await openAccountPage.getNewAccountNumber()
  world.set('createdAccountNumber', accountNumber)
})

Then('account overview should show balance details for that account', async ({ accountsOverviewPage, world }: any) => {
  const accountNumber = world.get('createdAccountNumber') as string
  await accountsOverviewPage.gotoAccountsOverview()
  await accountsOverviewPage.expectAccountBalanceVisible(accountNumber)
})

When('the user transfers funds from the created account', async ({ transferFundsPage, accountsOverviewPage, world }: any) => {
  const accountNumber = world.get('createdAccountNumber') as string
  await accountsOverviewPage.gotoAccountsOverview()
  const destination = await accountsOverviewPage.getAlternateAccountNumber(accountNumber)

  const transferAmount = createRandomAmount(5, 25)
  world.set('transferAmount', transferAmount)
  world.set('transferDestination', destination)

  await transferFundsPage.transferBetweenAccounts(transferAmount, accountNumber, destination)
})

Then('transfer should be successful', async ({ transferFundsPage }: any) => {
  await transferFundsPage.expectTransferConfirmation()
})

When('the user pays a bill using the created account', async ({ billPaymentPage, world }: any) => {
  const accountNumber = world.get('createdAccountNumber') as string
  const billData = createRandomBillPaymentData()
  const amount = createRandomAmount(2, 20)
  billData.amount = amount

  world.set('billPaymentAmount', amount)

  await billPaymentPage.payBillFromAccount(billData, accountNumber)
})

Then('bill payment should be successful and state is stored for API validation', async ({ billPaymentPage, world }: any) => {
  const accountNumber = world.get('createdAccountNumber') as string
  const amount = world.get('billPaymentAmount') as string
  const user = world.get('registeredUser') as { username: string; password: string }

  await billPaymentPage.expectBillPaymentComplete()
  await billPaymentPage.expectPaymentSummaryIncludes(amount)

  await writeStateFile('PROMPT-ASSIGNMENT-UI-001', {
    accountNumber,
    amount,
    username: user.username,
    password: user.password,
    ts: new Date().toISOString(),
  })
})
