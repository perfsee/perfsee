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

import { Module, EffectModule, Effect, DefineAction, Reducer, ImmerReducer } from '@sigi/core'
import { Draft, freeze } from 'immer'
import { from, forkJoin, Observable } from 'rxjs'
import { switchMap, map, withLatestFrom, filter, startWith, mergeMap, endWith } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher, RxFetch, getStorageLink } from '@perfsee/platform/common'
import { snapshotReportsByIdsQuery, snapshotReportQuery } from '@perfsee/schema'

import { ProjectModule } from '../shared'

import { SnapshotDetailType, SnapshotReportSchema } from './snapshot-type'
import { formatStorageResultToSnapshotDetail, LHStoredSchema } from './utils/format-storage-result-to-snapshot-detail'

interface State {
  snapshotReports: { [reportId: number]: SnapshotReportSchema }
  snapshotReportsDetail: { [key: string]: Omit<SnapshotDetailType, 'report'> }
  reportLoading: boolean
  detailLoading: boolean
}

@Module('Snapshot')
export class SnapshotModule extends EffectModule<State> {
  readonly defaultState = {
    snapshotReports: {},
    snapshotReportsDetail: {},
    reportLoading: true,
    detailLoading: true,
  }

  @DefineAction() dispose!: Observable<void>

  constructor(
    private readonly client: GraphQLClient,
    private readonly projectModule: ProjectModule,
    private readonly fetch: RxFetch,
  ) {
    super()
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, payload: boolean) {
    state.reportLoading = payload
  }

  @ImmerReducer()
  setDetailLoading(state: Draft<State>, payload: boolean) {
    state.detailLoading = payload
  }

  @Reducer()
  setReports(state: Draft<State>, payload: SnapshotReportSchema[]) {
    const snapshotReports: { [reportId: number]: SnapshotReportSchema } = {}

    payload.forEach((report) => {
      snapshotReports[report.id] = report
    })

    return { ...state, snapshotReports, reportLoading: false }
  }

  @ImmerReducer()
  setReport(state: Draft<State>, payload: SnapshotReportSchema | null) {
    if (!payload) {
      return state
    }

    state.snapshotReports[payload.id] = payload
    state.reportLoading = false
  }

  @Effect()
  fetchSnapshotReports(payload$: Observable<number[]>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([reportIds, { project }]) =>
        this.client
          .query({
            query: snapshotReportsByIdsQuery,
            variables: { projectId: project!.id, reportIds },
          })
          .pipe(
            createErrorCatcher('Failed to fetch snapshot reports by reports id'),
            map((data) => {
              return this.getActions().setReports(data.project.snapshotReports)
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  fetchSnapshotReport(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$, this.state$),
      filter(([reportId, { project }, { snapshotReports }]) => !!project && !snapshotReports[reportId]),
      mergeMap(([reportId, { project }]) =>
        this.client
          .query({
            query: snapshotReportQuery,
            variables: { projectId: project!.id, reportId },
          })
          .pipe(
            createErrorCatcher('Failed to fetch snapshot report by report id'),
            map((payload) => this.getActions().setReport(payload.project.snapshotReport)),
          ),
      ),
    )
  }

  @Effect()
  fetchReportsDetail(payload$: Observable<string[]>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      mergeMap(([keys, { snapshotReportsDetail }]) => {
        return forkJoin(
          keys
            .filter((key) => !snapshotReportsDetail[key])
            .map((key) => this.fetch.get<LHStoredSchema>(getStorageLink(key))),
        ).pipe(
          mergeMap((reports) => {
            return from(reports.map((report, i) => this.getActions().setReportDetail({ key: keys[i], detail: report })))
          }),
          startWith(this.getActions().setDetailLoading(true)),
          endWith(this.getActions().setDetailLoading(false)),
        )
      }),
    )
  }

  @ImmerReducer()
  setReportDetail(state: Draft<State>, payload: { key: string; detail: LHStoredSchema }) {
    state.snapshotReportsDetail[payload.key] = freeze({ ...formatStorageResultToSnapshotDetail(payload.detail) })
  }
}
