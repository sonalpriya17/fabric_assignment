import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import type { LocatorCache } from './types.js'

const CACHE_FILE = path.resolve(process.cwd(), 'ai/cache/locator-cache.json')

export async function loadLocatorCache(): Promise<LocatorCache> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8')
    return JSON.parse(raw) as LocatorCache
  } catch {
    return {}
  }
}

export async function saveLocatorCache(cache: LocatorCache): Promise<void> {
  await mkdir(path.dirname(CACHE_FILE), { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8')
}
