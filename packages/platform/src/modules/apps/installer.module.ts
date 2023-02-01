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
import { switchMap, map, startWith, endWith } from 'rxjs/operators'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import { applicationQuery, ApplicationQuery, authorizeApplicationMutation, Permission } from '@perfsee/schema'

export type Application = ApplicationQuery['application']

interface State {
  application: Application | null
  loading: boolean
  installing: boolean
  installSuccess: boolean
}

@Module('ApplicationInstallerModule')
export class ApplicationInstallerModule extends EffectModule<State> {
  defaultState = {
    application: null,
    loading: false,
    installing: false,
    installSuccess: false,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  getApplication(payload$: Observable<{ appName: string }>) {
    return payload$.pipe(
      switchMap(({ appName }) =>
        this.client
          .query({
            query: applicationQuery,
            variables: { name: appName },
          })
          .pipe(
            map((data) => {
              return this.getActions().setApplication(data.application)
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
            createErrorCatcher('Failed to fetch application'),
          ),
      ),
    )
  }

  @Effect()
  authNewApplications(payload$: Observable<{ projectId: string; applicationId: number; permissions: Permission[] }>) {
    return payload$.pipe(
      switchMap(({ projectId, applicationId, permissions }) =>
        this.client
          .query({
            query: authorizeApplicationMutation,
            variables: {
              projectId,
              applicationId,
              permissions,
            },
          })
          .pipe(
            createErrorCatcher('Failed to auth new applications.'),
            map(() => this.getActions().setInstallSuccess(true)),
            startWith(this.getActions().setInstalling(true)),
            endWith(this.getActions().setInstalling(false)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setApplication(state: Draft<State>, payload: Application) {
    state.application = payload
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setInstallSuccess(state: Draft<State>, installSuccess: boolean) {
    state.installSuccess = installSuccess
  }

  @ImmerReducer()
  setInstalling(state: Draft<State>, installing: boolean) {
    state.installing = installing
  }
}
