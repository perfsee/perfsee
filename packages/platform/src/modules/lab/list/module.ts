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

import { Module, EffectModule, Effect, ImmerReducer, DefineAction } from '@sigi/core'
import { Draft } from 'immer'
import { Observable } from 'rxjs'
import {
  switchMap,
  map,
  endWith,
  startWith,
  withLatestFrom,
  takeUntil,
  exhaustMap,
  filter,
  mergeMap,
} from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  SnapshotsQuery,
  snapshotsQuery,
  snapshotReportsQuery,
  SnapshotReportsQuery,
  dispatchSnapshotReportMutation,
  SnapshotStatus,
  deleteSnapshotMutation,
  takeSnapshotMutation,
  TakeSnapshotMutationVariables,
  takeTempSnapshotMutation,
  TakeTempSnapshotMutationVariables,
  SnapshotTrigger,
  setSnapshotHashMutation,
} from '@perfsee/schema'

import { ProjectModule } from '../../shared'

export type SnapshotNode = SnapshotsQuery['project']['snapshots']['edges'][0]['node']
export type SnapshotReportSchema = SnapshotReportsQuery['project']['snapshot']['snapshotReports'][0]

export type SnapshotSchema = Omit<SnapshotNode, 'title'> & { title: string }

export type ReportsPayload<IsLoading extends boolean = true | false> = IsLoading extends true
  ? {
      id: number
      loading: IsLoading
    }
  : {
      id: number
      loading: IsLoading
      reports: SnapshotReportSchema[]
    }

export interface State {
  snapshots: SnapshotSchema[]
  reportsWithId: {
    [index: string]: ReportsPayload
  }
  totalCount: number
  loading: boolean
}

export const SNAPSHOT_PAGE_SIZE = 20

@Module('LabListModule')
export class LabListModule extends EffectModule<State> {
  defaultState = {
    snapshots: [],
    totalCount: 0,
    loading: true,
    reportsWithId: {},
  }

  @DefineAction() dispose!: Observable<void>

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @Effect()
  getSnapshotReports(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([snapshotId, { project }]) =>
        this.client
          .query({
            query: snapshotReportsQuery,
            variables: { snapshotId, projectId: project!.id },
          })
          .pipe(
            createErrorCatcher('Failed to fetch snapshotReports'),
            map((data) => {
              const result = {
                id: snapshotId,
                reports: data.project.snapshot.snapshotReports,
              }
              return this.getActions().setSnapshotReports(result)
            }),
            startWith(this.getActions().setSnapshotReportsLoading({ id: snapshotId, loading: true })),
            takeUntil(this.getAction$().dispose),
          ),
      ),
    )
  }

  @Effect()
  takeSnapshot(payload$: Observable<Omit<TakeSnapshotMutationVariables, 'projectId'>>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([payload, { project }]) =>
        this.client
          .query({
            query: takeSnapshotMutation,
            variables: {
              projectId: project!.id,
              ...payload,
            },
          })
          .pipe(
            createErrorCatcher('Failed to take a snapshot'),
            map((data) => {
              return this.getActions().addSnapshot(data.takeSnapshot)
            }),
          ),
      ),
    )
  }

  @Effect()
  takeTempSnapshot(payload$: Observable<Omit<TakeTempSnapshotMutationVariables, 'projectId'>>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([payload, { project }]) =>
        this.client
          .query({
            query: takeTempSnapshotMutation,
            variables: {
              projectId: project!.id,
              ...payload,
            },
          })
          .pipe(
            createErrorCatcher('Failed to take a temp snapshot'),
            map((data) => {
              return this.getActions().addSnapshot(data.takeTempSnapshot)
            }),
          ),
      ),
    )
  }

  @Effect()
  deleteSnapshot(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([snapshotId, { project }]) =>
        this.client
          .mutate({
            mutation: deleteSnapshotMutation,
            variables: { projectId: project!.id, snapshotId: snapshotId },
          })
          .pipe(
            createErrorCatcher('Failed to delete snapshot.'),
            map(() => this.getActions().removeSnapshot(snapshotId)),
          ),
      ),
    )
  }

  @Effect()
  getSnapshots(payload$: Observable<{ trigger?: SnapshotTrigger; pageNum: number; pageSize: number }>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ trigger, pageNum, pageSize }, { project }]) => {
        return this.client
          .query({
            query: snapshotsQuery,
            variables: {
              projectId: project!.id,
              pagination: { first: pageSize, skip: pageSize * (pageNum - 1) },
              trigger,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch snapshots'),
            map((data) => {
              return this.getActions().setSnapshots(data.project.snapshots)
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          )
      }),
    )
  }

  @Effect()
  rerunSnapshotReport(payload$: Observable<{ snapshotId: number; id: number }>) {
    return payload$.pipe(
      withLatestFrom(this.state$, this.projectModule.state$),
      exhaustMap(([{ snapshotId, id }, { reportsWithId }, { project }]) =>
        this.client
          .mutate({
            mutation: dispatchSnapshotReportMutation,
            variables: { projectId: project!.id, reportId: id },
          })
          .pipe(
            createErrorCatcher('Failed to dispatch job.'),
            map(() => {
              const reports = (reportsWithId[snapshotId] as ReportsPayload<false>).reports
              const result = reports.map((report) => {
                return report.id === id ? { ...report, status: SnapshotStatus.Pending } : report
              })

              return this.getActions().setSnapshotReports({
                id: snapshotId,
                reports: result,
              })
            }),
          ),
      ),
    )
  }

  @Effect()
  setSnapshotHash(payload$: Observable<{ snapshotId: number; hash: string }>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      mergeMap(([{ snapshotId, hash }, { project }]) =>
        this.client
          .mutate({
            mutation: setSnapshotHashMutation,
            variables: { snapshotId, hash, projectId: project!.id },
          })
          .pipe(
            createErrorCatcher('Failed to set snapshot commit hash.'),
            map(() => {
              return this.getActions().updateSnapshotHash({
                snapshotId,
                hash,
              })
            }),
          ),
      ),
    )
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setSnapshotReports(state: Draft<State>, payload: Omit<ReportsPayload<false>, 'loading'>) {
    state.reportsWithId[payload.id] = { ...payload, loading: false }
  }

  @ImmerReducer()
  setSnapshotReportsLoading(state: Draft<State>, payload: { loading: boolean; id: number }) {
    if (!state.reportsWithId[payload.id]) {
      state.reportsWithId[payload.id] = {
        id: payload.id,
        loading: true,
      }
    } else {
      state.reportsWithId[payload.id].loading = payload.loading
    }
  }

  @ImmerReducer()
  setSnapshots(state: Draft<State>, { pageInfo, edges }: SnapshotsQuery['project']['snapshots']) {
    state.snapshots = edges.map((edge) => this.formatSnapshotNode(edge.node))
    state.totalCount = pageInfo.totalCount
  }

  @ImmerReducer()
  removeSnapshot(state: Draft<State>, payload: number) {
    state.snapshots = state.snapshots.filter((snapshot) => snapshot.id !== payload)
    state.totalCount = state.totalCount - 1
  }

  @ImmerReducer()
  addSnapshot(state: Draft<State>, snapshot: SnapshotNode) {
    state.snapshots = [this.formatSnapshotNode(snapshot), ...state.snapshots]
    state.totalCount = state.totalCount + 1
  }

  @ImmerReducer()
  updateSnapshotHash(state: Draft<State>, payload: { snapshotId: number; hash: string }) {
    const snapshot = state.snapshots.find((snapshot) => snapshot.id === payload.snapshotId)
    if (snapshot) {
      snapshot.hash = payload.hash
    }
  }

  formatSnapshotNode(node: SnapshotNode): SnapshotSchema {
    return {
      ...node,
      title: node.title?.trim() ? node.title : `Snapshot #${node.id}`,
    }
  }
}
