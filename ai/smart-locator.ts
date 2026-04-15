import type { Locator, Page } from '@playwright/test'
import { appendAuditFromResult } from './audit.js'
import { saveLocatorCache } from './cache.js'
import type { AIService, LocatorCache, LocatorCacheEntry } from './types.js'

type SmartLocatorOptions = {
  confidenceThreshold?: number
}

export type SmartLocator = {
  locate(page: Page, hint: string): Promise<Locator>
  reinforce(hint: string, outcome: 'passed' | 'failed'): Promise<void>
  getCache(): LocatorCache
}

function nowIso(): string {
  return new Date().toISOString()
}

function createEntry(selector: string, confidence: number): LocatorCacheEntry {
  const now = nowIso()
  return {
    selector,
    confidence,
    generatedAt: now,
    lastValidated: now,
    successCount: 0,
    failCount: 0,
    healHistory: [],
  }
}

export function createSmartLocator(aiService: AIService, cache: LocatorCache, options: SmartLocatorOptions = {}): SmartLocator {
  const threshold = options.confidenceThreshold ?? Number((globalThis as any).process?.env?.AI_CONFIDENCE_THRESHOLD ?? 0.8)

  async function resolveDom(page: Page): Promise<string> {
    return page.content()
  }

  async function findStableSelector(page: Page, hint: string): Promise<string> {
    const existing = cache[hint]
    if (existing) {
      return existing.selector
    }

    const generated = await aiService.generateLocator(hint, await resolveDom(page))
    const selector = generated.confidence >= threshold ? generated.value : generated.fallback ?? generated.value
    cache[hint] = createEntry(selector, generated.confidence)

    await appendAuditFromResult({
      capability: 'smart-locator',
      action: 'generate',
      input: hint,
      output: selector,
      confidence: generated.confidence,
      reasoning: generated.reasoning,
      tokensUsed: generated.tokensUsed,
      costUSD: generated.costUSD,
    })

    await saveLocatorCache(cache)
    return selector
  }

  return {
    locate: async (page, hint) => {
      const selector = await findStableSelector(page, hint)
      const locator = page.locator(selector)

      try {
        await locator.first().waitFor({ state: 'visible', timeout: 4_000 })
        return locator
      } catch {
        const old = cache[hint]?.selector ?? selector
        const healed = await aiService.healLocator(old, await resolveDom(page))
        const newSelector = healed.confidence >= threshold ? healed.value : healed.fallback ?? old

        const existing = cache[hint] ?? createEntry(newSelector, healed.confidence)
        existing.selector = newSelector
        existing.confidence = healed.confidence
        existing.lastValidated = nowIso()
        existing.healHistory.push({
          healedAt: nowIso(),
          oldSelector: old,
          newSelector,
          triggerReason: 'element_not_found',
        })
        cache[hint] = existing

        await appendAuditFromResult({
          capability: 'smart-locator',
          action: 'heal',
          input: hint,
          output: newSelector,
          confidence: healed.confidence,
          reasoning: healed.reasoning,
          tokensUsed: healed.tokensUsed,
          costUSD: healed.costUSD,
        })

        await saveLocatorCache(cache)
        return page.locator(newSelector)
      }
    },

    reinforce: async (hint, outcome) => {
      const entry = cache[hint]
      if (!entry) return

      if (outcome === 'passed') {
        entry.successCount += 1
        entry.confidence = Math.min(1, Number((entry.confidence + 0.1).toFixed(2)))
      } else {
        entry.failCount += 1
        entry.confidence = Math.max(0, Number((entry.confidence - 0.5).toFixed(2)))
      }

      entry.lastValidated = nowIso()
      await saveLocatorCache(cache)
    },

    getCache: () => cache,
  }
}
