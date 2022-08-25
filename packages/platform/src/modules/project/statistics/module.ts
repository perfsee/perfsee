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
import { from, Observable } from 'rxjs'
import { switchMap, map, withLatestFrom, startWith, filter, concatMap, delay } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  BundleHistoryQuery,
  BundleHistoryQueryVariables,
  bundleHistoryQuery,
  snapshotReportHistoryQuery,
  SnapshotReportHistoryQuery,
  SnapshotReportFilter,
} from '@perfsee/schema'

import { ProjectModule } from '../../shared'

export type BundleEntrypoint = BundleHistoryQuery['project']['artifactHistory'][0]

export type SnapshotReport = SnapshotReportHistoryQuery['project']['snapshotReports'][0]
export type PageAggregation = {
  pageId: number
  profileId: number
  envId: number
  reports: SnapshotReport[]
}

interface State {
  bundleHistory: BundleEntrypoint[] | undefined
  aggregatedPages: PageAggregation[]
}

@Module('StatisticsModule')
export class StatisticsModule extends EffectModule<State> {
  defaultState: State = {
    bundleHistory: [],
    aggregatedPages: [],
  }

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @Effect()
  getAggregatedArtifacts(payload$: Observable<Omit<BundleHistoryQueryVariables, 'projectId'>>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([variables, { project }]) =>
        this.client
          .query({
            query: bundleHistoryQuery,
            variables: {
              projectId: project!.id,
              ...variables,
            },
          })
          .pipe(
            createErrorCatcher('Failed to get artifact statistics'),
            map((data) => this.getActions().setArtifacts(data.project.artifactHistory)),
            startWith(this.getActions().setArtifacts([])),
          ),
      ),
    )
  }

  @Effect()
  getAggregatedPages(payload$: Observable<Partial<SnapshotReportFilter>[]>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$, this.state$),
      filter(([, { project }]) => !!project),
      switchMap(([payload, { project }, { aggregatedPages }]) =>
        from(payload).pipe(
          filter(
            (filter) =>
              aggregatedPages.findIndex(
                (page) =>
                  page.pageId === filter.pageId && page.profileId === filter.profileId && page.envId === filter.envId,
              ) === -1,
          ),
          concatMap((filter) => {
            return this.client
              .query({
                query: snapshotReportHistoryQuery,
                variables: {
                  projectId: project!.id,
                  filter,
                },
              })
              .pipe(
                createErrorCatcher('Failed to get snapshot statistics'),
                map((data) =>
                  this.getActions().setPageSnapshots({
                    envId: filter.envId!,
                    profileId: filter.profileId!,
                    pageId: filter.pageId!,
                    reports: data.project.snapshotReports,
                  }),
                ),
                delay(100),
              )
          }),
        ),
      ),
    )
  }

  @Reducer()
  setArtifacts(state: State, data: BundleEntrypoint[]): State {
    return {
      ...state,
      bundleHistory: data.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)),
    }
  }

  @ImmerReducer()
  setPageSnapshots(state: Draft<State>, variable: PageAggregation) {
    state.aggregatedPages.push(variable)
  }
}
