import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft, freeze } from 'immer'
import { Observable } from 'rxjs'
import { endWith, map, mergeMap, startWith, switchMap } from 'rxjs/operators'

import { createErrorCatcher, GraphQLClient, RxFetch } from '@perfsee/platform/common'
import { reportMetricsQuery, ReportMetricsQueryVariables } from '@perfsee/schema'
import { FlameChartData, MetricType } from '@perfsee/shared'

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
    reactProfile: null,
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
