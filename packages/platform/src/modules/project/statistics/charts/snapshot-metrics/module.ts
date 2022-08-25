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
import { switchMap, map, withLatestFrom, startWith } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { ProjectModule } from '@perfsee/platform/modules/shared'
import { SnapshotReportHistoryQuery, snapshotReportHistoryQuery, SnapshotReportFilter } from '@perfsee/schema'

export type SnapshotReport = SnapshotReportHistoryQuery['project']['snapshotReports'][0]
interface State {
  reports: SnapshotReport[] | undefined
}

@Module('SnapshotsChartModule')
export class SnapshotsChartModule extends EffectModule<State> {
  defaultState = {
    reports: undefined,
  }

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @Effect()
  getAggregatedSnapshots(payload$: Observable<Partial<SnapshotReportFilter>>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([filter, { project }]) =>
        this.client
          .query({
            query: snapshotReportHistoryQuery,
            variables: {
              projectId: project!.id,
              filter,
            },
          })
          .pipe(
            createErrorCatcher('Failed to get snapshot statistics'),
            map((data) => this.getActions().setSnapshotAggregations(data.project.snapshotReports)),
            startWith(this.getActions().setSnapshotAggregations(undefined)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setSnapshotAggregations(state: Draft<State>, variable: SnapshotReport[] | undefined) {
    state.reports = variable
  }
}
