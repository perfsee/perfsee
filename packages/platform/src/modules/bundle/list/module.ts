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
import { Draft } from 'immer'
import { Observable } from 'rxjs'
import { switchMap, map, withLatestFrom, endWith, startWith, exhaustMap, filter } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { artifactsQuery, ArtifactsQuery, dispatchArtifactJobMutation, BundleJobStatus } from '@perfsee/schema'

import { ProjectModule } from '../../shared'

export type Artifact = ArtifactsQuery['project']['artifacts']['edges'][0]['node']

export interface State {
  artifacts: Artifact[]
  totalCount: number
  loading: boolean
}

export interface ArtifactQueryParams {
  pageNum: number
  pageSize: number
  branch?: string
  name?: string
}

@Module('BundleListModule')
export class BundleListModule extends EffectModule<State> {
  defaultState = {
    artifacts: [],
    totalCount: 0,
    loading: true,
  }

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @Effect()
  getArtifacts(payload$: Observable<ArtifactQueryParams>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ pageNum, pageSize, branch, name }, { project }]) =>
        this.client
          .query({
            query: artifactsQuery,
            variables: {
              projectId: project!.id,
              pagination: { first: pageSize, skip: pageSize * (pageNum - 1) },
              branch,
              name,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch artifacts'),
            map((data) => {
              return this.getActions().setArtifacts(data.project.artifacts)
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setArtifacts(state: Draft<State>, { pageInfo, edges }: ArtifactsQuery['project']['artifacts']) {
    state.artifacts = edges.map((edge) => edge.node)
    state.totalCount = pageInfo.totalCount
  }

  @Reducer()
  resetState(): State {
    return this.defaultState
  }

  @Effect()
  dispatchNewJob(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      exhaustMap(([id, { project }]) =>
        this.client
          .mutate({
            mutation: dispatchArtifactJobMutation,
            variables: { projectId: project!.id, id },
          })
          .pipe(
            createErrorCatcher('Failed to dispatch job.'),
            map(() => this.getActions().setStatus({ id, status: BundleJobStatus.Pending })),
          ),
      ),
    )
  }

  @ImmerReducer()
  setStatus(state: Draft<State>, { id, status }: { id: number; status: BundleJobStatus }) {
    const artifact = state.artifacts.find((artifact) => artifact.id === id)
    if (artifact) {
      artifact.status = status
    }
  }
}
