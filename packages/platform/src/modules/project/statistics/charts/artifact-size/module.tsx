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
import { switchMap, map, withLatestFrom, startWith } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { ProjectModule } from '@perfsee/platform/modules/shared'
import { EntrypointHistoryQuery, entrypointHistoryQuery } from '@perfsee/schema'

export type Entrypoint = EntrypointHistoryQuery['project']['entrypoints']['edges'][0]['node']
interface State {
  entrypoints: Entrypoint[] | undefined
}

@Module('EntrypointsChartModule')
export class EntrypointsChartModule extends EffectModule<State> {
  defaultState = {
    entrypoints: undefined,
  }

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @Effect()
  getAggregatedEntrypoints(
    payload$: Observable<{
      branch?: string
      artifactName?: string
      entrypoint?: string
      from?: string
      to?: string
    }>,
  ) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([{ branch, artifactName, entrypoint, from, to }, { project }]) =>
        this.client
          .query({
            query: entrypointHistoryQuery,
            variables: {
              projectId: project!.id,
              branch,
              artifactName,
              name: entrypoint,
              from,
              to,
              pagination: {
                first: 1000,
              },
            },
          })
          .pipe(
            createErrorCatcher('Failed to get entrypoint statistics'),
            map((data) => this.getActions().setEntrypoints(data.project.entrypoints.edges.map((e) => e.node))),
            startWith(this.getActions().setEntrypoints(undefined)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setEntrypoints(state: Draft<State>, variable: Entrypoint[] | undefined) {
    state.entrypoints = variable
  }
}
