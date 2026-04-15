import { createBdd } from 'playwright-bdd'
import { test } from '../../support/fixtures.js'
import { createRandomRegistrationData } from '../../utils/random-data.js'

const { Given, When, Then } = createBdd(test)

Given('the user opens the registration page', async ({ registrationPage }: any) => {
  await registrationPage.gotoRegistration()
})

When('the user submits registration details using {string}', async ({ registrationPage, world }: any, usernameHint: string) => {
  const data = createRandomRegistrationData(usernameHint)
  world.set('username', data.username)
  world.set('password', data.password)
  await registrationPage.submitRegistration(data)
})

Then('the user should land on accounts overview', async ({ accountsOverviewPage, registrationPage, world }: any) => {
  await registrationPage.expectWelcomeMessage(world.get('username') as string)
  await accountsOverviewPage.gotoAccountsOverview()
  await accountsOverviewPage.expectOnOverview()
})
