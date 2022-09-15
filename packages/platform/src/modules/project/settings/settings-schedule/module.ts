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
import { EMPTY, Observable } from 'rxjs'
import { switchMap, map, startWith, endWith, withLatestFrom, exhaustMap } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  updateTimerMutation,
  timerSettingsQuery,
  TimerSettingsQuery,
  UpdateTimerInput,
  ScheduleType,
  ScheduleMonitorType,
} from '@perfsee/schema'

import { ProjectModule } from '../../../shared'

export type TimerSchema = NonNullable<TimerSettingsQuery['project']['timer']>

interface State {
  loading: boolean
  saving: boolean
  timer: TimerSchema
}

export const defaultTimer = {
  schedule: ScheduleType.Off,
  hour: null,
  timeOfDay: null,
  nextTriggerTime: null,
  monitorType: ScheduleMonitorType.All,
  pageIds: [],
  envIds: [],
  profileIds: [],
}

@Module('ScheduleModule')
export class ScheduleModule extends EffectModule<State> {
  readonly defaultState: State = {
    loading: true,
    saving: false,
    timer: defaultTimer,
  }

  constructor(private readonly client: GraphQLClient, private readonly project: ProjectModule) {
    super()
  }

  @Effect()
  getTimeSchedule(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.project.state$),
      switchMap(([, state]) =>
        this.client
          .query({
            query: timerSettingsQuery,
            variables: {
              projectId: state.project!.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch project schedule.'),
            map((data) => this.getActions().setTimer(data.project.timer)),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  saveTimer(payload$: Observable<UpdateTimerInput>) {
    return payload$.pipe(
      withLatestFrom(this.project.state$),
      exhaustMap(([input, { project }]) => {
        if (!input || !Object.keys(input).length) {
          return EMPTY
        }

        return this.client
          .mutate({
            mutation: updateTimerMutation,
            variables: {
              input: input,
              projectId: project!.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to save schedule settings.'),
            map((data) => this.getActions().setTimer(data.updateTimer)),
            startWith(this.getActions().setSaving(true)),
            endWith(this.getActions().setSaving(false)),
          )
      }),
    )
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setTimer(state: Draft<State>, payload: TimerSchema | null) {
    state.timer = payload ?? defaultTimer
  }

  @ImmerReducer()
  setSaving(state: Draft<State>, saving: boolean) {
    state.saving = saving
  }
}
