import { Module, EffectModule, Effect, ImmerReducer, Reducer } from '@sigi/core'
import { Draft } from 'immer'
import { Observable } from 'rxjs'
import { switchMap, map, startWith, endWith, exhaustMap } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  UsagePackFragment,
  createUsagePackMutation,
  updateUsagePackMutation,
  allUsagePacksQuery,
  CreateUsagePackInput,
  UpdateUsagePackInput,
  setDefaultUsagePackMutation,
} from '@perfsee/schema'

export type UsagePack = UsagePackFragment

interface State {
  loading: boolean
  saving: boolean
  packs: UsagePack[]
}

@Module('UsagePack')
export class UsagePackModule extends EffectModule<State> {
  readonly defaultState: State = {
    loading: true,
    saving: false,
    packs: [],
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  fetchUsagePacks(payload$: Observable<void>) {
    return payload$.pipe(
      switchMap(() =>
        this.client
          .query({
            query: allUsagePacksQuery,
          })
          .pipe(
            map(({ allUsagePacks }) => this.getActions().setPacks(allUsagePacks)),
            createErrorCatcher('Failed to fetch usage packs'),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  create(payload$: Observable<CreateUsagePackInput>) {
    return payload$.pipe(
      exhaustMap((input) =>
        this.client
          .mutate({
            mutation: createUsagePackMutation,
            variables: { input },
          })
          .pipe(
            map((data) => this.getActions().addPack(data.createUsagePack)),
            createErrorCatcher('Failed to create usage pack'),
            startWith(this.getActions().setSaving(true)),
            endWith(this.getActions().setSaving(false)),
          ),
      ),
    )
  }

  @Effect()
  update(payload$: Observable<UpdateUsagePackInput>) {
    return payload$.pipe(
      exhaustMap((input) =>
        this.client
          .mutate({
            mutation: updateUsagePackMutation,
            variables: { input },
          })
          .pipe(
            map((data) => this.getActions().updatePack(data.updateUsagePack)),
            createErrorCatcher('Failed to create usage pack'),
            startWith(this.getActions().setSaving(true)),
            endWith(this.getActions().setSaving(false)),
          ),
      ),
    )
  }

  @Effect()
  setDefaultPack(payload$: Observable<number>) {
    return payload$.pipe(
      exhaustMap((id) =>
        this.client
          .mutate({
            mutation: setDefaultUsagePackMutation,
            variables: { id },
          })
          .pipe(map(() => this.getActions().updateDefaultPack(id))),
      ),
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
  updateDefaultPack(state: Draft<State>, id: number) {
    state.packs.forEach((pack) => {
      pack.isDefault = pack.id === id
    })
  }

  @ImmerReducer()
  addPack(state: Draft<State>, pack: UsagePack) {
    state.packs.push(pack)
  }

  @ImmerReducer()
  updatePack(state: Draft<State>, pack: UsagePack) {
    const index = state.packs.findIndex((p) => p.name === pack.name)
    state.packs[index] = pack
  }

  @Reducer()
  setPacks(state: State, packs: UsagePack[]): State {
    return {
      ...state,
      packs,
    }
  }
}
