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
import { switchMap, endWith, startWith, map, debounceTime } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  CreateProjectMutationVariables,
  CreateProjectMutation,
  createProjectMutation,
  VerifyProjectIdQuery,
  verifyProjectIdQuery,
} from '@perfsee/schema'

export type CreatedProject = CreateProjectMutation['createProject']
export type IdVerification = VerifyProjectIdQuery['verifyProjectId']

interface State {
  creating: boolean
  createdProject: CreatedProject | null
  idVerifying: boolean
  idVerification: IdVerification | null
}

@Module('ImportProjectModule')
export class CreateProjectModule extends EffectModule<State> {
  defaultState = {
    creating: false,
    createdProject: null,
    idVerifying: false,
    idVerification: null,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setCreating(state: Draft<State>, payload: boolean) {
    state.creating = payload
  }

  @ImmerReducer()
  setVerifying(state: Draft<State>, verifying: boolean) {
    state.idVerifying = verifying
  }

  @ImmerReducer()
  setCreatedProject(state: Draft<State>, payload: CreatedProject) {
    state.createdProject = payload
  }

  @ImmerReducer()
  setIdVerification(state: Draft<State>, payload: IdVerification) {
    state.idVerification = payload
  }

  @Effect()
  createProject(payload$: Observable<CreateProjectMutationVariables['input']>) {
    return payload$.pipe(
      switchMap((input) =>
        this.client
          .mutate({
            mutation: createProjectMutation,
            variables: { input },
          })
          .pipe(
            createErrorCatcher('Failed to create project'),
            map((data) => {
              return this.getActions().setCreatedProject(data.createProject)
            }),
            startWith(this.getActions().setCreating(true)),
            endWith(this.getActions().setCreating(false)),
          ),
      ),
    )
  }

  @Effect()
  verifyId(payload$: Observable<string>) {
    return payload$.pipe(
      debounceTime(300),
      switchMap((input) =>
        this.client
          .mutate({
            mutation: verifyProjectIdQuery,
            variables: { projectId: input },
          })
          .pipe(
            map((data) => {
              return this.getActions().setIdVerification(data.verifyProjectId)
            }),
            createErrorCatcher('Error verifying id'),
            startWith(this.getActions().setVerifying(true)),
            endWith(this.getActions().setVerifying(false)),
          ),
      ),
    )
  }
}
