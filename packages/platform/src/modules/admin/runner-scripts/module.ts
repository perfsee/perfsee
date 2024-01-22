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
import qs from 'query-string'
import { forkJoin, Observable } from 'rxjs'
import { exhaustMap, map, switchMap, mergeMap, startWith, endWith } from 'rxjs/operators'

import { GraphQLClient, RxFetch, createErrorCatcher, serverLink } from '@perfsee/platform/common'
import {
  runnerScriptsQuery,
  activatedRunnerScriptsQuery,
  RunnerScriptsQuery,
  UpdateRunnerScriptInput,
  JobType,
  updateRunnerScriptMutation,
} from '@perfsee/schema'

export type RunnerScript = RunnerScriptsQuery['runnerScripts'][number]

interface RunnerScriptState {
  jobType: string
  scripts: RunnerScript[]
  activated: RunnerScript | null
  uploading: boolean
}

@Module('runner-script')
export class RunnerScriptModule extends EffectModule<RunnerScriptState> {
  defaultState = {
    jobType: JobType.BundleAnalyze,
    scripts: [],
    activated: null,
    uploading: false,
  }

  @DefineAction() dispose$!: Observable<void>

  constructor(private readonly fetch: RxFetch, private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setScripts(
    state: Draft<RunnerScriptState>,
    payload: { jobType: string; scripts: RunnerScript[]; activated: RunnerScript | null },
  ) {
    state.scripts = payload.scripts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    state.activated = payload.activated
    state.jobType = payload.jobType
  }

  @ImmerReducer()
  setUploading(state: Draft<RunnerScriptState>, payload: boolean) {
    state.uploading = payload
  }

  @Effect()
  fetchByJobType(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((jobType) =>
        forkJoin({
          scripts: this.client.query({
            query: runnerScriptsQuery,
            variables: { jobType },
          }),
          activated: this.client.query({
            query: activatedRunnerScriptsQuery,
            variables: { jobType },
          }),
        }).pipe(
          map((data) =>
            this.getActions().setScripts({
              scripts: data.scripts.runnerScripts,
              activated: data.activated.activatedRunnerScripts,
              jobType: jobType,
            }),
          ),
        ),
      ),
    )
  }

  @Effect()
  update(payload$: Observable<{ jobType: string; version: string; input: UpdateRunnerScriptInput }>) {
    return payload$.pipe(
      mergeMap(({ jobType, version, input }) =>
        this.client
          .mutate({
            mutation: updateRunnerScriptMutation,
            variables: {
              input,
              jobType,
              version,
            },
          })
          .pipe(
            map(() => this.getActions().fetchByJobType(jobType)),
            createErrorCatcher('Failed to update runner script'),
          ),
      ),
    )
  }

  @Effect()
  upload(
    payload$: Observable<{
      file: File
      jobType: string
      version: string
      checksum: string
      enable: boolean
      description?: string
    }>,
  ) {
    return payload$.pipe(
      exhaustMap((payload) =>
        this.fetch
          .post(
            qs.stringifyUrl({
              url: serverLink`/api/runners/scripts/${payload.jobType}/${payload.version}`,
              query: { enable: payload.enable, description: payload.description },
            }),
            {
              body: payload.file,
              headers: {
                'content-type': 'application/octet-stream',
                'x-checksum': payload.checksum,
              },
            },
          )
          .pipe(
            createErrorCatcher('Failed to upload runner script.'),
            startWith(this.getActions().setUploading(true)),
            endWith(this.getActions().setUploading(false)),
            map(() => this.getActions().fetchByJobType(payload.jobType)),
          ),
      ),
    )
  }
}
