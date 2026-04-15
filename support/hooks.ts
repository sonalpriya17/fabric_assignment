import { createBdd } from 'playwright-bdd'
import { test } from './fixtures.js'

const { After } = createBdd(test)

After(async function ({ page, failureAnalyzer, $testInfo }: any) {
  if ($testInfo.status === 'passed') {
    return
  }

  const screenshot = await page.screenshot({ fullPage: true })
  await failureAnalyzer.analyze(
    new Error($testInfo.error?.message ?? 'Unknown failure'),
    screenshot.toString('base64'),
    `${$testInfo.titlePath?.join(' > ') ?? 'unknown'}`,
  )
})

export { test }
