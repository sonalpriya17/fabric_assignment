/// <reference types="node" />

import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClaudeAIService } from '../ai/claude.js'
import { parsePromptBlocks } from './prompt-parser.js'
import { validateTempFile } from './code-validator.js'
import { writeGenerationReport, type GenerationReport } from './report-writer.js'

type HashMap = Record<string, string>

function computeHash(content: string): string {
  return createHash('md5').update(content).digest('hex')
}

function toSpecPath(root: string, id: string, moduleName: string, testType: string): string {
  const scope = id.includes('-API-') ? 'api' : 'ui'
  const moduleSlug = moduleName.trim().toLowerCase().replace(/\s+/g, '-')
  const typeSlug = testType.trim().toLowerCase().replace(/\s+/g, '-')
  return path.join(root, 'tests', scope, moduleSlug, `${id}.${typeSlug}.spec.ts`)
}

function extractMethodsFromPrompt(blockBody: string): string[] {
  const lines = blockBody.match(/\d+\.\s+(.+)/g)?.map((line) => line.replace(/^\d+\.\s+/, '').trim()) ?? []
  return lines.map((line) =>
    line
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .trim()
      .split(/\s+/)
      .map((part, idx) => (idx === 0 ? part.toLowerCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()))
      .join(''),
  )
}

function buildFallbackSpec(id: string, reason: string): string {
  return `import { test } from '../../support/fixtures.js'\n\n` +
    `test.skip('@prompt-${id.toLowerCase()} generated placeholder', async () => {\n` +
    `  test.info().annotations.push({ type: 'generator', description: '${reason.replace(/'/g, "")}' })\n` +
    `})\n`
}

function buildPromptForAI(blockBody: string, pageContext: string): string {
  return `Generate a Playwright test file from prompt block:\n${blockBody}\n\nUse this page context:\n${pageContext}`
}

async function readPromptFiles(root: string): Promise<Array<{ file: string; content: string }>> {
  const files = ['prompts/ui.prompts.md', 'prompts/api.prompts.md']
  const result: Array<{ file: string; content: string }> = []

  for (const file of files) {
    const abs = path.join(root, file)
    const content = await readFile(abs, 'utf8').catch(() => '')
    if (content.trim().length > 0) {
      result.push({ file, content })
    }
  }

  return result
}

async function readPageContext(root: string): Promise<string> {
  const pageFiles = [
    'pages/base.page.ts',
    'pages/login.page.ts',
    'pages/registration.page.ts',
    'pages/accounts-overview.page.ts',
    'pages/open-account.page.ts',
    'pages/transfer-funds.page.ts',
    'pages/bill-payment.page.ts',
  ]

  const content = await Promise.all(
    pageFiles.map(async (file) => {
      const abs = path.join(root, file)
      const text = await readFile(abs, 'utf8').catch(() => '')
      return `\n// ${file}\n${text}`
    }),
  )

  return content.join('\n')
}

async function run(): Promise<void> {
  const root = process.cwd()
  const hashFile = path.join(root, 'prompts/.prompt-hashes.json')
  const hashes: HashMap = JSON.parse(await readFile(hashFile, 'utf8').catch(() => '{}')) as HashMap

  const aiService = createClaudeAIService(process.env.ANTHROPIC_API_KEY ?? '')
  const promptFiles = await readPromptFiles(root)
  const pageContext = await readPageContext(root)

  const report: GenerationReport = {
    runAt: new Date().toISOString(),
    generated: [],
    skipped_draft: [],
    skipped_unchanged: [],
    deprecated_deleted: [],
    missingPomMethods: {},
    errors: [],
  }

  for (const { file, content } of promptFiles) {
    const blocks = parsePromptBlocks(content, file)

    for (const block of blocks) {
      const blockHash = computeHash(block.body)
      const specPath = toSpecPath(root, block.id, block.module, block.testType)

      if (block.status === 'DRAFT') {
        report.skipped_draft.push(block.id)
        continue
      }

      if (block.status === 'DEPRECATED') {
        await rm(specPath, { force: true })
        report.deprecated_deleted.push(block.id)
        delete hashes[block.id]
        continue
      }

      if (hashes[block.id] === blockHash) {
        report.skipped_unchanged.push(block.id)
        continue
      }

      const methods = extractMethodsFromPrompt(block.body).filter((m) => m.length > 2)
      const missing = methods.filter((m) => !pageContext.includes(`${m}(`))
      if (missing.length > 0) {
        report.missingPomMethods[block.id] = missing
        await mkdir(path.dirname(specPath), { recursive: true })
        await writeFile(specPath, buildFallbackSpec(block.id, `MISSING_POM_METHOD: ${missing.join(', ')}`), 'utf8')
        continue
      }

      const aiResult = await aiService.generateCode(buildPromptForAI(block.body, pageContext), pageContext)
      const generated = aiResult.value.includes('MISSING_METHOD:')
        ? buildFallbackSpec(block.id, aiResult.value.trim())
        : aiResult.value

      const tempPath = `${specPath}.tmp.ts`
      await mkdir(path.dirname(specPath), { recursive: true })
      await writeFile(tempPath, generated, 'utf8')

      const validation = await validateTempFile(path.join(root, 'tsconfig.json'))
      if (!validation.ok) {
        report.errors.push(`${block.id}: ${validation.message}`)
        await writeFile(specPath, buildFallbackSpec(block.id, 'Compilation failed in generated output'), 'utf8')
      } else {
        await writeFile(specPath, generated, 'utf8')
        report.generated.push(block.id)
        hashes[block.id] = blockHash
      }

      await rm(tempPath, { force: true })
    }
  }

  await mkdir(path.dirname(hashFile), { recursive: true })
  await writeFile(hashFile, JSON.stringify(hashes, null, 2), 'utf8')
  await writeGenerationReport(report)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
