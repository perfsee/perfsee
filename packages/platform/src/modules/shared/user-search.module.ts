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
import { switchMap, map, startWith, endWith, debounceTime } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { searchUsersQuery, SearchUsersQuery } from '@perfsee/schema'

export type SearchedUser = SearchUsersQuery['searchUsers'][0]
interface State {
  searching: boolean
  users: SearchedUser[]
}

@Module('UserSearchModule')
export class UserSearchModule extends EffectModule<State> {
  readonly defaultState: State = {
    searching: false,
    users: [],
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setSearching(state: Draft<State>, searching: boolean) {
    state.searching = searching
  }

  @ImmerReducer()
  setUsers(state: Draft<State>, users: SearchedUser[]) {
    state.users = users
  }

  @Effect()
  search(payload$: Observable<string>) {
    return payload$.pipe(
      debounceTime(300),
      switchMap((query) =>
        this.client
          .query({
            query: searchUsersQuery,
            variables: { query },
          })
          .pipe(
            createErrorCatcher('Failed to search users'),
            map((data) => this.getActions().setUsers(data.searchUsers)),
            startWith(this.getActions().setSearching(true)),
            endWith(this.getActions().setSearching(false)),
          ),
      ),
    )
  }
}
