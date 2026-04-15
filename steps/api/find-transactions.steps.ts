import { createBdd } from 'playwright-bdd'
import { test, expect } from '../../support/fixtures.js'
import { ParaBankApiClient } from '../../api-client/parabank-api.client.js'
import { readStateFile } from '../../utils/state-file.js'

const { Given, When, Then } = createBdd(test)

Given('transaction search context exists from UI bill payment', async ({ world }: any) => {
  const state = await readStateFile<{ accountNumber: string; amount: string }>('PROMPT-ASSIGNMENT-UI-001')
  world.set('assignmentState', state)
})

Given('the API client is initialized for transaction search', async ({ world }: any) => {
  const base = (globalThis as any).process?.env?.BASE_URL ?? 'https://parabank.parasoft.com/parabank'
  world.set('apiClient', new ParaBankApiClient(base))
})

When('find transactions API is invoked by the bill payment amount', async ({ world }: any) => {
  const { accountNumber, amount } = world.get('assignmentState') as { accountNumber: string; amount: string }
  const client = world.get('apiClient') as ParaBankApiClient

  const response = await client.findTransactionsByAmount(accountNumber, amount)
  world.set('apiResponse', response)
})

Then('response should include payment transactions matching that amount', async ({ world }: any) => {
  const { amount } = world.get('assignmentState') as { amount: string }
  const response = world.get('apiResponse') as unknown

  expect(response).toBeTruthy()

  if (Array.isArray(response)) {
    const normalized = response.map((item) => (item as Record<string, unknown>).amount).map((v) => `${v}`)
    expect(normalized).toContain(`${amount}`)
  }
})
