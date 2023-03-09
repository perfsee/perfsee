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

import { Module, EffectModule, Effect, ImmerReducer } from '@sigi/core'
import { Draft } from 'immer'
import { Observable } from 'rxjs'
import { map, switchMap, startWith, endWith } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  groupUsageQuery,
  GroupUsageQuery,
  GroupUsageQueryVariables,
  latestSnapshotReportsQuery,
  LatestSnapshotReportsQuery,
  LatestSnapshotReportsQueryVariables,
} from '@perfsee/schema'

export type ProjectUsageInfo = GroupUsageQuery['group']['projects'][0]
export type ArtifactEntrypoints = NonNullable<ProjectUsageInfo['artifactRecords']>[0]['entrypoints']
export type SnapshotReports = NonNullable<ProjectUsageInfo['snapshotRecords']>[0]['snapshotReports']
export type LatestReport = NonNullable<LatestSnapshotReportsQuery['project']['latestSnapshot']>['snapshotReports'][0]

interface State {
  groupUsage: ProjectUsageInfo[]
  usageLoading: boolean
  reportsInProject: Record<string /**project id */, LatestReport[]>
}

@Module('GroupUsageModule')
export class GroupUsageModule extends EffectModule<State> {
  defaultState = {
    usageLoading: true,
    groupUsage: [],
    reportsInProject: {},
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  getGroupUsage(payload$: Observable<GroupUsageQueryVariables>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .query({
            query: groupUsageQuery,
            variables: payload,
          })
          .pipe(
            createErrorCatcher('Failed to get group usage.'),
            map((data) => this.getActions().setGroupUsage(data.group.projects)),
            endWith(this.getActions().setUsageLoading(false)),
            startWith(this.getActions().setUsageLoading(true)),
          ),
      ),
    )
  }

  @Effect()
  getLatestSnapshotReports(payload$: Observable<LatestSnapshotReportsQueryVariables>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .query({
            query: latestSnapshotReportsQuery,
            variables: payload,
          })
          .pipe(
            createErrorCatcher('Failed to get latest snapshot reports.'),
            map((data) => this.getActions().setReportsInProject(data.project)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setGroupUsage(state: Draft<State>, payload: GroupUsageQuery['group']['projects']) {
    state.groupUsage = payload
  }

  @ImmerReducer()
  setUsageLoading(state: Draft<State>, loading: boolean) {
    state.usageLoading = loading
  }

  @ImmerReducer()
  setReportsInProject(state: Draft<State>, payload: LatestSnapshotReportsQuery['project']) {
    state.reportsInProject = { ...state.reportsInProject, [payload.id]: payload.latestSnapshot?.snapshotReports ?? [] }
  }
}
