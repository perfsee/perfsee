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
import { cloneDeep } from 'lodash'
import { EMPTY, Observable } from 'rxjs'
import {
  switchMap,
  map,
  startWith,
  endWith,
  withLatestFrom,
  exhaustMap,
  mergeMap,
  distinctUntilChanged,
  filter,
} from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { basicSettingsQuery, BasicSettingsQuery, updateBasicSettingsMutation } from '@perfsee/schema'

import { ProjectModule } from '../../../shared'

type ProjectChanging = {
  artifactBaselineBranch?: string
}
export type Settings = BasicSettingsQuery['project']['setting']
export type SettingKeys = keyof Settings
export type ProjectChangingKeys = keyof ProjectChanging

interface State {
  loading: boolean
  saving: boolean
  settings: Settings
  changing: Settings
  projectChanging: ProjectChanging
}

@Module('BasicSettingsModule')
export class BasicSettingsModule extends EffectModule<State> {
  readonly defaultState: State = {
    settings: null!,
    changing: null!,
    loading: true,
    saving: false,
    projectChanging: {},
  }

  constructor(private readonly client: GraphQLClient, private readonly project: ProjectModule) {
    super()
  }

  @Effect()
  getSettings(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.project.state$),
      distinctUntilChanged(([, { project: projectX }], [, { project: projectY }]) => {
        return projectX?.id === projectY?.id
      }),
      filter(([, { project }]) => !!project?.id),
      switchMap(([, state]) =>
        this.client
          .query({
            query: basicSettingsQuery,
            variables: {
              projectId: state.project!.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch project settings.'),
            map((data) => this.getActions().setSettings(data.project.setting)),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  saveSettings(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.state$, this.project.state$),
      exhaustMap(([, { changing, projectChanging }, { project }]) => {
        if (!changing) {
          return EMPTY
        }

        return this.client
          .mutate({
            mutation: updateBasicSettingsMutation,
            variables: {
              projectId: project!.id,
              settingsInput: changing,
              projectInput: projectChanging,
            },
          })
          .pipe(
            createErrorCatcher('Failed to save project settings.'),
            mergeMap(({ updateProjectSettings, updateProject }) => [
              this.getActions().clearProjectChange(),
              this.getActions().setSettings(updateProjectSettings),
              this.project.getActions().setProject(updateProject),
            ]),
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
  setSaving(state: Draft<State>, saving: boolean) {
    state.saving = saving
  }

  @ImmerReducer()
  setSettings(state: Draft<State>, settings: Settings) {
    state.settings = settings
    state.changing = cloneDeep(settings)
  }

  @ImmerReducer()
  updateSettingField(state: Draft<State>, { field, value }: { field: SettingKeys; value: any }) {
    // @ts-expect-error
    state.changing[field] = value
  }

  @ImmerReducer()
  clearProjectChange(state: Draft<State>) {
    state.projectChanging = {}
  }

  @ImmerReducer()
  updateProjectField(state: Draft<State>, { field, value }: { field: ProjectChangingKeys; value: any }) {
    state.projectChanging[field] = value
  }
}
