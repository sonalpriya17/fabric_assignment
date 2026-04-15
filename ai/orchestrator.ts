import { readFile } from 'fs/promises'
import path from 'path'
import { appendAuditFromResult } from './audit.js'
import type { AIService } from './types.js'

export type SessionSummary = {
  decisions: number
  avgConfidence: number
  totalCostUSD: number
}

export type AIOrchestrator = {
  summarizeSession(scenarioGoal: string): Promise<SessionSummary>
}

const cwd = (globalThis as { process?: { cwd?: () => string } }).process?.cwd?.() ?? '.'
const AUDIT_FILE = path.resolve(cwd, 'ai-audit/audit-log.jsonl')

export function createAIOrchestrator(aiService: AIService): AIOrchestrator {
  return {
    summarizeSession: async (scenarioGoal) => {
      let entries: Array<{ confidence: number; costUSD: number }> = []

      try {
        const raw = await readFile(AUDIT_FILE, 'utf8')
        entries = raw
          .split('\n')
          .filter(Boolean)
          .map((line: string) => JSON.parse(line) as { confidence?: number; costUSD?: number })
          .map((line: { confidence?: number; costUSD?: number }) => ({ confidence: line.confidence ?? 0, costUSD: line.costUSD ?? 0 }))
      } catch {
        entries = []
      }

      const decisions = entries.length
      const totalCostUSD = Number(entries.reduce((acc, item) => acc + item.costUSD, 0).toFixed(6))
      const avgConfidence = decisions === 0 ? 0 : Number((entries.reduce((acc, item) => acc + item.confidence, 0) / decisions).toFixed(3))

      const plan = await aiService.planScenario('Summarize AI session health', scenarioGoal)
      await appendAuditFromResult({
        capability: 'orchestrator',
        action: 'session-summary',
        input: scenarioGoal,
        output: plan.value.join(' | '),
        confidence: plan.confidence,
        reasoning: plan.reasoning,
        tokensUsed: plan.tokensUsed,
        costUSD: plan.costUSD,
      })

      return { decisions, avgConfidence, totalCostUSD }
    },
  }
}
