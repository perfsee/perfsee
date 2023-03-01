import type {
  CommitTree,
  CommitTreeNode,
  ElementType,
  ProfilingDataForRootFrontend,
  ProfilingDataFrontend,
} from 'react-devtools-inline'

const TREE_OPERATION_ADD = 1
const TREE_OPERATION_REMOVE = 2
const TREE_OPERATION_REORDER_CHILDREN = 3
const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4
const TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS = 5
const TREE_OPERATION_REMOVE_ROOT = 6
const TREE_OPERATION_SET_SUBTREE_MODE = 7

const ElementTypeRoot = 11

function recursivelyInitializeTree(
  id: number,
  parentID: number,
  nodes: Map<number, CommitTreeNode>,
  dataForRoot: ProfilingDataForRootFrontend,
): void {
  const node = dataForRoot.snapshots.get(id)
  if (node != null) {
    nodes.set(id, {
      id,
      children: node.children,
      displayName: node.displayName,
      hocDisplayNames: node.hocDisplayNames,
      key: node.key,
      parentID,
      treeBaseDuration: dataForRoot.initialTreeBaseDurations.get(id)!,
      type: node.type,
    })

    node.children.forEach((childID) => recursivelyInitializeTree(childID, id, nodes, dataForRoot))
  }
}

function utfDecodeString(array: Array<number>): string {
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

export function getCommitTrees({
  profilingData,
  rootID,
}: {
  profilingData: ProfilingDataFrontend
  rootID: number
}): CommitTree[] {
  const commitTrees: CommitTree[] = []
  const dataForRoot = profilingData.dataForRoots.get(rootID)
  if (dataForRoot == null) {
    throw Error(`Could not find profiling data for root "${rootID}"`)
  }

  const { operations, commitData } = dataForRoot

  let commitTree: CommitTree | null = null
  for (let index = 0; index < commitData.length; index++) {
    // Commits are generated sequentially and cached.
    // If this is the very first commit, start with the cached snapshot and apply the first mutation.
    // Otherwise load (or generate) the previous commit and append a mutation to it.
    if (index === 0) {
      const nodes = new Map()

      // Construct the initial tree.
      recursivelyInitializeTree(rootID, 0, nodes, dataForRoot)

      // Mutate the tree
      commitTree = updateTree({ nodes, rootID }, operations[index])

      commitTrees.push(commitTree)
    } else {
      const previousCommitTree = commitTrees[index - 1]
      commitTree = updateTree(previousCommitTree, operations[index])

      commitTrees.push(commitTree)
    }
  }

  return commitTrees
}
