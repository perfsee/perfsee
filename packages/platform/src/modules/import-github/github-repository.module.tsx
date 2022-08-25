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

import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { endWith, exhaustMap, map, Observable, startWith, withLatestFrom } from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import { GithubInstallationRepositoriesQuery, githubInstallationRepositoriesQuery } from '@perfsee/schema'

export type Repository = GithubInstallationRepositoriesQuery['githubInstallationRepositories']['edges'][number]['node']

interface State {
  repositories: Repository[]
  repositoriesTotalCount: number
  loading: boolean
}

@Module('GithubRepositoryModel')
export class GithubRepositoryModel extends EffectModule<State> {
  defaultState = {
    loading: true,
    repositoriesTotalCount: 0,
    repositories: [],
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  loadMore(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      exhaustMap(([installationId, state]) =>
        this.client
          .query({
            query: githubInstallationRepositoriesQuery,
            variables: { installationId, pagination: { first: 30, skip: state.repositories.length } },
          })
          .pipe(
            map((data) => {
              return this.getActions().append({
                repositories: data.githubInstallationRepositories.edges.map((edge) => edge.node),
                totalCount: data.githubInstallationRepositories.pageInfo.totalCount,
              })
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
            createErrorCatcher(),
          ),
      ),
    )
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  append(state: Draft<State>, { repositories, totalCount }: { repositories: Repository[]; totalCount: number }) {
    state.repositories.push(...repositories)
    state.repositoriesTotalCount = totalCount
  }
}
