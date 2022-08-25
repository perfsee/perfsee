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

import { SourceIssueResult } from '../api/source-issue'
import { memoizeReadFileFromCommit } from '../utils/git'
import Logger from '../utils/logger'
import parseFrameKey from '../utils/parse-frame-key'

import Project from './project'

export interface IssueSample {
  id: number
  snapshotReportId: number
  commitHash: string
  duration: number
  issue: Issue

  /**
   * debug-only
   */
  rawIssue?: SourceIssueResult
}

export default class Issue {
  static async loadIssue(data: SourceIssueResult, project: Project): Promise<Issue> {
    const frameKey = parseFrameKey(data.frameKey)

    let source = null
    try {
      source = await memoizeReadFileFromCommit({
        dir: project.gitRoot,
        filepath: path.resolve(project.root, frameKey.file),
        commitHash: data.hash,
      })
    } catch (err) {
      Logger.debug("can't find source from commit: " + frameKey.file)
    }

    const issue = new Issue(
      data.frameKey,
      data.code,
      frameKey.file,
      frameKey.function,
      frameKey.line,
      frameKey.col,
      project,
      source,
      !!data.info.isSource,
    )

    issue.loadSample(data)

    return issue
  }

  /**
   * array of issue samples, assuming sorting from newest to oldest.
   */
  samples: IssueSample[] = []

  get lastestCommitHash() {
    return this.samples[0].commitHash
  }

  get lastestSample() {
    return this.samples[0]
  }

  get avgDuration() {
    return this.samples.reduce((prev, current) => prev + current.duration, 0) / this.samples.length
  }

  get lastestDuration() {
    return this.samples[0].duration
  }

  constructor(
    public key: string,
    public code: string,
    public file: string,
    public name: string,
    public line: number,
    public col: number,
    public project: Project,
    public source: string | null,
    public isSource: boolean,
  ) {}

  loadSample(data: SourceIssueResult) {
    this.samples.push({
      id: data.id,
      snapshotReportId: data.snapshotReport.id,
      commitHash: data.hash,
      duration: data.info.value,
      rawIssue: data,
      issue: this,
    })
  }
}
