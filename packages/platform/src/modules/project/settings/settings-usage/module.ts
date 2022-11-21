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
import { switchMap, map } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { ProjectTimeUsagesQuery, ProjectUsageQuery, projectUsageQuery } from '@perfsee/schema'

import { ProjectModule } from '../../../shared'

export type TimeUsage = ProjectTimeUsagesQuery['project']['timeUsage']['detail']

interface State {
  usage: ProjectUsageQuery['project']['usage']
  usagePack: ProjectUsageQuery['project']['usagePack'] | null
}

@Module('SettingsUsageModule')
export class SettingsUsageModule extends EffectModule<State> {
  readonly defaultState: State = {
    usage: {
      jobCount: 0,
      jobDuration: 0,
      storage: 0,
    },
    usagePack: null,
  }

  constructor(private readonly client: GraphQLClient, private readonly project: ProjectModule) {
    super()
  }

  @Effect()
  fetchUsage(payload$: Observable<void>) {
    return payload$.pipe(
      this.project.withProject,
      switchMap(([project]) =>
        this.client
          .query({
            query: projectUsageQuery,
            variables: {
              projectId: project!.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch project usage.'),
            map((data) => this.getActions().setUsages(data.project)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setUsages(state: Draft<State>, payload: ProjectUsageQuery['project']) {
    state.usage = payload.usage
    state.usagePack = payload.usagePack
  }
}
