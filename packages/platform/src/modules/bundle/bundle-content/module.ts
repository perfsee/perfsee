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
import { Draft, freeze } from 'immer'
import { concat, forkJoin, Observable, of } from 'rxjs'
import { switchMap, map, filter, withLatestFrom, mergeAll } from 'rxjs/operators'

import { createErrorCatcher, RxFetch, GraphQLClient } from '@perfsee/platform/common'
import { artifactQuery } from '@perfsee/schema'
import { ModuleTreeNode } from '@perfsee/shared'

import { ProjectModule } from '../../shared'

interface State {
  content: ModuleTreeNode[] | null
  baselineContent: ModuleTreeNode[] | null
  loading: boolean
}

@Module('BundleContentModule')
export class BundleContentModule extends EffectModule<State> {
  defaultState = {
    content: null,
    baselineContent: null,
    loading: false,
  }

  constructor(
    private readonly fetch: RxFetch,
    private readonly client: GraphQLClient,
    private readonly projectModule: ProjectModule,
  ) {
    super()
  }

  @Reducer()
  setContent(state: Draft<State>, data: ModuleTreeNode[]): State {
    return {
      ...state,
      content: freeze(data),
    }
  }

  @Reducer()
  setBaselineContent(state: Draft<State>, data: ModuleTreeNode[]): State {
    return {
      ...state,
      baselineContent: freeze(data),
    }
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, data: boolean) {
    state.loading = data
  }

  @ImmerReducer()
  dispose(state: Draft<State>) {
    state.loading = false
    state.content = null
  }

  @Effect()
  getContent(payload$: Observable<{ current: number; baseline?: number }>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ current, baseline }, { project }]) => {
        const getArtifact = (id: number, isBaseline?: boolean) =>
          this.client
            .query({
              query: artifactQuery,
              variables: {
                id,
                projectId: project!.id,
              },
            })
            .pipe(
              createErrorCatcher('Failed to get bundle content storage key'),
              map((data) =>
                this.getActions()[isBaseline ? 'fetchBaselineContentFromStorage' : 'fetchContentFromStorage'](
                  data.project.artifact.contentLink,
                ),
              ),
            )

        const requests = baseline
          ? forkJoin([getArtifact(current), getArtifact(baseline, true)])
          : getArtifact(current).pipe(map((action) => [action]))

        return concat(
          of(this.getActions().setLoading(true)),
          requests.pipe(mergeAll()),
          of(this.getActions().setLoading(false)),
        )
      }),
    )
  }

  @Effect()
  fetchContentFromStorage(payload$: Observable<string | undefined | null>) {
    return payload$.pipe(
      filter((key) => !!key),
      switchMap((key) =>
        this.fetch.get<ModuleTreeNode[]>(key!).pipe(
          createErrorCatcher('Failed to fetch bundle content.'),
          map((res) => this.getActions().setContent(res)),
        ),
      ),
    )
  }

  @Effect()
  fetchBaselineContentFromStorage(payload$: Observable<string | undefined | null>) {
    return payload$.pipe(
      filter((key) => !!key),
      switchMap((key) =>
        this.fetch.get<ModuleTreeNode[]>(key!).pipe(
          createErrorCatcher('Failed to fetch bundle content.'),
          map((res) => this.getActions().setBaselineContent(res)),
        ),
      ),
    )
  }
}
