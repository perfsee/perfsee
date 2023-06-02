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
import { EMPTY, Observable } from 'rxjs'
import { switchMap, map, startWith, endWith, filter, distinctUntilChanged, catchError } from 'rxjs/operators'

import { createErrorCatcher, GraphQLClient, RxFetch } from '@perfsee/platform/common'
import {
  PackageBundleDetailQuery,
  packageBundleDetailQuery,
  PackageBundleHistoryQuery,
  packageBundleHistoryQuery,
} from '@perfsee/schema'
import { BenchmarkResult, PackageStats, Size } from '@perfsee/shared'

type PackageBundleDetail = PackageBundleDetailQuery['packageBundle']
type PackageBundleHistory = PackageBundleHistoryQuery['packageBundleHistory']

export interface PackageBundleResult extends PackageBundleDetail {
  report?: PackageStats
  benchmarkResult?: BenchmarkResult
}

export interface Diff<T = Size> {
  new: T
  base: T | null
}

export function getDefaultSize(): Size {
  return {
    raw: 0,
    gzip: 0,
    brotli: 0,
  }
}

export function addSize(size: Size, append: Size): Size {
  return {
    raw: size.raw + append.raw,
    gzip: size.gzip + append.gzip,
    brotli: size.brotli + append.brotli,
  }
}

interface State {
  current: PackageBundleResult | null
  loading: boolean
  historyLoading: boolean
  history: PackageBundleHistory | null
}

@Module('PackageBundleDetailModule')
export class PackageBundleDetailModule extends EffectModule<State> {
  defaultState: State = {
    current: null,
    loading: true,
    historyLoading: true,
    history: null,
  }

  constructor(private readonly client: GraphQLClient, private readonly fetch: RxFetch) {
    super()
  }

  @Effect()
  getBundleDetail(payload$: Observable<{ projectId: string; packageId: string; packageBundleId: string }>) {
    return payload$.pipe(
      switchMap(({ packageBundleId, packageId, projectId }) => {
        return this.client
          .query({
            query: packageBundleDetailQuery,
            variables: {
              projectId,
              packageId,
              id: packageBundleId,
            },
          })
          .pipe(
            createErrorCatcher('Failed to get package bundle detail'),
            map(({ packageBundle }) => this.getActions().setCurrentBundle(packageBundle)),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          )
      }),
    )
  }

  @Effect()
  getHistory(payload$: Observable<{ projectId: string; packageId: string; currentDateTime: string; limit?: number }>) {
    return payload$.pipe(
      switchMap(({ packageId, currentDateTime, limit, projectId }) => {
        const to = new Date(new Date(currentDateTime).valueOf() + 1000).toString()
        return this.client
          .query({
            query: packageBundleHistoryQuery,
            variables: {
              projectId,
              packageId,
              to,
              limit,
            },
          })
          .pipe(
            createErrorCatcher('Failed to get package history'),
            map(({ packageBundleHistory }) => this.getActions().setHistory(packageBundleHistory.reverse())),
            startWith(this.getActions().setHistoryLoading(true)),
            endWith(this.getActions().setHistoryLoading(false)),
          )
      }),
    )
  }

  @Effect()
  getReport() {
    return this.state$.pipe(
      map(({ current: bundle }) => bundle?.reportLink),
      distinctUntilChanged(),
      filter(Boolean),
      switchMap((key) =>
        this.fetch.get<PackageStats>(key).pipe(
          map((report) => this.getActions().setReport(report)),
          createErrorCatcher('Failed to fetch bundle report.', false),
          catchError(() => EMPTY),
        ),
      ),
    )
  }

  @Effect()
  getBenchmark() {
    return this.state$.pipe(
      map(({ current: bundle }) => bundle?.benchmarkLink),
      distinctUntilChanged(),
      filter(Boolean),
      switchMap((key) =>
        this.fetch.get<BenchmarkResult>(key).pipe(
          map((benchmark) => this.getActions().setBenchmark(benchmark)),
          createErrorCatcher('Failed to fetch bundle report.', false),
          catchError(() => EMPTY),
        ),
      ),
    )
  }

  @ImmerReducer()
  setHistory(state: Draft<State>, history: PackageBundleHistory | null) {
    state.history = history
  }

  @ImmerReducer()
  setHistoryLoading(state: Draft<State>, loading: boolean) {
    state.historyLoading = loading
  }

  @Reducer()
  setBenchmark(state: State, benchmarkResult: BenchmarkResult): State {
    if (!state.current) {
      return state
    }

    return {
      ...state,
      current: {
        ...state.current,
        benchmarkResult,
      },
    }
  }

  @Reducer()
  setReport(state: State, report: PackageStats): State {
    if (!state.current) {
      return state
    }

    return {
      ...state,
      current: {
        ...state.current,
        report,
      },
    }
  }

  @ImmerReducer()
  setCurrentBundle(state: Draft<State>, packageBundleDetail: PackageBundleDetail) {
    state.current = packageBundleDetail
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }
}
