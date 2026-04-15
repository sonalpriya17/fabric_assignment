import { createBdd } from 'playwright-bdd'
import { test, expect } from '../../support/fixtures.js'
import { ParaBankApiClient } from '../../api-client/parabank-api.client.js'
import { createRandomAmount } from '../../utils/random-data.js'

const { Given, When, Then } = createBdd(test)

Given('the API client is initialized', async ({ world }: any) => {
  const base = (globalThis as any).process?.env?.BASE_URL ?? 'https://parabank.parasoft.com/parabank'
  world.set('apiClient', new ParaBankApiClient(base))
})

When('a transfer request is sent with generated values', async ({ world }: any) => {
  const client = world.get('apiClient') as ParaBankApiClient
  const response = await client.transferFunds({
    fromAccountId: `${Date.now()}`,
    toAccountId: `${Date.now() + 1}`,
    amount: createRandomAmount(),
  })
  world.set('transferResponse', response)
})

Then('the transfer response should be valid', async ({ world }: any) => {
  const response = world.get('transferResponse') as Record<string, unknown>
  expect(response).toBeTruthy()
})
