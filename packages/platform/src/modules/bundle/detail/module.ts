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
import { combineLatest, EMPTY, Observable } from 'rxjs'
import {
  switchMap,
  map,
  startWith,
  endWith,
  withLatestFrom,
  filter,
  catchError,
  distinctUntilChanged,
} from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher, RxFetch } from '@perfsee/platform/common'
import { ArtifactQuery, artifactQuery, ArtifactWithBaselineQuery, artifactWithBaselineQuery } from '@perfsee/schema'
import { BundleDiff, BundleResult, ModuleSource, diffBundleResult } from '@perfsee/shared'

import { ProjectModule } from '../../shared'

export type Bundle = ArtifactQuery['project']['artifact'] & {
  report?: BundleResult
}

interface State {
  loading: boolean
  current: Bundle | null
  baseline: Bundle | null
  diff: BundleDiff | null
  moduleSource: ModuleSource | null
}

@Module('BundleModule')
export class BundleModule extends EffectModule<State> {
  readonly defaultState: State = {
    loading: true,
    current: null,
    baseline: null,
    diff: null,
    moduleSource: null,
  }

  constructor(
    private readonly client: GraphQLClient,
    private readonly fetch: RxFetch,
    private readonly projectModule: ProjectModule,
  ) {
    super()
  }

  @Effect()
  getBundleWithBaseline(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([id, { project }]) =>
        this.client
          .query({
            query: artifactWithBaselineQuery,
            variables: { id, projectId: project!.id },
          })
          .pipe(
            createErrorCatcher('Failed to fetch bundle detail.'),
            map(({ project: { artifact } }) => this.getActions().setBundleWithBaseline(artifact)),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  getBundle(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([id, { project }]) =>
        this.client
          .query({
            query: artifactQuery,
            variables: { id, projectId: project!.id },
          })
          .pipe(
            createErrorCatcher('Failed to fetch bundle detail.'),
            map(({ project: { artifact } }) => this.getActions().setBundle(artifact)),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  updateBaseline(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([id, { project }]) =>
        this.client
          .query({
            query: artifactQuery,
            variables: { id, projectId: project!.id },
          })
          .pipe(
            createErrorCatcher('Failed to fetch bundle detail.'),
            map(({ project: { artifact } }) => this.getActions().setBaseline(artifact)),
          ),
      ),
    )
  }

  @Effect()
  getReport() {
    return combineLatest([this.state$]).pipe(
      map(([{ current: bundle }]) => bundle?.reportLink),
      distinctUntilChanged(),
      filter(Boolean),
      switchMap((key) =>
        this.fetch.get<BundleResult>(key).pipe(
          map((report) => this.getActions().setReport(report)),
          createErrorCatcher('Failed to fetch bundle report.', false),
          catchError(() => EMPTY),
        ),
      ),
    )
  }

  @Effect()
  getBaselineReport() {
    return combineLatest([this.state$]).pipe(
      map(([{ baseline }]) => baseline?.reportLink),
      distinctUntilChanged(),
      filter(Boolean),
      switchMap((key) =>
        this.fetch.get<BundleResult>(key).pipe(
          map((report) => this.getActions().setBaselineReport(report)),
          createErrorCatcher('Failed to fetch bundle report.', false),
          catchError(() => EMPTY),
        ),
      ),
    )
  }

  @Effect()
  getModuleReasons(payload$: Observable<string>) {
    return payload$.pipe(
      filter(Boolean),
      switchMap((key) =>
        this.fetch.get<ModuleSource>(key).pipe(
          map((moduleMap) => this.getActions().setModuleSource(moduleMap)),
          createErrorCatcher('Failed to fetch moduleMap.', false),
          catchError(() => EMPTY),
        ),
      ),
    )
  }

  @Reducer()
  setReport(state: State, report: BundleResult): State {
    if (!state.current) {
      return state
    }

    return {
      ...state,
      current: {
        ...state.current,
        report,
      },
      diff: diffBundleResult(report, state.baseline?.report),
    }
  }

  @Reducer()
  setBaselineReport(state: State, baselineReport: BundleResult): State {
    if (state.baseline) {
      return {
        ...state,
        baseline: {
          ...state.baseline,
          report: baselineReport,
        },
        diff: state.current?.report ? diffBundleResult(state.current.report, baselineReport) : null,
      }
    }

    return state
  }

  @ImmerReducer()
  setModuleSource(state: Draft<State>, moduleSource: ModuleSource) {
    state.moduleSource = moduleSource
  }

  @ImmerReducer()
  setBundleWithBaseline(state: Draft<State>, bundle: ArtifactWithBaselineQuery['project']['artifact']) {
    state.current = bundle
    state.baseline = bundle.baseline
  }

  @ImmerReducer()
  setBundle(state: Draft<State>, bundle: Bundle) {
    state.current = bundle
  }

  @ImmerReducer()
  setBaseline(state: Draft<State>, baseline: Bundle) {
    state.baseline = baseline
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }
}
