import { createBdd } from 'playwright-bdd'
import { test, expect } from '../../support/fixtures.js'
import { ParaBankApiClient } from '../../api-client/parabank-api.client.js'
import { readStateFile } from '../../utils/state-file.js'

const { Given, When, Then } = createBdd(test)

async function seedStateViaApi(request: any, baseUrl: string): Promise<{ accountNumber: string; amount: string }> {
  const username = process.env.PARABANK_USER ?? 'john'
  const password = process.env.PARABANK_PASSWORD ?? 'demo'

  await request.get(`${baseUrl}/index.htm`)
  const loginRes = await request.post(`${baseUrl}/login.htm`, {
    form: { username, password },
    failOnStatusCode: false,
  })
  if (!loginRes.ok() && loginRes.status() !== 302) {
    throw new Error(`ParaBank login failed: ${loginRes.status()}`)
  }

  const overview = await request.get(`${baseUrl}/overview.htm`)
  const body = await overview.text()
  const customerIdMatch = body.match(/customers\/"\s*\+\s*(\d+)/)
  const customerId = customerIdMatch?.[1]
  if (!customerId) throw new Error('Could not resolve customerId from overview page (session may not be authenticated)')

  const accountsRes = await request.get(`${baseUrl}/services_proxy/bank/customers/${customerId}/accounts`)
  const accounts = (await accountsRes.json()) as Array<{ id: number }>
  if (accounts.length < 2) throw new Error('Seed user must have at least 2 accounts')

  const from = accounts[0].id
  const to = accounts[1].id
  const amount = `${Math.floor(Math.random() * 9000) + 1000}`

  const transferRes = await request.post(
    `${baseUrl}/services_proxy/bank/transfer?fromAccountId=${from}&toAccountId=${to}&amount=${amount}`,
  )
  if (!transferRes.ok()) throw new Error(`Transfer seed failed: ${transferRes.status()}`)

  return { accountNumber: `${from}`, amount }
}

Given('transaction search context exists from UI bill payment', async ({ world, request }: any) => {
  const baseUrl = (process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/').replace(/\/$/, '')

  let state: { accountNumber: string; amount: string }
  try {
    state = await readStateFile<{ accountNumber: string; amount: string }>('PROMPT-ASSIGNMENT-UI-001')
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error
    console.log('[find-transactions] UI state file missing — seeding via API with john/demo')
    state = await seedStateViaApi(request, baseUrl)
  }
  world.set('assignmentState', state)
})

Given('the API client is initialized for transaction search', async ({ world }: any) => {
  const base = (globalThis as any).process?.env?.BASE_URL ?? 'https://parabank.parasoft.com/parabank'
  world.set('apiClient', new ParaBankApiClient(base))
})

When('find transactions API is invoked by the bill payment amount', async ({ world, request }: any) => {
  const baseUrl = (process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/').replace(/\/$/, '')
  const { accountNumber, amount } = world.get('assignmentState') as { accountNumber: string; amount: string }

  const res = await request.get(`${baseUrl}/services_proxy/bank/accounts/${accountNumber}/transactions/amount/${amount}`)
  const response = res.ok() ? await res.json() : { status: res.status(), body: await res.text() }
  world.set('apiResponse', response)
})

Then('response should include payment transactions matching that amount', async ({ world }: any) => {
  const { amount } = world.get('assignmentState') as { amount: string }
  const response = world.get('apiResponse') as unknown

  expect(Array.isArray(response)).toBe(true)
  const list = response as Array<{ amount?: number | string }>
  expect(list.length).toBeGreaterThan(0)
  const normalized = list.map((item) => Number(item.amount))
  expect(normalized).toContain(Number(amount))
})
