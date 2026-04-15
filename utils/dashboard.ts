/// <reference types="node" />

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildSessionSummary } from './report-builder.js'

function card(label: string, value: string): string {
  return `<div style="padding:12px;border:1px solid #ddd;border-radius:8px;"><div style="font-size:12px;color:#666;">${label}</div><div style="font-size:20px;font-weight:600;">${value}</div></div>`
}

async function run(): Promise<void> {
  const root = process.cwd()
  const reportPath = path.join(root, 'reports/generation-report.json')
  const outputPath = path.join(root, 'reports/session-dashboard.html')

  const generation = JSON.parse(await readFile(reportPath, 'utf8').catch(() => '{}')) as {
    generated?: string[]
    errors?: string[]
  }

  const summary = await buildSessionSummary()

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ParaBank AI Dashboard</title>
</head>
<body style="font-family: Inter, Arial, sans-serif; margin: 24px;">
  <h1>ParaBank AI Framework — Session Dashboard</h1>
  <div style="display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:12px;max-width:900px;">
    ${card('AI Decisions', `${summary.decisions}`)}
    ${card('Avg Confidence', `${summary.avgConfidence}`)}
    ${card('AI Cost (USD)', `$${summary.costUSD}`)}
    ${card('Generated Tests', `${generation.generated?.length ?? 0}`)}
  </div>

  <h2 style="margin-top:24px;">Generation Errors</h2>
  <ul>
    ${(generation.errors ?? []).map((err) => `<li>${err}</li>`).join('') || '<li>None</li>'}
  </ul>
</body>
</html>`

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html, 'utf8')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
