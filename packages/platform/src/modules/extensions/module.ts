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

import { Module, EffectModule, Effect, ImmerReducer, DefineAction } from '@sigi/core'
import { Draft } from 'immer'
import { forkJoin, Observable } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

import { GraphQLClient } from '@perfsee/platform/common'
import { ExtensionScriptsQuery, extensionScriptsQuery } from '@perfsee/schema'

export type ExtensionScript = ExtensionScriptsQuery['extensionScripts'][number]

interface RunnerScriptState {
  extensions: ExtensionScript[]
}

export enum ExtensionType {
  BundleAudit = 'extension.bundleAudit',
  LabAudit = 'extension.labAudit',
}

@Module('extension-script')
export class ExtensionModule extends EffectModule<RunnerScriptState> {
  defaultState = {
    extensions: [],
  }

  @DefineAction() dispose$!: Observable<void>

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setScripts(state: Draft<RunnerScriptState>, payload: { extensions: ExtensionScript[] }) {
    state.extensions = payload.extensions
  }

  @Effect()
  fetchByType(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((jobType) =>
        forkJoin({
          scripts: this.client.query({
            query: extensionScriptsQuery,
            variables: { jobType },
          }),
        }).pipe(
          map((data) =>
            this.getActions().setScripts({
              extensions: data.scripts.extensionScripts,
            }),
          ),
        ),
      ),
    )
  }
}
