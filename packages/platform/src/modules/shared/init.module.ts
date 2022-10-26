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
import { Observable, of } from 'rxjs'
import { switchMap, map, catchError, exhaustMap, startWith, endWith } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { toggleStarProjectMutation, GlobalStateQuery, globalStateQuery } from '@perfsee/schema'

export type User = GlobalStateQuery['user']
export type ApplicationSettings = GlobalStateQuery['applicationSettings']

interface State {
  user: User | null
  settings: ApplicationSettings | null
  loading: boolean
}

@Module('GlobalModule')
export class GlobalModule extends EffectModule<State> {
  defaultState = {
    user: null,
    settings: null,
    loading: true,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  init(payload$: Observable<void>) {
    return payload$.pipe(
      switchMap(() =>
        this.client
          .query({
            query: globalStateQuery,
          })
          .pipe(
            map((data) => {
              return this.getActions().setState(data)
            }),
            catchError(() => {
              return of(this.reset())
            }),
            startWith(this.getActions().setUserLoading(true)),
            endWith(this.getActions().setUserLoading(false)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setState(state: Draft<State>, query: GlobalStateQuery) {
    state.user = query.user
    state.settings = query.applicationSettings
  }

  @ImmerReducer()
  setSettings(state: Draft<State>, settings: ApplicationSettings) {
    state.settings = settings
  }

  @Effect()
  toggleStaringProject(payload$: Observable<{ projectId: string; star: boolean }>) {
    return payload$.pipe(
      exhaustMap((variables) =>
        this.client
          .mutate({
            mutation: toggleStarProjectMutation,
            variables,
          })
          .pipe(
            createErrorCatcher('Failed to toggle project starring'),
            map(() => this.getActions().setProjectStarred(variables)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setProjectStarred(state: Draft<State>, payload: { projectId: string; star: boolean }) {
    if (!state.user) {
      return
    }

    if (payload.star) {
      state.user.starredProjects.push(payload.projectId)
    } else {
      state.user.starredProjects = state.user.starredProjects.filter((id) => id !== payload.projectId)
    }
  }

  @ImmerReducer()
  setUserLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }
}
