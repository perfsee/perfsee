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
import { map, startWith, endWith, switchMap, mergeMap } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  accessTokensQuery,
  AccessTokensQuery,
  generateAccessTokenMutation,
  deleteAccessTokenMutation,
} from '@perfsee/schema'

export type AccessToken = NonNullable<AccessTokensQuery['user']>['accessTokens'][0]

interface State {
  tokens: AccessToken[]
  isGenerating: boolean
  generateResult: string | null
}

@Module('AccessTokenModule')
export class AccessTokenModule extends EffectModule<State> {
  readonly defaultState: State = {
    tokens: [],
    isGenerating: false,
    generateResult: null,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setAccessTokens(state: Draft<State>, data: AccessToken[]) {
    state.tokens = data
  }

  @ImmerReducer()
  setGenerating(state: Draft<State>, data: boolean) {
    state.isGenerating = data
  }

  @ImmerReducer()
  setGenerateResult(state: Draft<State>, data: string | null) {
    state.generateResult = data
  }

  @Effect()
  getAccessTokens(payload$: Observable<void>) {
    return payload$.pipe(
      switchMap(() =>
        this.client
          .query({
            query: accessTokensQuery,
          })
          .pipe(
            createErrorCatcher('get access tokens failed'),
            map((data) => this.getActions().setAccessTokens(data.user!.accessTokens)),
          ),
      ),
    )
  }

  @Effect()
  deleteAccessToken(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((name) =>
        this.client
          .mutate({
            mutation: deleteAccessTokenMutation,
            variables: {
              name,
            },
          })
          .pipe(
            createErrorCatcher('delete access tokens failed'),
            map(() => this.getActions().getAccessTokens()),
          ),
      ),
    )
  }

  @Effect()
  generateToken(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((name) =>
        this.client
          .mutate({
            mutation: generateAccessTokenMutation,
            variables: {
              name,
            },
          })
          .pipe(
            createErrorCatcher('generate access tokens failed'),
            mergeMap((data) => [
              this.getActions().getAccessTokens(),
              this.getActions().setGenerateResult(data.generateToken),
            ]),
            startWith(this.getActions().setGenerating(true)),
            endWith(this.getActions().setGenerating(false)),
          ),
      ),
    )
  }
}
