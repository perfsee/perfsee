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

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { artifactsQuery, ArtifactsQuery } from '@perfsee/schema'

export type Artifact = ArtifactsQuery['project']['artifacts']['edges'][0]['node']

interface State {
  loading: boolean
  totalNum: number
  artifacts: Artifact[]
}

@Module('ArtifactSelectModule')
export class ArtifactSelectModule extends EffectModule<State> {
  defaultState = {
    loading: true,
    totalNum: 0,
    artifacts: [],
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @Effect()
  fetchArtifacts(
    payload$: Observable<{ projectId: string; pageNumber: number; pageSize: number; artifactName?: string }>,
  ) {
    return payload$.pipe(
      switchMap(({ projectId, pageNumber, pageSize, artifactName }) =>
        this.client
          .query({
            query: artifactsQuery,
            variables: {
              projectId,
              name: artifactName,
              pagination: {
                first: pageSize,
                skip: pageNumber * pageSize,
              },
            },
          })
          .pipe(
            createErrorCatcher('Failed to get artifacts.'),
            map((data) => this.getActions().setArtifacts(data.project.artifacts)),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setArtifacts(state: Draft<State>, result: ArtifactsQuery['project']['artifacts']) {
    state.totalNum = result.pageInfo.totalCount
    state.artifacts = result.edges.map(({ node }) => node)
  }
}
