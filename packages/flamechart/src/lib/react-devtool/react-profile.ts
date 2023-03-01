import type { CommitTree, CommitTreeNode, ProfilingDataFrontend } from 'react-devtools-inline'
import { CallTreeProfileBuilder, Frame, FrameInfo } from '../profile'
import { TimeFormatter } from '../value-formatters'
import { getCommitTrees } from './replayer'

export interface ReactNodeInfo {
  actualDuration: number
  didRender: boolean
  id: number
  label: string
  name: string
  selfDuration: number
  isRenderPath: boolean
}

export interface ReactFrameInfo extends FrameInfo, ReactNodeInfo {}

export class ReactFrame extends Frame {
  info: ReactFrameInfo

  public constructor(info: ReactFrameInfo) {
    super(info)
    this.info = info
  }
}

export class ReactProfile extends CallTreeProfileBuilder {
  maxSelfDuration = 0

  enterReactNode(info: ReactNodeInfo, start: number) {
    this.maxSelfDuration = Math.max(this.maxSelfDuration, info.selfDuration)
    super.enterFrame(
      new ReactFrame({
        key: info.id,
        file: info.label,
        ...info,
        name: info.label,
      }),
      start,
    )
  }

  leaveReactNode(info: ReactNodeInfo, end: number): void {
    super.leaveFrame(
      new ReactFrame({
        key: info.id,
        file: info.label,
        ...info,
        name: info.label,
      }),
      end,
    )
  }

  static buildFromProfileData({
    commitIndex,
    commitTree,
    profilingData,
    rootID,
  }: {
    commitIndex: number
    commitTree: CommitTree
    profilingData: ProfilingDataFrontend
    rootID: number
  }): ReactProfile {
    const reactProfile = new ReactProfile()
    reactProfile.setValueFormatter(new TimeFormatter('milliseconds'))
    const commitDatum = profilingData.dataForRoots.get(rootID)!.commitData[commitIndex]

    const { fiberActualDurations, fiberSelfDurations } = commitDatum
    const { nodes } = commitTree

    const renderPathNodes: Set<number> = new Set()

    // Generate flame graph structure using tree base durations.
    const walkTree = (node: CommitTreeNode, leftOffset: number, rightLimit: number) => {
      const { id, children, displayName, hocDisplayNames, key, treeBaseDuration } = node

      const actualDuration = fiberActualDurations.get(id) || 0
      const selfDuration = fiberSelfDurations.get(id) || 0
      const didRender = !!fiberActualDurations.get(id)

      const name = displayName || 'Anonymous'
      const maybeKey = key !== null ? ` key="${key}"` : ''

      let maybeBadge = ''
      if (hocDisplayNames !== null && hocDisplayNames.length > 0) {
        maybeBadge = ` (${hocDisplayNames[0]})`
      }

      let label = `${name}${maybeBadge}${maybeKey}`
      if (didRender) {
        label += ` (${formatDuration(selfDuration)}ms of ${formatDuration(actualDuration)}ms)`
      }

      const start = Math.min(leftOffset, rightLimit)
      const end = Math.max(Math.min(start + treeBaseDuration, rightLimit), start)

      const info = {
        actualDuration,
        didRender,
        id,
        label,
        name,
        selfDuration,
        isRenderPath: renderPathNodes.has(id),
      }

      console.log('start:', start)
      reactProfile.enterReactNode(info, start)

      const childNodes = children.map((childID) => {
        const node = nodes.get(childID)
        if (node == null) {
          throw Error(`Could not find node with id "${childID}" in commit tree`)
        }

        return node
      })

      leftOffset +=
        treeBaseDuration -
        childNodes.reduce((prev, { treeBaseDuration }) => prev + treeBaseDuration, 0) -
        Number.EPSILON

      for (const child of childNodes) {
        walkTree(child, leftOffset, end)
        leftOffset += child.treeBaseDuration
      }

      reactProfile.leaveReactNode(info, end)
    }

    let baseDuration = 0

    // Special case to handle unmounted roots.
    if (nodes.size > 0) {
      // Skip over the root; we don't want to show it in the flamegraph.
      const root = nodes.get(rootID)
      if (root == null) {
        throw Error(`Could not find root node with id "${rootID}" in commit tree`)
      }

      fiberActualDurations.forEach((_duration, id) => {
        let node = nodes.get(Number(id))
        if (node != null) {
          let currentID = node.parentID
          while (currentID !== 0) {
            if (renderPathNodes.has(currentID)) {
              // We've already walked this path; we can skip it.
              break
            } else {
              renderPathNodes.add(currentID)
            }

            node = nodes.get(currentID)
            currentID = node != null ? node.parentID : 0
          }
        }
      })

      // Don't assume a single root.
      // Component filters or Fragments might lead to multiple "roots" in a flame graph.
      for (const id of root.children) {
        const node = nodes.get(id)
        if (node == null) {
          throw Error(`Could not find node with id "${id}" in commit tree`)
        }
        walkTree(node, baseDuration, baseDuration + node.treeBaseDuration)
        baseDuration += node.treeBaseDuration
      }
    }

    return reactProfile.build() as ReactProfile
  }
}

const formatDuration = (duration: number): number | string => Math.round(duration * 10) / 10 || '<0.1'

export function buildProfilesFromReactDevtoolExportProfileData(profilingData: ProfilingDataFrontend) {
  const profiles: Record<number, ReactProfile[]> = {}
  for (const [_, dataForRoot] of profilingData.dataForRoots) {
    const rootID = dataForRoot.rootID
    const commitTrees = getCommitTrees({ profilingData, rootID })
    profiles[rootID] = commitTrees.map((commitTree, i) => {
      return ReactProfile.buildFromProfileData({
        commitIndex: i,
        commitTree,
        rootID,
        profilingData,
      })
    })
  }
  return profiles
}
