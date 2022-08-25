/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import fs from 'fs'
import path from 'path'

import git, { Errors } from 'isomorphic-git'

import { memoizePromise } from './cache'
import Logger from './logger'

// https://isomorphic-git.org/docs/en/cache#docsNav
export const isomorphicGitCache = {}

export class CommitNotFoundError extends Error {
  constructor(public commitHash: string) {
    super('Commit Not Found: ' + commitHash)
  }
}

export const readFileFromCommit = Logger.trace('readFileFromCommit')(
  async ({ dir, filepath, commitHash }: { dir: string; filepath: string; commitHash: string }) => {
    let commit
    try {
      commit = await git.readCommit({ fs, dir, cache: isomorphicGitCache, oid: commitHash })
    } catch (err) {
      if (err instanceof Errors.NotFoundError) {
        throw new CommitNotFoundError(err.message)
      }
      throw err
    }

    const relativeFilePath = path.relative(dir, path.resolve(dir, filepath))

    return (async function loop(tree, path): Promise<string | null> {
      if (!path.length) {
        return null
      }
      const name = path.shift()
      const { tree: treeEntries } = await git.readTree({ fs, dir, cache: isomorphicGitCache, oid: tree })
      const packageEntry = treeEntries.find((entry) => entry.path === name)
      if (!packageEntry) {
        return null
      } else {
        if (packageEntry.type === 'blob') {
          const { blob } = await git.readBlob({ fs, dir, cache: isomorphicGitCache, oid: packageEntry.oid })
          return new TextDecoder().decode(blob)
        } else if (packageEntry.type === 'tree') {
          return loop(packageEntry.oid, path)
        } else {
          throw new Error('never be here')
        }
      }
    })(commit.commit.tree, path.posix.normalize(relativeFilePath).split('/'))
  },
)

export const memoizeReadFileFromCommit = memoizePromise(
  readFileFromCommit,
  ({ dir, filepath, commitHash }) => dir + filepath + commitHash,
  /* disable auto-delete */ false,
)

export async function hasCommitLocal({ dir, commitHash }: { dir: string; commitHash: string }) {
  try {
    await git.readCommit({ fs, dir, cache: isomorphicGitCache, oid: commitHash })
    return true
  } catch (err) {
    if (err instanceof Errors.NotFoundError) {
      return false
    }
    throw err
  }
}

interface HistoryItem {
  depth: number
  oid: string
  parent: string[]
}

/**
 * Find the common parent commit of 2 refs, and calculate the distance between 2 refs.
 *
 * @example
 * gitDistance({dir, commitA: '5eb3c9d8b846cf2f8f6935b479e83657c123a286', commitB: 'ccba299a7dd2140075e59c027e6d2a456ce839ef'})
 * // return { ahead: 1, behind: 2 }
 */
export const gitDistance = Logger.trace('gitDistance')(
  async ({
    dir,
    commitA,
    commitB,
    maxDepth = Infinity,
  }: {
    dir: string
    commitA: string
    commitB: string
    maxDepth?: number
  }): Promise<{ ahead: number | null; behind: number | null }> => {
    let ahead = null
    let behind = null

    const historyA = new Map<string, HistoryItem>()
    const historyB = new Map<string, HistoryItem>()

    let currentBatchA: HistoryItem[] | null = null
    let currentBatchB: HistoryItem[] | null = null

    let currentDepth = 0

    while (ahead === null && behind === null) {
      let nextBatchOidsA: string[] = []
      let nextBatchOidsB: string[] = []

      if (currentBatchA === null) {
        nextBatchOidsA = [commitA]
      } else {
        for (const item of currentBatchA) {
          nextBatchOidsA.push(...item.parent)
        }
      }

      if (currentBatchB === null) {
        nextBatchOidsB = [commitB]
      } else {
        for (const item of currentBatchB) {
          nextBatchOidsB.push(...item.parent)
        }
      }

      currentBatchA = []
      const depthA = historyA.size + nextBatchOidsA.length - 1
      for (const oid of nextBatchOidsA) {
        const commitResult = await git.readCommit({ fs, dir, cache: isomorphicGitCache, oid })
        const item: HistoryItem = { oid, parent: commitResult.commit.parent, depth: depthA }

        historyA.set(oid, item)
        currentBatchA.push(item)
      }

      currentBatchB = []
      const depthB = historyB.size + nextBatchOidsB.length - 1
      for (const oid of nextBatchOidsB) {
        const commitResult = await git.readCommit({ fs, dir, cache: isomorphicGitCache, oid })
        const item: HistoryItem = { oid, parent: commitResult.commit.parent, depth: depthB }

        historyB.set(oid, item)
        currentBatchB.push(item)
      }

      const sharedParentB = currentBatchB?.find((item) => historyA.has(item.oid))
      if (sharedParentB) {
        ahead = sharedParentB.depth
        behind = historyA.get(sharedParentB.oid)!.depth
        break
      }

      const sharedParentA = currentBatchA?.find((item) => historyB.has(item.oid))
      if (sharedParentA) {
        behind = sharedParentA.depth
        ahead = historyB.get(sharedParentA.oid)!.depth
        break
      }

      currentDepth++
      if (currentDepth > maxDepth) {
        break
      }
      if (historyA.size + historyB.size > maxDepth * 2) {
        break
      }
      if (currentBatchA.length === 0 && currentBatchB.length === 0) {
        break
      }
    }

    return {
      behind,
      ahead,
    }
  },
)

export const memoizeGitDistance = memoizePromise(
  gitDistance,
  (arg) => JSON.stringify(arg),
  /* disable auto-delete */ false,
)
