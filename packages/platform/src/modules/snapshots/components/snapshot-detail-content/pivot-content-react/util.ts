import { ProfilingDataForRoot, ReactProfileData } from '@perfsee/shared'

import {
  commitGradient,
  TREE_OPERATION_ADD,
  ElementTypeRoot,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REMOVE_ROOT,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
} from './constant'
import { ChartData, ChartNode, CommitTree, CommitTreeNode, ElementType } from './types'

export const scale =
  (
    minValue: number,
    maxValue: number,
    minRange: number,
    maxRange: number,
  ): ((value: number, fallbackValue: number) => number) =>
  (value: number, fallbackValue: number) =>
    maxValue - minValue === 0 ? fallbackValue : ((value - minValue) / (maxValue - minValue)) * (maxRange - minRange)

export function utfDecodeString(array: Array<number>): string {
  // Avoid spreading the array (e.g. String.fromCodePoint(...array))
  // Functions arguments are first placed on the stack before the function is called
  // which throws a RangeError for large arrays.
  // See github.com/facebook/react/issues/22293
  let string = ''
  for (const char of array) {
    string += String.fromCodePoint(char)
  }
  return string
}

export const getGradientColor = (value: number): string => {
  const maxIndex = commitGradient.length - 1
  let index
  if (Number.isNaN(value)) {
    index = 0
  } else if (!Number.isFinite(value)) {
    index = maxIndex
  } else {
    index = Math.max(0, Math.min(maxIndex, value)) * maxIndex
  }
  return commitGradient[Math.round(index)]
}

const rootToCommitTreeMap: Map<number, Array<CommitTree>> = new Map()

export function getCommitTree({
  commitIndex,
  profilingData,
  rootID,
}: {
  commitIndex: number
  profilingData: ReactProfileData
  rootID: number
}): CommitTree {
  if (!rootToCommitTreeMap.has(rootID)) {
    rootToCommitTreeMap.set(rootID, [])
  }

  const commitTrees: Array<CommitTree> = rootToCommitTreeMap.get(rootID)!
  if (commitIndex < commitTrees.length) {
    return commitTrees[commitIndex]
  }

  if (profilingData === null) {
    throw Error(`No profiling data available`)
  }

  const dataForRoot = profilingData.dataForRoots[rootID]
  if (dataForRoot == null) {
    throw Error(`Could not find profiling data for root "${rootID}"`)
  }

  const { operations } = dataForRoot
  if (operations.length <= commitIndex) {
    throw Error(
      `getCommitTree(): Invalid commit "${commitIndex}" for root "${rootID}". There are only "${operations.length}" commits.`,
    )
  }

  let commitTree: CommitTree | null = null
  for (let index = commitTrees.length; index <= commitIndex; index++) {
    // Commits are generated sequentially and cached.
    // If this is the very first commit, start with the cached snapshot and apply the first mutation.
    // Otherwise load (or generate) the previous commit and append a mutation to it.
    if (index === 0) {
      const nodes = new Map()

      // Construct the initial tree.
      recursivelyInitializeTree(rootID, 0, nodes, dataForRoot)

      // Mutate the tree
      if (operations != null && index < operations.length) {
        commitTree = updateTree({ nodes, rootID }, operations[index])

        commitTrees.push(commitTree)
      }
    } else {
      const previousCommitTree = commitTrees[index - 1]
      commitTree = updateTree(previousCommitTree, operations[index])

      commitTrees.push(commitTree)
    }
  }

  return commitTree!
}

function recursivelyInitializeTree(
  id: number,
  parentID: number,
  nodes: Map<number, CommitTreeNode>,
  dataForRoot: ProfilingDataForRoot,
): void {
  const node = dataForRoot.snapshots[id]
  if (node != null) {
    nodes.set(id, {
      id,
      children: node.children,
      displayName: node.displayName,
      hocDisplayNames: node.hocDisplayNames,
      key: node.key,
      parentID,
      treeBaseDuration: dataForRoot.initialTreeBaseDurations[id],
      type: node.type,
    })

    node.children.forEach((childID) => recursivelyInitializeTree(childID, id, nodes, dataForRoot))
  }
}

function updateTree(commitTree: CommitTree, operations: Array<number>): CommitTree {
  // Clone the original tree so edits don't affect it.
  const nodes = new Map(commitTree.nodes)

  // Clone nodes before mutating them so edits don't affect them.
  const getClonedNode = (id: number): CommitTreeNode => {
    const clonedNode = Object.assign({}, nodes.get(id))
    nodes.set(id, clonedNode)
    return clonedNode
  }

  let i = 2
  let id: number | null = null

  // Reassemble the string table.
  const stringTable: Array<string | null> = [
    null, // ID = 0 corresponds to the null string.
  ]
  const stringTableSize = operations[i++]
  const stringTableEnd = i + stringTableSize
  while (i < stringTableEnd) {
    const nextLength = operations[i++]
    const nextString = utfDecodeString(operations.slice(i, i + nextLength))
    stringTable.push(nextString)
    i += nextLength
  }

  while (i < operations.length) {
    const operation = operations[i]

    switch (operation) {
      case TREE_OPERATION_ADD: {
        id = operations[i + 1]
        const type = operations[i + 2] as ElementType

        i += 3

        if (nodes.has(id)) {
          throw new Error(`Commit tree already contains fiber "${id}". This is a bug in React DevTools.`)
        }

        if (type === ElementTypeRoot) {
          i++ // isStrictModeCompliant
          i++ // Profiling flag
          i++ // supportsStrictMode flag
          i++ // hasOwnerMetadata flag

          const node: CommitTreeNode = {
            children: [],
            displayName: null,
            hocDisplayNames: null,
            id,
            key: null,
            parentID: 0,
            treeBaseDuration: 0, // This will be updated by a subsequent operation
            type,
          }

          nodes.set(id, node)
        } else {
          const parentID = operations[i]
          i++

          i++ // ownerID

          const displayNameStringID = operations[i]
          const displayName = stringTable[displayNameStringID]
          i++

          const keyStringID = operations[i]
          const key = stringTable[keyStringID]
          i++

          const parentNode = getClonedNode(parentID)
          parentNode.children = parentNode.children.concat(id)

          const node: CommitTreeNode = {
            children: [],
            displayName,
            hocDisplayNames: null,
            id,
            key,
            parentID,
            treeBaseDuration: 0, // This will be updated by a subsequent operation
            type,
          }

          nodes.set(id, node)
        }

        break
      }
      case TREE_OPERATION_REMOVE: {
        const removeLength = operations[i + 1]
        i += 2

        for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
          id = operations[i]
          i++

          if (!nodes.has(id)) {
            throw new Error(`Commit tree does not contain fiber "${id}". This is a bug in React DevTools.`)
          }

          const node = getClonedNode(id)
          const parentID = node.parentID

          nodes.delete(id)

          if (!nodes.has(parentID)) {
            // No-op
          } else {
            const parentNode = getClonedNode(parentID)

            parentNode.children = parentNode.children.filter((childID) => childID !== id)
          }
        }
        break
      }
      case TREE_OPERATION_REMOVE_ROOT: {
        throw Error('Operation REMOVE_ROOT is not supported while profiling.')
      }
      case TREE_OPERATION_REORDER_CHILDREN: {
        id = operations[i + 1]
        const numChildren = operations[i + 2]
        const children = operations.slice(i + 3, i + 3 + numChildren)

        i = i + 3 + numChildren

        const node = getClonedNode(id)
        node.children = Array.from(children)

        break
      }
      case TREE_OPERATION_SET_SUBTREE_MODE: {
        id = operations[i + 1]

        i += 3

        break
      }
      case TREE_OPERATION_UPDATE_TREE_BASE_DURATION: {
        id = operations[i + 1]

        const node = getClonedNode(id)
        node.treeBaseDuration = operations[i + 2] / 1000 // Convert microseconds back to milliseconds;

        i += 3
        break
      }
      case TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS: {
        id = operations[i + 1]

        i += 4

        break
      }

      default:
        throw Error(`Unsupported Bridge operation "${operation}"`)
    }
  }

  return {
    nodes,
    rootID: commitTree.rootID,
  }
}

const cachedChartData: Map<string, ChartData> = new Map()

export function getChartData({
  commitIndex,
  commitTree,
  profilingData,
  rootID,
}: {
  commitIndex: number
  commitTree: CommitTree
  profilingData: ReactProfileData
  rootID: number
}): ChartData {
  const commitDatum = profilingData.dataForRoots[rootID].commitData[commitIndex]

  const { fiberActualDurations, fiberSelfDurations } = commitDatum
  const { nodes } = commitTree

  const chartDataKey = `${rootID}-${commitIndex}`
  if (cachedChartData.has(chartDataKey)) {
    return cachedChartData.get(chartDataKey)!
  }

  const idToDepthMap: Map<number, number> = new Map()
  const renderPathNodes: Set<number> = new Set()
  const rows: Array<Array<ChartNode>> = []

  let maxDepth = 0
  let maxSelfDuration = 0

  // Generate flame graph structure using tree base durations.
  const walkTree = (id: number, rightOffset: number, currentDepth: number) => {
    idToDepthMap.set(id, currentDepth)

    const node = nodes.get(id)
    if (node == null) {
      throw Error(`Could not find node with id "${id}" in commit tree`)
    }

    const { children, displayName, hocDisplayNames, key, treeBaseDuration } = node

    const actualDuration = fiberActualDurations[id] || 0
    const selfDuration = fiberSelfDurations[id] || 0
    const didRender = !!fiberActualDurations[id]

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

    maxDepth = Math.max(maxDepth, currentDepth)
    maxSelfDuration = Math.max(maxSelfDuration, selfDuration)

    const chartNode: ChartNode = {
      actualDuration,
      didRender,
      id,
      label,
      name,
      offset: rightOffset - treeBaseDuration,
      selfDuration,
      treeBaseDuration,
    }

    if (currentDepth > rows.length) {
      rows.push([chartNode])
    } else {
      rows[currentDepth - 1].push(chartNode)
    }

    for (let i = children.length - 1; i >= 0; i--) {
      const childID = children[i]
      const childChartNode = walkTree(childID, rightOffset, currentDepth + 1)
      rightOffset -= childChartNode.treeBaseDuration
    }

    return chartNode
  }

  let baseDuration = 0

  // Special case to handle unmounted roots.
  if (nodes.size > 0) {
    // Skip over the root; we don't want to show it in the flamegraph.
    const root = nodes.get(rootID)
    if (root == null) {
      throw Error(`Could not find root node with id "${rootID}" in commit tree`)
    }

    // Don't assume a single root.
    // Component filters or Fragments might lead to multiple "roots" in a flame graph.
    for (let i = root.children.length - 1; i >= 0; i--) {
      const id = root.children[i]
      const node = nodes.get(id)
      if (node == null) {
        throw Error(`Could not find node with id "${id}" in commit tree`)
      }
      baseDuration += node.treeBaseDuration
      walkTree(id, baseDuration, 1)
    }

    new Map(Object.entries(fiberActualDurations)).forEach((_duration, id) => {
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
  }

  const chartData = {
    baseDuration,
    depth: maxDepth,
    idToDepthMap,
    maxSelfDuration,
    renderPathNodes,
    rows,
  }

  cachedChartData.set(chartDataKey, chartData)

  return chartData
}

export const formatDuration = (duration: number): number | string => Math.round(duration * 10) / 10 || '<0.1'
export const formatPercentage = (percentage: number): number => Math.round(percentage * 100)
export const formatTime = (timestamp: number): number => Math.round(Math.round(timestamp) / 100) / 10
