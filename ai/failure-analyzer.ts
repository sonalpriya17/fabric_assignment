import { appendAuditFromResult } from './audit.js'
import type { AIService, FailureSummary } from './types.js'

export type FailureAnalyzer = {
  analyze(error: Error, screenshotBase64?: string, scenarioId?: string): Promise<FailureSummary>
}

export function createFailureAnalyzer(aiService: AIService): FailureAnalyzer {
  return {
    analyze: async (error, screenshotBase64, scenarioId) => {
      const result = await aiService.analyzeFailure(error.message, screenshotBase64)

      await appendAuditFromResult({
        capability: 'failure-analyzer',
        action: 'analyze',
        input: error.message,
        output: JSON.stringify(result.value),
        confidence: result.confidence,
        reasoning: result.reasoning,
        tokensUsed: result.tokensUsed,
        costUSD: result.costUSD,
        scenarioId,
      })

      return result.value
    },
  }
}
