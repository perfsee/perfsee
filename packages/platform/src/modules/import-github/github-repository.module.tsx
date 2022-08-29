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
import {
  debounceTime,
  endWith,
  distinctUntilChanged,
  map,
  Observable,
  startWith,
  switchMap,
  withLatestFrom,
  filter,
  of,
  mergeMap,
} from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import {
  GithubSearchRepositoriesQuery,
  githubSearchRepositoriesQuery,
  verifyGithubRepositoryPermissionQuery,
  VerifyGithubRepositoryPermissionQuery,
} from '@perfsee/schema'

export type Repository = GithubSearchRepositoriesQuery['githubSearchRepositories']['edges'][number]['node']
export type RepositoryVerification = VerifyGithubRepositoryPermissionQuery['verifyGithubRepositoryPermission']

interface State {
  repositories: Repository[]
  repositoriesTotalCount: number
  installationId: number
  loading: boolean
  query: string
  repositoryVerification: RepositoryVerification | null
  repositoryVerifying: boolean
}

@Module('GithubRepositoryModel')
export class GithubRepositoryModel extends EffectModule<State> {
  defaultState = {
    loading: true,
    installationId: 0,
    repositoriesTotalCount: 0,
    repositories: [],
    query: '',
    repositoryVerification: null,
    repositoryVerifying: false,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  verifyRepository(payload$: Observable<{ owner: string; repo: string }>) {
    return payload$.pipe(
      switchMap(({ owner, repo }) => {
        return this.client
          .query({
            query: verifyGithubRepositoryPermissionQuery,
            variables: {
              owner,
              repo,
            },
          })
          .pipe(
            map((data) => {
              return this.getActions().setVerification(data.verifyGithubRepositoryPermission)
            }),
            startWith(this.getActions().setVerifying(true)),
            endWith(this.getActions().setVerifying(false)),
            createErrorCatcher('Failed to fetch repositories'),
          )
      }),
    )
  }

  @Effect()
  search(payload$: Observable<{ installationId: number; query: string }>) {
    return payload$.pipe(
      debounceTime(300),
      mergeMap((data) => {
        return of(
          this.getActions().setQuery({ query: data.query, installationId: data.installationId }),
          this.getActions().loadMore(),
        )
      }),
    )
  }

  @Effect()
  loadMore(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      filter(([_, state]) => {
        return !(state.repositories.length > 0 && state.repositories.length === state.repositoriesTotalCount)
      }),
      distinctUntilChanged(([_, stateX], [__, stateY]) => {
        return (
          stateY.repositories.length !== 0 &&
          stateX.installationId === stateY.installationId &&
          stateX.repositories.length === stateY.repositories.length &&
          stateX.query === stateY.query
        )
      }),
      switchMap(([_, state]) =>
        this.client
          .query({
            query: githubSearchRepositoriesQuery,
            variables: {
              installationId: state.installationId,
              query: state.query,
              pagination: { first: 30, skip: state.repositories.length },
            },
          })
          .pipe(
            map((data) => {
              return this.getActions().append({
                repositories: data.githubSearchRepositories.edges.map((edge) => edge.node),
                totalCount: data.githubSearchRepositories.pageInfo.totalCount,
              })
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
            createErrorCatcher('Failed to fetch repositories'),
          ),
      ),
    )
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setVerifying(state: Draft<State>, verifying: boolean) {
    state.repositoryVerifying = verifying
  }

  @ImmerReducer()
  setQuery(state: Draft<State>, { query, installationId }: { query: string; installationId: number }) {
    state.query = query
    state.installationId = installationId
    state.loading = true
    state.repositories = []
    state.repositoriesTotalCount = 0
  }

  @ImmerReducer()
  append(state: Draft<State>, { repositories, totalCount }: { repositories: Repository[]; totalCount: number }) {
    state.repositories.push(...repositories)
    state.repositoriesTotalCount = totalCount
  }

  @ImmerReducer()
  setVerification(state: Draft<State>, verification: RepositoryVerification | null) {
    state.repositoryVerification = verification
  }
}
