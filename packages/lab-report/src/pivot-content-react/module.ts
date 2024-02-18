import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft, freeze } from 'immer'
import { Observable } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'

import {
  prepareProfilingDataFrontendFromExport,
  ReactDevtoolProfilingDataExport,
  ReactDevtoolProfilingDataFrontend,
} from '@perfsee/flamechart'
import { createErrorCatcher, RxFetch } from '@perfsee/shared'

interface State {
  selectedFiberID: number | null
  selectedFiberName: string | null
  selectedCommitIndex: number
  reactProfile: ReactDevtoolProfilingDataFrontend | null
  rootID: number
}

@Module('ReactFlameGraphModule')
export class ReactFlameGraphModule extends EffectModule<State> {
  readonly defaultState: State = {
    selectedFiberID: null,
    selectedFiberName: null,
    selectedCommitIndex: 0,
    reactProfile: null,
    rootID: 0,
  }

  constructor(private readonly fetch: RxFetch) {
    super()
  }

  @Effect()
  fetchReactProfileData(payload$: Observable<string>) {
    return payload$.pipe(
      mergeMap((key) =>
        this.fetch.get<ReactDevtoolProfilingDataExport>(key).pipe(
          createErrorCatcher('Failed to download react profile'),
          map((profile) => this.getActions().setReactProfile(prepareProfilingDataFrontendFromExport(profile))),
        ),
      ),
    )
  }

  @ImmerReducer()
  setReactProfile(state: Draft<State>, payload: ReactDevtoolProfilingDataFrontend) {
    state.reactProfile = freeze(payload)
    state.rootID = payload.dataForRoots.values().next().value?.rootID
  }

  @ImmerReducer()
  selectFiber(state: Draft<State>, { id, name }: { id: number | null; name: string | null }) {
    state.selectedFiberID = id
    state.selectedFiberName = name
  }

  @ImmerReducer()
  selectCommitIndex(state: Draft<State>, commitIndex: number) {
    state.selectedCommitIndex = commitIndex
  }

  @ImmerReducer()
  setRootID(state: Draft<State>, payload: number) {
    state.rootID = payload
  }
}
