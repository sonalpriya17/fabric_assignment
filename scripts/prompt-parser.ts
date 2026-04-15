export type PromptStatus = 'ACTIVE' | 'DRAFT' | 'DEPRECATED'

export type PromptBlock = {
  id: string
  status: PromptStatus
  module: string
  testType: string
  body: string
  sourceFile: string
}

function readField(block: string, key: string): string {
  const match = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  return match?.[1]?.trim() ?? ''
}

export function parsePromptBlocks(markdown: string, sourceFile: string): PromptBlock[] {
  const matches = markdown.matchAll(/##\s+(PROMPT-[A-Z]+-\d+)[\s\S]*?(?=\n---\n##\s+PROMPT-|$)/g)
  const blocks: PromptBlock[] = []

  for (const match of matches) {
    const section = match[0]
    const id = match[1]
    const status = (readField(section, 'Status') || 'DRAFT') as PromptStatus
    const module = readField(section, 'Module') || 'General'
    const testType = readField(section, 'Test Type') || 'HAPPY_PATH'

    blocks.push({
      id,
      status,
      module,
      testType,
      body: section,
      sourceFile,
    })
  }

  return blocks
}
