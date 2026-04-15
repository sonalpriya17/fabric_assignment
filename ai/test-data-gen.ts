import { appendAuditFromResult } from './audit.js'
import type { AIService, DataSchema } from './types.js'

export type TestDataGenerator = {
  generate(schema: DataSchema, scenarioId?: string): Promise<Record<string, unknown>>
}

export function createTestDataGenerator(aiService: AIService, threshold = 0.7): TestDataGenerator {
  return {
    generate: async (schema, scenarioId) => {
      const result = await aiService.generateTestData(schema)
      const value = result.confidence >= threshold ? result.value : result.fallback ?? result.value

      await appendAuditFromResult({
        capability: 'test-data-generator',
        action: 'generate',
        input: JSON.stringify(schema),
        output: JSON.stringify(value),
        confidence: result.confidence,
        reasoning: result.reasoning,
        tokensUsed: result.tokensUsed,
        costUSD: result.costUSD,
        scenarioId,
      })

      return value
    },
  }
}
