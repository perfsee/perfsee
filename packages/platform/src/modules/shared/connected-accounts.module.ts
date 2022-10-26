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
import { disconnectAccountMutation, UserConnectedAccountsQuery, userConnectedAccountsQuery } from '@perfsee/schema'

export type ConnectedAccount = NonNullable<UserConnectedAccountsQuery['user']>['connectedAccounts'][number]

interface State {
  connectedAccounts: ConnectedAccount[] | null
  loading: boolean
}

@Module('ConnectedAccountsModule')
export class ConnectedAccountsModule extends EffectModule<State> {
  defaultState = {
    connectedAccounts: null,
    loading: false,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  getConnectedAccounts(payload$: Observable<void>) {
    return payload$.pipe(
      switchMap(() =>
        this.client
          .query({
            query: userConnectedAccountsQuery,
          })
          .pipe(
            map((data) => {
              return this.getActions().setConnectedAccounts(data.user!.connectedAccounts)
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  disconnectedAccounts(payload$: Observable<ConnectedAccount>) {
    return payload$.pipe(
      switchMap((account) =>
        this.client
          .mutate({
            mutation: disconnectAccountMutation,
            variables: {
              provider: account.provider,
            },
          })
          .pipe(
            createErrorCatcher('Failed to disconnect account.'),
            map(() => {
              return this.getActions().disconnectAccount(account)
            }),
          ),
      ),
    )
  }

  @ImmerReducer()
  setConnectedAccounts(state: Draft<State>, payload: ConnectedAccount[]) {
    state.connectedAccounts = payload
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  disconnectAccount(state: Draft<State>, account: ConnectedAccount) {
    for (const a of state.connectedAccounts ?? []) {
      if (a.provider === account.provider) {
        a.externUsername = null
      }
    }
  }
}
