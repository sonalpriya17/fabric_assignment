import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function statePath(key: string): string {
  return path.resolve(process.cwd(), 'tests/_state', `${key}.state.json`)
}

export async function writeStateFile<T extends Record<string, unknown>>(key: string, value: T): Promise<void> {
  const file = statePath(key)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(value, null, 2), 'utf8')
}

export async function readStateFile<T extends Record<string, unknown>>(key: string): Promise<T> {
  const raw = await readFile(statePath(key), 'utf8')
  return JSON.parse(raw) as T
}
