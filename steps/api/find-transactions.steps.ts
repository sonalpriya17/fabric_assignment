import { createBdd } from 'playwright-bdd'
import { test, expect } from '../../support/fixtures.js'
import { ParaBankApiClient } from '../../api-client/parabank-api.client.js'
import { readStateFile } from '../../utils/state-file.js'
import { attachAssertion, loggedRequest } from '../../utils/api-log.js'

const { Given, When, Then } = createBdd(test)

async function loginViaRequest(testInfo: any, request: any, baseUrl: string, username: string, password: string): Promise<void> {
  await loggedRequest(testInfo, request, 'GET', `${baseUrl}/index.htm`)
  const { res } = await loggedRequest(testInfo, request, 'POST', `${baseUrl}/login.htm`, {
    form: { username, password },
    failOnStatusCode: false,
  })
  if (!res.ok() && res.status() !== 302) {
    throw new Error(`ParaBank login failed: ${res.status()}`)
  }
}

async function seedStateViaApi(testInfo: any, request: any, baseUrl: string): Promise<{ accountNumber: string; amount: string }> {
  const { body: overviewBody } = await loggedRequest(testInfo, request, 'GET', `${baseUrl}/overview.htm`)
  const customerIdMatch = typeof overviewBody === 'string' ? overviewBody.match(/customers\/"\s*\+\s*(\d+)/) : null
  const customerId = customerIdMatch?.[1]
  if (!customerId) throw new Error('Could not resolve customerId from overview page (session may not be authenticated)')

  const { body: accountsBody } = await loggedRequest(testInfo, request, 'GET', `${baseUrl}/services_proxy/bank/customers/${customerId}/accounts`)
  let accounts = accountsBody as Array<{ id: number }>
  if (accounts.length < 2) {
    const { body: created } = await loggedRequest(
      testInfo,
      request,
      'POST',
      `${baseUrl}/services_proxy/bank/createAccount?customerId=${customerId}&newAccountType=1&fromAccountId=${accounts[0].id}`,
    )
    accounts = [...accounts, created as { id: number }]
  }

  const from = accounts[0].id
  const to = accounts[1].id
  const amount = `${Math.floor(Math.random() * 9000) + 1000}`

  const { res: transferRes } = await loggedRequest(
    testInfo,
    request,
    'POST',
    `${baseUrl}/services_proxy/bank/transfer?fromAccountId=${from}&toAccountId=${to}&amount=${amount}`,
  )
  if (!transferRes.ok()) throw new Error(`Transfer seed failed: ${transferRes.status()}`)

  return { accountNumber: `${from}`, amount }
}

Given('transaction search context exists from UI bill payment', async ({ world, request, $testInfo }: any) => {
  const baseUrl = (process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/').replace(/\/$/, '')

  let state: { accountNumber: string; amount: string; username?: string; password?: string }
  let source: 'ui-state-file' | 'api-seed'
  try {
    state = await readStateFile<{ accountNumber: string; amount: string; username?: string; password?: string }>('PROMPT-ASSIGNMENT-UI-001')
    source = 'ui-state-file'
    const user = state.username ?? process.env.PARABANK_USER ?? 'john'
    const pass = state.password ?? process.env.PARABANK_PASSWORD ?? 'demo'
    await loginViaRequest($testInfo, request, baseUrl, user, pass)
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error
    source = 'api-seed'
    await loginViaRequest($testInfo, request, baseUrl, process.env.PARABANK_USER ?? 'john', process.env.PARABANK_PASSWORD ?? 'demo')
    state = await seedStateViaApi($testInfo, request, baseUrl)
  }
  await $testInfo.attach('context · assignmentState', {
    body: JSON.stringify({ source, ...state }, null, 2),
    contentType: 'application/json',
  })
  world.set('assignmentState', state)
})

Given('the API client is initialized for transaction search', async ({ world }: any) => {
  const base = (globalThis as any).process?.env?.BASE_URL ?? 'https://parabank.parasoft.com/parabank'
  world.set('apiClient', new ParaBankApiClient(base))
})

When('find transactions API is invoked by the bill payment amount', async ({ world, request, $testInfo }: any) => {
  const baseUrl = (process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/').replace(/\/$/, '')
  const { accountNumber, amount } = world.get('assignmentState') as { accountNumber: string; amount: string }

  const { body } = await loggedRequest(
    $testInfo,
    request,
    'GET',
    `${baseUrl}/services_proxy/bank/accounts/${accountNumber}/transactions/amount/${amount}`,
  )
  world.set('apiResponse', body)
})

Then('response should include payment transactions matching that amount', async ({ world, $testInfo }: any) => {
  const { amount } = world.get('assignmentState') as { amount: string }
  const response = world.get('apiResponse') as unknown

  const isArray = Array.isArray(response)
  const list = isArray ? (response as Array<{ amount?: number | string }>) : []
  const amounts = list.map((item) => Number(item.amount))
  const matches = amounts.includes(Number(amount))

  await attachAssertion($testInfo, 'response is non-empty array containing expected amount', {
    expectedAmount: Number(amount),
    actualShape: isArray ? `array(${list.length})` : typeof response,
    amountsReturned: amounts,
    matched: matches,
  })

  expect(isArray, 'response must be an array').toBe(true)
  expect(list.length, 'response must be non-empty').toBeGreaterThan(0)
  expect(amounts, 'response must include the seeded amount').toContain(Number(amount))
})
