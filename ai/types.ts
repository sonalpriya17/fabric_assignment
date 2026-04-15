export type AICapability =
  | 'smart-locator'
  | 'failure-analyzer'
  | 'test-data-generator'
  | 'visual-assert'
  | 'orchestrator'
  | 'code-generator'

export type AIResult<T> = {
  value: T
  confidence: number
  reasoning: string
  fallback?: T
  tokensUsed: number
  costUSD: number
}

export type DataSchema = {
  persona: string
  requiredFields: string[]
  constraints?: Record<string, unknown>
}

export type FailureSummary = {
  category: 'timeout' | 'assertion' | 'network' | 'locator' | 'unknown'
  probableCause: string
  nextActions: string[]
}

export type VisualAssertionInput = {
  expectedDescription: string
  actualDescription: string
}

export type AIService = {
  generateLocator(hint: string, dom: string): Promise<AIResult<string>>
  healLocator(broken: string, dom: string): Promise<AIResult<string>>
  generateTestData(schema: DataSchema): Promise<AIResult<Record<string, unknown>>>
  analyzeFailure(error: string, screenshotBase64?: string): Promise<AIResult<FailureSummary>>
  assessVisualMatch(input: VisualAssertionInput): Promise<AIResult<boolean>>
  planScenario(goal: string, context: string): Promise<AIResult<string[]>>
  generateCode(prompt: string, context: string): Promise<AIResult<string>>
}

export type LocatorCacheEntry = {
  selector: string
  confidence: number
  generatedAt: string
  lastValidated: string
  successCount: number
  failCount: number
  healHistory: Array<{
    healedAt: string
    oldSelector: string
    newSelector: string
    triggerReason: string
  }>
}

export type LocatorCache = Record<string, LocatorCacheEntry>

export type AuditEntry = {
  ts: string
  capability: AICapability
  action: string
  input: string
  output?: string
  confidence: number
  reasoning: string
  tokens: number
  costUSD: number
  outcome?: string
  scenarioId?: string
}
