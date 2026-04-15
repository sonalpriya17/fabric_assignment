/// <reference types="node" />

import { readFile } from 'node:fs/promises'

export type PlaywrightLeaf = {
  status?: string
  expectedStatus?: string
  retries?: number
  attachments?: Array<{ path?: string; name?: string }>
}

export type PlaywrightNode = {
  title?: string
  file?: string
  suites?: PlaywrightNode[]
  specs?: Array<{ title?: string; tests?: Array<{ results?: PlaywrightLeaf[] }> }>
}

export type Totals = {
  total: number
  passed: number
  failed: number
  retries: number
  flaky: number
  failedAttachments: string[]
}

export function flattenResults(root: PlaywrightNode): PlaywrightLeaf[] {
  const out: PlaywrightLeaf[] = []
  const walk = (node: PlaywrightNode): void => {
    for (const suite of node.suites ?? []) walk(suite)
    for (const spec of node.specs ?? []) {
      for (const test of spec.tests ?? []) {
        for (const result of test.results ?? []) out.push(result)
      }
    }
  }
  walk(root)
  return out
}

function countFlaky(results: PlaywrightLeaf[]): number {
  return results.filter((r) => r.status === 'flaky' || ((r.retries ?? 0) > 0 && r.status === 'passed')).length
}

export function computeTotals(results: PlaywrightLeaf[]): Totals {
  const total = results.length
  const passed = results.filter((r) => r.status === 'passed').length
  const failed = results.filter((r) => r.status === 'failed' || r.status === 'timedOut').length
  const flaky = countFlaky(results)
  const retries = results.reduce((acc, r) => acc + (r.retries ?? 0), 0)
  const failedAttachments = results
    .filter((r) => r.status === 'failed' || r.status === 'timedOut')
    .flatMap((r) => r.attachments ?? [])
    .map((a) => a.path || a.name)
    .filter((v): v is string => Boolean(v))
  return { total, passed, failed, retries, flaky, failedAttachments }
}

export async function readTotals(path = 'reports/playwright-results.json'): Promise<Totals> {
  const raw = await readFile(path, 'utf8').catch(() => '{}')
  const json = JSON.parse(raw) as PlaywrightNode
  return computeTotals(flattenResults(json))
}
