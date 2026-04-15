/// <reference types="node" />

import { appendFile, readFile } from 'node:fs/promises'
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

type Totals = {
  total: number
  passed: number
  failed: number
  retries: number
  flaky: number
  failedAttachments: string[]
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

function computeTotals(results: PlaywrightLeaf[]): Totals {
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

  return { total, passed, failed, retries, flaky, failedAttachments }
}

function buildRunUrl(env: NodeJS.ProcessEnv): string | undefined {
  if (!env.GITHUB_SERVER_URL || !env.GITHUB_REPOSITORY || !env.GITHUB_RUN_ID) return undefined
  return `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
}

function buildHtml(totals: Totals, env: NodeJS.ProcessEnv): string {
  const runUrl = buildRunUrl(env)
  const shortSha = env.GITHUB_SHA ? env.GITHUB_SHA.slice(0, 7) : undefined
  const branch = env.GITHUB_REF_NAME

  const contextBlock = runUrl
    ? `<p><b>Branch:</b> ${branch ?? '—'} · <b>Commit:</b> ${shortSha ?? '—'} · <a href="${runUrl}">View full run &amp; download artifacts</a></p>`
    : '<p><i>Run context unavailable (not executed in GitHub Actions).</i></p>'

  return `
    <h2>ParaBank Playwright Execution Summary</h2>
    ${contextBlock}
    <ul>
      <li>Total tests executed: <b>${totals.total}</b></li>
      <li>Passed: <b>${totals.passed}</b></li>
      <li>Failed: <b>${totals.failed}</b></li>
      <li>Retries: <b>${totals.retries}</b></li>
      <li>Flaky tests: <b>${totals.flaky}</b></li>
    </ul>
    <h3>Failed test artifacts (inside the <code>parabank-reports</code> CI artifact)</h3>
    <ul>
      ${totals.failedAttachments.length ? totals.failedAttachments.map((x) => `<li>${x}</li>`).join('') : '<li>No failed artifacts — all tests passed 🎉</li>'}
    </ul>
    <p>The full Playwright HTML report, traces, and videos are uploaded as the <code>parabank-reports</code> artifact on the linked run.</p>
  `
}

function buildMarkdownSummary(totals: Totals, env: NodeJS.ProcessEnv): string {
  const runUrl = buildRunUrl(env)
  const lines = [
    '## ParaBank Playwright Execution Summary',
    '',
    `| Total | Passed | Failed | Retries | Flaky |`,
    `| ----- | ------ | ------ | ------- | ----- |`,
    `| ${totals.total} | ${totals.passed} | ${totals.failed} | ${totals.retries} | ${totals.flaky} |`,
    '',
  ]

  if (totals.failedAttachments.length) {
    lines.push('### Failed test artifacts')
    for (const a of totals.failedAttachments) lines.push(`- \`${a}\``)
    lines.push('')
  } else {
    lines.push('_No failed artifacts — all tests passed._')
    lines.push('')
  }

  if (runUrl) lines.push(`[View full run & download artifacts](${runUrl})`)
  return lines.join('\n')
}

async function run(): Promise<void> {
  const env = process.env
  const raw = await readFile('reports/playwright-results.json', 'utf8').catch(() => '{}')
  const json = JSON.parse(raw) as PlaywrightNode
  const results = flattenResults(json)
  const totals = computeTotals(results)

  const markdown = buildMarkdownSummary(totals, env)

  console.log(markdown)

  if (env.GITHUB_STEP_SUMMARY) {
    await appendFile(env.GITHUB_STEP_SUMMARY, `${markdown}\n`)
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.REPORT_RECIPIENT) {
    console.log('Skipping report email: SMTP_* or REPORT_RECIPIENT not configured.')
    return
  }

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
    subject: `ParaBank E2E Report | total=${totals.total} passed=${totals.passed} failed=${totals.failed}`,
    html: buildHtml(totals, env),
  })

  console.log('Report email sent.')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
