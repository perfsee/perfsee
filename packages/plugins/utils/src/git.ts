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

import simpleGit from 'simple-git'

import { parseGitRemoteUrl } from '@perfsee/utils'

export const getCurrentCommit = async () => {
  try {
    return await simpleGit()
      .log({ n: 1 })
      .then((stats) => {
        if (!stats.latest) {
          throw new Error('No commit found')
        }

        return stats.latest.hash
      })
  } catch {
    return undefined
  }
}

export const getCommitMessage = async (commitHash: string) => {
  try {
    return await simpleGit()
      .show([commitHash, '--format=%s'])
      .then((commitMessage: string) => {
        return commitMessage.replace(/\n.*/g, '').substring(0, 255)
      })
  } catch {
    try {
      // in github action, the commit maybe not in local
      console.info(`Fetching commit '${commitHash}' information from origin.`)
      await simpleGit().fetch(['origin', commitHash, '--depth', '1'])

      return await simpleGit()
        .show([commitHash, '--format=%s'])
        .then((commitMessage: string) => {
          return commitMessage.replace(/\n.*/g, '').substring(0, 255)
        })
    } catch {
      return undefined
    }
  }
}

export const getCommitAuthorEmail = async (commitHash: string) => {
  try {
    return await simpleGit().show([commitHash, '--format=%ae', '-s'])
  } catch {
    try {
      // in github action, the commit maybe not in local
      console.info(`Fetching commit '${commitHash}' information from origin.`)
      await simpleGit().fetch(['origin', commitHash, '--depth', '1'])

      return await simpleGit().show([commitHash, '--format=%ae', '-s'])
    } catch {
      return undefined
    }
  }
}

export const getProjectInfoFromGit = async () => {
  const git = simpleGit()

  const project = await git.getRemotes(true).then(([remote]) => parseGitRemoteUrl(remote.refs.fetch))
  if (!project) {
    return null
  }

  const branch = await git.branchLocal().then((br) => br.current)

  return {
    ...project,
    branch,
  }
}
