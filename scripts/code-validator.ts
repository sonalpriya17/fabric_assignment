import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export type ValidationResult = {
  ok: boolean
  message?: string
}

export async function validateTempFile(tsconfigPath: string): Promise<ValidationResult> {
  try {
    await execFileAsync('npx', ['tsc', '--noEmit', '-p', tsconfigPath])
    return { ok: true }
  } catch (error: any) {
    return { ok: false, message: error?.stderr || error?.message || 'tsc validation failed' }
  }
}
