/// <reference types="node" />

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { readTotals, type Totals } from './results-summary.js'

const HISTORY_LIMIT = 20

type HistoryEntry = {
  runId: string
  sha: string
  shortSha: string
  branch: string
  timestamp: string
  total: number
  passed: number
  failed: number
  retries: number
  flaky: number
  runUrl?: string
}

function env(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

function runUrl(): string | undefined {
  const server = env('GITHUB_SERVER_URL')
  const repo = env('GITHUB_REPOSITORY')
  const runId = env('GITHUB_RUN_ID')
  if (!server || !repo || !runId) return undefined
  return `${server}/${repo}/actions/runs/${runId}`
}

function badgeColor(totals: Totals): string {
  if (totals.failed > 0) return 'red'
  if (totals.flaky > 0) return 'yellow'
  return 'brightgreen'
}

function badgeMessage(totals: Totals): string {
  if (totals.total === 0) return 'no tests'
  if (totals.failed > 0) return `${totals.passed}/${totals.total} passed`
  return `${totals.passed} passed`
}

async function copyIfExists(src: string, dest: string): Promise<void> {
  if (!existsSync(src)) return
  await mkdir(path.dirname(dest), { recursive: true })
  await cp(src, dest, { recursive: true })
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

function renderIndex(history: HistoryEntry[], latest: HistoryEntry | undefined): string {
  const latestBlock = latest
    ? `
      <section class="card">
        <h2>Latest run</h2>
        <p class="meta">${latest.branch} · <code>${latest.shortSha}</code> · ${new Date(latest.timestamp).toUTCString()}</p>
        <div class="counts">
          <div class="stat"><span class="num">${latest.total}</span><span class="lbl">total</span></div>
          <div class="stat pass"><span class="num">${latest.passed}</span><span class="lbl">passed</span></div>
          <div class="stat ${latest.failed ? 'fail' : ''}"><span class="num">${latest.failed}</span><span class="lbl">failed</span></div>
          <div class="stat ${latest.flaky ? 'warn' : ''}"><span class="num">${latest.flaky}</span><span class="lbl">flaky</span></div>
          <div class="stat"><span class="num">${latest.retries}</span><span class="lbl">retries</span></div>
        </div>
        <p class="links">
          <a href="latest/playwright-report/index.html">Playwright report →</a>
          <a href="latest/session-dashboard.html">AI session dashboard →</a>
          ${latest.runUrl ? `<a href="${latest.runUrl}">GitHub Actions run →</a>` : ''}
        </p>
      </section>`
    : '<section class="card"><h2>No runs yet</h2></section>'

  const historyRows = history
    .map(
      (h) => `
        <tr>
          <td><code>${h.shortSha}</code></td>
          <td>${h.branch}</td>
          <td>${new Date(h.timestamp).toISOString().replace('T', ' ').slice(0, 19)}Z</td>
          <td>${h.total}</td>
          <td class="pass">${h.passed}</td>
          <td class="${h.failed ? 'fail' : ''}">${h.failed}</td>
          <td class="${h.flaky ? 'warn' : ''}">${h.flaky}</td>
          <td><a href="runs/${h.runId}/playwright-report/index.html">report</a></td>
          <td><a href="runs/${h.runId}/session-dashboard.html">ai</a></td>
          <td>${h.runUrl ? `<a href="${h.runUrl}">actions</a>` : ''}</td>
        </tr>`,
    )
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ParaBank E2E Dashboard</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #222; }
    body { margin: 24px auto; max-width: 1000px; padding: 0 16px; }
    h1 { margin: 0 0 4px; }
    .sub { color: #666; margin: 0 0 24px; }
    .card { padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px; margin-bottom: 24px; background: #fafafa; }
    .meta { color: #666; margin: 4px 0 16px; }
    .counts { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 12px; }
    .stat { background: #fff; border: 1px solid #ececec; border-radius: 8px; padding: 12px; text-align: center; }
    .stat .num { display: block; font-size: 26px; font-weight: 700; }
    .stat .lbl { display: block; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat.pass .num { color: #1a7f37; }
    .stat.fail .num { color: #cf222e; }
    .stat.warn .num { color: #9a6700; }
    .links a { display: inline-block; margin-right: 14px; color: #0969da; text-decoration: none; }
    .links a:hover { text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
    th { background: #f6f8fa; font-weight: 600; color: #555; }
    td.pass { color: #1a7f37; font-weight: 600; }
    td.fail { color: #cf222e; font-weight: 600; }
    td.warn { color: #9a6700; font-weight: 600; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    footer { color: #888; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <h1>ParaBank E2E Dashboard</h1>
  <p class="sub">AI-driven Playwright + playwright-bdd · auto-published from GitHub Actions</p>
  ${latestBlock}
  <section class="card">
    <h2>Recent runs</h2>
    ${history.length ? `<table>
      <thead><tr><th>Commit</th><th>Branch</th><th>When (UTC)</th><th>Total</th><th>Pass</th><th>Fail</th><th>Flaky</th><th>Report</th><th>AI</th><th>CI</th></tr></thead>
      <tbody>${historyRows}</tbody>
    </table>` : '<p>No history yet.</p>'}
  </section>
  <footer>
    Data: <a href="history.json">history.json</a> · Badge: <a href="badges/tests.json">badges/tests.json</a>
  </footer>
</body>
</html>
`
}

async function run(): Promise<void> {
  const site = path.resolve('site')
  const historyDir = path.resolve('.pages-history')
  const playwrightReport = path.resolve('playwright-report')
  const aiDashboard = path.resolve('reports/session-dashboard.html')

  await rm(site, { recursive: true, force: true })
  await mkdir(site, { recursive: true })
  await mkdir(historyDir, { recursive: true })

  const prevIndex = await readJson<HistoryEntry[]>(path.join(historyDir, 'history.json'), [])

  const totals = await readTotals()

  const runId = env('GITHUB_RUN_ID', `local-${Date.now()}`)
  const sha = env('GITHUB_SHA', 'local')
  const entry: HistoryEntry = {
    runId,
    sha,
    shortSha: sha.slice(0, 7),
    branch: env('GITHUB_REF_NAME', 'local'),
    timestamp: new Date().toISOString(),
    total: totals.total,
    passed: totals.passed,
    failed: totals.failed,
    retries: totals.retries,
    flaky: totals.flaky,
    runUrl: runUrl(),
  }

  const mergedHistory = [entry, ...prevIndex.filter((e) => e.runId !== runId)].slice(0, HISTORY_LIMIT)

  await copyIfExists(playwrightReport, path.join(site, 'latest', 'playwright-report'))
  await copyIfExists(aiDashboard, path.join(site, 'latest', 'session-dashboard.html'))
  await copyIfExists(playwrightReport, path.join(site, 'runs', runId, 'playwright-report'))
  await copyIfExists(aiDashboard, path.join(site, 'runs', runId, 'session-dashboard.html'))

  const keepRunIds = new Set(mergedHistory.map((e) => e.runId))
  for (const prev of prevIndex) {
    if (!keepRunIds.has(prev.runId)) continue
    if (prev.runId === runId) continue
    const src = path.join(historyDir, 'runs', prev.runId)
    if (existsSync(src)) await cp(src, path.join(site, 'runs', prev.runId), { recursive: true })
  }

  await writeFile(path.join(site, 'history.json'), JSON.stringify(mergedHistory, null, 2))
  await writeFile(
    path.join(site, 'index.html'),
    renderIndex(mergedHistory, mergedHistory[0]),
  )

  await mkdir(path.join(site, 'badges'), { recursive: true })
  await writeFile(
    path.join(site, 'badges', 'tests.json'),
    JSON.stringify({
      schemaVersion: 1,
      label: 'tests',
      message: badgeMessage(totals),
      color: badgeColor(totals),
    }),
  )

  await rm(historyDir, { recursive: true, force: true })
  await mkdir(historyDir, { recursive: true })
  await cp(path.join(site, 'runs'), path.join(historyDir, 'runs'), { recursive: true, force: true })
  await writeFile(path.join(historyDir, 'history.json'), JSON.stringify(mergedHistory, null, 2))

  console.log(
    `Site built: ${mergedHistory.length} history entries · latest=${entry.shortSha} · totals=${totals.passed}/${totals.total}`,
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
