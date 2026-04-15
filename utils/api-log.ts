/// <reference types="node" />

import type { APIRequestContext, APIResponse, TestInfo } from '@playwright/test'

type RequestOpts = {
  data?: unknown
  form?: Record<string, string>
  headers?: Record<string, string>
  failOnStatusCode?: boolean
}

type Logged = {
  method: string
  url: string
  requestHeaders?: Record<string, string>
  requestBody?: unknown
  status: number
  statusText: string
  responseHeaders: Record<string, string>
  responseBody: unknown
  durationMs: number
}

async function parseBody(res: APIResponse): Promise<{ full: unknown; forDisplay: unknown }> {
  const text = await res.text()
  try {
    const parsed = JSON.parse(text)
    return { full: parsed, forDisplay: parsed }
  } catch {
    const forDisplay = text.length > 4_000 ? `${text.slice(0, 4_000)}\u2026[truncated ${text.length - 4_000} chars]` : text
    return { full: text, forDisplay }
  }
}

export async function loggedRequest(
  testInfo: TestInfo,
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  opts: RequestOpts = {},
): Promise<{ res: APIResponse; body: unknown; entry: Logged }> {
  const started = Date.now()
  const fn = method === 'GET' ? request.get.bind(request) : method === 'POST' ? request.post.bind(request) : method === 'PUT' ? request.put.bind(request) : request.delete.bind(request)
  const res = await fn(url, opts as any)
  const { full, forDisplay } = await parseBody(res)
  const entry: Logged = {
    method,
    url,
    requestHeaders: opts.headers,
    requestBody: opts.data ?? opts.form,
    status: res.status(),
    statusText: res.statusText(),
    responseHeaders: res.headers(),
    responseBody: forDisplay,
    durationMs: Date.now() - started,
  }
  await attachApiLog(testInfo, entry)
  return { res, body: full, entry }
}

export async function attachApiLog(testInfo: TestInfo, entry: Logged): Promise<void> {
  const body = JSON.stringify(entry, null, 2)
  const name = `api · ${entry.method} ${entry.url.split('?')[0].split('/').slice(-3).join('/')} · ${entry.status}`
  await testInfo.attach(name, { body, contentType: 'application/json' })
}

export async function attachAssertion(testInfo: TestInfo, label: string, detail: Record<string, unknown>): Promise<void> {
  const body = JSON.stringify({ label, ...detail }, null, 2)
  await testInfo.attach(`assertion · ${label}`, { body, contentType: 'application/json' })
}
