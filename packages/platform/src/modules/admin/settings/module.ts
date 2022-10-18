import { Module, EffectModule, Effect, ImmerReducer } from '@sigi/core'
import { Draft } from 'immer'
import { Observable, of, timer, merge } from 'rxjs'
import { map, startWith, endWith, exhaustMap, mergeMap } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { UpdateApplicationSettingsInput, updateApplicationSettingsMutation } from '@perfsee/schema'

import { GlobalModule } from '../../shared'

interface State {
  saving: boolean
  saved: boolean
}

@Module('SettingsAdmin')
export class SettingsAdminModule extends EffectModule<State> {
  readonly defaultState: State = {
    saving: false,
    saved: false,
  }

  constructor(private readonly client: GraphQLClient, private readonly globalModule: GlobalModule) {
    super()
  }

  @Effect()
  save(payload$: Observable<UpdateApplicationSettingsInput>) {
    return payload$.pipe(
      exhaustMap((patches) =>
        this.client
          .mutate({
            mutation: updateApplicationSettingsMutation,
            variables: {
              patches,
            },
          })
          .pipe(
            mergeMap((data) =>
              merge(
                of(
                  this.getActions().setSaved(true),
                  this.getActions().setSaving(false),
                  this.globalModule.getActions().setSettings(data.updateApplicationSettings),
                ),
                timer(3000).pipe(map(() => this.getActions().setSaved(false))),
              ),
            ),
            startWith(this.getActions().setSaving(true)),
            endWith(this.getActions().setSaving(false)),
            createErrorCatcher('Failed to save application settings'),
          ),
      ),
    )
  }

  @ImmerReducer()
  setSaved(state: Draft<State>, saved: boolean) {
    state.saved = saved
  }

  @ImmerReducer()
  setSaving(state: Draft<State>, saving: boolean) {
    state.saving = saving
  }
}
