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

import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft, freeze } from 'immer'
import { Observable } from 'rxjs'
import { endWith, map, mergeMap, startWith, switchMap } from 'rxjs/operators'

import { reportMetricsQuery, ReportMetricsQueryVariables } from '@perfsee/schema'
import { FlameChartData, MetricType, createErrorCatcher, GraphQLClient, RxFetch } from '@perfsee/shared'

interface State {
  flamechart: FlameChartData | null
  metrics: Record<MetricType, number> | null
  loadingFlamechart: boolean
  loadingMetrics: boolean
}

@Module('FlamechartModule')
export class FlamechartModule extends EffectModule<State> {
  readonly defaultState = {
    flamechart: null,
    metrics: null,
    loadingFlamechart: true,
    loadingMetrics: true,
  }

  constructor(private readonly client: GraphQLClient, private readonly fetch: RxFetch) {
    super()
  }

  @Effect()
  fetchFlamechartData(payload$: Observable<string>) {
    return payload$.pipe(
      mergeMap((key) =>
        this.fetch.get<FlameChartData>(key).pipe(
          createErrorCatcher('Failed to download profile'),
          map((profile) => this.getActions().setFlamechart(profile)),
        ),
      ),
    )
  }

  @Effect()
  fetchMetrics(payload$: Observable<ReportMetricsQueryVariables>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .query({
            query: reportMetricsQuery,
            variables: payload,
          })
          .pipe(
            createErrorCatcher('Failed to get metrics'),
            map((result) => this.getActions().setMetrics(result.project.snapshotReport.metrics)),
            startWith(this.getActions().setLoadingMetrics(true)),
            endWith(this.getActions().setLoadingMetrics(false)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setLoadingMetrics(state: Draft<State>, loadingMetrics: boolean) {
    state.loadingMetrics = loadingMetrics
  }

  @ImmerReducer()
  setFlamechart(state: Draft<State>, payload: FlameChartData) {
    state.flamechart = freeze(payload)
  }

  @ImmerReducer()
  setMetrics(state: Draft<State>, metrics: Record<MetricType, number>) {
    state.metrics = metrics
  }
}
