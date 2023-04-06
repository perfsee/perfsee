import { Size } from '.'

export interface SourceAnalyzeStatistics {
  scriptCount?: number
  sourceMapCount?: number
  artifacts?: {
    id: number
    createdAt: string
    branch?: string
    hash: string
    entryPoints: string[]
    size: Size
    initialSize: Size
  }[]
  totalExecutionTimeMs?: number
  thirdPartyScriptTimeUsingMs?: number
}
