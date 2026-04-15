import { createBdd } from 'playwright-bdd'
import { test, expect } from '../../support/fixtures.js'
import { createRandomAmount } from '../../utils/random-data.js'
import { attachAssertion, loggedRequest } from '../../utils/api-log.js'

const { Given, When, Then } = createBdd(test)

Given('the API client is initialized', async ({ world, request, $testInfo }: any) => {
  const baseUrl = (process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank/').replace(/\/$/, '')
  const username = process.env.PARABANK_USER ?? 'john'
  const password = process.env.PARABANK_PASSWORD ?? 'demo'

  await loggedRequest($testInfo, request, 'GET', `${baseUrl}/index.htm`)
  const { res: loginRes } = await loggedRequest($testInfo, request, 'POST', `${baseUrl}/login.htm`, {
    form: { username, password },
    failOnStatusCode: false,
  })
  if (!loginRes.ok() && loginRes.status() !== 302) {
    throw new Error(`ParaBank login failed: ${loginRes.status()}`)
  }

  const { body: overviewBody } = await loggedRequest($testInfo, request, 'GET', `${baseUrl}/overview.htm`)
  const customerId = typeof overviewBody === 'string' ? overviewBody.match(/customers\/"\s*\+\s*(\d+)/)?.[1] : undefined
  if (!customerId) throw new Error('Could not resolve customerId after login')

  const { body: accountsBody } = await loggedRequest($testInfo, request, 'GET', `${baseUrl}/services_proxy/bank/customers/${customerId}/accounts`)
  let accounts = (accountsBody as Array<{ id: number }>) ?? []
  if (accounts.length < 2) {
    const { body: created } = await loggedRequest(
      $testInfo,
      request,
      'POST',
      `${baseUrl}/services_proxy/bank/createAccount?customerId=${customerId}&newAccountType=1&fromAccountId=${accounts[0].id}`,
    )
    accounts = [...accounts, created as { id: number }]
  }

  world.set('apiBaseUrl', baseUrl)
  world.set('apiAccounts', accounts)
})

When('a transfer request is sent with generated values', async ({ world, request, $testInfo }: any) => {
  const baseUrl = world.get('apiBaseUrl') as string
  const accounts = world.get('apiAccounts') as Array<{ id: number }>
  const amount = createRandomAmount()

  const { body } = await loggedRequest(
    $testInfo,
    request,
    'POST',
    `${baseUrl}/services_proxy/bank/transfer?fromAccountId=${accounts[0].id}&toAccountId=${accounts[1].id}&amount=${amount}`,
  )
  world.set('transferResponse', body)
  world.set('transferAmount', amount)
})

Then('the transfer response should be valid', async ({ world, $testInfo }: any) => {
  const response = world.get('transferResponse') as unknown
  const amount = world.get('transferAmount') as string
  const text = typeof response === 'string' ? response : JSON.stringify(response)
  const mentionsAmount = text.includes(amount)
  const mentionsSuccess = /success/i.test(text)

  await attachAssertion($testInfo, 'transfer response indicates success', {
    expectedAmount: amount,
    mentionsAmount,
    mentionsSuccess,
    response,
  })

  expect(response, 'response must be truthy').toBeTruthy()
  expect(mentionsSuccess || mentionsAmount, 'response must confirm success or echo the amount').toBe(true)
})
