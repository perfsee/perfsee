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

import { Module, EffectModule, Effect, ImmerReducer, Reducer } from '@sigi/core'
import { Draft, freeze } from 'immer'
import { Observable } from 'rxjs'
import { switchMap, map, startWith, endWith } from 'rxjs/operators'

import { createErrorCatcher, RxFetch } from '@perfsee/platform/common'
import { SourceCoverageResult } from '@perfsee/shared'

interface State {
  data: SourceCoverageResult | null
  loading: boolean
}

@Module('SourceCoverageModule')
export class SourceCoverageModule extends EffectModule<State> {
  defaultState = {
    data: null,
    loading: false,
  }

  constructor(private readonly fetch: RxFetch) {
    super()
  }

  @Reducer()
  setData(state: Draft<State>, data: SourceCoverageResult): State {
    return {
      ...state,
      data: freeze(data),
    }
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, data: boolean) {
    state.loading = data
  }

  @Effect()
  fetchSourceCoverageResult(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((key) =>
        this.fetch.get<SourceCoverageResult>(key).pipe(
          createErrorCatcher('Failed to source coverage result.'),
          map((res) => this.getActions().setData(res)),
          startWith(this.getActions().setLoading(true)),
          endWith(this.getActions().setLoading(false)),
        ),
      ),
    )
  }
}
