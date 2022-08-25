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

import path from 'path'

import { Position, TextDocument, Uri, workspace } from 'vscode'

import { buildProfileFromFlameChartData, Flamechart, FlamechartFrame, buildFlamechart } from '@perfsee/flamechart'
import { FlameChartData } from '@perfsee/shared'

import { memoizeGetAggregatedSnapshotByReportId, Metrics } from '../api/aggregated'
import { ApiClient } from '../api/api-client'
import { memoizeDownloadProfile } from '../api/profile'
import { ReportResult } from '../api/report'
import settings from '../settings'
import { memoize, memoizePromise } from '../utils/cache'
import { createDiffContext } from '../utils/diff-position'
import { memoizeReadFileFromCommit } from '../utils/git'
import Lazy from '../utils/lazy'
import Logger from '../utils/logger'

import Project from './project'

export interface CallSample {
  /**
   * microsecond
   */
  selfWeight: number

  /**
   * microsecond
   */
  totalWeight: number

  profile: Profile

  raw: FlamechartFrame
}

export interface CallDetail {
  name: string
  position: Position
  samples: CallSample[]
}

const loadFlamechartData = Logger.trace('loadFlamechartData')((data: FlameChartData) => {
  const profile = buildProfileFromFlameChartData(data)
  return buildFlamechart({
    minValue: profile.getMinValue(),
    maxValue: profile.getMaxValue(),
    getTotalWeight: profile.getTotalWeight.bind(profile),
    forEachCall: profile.forEachCall.bind(profile),
    formatValue: profile.formatValue.bind(profile),
    getColorBucketForFrame: null!,
  })
})

const memoizeLoadFlamechartData = memoize(
  loadFlamechartData,
  (flameChartStorageKey) => flameChartStorageKey,
  /* disable auto-delete */ false,
)

type PageResult = ReportResult['page']
type EnvironmentResult = ReportResult['environment']
type ProfileResult = ReportResult['profile']

export interface StatsNode {
  name: string
  duration: number
  rawPath?: string
  fsPath: string
  children: StatsNode[]
  parent?: StatsNode
}

export default class Profile {
  static memoizeStatsAll = memoize(
    Profile.statsAll,
    (profiles, basePath) => [profiles.map((profile) => profile.reportId), basePath].join('/'),
    false,
  )

  /**
   * Search call details from profiles by document.
   */
  @Logger.LogTime
  static async findCallDetailsByDocument(
    profiles: Profile[],
    documentOrPath: TextDocument | string,
    diffLine: boolean,
  ): Promise<CallDetail[]> {
    const commitHashProfiles = new Map<string, Profile[]>()

    const absoluteFilePath = path.normalize(
      typeof documentOrPath === 'string' ? documentOrPath : documentOrPath.uri.fsPath,
    )

    for (const profile of profiles) {
      const profiles = commitHashProfiles.get(profile.commitHash)
      if (profiles) {
        profiles.push(profile)
      } else {
        commitHashProfiles.set(profile.commitHash, [profile])
      }
    }

    const callDetails: CallDetail[] = []

    const document = new Lazy<Promise<TextDocument | null>>(async () => {
      if (typeof documentOrPath === 'string') {
        try {
          return await workspace.openTextDocument(Uri.file(documentOrPath))
        } catch (err) {
          return null
        }
      } else {
        return documentOrPath
      }
    })
    const source = new Lazy<Promise<string | null | undefined>>(async () => (await document.getValue())?.getText())

    for (const [commitHash, profiles] of commitHashProfiles.entries()) {
      const profileFrames = []
      for (const profile of profiles) {
        profileFrames.push(...profile.memoizeFindProfileFramesByFilePath(absoluteFilePath))
      }

      const oldPositions = profileFrames.map((frame) => {
        return new Position((frame.node.frame.line ?? -1) - 1, (frame.node.frame.col ?? Number.MAX_SAFE_INTEGER) - 1)
      })

      let positions

      if (diffLine) {
        const project = profiles[0].project
        let before = null
        try {
          before = await memoizeReadFileFromCommit({
            dir: project.gitRoot,
            filepath: absoluteFilePath,
            commitHash: commitHash,
          })
        } catch (err) {
          Logger.debug("can't find source from commit: " + absoluteFilePath)
        }
        const after = await source.getValue()
        const diff = before && after ? createDiffContext(before, after) : null

        positions = diff?.diffPosition(oldPositions) ?? oldPositions
      } else {
        positions = oldPositions
      }

      for (let i = 0; i < profileFrames.length; i++) {
        const frame = profileFrames[i]
        const position = positions[i]

        if (!position) continue

        const sample: CallSample = {
          totalWeight: frame.node.getTotalWeight(),
          selfWeight: frame.node.getSelfWeight(),
          profile: frame.profile,
          raw: frame,
        }

        const index = callDetails.findIndex(
          (callDetail) => callDetail.name === frame.node.frame.name && callDetail.position.isEqual(position),
        )

        if (index !== -1) {
          callDetails[index].samples.push(sample)
        } else {
          callDetails.push({
            name: frame.node.frame.name!,
            position,
            samples: [sample],
          })
        }
      }
    }

    return callDetails
  }

  static async loadProfile(apiClient: ApiClient, report: ReportResult, commitHash: string, project: Project) {
    const score = report.performanceScore
    const reportId = report.id
    const profile = report.profile
    const environment = report.environment
    const page = report.page
    const snapshotId = report.snapshot.id
    const rawData = await memoizeDownloadProfile(apiClient, report.flameChartStorageKey!)
    const data = memoizeLoadFlamechartData(rawData!)
    const filtered = settings.filteredProfile.includes(report.id)
    return new Profile(
      apiClient,
      data,
      commitHash,
      reportId,
      snapshotId,
      page,
      environment,
      profile,
      score,
      project,
      rawData,
      filtered,
    )
  }

  static statsAll(profiles: Profile[], basePath: string) {
    return profiles!.reduce((prev, curr) => curr.statsAll(basePath, prev), [] as StatsNode[])
  }

  memoizeGetMetrics = memoizePromise(
    async () => {
      return (
        await memoizeGetAggregatedSnapshotByReportId(this.apiClient, this.project.id, this.snapshotId, this.reportId)
      )?.metrics as Metrics | undefined
    },
    undefined,
    false,
  )

  private readonly memoizeFindProfileFramesByFilePath = memoize(
    this.findProfileFramesByFilePath,
    (filepath) => filepath,
    false,
  )

  constructor(
    public readonly apiClient: ApiClient,
    public readonly data: Flamechart,
    public readonly commitHash: string,
    public readonly reportId: number,
    public readonly snapshotId: number,
    public readonly page: PageResult,
    public readonly environment: EnvironmentResult,
    public readonly profile: ProfileResult,
    public readonly score: number | null,
    public readonly project: Project,
    public readonly rawData: FlameChartData,
    public readonly filtered: boolean,
  ) {}

  @Logger.LogTime
  statsAll(basePath: string, stats: StatsNode[]): StatsNode[] {
    for (const layer of this.data.getLayers()) {
      for (const frame of layer) {
        if (!frame.node.frame.file) continue
        let name = frame.node.frame.file

        if (name.match(/^https?:\/\//)) {
          continue
        }

        name = path.posix.normalize(path.relative(basePath, path.resolve(this.project.root, name)))

        const time = frame.node.getSelfWeight()

        const paths = name.split('/')

        let parent: StatsNode | null = null
        for (const item of paths) {
          const nodes: StatsNode[] = parent !== null ? parent.children : stats
          const node = nodes.find((target) => target.name === item)
          if (node) {
            node.duration += time
            parent = node
          } else {
            const fsPath = path.resolve(parent?.fsPath ?? this.project.root, item)
            const newNode: StatsNode = {
              name: item,
              duration: time,
              rawPath: frame.node.frame.file,
              fsPath,
              children: [],
              parent: parent ?? undefined,
            }

            nodes.push(newNode)
            parent = newNode
          }
        }
      }
    }

    return stats
  }

  private findProfileFramesByFilePath(filepath: string) {
    const relativeFilePath = path.relative(this.project.root, path.resolve(this.project.root, filepath))

    const profileFrames: (FlamechartFrame & { profile: Profile })[] = []
    for (const layer of this.data.getLayers()) {
      for (const frame of layer) {
        const file = frame.node.frame.file
        if (file && path.normalize(file) === relativeFilePath) {
          profileFrames.push({ ...frame, profile: this })
        }
      }
    }

    return profileFrames
  }
}
