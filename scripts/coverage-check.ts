import { readFile } from 'fs/promises'
import path from 'path'
import { parsePromptBlocks } from './prompt-parser.js'

function toMethodName(step: string): string {
  return step
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part, idx) => (idx === 0 ? part.toLowerCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()))
    .join('')
}

async function run(): Promise<void> {
  const root = process.cwd()
  const promptFiles = [path.join(root, 'prompts/ui.prompts.md'), path.join(root, 'prompts/api.prompts.md')]
  const pageFiles = [
    'pages/login.page.ts',
    'pages/registration.page.ts',
    'pages/accounts-overview.page.ts',
    'pages/open-account.page.ts',
    'pages/transfer-funds.page.ts',
    'pages/bill-payment.page.ts',
  ]

  const pageContent = (await Promise.all(pageFiles.map((f) => readFile(path.join(root, f), 'utf8').catch(() => '')))).join('\n')

  let ready = 0
  let total = 0

  for (const promptFile of promptFiles) {
    const content = await readFile(promptFile, 'utf8').catch(() => '')
    const blocks = parsePromptBlocks(content, path.basename(promptFile)).filter((b) => b.status === 'ACTIVE')

    for (const block of blocks) {
      total += 1
      const journeyMatch = block.body.match(/User Journey:[\s\S]*?(?=\n\n[A-Z]|$)/)
      const steps = journeyMatch?.[0].match(/\d+\.\s+(.+)/g)?.map((line) => line.replace(/^\d+\.\s+/, '').trim()) ?? []
      const missing = steps
        .map(toMethodName)
        .filter((method) => method.length > 2)
        .filter((method) => !pageContent.includes(`${method}(`))

      if (missing.length === 0) {
        ready += 1
        console.log(`✓ ${block.id} — all POM methods present`)
      } else {
        console.log(`✗ ${block.id} — MISSING: ${missing.join(', ')}`)
      }
    }
  }

  console.log(`\nPOM Coverage: ${ready}/${total} prompts ready to generate`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
