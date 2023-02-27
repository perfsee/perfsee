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
import { exhaustMap, map } from 'rxjs/operators'

import { GraphQLClient, RxFetch, serverLink } from '@perfsee/platform/common'
import { pendingJobsAggregationQuery, PendingJobsAggregationQuery } from '@perfsee/schema'
import { HealthCheckCategory, HealthCheckStatus } from '@perfsee/shared'

export type PendingJobsAggregation = PendingJobsAggregationQuery['pendingJobsAggregation']

export interface StatusState {
  health:
    | {
        [index in HealthCheckCategory]: HealthCheckStatus
      }
    | null
  pendingJobsAggregation: PendingJobsAggregation
}

interface HealthCheckResponse {
  status: 'error' | 'ok' | 'shutting_down'
  info: {
    [index in HealthCheckCategory]?: HealthCheckStatus
  }
  error: {
    [index in HealthCheckCategory]?: HealthCheckStatus
  }
  details: {
    [index in HealthCheckCategory]: HealthCheckStatus
  }
}

@Module('status')
export class StatusModule extends EffectModule<StatusState> {
  defaultState = {
    health: null,
    pendingJobsAggregation: [],
  }

  @DefineAction() dispose$!: Observable<void>

  constructor(private readonly fetch: RxFetch, private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setHealthDetails(state: Draft<StatusState>, payload: NonNullable<StatusState['health']>) {
    state.health = payload
  }

  @ImmerReducer()
  setPendingJobsAggregation(state: Draft<StatusState>, payload: PendingJobsAggregation) {
    state.pendingJobsAggregation = payload
  }

  @Effect()
  fetchHealthStatus(payload$: Observable<void>) {
    return payload$.pipe(
      exhaustMap(() =>
        this.fetch
          .get<HealthCheckResponse>(serverLink`/health`)
          .pipe(map((res) => this.getActions().setHealthDetails(res.details))),
      ),
    )
  }

  @Effect()
  fetchPendingJobsAggregation(payload$: Observable<void>) {
    return payload$.pipe(
      exhaustMap(() =>
        this.client
          .query({
            query: pendingJobsAggregationQuery,
          })
          .pipe(map((data) => this.getActions().setPendingJobsAggregation(data.pendingJobsAggregation))),
      ),
    )
  }
}
