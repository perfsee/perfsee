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
import { map, switchMap, startWith, endWith } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { groupArtifactsQuery, GroupArtifactsQuery, GroupArtifactsQueryVariables } from '@perfsee/schema'

export type BundleHistory = GroupArtifactsQuery['group']['projects'][0]['artifactHistory'][0]

interface State {
  loading: boolean
  bundleHistoryMap: Map<string /**projectId */, BundleHistory[]>
}

@Module('GroupChartModule')
export class GroupChartModule extends EffectModule<State> {
  defaultState = {
    loading: true,
    bundleHistoryMap: new Map() as Map<string /**projectId */, BundleHistory[]>,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  getBundleHistory(payload$: Observable<GroupArtifactsQueryVariables>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .query({
            query: groupArtifactsQuery,
            variables: payload,
          })
          .pipe(
            createErrorCatcher('Failed to fetch bundle history.'),
            map(({ group: { projects } }) => this.getActions().setBundleHistory(projects)),
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
  setBundleHistory(state: Draft<State>, payload: GroupArtifactsQuery['group']['projects']) {
    const map = new Map()

    payload.forEach((project) => {
      map.set(
        project.id,
        project.artifactHistory.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)),
      )
    })

    state.bundleHistoryMap = map
  }
}
