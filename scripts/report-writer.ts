import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export type GenerationReport = {
  runAt: string
  generated: string[]
  skipped_draft: string[]
  skipped_unchanged: string[]
  deprecated_deleted: string[]
  missingPomMethods: Record<string, string[]>
  errors: string[]
}

export async function writeGenerationReport(report: GenerationReport): Promise<void> {
  const reportPath = path.resolve(process.cwd(), 'reports/generation-report.json')
  await mkdir(path.dirname(reportPath), { recursive: true })
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
}
