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

import git from 'isomorphic-git'
import { CancellationToken } from 'vscode'

import { GitHost, PaginationInput } from '@perfsee/schema'
import { gitHostFromDomain } from '@perfsee/shared'
import { parseGitRemoteUrl } from '@perfsee/utils'

import { ApiClient, UnauthorizedError } from '../api/api-client'
import { ArtifactResult, memoizeGetArtifactByHash, memoizeGetLastArtifactsByProjectId } from '../api/artifact'
import { memoizeGetProjectsByNamespaceAndName } from '../api/project'
import { memoizeGetReportsBySnapshotId, ReportResult } from '../api/report'
import { memoizeGetSnapshots, memoizeGetSnapshotsByCommit } from '../api/snapshots'
import { memoizeGetSourceIssuesByHash } from '../api/source-issue'
import settings from '../settings'
import { CanceledError } from '../utils/async'
import { hasCommitLocal, isomorphicGitCache, memoizeGitDistance } from '../utils/git'
import Logger from '../utils/logger'

import Issue from './issue'
import Profile from './profile'

import { LoadingProgress } from './'

export interface HashSchema {
  name: string
  branch: string

  /**
   * debug-only
   */
  rawArtifact: ArtifactResult
}

export default class Project {
  /**
   * Load projects from the root path.
   * Contains the following steps:
   * - Find projects based on the git remote address which start with 'git@github.com:' or 'http://github.com/'
   * - Find the source issues based on the latest 20 commits.
   */
  static async loadProjects(
    rootPath: string,
    apiClient: ApiClient,
    progress?: LoadingProgress,
    cancellationToken?: CancellationToken,
  ) {
    // get the HEAD commit
    const headCommit = (await git.log({ fs, dir: rootPath, ref: 'HEAD', cache: isomorphicGitCache, depth: 1 }))[0]

    if (!headCommit) {
      Logger.debug(`skip ${rootPath}: can't read git commit`)
      return []
    }

    // get current branch
    const branch = await git.currentBranch({ fs, dir: rootPath, cache: isomorphicGitCache, fullname: false })

    if (!branch) {
      Logger.debug(`skip ${rootPath}: can't read git branch`)
      return []
    }

    const currentCommitHash = headCommit.oid

    // get namespace and name from git remotes address
    const remotes = await git.listRemotes({ fs, dir: rootPath, cache: isomorphicGitCache })
    let gitRepo: { host: string; namespace: string; name: string } | null = null
    for (const remote of remotes) {
      gitRepo = parseGitRemoteUrl(remote.url)

      if (gitRepo) {
        break
      }
    }
    if (!gitRepo) {
      Logger.debug(`skip ${rootPath}: no gitlab repo found`)
      return []
    }

    progress?.report?.({ message: 'Searching projects...' })

    const host = gitHostFromDomain(gitRepo.host)
    if (!host) {
      return []
    }

    // search project by namespace and name, maybe multiple project return
    const searchProjects = await memoizeGetProjectsByNamespaceAndName(apiClient, host, gitRepo.namespace, gitRepo.name)

    if (!searchProjects.length) {
      Logger.debug(
        `skip ${rootPath}: unknown project on perfsee platform ${
          gitRepo.host + '/' + gitRepo.namespace + '/' + gitRepo.name
        }`,
      )
      return []
    }

    const resultProjects = []

    for (const searchProject of searchProjects) {
      const projectRoot = settings.project.root[searchProject.id] ?? rootPath

      const project: Project = new Project(
        apiClient,
        projectRoot,
        rootPath,
        searchProject.id,
        searchProject.name,
        searchProject.namespace,
        searchProject.host,
        branch,
        currentCommitHash,
      )

      progress?.report?.({ message: `Loading project: ${project.name}...` })

      try {
        const configurationHashName = settings.project.hash[searchProject.id]

        let activatedHash
        if (configurationHashName) {
          // if hash is configured
          const hash = await project.fetchHash(configurationHashName)

          if (!hash) {
            throw new Error(`Failed to load hash '${configurationHashName}.'`)
          }

          activatedHash = hash
        } else {
          // auto hash detection
          const hashes = (await project.fetchHashes({ first: 50 })).hashes // fetch all hash

          if (hashes.length === 0) {
            Logger.info('skip emtry project:' + searchProject.id)
            continue
          }

          let lastestHash = null
          let shortestDistance = Infinity

          // fetch lastest 50 snapshots
          const SnapshotHashList = (await memoizeGetSnapshots(apiClient, searchProject.id, 50))
            .map((result) => result.hash)
            .filter((hash) => !!hash) as string[]
          const SnapshotHashSet = new Set(
            SnapshotHashList, // filter null
          )
          const hashesWithSnapshot = hashes.filter((hash) => SnapshotHashSet.has(hash.name))
          for (const item of hashesWithSnapshot) {
            // find shortest distance from HEAD to hash
            try {
              const distance = await memoizeGitDistance({
                dir: project.gitRoot,
                commitA: currentCommitHash,
                commitB: item.name,
                maxDepth: 20,
              })
              Logger.debug(`distance from ${item.name} to HEAD :`, distance)
              const distanceNum =
                (distance.ahead ?? Number.MAX_SAFE_INTEGER) + (distance.behind ?? Number.MAX_SAFE_INTEGER)
              if (distanceNum < shortestDistance) {
                shortestDistance = distanceNum
                lastestHash = item
              }
            } catch (err) {
              Logger.err(err instanceof Error ? err.message : `${err}`)
            }
          }

          if (lastestHash === null && SnapshotHashList.length > 0) {
            // fallback: use the first hash in snapshot
            lastestHash = await project.fetchHash(SnapshotHashList[0])
          }

          // fallback: use the first hash
          activatedHash = lastestHash ?? hashes[0]
        }

        const missingCommit = !(await hasCommitLocal({ dir: rootPath, commitHash: activatedHash.name }))

        project.activatedHash = activatedHash
        project.missingCommit = missingCommit

        const issueResults = await memoizeGetSourceIssuesByHash(apiClient, project.id, activatedHash.name)
        if (issueResults.length > 0) {
          const lastestHash = issueResults[0].hash

          const issues = []
          for (const issueResult of issueResults) {
            // load issue instance, aggregation by framekey and code
            const index = issues.findIndex(
              (issue) => issue.key === issueResult.frameKey && issue.code === issueResult.code,
            )

            if (index !== -1) {
              issues[index].loadSample(issueResult)
            } else {
              issues.push(await Issue.loadIssue(issueResult, project))
            }
          }

          // filter old hash issue
          const lastestHashIssues = issues.filter((issue) => issue.lastestCommitHash === lastestHash)

          project.sourceIssues = lastestHashIssues
        }

        const flameChartReports: ReportResult[] = []

        const snapshots = await memoizeGetSnapshotsByCommit(apiClient, project.id, project.activatedHash!.name)

        for (const snapshot of snapshots) {
          const reports = await memoizeGetReportsBySnapshotId(apiClient, searchProject.id, snapshot.id)
          for (const report of reports) {
            if (report.flameChartLink) {
              flameChartReports.push(report)
            }
          }
        }

        const profiles = []

        for (let i = 0; i < flameChartReports.length; i++) {
          const report = flameChartReports[i]
          progress?.report?.({ message: `Loading profiles (${i}/${flameChartReports.length})...` })
          profiles.push(await Profile.loadProfile(apiClient, report, activatedHash.name, project))
        }

        project.profiles = profiles
      } catch (err) {
        if (err instanceof UnauthorizedError || err instanceof CanceledError) {
          throw err
        }
        project.isError = true
        project.errorMessage = err instanceof Error ? err.message : `${err}`
      }

      resultProjects.push(project)
    }

    if (cancellationToken?.isCancellationRequested) {
      throw new CanceledError()
    }

    return resultProjects
  }

  /**
   * profiles of activated hash
   */
  profiles?: Profile[]

  /**
   * issues of activated hash
   */
  sourceIssues?: Issue[]

  activatedHash?: HashSchema

  /**
   * indicating whether the activated hash commit is missing at local
   */
  missingCommit = false

  /**
   * indicating is error on load the project
   */
  isError = false

  /**
   * error message on load the project
   */
  errorMessage = ''

  constructor(
    public apiClient: ApiClient,
    public root: string,
    public gitRoot: string,
    public id: string,
    public name: string,
    public namespace: string,
    public host: GitHost,
    public branch: string,
    public commitHash: string,
  ) {}

  async fetchHashes(pagination: Partial<PaginationInput> = { first: 50 }) {
    const artifacts = await memoizeGetLastArtifactsByProjectId(this.apiClient, this.id, pagination)
    return {
      hashes: artifacts.nodes.map((artifact) => ({
        name: artifact.hash!,
        branch: artifact.branch,
        rawArtifact: artifact,
      })),
      pageInfo: artifacts.pageInfo,
    }
  }

  async fetchHash(hashName: string) {
    const artifact = await memoizeGetArtifactByHash(this.apiClient, this.id, hashName)
    return (
      artifact && {
        name: artifact.hash!,
        branch: artifact.branch,
        rawArtifact: artifact,
      }
    )
  }
}
