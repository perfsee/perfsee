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
import { from, forkJoin, Observable, merge } from 'rxjs'
import { switchMap, map, withLatestFrom, filter, startWith, mergeMap, endWith, tap } from 'rxjs/operators'

import { SnapshotDetailType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'
import { formatStorageResultToSnapshotDetail } from '@perfsee/lab-report/util'
import { GraphQLClient, createErrorCatcher, RxFetch } from '@perfsee/platform/common'
import { snapshotReportsByIdsQuery, snapshotReportQuery } from '@perfsee/schema'
import { LHStoredSchema, RequestSchema } from '@perfsee/shared'
import { Task } from '@perfsee/tracehouse'

import { ProjectModule } from '../shared'

interface State {
  snapshotReports: { [reportId: number]: SnapshotReportSchema }
  snapshotReportsDetail: { [key: string]: Omit<SnapshotDetailType, 'report'> }
  reportLoading: boolean
  detailLoading: boolean
}

@Module('Snapshot')
export class SnapshotModule extends EffectModule<State> {
  readonly defaultState = {
    snapshotReports: {} as { [reportId: number]: SnapshotReportSchema },
    snapshotReportsDetail: {} as { [key: string]: Omit<SnapshotDetailType, 'report'> },
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
  fetchReportsDetail(payload$: Observable<SnapshotReportSchema[]>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      mergeMap(([reportSchemas, { snapshotReportsDetail }]) => {
        return forkJoin(
          reportSchemas
            .filter((schema) => schema.reportLink)
            .filter((schema) => !snapshotReportsDetail[schema.reportLink!])
            .map((schema) => this.fetch.get<LHStoredSchema>(schema.reportLink!)),
        ).pipe(
          mergeMap((reports) => {
            return from(
              reports.map((report, i) =>
                this.getActions().setReportDetail({ report: reportSchemas[i], detail: report }),
              ),
            )
          }),
          startWith(this.getActions().setDetailLoading(true)),
          endWith(this.getActions().setDetailLoading(false)),
        )
      }),
    )
  }

  @Effect()
  fetchReportsRequestsAndTraceData() {
    const requestsFetching = new Set<string>()
    const newRequests$ = new Observable<[string, string]>((subscriber) => {
      this.state$.subscribe((state) => {
        Object.values(state.snapshotReports).forEach((report) => {
          if (
            !report.reportLink ||
            !state.snapshotReportsDetail[report.reportLink] ||
            state.snapshotReportsDetail[report.reportLink]?.['requests'] ||
            requestsFetching.has(report.reportLink)
          ) {
            return
          }
          if (report.requestsLink) {
            subscriber.next([report.reportLink, report.requestsLink])
          }
          requestsFetching.add(report.reportLink)
        })
      })
    })

    const traceDataFetching = new Set<string>()
    const newTraceData$ = new Observable<[string, string]>((subscriber) => {
      this.state$.subscribe((state) => {
        Object.values(state.snapshotReports).forEach((report) => {
          if (
            !report.reportLink ||
            !state.snapshotReportsDetail[report.reportLink] ||
            state.snapshotReportsDetail[report.reportLink]?.['traceData'] ||
            traceDataFetching.has(report.reportLink)
          ) {
            return
          }
          if (report.traceDataLink) {
            subscriber.next([report.reportLink, report.traceDataLink])
          }
          traceDataFetching.add(report.reportLink)
        })
      })
    })

    const fetchTraceData$ = newTraceData$.pipe(
      mergeMap(([id, link]) =>
        this.fetch.get<Task[]>(link).pipe(
          createErrorCatcher('Failed to fetch snapshot trace data.'),
          map((tasks) => this.getActions().setReportTraceData({ key: id, traceData: tasks })),
          tap(() => traceDataFetching.delete(id)),
        ),
      ),
    )

    const fetchRequests$ = newRequests$.pipe(
      mergeMap(([id, link]) =>
        this.fetch.get<RequestSchema[]>(link).pipe(
          createErrorCatcher('Failed to fetch snapshot requests.'),
          map((requests) => this.getActions().setReportRequests({ key: id, requests })),
          tap(() => requestsFetching.delete(id)),
        ),
      ),
    )

    return merge(fetchTraceData$, fetchRequests$)
  }

  @ImmerReducer()
  setReportDetail(state: Draft<State>, payload: { report: SnapshotReportSchema; detail: LHStoredSchema }) {
    state.snapshotReportsDetail[payload.report.reportLink!] = freeze({
      ...formatStorageResultToSnapshotDetail(payload.detail, payload.report),
    })
  }

  @ImmerReducer()
  setReportTraceData(state: Draft<State>, payload: { key: string; traceData: Task[] }) {
    state.snapshotReportsDetail[payload.key]['traceData'] = payload.traceData
  }

  @ImmerReducer()
  setReportRequests(state: Draft<State>, payload: { key: string; requests: RequestSchema[] }) {
    state.snapshotReportsDetail[payload.key]['requests'] = payload.requests
  }
}
