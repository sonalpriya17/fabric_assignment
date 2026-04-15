import { readFile } from 'fs/promises'
import path from 'path'

type AuditLine = {
  confidence?: number
  costUSD?: number
}

export async function buildSessionSummary(): Promise<{ decisions: number; avgConfidence: number; costUSD: number }> {
  const auditPath = path.resolve(process.cwd(), 'ai-audit/audit-log.jsonl')
  let lines: AuditLine[] = []

  try {
    const raw = await readFile(auditPath, 'utf8')
    lines = raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AuditLine)
  } catch {
    lines = []
  }

  const decisions = lines.length
  const costUSD = Number(lines.reduce((acc, line) => acc + (line.costUSD ?? 0), 0).toFixed(6))
  const avgConfidence = decisions === 0 ? 0 : Number((lines.reduce((acc, line) => acc + (line.confidence ?? 0), 0) / decisions).toFixed(3))

  return { decisions, avgConfidence, costUSD }
}
