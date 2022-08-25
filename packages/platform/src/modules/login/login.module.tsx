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

import { GraphQLClient } from '@perfsee/platform/common'
import { availableOAuthProvidersQuery } from '@perfsee/schema'

interface State {
  oauthProviders: string[] | null
  loading: boolean
}

@Module('LoginModule')
export class LoginModule extends EffectModule<State> {
  defaultState = {
    oauthProviders: null,
    loading: true,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  getOauthProviders(payload$: Observable<void>) {
    return payload$.pipe(
      switchMap(() =>
        this.client
          .query({
            query: availableOAuthProvidersQuery,
          })
          .pipe(
            map((data) => {
              return this.getActions().setOauthProviders(data.availableOAuthProviders)
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setOauthProviders(state: Draft<State>, providers: string[]) {
    state.oauthProviders = providers
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }
}
