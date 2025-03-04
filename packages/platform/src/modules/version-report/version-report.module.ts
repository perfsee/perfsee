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

import { Module, EffectModule, Effect, ImmerReducer, Reducer } from '@sigi/core'
import { Draft } from 'immer'
import { Observable } from 'rxjs'
import { map, startWith, endWith, switchMap, withLatestFrom, filter, delay } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher, RxFetch, BundleResult } from '@perfsee/platform/common'
import {
  ArtifactByCommitQuery,
  artifactByCommitQuery,
  appVersionsQuery,
  snapshotReportsByCommitQuery,
  SnapshotReportsByCommitQuery,
  issuesByReportIdQuery,
  sourceIssuesCountQuery,
} from '@perfsee/schema'

import { ProjectModule } from '../shared'

import {
  LighthouseContent,
  SourceIssue,
  Version,
  VersionArtifactDetail,
  VersionArtifactJob,
  VersionCommits,
  VersionIssues,
  VersionLab,
  VersionLHContent,
} from './types'

interface State {
  allCommits: VersionCommits
  artifactJob: VersionArtifactJob
  artifactDetail: VersionArtifactDetail
  lab: VersionLab
  issues: VersionIssues
  lhContent: VersionLHContent
  currentIssueCount: number
}

@Module('HashReportModule')
export class HashReportModule extends EffectModule<State> {
  readonly defaultState: State = this.getInitState()

  constructor(
    private readonly fetch: RxFetch,
    private readonly client: GraphQLClient,
    private readonly projectModule: ProjectModule,
  ) {
    super()
  }

  @ImmerReducer()
  setLoading(
    state: Draft<State>,
    { key, value }: { key: 'allCommits' | 'artifactJob' | 'lab' | 'lhContent' | 'artifactDetail'; value: boolean },
  ) {
    state[key].loading = value
  }

  @Reducer()
  resetData(state: State) {
    return {
      ...state,
      ...this.getModuleInitState(),
    }
  }

  @Reducer()
  dispose() {
    return this.getInitState()
  }

  @ImmerReducer()
  setCommits(state: Draft<State>, payload: Version[]) {
    state.allCommits.commits = payload.map((p) => p.hash)
    state.allCommits.versions = payload.reduce((obj, cur) => ({ ...obj, [cur.hash]: cur }), {})
  }

  @ImmerReducer()
  setLHContent(state: Draft<State>, payload: LighthouseContent) {
    state.lhContent = {
      audits: payload.lhrAudit,
      categories: payload.lhrCategories,
      metricScores: payload.metricScores,
      entities: payload.entities,
      fullPageScreenshot: payload.fullPageScreenshot,
      loading: false,
    }
  }

  @ImmerReducer()
  setArtifactDetail(state: Draft<State>, payload: BundleResult) {
    state.artifactDetail = {
      artifactDetail: payload,
      loading: false,
    }
  }

  @ImmerReducer()
  setArtifact(state: Draft<State>, payload: ArtifactByCommitQuery['project']['artifactByCommit']) {
    if (payload) {
      state.artifactJob = {
        loading: false,
        artifact: payload,
      }
    }
  }

  @ImmerReducer()
  setSnapshot(state: Draft<State>, payload: SnapshotReportsByCommitQuery['project']['snapshotReports']) {
    if (payload) {
      state.lab = {
        loading: false,
        reports: payload,
      }
    }
  }

  @ImmerReducer()
  setIssueLoading(state: Draft<State>, { snapshotReportId, value }: { snapshotReportId: number; value: boolean }) {
    state.issues[snapshotReportId] = {
      ...state.issues[snapshotReportId],
      loading: value,
    }
  }

  @ImmerReducer()
  setIssues(state: Draft<State>, { snapshotReportId, data }: { snapshotReportId: number; data: SourceIssue[] }) {
    state.issues[snapshotReportId] = {
      ...state.issues[snapshotReportId],
      loading: false,
      issues: data,
    }
  }

  @ImmerReducer()
  setSourceIssueCount(state: Draft<State>, payload: number) {
    state.currentIssueCount = payload
  }

  @Effect()
  getRecentCommits(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([, { project }]) =>
        this.client
          .query({
            query: appVersionsQuery,
            variables: { projectId: project!.id, length: 100 },
          })
          .pipe(
            createErrorCatcher('Failed to fetch commits from snapshots.'),
            map((res) => {
              return this.getActions().setCommits(res.project.appVersions)
            }),
            startWith(this.getActions().setLoading({ key: 'allCommits', value: true })),
            endWith(this.getActions().delaySetCommitLoading()),
          ),
      ),
    )
  }

  // in case loading twinkle
  @Effect()
  delaySetCommitLoading(payload$: Observable<void>) {
    return payload$.pipe(
      delay(200),
      map(() => this.getActions().setLoading({ key: 'allCommits', value: false })),
    )
  }

  @Effect()
  getArtifactByCommit(payload$: Observable<string>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([hash, { project }]) =>
        this.client
          .query({
            query: artifactByCommitQuery,
            variables: {
              projectId: project!.id,
              hash,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch comparable artifact jobs by hash.'),
            map((res) => this.getActions().setArtifact(res.project.artifactByCommit)),
            startWith(this.getActions().setLoading({ key: 'artifactJob', value: true })),
            endWith(this.getActions().setLoading({ key: 'artifactJob', value: false })),
          ),
      ),
    )
  }

  @Effect()
  getSnapshotByCommit(payload$: Observable<{ hash: string }>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ hash }, { project }]) =>
        this.client
          .query({
            query: snapshotReportsByCommitQuery,
            variables: {
              projectId: project!.id,
              hash,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch snapshot.'),
            map((data) => this.getActions().setSnapshot(data.project.snapshotReports)),
            startWith(this.getActions().setLoading({ key: 'lab', value: true })),
            endWith(this.getActions().setLoading({ key: 'lab', value: false })),
          ),
      ),
    )
  }

  @Effect()
  getIssuesByReportId(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([snapshotReportId, { project }]) =>
        this.client
          .query({
            query: issuesByReportIdQuery,
            variables: {
              projectId: project!.id,
              snapshotReportId,
            },
          })
          .pipe(
            createErrorCatcher('Fetch issues by report id failed'),
            map((res) =>
              this.getActions().setIssues({
                snapshotReportId,
                data: res.project.snapshotReport.issues,
              }),
            ),
            startWith(this.getActions().setIssueLoading({ snapshotReportId, value: true })),
            endWith(this.getActions().setIssueLoading({ snapshotReportId, value: false })),
          ),
      ),
    )
  }

  @Effect()
  fetchReportDetail(payload$: Observable<string | null>) {
    return payload$.pipe(
      filter((storageKey) => !!storageKey),
      switchMap((storageKey) =>
        this.fetch.get<LighthouseContent>(storageKey!).pipe(
          createErrorCatcher('Failed to fetch report lighthouse content.'),
          map((res) => this.getActions().setLHContent(res)),
          startWith(this.getActions().setLoading({ key: 'lhContent', value: true })),
          endWith(this.getActions().setLoading({ key: 'lhContent', value: false })),
        ),
      ),
    )
  }

  @Effect()
  fetchArtifactDetail(payload$: Observable<string | null>) {
    return payload$.pipe(
      filter((storageKey) => !!storageKey),
      switchMap((storageKey) =>
        this.fetch.get<BundleResult>(storageKey!).pipe(
          createErrorCatcher('Failed to fetch version report artifact detail.'),
          map((res) => this.getActions().setArtifactDetail(res)),
          startWith(this.getActions().setLoading({ key: 'artifactDetail', value: true })),
          endWith(this.getActions().setLoading({ key: 'artifactDetail', value: false })),
        ),
      ),
    )
  }

  @Effect()
  fetchSourceIssueCount(payload$: Observable<{ hash: string }>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ hash }, { project }]) =>
        this.client
          .query({
            query: sourceIssuesCountQuery,
            variables: {
              projectId: project!.id,
              hash,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch source issue count.'),
            map((res) => this.getActions().setSourceIssueCount(res.project.sourceIssues.pageInfo.totalCount)),
          ),
      ),
    )
  }

  private getModuleInitState() {
    return {
      artifactJob: {
        loading: false,
      },
      lab: {
        loading: false,
      },
      issues: {
        loading: false,
        list: [],
        totalCount: 0,
      },
      currentIssueCount: 0,
      lhContent: { loading: false, metricScores: [] },
      artifactDetail: {
        loading: false,
      },
    }
  }

  private getInitState(): State {
    return {
      allCommits: {
        commits: [],
        versions: {},
        loading: true,
      },
      ...this.getModuleInitState(),
    }
  }
}
