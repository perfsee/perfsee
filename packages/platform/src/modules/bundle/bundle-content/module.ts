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
import { Observable } from 'rxjs'
import { switchMap, map, filter, startWith, endWith, withLatestFrom } from 'rxjs/operators'

import { createErrorCatcher, RxFetch, getStorageLink, GraphQLClient } from '@perfsee/platform/common'
import { artifactQuery } from '@perfsee/schema'
import { ModuleTreeNode } from '@perfsee/shared'

import { ProjectModule } from '../../shared'

interface State {
  content: ModuleTreeNode[] | null
  loading: boolean
}

@Module('BundleContentModule')
export class BundleContentModule extends EffectModule<State> {
  defaultState = {
    content: null,
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
  getContent(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([id, { project }]) =>
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
            map((data) => this.getActions().fetchContentFromStorage(data.project.artifact.contentKey)),
            startWith(this.getActions().setLoading(true)),
          ),
      ),
    )
  }

  @Effect()
  fetchContentFromStorage(payload$: Observable<string | null | undefined>) {
    return payload$.pipe(
      filter((key) => !!key),
      switchMap((key) =>
        this.fetch.get<ModuleTreeNode[]>(getStorageLink(key!)).pipe(
          createErrorCatcher('Failed to fetch bundle content.'),
          map((res) => this.getActions().setContent(res)),
          endWith(this.getActions().setLoading(false)),
        ),
      ),
    )
  }
}
