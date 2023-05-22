import type { ProfilingDataFrontend, CommitTreeNode as OriginCommitTreeNode } from 'react-devtools-inline'

export interface ReactDevtoolProfilingDataFrontend extends ProfilingDataFrontend {
  fiberLocations?: string[]
  parsedLocations?: {
    name: string
    file: string
    line: number
    col: number
  }[]
}

export interface CommitTreeNode extends OriginCommitTreeNode {
  locationId?: string | null
}
