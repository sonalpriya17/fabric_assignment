/// <reference types="node" />

import { readFile } from 'node:fs/promises'
import nodemailer from 'nodemailer'

type PlaywrightLeaf = {
  status?: string
  expectedStatus?: string
  retries?: number
  attachments?: Array<{ path?: string; name?: string }>
}

type PlaywrightNode = {
  title?: string
  file?: string
  suites?: PlaywrightNode[]
  specs?: Array<{ title?: string; tests?: Array<{ results?: PlaywrightLeaf[] }> }>
}

function flattenResults(root: PlaywrightNode): PlaywrightLeaf[] {
  const out: PlaywrightLeaf[] = []

  const walk = (node: PlaywrightNode): void => {
    for (const suite of node.suites ?? []) walk(suite)
    for (const spec of node.specs ?? []) {
      for (const test of spec.tests ?? []) {
        for (const result of test.results ?? []) out.push(result)
      }
    }
  }

  walk(root)
  return out
}

function countFlaky(results: PlaywrightLeaf[]): number {
  return results.filter((r) => r.status === 'flaky' || ((r.retries ?? 0) > 0 && r.status === 'passed')).length
}

async function run(): Promise<void> {
  const env = process.env
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.REPORT_RECIPIENT) {
    console.log('Skipping report email: SMTP_* or REPORT_RECIPIENT not configured.')
    return
  }

  const raw = await readFile('reports/playwright-results.json', 'utf8').catch(() => '{}')
  const json = JSON.parse(raw) as PlaywrightNode
  const results = flattenResults(json)

  const total = results.length
  const passed = results.filter((r) => r.status === 'passed').length
  const failed = results.filter((r) => r.status === 'failed' || r.status === 'timedOut').length
  const flaky = countFlaky(results)
  const retries = results.reduce((acc, r) => acc + (r.retries ?? 0), 0)

  const failedAttachments = results
    .filter((r) => r.status === 'failed' || r.status === 'timedOut')
    .flatMap((r) => r.attachments ?? [])
    .map((a) => a.path || a.name)
    .filter((v): v is string => Boolean(v))

  const html = `
    <h2>ParaBank Playwright Execution Summary</h2>
    <ul>
      <li>Total tests executed: <b>${total}</b></li>
      <li>Passed: <b>${passed}</b></li>
      <li>Failed: <b>${failed}</b></li>
      <li>Retries: <b>${retries}</b></li>
      <li>Flaky tests: <b>${flaky}</b></li>
    </ul>
    <h3>Failed test artifacts (screenshots/logs)</h3>
    <ul>
      ${failedAttachments.length ? failedAttachments.map((x) => `<li>${x}</li>`).join('') : '<li>No failed artifacts found</li>'}
    </ul>
    <p>Playwright HTML report and full logs are uploaded as CI artifacts.</p>
  `

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT ?? '587'),
    secure: (env.SMTP_SECURE ?? 'false') === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to: env.REPORT_RECIPIENT,
    subject: `ParaBank E2E Report | total=${total} passed=${passed} failed=${failed}`,
    html,
  })

  console.log('Report email sent.')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
