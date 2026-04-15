import { appendAuditFromResult } from './audit.js'
import type { AIService } from './types.js'

export type VisualAssertion = {
  assertSemanticMatch(expectedDescription: string, actualDescription: string, scenarioId?: string): Promise<boolean>
}

export function createVisualAssertion(aiService: AIService, threshold = 0.75): VisualAssertion {
  return {
    assertSemanticMatch: async (expectedDescription, actualDescription, scenarioId) => {
      const result = await aiService.assessVisualMatch({ expectedDescription, actualDescription })
      const passed = result.confidence >= threshold ? result.value : result.fallback ?? false

      await appendAuditFromResult({
        capability: 'visual-assert',
        action: 'assert',
        input: expectedDescription,
        output: `${passed}`,
        confidence: result.confidence,
        reasoning: result.reasoning,
        tokensUsed: result.tokensUsed,
        costUSD: result.costUSD,
        scenarioId,
      })

      return passed
    },
  }
}
