export interface ChartNode {
  actualDuration: number
  didRender: boolean
  id: number
  label: string
  name: string
  offset: number
  selfDuration: number
  treeBaseDuration: number
}

export interface ChartData {
  baseDuration: number
  depth: number
  idToDepthMap: Map<number, number>
  maxSelfDuration: number
  renderPathNodes: Set<number>
  rows: Array<Array<ChartNode>>
}

export interface ItemData {
  chartData: ChartData
  onElementMouseEnter: (fiberData: TooltipFiberData) => void
  onElementMouseLeave: () => void
  scaleX: (value: number, fallbackValue: number) => number
  selectedChartNode: ChartNode | null
  selectedChartNodeIndex: number
  selectFiber: (id: number | null, name: string | null) => void
  width: number
}

export interface CommitFlameGraphProps {
  chartData: ChartData
}

export interface TooltipFiberData {
  id: number
  name: string
}

export type ElementType = 1 | 2 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14
export type CommitTreeNode = {
  id: number
  children: Array<number>
  displayName: string | null
  hocDisplayNames: Array<string> | null
  key: number | string | null
  parentID: number
  treeBaseDuration: number
  type: ElementType
}

export type CommitTree = {
  nodes: Map<number, CommitTreeNode>
  rootID: number
}

export type SerializedElement = {
  displayName: string | null
  id: number
  key: number | string | null
  hocDisplayNames: Array<string> | null
  type: ElementType
}
