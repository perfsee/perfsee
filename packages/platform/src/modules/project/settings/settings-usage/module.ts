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
import { Draft, freeze } from 'immer'
import { Observable } from 'rxjs'
import { withLatestFrom, switchMap, map } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { projectTimeUsagesQuery, ProjectTimeUsagesQuery, TimeUsageInput } from '@perfsee/schema'

import { ProjectModule } from '../../../shared'

export type TimeUsage = ProjectTimeUsagesQuery['project']['timeUsage']['detail']

interface State {
  total: number
  data: TimeUsage
}

@Module('SettingsUsageModule')
export class SettingsUsageModule extends EffectModule<State> {
  readonly defaultState: State = {
    total: 0,
    data: [],
  }

  constructor(private readonly client: GraphQLClient, private readonly project: ProjectModule) {
    super()
  }

  @Effect()
  fetchUsages(payload$: Observable<TimeUsageInput>) {
    return payload$.pipe(
      withLatestFrom(this.project.state$),
      switchMap(([input, { project }]) =>
        this.client
          .query({
            query: projectTimeUsagesQuery,
            variables: {
              projectId: project!.id,
              input,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch project time usage.'),
            map((data) => this.getActions().setUsages(data.project.timeUsage)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setUsages(state: Draft<State>, usage: ProjectTimeUsagesQuery['project']['timeUsage']) {
    state.total = usage.total
    state.data = freeze(usage.detail)
  }
}
