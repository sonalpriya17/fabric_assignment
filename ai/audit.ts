import { mkdir, appendFile } from 'fs/promises'
import path from 'path'
import type { AuditEntry } from './types.js'

const AUDIT_FILE = path.resolve(process.cwd(), 'ai-audit/audit-log.jsonl')

export async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  await mkdir(path.dirname(AUDIT_FILE), { recursive: true })
  await appendFile(AUDIT_FILE, `${JSON.stringify(entry)}\n`, 'utf8')
}

export async function appendAuditFromResult(args: {
  capability: AuditEntry['capability']
  action: string
  input: string
  output?: string
  confidence: number
  reasoning: string
  tokensUsed: number
  costUSD: number
  outcome?: string
  scenarioId?: string
}): Promise<void> {
  await appendAuditEntry({
    ts: new Date().toISOString(),
    capability: args.capability,
    action: args.action,
    input: args.input,
    output: args.output,
    confidence: args.confidence,
    reasoning: args.reasoning,
    tokens: args.tokensUsed,
    costUSD: args.costUSD,
    outcome: args.outcome,
    scenarioId: args.scenarioId,
  })
}
